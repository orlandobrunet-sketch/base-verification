# NefroQuest — Workflow de Desenvolvimento

## Princípio

**Menor mudança possível que resolve o problema.** Cada PR deve ser pequeno, focado e reversível. Código que já funciona não precisa ser tocado.

---

## Antes de qualquer alteração

1. Ler `CLAUDE.md` — entender contexto, stack e regras do projeto
2. Ler o documento de referência da tarefa em `docs/` quando existir
3. Identificar **apenas** os arquivos necessários para a mudança
4. Confirmar o escopo com o usuário se houver ambiguidade

---

## Regras de escopo

- **Não abrir escopo além do pedido.** Se a tarefa é ajustar CSS de um botão, não reorganizar o arquivo inteiro
- **Não refatorar além do necessário.** Código feio que funciona não é bug — não "melhorar" sem pedido explícito
- **Não criar abstrações para uso hipotético futuro.** Três linhas repetidas são melhores que uma abstração prematura
- **Não adicionar error handling para cenários impossíveis.** Confiar nas garantias do framework e do código existente
- **Não adicionar comentários explicando o que o código faz.** Só comentar o porquê quando não for óbvio

---

## Regras de proteção

| O que não tocar | Por quê |
|----------------|---------|
| `CLAUDE.md` | Instruções operacionais — alterar só com pedido explícito |
| `data/topics.js` | Conteúdo médico — requer autorização |
| `data/articles.js`, `data/refs.js` | Idem |
| Assets sem necessidade | Substituir imagem/som pode quebrar experiência aprovada |
| Arquivos fora do escopo da tarefa | Efeitos colaterais imprevisíveis |

---

## Regra de Service Worker (crítica)

**Todo PR que altere `style.css`, `js/*.js` ou qualquer asset estático DEVE incluir no mesmo commit:**

```bash
# sw.js linha 1-2:
const CACHE = 'nefroquest-vX.XX';  # incrementar

# version.json:
{"version": "X.XX"}  # mesmo número
```

Se o bump não está no mesmo commit que o fix, o Service Worker continua servindo o arquivo antigo do cache após o merge. O usuário não vê a mudança. **Nunca abrir PR separado de version bump.**

---

## Estrutura de um PR

1. Branch a partir de `main`
2. Commit único (ou poucos commits coesos) com:
   - As mudanças necessárias
   - O bump de versão (se assets foram alterados)
3. Título descritivo: `fix(landing): ...`, `feat(dashboard): ...`, `docs: ...`
4. PR revisável em menos de 10 minutos

---

## Ao concluir uma tarefa

Sempre informar:

1. **Arquivos alterados** — lista completa
2. **Como testar** — passos específicos para verificar que funcionou
3. **Riscos de regressão** — o que pode ter sido afetado indiretamente

---

## Quando pedir confirmação

Antes de executar, perguntar ao usuário quando:
- O escopo da tarefa é ambíguo
- A mudança afeta mais de 3 arquivos não relacionados
- Há risco de regressão em funcionalidade crítica (auth, pagamento, questões)
- A abordagem tem trade-offs relevantes que o usuário deve conhecer

Não concordar automaticamente com tudo. Apontar riscos e sugerir alternativas quando necessário.

---

## Deploy

```bash
# Verificar versão em sincronia antes de fazer PR
grep -o "nefroquest-v[0-9.]*" sw.js
cat version.json

# Push para branch de trabalho
git push -u origin claude/fix-analytics-service-worker-MEeIh
```

Nunca fazer push direto para `main` (branch protegida).
