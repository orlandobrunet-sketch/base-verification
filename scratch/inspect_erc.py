import re

with open("data/topics.js", "r", encoding="utf-8") as f:
    topics_text = f.read()

# Find all occurrences of ERC (case-insensitive) as a word
erc_matches = re.findall(r'\b[eE][rR][cC]\b', topics_text)
print(f"Found {len(erc_matches)} standalone 'ERC' word matches in topics.js.")

# Find all occurrences of "Enfermidade" or similar
enfermidade_matches = re.findall(r'[eE]nfermidade\s+[rR]enal\s+[cC]rônica', topics_text)
print(f"Found {len(enfermidade_matches)} 'Enfermidade Renal Crônica' matches in topics.js.")

# Let's inspect some of the matches to see context
for match in re.finditer(r'(\b\w+\W+){0,5}\b[eE][rR][cC]\b(\W+\w+){0,5}', topics_text):
    print(f"Context: {match.group(0)}")
