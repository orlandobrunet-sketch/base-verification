# Captopril, MDRD e dois experimentos — reconciliação formal autoral

Sem aplicação. Há uma correção completa de referência, duas reavaliações de corpos sustentados e cinco corpos que permanecem bloqueados. Metadados comprovados não são autorização clínica.

| Registro | Obra | Veredito do corpo/card | Evidência / pendência | Autorização |
|---|---|---|---|---|

| ref:lewis_ieca_dn_1993 | Lewis1993, PMID8413456 | aprovada | VERIFICADA / NENHUMA | LIBERADA autoral |

| article:5 | 10.1172/JCI112528 | revisão maior | PARCIALMENTE VERIFICADA / DECISIVA | BLOQUEADA |

| article:117 | 10.1172/JCI112013 | revisão maior | PARCIALMENTE VERIFICADA / DECISIVA | BLOQUEADA |

| article:7 | 10.1056/NEJM199403313301301 | aprovada | VERIFICADA / NENHUMA | LIBERADA |

| article:122 | 10.1056/NEJM199403313301301 | revisão maior | PARCIALMENTE VERIFICADA / DECISIVA | BLOQUEADA |

| article:132 | 10.1056/NEJM199403313301301 | revisão maior | PARCIALMENTE VERIFICADA / DECISIVA | BLOQUEADA |

| article:43 | 10.7326/0003-4819-130-6-199903160-00002 | aprovada | VERIFICADA / NENHUMA | LIBERADA |

| article:125 | 10.7326/0003-4819-130-6-199903160-00002 | revisão maior | PARCIALMENTE VERIFICADA / DECISIVA | BLOQUEADA |

## Captopril — 12 campos exatos

URL primária confirmada: DOI10.1056/NEJM199311113292004, não NEJM199311253292103. A dose histórica foi conferida na bula oficial que descreve o mesmo ensaio. A correção não cria outro card e não reescreve questões consumidoras.

```json
{
  "label": "Lewis EJ et al. — Captopril in Diabetic Nephropathy (NEJM 1993)",
  "url": "https://www.nejm.org/doi/full/10.1056/NEJM199311113292004",
  "journal": "N Engl J Med 1993;329(20):1456-1462",
  "ano": 1993,
  "tipo": "Ensaio clínico randomizado",
  "badge": "RCT",
  "badgeColor": "#10b981",
  "impacto": "Captopril reduziu o risco de duplicação da creatinina na nefropatia diabética tipo1 estudada.",
  "icon": "🔬",
  "resumo": "ECR multicêntrico (n=409), em DM1 com nefropatia estabelecida, proteinúria ≥500 mg/dia e creatinina sérica ≤2,5 mg/dL, comparando captopril 25 mg 3x/dia vs placebo. O desfecho primário foi duplicação da creatinina sérica: 12,1% no grupo captopril vs 21,3% no placebo, com redução de risco de aproximadamente 48% (P=0,007). O composto de morte, diálise ou transplante também foi reduzido, e o benefício excedeu o esperado apenas pela diferença pressórica.",
  "conclusao": "Captopril reduziu a deterioração renal na população estudada de diabetes tipo 1 com nefropatia proteinúrica. A redução do desfecho primário de duplicação da creatinina foi distinta da redução do composto de morte, diálise ou transplante.",
  "curiosidade": "A redução de 48% refere-se à duplicação da creatinina; a de 50%, ao composto de morte, diálise ou transplante. Nenhuma delas significa redução de mortalidade isolada."
}
```

## article:5

**Identidade:** Autores e citação única conferidos contra registro primário. DOI `10.1172/JCI112528`.

**Corpo:** O corpo generaliza o benefício experimental de enalapril a IECA/BRA sem delimitar humanos/modelo, e a curiosidade menciona BRA não testados. O abstract confirma a comparação no modelo de ratos, mas não libera esse corpo por correção da citação. Manter resumo separado e trancado até revisão/reparo médico próprio.

**Gate:** revisão maior; PARCIALMENTE VERIFICADA; DECISIVA; BLOQUEADA.

