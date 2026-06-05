import re
import json

with open("data/topics.js", "r", encoding="utf-8") as f:
    content = f.read()

# Parse topics.js to list of objects
start_marker = "const topics = ["
start_idx = content.find(start_marker) + len(start_marker)
bracket_count = 1
end_idx = start_idx
while bracket_count > 0 and end_idx < len(content):
    char = content[end_idx]
    if char == '[':
        bracket_count += 1
    elif char == ']':
        bracket_count -= 1
    end_idx += 1
array_str = content[start_idx:end_idx-1]

objects = []
brace_count = 0
obj_start = 0
in_string = False
escape = False
in_comment = False

i = 0
while i < len(array_str):
    char = array_str[i]
    if escape:
        escape = False
        i += 1
        continue
    if char == '\\':
        escape = True
        i += 1
        continue
    if char == '"':
        in_string = not in_string
        i += 1
        continue
    if not in_string:
        if array_str[i:i+2] == '//':
            in_comment = True
            i += 2
            continue
        if in_comment:
            if char == '\n':
                in_comment = False
            i += 1
            continue
        if char == '{':
            if brace_count == 0:
                obj_start = i
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                objects.append((obj_start, array_str[obj_start:i+1]))
    i += 1

print(f"Scanned {len(objects)} topics.")

issues = []

for idx, (pos, obj) in enumerate(objects):
    qid_match = re.search(r'"qid"\s*:\s*"([^"]+)"', obj)
    qid = qid_match.group(1) if qid_match else f"idx_{idx}"
    t_match = re.search(r'"t"\s*:\s*"([^"]+)"', obj)
    title = t_match.group(1) if t_match else ""
    q_match = re.search(r'"q"\s*:\s*"([^"]+)"', obj)
    q = q_match.group(1) if q_match else ""
    exp_match = re.search(r'"exp"\s*:\s*"([^"]+)"', obj)
    exp = exp_match.group(1) if exp_match else ""
    cat_match = re.search(r'"cat"\s*:\s*"([^"]+)"', obj)
    cat = cat_match.group(1) if cat_match else ""
    
    refs_match = re.search(r'"refs"\s*:\s*\[(.*?)\]', obj, re.DOTALL)
    refs = []
    if refs_match:
        refs = re.findall(r'"([^"]+)"', refs_match.group(1))

    # Clean text for checking
    q_lower = q.lower()
    t_lower = title.lower()
    exp_lower = exp.lower()
    text_combined = f"{t_lower} {q_lower} {exp_lower}"

    # 1. Alport reference mismatch
    if "alport_syndrome_review" in refs:
        # Check if the question is actually about Alport Syndrome
        if "alport" not in text_combined:
            issues.append({
                "idx": idx, "qid": qid, "title": title, "refs": refs,
                "problem": "Question references 'alport_syndrome_review' but does not mention Alport Syndrome."
            })

    # 2. Holly system dialysis device mismatch
    if "holly" in q_lower or "holly" in t_lower:
        if "kdigo_gn" in refs:
            issues.append({
                "idx": idx, "qid": qid, "title": title, "refs": refs,
                "problem": "Holly implantable dialysis question references 'kdigo_gn' (glomerular) instead of 'kdigo_dialise'."
            })

    # 3. Lupus Nephritis KDIGO mismatches (guideline year updates)
    if "lúpus" in text_combined or "lúpica" in text_combined:
        # If it references KDIGO, verify if it uses the updated 2024 guideline or references kdigo_gn (2021)
        if "kdigo" in text_combined:
            if "voclosporina" in text_combined or "belimumabe" in text_combined or "2024" in text_combined:
                if "kdigo_gn" in refs and "kdigo_lupus_nephritis_guideline_2024" not in refs:
                    issues.append({
                        "idx": idx, "qid": qid, "title": title, "refs": refs,
                        "problem": "Lupus nephritis question talks about voclosporin/belimumab/2024 but references 'kdigo_gn' (2021) instead of 'kdigo_lupus_nephritis_guideline_2024'."
                    })

    # 4. IgAN KDIGO mismatches
    if "igan" in text_combined or "iga" in text_combined:
        if "sparsentana" in text_combined or "nefecon" in text_combined or "budesonida" in text_combined or "2025" in text_combined:
            if "kdigo_igan_2025" not in refs and "kdigo_igan_2021" in refs:
                issues.append({
                    "idx": idx, "qid": qid, "title": title, "refs": refs,
                    "problem": "IgAN question discusses sparsentan/nefecon/budesonide or mentions 2025 but references 'kdigo_igan_2021' instead of 'kdigo_igan_2025'."
                })

    # 5. KDIGO Anemia mismatches
    if "anemia" in text_combined and "kdigo" in text_combined:
        if "2026" in text_combined or "2024" in text_combined:
            # Check if it references kdigo_anemia_2026 or 2024
            if not any("kdigo_anemia" in r for r in refs):
                issues.append({
                    "idx": idx, "qid": qid, "title": title, "refs": refs,
                    "problem": "Anemia question mentions KDIGO 2024/2026 but doesn't reference any kdigo_anemia_* guideline."
                })
        elif "2012" in text_combined:
            # If it links to kdigo_anemia_2026 but text says 2012
            if "kdigo_anemia_2026" in refs or "kdigo_anemia_2024" in refs:
                issues.append({
                    "idx": idx, "qid": qid, "title": title, "refs": refs,
                    "problem": f"Anemia question mentions 'KDIGO 2012' but references a newer guideline (refs: {refs})."
                })

    # 6. ADPKD/DPARD KDIGO mismatches
    if ("adpkd" in text_combined or "dpard" in text_combined or "policística" in text_combined) and "kdigo" in text_combined:
        if "2025" in text_combined:
            if "kdigo_adpkd_2025" not in refs:
                issues.append({
                    "idx": idx, "qid": qid, "title": title, "refs": refs,
                    "problem": "ADPKD question mentions KDIGO 2025 but doesn't reference 'kdigo_adpkd_2025'."
                })
        elif "2021" in text_combined or "2022" in text_combined:
            if "kdigo_adpkd_2025" in refs:
                issues.append({
                    "idx": idx, "qid": qid, "title": title, "refs": refs,
                    "problem": "ADPKD question text mentions KDIGO 2021/2022 but references 'kdigo_adpkd_2025' (KDIGO ADPKD was first published in 2025)."
                })

print(f"Detected {len(issues)} advanced mismatch issues:")
for issue in issues:
    print(f"\nIndex {issue['idx']} (QID: {issue['qid']}) | Title: '{issue['title']}'")
    print(f"  - Refs: {issue['refs']}")
    print(f"  - Problem: {issue['problem']}")
