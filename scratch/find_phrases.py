import re

def search_phrases(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    ira_full = re.findall(r'insuficiência\s+renal\s+aguda', content, re.IGNORECASE)
    lra_full = re.findall(r'lesão\s+renal\s+aguda', content, re.IGNORECASE)
    trs_full = re.findall(r'terapia\s+renal\s+substitutiva', content, re.IGNORECASE)
    trs_abbrev = re.findall(r'\bTRS\b', content)
    
    print(f"File: {filepath}")
    print(f"  'Insuficiência Renal Aguda' (case-insensitive): {len(ira_full)}")
    print(f"  'Lesão Renal Aguda' (case-insensitive): {len(lra_full)}")
    print(f"  'Terapia Renal Substitutiva' (case-insensitive): {len(trs_full)}")
    print(f"  Abbreviation 'TRS': {len(trs_abbrev)}")

search_phrases("data/topics.js")
search_phrases("data/rapid-quiz.js")
