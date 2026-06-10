import fitz

pdf_path = "../resource/django.pdf"
doc = fitz.open(pdf_path)
page = doc[0]
drawings = page.get_drawings()
blocks = page.get_text("blocks")

print("Printing non-module/non-topic blocks in django.pdf:")
for b in blocks:
    x0, y0, x1, y1, text, block_no, block_type = b
    text_clean = text.replace('\n', ' ').strip()
    if not text_clean:
        continue
        
    best_d = None
    for d in drawings:
        if d['type'] in ('f', 'fs') and d.get('fill'):
            r = d['rect']
            if not (x1 < r.x0 or x0 > r.x1 or y1 < r.y0 or y0 > r.y1):
                best_d = d
                break
                
    is_module = False
    is_topic = False
    if best_d:
        fill = best_d['fill']
        rc, gc, bc = fill
        if rc > 0.9 and gc > 0.9 and bc < 0.2:
            is_module = True
        elif rc > 0.9 and gc > 0.8 and 0.5 < bc < 0.75:
            is_topic = True
            
    if not is_module and not is_topic:
        fill_str = f"fill={best_d['fill']}" if best_d else "no bg"
        print(f"Text: {repr(text_clean)} -> {fill_str} @ ({x0:.1f}, {y0:.1f})")
