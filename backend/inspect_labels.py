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
    text = ""
    for page in doc:
        text += page.get_text()
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    print(f"Path ID: {path_id} ({filename}) -> Total extracted lines: {len(lines)}")
    print(f"First 5 lines: {lines[:5]}")
