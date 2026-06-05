import re
import json

def analyze_file(filepath, var_name):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to find objects
    # Or find all occurrences of qid or "qid"
    qids = re.findall(r'"qid":\s*"([^"]+)"', content)
    cats = re.findall(r'"cat":\s*"([^"]+)"', content)
    diffs = re.findall(r'"diff":\s*"([^"]+)"', content)
    
    print(f"File: {filepath}")
    print(f"  Total questions (by QID): {len(qids)}")
    print(f"  Unique QIDs: {len(set(qids))}")
    print(f"  Categories distribution:")
    cat_counts = {}
    for c in cats:
        cat_counts[c] = cat_counts.get(c, 0) + 1
    for c, count in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"    - {c}: {count}")
    
    diff_counts = {}
    for d in diffs:
        diff_counts[d] = diff_counts.get(d, 0) + 1
    print(f"  Difficulty distribution:")
    for d, count in sorted(diff_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"    - {d}: {count}")

print("=== Analyzing Topics ===")
analyze_file("c:/Users/orlan/OneDrive/Meus Documentos/Documentos/GitHub/base-verification/data/topics.js", "topics")
print("\n=== Analyzing Rapid Quiz ===")
analyze_file("c:/Users/orlan/OneDrive/Meus Documentos/Documentos/GitHub/base-verification/data/rapid-quiz.js", "rapidQuiz")
