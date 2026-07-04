# criar-nefroquest

Skill para criação científica, pedagógica e implementação de questões inéditas do NefroQuest.

## Instalação no projeto

Extraia a pasta `criar-nefroquest` em:

```text
.claude/skills/criar-nefroquest/
```

O arquivo principal deve ficar em:

```text
.claude/skills/criar-nefroquest/SKILL.md
```

## Teste

Dentro do Claude Code:

```text
/skills
```

Depois:

```text
/criar-nefroquest Crie uma questão intermediária sobre síndrome do desequilíbrio da diálise e implemente no repositório.
```

Também deve ativar automaticamente em pedidos inequívocos de criação.

## Sem dependências

A skill não possui hooks, scripts Python ou comandos automáticos. Ela usa apenas as ferramentas já disponíveis no Claude Code e os validadores do próprio repositório.

## Integração

Leia `INTEGRACAO-COM-REVISOR.md` e adicione a regra sugerida ao `CLAUDE.md` para separar criação e revisão.
