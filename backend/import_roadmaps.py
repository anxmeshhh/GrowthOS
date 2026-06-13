#!/usr/bin/env python3
"""
extract_roadmap.py
------------------
Converts a roadmap PDF into a strict JSON graph map using Gemini Vision.
Outputs: roadmap_graph.json

Usage:
    pip install google-generativeai pymupdf pillow python-dotenv
    python extract_roadmap.py --pdf backend.pdf --output roadmap_graph.json
"""

import argparse
import base64
import json
import sys
import os
from pathlib import Path

import google.generativeai as genai
import fitz  # PyMuPDF
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

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


def pdf_page_to_image(pdf_path: str, page_index: int = 0, dpi: int = 150):
    """Render a PDF page to a PIL Image at given DPI."""
    doc = fitz.open(pdf_path)
    page = doc[page_index]
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img_bytes = pix.tobytes("png")
    
    # Get dimensions
    img = Image.open(io.BytesIO(img_bytes))
    doc.close()
    return img


def extract_graph(pdf_path: str, page_index: int = 0) -> dict:
    """Send PDF page image to Gemini and get back graph JSON."""
    print(f"[1/3] Rendering PDF page {page_index} …")
    img = pdf_page_to_image(pdf_path, page_index)
    img_w, img_h = img.size
    print(f"      Image size: {img_w}x{img_h}px")

    print("[2/3] Calling Gemini 2.5 Flash vision …")
    model = genai.GenerativeModel('gemini-2.5-flash')

    # Provide the prompt and the PIL image directly
    response = model.generate_content([
        SYSTEM_PROMPT + f"\nExtract every node and edge from this roadmap image ({img_w}x{img_h}px). Return ONLY the JSON.", 
        img
    ])

    raw = response.text.strip()

    # Strip accidental markdown fences
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    if raw.startswith("json"):
        raw = raw[4:].strip()

    print("[3/3] Parsing JSON response …")
    graph = json.loads(raw)

    # Attach image dimensions for reference in React
    graph["meta"] = {"imageWidth": img_w, "imageHeight": img_h, "sourceFile": pdf_path}
    return graph


def main():
    parser = argparse.ArgumentParser(description="Extract roadmap graph from PDF via Gemini vision.")
    parser.add_argument("--pdf", required=True, help="Path to the PDF file")
    parser.add_argument("--page", type=int, default=0, help="Page index (0-based, default: 0)")
    parser.add_argument("--output", default="roadmap_graph.json", help="Output JSON file path")
    args = parser.parse_args()

    if not Path(args.pdf).exists():
        print(f"ERROR: File not found: {args.pdf}", file=sys.stderr)
        sys.exit(1)

    try:
        graph = extract_graph(args.pdf, args.page)
    except Exception as e:
        print(f"Failed to extract graph: {e}", file=sys.stderr)
        sys.exit(1)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(graph, f, indent=2, ensure_ascii=False)

    print(f"\n✅  Saved {len(graph['nodes'])} nodes and {len(graph['edges'])} edges → {args.output}")


if __name__ == "__main__":
    main()