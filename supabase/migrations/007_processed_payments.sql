-- Migration 007: tabela de pagamentos processados para idempotência do webhook
CREATE TABLE IF NOT EXISTS processed_payments (
    payment_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    plan TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilita Row Level Security (RLS)
ALTER TABLE processed_payments ENABLE ROW LEVEL SECURITY;

-- Por padrão, sem políticas explícitas, nenhum usuário anon ou authenticated terá acesso de leitura ou escrita a esta tabela.
-- Apenas a chave de service_role (usada pela Edge Function) terá acesso total.
