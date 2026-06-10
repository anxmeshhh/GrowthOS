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
    blocks = page.get_text("blocks")
    
    modules_cnt = 0
    topics_cnt = 0
    other_cnt = 0
    no_bg_cnt = 0
    
    for b in blocks:
        x0, y0, x1, y1, text, block_no, block_type = b
        text_clean = text.replace('\n', ' ').strip()
        if not text_clean:
            continue
            
        # Find overlapping filled drawing
        best_d = None
        for d in drawings:
            if d['type'] in ('f', 'fs') and d.get('fill'):
                r = d['rect']
                # Check overlap
                if not (x1 < r.x0 or x0 > r.x1 or y1 < r.y0 or y0 > r.y1):
                    best_d = d
                    break
        
        if best_d:
            fill = best_d['fill']
            r, g, b_val = fill
            # Classify by fill color
            # Yellow: r > 0.9, g > 0.9, b < 0.2
            if r > 0.9 and g > 0.9 and b_val < 0.2:
                modules_cnt += 1
            # Peach: r > 0.9, g > 0.8, b > 0.5, b < 0.75
            elif r > 0.9 and g > 0.8 and 0.5 < b_val < 0.75:
                topics_cnt += 1
            else:
                other_cnt += 1
        else:
            no_bg_cnt += 1
            
    print(f"{path_id}: modules={modules_cnt}, topics={topics_cnt}, other={other_cnt}, no_bg={no_bg_cnt}")
