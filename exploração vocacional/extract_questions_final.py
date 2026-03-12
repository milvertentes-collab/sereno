
import re
import json

with open('extracted_raw_pdf.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Improved pattern for question extraction
q_pattern = re.compile(r'(\d+)\.\s+(.*?)(?=\s*\d+\.\s+|\n\n|\n[A-Z]|\Z)', re.DOTALL)
matches = q_pattern.findall(content)

questions = {}
for num, text in matches:
    n = int(num)
    t = text.strip().replace('\n', ' ')
    # Clean up common PDF debris
    t = re.sub(r'Nada a ver comigo.*', '', t).strip()
    if n not in questions or len(t) > len(questions[n]):
        questions[n] = t

# We expect 60 questions
final_questions = []
for i in range(1, 61):
    txt = questions.get(i, "")
    if txt:
        final_questions.append({"id": i, "text": txt})

with open('questions_final.json', 'w', encoding='utf-8') as f:
    json.dump(final_questions, f, indent=2, ensure_ascii=False)

from typing import Any, cast

print(f"Extraction complete: {len(final_questions)} questions saved.")
final_list = cast(Any, final_questions)
for i, q in enumerate(final_list):
    if i >= 10: break
    print(f"{q['id']}: {q['text']}")
