import re
import json
from typing import Any, cast

with open('extracted_raw_pdf.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find "Num. Text"
pattern = re.compile(r'(\d+)\.\s+(.*?)(?=\n\d+\.|\n\n|\Z)', re.DOTALL)
matches = pattern.findall(content)

questions = {}
for num, text in matches:
    n = int(num)
    t = text.strip()
    if n not in questions or len(t) > len(questions[n]):
        questions[n] = t

# Print them grouped by 10
areas = ['Realista', 'Investigativo', 'Artístico', 'Social', 'Empreendedor', 'Convencional']
for i, area in enumerate(areas):
    print(f"\n--- {area} (Questions {i*10 + 1} to {(i+1)*10}) ---")
    for q_num in range(i*10 + 1, (i+1)*10 + 1):
        txt = questions.get(q_num, "NOT FOUND")
        sample = txt[:100]
        print(f"{q_num}: {sample}")
