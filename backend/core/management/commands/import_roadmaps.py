from django.core.management.base import BaseCommand, CommandError
import base64
import json
import sys
import os
from pathlib import Path
import io

try:
    import google.generativeai as genai
    import fitz  # PyMuPDF
    from PIL import Image
    from dotenv import load_dotenv
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False

SYSTEM_PROMPT = """You are a precise graph-extraction engine. 
Given an image of a roadmap diagram, extract EVERY node and EVERY edge.

Return ONLY a valid JSON object with this exact schema — no markdown, no explanation:

{
  "nodes": [
    {
      "id": "unique_snake_case_id",
      "label": "Exact text label",
      "x": 120,
      "y": 340,
      "width": 180,
      "height": 40,
      "bgColor": "#hexcolor",
      "textColor": "#hexcolor",
      "shape": "rect | rounded | pill | diamond",
      "category": "optional grouping label if visually apparent"
    }
  ],
  "edges": [
    {
      "id": "e_source_target",
      "source": "source_node_id",
      "target": "target_node_id",
      "type": "default | step | smoothstep",
      "label": "optional edge label"
    }
  ]
}

Rules:
- x, y are the TOP-LEFT pixel coordinates of each node in the image.
- width and height are the bounding box dimensions in pixels.
- bgColor must be the actual hex color of the node background.
- Extract EVERY visible node — do not skip any.
- For edges, infer direction from arrows or tree hierarchy (parent → child).
- id must be unique snake_case derived from the label.
- Return ONLY the JSON. No prose, no code fences.
"""

class Command(BaseCommand):
    help = 'Extract roadmap graph from PDF via Gemini vision'

    def add_arguments(self, parser):
        parser.add_argument('--pdf', required=True, help='Path to the PDF file')
        parser.add_argument('--page', type=int, default=0, help='Page index (0-based, default: 0)')
        parser.add_argument('--output', default='roadmap_graph.json', help='Output JSON file path')

    def pdf_page_to_image(self, pdf_path: str, page_index: int = 0, dpi: int = 150):
        doc = fitz.open(pdf_path)
        page = doc[page_index]
        mat = fitz.Matrix(dpi / 72, dpi / 72)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_bytes = pix.tobytes("png")
        
        img = Image.open(io.BytesIO(img_bytes))
        doc.close()
        return img

    def extract_graph(self, pdf_path: str, page_index: int = 0) -> dict:
        self.stdout.write("[1/3] Rendering PDF page ...")
        img = self.pdf_page_to_image(pdf_path, page_index)
        img_w, img_h = img.size
        self.stdout.write(f"      Image size: {img_w}x{img_h}px")

        self.stdout.write("[2/3] Calling Gemini 2.5 Flash vision ...")
        model = genai.GenerativeModel('gemini-2.5-flash')

        response = model.generate_content([
            SYSTEM_PROMPT + f"\nExtract every node and edge from this roadmap image ({img_w}x{img_h}px). Return ONLY the JSON.", 
            img
        ])

        raw = response.text.strip()
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        if raw.startswith("json"):
            raw = raw[4:].strip()

        self.stdout.write("[3/3] Parsing JSON response ...")
        graph = json.loads(raw)
        graph["meta"] = {"imageWidth": img_w, "imageHeight": img_h, "sourceFile": pdf_path}
        return graph

    def handle(self, *args, **options):
        if not HAS_DEPS:
            raise CommandError("Dependencies missing. Run: pip install google-generativeai pymupdf pillow python-dotenv")

        load_dotenv()
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise CommandError("GEMINI_API_KEY not found in environment")
            
        genai.configure(api_key=api_key)

        pdf_path = options['pdf']
        output_path = options['output']
        page_index = options['page']

        if not Path(pdf_path).exists():
            raise CommandError(f"File not found: {pdf_path}")

        try:
            graph = self.extract_graph(pdf_path, page_index)
        except Exception as e:
            raise CommandError(f"Failed to extract graph: {e}")

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(graph, f, indent=2, ensure_ascii=False)

        self.stdout.write(self.style.SUCCESS(
            f"✅ Saved {len(graph['nodes'])} nodes and {len(graph['edges'])} edges → {output_path}"
        ))
