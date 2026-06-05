import json
import re

with open("scratch/filtered_questions.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Combine potassium and electrolytes questions
potassium_questions = []
for cat in data:
    for q in data[cat]:
        q_text = q.get("q", "")
        t_text = q.get("t", "")
        exp_text = q.get("exp", "")
        combined = (t_text + " " + q_text + " " + exp_text).lower()
        if "potássio" in combined or "potassio" in combined or "hipercalemia" in combined or "calemia" in combined:
            potassium_questions.append(q)

# De-duplicate by qid
unique_pot = {}
for q in potassium_questions:
    unique_pot[q["qid"]] = q

print(f"Found {len(unique_pot)} unique potassium/hyperkalemia questions.")

# Let's print some details to see if there are any errors
with open("scratch/potassium_audit.txt", "w", encoding="utf-8") as out:
    for qid, q in unique_pot.items():
        out.write(f"QID: {q['qid']} | Title: {q['t']}\n")
        out.write(f"Q: {q['q']}\n")
        out.write(f"Opts:\n")
        for o_idx, opt in enumerate(q.get('opts', [])):
            marker = "[CORRECT]" if o_idx == q['ans'] else "         "
            out.write(f"  {marker} {o_idx}: {opt}\n")
        out.write(f"Exp: {q['exp']}\n")
        out.write("-" * 50 + "\n\n")
print("Saved potassium questions to scratch/potassium_audit.txt")
