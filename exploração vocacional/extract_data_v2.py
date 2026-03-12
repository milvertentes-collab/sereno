
import re
import json

with open('extracted_raw_pdf.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Try to find all questions in the PDF
# Questions usually look like "1. Text" or "1 Text"
q_pattern = re.compile(r'(\d+)\.\s+(.*?)(?=\s*\d+\.\s+|\n\n|\Z)', re.DOTALL)
all_questions = q_pattern.findall(content)

# Deduplicate and sort by number
questions_dict = {}
for num, text in all_questions:
    n = int(num)
    t = text.strip()
    if n not in questions_dict or len(t) > len(questions_dict[n]):
        questions_dict[n] = t

sorted_nums = sorted(questions_dict.keys())
print(f"Total unique question numbers found: {len(sorted_nums)}")
print(f"Range: {sorted_nums[0]} to {sorted_nums[-1]}")

# If we found 60 or more, let's export them
test_questions = []
for i in range(1, 61):
    if i in questions_dict:
        test_questions.append({"id": i, "text": questions_dict[i]})

with open('questions_extracted.json', 'w', encoding='utf-8') as f:
    json.dump(test_questions, f, indent=2, ensure_ascii=False)

print("Saved 60 questions to questions_extracted.json")

# Look for professions
prof_pattern = re.compile(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(([RISAEC]{1,3})\)', re.MULTILINE)
professions = prof_pattern.findall(content)
print(f"Found {len(professions)} professions with RIASEC codes.")

if professions:
    with open('professions_extracted.json', 'w', encoding='utf-8') as f:
        json.dump(professions, f, indent=2, ensure_ascii=False)
    print("Saved professions to professions_extracted.json")
else:
    # Try another search for professions - maybe they are just names in a list
    # The DOCX says there are 50.
    pass
