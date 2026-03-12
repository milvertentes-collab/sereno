import re

with open('extracted_raw_pdf.txt', 'r', encoding='utf-8') as f:
    pdf_text: str = f.read()

print("--- ANALYZING PDF CONTENT ---")

# Look for question patterns
q_pattern = re.compile(r'(\d+)\.\s+(.*?)(?=\s*\d+\.\s+|\n\n|\Z)', re.DOTALL)
questions = q_pattern.findall(pdf_text)
print(f"Total questions found: {len(questions)}")

# Print a sample of questions to verify
# Print a sample of questions to verify
for i, (num, text) in enumerate(questions):
    if i >= 10: break
    clean_text = text.strip()
    sample = clean_text[:100]
    print(f"{num}: {sample}...")

# Look for category mapping keywords
areas = ['Realista', 'Investigativo', 'Artístico', 'Social', 'Empreendedor', 'Convencional']
for area in areas:
    matches = list(re.finditer(area, pdf_text, re.IGNORECASE))
    print(f"\nArea: {area} (Found {len(matches)} times)")
    for i, m in enumerate(matches):
        if i >= 2: break # Show first 2 occurrences
        start: int = max(0, m.start() - 50)
        end: int = min(len(pdf_text), m.end() + 300)

        raw_pdf_text_slice = pdf_text[start:end]
        print(f"Context [{m.start()}]:\n{raw_pdf_text_slice}\n{'-'*20}")

# Look for text like "1, 12, 18, 24" etc. which might be the keys
key_pattern = re.compile(r'[RISAEC]:\s*(\d+(?:,\s*\d+)*)', re.IGNORECASE)
keys = key_pattern.findall(pdf_text)
print(f"\nPotential keys found: {keys}")
