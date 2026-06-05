with open("data/topics.js", "r", encoding="utf-8") as f:
    content = f.read()

# Let's search case-sensitively for "ERC" as a word
import re
erc_matches = re.findall(r'\bERC\b', content)
print(f"Case-sensitive standalone 'ERC': {len(erc_matches)}")

# Search for "Enfermidade" case-insensitively
enfermidade_matches = re.findall(r'enfermidade', content, re.IGNORECASE)
print(f"Case-insensitive 'enfermidade': {len(enfermidade_matches)}")

# Let's search for "ERC" case-sensitively in rapid-quiz.js
with open("data/rapid-quiz.js", "r", encoding="utf-8") as f:
    rapid_content = f.read()
erc_rapid = re.findall(r'\bERC\b', rapid_content)
print(f"Case-sensitive standalone 'ERC' in rapid-quiz: {len(erc_rapid)}")
enfermidade_rapid = re.findall(r'enfermidade', rapid_content, re.IGNORECASE)
print(f"Case-insensitive 'enfermidade' in rapid-quiz: {len(enfermidade_rapid)}")
