# NefroQuest — Regras de Decisão e Prioridade

## Matriz de priorização

| Impacto | Esforço | Decisão |
|---------|---------|---------|
| Alto | Baixo | Executar imediatamente |
| Alto | Alto | Dividir em etapas menores, executar em partes |
| Baixo | Baixo | Executar se conveniente, sem urgência |
| Baixo | Alto | Evitar ou descartar — não vale o custo |

---

## Preferência por solução pontual

Sempre preferir a solução mais cirúrgica. Exemplos:

- Botão desalinhado → ajustar CSS daquele seletor, não reorganizar o arquivo
- Texto errado → corrigir o texto, não extrair para variável de i18n
- Bug em função → corrigir a função, não refatorar o módulo
- Feature lenta → otimizar o caminho crítico, não reescrever do zero

Refatoração ampla só se justifica quando:
1. O problema é sistêmico (afeta muitos lugares) E
2. A refatoração é o caminho mais curto para resolver os casos afetados E
3. O usuário aprovou explicitamente

---

## Quando dizer não

Dizer não (com explicação e alternativa) quando a solicitação:
- Aumenta complexidade sem ganho claro de UX ou performance
- Introduz abstração para uso hipotético futuro ("vai ser útil depois")
- Requer tocar em código de alto risco (auth, pagamento, banco de questões) sem necessidade direta
- Duplica funcionalidade já existente de outra forma

Não concordar automaticamente. Apontar o risco e oferecer uma alternativa executável.

---

## Mudança visual

- Mudança visual pontual (cor, espaçamento, fonte) **não justifica** reestruturação de HTML
- Novo componente visual **não justifica** criação de sistema de componentes reutilizáveis se não há demanda concreta
- Ajuste de responsividade **não justifica** reescrever o layout inteiro

---

## Features novas

Nenhuma feature nova entra sem:
1. Aprovação explícita do usuário
2. Escopo definido antes de começar o código
3. Confirmação de que não conflita com funcionalidades existentes

Não implementar nada do roadmap (`docs/ROADMAP.md`) sem pedido explícito — o roadmap é referência de direção, não lista de execução automática.

---

## Dúvida sobre escopo

Se não está claro o que fazer, perguntar antes de executar. Preferível uma pergunta rápida a um PR que precisa ser revertido.

Exemplos de quando perguntar:
- "Essa mudança afeta X — devo incluir X no PR ou abrir separado?"
- "Encontrei Y enquanto trabalhava em Z — corrijo agora ou listo para depois?"
- "Há duas abordagens: A (simples, limitada) ou B (complexa, completa) — qual prefere?"

---

## Ordem de execução quando há múltiplas tarefas

1. Bugs que impedem uso do app → imediato
2. Bugs visuais/UX em produção → alta prioridade
3. Melhorias de performance → média prioridade
4. Novas features → conforme roadmap e aprovação
5. Refatorações → só quando diretamente necessário para outra tarefa
6. Documentação → após o código estar estável
