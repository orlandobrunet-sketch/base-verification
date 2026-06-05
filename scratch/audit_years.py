import re
import os
import sys

# Read refs.js to extract all reference details
with open("data/refs.js", "r", encoding="utf-8") as f:
    refs_content = f.read()

ref_blocks = re.findall(r'(\w+)\s*:\s*\{([^}]+)\}', refs_content, re.DOTALL)
refs_db = {}
for key, content in ref_blocks:
    label_match = re.search(r'label\s*:\s*["\']([^"\']+)["\']', content)
    ano_match = re.search(r'ano\s*:\s*(\d{4})', content)
    if label_match and ano_match:
        refs_db[key] = {
            "label": label_match.group(1),
            "ano": int(ano_match.group(1))
        }

# Let's load topics.js content
with open("data/topics.js", "r", encoding="utf-8") as f:
    topics_content = f.read()

# Locate the topics array
start_marker = "const topics = ["
start_idx = topics_content.find(start_marker) + len(start_marker)
bracket_count = 1
end_idx = start_idx
while bracket_count > 0 and end_idx < len(topics_content):
    char = topics_content[end_idx]
    if char == '[':
        bracket_count += 1
    elif char == ']':
        bracket_count -= 1
    end_idx += 1
array_str = topics_content[start_idx:end_idx-1]

# Extract objects using a curly brace scanner
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
                objects.append(array_str[obj_start:i+1])
    i += 1

mismatches = []
for idx, obj in enumerate(objects):
    qid_match = re.search(r'"qid"\s*:\s*"([^"]+)"', obj)
    qid = qid_match.group(1) if qid_match else f"idx_{idx}"
    
    t_match = re.search(r'"t"\s*:\s*"([^"]+)"', obj)
    t = t_match.group(1) if t_match else ""
    
    q_match = re.search(r'"q"\s*:\s*"([^"]+)"', obj)
    q = q_match.group(1) if q_match else ""
    
    exp_match = re.search(r'"exp"\s*:\s*"([^"]+)"', obj)
    exp = exp_match.group(1) if exp_match else ""
    
    refs_match = re.search(r'"refs"\s*:\s*\[(.*?)\]', obj, re.DOTALL)
    refs = []
    if refs_match:
        refs = re.findall(r'"([^"]+)"', refs_match.group(1))
    
    # Years mentioned in question text, title or explanation
    years_q = re.findall(r'\b(20\d{2})\b', q)
    years_t = re.findall(r'\b(20\d{2})\b', t)
    years_exp = re.findall(r'\b(20\d{2})\b', exp)
    all_years_mentioned = sorted(list(set(years_q + years_t + years_exp)))
    
    for ref_key in refs:
        if ref_key in refs_db:
            ref_info = refs_db[ref_key]
            ref_label = ref_info["label"]
            ref_year = ref_info["ano"]
            
            if "kdigo" in ref_key.lower() or "kdigo" in ref_label.lower():
                for year in all_years_mentioned:
                    year_int = int(year)
                    if year_int != ref_year:
                        # Ensure we check that the mismatch is a real one
                        # If a KDIGO label includes a specific year, verify if it differs.
                        year_in_label_match = re.search(r'20\d{2}', ref_label)
                        if year_in_label_match:
                            label_year = int(year_in_label_match.group(0))
                            if label_year != year_int:
                                mismatches.append({
                                    "idx": idx,
                                    "qid": qid,
                                    "title": t,
                                    "q": q,
                                    "ref_key": ref_key,
                                    "ref_label": ref_label,
                                    "ref_year": label_year,
                                    "mentioned_year": year_int
                                })

with open("scratch/audit_years_output.txt", "w", encoding="utf-8") as out:
    out.write(f"Found {len(mismatches)} year mismatch cases:\n")
    for m in mismatches:
        out.write(f"\nIndex {m['idx']} (QID: {m['qid']}) - Title: '{m['title']}'\n")
        out.write(f"  - Mentioned Year: {m['mentioned_year']}\n")
        out.write(f"  - Linked Reference: {m['ref_key']} ({m['ref_label']} - Year {m['ref_year']})\n")
        out.write(f"  - Question Text: {m['q']}\n")

print(f"Successfully audited years. Found {len(mismatches)} potential mismatches. Results written to scratch/audit_years_output.txt")
