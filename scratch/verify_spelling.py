import re

with open("data/topics.js", "r", encoding="utf-8") as f:
    topics = f.read()

with open("data/rapid-quiz.js", "r", encoding="utf-8") as f:
    rapid = f.read()

print("topics.js:")
print(f"  'estruvite' matches: {len(re.findall(r'estruvite', topics, re.IGNORECASE))}")
print(f"  'amónio' matches: {len(re.findall(r'amónio', topics, re.IGNORECASE))}")

print("rapid-quiz.js:")
print(f"  'estruvite' matches: {len(re.findall(r'estruvite', rapid, re.IGNORECASE))}")
print(f"  'amónio' matches: {len(re.findall(r'amónio', rapid, re.IGNORECASE))}")
