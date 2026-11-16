# Veredito

**aprovada**. Papel: AUTORAL, sem independência. Confiança: moderada.
Evidência: VERIFICADA. Pendência: NENHUMA. Autorização de publicação: LIBERADA, derivada; integração exige revisão independente.

# OP declarado e classificação

Relacionar clivagem de IgG pela imlifidase à janela transitória e persistência da produção de anticorpos.
Antes: {"op":"Relacionar clivagem de IgG pela imlifidase à janela transitória e persistência da produção de anticorpos.","primaryCompetence":"Mecanismo terapêutico aplicado à dessensibilização do transplante.","bloom":"Aplicar","miller":"Sabe como","difficultyAuthored":"hard","difficultyIntrinsic":"medium"}. Depois: {"op":"Relacionar clivagem de IgG pela imlifidase à janela transitória e persistência da produção de anticorpos.","primaryCompetence":"Mecanismo terapêutico aplicado à dessensibilização do transplante.","bloom":"Aplicar","miller":"Sabe como","difficultyIntrinsic":"medium","difficultyAuthored":"medium"}.

# Justificativa

OP e conceito correto preservados; reescrita de forma e correção das referências/metadados antes de nova aprovação.

# Problemas encontrados

MAIOR — Alternativa correta é a única que explica o mecanismo com ressalva; os distratores usam permanência/irreversibilidade como pista.
MENOR — Bula atual é suficiente para o mecanismo; o documento UK30/07/2026 sustenta o mecanismo; não foi apresentado como SmPC vigente da UniãoEuropeia.

# Advogado do Recurso

Nenhum argumento plausível de anulação.
Na proposta A1.1: nenhum argumento plausível identificado autoralmente.

# Eliminatórios

Original: nenhum eliminatório disparado.
Proposta A1.1: os10 eliminatórios foram reavaliados; nenhum disparado.

# NQ Editorial Score

Original: 14/20.
Proposta: alinhamento ao OP: 2/2; validade de conteúdo: 2/2; validade de construto: 2/2; enunciado: 2/2; alternativas: 2/2; distratores: 2/2; explicação: 2/2; referências: 2/2; ausência de pistas formais/AI-tells: 2/2; valor pedagógico: 1/2. Total 19/20.

# Decisão (árvore §19)

Versão proposta aprovada na checagem autoral pela árvore§19; ciclo pretendido publicado somente após revisão independente do pacote exato.

# Patch editorial sugerido

SUBSTITUIR A QUESTÃO POR:

## Pergunta

Candidato altamente sensibilizado recebe oferta de rim de doador falecido contra o qual o teste de compatibilidade cruzada (crossmatch) é positivo. A imlifidase converte rapidamente o teste em negativo, mas a equipe mantém imunossupressão padrão e vigilância para rejeição mediada por anticorpos. São monitorados os anticorpos específicos contra o doador (DSA), da classe imunoglobulina G (IgG). Qual mecanismo explica tanto o efeito rápido quanto seu caráter transitório?

## Alternativas

**A**  
Clivagem enzimática de IgG, inclusive DSA, com persistência das células produtoras.

**B**  
Depleção de linfócitos B e plasmócitos, com supressão duradoura da produção de DSA.

**C**  
Inibição de C5, preservando anticorpos e bloqueando a lise mediada por complemento.

**D**  
Remoção de IgG por adsorção extracorpórea, sem impedir a síntese de novos anticorpos.

## Resposta correta

A — Clivagem enzimática de IgG, inclusive DSA, com persistência das células produtoras.

## Explicação

A imlifidase cliva enzimaticamente todas as subclasses de IgG, inclusive DSA, e permite rápida conversão do crossmatch. Não é uma terapia de depleção das células produtoras: a IgG endógena começa a retornar em 1–2 semanas. Por isso, é necessário confirmar a conversão antes do implante, manter a imunossupressão padrão e vigiar rejeição. Depleção celular, bloqueio de C5 e adsorção extracorpórea representam estratégias diferentes e não descrevem a ação da imlifidase.

## Referências sugeridas

```javascript
hansa_imlifidase_smpc_2026: {
  "label": "Idefirix — Bula profissional do Reino Unido (30/07/2026)",
  "url": "https://www.medicines.org.uk/emc/product/13155/smpc",
  "journal": "Hansa Biopharma AB — SmPC do Reino Unido, PLGB 46323/0002 (emc)",
  "ano": 2026,
  "tipo": "Resumo das Características do Medicamento (SmPC)",
  "badge": "BULA",
  "badgeColor": "#64748b",
  "impacto": "Clivagem transitória de imunoglobulina G; manter imunossupressão e vigilância",
  "icon": "📋",
  "resumo": "Resumo das Características do Medicamento (SmPC) para imlifidase, revisão de 30/07/2026 do titular Hansa Biopharma AB, no Reino Unido. Indicada para dessensibilização de adultos altamente sensibilizados, com crossmatch positivo contra doador falecido e baixa chance por alocação. A protease de Streptococcus pyogenes cliva as cadeias pesadas de todas as subclasses de imunoglobulina G (IgG), incluindo anticorpos específicos contra o doador (DSA), sem clivar outras imunoglobulinas. A IgG endógena começa a retornar em 1–2 semanas. Não dispensa imunossupressão padrão.",
  "conclusao": "Confirmar crossmatch negativo antes do transplante e manter imunossupressão e vigilância de rejeição: a clivagem não equivale a suprimir permanentemente a produção de anticorpos.",
  "curiosidade": "A clivagem elimina funções dependentes de Fc, incluindo citotoxicidade dependente de complemento e de células."
}
```


## Observação de implementação

OP primário, competência e conceito correto continuam reconhecíveis; nenhum reset de FSRS.
Nenhuma edição no repositório. Os literais e hashes exatos estão no JSON A1.1. ready=false até revisão independente.

## Verificação de fontes

- [imlifidase](https://www.medicines.org.uk/emc/product/13155/smpc): corpo integral da bula profissional do fabricante publicada no emc. §4.1–4.2, linhas249–263 / indicação, crossmatch e imunossupressão padrão; §5.1, linhas418–426 / protease, todas subclasses IgG, DSA e retorno1–2semanas; §7–10, linhas518–537: titular Hansa Biopharma AB, PLGB46323/0002; revisão30/07/2026. É bula UK publicada pelo titular, não documento EMA nem bulaFDA. Página EMA abriu e confirma indicação, imunossupressão e autorização condicional; atualização16/10/2026, titularUE SERBSA. PDFs EMA retornaram429. Nenhuma equivalência automática de vigência UK/UE foi presumida. Taxonomia BULA/SmPC autorizada pontualmente pelo parent em15/11/2026; não equivale a liberação clínica.
