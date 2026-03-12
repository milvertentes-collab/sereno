
import json
import re

# Load extracted questions
with open('questions_final.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# Keywords for categorization
keywords = {
    "R": ["máquina", "ferramenta", "consertar", "ar livre", "esporte", "física", "construir", "prático", "técnica", "concreto", "objetos"],
    "I": ["entender", "pesquisar", "ciência", "laboratório", "dados", "teoria", "analisar", "descobrir", "lógica", "por que", "conhecimento"],
    "A": ["criar", "pintar", "escrever", "música", "design", "original", "expressão", "teatro", "artes", "beleza", "imaginação"],
    "S": ["ajudar", "cuidar", "ensinar", "pessoas", "acolher", "ouvir", "social", "equipe", "bem-estar", "comunidade"],
    "E": ["liderar", "vender", "metas", "convencer", "gerenciar", "negócios", "iniciativa", "negociar", "assumir", "lucro", "empresa"],
    "C": ["organizar", "rotina", "arquivos", "detalhes", "regras", "burocracia", "eficiente", "cálculo", "precisão", "métodos", "ordem"]
}

def classify(text):
    text = text.lower()
    scores = {cat: 0 for cat in keywords}
    for cat, kw_list in keywords.items():
        for kw in kw_list:
            if kw in text:
                scores[cat] += 1
    
    # Priority if tied or specific ones found
    if "cuidar" in text or "acolher" in text: return "S"
    if "máquina" in text or "ferramenta" in text: return "R"
    if "criar" in text or "original" in text: return "A"
    
    max_cat = max(scores, key=scores.get)
    if scores[max_cat] == 0:
        return "N/A" # Need manual check
    return max_cat

mapped_questions = []
for q in questions:
    cat = classify(q["text"])
    mapped_questions.append({
        "id": q["id"],
        "text": q["text"],
        "category": cat
    })

# Manual identification of categories for the 60 questions based on text
# I'll output them all so I can verify
with open('questions_categorized_preview.txt', 'w', encoding='utf-8') as f:
    for q in mapped_questions:
        f.write(f"{q['id']} [{q['category']}]: {q['text']}\n")

print("Created questions_categorized_preview.txt for review.")
