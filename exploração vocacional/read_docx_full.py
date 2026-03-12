
import docx # type: ignore
import html

# Function to encode to XML char refs for safety
def safe_print(text):
    print(html.unescape(text.encode('ascii', 'xmlcharrefreplace').decode()).replace('&#', '[#').replace(';', ']'))

doc = docx.Document('EXPLORAÇÃO VOCACIONAL explicação.docx')
for i, para in enumerate(doc.paragraphs):
    if para.text.strip():
        safe_print(f"P{i}: {para.text}")

print("\n--- TABLES ---")
for i, table in enumerate(doc.tables):
    print(f"\nTable {i}:")
    for row in table.rows:
        row_text = [cell.text for cell in row.cells]
        safe_print(" | ".join(row_text))
