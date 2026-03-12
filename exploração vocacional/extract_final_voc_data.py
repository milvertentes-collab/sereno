
# pyre-ignore[21]: dependency opcional em ambiente local (python-docx)
import docx
import json
import re

doc = docx.Document('EXPLORAÇÃO VOCACIONAL explicação.docx')
questions = []
professions = []

current_area = None
areas = ['Realista', 'Investigativo', 'Artístico', 'Social', 'Empreendedor', 'Convencional']

for p in doc.paragraphs:
    text = p.text.strip()
    if not text:
        continue
    
    # Check for area headers
    for area in areas:
        if area.lower() in text.lower() and len(text) < 30:
            current_area = area
            break
            
    # Check for questions
    match = re.match(r'^(\d+)\.\s+(.*)', text)
    if match:
        questions.append({
            "id": int(match.group(1)),
            "text": match.group(2),
            "area": current_area
        })
        
    # Check for professions (heuristic: contains "Formação: superior" or similar)
    if "Formação:" in text or "Ambientes de trabalho:" in text:
        # The previous paragraph might be the name
        pass

# Since I can't easily parse professions from text blocks without a clear pattern,
# I'll look for paragraphs that are just a name (capitalized, no numbers, short).
for i in range(len(doc.paragraphs)):
    p = doc.paragraphs[i]
    text = p.text.strip()
    if i > 0 and ("Formação:" in text or "Descrição:" in text):
        name = doc.paragraphs[i-1].text.strip()
        if name and not name[0].isdigit():
            # Find the code (R, I, A, S, E, C) from the context
            # Or from the text itself if it contains like (RIA)
            code_match = re.search(r'([RISAEC]{1,3})', text)
            code = code_match.group(1) if code_match else "N/A"
            professions.append({
                "name": name,
                "code": code,
                "details": text
            })

with open('final_questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

with open('final_professions.json', 'w', encoding='utf-8') as f:
    json.dump(professions, f, indent=2, ensure_ascii=False)

print(f"Extracted {len(questions)} questions and {len(professions)} potential professions.")
