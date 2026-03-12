import re

categories_map = {
    "Paz Interior": "Para acalmar a mente",
    "Estresse": "Para acalmar a mente",
    "Silêncio Mental": "Para acalmar a mente",
    "Pensamentos Negativos": "Para acalmar a mente",
    
    "Body Scan": "Para relaxamento e sono",
    "Dormir": "Para relaxamento e sono",
    "Relaxamento Profundo": "Para relaxamento e sono",
    "Encerrar o Dia": "Para relaxamento e sono",
    
    "Mindfulness": "Presença e atenção",
    "Respiração Consciente": "Presença e atenção",
    "Observando Sons": "Presença e atenção",
    "Foco e Concentração": "Presença e atenção",
    "Caminhando": "Presença e atenção",
    
    "Gratidão": "Emocionais e cura interior",
    "Equilíbrio Emocional": "Emocionais e cura interior",
    "Tristeza": "Emocionais e cura interior",
    "Luto": "Emocionais e cura interior",
    "Perdão": "Emocionais e cura interior",
    "Cura Interior": "Emocionais e cura interior",
    "Observando Emoções": "Emocionais e cura interior",
    "Raiva e Irritação": "Emocionais e cura interior",
    "Aceitação": "Emocionais e cura interior",
    "Paciência": "Emocionais e cura interior",
    "Autocompaixão": "Emocionais e cura interior",

    "Confiança": "Autoestima e fortalecimento pessoal",
    "Energia e Disposição": "Autoestima e fortalecimento pessoal",
    "Começar o Dia": "Autoestima e fortalecimento pessoal",

    "Amor Bondoso": "Espirituais e expansivas",
    "Amor-Bondade": "Espirituais e expansivas",
    "Conexão Espiritual": "Espirituais e expansivas",
    "Chakras": "Espirituais e expansivas",
    "Mantras": "Espirituais e expansivas",

    "Visualização Positiva": "Visualização e intenção",
    "Manifestar Objetivos": "Visualização e intenção"
}

def get_category(title):
    t = title.lower()
    for key, cat in categories_map.items():
        if key.lower() in t:
            return cat
    return "Outras Meditações"

path = r'c:\Users\Romulo\Downloads\programa psicologia\src\app\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# find the meditations array
array_match = re.search(r'const meditations = \[(.*?)\];', content, re.DOTALL)
if array_match:
    array_str = array_match.group(1)
    # inject category field after title
    def replacer(m):
        title_line = m.group(0)
        title = m.group(1)
        cat = get_category(title)
        return f"{title_line}\n    category: '{cat}',"
    
    new_array = re.sub(r'title:\s*[\'"]([^\'"]+)[\'"],', replacer, array_str)
    new_content = content.replace(f'const meditations = [{array_str}];', f'const meditations = [{new_array}];')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Categories injected successfully.")
else:
    print("Array not found.")
