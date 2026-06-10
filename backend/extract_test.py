import fitz
import os

pdf_path = "../resource/django.pdf"
print("Reading:", pdf_path)
doc = fitz.open(pdf_path)
print("Page count:", len(doc))

for i in range(min(5, len(doc))):
    page = doc[i]
    print(f"--- Page {i+1} ---")
    text = page.get_text()
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    print(f"Total lines: {len(lines)}")
    print("First 30 lines:")
    for line in lines[:30]:
        print("  ", repr(line))
