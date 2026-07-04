# Implementação no repositório

## 1. Inspeção antes da edição

Localizar:

- banco de questões;
- schema real;
- campos obrigatórios;
- registro de referências;
- convenção de IDs;
- categorias e dificuldades válidas;
- índice do gabarito;
- mecanismo de versionamento/cache;
- scripts de validação.

Ler questões vizinhas e uma referência existente do mesmo tipo.

## 2. Não presumir

Não presumir que:

- `ans` é zero-based;
- referências ficam no mesmo arquivo;
- toda mudança exige bump de versão;
- service worker deve ser alterado;
- IDs são UUID ou hash;
- categoria aceita qualquer string.

Verificar no código.

## 3. Duplicidade

Pesquisar:

- título semelhante;
- objetivo idêntico;
- enunciado parafraseado;
- referência já cadastrada;
- qid/id duplicado;
- card órfão ou já usado.

Uma nova redação do mesmo conceito não é automaticamente uma questão nova útil.

## 4. Alteração mínima

Adicionar apenas o necessário:

- item;
- referência nova, se necessária;
- registro/import correspondente;
- versionamento/cache apenas se convenção exigir.

Não reorganizar arquivos extensos nem formatar conteúdo não relacionado.

## 5. Validação mínima

Confirmar:

- arquivo parseia;
- objeto/JSON/JS está sintaticamente válido;
- quatro opções;
- índice dentro do intervalo;
- gabarito corresponde ao texto;
- ID único;
- referência existe;
- nenhuma referência órfã criada;
- categoria/dificuldade válidas;
- caracteres especiais preservados;
- aplicação/build continua funcionando quando houver comando disponível.

## 6. Comandos

Usar comandos já existentes em `package.json`, README, Makefile ou scripts do projeto.

Não inventar comando de teste.

Quando um hook falhar de forma não bloqueante, distinguir falha do hook de falha da edição e informar qual validação deixou de ocorrer.

## 7. Diff final

Revisar:

- conteúdo médico;
- letra/índice;
- aspas e escapes;
- versão/cache;
- alterações acidentais;
- referências e IDs;
- consistência com questões vizinhas.

## 8. Relato

Informar somente:

- o que foi criado;
- onde foi alterado;
- quais fontes sustentam;
- quais testes foram executados;
- o que ficou pendente.

Nunca afirmar que a publicação está validada se não houve validação suficiente.
