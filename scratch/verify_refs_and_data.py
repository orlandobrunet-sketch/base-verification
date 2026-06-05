import re
import json

# Read refs.js to extract all keys
with open("c:/Users/orlan/OneDrive/Meus Documentos/Documentos/GitHub/base-verification/data/refs.js", "r", encoding="utf-8") as f:
    refs_content = f.read()

# Extract keys of refsDB using regex
ref_keys = re.findall(r'^\s*([a-zA-Z0-9_]+)\s*:\s*\{', refs_content, re.MULTILINE)
ref_keys_set = set(ref_keys)
print(f"Loaded {len(ref_keys_set)} reference keys from refs.js.")

# Read topics.js
with open("c:/Users/orlan/OneDrive/Meus Documentos/Documentos/GitHub/base-verification/data/topics.js", "r", encoding="utf-8") as f:
    topics_content = f.read()

# Parse topics.js
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
        # Fallback using regex to extract fields
        qid = re.search(r'"qid":\s*"([^"]+)"', cleaned)
        qid = qid.group(1) if qid else f"unknown_{idx}"
        t = re.search(r'"t":\s*"([^"]+)"', cleaned)
        t = t.group(1) if t else ""
        q = re.search(r'"q":\s*"([^"]+)"', cleaned)
        q = q.group(1) if q else ""
        exp = re.search(r'"exp":\s*"([^"]+)"', cleaned)
        exp = exp.group(1) if exp else ""
        opts_match = re.search(r'"opts":\s*\[(.*?)\]', cleaned, re.DOTALL)
        opts_matches = re.findall(r'"([^"]+)"', opts_match.group(1)) if opts_match else []
        ans = re.search(r'"ans":\s*(\d+)', cleaned)
        ans = int(ans.group(1)) if ans else 0
        diff = re.search(r'"diff":\s*"([^"]+)"', cleaned)
        diff = diff.group(1) if diff else ""
        cat = re.search(r'"cat":\s*"([^"]+)"', cleaned)
        cat = cat.group(1) if cat else ""
        refs_match = re.search(r'"refs":\s*\[(.*?)\]', cleaned, re.DOTALL)
        refs_matches = re.findall(r'"([^"]+)"', refs_match.group(1)) if refs_match else []
        parsed_topics.append((idx, {
            "qid": qid, "t": t, "q": q, "exp": exp,
            "opts": opts_matches, "ans": ans, "diff": diff, "cat": cat, "refs": refs_matches
        }))

print(f"Loaded {len(parsed_topics)} topics from topics.js.")

# Diagnostic Checks
formatting_errors = []
missing_refs = []
invalid_ans = []
wrong_opts_count = []
empty_fields = []

for idx, q in parsed_topics:
    # 1. Check fields
    qid = q.get("qid")
    title = q.get("t")
    text = q.get("q")
    opts = q.get("opts", [])
    ans = q.get("ans")
    refs = q.get("refs", [])
    exp = q.get("exp")
    cat = q.get("cat")
    diff = q.get("diff")
    
    if not qid or not title or not text or not exp or not cat or not diff:
        empty_fields.append((idx, qid, "Missing core field (qid, t, q, exp, cat, diff)"))
    
    # 2. Check options count
    if len(opts) != 4:
        wrong_opts_count.append((idx, qid, f"Has {len(opts)} options, expected 4"))
        
    # 3. Check answer index
    if ans is None or not (0 <= ans < len(opts)):
        invalid_ans.append((idx, qid, f"Answer index is {ans} (options count: {len(opts)})"))
        
    # 4. Check references
    for ref in refs:
        if ref not in ref_keys_set:
            missing_refs.append((idx, qid, ref))

print("\n=== SYSTEMATIC QUALITY CHECK RESULTS ===")
print(f"Empty fields: {len(empty_fields)}")
for err in empty_fields[:5]:
    print(f"  - Index {err[0]} (QID: {err[1]}): {err[2]}")
    
print(f"Wrong options count: {len(wrong_opts_count)}")
for err in wrong_opts_count[:5]:
    print(f"  - Index {err[0]} (QID: {err[1]}): {err[2]}")
    
print(f"Invalid answer index: {len(invalid_ans)}")
for err in invalid_ans[:5]:
    print(f"  - Index {err[0]} (QID: {err[1]}): {err[2]}")
    
print(f"Missing reference keys: {len(missing_refs)}")
for err in missing_refs[:15]:
    print(f"  - Index {err[0]} (QID: {err[1]}): Reference '{err[2]}' not defined in refs.js")

# Check rapid-quiz.js format
with open("c:/Users/orlan/OneDrive/Meus Documentos/Documentos/GitHub/base-verification/data/rapid-quiz.js", "r", encoding="utf-8") as f:
    rapid_content = f.read()

# Extract objects using regex
rapid_matches = re.findall(r'"q":\s*"(.*?)",\s*"ans":\s*(true|false),\s*"exp":\s*"(.*?)"', rapid_content)
if not rapid_matches:
    # Alternative format with different ordering
    rapid_qids = re.findall(r'"qid":\s*"([^"]+)"', rapid_content)
    rapid_qs = re.findall(r'"q":\s*"([^"]+)"', rapid_content)
    rapid_ans = re.findall(r'"ans":\s*(true|false)', rapid_content)
    rapid_exps = re.findall(r'"exp":\s*"([^"]+)"', rapid_content)
    rapid_cats = re.findall(r'"cat":\s*"([^"]+)"', rapid_content)
    rapid_diffs = re.findall(r'"diff":\s*"([^"]+)"', rapid_content)
    
    print(f"\nLoaded {len(rapid_qs)} questions from rapid-quiz.js (by q key).")
    rapid_errors = []
    if not (len(rapid_qids) == len(rapid_qs) == len(rapid_ans) == len(rapid_exps) == len(rapid_cats) == len(rapid_diffs)):
        rapid_errors.append((0, f"Array property mismatch lengths. QIDs: {len(rapid_qids)}, Qs: {len(rapid_qs)}, Ans: {len(rapid_ans)}, Exps: {len(rapid_exps)}, Cats: {len(rapid_cats)}, Diffs: {len(rapid_diffs)}"))
else:
    print(f"\nLoaded {len(rapid_matches)} questions from rapid-quiz.js.")
    rapid_errors = []
    for r_idx, match in enumerate(rapid_matches):
        q_txt, ans_txt, exp_txt = match
        if not q_txt or not exp_txt:
            rapid_errors.append((r_idx, "Empty q or exp"))

print(f"Rapid-quiz formatting errors: {len(rapid_errors)}")
if rapid_errors:
    for err in rapid_errors:
        print(f"  - Error: {err[1]}")

