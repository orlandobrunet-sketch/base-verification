# 17.13 — primeiras prioridades do relatório das 35 superfícies

Execução autorizada pelo proprietário em 13/11/2026. Base publicada: 17.12, merge `06f27f1a6e77c58f8cbe5481d16a6adeae62bfaf`. Este lote não significa conclusão das 35 superfícies.

## Mudanças

- Revisão agendada contém somente cards persistidos, com data válida vencida e questão existente. Estudo Livre continua com 20 questões. As entradas do Estudo e as contagens do Painel concordam, inclusive com registros antigos inválidos. Sem reparo automático do registro nem mudança de FSRS.
- Seleção de personagem aproxima retrato, atributos e bônus no celular; a história permanece integral no mesmo contexto. Troca de retrato de 200 ms em área reservada, com indicação de imagem lenta/falha, proteção contra resposta antiga e respeito a movimento reduzido. Dez estágios, confirmação e cancelamento nativos preservados.
- Prova mantém número da questão e relógio reais numa faixa aderente. Teclado e aumento de fonte revelam o mesmo foco abaixo da faixa. Resultado e fechamento desconectam o observador. Duração e prazo absoluto preservados.
- Leitura móvel alinhada à esquerda; alternativas ficam imóveis ao errar. Correção entra por opacidade em 200 ms, respeitando movimento reduzido e mantendo nota, recursos e ações.
- Ranking oferece tentativa junto do erro, conserva filtro e modo, impede cargas duplicadas e descarta resposta fora de contexto. Antes de desabilitar o botão focado, transfere foco à busca editável estável.
- Atualização falha oferece tentativa no próprio contexto. Destino só é consumido após limpeza conferida. A mudança não apaga progresso ou autenticação.

## Causas e provas preservadas

O cabeçalho aderente era impedido pelo `overflow:auto` do body, apesar de o documento controlar a rolagem. A prova de causa manteve scrollY 569 e mudou somente esse overflow: topo da faixa de −493 para 0. O reparo é restrito à Prova. Aumento de fonte ao vivo deixou o foco fora da área visível em dois perfis; a correção passou 2/2.

A primeira rodada nativa de 54 casos passou 44 e reprovou dez: décimo ponto removido (quatro), sonda anterior ao handler nativo de imagem (dois), recuperação de foco (dois) e tentativa presa ao token anterior após troca de titular (dois). Traces e resultados preservados. A sonda agora observa no quadro seguinte, mantendo a expectativa exata de 200 ms; nenhum produto foi alterado para atender à sonda. Os cenários que pararam no primeiro ciclo de 16 px não certificam texto a 200%.

Os testes Node antigos da Prova tinham um objeto de página sem querySelector e style. O suporte DOM foi completado, mantendo as asserções e executando o controlador real. Respostas e cinema: 129/129 aprovações, zero falhas/skips. Sintaxe, diff e versão aprovados.

Nesta revisão, os 26 casos afetados estão em conferência no snapshot imutável final. CI do HEAD, integração Git, Pages e conferência pública são condições adicionais de publicação. Os resultados finais ficam no PR; resultados parciais não equivalem a aprovação.

## Limites e continuidade

Conteúdo médico, referências, histórico, catálogo de respostas, economia, autenticação e regras de pagamento preservados. O manifesto recebe somente o release técnico 17.13. A intermitência histórica 191 continua aberta: esta entrega não prova sua causa. Celular emulado; sem nova certificação de serviços reais, leitor de tela falado ou aparelhos físicos.

Próxima etapa preparada externamente: detalhe de Competências, prévia da sessão no Mapa, atividade recente dos motivos de erro sem reconstruir alternativas históricas, Portal, primeiro acesso, Preferências e navegação nas páginas de apoio. Cada recorte mantém revisão e prova próprias. O escopo não inclui novas funcionalidades clínicas ou administrativas.
