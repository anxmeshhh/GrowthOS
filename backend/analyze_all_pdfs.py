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
        print(f"File {path} does not exist!")
        continue
    doc = fitz.open(path)
    page = doc[0]
    print(f"Path ID: {path_id} ({filename}) -> page size: {page.rect.width:.1f}x{page.rect.height:.1f}, drawings: {len(page.get_drawings())}, text blocks: {len(page.get_text('blocks'))}")
