import re

def parse_js_array(filepath, start_marker, end_marker):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple extraction of the array content between start_marker and end_marker
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print(f"Error: Start marker '{start_marker}' not found in {filepath}")
        return []
    start_idx += len(start_marker)
    
    # Find matching closing bracket
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
    
    # We can parse the individual objects using a simple regex-based parser
    # each object is enclosed in curly braces { }
    objects = []
    # Find all balanced curly brace groups
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
                    obj_str = array_str[obj_start:i+1]
                    objects.append(obj_str)
                    
    return objects

# Let's parse topics.js
topics_raw = parse_js_array("c:/Users/orlan/OneDrive/Meus Documentos/Documentos/GitHub/base-verification/data/topics.js", "const topics = [", "];")
print(f"Successfully extracted {len(topics_raw)} raw topic objects.")

# Let's build a parser to load each object into a python dict
import json
parsed_topics = []
parse_errors = 0
for idx, raw_obj in enumerate(topics_raw):
    # Try to parse it as JSON by cleaning it up slightly if needed
    # (Since topics.js is written as JSON-like structure, it might work directly)
    # Strip any comments or trailing commas
    cleaned = re.sub(r'//.*$', '', raw_obj, flags=re.MULTILINE)
    try:
        # Standardize single quotes or unquoted keys (topics.js has double quotes for keys/strings)
        parsed = json.loads(cleaned)
        parsed_topics.append((idx, parsed))
    except Exception as e:
        parse_errors += 1
        # Fallback regex extraction if json fails
        try:
            qid = re.search(r'"qid":\s*"([^"]+)"', cleaned).group(1)
        except:
            qid = f"unknown_{idx}"
        try:
            q = re.search(r'"q":\s*"([^"]+)"', cleaned).group(1)
        except:
            q = "unknown"
        try:
            cat = re.search(r'"cat":\s*"([^"]+)"', cleaned).group(1)
        except:
            cat = "unknown"
        parsed_topics.append((idx, {"qid": qid, "q": q, "cat": cat, "error": str(e), "raw": cleaned}))

print(f"Parsed topics: {len(parsed_topics)} (errors: {parse_errors})")

# Terminology Audit Lists
inconsistencies = {
    "LRA_vs_IRA": [],
    "DRC_vs_ERC": [],
    "TRS_vs_terapia_substitutiva": [],
    "hemodialise_vs_HD": [],
    "dialise_peritoneal_vs_DP": [],
    "iSGLT2_vs_SGLT2i": [],
    "IECA_BRA": [],
}

high_risk_keywords = [
    "KDIGO", "KDOQI", "ISPD", "Banff", "FLOW", "EMPA-KIDNEY", "DAPA-CKD", "TESTING", "NOSTONE", "SHARP", "ONTARGET"
]
high_risk_questions = []

for idx, t in parsed_topics:
    if "error" in t:
        continue
    
    q_text = t.get("q", "")
    exp_text = t.get("exp", "")
    title = t.get("t", "")
    combined = (title + " " + q_text + " " + exp_text).lower()
    
    # 1. Terms search
    if "lra" in combined and "ira" in combined:
        inconsistencies["LRA_vs_IRA"].append((idx, t.get("qid"), "Ambos termos usados na mesma questão"))
    elif "lra" in combined:
        inconsistencies["LRA_vs_IRA"].append((idx, t.get("qid"), "LRA"))
    elif "ira" in combined:
        inconsistencies["LRA_vs_IRA"].append((idx, t.get("qid"), "IRA"))

    if "drc" in combined and "erc" in combined:
        inconsistencies["DRC_vs_ERC"].append((idx, t.get("qid"), "Ambos os termos (DRC e ERC) usados"))
    elif "erc" in combined:
        inconsistencies["DRC_vs_ERC"].append((idx, t.get("qid"), "ERC"))

    if "hemodiálise" in combined and "hd" in combined:
        inconsistencies["hemodialise_vs_HD"].append((idx, t.get("qid"), "Ambos (Hemodiálise e HD) usados"))
    elif "hemodiálise" in combined:
        inconsistencies["hemodialise_vs_HD"].append((idx, t.get("qid"), "Hemodiálise"))
    elif "hd" in combined:
        inconsistencies["hemodialise_vs_HD"].append((idx, t.get("qid"), "HD"))

    if "diálise peritoneal" in combined and "dp" in combined:
        inconsistencies["dialise_peritoneal_vs_DP"].append((idx, t.get("qid"), "Ambos (Diálise Peritoneal e DP) usados"))
    elif "diálise peritoneal" in combined:
        inconsistencies["dialise_peritoneal_vs_DP"].append((idx, t.get("qid"), "Diálise Peritoneal"))
    elif "dp" in combined:
        inconsistencies["dialise_peritoneal_vs_DP"].append((idx, t.get("qid"), "DP"))

    if "sglt2i" in combined and "isglt2" in combined:
        inconsistencies["iSGLT2_vs_SGLT2i"].append((idx, t.get("qid"), "Ambos (SGLT2i e iSGLT2) usados"))
    elif "sglt2i" in combined:
        inconsistencies["iSGLT2_vs_SGLT2i"].append((idx, t.get("qid"), "SGLT2i"))
    elif "isglt2" in combined:
        inconsistencies["iSGLT2_vs_SGLT2i"].append((idx, t.get("qid"), "iSGLT2"))

    # Check for study citations/guidelines
    found_kws = [kw for kw in high_risk_keywords if kw.lower() in combined]
    if found_kws:
        high_risk_questions.append((idx, t.get("qid"), t.get("t"), found_kws))

# Summarize Terminology
print("\n=== Terminology Audit Summary ===")
for term, occurrences in inconsistencies.items():
    types = {}
    for idx, qid, val in occurrences:
        types[val] = types.get(val, 0) + 1
    print(f"Term '{term}': {len(occurrences)} matches. Breakdown: {types}")

print(f"\n=== High Risk/Guideline Reference Questions: {len(high_risk_questions)} ===")
for idx, qid, title, kws in high_risk_questions[:20]:
    print(f"  - [{idx}] QID: {qid} | Title: {title} | Keywords: {kws}")
