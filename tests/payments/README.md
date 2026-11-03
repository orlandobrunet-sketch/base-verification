# Pagamentos: testes sem produção

```powershell
cd tests/payments
npm ci --ignore-scripts
npm test
```

Sem configuração, os testes executam a migration 020 em PostgreSQL embarcado
(PGlite, banco descartável em memória). O webhook real é executado com Deno
simulado e a resposta do Mercado Pago substituída; a gravação usa a migration
real, não uma imitação da regra de pagamento.

A CI usa PostgreSQL 17 em um serviço descartável e executa também os dois
cenários de concorrência com conexões independentes. Para reproduzir esse modo,
defina `NQ_PAYMENTS_DATABASE_URL` apontando exclusivamente para um PostgreSQL
local com banco chamado `nq_payments_test` e usuário com permissão para criar
roles. O runner recusa outros hosts e nomes de banco. **As tabelas de teste são
esvaziadas entre cenários.**

O esquema de teste contém somente as colunas consumidas pela migration; não
certifica os demais componentes do Supabase, o checkout nem um pagamento real.
Os dois testes de concorrência ficam explicitamente ignorados no PGlite, que
tem uma única conexão.

## Ativação em produção

1. O proprietário aplica `supabase/migrations/020_atomic_mp_payment.sql` no SQL
   Editor do projeto, preservando as migrations anteriores.
2. Depois publica `mp-webhook` com `supabase functions deploy mp-webhook`.

O merge não executa nenhuma dessas duas etapas. Se o webhook novo for publicado
antes da migration, a chamada RPC falha e devolve 500, para permitir nova
tentativa; não deve ser tratado como ativação concluída.
