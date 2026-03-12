
import json
from pypdf import PdfReader
import docx
import html

def extract_pdf_questions(filename):
    reader = PdfReader(filename)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n"
    return full_text

def extract_docx_explanation(filename):
    doc = docx.Document(filename)
    text = ""
    for para in doc.paragraphs:
        if para.text.strip():
            text += para.text + "\n"
    return text

# The user mentioned 75 questions in total.
# Let's try to extract them from the PDF.
pdf_text = extract_pdf_questions('exploracao_vocacional_tres_versoes.pdf')
# Replace common PT characters for easier parsing if needed, but UTF-8 should work in the file.
with open('extracted_raw_pdf.txt', 'w', encoding='utf-8') as f:
    f.write(pdf_text)

docx_text = extract_docx_explanation('EXPLORAÇÃO VOCACIONAL explicação.docx')
with open('extracted_raw_docx.txt', 'w', encoding='utf-8') as f:
    f.write(docx_text)

print("Extraction complete. Files: extracted_raw_pdf.txt and extracted_raw_docx.txt")
