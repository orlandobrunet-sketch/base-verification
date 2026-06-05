import json
import re

with open("c:/Users/orlan/OneDrive/Meus Documentos/Documentos/GitHub/base-verification/data/topics.js", "r", encoding="utf-8") as f:
    content = f.read()

# Simple parser to extract raw topics
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

# Balance curly braces
objects = []
brace_count = 0
obj_start = 0
in_string = False
escape = False

for i, char in enumerate(array_str):
    if escape:
        escape = False
        continue
    if char == '\\':
        escape = True
        continue
    if char == '"':
        in_string = not in_string
        continue
    if not in_string:
        if char == '{':
            if brace_count == 0:
                obj_start = i
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                objects.append(array_str[obj_start:i+1])

parsed_topics = []
for idx, obj in enumerate(objects):
    cleaned = re.sub(r'//.*$', '', obj, flags=re.MULTILINE)
    try:
        parsed = json.loads(cleaned)
        parsed_topics.append((idx, parsed))
    except Exception as e:
        # Simple regex parser fallback for this script
        qid = re.search(r'"qid":\s*"([^"]+)"', cleaned)
        qid = qid.group(1) if qid else f"unknown_{idx}"
        t = re.search(r'"t":\s*"([^"]+)"', cleaned)
        t = t.group(1) if t else ""
        q = re.search(r'"q":\s*"([^"]+)"', cleaned)
        q = q.group(1) if q else ""
        exp = re.search(r'"exp":\s*"([^"]+)"', cleaned)
        exp = exp.group(1) if exp else ""
        opts_matches = re.findall(r'"([^"]+)"', re.search(r'"opts":\s*\[(.*?)\]', cleaned, re.DOTALL).group(1)) if '"opts"' in cleaned else []
        ans = re.search(r'"ans":\s*(\d+)', cleaned)
        ans = int(ans.group(1)) if ans else 0
        diff = re.search(r'"diff":\s*"([^"]+)"', cleaned)
        diff = diff.group(1) if diff else ""
        cat = re.search(r'"cat":\s*"([^"]+)"', cleaned)
        cat = cat.group(1) if cat else ""
        parsed_topics.append((idx, {
            "qid": qid, "t": t, "q": q, "exp": exp,
            "opts": opts_matches, "ans": ans, "diff": diff, "cat": cat
        }))

# Let's search for issues on multiple axes
search_targets = [
    ("iga", r"(iga|igan|testing|nefecon|tarpeyo|sparsentan)"),
    ("lupus", r"(lúpus|lupus|lúpica|lupica|nefrite|aurora|voclosporina|belimumabe|micofenolato)"),
    ("membranosa", r"(membranosa|pla2r|rituximabe|ponticelli)"),
    ("hepatorrenal", r"(hepatorrenal|shr|terlipressina|albumina|noradrenalina)"),
    ("potassio", r"(potássio|potassio|hipercalemia|hipocalemia|patiromer|zircônio|szc|resonium|poliestirenossulfonato)"),
    ("banff", r"(banff|rejeição|rejeicao|transplante)"),
    ("acidose", r"(bicarbonato|acidose|hco3|nagma|hagma|hiato|gap)"),
    ("anemia", r"(anemia|epo|eritropoetina|ferro|ferritina|saturação|transferrina|roxadustate)"),
    ("litíase", r"(litíase|litiase|cálculo|calculo|oxalato|ácido úrico|estruvita|cistina|tiazídico)"),
    ("ajuste_dose", r"(ajuste|dose|hemodiálise|diálise|depuração|clearence|clearance)")
]

results = {k[0]: [] for k in search_targets}

for idx, q in parsed_topics:
    q_text = q.get("q", "")
    t_text = q.get("t", "")
    exp_text = q.get("exp", "")
    combined = (t_text + " " + q_text + " " + exp_text).lower()
    
    for key, pattern in search_targets:
        if re.search(pattern, combined):
            results[key].append((idx, q))

with open("scratch/clinical_audit_details.txt", "w", encoding="utf-8") as out:
    for key, q_list in results.items():
        out.write(f"==================================================\n")
        out.write(f"AXIS: {key.upper()} ({len(q_list)} questions found)\n")
        out.write(f"==================================================\n")
        for idx, q in q_list[:12]: # Dump first 12 questions of each category
            out.write(f"Index: {idx} | QID: {q['qid']} | Title: {q['t']} | Diff: {q['diff']} | Cat: {q['cat']}\n")
            out.write(f"Q: {q['q']}\n")
            out.write(f"Opts:\n")
            for o_idx, opt in enumerate(q.get('opts', [])):
                marker = "[CORRECT]" if o_idx == q['ans'] else "         "
                out.write(f"  {marker} {o_idx}: {opt}\n")
            out.write(f"Exp: {q['exp']}\n")
            out.write("-" * 50 + "\n\n")

print("Done! Clinical audit details written to scratch/clinical_audit_details.txt")
