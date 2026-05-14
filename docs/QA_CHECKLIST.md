# NefroQuest — QA Checklist

Verificar todos os itens antes de considerar um PR pronto para merge.

---

## Funcionalidade core

- [ ] App abre sem erros no console (DevTools → Console, zero erros vermelhos)
- [ ] Login com Google funciona
- [ ] Login com e-mail funciona
- [ ] Logout funciona
- [ ] Questões carregam e aparecem corretamente
- [ ] Respostas são registradas (correto/errado com feedback visual)
- [ ] Pontuação incrementa corretamente
- [ ] Streak ativa e desativa conforme acertos/erros
- [ ] Vidas decrementam ao errar (modo normal)
- [ ] Ranking carrega (leaderboard com dados)
- [ ] Nova jornada inicia corretamente

---

## Layout e responsividade

- [ ] Mobile (375px de largura): layout sem quebra, botões clicáveis, sem overflow horizontal
- [ ] Desktop (1280px+): layout sem quebra, colunas visíveis, espaço lateral aproveitado
- [ ] Zoom (browser 125–150%): card da landing não esmagado, scroll funcional

---

## Identidade visual

- [ ] Cores da paleta preservadas (fundo escuro, dourado, roxo)
- [ ] Tipografia Cinzel/Philosopher mantida nos elementos corretos
- [ ] Fundo `bg-hall.jpg` visível nas laterais em desktop
- [ ] Bordas ornamentais douradas presentes nos cards principais
- [ ] Sem visual SaaS genérico introduzido inadvertidamente

---

## Conteúdo e assets

- [ ] Conteúdo médico não foi alterado
- [ ] Assets (imagens, sons) não foram substituídos sem necessidade
- [ ] `data/topics.js` não foi modificado

---

## Arquivos e escopo

- [ ] `CLAUDE.md` não foi alterado
- [ ] Apenas os arquivos necessários para a tarefa foram modificados
- [ ] Nenhum arquivo fora do escopo foi tocado

---

## Service Worker

- [ ] Se `style.css` ou `js/*.js` foram alterados: `version.json` e `sw.js` estão com versão incrementada no mesmo commit
- [ ] Versão em `sw.js` (linha 2: `const CACHE`) bate com `version.json`
- [ ] Não há risco de cache quebrado em produção

---

## PR

- [ ] Título descritivo seguindo convenção: `fix(...)`, `feat(...)`, `docs:`, `chore:`
- [ ] PR é pequeno e revisável em menos de 10 minutos
- [ ] Arquivos alterados listados na descrição do PR
- [ ] Instruções de como testar incluídas na descrição
