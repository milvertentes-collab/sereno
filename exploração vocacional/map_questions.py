
import json

with open('questions_final.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# The pattern is likely 6 categories repeating: 1-6, 7-12...
# Categories: S (Social), I (Investigativo), A (Artistico), R (Realista), E (Empreendedor), C (Convencional)
mapping = ["S", "I", "A", "R", "E", "C"]

final_data = []
for i, q in enumerate(questions):
    cat = mapping[i % 6]
    # Check if the text matches the category
    # 1: S (Cuidar de pessoas)
    # 2: I (Entender coisas)
    # 3: A (Criar ideias)
    # 4: R (Ferramentas/Maquinas)
    # 5: E (Liderar/Executar)
    # 6: C (Processos/Organizacao)
    final_data.append({
        "id": q["id"],
        "text": q["text"],
        "category": cat
    })

# Output for verification
for i in range(0, 12, 6):
    print(f"--- Block {i//6 + 1} ---")
    for j in range(6):
        if i + j < len(final_data):
            q = final_data[i+j]
            print(f"{q['id']} [{q['category']}]: {q['text']}")

with open('questions_mapped.json', 'w', encoding='utf-8') as f:
    json.dump(final_data, f, indent=2, ensure_ascii=False)
