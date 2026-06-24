import os
import re

directory = r"c:\Users\Animesh\Desktop\GrowthOS\frontend\src"

# We will map very dark text colors to brighter text colors for better visibility
color_map = {
    r"text-\[\#252525\]": "text-[#777]",
    r"text-\[\#2a2a2a\]": "text-[#888]",
    r"text-\[\#2e2e2e\]": "text-[#888]",
    r"text-\[\#333\]": "text-[#999]",
    r"text-\[\#3a3a3a\]": "text-[#999]",
    r"text-\[\#444\]": "text-[#aaa]",
    r"text-\[\#484848\]": "text-[#aaa]",
    r"text-\[\#555\]": "text-[#bbb]",
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    for pattern, replacement in color_map.items():
        content = re.sub(pattern, replacement, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

print("Color brightness update complete.")
