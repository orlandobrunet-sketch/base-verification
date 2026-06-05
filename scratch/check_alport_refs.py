import re

with open("data/topics.js", "r", encoding="utf-8") as f:
    content = f.read()

# Parse the file to find all question objects
# Quick curly brace parser
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

print(f"Scanned {len(objects)} questions.")

for pos, obj in objects:
    qid_match = re.search(r'"qid"\s*:\s*"([^"]+)"', obj)
    qid = qid_match.group(1) if qid_match else "unknown"
    t_match = re.search(r'"t"\s*:\s*"([^"]+)"', obj)
    t = t_match.group(1) if t_match else ""
    q_match = re.search(r'"q"\s*:\s*"([^"]+)"', obj)
    q = q_match.group(1) if q_match else ""
    
    refs_match = re.search(r'"refs"\s*:\s*\[(.*?)\]', obj, re.DOTALL)
    refs = []
    if refs_match:
        refs = re.findall(r'"([^"]+)"', refs_match.group(1))
        
    if "alport_syndrome_review" in refs:
        print(f"QID: {qid} | Title: {t}")
        print(f"  Refs: {refs}")
        print(f"  Question text: {q[:100]}...")
