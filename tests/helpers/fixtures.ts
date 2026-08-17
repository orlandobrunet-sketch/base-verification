/**
 * Fixtures canônicos da Central de Comando.
 *
 * Consolidam o objeto de save que estava copiado à mão em vários specs: quando
 * o schema mudar, é um arquivo a tocar em vez de sete — e não dá para atualizar
 * seis e esquecer o sétimo.
 *
 * Adotado por: 21, 23, 25, 26, 27, 29, 30.
 *
 * NÃO adotado por 18 e 20, e isto é deliberado. A nota original supunha que os
 * nove specs declaravam o mesmo objeto; medindo campo a campo, não declaram:
 *
 *  - 18 (Átrio) usa um save de jornada salva com `xpToNext: 9999` e sem os
 *    campos de partida em andamento;
 *  - 20 (Calibração) usa um save mínimo e compara a STRING JSON exata para
 *    provar que cancelar não altera o save.
 *
 * Nos dois casos o recorte enxuto é o que está sob teste. Enfiá-los aqui daria
 * consolidação no papel e divergência no uso — o oposto do objetivo.
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
