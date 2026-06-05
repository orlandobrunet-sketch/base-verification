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

# Let's search for issues!
keywords = [
    ("hyponatremia_rate", r"(hiponatremia|sódio|sodio|osmótica|mielinólise|mielinolise)", ["sódio", "hiponatremia"]),
    ("kdigo_bp", r"(kdigo|pa|pressão|arterial|alvo|sistólica|sistolica|meta|120|130|140)", ["kdigo", "pa", "pressão"]),
    ("nostone", r"(nostone|tiazídico|tiazidico|hidroclorotiazida|clortalidona|indapamida|litíase|litiase)", ["nostone", "tiazídico", "litíase"]),
    ("iga_testing", r"(iga|nefropatia|igan|testing|corticoide|corticoterapia|prednisona)", ["iga", "testing"]),
    ("lupus_nephritis", r"(lúpus|lupus|lúpica|lupica|nefrite|aurora|voclosporina|belimumabe|micofenolato)", ["lúpus", "nefrite"]),
    ("membranous", r"(membranosa|pla2r|rituximabe|ponticelli|ciclofosfamida)", ["membranosa", "rituximabe"]),
    ("banff_transplant", r"(banff|rejeição|rejeicao|transplante|tacrolimus|ciclosporina)", ["banff", "transplante"]),
    ("dialysis_adequacy", r"(kt/v|adequação|adequacao|hemodiálise|hemodialise|peritoneal)", ["kt/v", "adequação", "hemodiálise"])
]

matching_questions = {k[0]: [] for k in keywords}

for idx, t in parsed_topics:
    q_text = t.get("q", "")
    exp_text = t.get("exp", "")
    title = t.get("t", "")
    combined = (title + " " + q_text + " " + exp_text).lower()
    
    for key, pattern, kw_list in keywords:
        if re.search(pattern, combined):
            matching_questions[key].append((idx, t))

# Output counts
print("=== Keyword Matching Counts ===")
for key, questions in matching_questions.items():
    print(f"  - {key}: {len(questions)} matching questions")

# Let's write the matching questions to a JSON file for analysis
with open("scratch/filtered_questions.json", "w", encoding="utf-8") as out:
    json.dump({k: [q[1] for q in v] for k, v in matching_questions.items()}, out, ensure_ascii=False, indent=2)
print("Saved filtered questions to scratch/filtered_questions.json")
