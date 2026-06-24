import os
import re

directory = r"c:\Users\Animesh\Desktop\GrowthOS\frontend\src"

# Mapping for text sizes: bump by +1px or +2px
# We will find text-\[(\d+)px\] and add 1 to the integer
def bump_size(match):
    size = int(match.group(1))
    # Bump smaller fonts by 1, larger by 2? Let's just bump all by 1px to be safe.
    new_size = size + 1
    return f"text-[{new_size}px]"

# We can also map standard tailwind text sizes
size_map = {
    "text-xs": "text-sm",
    "text-sm": "text-base",
    "text-base": "text-lg",
}

# Mapping for hex colors to make them brighter
color_map = {
    r"\[#555555\]": "[#777777]",
    r"\[#555\]": "[#777]",
    r"\[#666666\]": "[#888888]",
    r"\[#666\]": "[#888]",
    r"\[#777777\]": "[#999999]",
    r"\[#777\]": "[#999]",
    r"\[#888888\]": "[#aaaaaa]",
    r"\[#888\]": "[#aaa]",
    r"\[#999999\]": "[#bbbbbb]",
    r"\[#999\]": "[#bbb]",
    r"\[#aaaaaa\]": "[#cccccc]",
    r"\[#aaa\]": "[#ccc]",
    r"\[#bbbbbb\]": "[#dddddd]",
    r"\[#bbb\]": "[#ddd]",
    r"\[#cccccc\]": "[#eeeeee]",
    r"\[#ccc\]": "[#eee]",
    r"\[#dddddd\]": "[#ffffff]",
    r"\[#ddd\]": "[#fff]",
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # 1. Bump arbitrary sizes
    content = re.sub(r"text-\[(\d+)px\]", bump_size, content)
    
    # 2. Bump standard tailwind sizes
    for old_size, new_size in size_map.items():
        # Only match whole words for classes
        content = re.sub(r"\b" + old_size + r"\b", new_size, content)
        
    # 3. Brighten colors
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

print("Style bump complete.")
