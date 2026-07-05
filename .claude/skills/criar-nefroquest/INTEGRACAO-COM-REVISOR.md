# Integração com revisar-nefroquest

As duas skills devem ter fronteiras claras:

- `criar-nefroquest`: produzir questão nova.
- `revisar-nefroquest`: avaliar ou corrigir questão existente.

## Vocabulário compartilhado (v2)

`revisar-nefroquest` v2 usa **7 vereditos** (Handbook §19) como saída principal de qualquer avaliação:

**aprovada · aprovada com pequenos ajustes · revisão maior · reprovada · fundir · redirecionar · aposentar**

`criar-nefroquest` não produz veredito de avaliação — seu produto é o item pronto, não um julgamento sobre item existente. A única sobreposição de vocabulário é conceitual: o **teste leve de Advogado do Recurso** (ver `SKILL.md` e [references/output-contract.md](references/output-contract.md)) que `criar-nefroquest` aplica antes de entregar um item como pronto é o mesmo princípio do Advogado do Recurso completo (Handbook §16) que `revisar-nefroquest` aplica como etapa obrigatória de revisão — só que em versão leve, feita pelo próprio autor no momento da criação, não substituindo a revisão formal.

## Fronteira de autorização de publicação (Handbook §18.4)

- `criar-nefroquest` **nunca** emite campo de Veredito editorial e **nunca** retorna Autorização de publicação LIBERADA, por mais completo que o item pareça. Todo item que ela produz sai com **Autorização de publicação: BLOQUEADA — motivo: aguardando revisão editorial formal pela revisar-nefroquest**, independentemente do status de evidência (mesmo VERIFICADA) ou da natureza da pendência (mesmo NENHUMA).
- `revisar-nefroquest` é a **única** skill responsável por emitir um dos 7 vereditos editoriais e a **única** capaz de derivar Autorização de publicação LIBERADA — e só quando as condições canônicas do Handbook §18.4 forem satisfeitas (evidência adequada + veredito de aprovação).
- O teste leve de Advogado do Recurso de `criar-nefroquest` (Etapa 10 do `SKILL.md`) é autoauditoria do autor no momento da criação — **não substitui** o Advogado do Recurso completo (Handbook §16) nem qualquer parte da revisão formal.
- **Consequência para implementação no repositório:** `criar-nefroquest` **NÃO PODE** escrever em `data/topics.js` um item que ela mesma acabou de criar, porque ele nasce BLOQUEADO. Implementação direta só é permitida quando houver comprovação, no contexto atual, de que o item já passou por `revisar-nefroquest`, recebeu veredito de aprovação e está com Autorização = LIBERADA (Handbook §18.4). Sem essa comprovação, `criar-nefroquest` entrega só o pacote da questão (BLOQUEADA) e encaminha para revisão formal — nunca edita o banco por conta própria.

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
