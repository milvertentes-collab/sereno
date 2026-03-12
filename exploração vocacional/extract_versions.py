
import re
import json
from typing import Any, cast

with open('extracted_raw_pdf.txt', 'r', encoding='utf-8') as f:
    content = f.read()

def extract_block_questions(start_marker, end_marker=None):
    start_idx = content.find(start_marker)
    if start_idx == -1: return []
    
    end_idx = content.find(end_marker, start_idx) if end_marker else len(content)
    if end_idx == -1: end_idx = len(content)
    block = content[start_idx:end_idx]
    q_pattern = re.compile(r'(\d+)\.\s+(.*?)(?=\s*\d+\.\s+|\n\n|\n[A-Z]|\Z)', re.DOTALL)
    matches = q_pattern.findall(block)
    
    questions = []
    for num, text in matches:
        t = text.strip().replace('\n', ' ')
        t = re.sub(r'Nada a ver comigo.*', '', t).strip()
        if t:
            questions.append({"id": int(num), "text": t})
    return questions

rapida = extract_block_questions("Versão rápida", "Versão principal")
principal = extract_block_questions("Versão principal", "Versão mais completa")
completa = extract_block_questions("Versão mais completa")

print(f"Rápida: {len(rapida)} questions")
print(f"Principal: {len(principal)} questions")
print(f"Completa: {len(completa)} questions")

# Map categories (assuming S-I-A-R-E-C rotation)
mapping = ["S", "I", "A", "R", "E", "C"]

def map_cats(qs):
    for i, q in enumerate(qs):
        q["category"] = mapping[i % 6]
    return qs

all_versions = {
    "rapida": map_cats(rapida),
    "principal": map_cats(principal),
    "completa": map_cats(completa)
}

with open('vocational_versions.json', 'w', encoding='utf-8') as f:
    json.dump(all_versions, f, indent=2, ensure_ascii=False)

print("Saved all versions to vocational_versions.json")