**Fonte:** [3011863](https://pubmed.ncbi.nlm.nih.gov/3011863/) — Metadados e abstract integral lidos; 1986, seis grupos, comparaçãoenalapril versus terapia tripla com controle pressórico sistêmico; obra diferente da1985.

**Oito campos editoriais completos; raridade separada preservada:**

```json
{
  "titulo": "Nefroproteção com enalapril em modelo experimental (1986)",
  "autores": "Anderson S, Rennke HG, Brenner BM",
  "jornal": "J Clin Invest. 1986;77(6):1993–2000. DOI: 10.1172/JCI112528",
  "resumo": "Demonstração experimental de que a redução da pressão intraglomerular via bloqueio do SRAA limitou esclerose glomerular e proteinúria independentemente da PA sistêmica.",
  "conclusao": "A hemodinâmica glomerular é alvo terapêutico independente. IECA protegem o rim além do efeito anti-hipertensivo.",
  "curiosidade": "Base conceitual da nefroproteção moderna! IECA/BRA não são apenas anti-hipertensivos, são nefroprotetores.",
  "ano": 1986,
  "impacto": "Fundamento da nefroproteção farmacológica"
}
```

Raridade: `épico`. Corpo inalterado `sha256:12013c764b3921ca37a91626bce4eba255c251ef32c0ac3125cbe60a3811bf92`; literal completo antes `sha256:b06653046eec38cd9fb9c0192301e92bc7ade9bcea5a7cb5b113717ac44f6174`, depois `sha256:777eb7fbca7fbf7b42f1fad5cb957c769f6181676acf16af1f694d87ce758eeb`.

## article:117

**Identidade:** Título distintivo e modelo descrito identificam1985; corrige citação/ano contaminados por outro artigo. DOI `10.1172/JCI112013`.

**Corpo:** O título aponta especificamente ao artigo1985; a citação1986 e o ano1988 estavam misturados. O corpo mantém afirmação de preservação de barreira mecânica e história da hipótese que não foram verificadas no alcance primário aberto. O dado de identidade não resolve essas afirmações; manter variante clínica trancada.

**Gate:** revisão maior; PARCIALMENTE VERIFICADA; DECISIVA; BLOQUEADA.

**Fonte:** [2993362](https://pubmed.ncbi.nlm.nih.gov/2993362/) — Metadados e abstract integral lidos; 1985, quatro grupos de ratos, enalapril, 4/8semanas; autoresAnderson/Meyer/Rennke/Brenner.

**Oito campos editoriais completos; raridade separada preservada:**

```json
{
  "titulo": "Control of glomerular hypertension limits glomerular injury in rats with reduced renal mass",
  "autores": "Anderson S, Meyer TW, Rennke HG, Brenner BM",
  "jornal": "J Clin Invest. 1985;76(2):612–619. DOI: 10.1172/JCI112013",
  "resumo": "Demonstração experimental do conceito de que a redução da pressão intraglomerular limita a esclerose e protege o néfron contra hiperfiltração adaptativa após perda de massa renal.",
  "conclusao": "A redução da hipertensão glomerular via bloqueio de angiotensina II preserva a barreira mecânica e retarda a esclerose residual.",
  "curiosidade": "Barry M. Brenner desenvolveu a famosa hipótese da hiperfiltração glomerular, sugerindo que a perda de néfrons causa sobrecarga mecânica adaptativa nos néfrons restantes.",
  "ano": 1985,
  "impacto": "Base conceitual de toda a terapia de nefroproteção hemodinâmica moderna."
}
```

Raridade: `lendário`. Corpo inalterado `sha256:b2e258d0619858c7795df0d795c511908094e2987f5ac38caf25b34a12e7d19b`; literal completo antes `sha256:62f8679a2f86b1016d733109e32510c7d094917575284ef625afa62b228a37ec`, depois `sha256:4ed042bbcdc9151d59a298f874737d5686f70cbb66e7cf8e9eff9192a6bf872f`.

## article:7

**Identidade:** Autores e citação única conferidos contra registro primário. DOI `10.1056/NEJM199403313301301`.

**Corpo:** Conferido no primário no alcance necessário, sem alteração do texto. Revisão autoral, não independente.

**Gate:** aprovada; VERIFICADA; NENHUMA; LIBERADA.

**Fonte:** [8114857](https://pubmed.ncbi.nlm.nih.gov/8114857/) — Metadados e abstract integral lidos; relatório de intervenções de1994, não equação nem publicação estendida de1997.

[OPENED_FULL_PRIMARY_PAPER_OFFICIAL_NIDDK_REPRINT](https://repository.niddk.nih.gov/public/study_document/Documentation/Descriptive/FINAL_Analysis_Integrity_Dec14_2005.pdf) — O PDF não é tratado como novo ensaio de2005. É a reprodução identificada do documento primário de1994; leitura das seções relevantes confirma as afirmações exatas dearticle7.

**Oito campos editoriais completos; raridade separada preservada:**

```json
{
  "titulo": "MDRD Study",
  "autores": "Klahr S, Levey AS, Beck GJ et al.",
  "jornal": "N Engl J Med 1994;330(13):877-884. DOI: 10.1056/NEJM199403313301301",
  "resumo": "MDRD (1994): n=840 em dois ensaios randomizados, comparando restrição proteica e metas pressóricas usual vs mais baixa em doença renal crônica, por seguimento médio de 2,2 anos. No estudo 1, n=585, o declínio projetado da TFG em três anos não diferiu significativamente entre grupos. No estudo 2, n=255, dieta muito hipoproteica com suplemento vs hipoproteica apresentou diferença de 0,8 mL/min/ano no declínio da TFG (IC 95% −0,1 a 1,8; P=0,07). Não houve diferença significativa em mortes ou critérios de interrupção entre grupos. Os resultados não demonstram benefício global inequívoco das estratégias; sinais relacionados à proteinúria devem ser distinguidos da análise principal. NEJM.",
  "conclusao": "Distinguir análise global, fase inicial de queda da TFG e subgrupos. Este ensaio não estabelece sozinho uma meta pressórica atual para todo paciente com DRC.",
  "curiosidade": "A publicação de 1994 avalia intervenções; não deve ser confundida com o artigo posterior de desenvolvimento da equação MDRD.",
  "ano": 1994,
  "impacto": "Interpretação de resultados globais e subgrupos em DRC"
}
```

Raridade: `épico`. Corpo inalterado `sha256:73adecaa887b74e8e990a1d31747c5bfb4721e10e9dd1321f6c9bd31fb00d55f`; literal completo antes `sha256:9ba8bc97c7166bd28becbd3ee15d15cab58bd493bbac790d190437c35d77a7e2`, depois `sha256:9ba8bc97c7166bd28becbd3ee15d15cab58bd493bbac790d190437c35d77a7e2`.

## article:122

**Identidade:** Autores e citação única conferidos contra registro primário. DOI `10.1056/NEJM199403313301301`.

**Corpo:** A frase conjunta de que restrição proteica e metas baixas retardam a queda em subgrupos proteinúricos confunde inferências. No corpo primário, a interação com proteinúria foi da intervenção pressórica; o efeito dietético não se relacionou à proteinúria basal. A identidade1994 está confirmada, mas esse resumo exige reparo médico independente.

**Gate:** revisão maior; PARCIALMENTE VERIFICADA; DECISIVA; BLOQUEADA.

**Fonte:** [8114857](https://pubmed.ncbi.nlm.nih.gov/8114857/) — Metadados e abstract integral lidos; relatório de intervenções de1994, não equação nem publicação estendida de1997.

[OPENED_FULL_PRIMARY_PAPER_OFFICIAL_NIDDK_REPRINT](https://repository.niddk.nih.gov/public/study_document/Documentation/Descriptive/FINAL_Analysis_Integrity_Dec14_2005.pdf) — O PDF não é tratado como novo ensaio de2005. É a reprodução identificada do documento primário de1994; leitura das seções relevantes confirma as afirmações exatas dearticle7.

**Oito campos editoriais completos; raridade separada preservada:**

```json
{
  "titulo": "MDRD — Restrição proteica e controle da pressão (1994)",
  "autores": "Klahr S, Levey AS, Beck GJ et al.",
  "jornal": "N Engl J Med. 1994;330(13):877–884. DOI: 10.1056/NEJM199403313301301",
  "resumo": "Estudo clínico central (Modification of Diet in Renal Disease) avaliando o efeito de dieta hipoproteica e controle de PA na progressão da DRC crônica.",
  "conclusao": "A restrição proteica e metas de PA mais baixas retardam o declínio de TFG em subgrupos selecionados com proteinúria marcante.",
  "curiosidade": "Apesar dos resultados primários neutros, o banco de dados do estudo deu origem à fórmula MDRD para cálculo de TFG estimada.",
  "ano": 1994,
  "impacto": "Desenvolvimento do MDRD e elucidação da restrição proteica na DRC."
}
```

Raridade: `épico`. Corpo inalterado `sha256:de62bd188b70b90c54c017c1157aca05a99143506135cc66b00f13ed090a2f3a`; literal completo antes `sha256:3ade42131a8dd5a81463e09d2a083e798e737db9766ea787b7fee2ee56f9c57e`, depois `sha256:a65809d48157ab217659dc77c6b5892115c94b76387caa476aa29d6bde7a7e25`.

## article:132

**Identidade:** A citação explícita de periódico/volume/páginas identifica1994. A prosa de análise estendida não é validada, permanece em hold e não é tratada como publicação separada comprovada. DOI `10.1056/NEJM199403313301301`.

**Corpo:** O corpo se apresenta como análise estendida e garante benefício de longo prazo e limiar >1g/dia. A citação é o relatório1994, com média2,2anos, resultado global sem benefício inequívoco e análise de subgrupo. Essas frases não são aprovadas por corrigir ano/título. Se a intenção fosse outro follow-up, seria necessário identificar a publicação correspondente antes de remapeá-lo.

**Gate:** revisão maior; PARCIALMENTE VERIFICADA; DECISIVA; BLOQUEADA.

**Fonte:** [8114857](https://pubmed.ncbi.nlm.nih.gov/8114857/) — Metadados e abstract integral lidos; relatório de intervenções de1994, não equação nem publicação estendida de1997.

[OPENED_FULL_PRIMARY_PAPER_OFFICIAL_NIDDK_REPRINT](https://repository.niddk.nih.gov/public/study_document/Documentation/Descriptive/FINAL_Analysis_Integrity_Dec14_2005.pdf) — O PDF não é tratado como novo ensaio de2005. É a reprodução identificada do documento primário de1994; leitura das seções relevantes confirma as afirmações exatas dearticle7.

**Oito campos editoriais completos; raridade separada preservada:**

```json
{
  "titulo": "MDRD — Restrição proteica e controle da pressão (1994)",
  "autores": "Klahr S, Levey AS, Beck GJ et al.",
  "jornal": "N Engl J Med. 1994;330(13):877–884. DOI: 10.1056/NEJM199403313301301",
  "resumo": "Análise estendida do estudo MDRD avaliando o efeito de metas tensionais rígidas na prevenção do declínio progressivo da TFG em pacientes portadores de nefropatia de base.",
  "conclusao": "Metas de PA sistólica baixas garantem benefício renal em longo prazo, com proteção contra progressão restrita a pacientes com proteinúria >1g/dia.",
  "curiosidade": "Os dados deste estudo moldaram as metas de PA mais baixas para doentes renais com proteinúria nas diretrizes do JNC e KDIGO.",
  "ano": 1994,
  "impacto": "Demonstrou a indicação de metas pressóricas individualizadas na DRC proteinúrica."
}
```

Raridade: `épico`. Corpo inalterado `sha256:924932e73f992a648799bc17bcebbb03788536878cd80464113307ac5992285d`; literal completo antes `sha256:aaea9c39048132e3ad584aa22e265304bee4538210e40627ddfe39a501cacd12`, depois `sha256:1ed98c97c904cc5c1a88d2a4e58bcfcf65ad841ce48a570516780a9ec6a76a41`.

## article:43

**Identidade:** Autores e citação única conferidos contra registro primário. DOI `10.7326/0003-4819-130-6-199903160-00002`.

**Corpo:** Conferido no primário no alcance necessário, sem alteração do texto. Revisão autoral, não independente.

**Gate:** aprovada; VERIFICADA; NENHUMA; LIBERADA.

**Fonte:** [10075613](https://pubmed.ncbi.nlm.nih.gov/10075613/) — Metadados e abstract integral lidos; estudo transversal de desenvolvimento/validação1999, seis variáveis. O reprint externo falhou por certificado e não é alegado como fonte aberta.

**Oito campos editoriais completos; raridade separada preservada:**

```json
{
  "titulo": "Estudo MDRD",
  "autores": "Levey AS, Bosch JP, Lewis JB et al.",
  "jornal": "Ann Intern Med 1999;130(6):461-470. DOI: 10.7326/0003-4819-130-6-199903160-00002",
  "resumo": "Equação MDRD (1999): n=1.628 participantes com doença renal crônica, em estudo transversal de desenvolvimento e validação de uma equação para estimar a taxa de filtração glomerular (TFG). A amostra foi dividida em desenvolvimento (n=1.070) e validação (n=558); a equação foi comparada à depuração de creatinina medida e à fórmula de Cockcroft–Gault. Na validação, o modelo explicou 90,3% da variância do logaritmo da TFG; as depurações medida e estimada por Cockcroft–Gault superestimaram a TFG em 19% e 16%, respectivamente. Demonstrou melhor estimativa na população estudada, sem testar metas pressóricas ou intervenções para preservar a função renal. Não foi um ensaio de tratamento: não há efeito terapêutico ou comparação de segurança medicamentosa a resumir. Annals of Internal Medicine.",
  "conclusao": "O artigo de 1999 desenvolveu e validou uma equação de estimativa da TFG. Não demonstrou benefício de uma meta de pressão arterial ou de uma intervenção nefroprotetora.",
  "curiosidade": "A seleção aleatória das amostras de desenvolvimento e validação não transforma este estudo transversal em ensaio clínico randomizado.",
  "ano": 1999,
  "impacto": "Desenvolvimento e validação de uma equação de estimativa da TFG em DRC"
}
```

Raridade: `épico`. Corpo inalterado `sha256:bc0f2a7beecb84ee0161f9bc6661f5ee07170ea8a331fe1c84b1d708fc171c04`; literal completo antes `sha256:3796af70e5fc7cd31564a0d01667f9be5b923ede9327e2a65c77f0f3ab817d83`, depois `sha256:3796af70e5fc7cd31564a0d01667f9be5b923ede9327e2a65c77f0f3ab817d83`.

## article:125

**Identidade:** Autores e citação única conferidos contra registro primário. DOI `10.7326/0003-4819-130-6-199903160-00002`.

**Corpo:** O resumo diz que o artigo1999 publicou a equação de4variáveis, enquanto o abstract primário inclui creatinina, idade, sexo, raça, ureia e albumina. A própria curiosidade menciona a original de6variáveis, mas essa contradição permanece. Identidade1999 confirmada; corpo4variáveis não liberado.

**Gate:** revisão maior; PARCIALMENTE VERIFICADA; DECISIVA; BLOQUEADA.

**Fonte:** [10075613](https://pubmed.ncbi.nlm.nih.gov/10075613/) — Metadados e abstract integral lidos; estudo transversal de desenvolvimento/validação1999, seis variáveis. O reprint externo falhou por certificado e não é alegado como fonte aberta.

**Oito campos editoriais completos; raridade separada preservada:**

```json
{
  "titulo": "MDRD — Desenvolvimento da equação de estimativa da TFG (1999)",
  "autores": "Levey AS, Bosch JP, Lewis JB et al.",
  "jornal": "Ann Intern Med. 1999;130(6):461–470. DOI: 10.7326/0003-4819-130-6-199903160-00002",
  "resumo": "Publicação da equação MDRD de 4 variáveis para estimativa da Taxa de Filtração Glomerular a partir da creatinina sérica, idade, sexo e etnia, derivada dos dados do estudo MDRD.",
  "conclusao": "A estimativa da TFG pela equação MDRD é superior ao clearance de creatinina urinário de 24 horas cego e facilita o estadiamento clínico da DRC.",
  "curiosidade": "A fórmula original utilizava 6 variáveis, incluindo albumina sérica e nitrogênio ureico, mas a versão simplificada de 4 variáveis tornou-se o padrão comercial de laboratório.",
  "ano": 1999,
  "impacto": "Criou a equação MDRD, mudando a linguagem de diagnóstico da DRC por quase duas décadas."
}
```

Raridade: `lendário`. Corpo inalterado `sha256:d94a15e47149fa9fd17471e22eb2b96e2e715638c87a6972a4f87c964ae6d09f`; literal completo antes `sha256:29d2bf92bc4e425b75c2dda5f9d7822d2888fa29d4e2e96863849efe8d2f9f4e`, depois `sha256:e0bf9a35c0094e89c6256675b81b6c08676e09fddfa8489e828f3658f34b16ab`.

## Agrupamentos de identidade propostos

- captopril_diabetic_nephropathy_1993: ref:lewis_ieca_dn_1993, article:6. Preservar cada corpo e seu cadeado. Publicação não decorre do grupo.

- mdrd_intervention_1994: article:7, article:122, article:132. Preservar cada corpo e seu cadeado. Publicação não decorre do grupo.

- mdrd_equation_1999: article:43, article:125. Preservar cada corpo e seu cadeado. Publicação não decorre do grupo.

**Não agrupar5/117:** obras distintas1986 e1985. Nem uma citação contaminada nem o tema comum autorizam colapsá-las.

**Artigo6:** identidade captopril confirmada, sem nova avaliação completa ou alteração do seu corpo; não herda o gate do card de referência.

**Implementação:** nenhuma exclusão, reindexação, substituição de corpo ou transferência de histórico. Itens BLOQUEADOS não podem ser copiados como aprovados.

SHA256 dos BYTES JSON via crypto.update(Buffer): `6ea54d006d326893fb9c62d308d13e955d822e89456decb7c2438b9efd15d98d`.
