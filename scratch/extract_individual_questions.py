import json

with open("scratch/filtered_questions.json", "r", encoding="utf-8") as f:
    data = json.load(f)

target_qids = [
    "e56795a6", "1e0e571c", "920621f6", "9961a406", 
    "69fdfbcc", "b2292dd3", "70129a64", "7573d4ad",
    "d81defbb", "5d7e81a6", "23c732a4", "4efef2a5"
]

all_qs = []
for cat in data:
    for q in data[cat]:
        if q["qid"] in target_qids:
            all_qs.append(q)

unique_qs = {q["qid"]: q for q in all_qs}

with open("scratch/target_clinical_audit.txt", "w", encoding="utf-8") as out:
    for qid in target_qids:
        if qid in unique_qs:
            q = unique_qs[qid]
            out.write(f"QID: {q['qid']} | Title: {q['t']} | Cat: {q['cat']}\n")
            out.write(f"Q: {q['q']}\n")
            out.write(f"Opts:\n")
            for idx, opt in enumerate(q['opts']):
                marker = "[CORRECT]" if idx == q['ans'] else "         "
                out.write(f"  {marker} {idx}: {opt}\n")
            out.write(f"Exp: {q['exp']}\n")
            out.write("=" * 50 + "\n\n")

print(f"Dumped {len(unique_qs)} target questions to scratch/target_clinical_audit.txt")
