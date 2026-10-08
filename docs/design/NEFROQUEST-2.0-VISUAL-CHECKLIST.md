# NefroQuest 2.0 — checklist do lançamento visual

Escopo solicitado em 08/10/2026. Base técnica: 15.93, commit `083ac7c26cde01aea500c3cb826ddfa4af5fe4f0`. A versão pública 2.0 usa o identificador técnico 15.95 para cache/Sentry, preservando saves e histórico. Os caminhos de evidência 15.94 identificam a primeira rodada do mesmo escopo.

Nenhum item clínico, regra de dificuldade, requisito de evolução, custo, permissão ou algoritmo está incluído nesta mudança visual.

| Item solicitado | Responsável | Estado / validação |
| --- | --- | --- |
| Produção 15.93: HTML, JS, CSS, SW, versão e favicons | principal | 58/58 URLs conferidas com os bytes do commit publicado; relatório externo `verification-drafts/public-host-083ac7c26cde-1791431739967.json` |
| Julgamento: explicação sem vazamento em 320 px/200% | reprodução fixa | Corrigido; questão 8e763ea6, vermelho antes; 20 passes/2 skips, zero falhas/flakies/retries depois |
| Forja: retrato centralizado na própria coluna | principal | Implementado; centro da imagem conferido na própria coluna em 1440/1100 e estado inicial mobile |
| Forja: card grande vermelho translúcido | principal | Implementado; quatro cenários com decisões reais aprovados; cabeçalho mobile refinado e dois cenários a 200% aprovados |
| Equipamentos: nitidez, recorte íntegro, molduras e preview | equipamentos | 61 PNGs auditados; contain, três masters 1024 sob demanda e fallback 384; 22 casos distintos aprovados |
| Grimório: orientação centralizada, metadados preservados | dashboard | Implementado; frase centralizada, metadados 536/191/345 preservados |
| Seu ritmo: resumo à esquerda, comparação dinâmica à direita | dashboard | Implementado; resumo à esquerda e comparação dinâmica à direita |
| Estudo e revisão: coluna direita com fundo levemente mais claro | dashboard | Implementado na coluna direita inteira |
| Visão geral: espaço acima do título | dashboard | Implementado; espaço e leitura dos títulos conferidos |
| Dashboard: voltar à direita do cabeçalho da sidebar | dashboard | Implementado; alvo e foco conferidos |
| Competências: contorno do radar contínuo e fechado | dashboard | Implementado; caminho contínuo fechado, valores preservados |
| Trilha de evolução: atual, próxima e silhueta seguinte; detalhes reais | dashboard | Implementado; artes originais, silhueta por classe, XP+acertos reais; níveis 1/9/10 conferidos |
| Conquistas: coleção compacta, estados, detalhes e celebração | conquistas | Implementado; filtros, detalhes, celebrações e conquistadas primeiro;15 PASS/3 SKIP no freeze; logout/trocaSDK4 PASS |
| Conquistas: cinco artes policromáticas distintas, favoritos preservados | conquistas | Cinco artes novas e 20 derivados;12 especiais byte a byte preservados; rastreabilidade em NEFROQUEST-2.0-ACHIEVEMENT-ART.json |
| Mapa de prática clínica: descrição usa largura disponível no desktop | dashboard | Implementado; largura e leitura conferidas |
| Grimório: descrição principal usa largura disponível no desktop | dashboard | Implementado; largura e metadados preservados |
| Fase final/Demonstração: apresentação completa, sandbox protegido | boss | UI inteira renovada com arte original;34 PASS incluindo HP, drawer, áudio, menu, sandbox, reload e duas abas |
| Átrio: cores discretas por função no menu direito | átrio/ritual/ranking | Cinco rotas com acentos semânticos, estados e alvos conferidos |
| Ritual: apresentação moderna; oito perguntas e diagnóstico preservados | átrio/ritual/ranking | UI renovada; oito perguntas, adaptação, FSRS e recomendações preservadas |
| Ranking: popup preservado, apresentação, foco/Escape/retorno | átrio/ritual/ranking | UI sobre popup original; foco/Escape/reabertura conferidos; rodada final8 PASS/2 SKIP |
| Átrio: três princípios visíveis no primeiro viewport desktop | átrio/ritual/ranking | Princípios contidos em 1280×720/1440×900/1100×800; mobile a 200% permite leitura natural |
| Landing: card adaptativo em cor translúcida distinta do azul | landing | Implementado com acento quente e translucidez; ação preservada |
| Landing: nove retratos reconciliados com as artes atuais do jogo | landing | Três classes×níveis 01/05/10 canônicos 768, sem cópia duplicada ou nova pintura |
| Landing: boss reposicionado à esquerda sem cortar elementos essenciais | landing | Enquadramento responsivo aprovado em nove cenários;18 PASS da suite01 |
| Acesso: ícone oficial multicolorido Google; OAuth preservado | principal | PNG e fonte oficiais locais; proporção, círculo branco e ação OAuth preservados; origem em assets/images/GOOGLE-BRAND-SOURCES.md |
| Dificuldade: cores semânticas para hover, seleção e foco | principal | Quatro acentos em hover/seleção/foco; 6 PASS finais, 12 estados capturados; labels contidos em320/390 a 200% e Hardcore vermelho |
| Motor adaptativo: status ATIVO | principal | Rótulo Ativo corrigido; Hardcore Desativado; algoritmo intacto |
| Novidades: resumo fiel do entregue, versão pública 2.0 e histórico preservado | principal | Entrada 2.0 fiel ao escopo, histórico preservado; leitura/foco/fechamento conferidos |
| Auditoria de atualização 15.93 → versão técnica seguinte, sem perda de dados | principal | 18 PASS release/portal; respostas antigas/malformadas preservam versão; downgrade normal/--check rejeitado sem escrita; upgrade com SW real, cache/assets e save/histórico confirmados |
| Testes, cache/versionamento no mesmo commit, CI, publicação e conferência pública | principal | Reparos do primeiro CI incluídos com cache15.95/pública 2.0; aguardam Quality/Smoke/Full no head final, Pages e bytes públicos |

