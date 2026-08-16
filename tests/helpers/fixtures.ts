/**
 * Fixtures canônicos da Central de Comando.
 *
 * Nove specs (18, 20, 21, 23, 25, 26, 27, 29, 30) declaram o mesmo objeto de
 * save copiado à mão. Quando o schema mudar, serão nove arquivos a tocar — e
 * é fácil atualizar oito.
 *
 * Este módulo é o destino dessa consolidação. A migração NÃO foi feita junto
 * com a sua criação de propósito: mexer em nove specs de uma vez, no fim de
 * uma sequência longa de entregas, troca um risco concreto (quebrar cobertura
 * que hoje funciona) por uma conveniência futura. A adoção deve ser feita spec
 * a spec, com a suíte rodando entre cada uma.
 *
 * Ao migrar um spec, substitua a constante local por:
 *
 *   import { saveBase, statsBase } from '../helpers/fixtures';
 *   const SAVE = saveBase({ level: 3, correctTotal: 12 });
 */

/** Save de um jogador em meio de jornada — o caso mais usado nos specs. */
export function saveBase(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 6,
    level: 6, xp: 210, xpToNext: 480, score: 4820,
    lives: 4, maxLives: 4, streak: 3, gold: 640,
    difficulty: 'normal', correctTotal: 47,
    character: 'nephros', selectedCharacter: 'nephros',
    gameStarted: true, gameOver: false,
    idx: 0, queueIds: [], recentIds: [],
    chestsOpened: 5, narrativeShown: 2, bossIntroShown: false,
    timestamp: Date.now(),
    ...overrides,
  };
}

/** Estatísticas detalhadas com amostra em alguns domínios clínicos. */
export function statsBase(overrides: Record<string, unknown> = {}) {
  return {
    totalQuestions: 96, totalCorrect: 61, totalWrong: 35,
    byCategory: {
      glomerular: { correct: 18, wrong: 6 },
      drc: { correct: 9, wrong: 14 },
    },
    dailyActivity: {},
    ...overrides,
  };
}

/** Chave de dia no formato usado por dailyActivity, N dias atrás. */
export function diaChave(offset: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
