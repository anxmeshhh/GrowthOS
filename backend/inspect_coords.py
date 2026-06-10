import fitz

pdf_path = "../resource/django.pdf"
doc = fitz.open(pdf_path)
page = doc[0]

# get_text("blocks") returns a list of tuples: (x0, y0, x1, y1, "text", block_no, block_type)
blocks = page.get_text("blocks")
print(f"Total blocks: {len(blocks)}")
print("First 20 blocks:")
for b in blocks[:20]:
    x0, y0, x1, y1, text, block_no, block_type = b
    text_clean = text.replace('\n', ' ').strip()
    print(f"Block {block_no}: ({x0:.1f}, {y0:.1f}, {x1:.1f}, {y1:.1f}) -> {repr(text_clean)}")
