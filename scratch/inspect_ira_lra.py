import re

def check_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    ira_matches = re.findall(r'\bIRA\b', content)
    lra_matches = re.findall(r'\bLRA\b', content)
    
    # Let's also look for lowercase but as standalone words if any, though usually uppercase in medical context
    ira_lower = re.findall(r'\bira\b', content)
    lra_lower = re.findall(r'\blra\b', content)
    
    print(f"File: {filepath}")
    print(f"  Case-sensitive standalone 'IRA': {len(ira_matches)}")
    print(f"  Case-sensitive standalone 'LRA': {len(lra_matches)}")
    print(f"  Case-sensitive standalone 'ira' (lowercase): {len(ira_lower)}")
    print(f"  Case-sensitive standalone 'lra' (lowercase): {len(lra_lower)}")

print("=== Standalone Word Verification ===")
check_file("data/topics.js")
check_file("data/rapid-quiz.js")
