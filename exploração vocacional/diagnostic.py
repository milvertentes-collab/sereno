
import re
from typing import Any, cast

with open('extracted_raw_pdf.txt', 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Total content length: {len(content)}")

# Find all occurrences of digits followed by a dot and a space
matches = re.finditer(r'(\d+)\.\s+(.*)', content)
q_map = {}
for m in matches:
    num = int(m.group(1))
    text = m.group(2).strip()
    if num not in q_map or len(text) > len(q_map[num]):
        q_map[num] = text

print(f"Unique question numbers found: {len(q_map)}")
print(f"Max number found: {max(q_map.keys()) if q_map else 0}")

# Search for RIASEC codes like (RIA), (S), (EC)
code_matches = re.finditer(r'\(([RISAEC]{1,3})\)', content)
for m in code_matches:
    print(f"Found code {m.group(1)} at {m.start()}")
    start = max(0, m.start() - 50)
    end = min(len(content), m.start() + 100)
    context = content[start:end]
    print(context)
    print("-" * 30)

# Search for the word "Profissões" or "Carreiras"
for word in ['Profissões', 'Profissoes', 'Carreiras', 'Áreas', 'Areas']:
    p_matches = re.finditer(word, content, re.IGNORECASE)
    for m in p_matches:
        print(f"Found keyword '{word}' at {m.start()}")
        end = min(len(content), m.start() + 500)
        context = content[m.start():end]
        print(context)
        print("-" * 50)
