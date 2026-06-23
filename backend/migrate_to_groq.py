import re

with open('core/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the OpenAI top-level import if it exists
content = content.replace('from openai import OpenAI\n', '')

# Replace all inline NVIDIA client instantiations with Groq
# Pattern: from openai import OpenAI\n + optional spaces + import os\n + optional spaces + client = OpenAI(base_url=..., api_key=...)
pattern = r'from openai import OpenAI\s*\n(\s+)import os\s*\n\s+client = OpenAI\(base_url="https://integrate\.api\.nvidia\.com/v1",\s*api_key=os\.environ\.get\("NVIDIA_API_KEY"\) or getattr\(settings,\s*"NVIDIA_API_KEY",\s*""\)\)'
replacement = r'from groq import Groq\n\1import os\n\1client = Groq(api_key=os.environ.get("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", ""))'
content = re.sub(pattern, replacement, content)

# Replace remaining bare OpenAI client lines (if any missed above)
pattern2 = r'client = OpenAI\(base_url="https://integrate\.api\.nvidia\.com/v1",\s*api_key=os\.environ\.get\("NVIDIA_API_KEY"\) or getattr\(settings,\s*"NVIDIA_API_KEY",\s*""\)\)'
replacement2 = 'client = Groq(api_key=os.environ.get("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", ""))'
content = re.sub(pattern2, replacement2, content)

# Replace the top-level import (if missed)
content = content.replace('from openai import OpenAI', '')

# Replace model names
content = content.replace('model="meta/llama-3.1-70b-instruct"', 'model="llama-3.3-70b-versatile"')
content = content.replace('model="nvidia/llama-3.1-nemotron-70b-instruct"', 'model="llama-3.3-70b-versatile"')

# Replace openai_messages variable name in chat view (purely cosmetic)
content = content.replace('openai_messages', 'chat_messages')

with open('core/views.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done! Replaced all NVIDIA/OpenAI references with Groq.")

# Verify
remaining = [i+1 for i, line in enumerate(content.splitlines()) if 'nvidia' in line.lower() or 'openai' in line.lower()]
if remaining:
    print(f"Remaining nvidia/openai references on lines: {remaining}")
else:
    print("Clean! No remaining nvidia/openai references.")
