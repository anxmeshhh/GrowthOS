import fitz

pdf_path = "../resource/django.pdf"
doc = fitz.open(pdf_path)
page = doc[0]

print("Page rect:", page.rect)
drawings = page.get_drawings()
print(f"Total drawings: {len(drawings)}")

# Print info about first 10 drawings
print("\nFirst 10 drawings:")
for idx, d in enumerate(drawings[:10]):
    print(f"Drawing {idx}: type={d['type']}, rect={d['rect']}, fill={d.get('fill')}, color={d.get('color')}, items={len(d.get('items', []))}")

# Check if we can associate drawings with text
blocks = page.get_text("blocks")
print(f"\nTotal text blocks: {len(blocks)}")
print("First 10 text blocks with overlapping rects:")
for idx, b in enumerate(blocks[:10]):
    x0, y0, x1, y1, text, block_no, block_type = b
    text_clean = text.replace('\n', ' ').strip()
    
    # Find overlapping drawings
    overlapping = []
    for d_idx, d in enumerate(drawings):
        r = d['rect']
        # If rect overlaps with text block
        if not (x1 < r.x0 or x0 > r.x1 or y1 < r.y0 or y0 > r.y1):
            overlapping.append((d_idx, d['type'], d.get('fill')))
            
    print(f"Block {block_no} at ({x0:.1f}, {y0:.1f}, {x1:.1f}, {y1:.1f}) -> {repr(text_clean)}")
    print(f"  Overlapping drawings: {overlapping}")