As evidências locais usam Chromium de testes isolado, sem perfil pessoal e com dados de fixture. Referências de screenshots da Library são inspecionadas pelo fluxo permitido; quando a cópia local não funciona, a interface real e os assets originais servem de referência.

As contagens identificam rodadas locais e não se somam quando cobrem os mesmos casos. Os testes locais não substituem a CI no head final. A produção 15.93 permanece publicada até os gates da 2.0 passarem.

Relatórios por área, relativos ao workspace: `verification-drafts/dashboard-15.94/README.md` (70 PASS e 30 capturas), `visual-evidence/atrium-ritual-ranking-15.94/README.md`, `visual-evidence/equipment-15.94/IMPLEMENTACAO-EQUIPAMENTOS.md`, `verification-drafts/boss-lumen-20261008.md`, `landing-evidence/README.md` e `forge-root-qa/README.md`. [Rastreabilidade das artes](NEFROQUEST-2.0-ACHIEVEMENT-ART.json) contém prompts e SHA256 dos cinco masters/20 derivados e 12 originais especiais; masters de geração ficam fora do bundle.

A revisão técnica independente confere sintaxe/referências e compara regras por AST. Correções de acessibilidade incluem modais estáticos ocultos, foco/Tab/timer da gaveta, desmontagem de detalhes na troca de conta e propriedade de Escape das dicas. A fonte GoogleSans da ação nova é local; outras fontes remotas bloqueadas limitam as capturas locais aos fallbacks. Nenhum perfil pessoal ou backend real foi usado.

O relatório final de publicação deverá registrar commit, run de CI, artefatos, skips/flakies, Pages e auditoria dos bytes públicos. Nenhum gate é presumido aprovado por testes anteriores.
