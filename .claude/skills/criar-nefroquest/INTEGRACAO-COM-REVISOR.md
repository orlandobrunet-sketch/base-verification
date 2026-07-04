# Integração com revisar-nefroquest

As duas skills devem ter fronteiras claras:

- `criar-nefroquest`: produzir questão nova.
- `revisar-nefroquest`: avaliar ou corrigir questão existente.

## Vocabulário compartilhado (v2)

`revisar-nefroquest` v2 usa **7 vereditos** (Handbook §19) como saída principal de qualquer avaliação:

**aprovada · aprovada com pequenos ajustes · revisão maior · reprovada · fundir · redirecionar · aposentar**

`criar-nefroquest` não produz veredito de avaliação — seu produto é o item pronto, não um julgamento sobre item existente. A única sobreposição de vocabulário é conceitual: o **teste leve de Advogado do Recurso** (ver `SKILL.md` e [references/output-contract.md](references/output-contract.md)) que `criar-nefroquest` aplica antes de entregar um item como pronto é o mesmo princípio do Advogado do Recurso completo (Handbook §16) que `revisar-nefroquest` aplica como etapa obrigatória de revisão — só que em versão leve, feita pelo próprio autor no momento da criação, não substituindo a revisão formal.

## Regra recomendada para CLAUDE.md

```markdown
## Roteamento obrigatório de questões médicas

Use `criar-nefroquest` sempre que a tarefa envolver criar, gerar, elaborar, adicionar ou implementar uma questão médica nova.

Use `revisar-nefroquest` sempre que a tarefa envolver avaliar, corrigir, atualizar, reescrever ou excluir uma questão já existente. O veredito de `revisar-nefroquest` é sempre um dos 7 vereditos v2 (aprovada · aprovada com pequenos ajustes · revisão maior · reprovada · fundir · redirecionar · aposentar).

Quando a tarefa pedir substituir uma questão existente por outra, aplique primeiro os critérios de `revisar-nefroquest` para identificar o defeito (produzindo um dos 7 vereditos) e depois `criar-nefroquest` para produzir o novo item.

Não revise ou crie questões médicas apenas com instruções gerais quando a skill correspondente estiver disponível.
```

## Ajuste recomendado na descrição da skill antiga

Para reduzir acionamento simultâneo, mantenha fora da descrição de `revisar-nefroquest` os verbos "cria" e "criar questão nova" isolados. Ela ainda pode reescrever uma questão existente (vereditos "aprovada com pequenos ajustes" e "revisão maior") ou redirecionar/fundir questões, mas criação inédita deve ser roteada para `criar-nefroquest`.

*(Este arquivo não altera `revisar-nefroquest` — descreve apenas a integração do ponto de vista de `criar-nefroquest`.)*
