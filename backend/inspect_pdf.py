import os
import sys

print("Python version:", sys.version)
print("Files in resource directory:")
try:
    resources = os.listdir("../resource")
    print(resources)
except Exception as e:
    print("Error listing resource:", e)

# Test importing common libraries
for lib in ["pypdf", "pdfplumber", "PyPDF2", "fitz", "openpyxl"]:
    try:
        __import__(lib)
        print(f"Library {lib} is INSTALLED")
    except ImportError:
        print(f"Library {lib} is NOT installed")
