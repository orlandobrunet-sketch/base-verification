import re

filepath = "data/topics.js"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

target_qids = [
    "ff4c8b9e", "4ea80768", "6ffa0ff0", "2e03ecfc", 
    "10693f65", "7100ac38", "f5e0666b", "41366f18"
]

updated_count = 0

for qid in target_qids:
    pattern = r'(\{\s*(?:[^{}]*?"qid"\s*:\s*"' + qid + r'"[^{}]*?)\})'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        block = match.group(1)
        if '"kdigo_aki_2026"' in block:
            new_block = block
            new_block = re.sub(r',\s*"\bkdigo_aki_2026\b"', '', new_block)
            new_block = re.sub(r'"\bkdigo_aki_2026\b"\s*,', '', new_block)
            new_block = re.sub(r'"\bkdigo_aki_2026\b"', '', new_block)
            new_block = new_block.replace('[,', '[').replace(',]', ']')
            
            content = content.replace(block, new_block)
            print(f"Successfully removed kdigo_aki_2026 from QID {qid}.")
            updated_count += 1
        else:
            print(f"QID {qid} block found but does not contain 'kdigo_aki_2026'.")
    else:
        print(f"Could not find block for QID {qid}.")

if updated_count > 0:
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Finished. Updated {updated_count} questions.")
else:
    print("No updates needed.")
