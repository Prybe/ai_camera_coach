# html_to_pdf.py
import sys
from weasyprint import HTML
from base64 import b64encode

html_content = sys.stdin.read()
pdf = HTML(string=html_content).write_pdf()

# Encode PDF to base64 and print to stdout
sys.stdout.buffer.write(b64encode(pdf))