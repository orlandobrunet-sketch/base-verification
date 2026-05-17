-- Coluna para sincronização de progresso entre dispositivos/browsers
-- Garante que limpar dados de navegação não apaga conquistas e saves de usuários logados

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS game_progress jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.game_progress IS 'Progresso do jogo sincronizado na nuvem: stats, conquistas, questões dominadas, artigos desbloqueados, partida em andamento';
