import json
import re

with open("scratch/filtered_questions.json", "r", encoding="utf-8") as f:
    data = json.load(f)

with open("scratch/audit_output.txt", "w", encoding="utf-8") as out_f:
    out_f.write("=== AUDITING SBP TARGET QUESTIONS ===\n")
    count = 0
    for q in data["kdigo_bp"]:
        q_text = q.get("q", "")
        t_text = q.get("t", "")
        exp_text = q.get("exp", "")
        opts = q.get("opts", [])
        ans = q.get("ans", 0)
        
        combined = (q_text + " " + exp_text).lower()
        if "120" in combined or "130" in combined or "140" in combined:
            if any(term in t_text.lower() for term in ["pa", "pressão", "hipertensão", "alvo", "meta", "kdigo"]):
                count += 1
                out_f.write(f"QID: {q['qid']} | Title: {t_text}\n")
                out_f.write(f"  Q: {q_text}\n")
                out_f.write(f"  Options:\n")
                for idx, opt in enumerate(opts):
                    marker = "[CORRECT]" if idx == ans else "         "
                    out_f.write(f"    {marker} {idx}: {opt}\n")
                out_f.write(f"  Exp: {exp_text[:400]}...\n")
                out_f.write("-" * 50 + "\n")
                if count >= 15:
                    break

    out_f.write("\n=== AUDITING HYPONATREMIA CORRECTION RATE ===\n")
    count = 0
    for q in data["hyponatremia_rate"]:
        q_text = q.get("q", "")
        t_text = q.get("t", "")
        exp_text = q.get("exp", "")
        opts = q.get("opts", [])
        ans = q.get("ans", 0)
        
        combined = (t_text + " " + q_text + " " + exp_text).lower()
        if any(term in combined for term in ["mEq", "mmol", "24h", "correção", "rapida", "mielinólise", "mielinolise"]):
            count += 1
            out_f.write(f"QID: {q['qid']} | Title: {t_text}\n")
            out_f.write(f"  Q: {q_text}\n")
            out_f.write(f"  Options:\n")
            for idx, opt in enumerate(opts):
                marker = "[CORRECT]" if idx == ans else "         "
                out_f.write(f"    {marker} {idx}: {opt}\n")
            out_f.write(f"  Exp: {exp_text[:400]}...\n")
            out_f.write("-" * 50 + "\n")
            if count >= 15:
                break

    out_f.write("\n=== AUDITING NOSTONE (LITÍASE) ===\n")
    for q in data["nostone"]:
        q_text = q.get("q", "")
        t_text = q.get("t", "")
        exp_text = q.get("exp", "")
        opts = q.get("opts", [])
        ans = q.get("ans", 0)
        
        out_f.write(f"QID: {q['qid']} | Title: {t_text}\n")
        out_f.write(f"  Q: {q_text}\n")
        out_f.write(f"  Options:\n")
        for idx, opt in enumerate(opts):
            marker = "[CORRECT]" if idx == ans else "         "
            out_f.write(f"    {marker} {idx}: {opt}\n")
        out_f.write(f"  Exp: {exp_text[:400]}...\n")
        out_f.write("-" * 50 + "\n")

