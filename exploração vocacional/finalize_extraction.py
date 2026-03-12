
import re
import json
from typing import Any, cast

with open('extracted_raw_pdf.txt', 'r', encoding='utf-8') as f:
    content = f.read()

keywords = {
    "R": ["máquina", "ferramenta", "consertar", "ar livre", "esporte", "física", "construir", "prático", "técnica", "concreto", "objetos", "maquinário", "veículo", "elétrica", "marcenaria"],
    "I": ["entender", "pesquisar", "ciência", "laboratório", "dados", "teoria", "analisar", "descobrir", "lógica", "por que", "conhecimento", "estudar", "investigar", "observar"],
    "A": ["criar", "pintar", "escrever", "música", "design", "original", "expressão", "teatro", "artes", "beleza", "imaginação", "estilizar", "dançar", "atuar", "desenhar"],
    "S": ["ajudar", "cuidar", "ensinar", "pessoas", "acolher", "ouvir", "social", "equipe", "bem-estar", "comunidade", "orientar", "suporte", "educar"],
    "E": ["liderar", "vender", "metas", "convencer", "gerenciar", "negócios", "iniciativa", "negociar", "assumir", "lucro", "empresa", "influência", "competir"],
    "C": ["organizar", "rotina", "arquivos", "detalhes", "regras", "burocracia", "eficiente", "cálculo", "precisão", "métodos", "ordem", "planilhas", "formulários", "fiscalizar"]
}

def classify(text):
    text = text.lower()
    scores = {cat: 0 for cat in keywords}
    for cat, kw_list in keywords.items():
        for kw in kw_list:
            if kw in text:
                scores[cat] += 1
    
    # Priority if specific ones found
    if "cuidar" in text or "acolher" in text or "ajudar" in text: return "S"
    if "máquina" in text or "ferramenta" in text or "consertar" in text: return "R"
    if "criar" in text or "original" in text or "desenhar" in text: return "A"
    if "vender" in text or "liderar" in text or "metas" in text: return "E"
    if "organizar" in text or "regras" in text or "rotina" in text: return "C"
    if "estudar" in text or "pesquisar" in text or "entender" in text: return "I"
    
    max_cat = max(scores, key=lambda k: scores[k])
    if scores[max_cat] == 0: return "S" # Fallback to Social or just rotate
    return max_cat

def extract_block(header, stop_at=None):
    idx = content.find(header)
    if idx == -1: return []
    end = content.find(stop_at, idx) if stop_at else len(content)
    if end == -1: end = len(content)
    
    block = content[idx:end]
    q_pattern = re.compile(r'(\d+)\.\s+(.*?)(?=\s*\d+\.\s+|\n\n|\n[A-Z]|\Z)', re.DOTALL)
    matches = q_pattern.findall(block)
    
    res = []
    for num, text in matches:
        t = text.strip().replace('\n', ' ')
        t = re.sub(r'Nada a ver comigo.*', '', t).strip()
        if t:
            res.append({
                "id": int(num),
                "text": t,
                "category": classify(t)
            })
    return res

versions = {
    "rapida": extract_block("Versão rápida", "Versão principal"),
    "media": extract_block("Versão principal", "Versão mais completa"),
    "completa": extract_block("Versão mais completa")
}

# Ensure balanced categorization if there are gaps
# Actually, the auto-classification should be good enough if the keywords are representative.

with open('vocational_data_final.json', 'w', encoding='utf-8') as f:
    json.dump(versions, f, indent=2, ensure_ascii=False)

print(f"Extraction complete.")
print(f"Rápida: {len(versions['rapida'])} questions")
print(f"Média: {len(versions['media'])} questions")
print(f"Completa: {len(versions['completa'])} questions")
