#!/usr/bin/env python3
"""
fix_topics_newlines.py
Corrige quebras de linha literais dentro das strings JavaScript
em const topics = [] do index.html.

O apply_reviews.py não escapava \\n, \\r, \\t nas strings — este script
conserta o index.html já gerado sem precisar re-rodar a revisão GPT-4o.

USO:
  python fix_topics_newlines.py
"""

HTML_FILE = "index.html"

def fix_js_strings_in_topics(html):
    start = html.find("const topics = [")
    end   = html.find("\n];", start) + 3
    if start == -1:
        raise ValueError("const topics = [ não encontrado no HTML")

    section = html[start:end]
    result  = []
    in_str  = False
    i = 0

    while i < len(section):
        c = section[i]
        if in_str:
            if c == "\\":
                # Caractere escapado — preserva os dois chars
                result.append(c)
                i += 1
                if i < len(section):
                    result.append(section[i])
            elif c == '"':
                in_str = False
                result.append(c)
            elif c == "\n":
                result.append("\\n")      # literal \n → \\n
            elif c == "\r":
                result.append("\\r")
            elif c == "\t":
                result.append("\\t")
            else:
                result.append(c)
        else:
            if c == '"':
                in_str = True
                result.append(c)
            else:
                result.append(c)
        i += 1

    fixed_section = "".join(result)

    # Conta quantas correções foram feitas
    original_newlines = section.count("\n", section.find('"'))
    return html[:start] + fixed_section + html[end:], original_newlines

def main():
    print(f"Lendo {HTML_FILE}...")
    with open(HTML_FILE, encoding="utf-8") as f:
        html = f.read()

    print("Corrigindo quebras de linha em strings JavaScript...")
    fixed_html, n_fixes = fix_js_strings_in_topics(html)

    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(fixed_html)

    print(f"Correções aplicadas: ~{n_fixes} linhas verificadas")
    print(f"Salvo: {HTML_FILE}")
    print("\nVerifique o app — o login deve funcionar agora.")

if __name__ == "__main__":
    main()
