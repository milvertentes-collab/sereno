import re

def extract_audio_map(page_content):
    # This will find titles and their associated audio objects in the old array
    # e.g., title: 'Paz Interior', ... audio: { feminino: '...', masculino: '...' }
    matches = re.finditer(r"title:\s*['\"]([^'\"]+)['\"].*?audio:\s*(\{\s*feminino:[^}]+})", page_content, re.DOTALL)
    audio_map = {}
    for m in matches:
        title = m.group(1).strip()
        audio_str = m.group(2).strip()
        audio_map[title] = audio_str
    # Let's also do a fallback for manual mapping of the first 4 if the regex misses due to formatting.
    return audio_map

with open('extracted_meditations.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

meditations = []
current_med = None
current_text = []

# Categories to ignore
ignored = ["Calma e Presença", "Corpo e Relaxamento", "Coração e Emoções", "Foco e Clareza", "Espiritualidade e Expansão", "Fim da coletânea."]

for line in lines:
    line = line.strip()
    if not line or line in ignored:
        continue
    
    # Check for title
    match = re.search(r'Meditação Guiada — (.*?)\s*\((\d+)\s*minutos\)(.*)', line)
    if match:
        if current_med:
            current_med['text'] = "\\n".join(current_text)
            meditations.append(current_med)
            
        title = match.group(1).strip()
        dur = match.group(2).strip()
        emoji = match.group(3).strip()
        
        current_med = {
            'title': title,
            'duration': f"{dur} min",
            'emoji': emoji,
        }
        current_text = []
    elif current_med:
        if line != "Fim da coletânea.":
            current_text.append(line.replace('`', '\\`'))

if current_med:
    current_med['text'] = "\\n".join(current_text)
    meditations.append(current_med)

page_path = "c:/Users/Romulo/Downloads/programa psicologia/src/app/page.tsx"
with open(page_path, 'r', encoding='utf-8') as f:
    page_content = f.read()

audio_map = extract_audio_map(page_content)
print("Found audio map:", list(audio_map.keys()))

# Default audio mappings if regex missed something
if "Paz Interior" not in audio_map:
    audio_map["Paz Interior"] = "{ feminino: '/Sons Exercicio de Respiração/Paz Interior- Voz feminina.mp3', masculino: '/Sons Exercicio de Respiração/Paz interior- voz masculina.mp3' }"
if "Body Scan" not in audio_map:
    audio_map["Body Scan"] = "{ feminino: '/Sons Exercicio de Respiração/Body Scan- voz feminina.mp3', masculino: '/Sons Exercicio de Respiração/Body scan - voz masculina.mp3' }"
if "Gratidão" not in audio_map:
    audio_map["Gratidão"] = "{ feminino: '/Sons Exercicio de Respiração/gratidao_feminina.mp3', masculino: '/Sons Exercicio de Respiração/gratidao_masculina.mp3' }"
if "Mindfulness" not in audio_map:
    audio_map["Mindfulness"] = "{ feminino: '/Sons Exercicio de Respiração/mindfulness_feminina.mp3', masculino: '/Sons Exercicio de Respiração/mindfulness_masculina.mp3' }"

js_output = "const meditations = [\n"
for i, m in enumerate(meditations):
    title = m['title']
    js_output += "  {\n"
    js_output += f"    id: {i+1},\n"
    js_output += f"    title: '{title}',\n"
    js_output += f"    emoji: '{m['emoji']}',\n"
    js_output += f"    description: '{m['duration']} • Prática guiada',\n"
    if title in audio_map:
        js_output += f"    audio: {audio_map[title]},\n"
    js_output += f"    text: `{m['text']}`\n"
    js_output += "  }" + ("," if i < len(meditations)-1 else "") + "\n"
js_output += "];"

new_content = re.sub(r'const meditations = \[.*?\n\];', js_output, page_content, flags=re.DOTALL)

with open(page_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Replaced array with {len(meditations)} meditations.")
