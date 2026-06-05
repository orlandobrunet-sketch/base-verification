import hashlib
import re

with open("data/rapid-quiz.js", "r", encoding="utf-8") as f:
    content = f.read()

# We need to extract all the objects in RAPID_QUIZ_QUESTIONS
# Each object is formatted as:
#   {q:"...",ans:true,exp:"..."}
# Let's write a regex that matches:
#   {\s*q\s*:\s*"(.*?)",\s*ans\s*:\s*(true|false),\s*exp\s*:\s*"(.*?)"\s*}

pattern = r'\{\s*q\s*:\s*"(.*?)",\s*ans\s*:\s*(true|false),\s*exp\s*:\s*"(.*?)"\s*\}'
matches = list(re.finditer(pattern, content))

print(f"Found {len(matches)} questions in rapid-quiz.js.")

# Category keywords mapping
cat_keywords = [
    ("dialise", r"(hemodiálise|hemodialise|diálise peritoneal|diálise|hd|dp|filtrado|kt/v|efluente|capilar|cateter|ultrafiltração|convecção|convince|eshol)"),
    ("glomerular", r"(nefrite|glomerulonefrite|glomerulopatia|lúpus|lúpica|igan|iga|membranosa|gesf|lesão mínima|dlm|goodpasture|anti-mbg|anca|vasculite|complemento|c3|c4|crioglobulinemia|plasmaférese|biópsia|podócito|hematúria|proteinúria|nefrótica|nefrítica)"),
    ("acido_base", r"(acidose|alcalose|hco3|bicarbonato|hiato|gap|nagma|hagma|ph|pco2|co2|anidrase|acetazolamida|hiato osmolar|urina ácida|alcalinização)"),
    ("eletrólitos", r"(sódio|sodio|potássio|potassio|cálcio|calcio|fósforo|fosforo|magnésio|magnesio|hipernatremia|hiponatremia|hipercalemia|hipocalemia|calemia|natremia|fosfatúria|mielinólise|osmolaridade|aquaporina|adh|vasopressina|reabsorção de sódio|reabsorção de potássio|patiromer|zircônio|resonium|poliestirenossulfonato|liddle|gitelman|bartter)"),
    ("transplante", r"(transplante|enxerto|banff|rejeição|imunossupressão|tacrolimus|ciclosporina|sirolimus|everolimus|timoglobulina|atg|valganciclovir|citomegalovírus|cmv|vírus bk|poliomavírus|linfocele|isquemia fria)"),
    ("lra", r"(lra|ira|lesão renal aguda|insuficiência renal aguda|nta|necrose tubular|tubular proximal|contrast|nefrotoxicidade|rabdomiólise|mioglobina|lise tumoral|urat|aminoglicosídeo|tenofovir|furosemide stress test|fst)"),
    ("nefropatia_diabetica", r"(diabetes|diabética|diabetica|dm2|glicosúria|sglt2|isglt2|semaglutida|flow|finerenona|fidelio|figaro|credence|empa-kidney|dapa-ckd|glp-1)"),
    ("genetica", r"(fabry|alport|policística|policistica|drpad|ciliopatia|lowe|esclerose tuberosa|genética|mutação|colágeno|pkd1|pkd2)"),
    ("litíase", r"(litíase|litiase|cálculo|calculo|pedras|oxalato|estruvita|cistina|ácido úrico|hipercalciúria|hipocitratúria|citrato|nostone|tiazídico|clortalidona)"),
    ("hipertensao", r"(hipertensão|hipertensao|has|pressão arterial|pa|pas|pad|sistólica|diastólica|alvo pressórico|anti-hipertensivo|losartana|enalapril|anlodipino|espironolactona)"),
    ("infeccao", r"(infecção|infeccao|itu|cistite|pielonefrite|e. coli|sepse|bactéria)"),
    ("oncologia_renal", r"(mieloma|cadeias leves|bence jones|onconefrologia|tumor|carcinoma|renal cell|cancer|quimioterapia|checkpoint|ici)"),
]

def infer_category(q_txt, exp_txt):
    combined = (q_txt + " " + exp_txt).lower()
    for cat, pattern in cat_keywords:
        if re.search(pattern, combined):
            return cat
    return "nefrologia_geral"

# Let's rebuild the rapid-quiz.js content with enriched formatting
new_lines = []
new_lines.append("const RAPID_QUIZ_QUESTIONS = [")

for match in matches:
    q_txt, ans_txt, exp_txt = match.groups()
    
    # Calculate a stable 8-char hex qid based on q_txt
    qid = hashlib.md5(q_txt.encode('utf-8')).hexdigest()[:8]
    
    # Infer category
    cat = infer_category(q_txt, exp_txt)
    
    # Default difficulty to medium
    diff = "medium"
    
    # Format nicely with indentation and double quotes for keys and string values, or clean single quotes,
    # let's write it in clean standard JSON format for keys/values
    # (RAPID_QUIZ_QUESTIONS is a JS array, so we can write standard formatting)
    ans_val = "true" if ans_txt == "true" else "false"
    
    # Escape quotes inside strings for safety
    q_escaped = q_txt.replace('"', '\\"')
    exp_escaped = exp_txt.replace('"', '\\"')
    
    new_lines.append(f'  {{')
    new_lines.append(f'    "qid": "{qid}",')
    new_lines.append(f'    "cat": "{cat}",')
    new_lines.append(f'    "diff": "{diff}",')
    new_lines.append(f'    "q": "{q_escaped}",')
    new_lines.append(f'    "ans": {ans_val},')
    new_lines.append(f'    "exp": "{exp_escaped}"')
    new_lines.append(f'  }},')

# Remove trailing comma on last item for cleanliness
if len(new_lines) > 1:
    new_lines[-1] = new_lines[-1].rstrip(',')

new_lines.append("];")

enriched_content = "\n".join(new_lines)

# Write back rapid-quiz.js
with open("data/rapid-quiz.js", "w", encoding="utf-8") as f:
    f.write(enriched_content)

print("rapid-quiz.js enriched successfully with qid, cat, and diff.")
