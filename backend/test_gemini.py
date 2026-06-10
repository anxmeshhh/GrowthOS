import os

print("GEMINI_API_KEY in env:", "GEMINI_API_KEY" in os.environ)
print("GOOGLE_API_KEY in env:", "GOOGLE_API_KEY" in os.environ)
for k, v in os.environ.items():
    if "api" in k.lower() or "key" in k.lower() or "gemini" in k.lower() or "google" in k.lower():
        print(f"Env var found: {k} = {v[:4]}...{v[-4:] if len(v) > 8 else ''}")
