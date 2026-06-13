import fitz
import base64
import json
import os
from groq import Groq
from dotenv import load_dotenv

# Load the .env file from the backend folder where the API key is stored
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, 'backend', '.env'))

# Initialize Groq client
client = Groq()

PDF_DIR = os.path.join(BASE_DIR, "resource")
OUT_DIR = os.path.join(BASE_DIR, "roadmap_json")
os.makedirs(OUT_DIR, exist_ok=True)

PROMPT = """Analyze this roadmap diagram image. Output ONLY valid JSON, no markdown fences:

{
  "nodes": [
    {"id": "slug-from-label", "label": "exact text", "x": int, "y": int,
     "width": int, "height": int, "color": "#hex", "textColor": "#hex",
     "shape": "rect"|"rounded", "checked": bool, "group": "string or null"}
  ],
  "edges": [
    {"source": "id", "target": "id", "style": "solid"|"dotted"}
  ]
}

Rules:
- x,y = top-left corner, pixels, native image resolution.
- id = lowercase-hyphenated unique slug from label text.
- "group" = label of the enclosing box/container if the node sits inside one, else null.
- Include every node, even tiny ones inside grouped boxes.
- Include every visible connecting line as an edge.
- checked = true only if a checkmark/tick icon is visible on that node.
- Do not invent anything not visible in the image.
"""

def pdf_to_images(path, zoom=2.5):
    doc = fitz.open(path)
    mat = fitz.Matrix(zoom, zoom)
    imgs = [p.get_pixmap(matrix=mat).tobytes("png") for p in doc]
    doc.close()
    return imgs

def extract(img_bytes):
    b64 = base64.b64encode(img_bytes).decode()
    
    # Note: Groq's llama-3.3-70b-versatile is a text-only model and cannot process image base64 directly.
    # We MUST use one of Groq's vision models for image analysis.
    # Supported Groq vision models: llama-3.2-90b-vision-preview
    
    resp = client.chat.completions.create(
        model="llama-3.2-90b-vision-preview",
        temperature=0.1,
        max_tokens=8000,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text", 
                        "text": PROMPT
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{b64}",
                        },
                    }
                ]
            }
        ]
    )
    
    text = resp.choices[0].message.content.strip()
    
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
            
    return json.loads(text.strip())

def merge(pages):
    nodes, edges, seen, y_off = [], [], set(), 0
    for page in pages:
        pn = page.get("nodes", [])
        for n in pn:
            nid = n["id"]
            if nid in seen:
                nid = f"{nid}-{y_off}"
                n = {**n, "id": nid}
            seen.add(nid)
            n["y"] += y_off
            nodes.append(n)
        edges.extend(page.get("edges", []))
        if pn:
            y_off += max(n["y"] + n["height"] for n in pn) + 60
    return {"nodes": nodes, "edges": edges}

for fname in os.listdir(PDF_DIR):
    if not fname.lower().endswith(".pdf"):
        continue
    print(f"Processing {fname}...")
    try:
        pages = [extract(img) for img in pdf_to_images(os.path.join(PDF_DIR, fname))]
        graph = merge(pages)
        out = os.path.join(OUT_DIR, fname.rsplit(".", 1)[0] + ".json")
        json.dump(graph, open(out, "w"), indent=2)
        print(f"  -> {out} ({len(graph['nodes'])} nodes)")
    except Exception as e:
        print(f"Error processing {fname}: {str(e)}")
