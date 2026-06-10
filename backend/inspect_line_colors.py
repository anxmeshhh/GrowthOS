import fitz
import os

pdf_names = {
    "backend": "backend.pdf",
    "frontend": "frontend.pdf",
    "api_design": "api-design.pdf",
    "ai": "ai-engineer.pdf",
    "dsa": "datastructures-and-algorithms.pdf",
    "django": "django.pdf",
    "sql": "sql.pdf",
    "system_design": "system-design.pdf",
}

for path_id, filename in pdf_names.items():
    path = os.path.join("../resource", filename)
    if not os.path.exists(path):
        continue
    doc = fitz.open(path)
    page = doc[0]
    drawings = page.get_drawings()
    
    colors = set()
    for d in drawings:
        if d.get('color'):
            # round to 2 decimals
            colors.add(tuple(round(c, 2) for c in d['color']))
    print(f"{path_id} unique colors: {colors}")
