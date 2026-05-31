// NefroQuest — Minigame: A Câmara do Equilíbrio (Ácido-Base)
// Plain script — shares global scope with game.js
// Fase 1: hub + Caso 1 (Ferreiro Aldric — acidose metabólica + Winter)

(function(){
  const AB_KEY = 'nq-acidbase-progress';
  const AB_OVERLAY_ID = 'acidBaseOverlay';

  // ── Persistência ────────────────────────────────────────────────────────
  function _loadProgress(){
    try { return JSON.parse(localStorage.getItem(AB_KEY) || '{}'); }
    catch { return {}; }
  }
  function _saveProgress(p){
    try { localStorage.setItem(AB_KEY, JSON.stringify(p)); } catch {}
  }
  function _markCompleted(caseId, grimoireUses){
    const p = _loadProgress();
    p.completed = Array.isArray(p.completed) ? p.completed : [];
    if (!p.completed.includes(caseId)) p.completed.push(caseId);
    p.grimoireUses = p.grimoireUses || {};
    p.grimoireUses[caseId] = (p.grimoireUses[caseId] || 0) + (grimoireUses || 0);
    _saveProgress(p);
    // Aciona a conquista "Alquimista Renal" (zerar os 6 casos), se elegível.
    try { if (typeof checkAchievements === 'function') checkAchievements(); } catch {}
  }

  // ── Geradores de valores randomizados (clinicamente plausíveis) ─────────
  // Cada caso é construído a cada partida: gasometria sorteada dentro de
  // faixas válidas, alvos (Winter, AG) e explicações recalculados nos
  // valores reais → replay sem decorar.
  function _rand(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
  function _r1(n){ return Math.round(n * 10) / 10; }
  function _r2(n){ return Math.round(n * 100) / 100; }
  // Henderson–Hasselbalch: pH = 6,1 + log10(HCO3 / (0,03 × PaCO2))
  function _ph(HCO3, PaCO2){ return _r2(6.1 + Math.log10(HCO3 / (0.03 * PaCO2))); }
  function _be(HCO3, PaCO2){ return Math.round((HCO3 - 24) - 0.4 * (40 - PaCO2)); }

  // ── Mesa de Cartas (Ato V — Diagnósticos Diferenciais) ──────────────────
  // Cada carta carrega o mecanismo fisiopatológico (cadeia causal) e o "why"
  // (por que é compatível ou por que é armadilha).
  function _makeCard(id, title, clue, mechanism, correct, why){
    return { id, title, clue, mechanism, correct, why };
  }
  function _shuffle(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // Monta um ato do tipo 'cards'. Embaralha as cartas no build (estável durante
  // a partida — _renderAct reutiliza este array, inclusive ao voltar pelos dots).
  function _buildCardsAct({ prompt, instruction, cards, grimoire }){
    return { kind: 'cards', prompt, instruction, cards: _shuffle(cards), grimoire };
  }

  function _buildAldric(){
    // Acidose metabólica com AG alto (acidose láctica por esforço/calor)
    const HCO3 = _rand(8, 13);                       // metabolic acidosis moderada–grave
    const Na   = _rand(136, 142);
    const AG   = _rand(18, 22);                      // claramente elevado
    const Cl   = Na - AG - HCO3;                     // calculado p/ fechar o AG sorteado
    const alb  = _r1(3.8 + Math.random() * 0.4);     // normal → sem correção
    const K    = _r1(3.8 + Math.random() * 1.2);
    const winterExpected = _r1(1.5 * HCO3 + 8);      // alvo do Winter
    const PaCO2 = Math.round(winterExpected + (Math.random() * 4 - 2)); // dentro do Winter
    const pH = _ph(HCO3, PaCO2);
    const BE = _be(HCO3, PaCO2);
    // Log para verificação rápida no DevTools: confirme que os valores na
    // gasometria, prompts e explicações batem com este snapshot.
    try { console.info('[Câmara] Aldric rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, winterExpected, AG }); } catch {}

    return {
      narrative: 'O ferreiro <strong>Aldric</strong> chega à câmara cambaleando. Trabalhou 14h diante da forja sob calor extremo, sem pausa para água. Apresenta fraqueza intensa, taquipneia profunda e mucosas secas. Você colhe a gasometria arterial.',
      gas: { pH, PaCO2, HCO3, BE, Na, Cl, K, alb },
      acts: [
        {
          kind: 'mc',
          prompt: '<strong>Ato I — Distúrbio primário.</strong><br>Analisando pH, PaCO₂ e HCO₃⁻, qual o distúrbio primário?',
          options: [
            { label: 'Acidose metabólica', correct: true },
            { label: 'Acidose respiratória', correct: false },
            { label: 'Alcalose metabólica', correct: false },
            { label: 'Alcalose respiratória', correct: false }
          ],
          explainCorrect: `pH ${pH} → <strong>acidemia</strong> (< 7,35). HCO₃⁻ ${HCO3} mEq/L (baixo) acompanha a acidemia → distúrbio primário é <strong>metabólico</strong>. PaCO₂ ${PaCO2} mmHg também está baixo (taquipneia), sugerindo compensação respiratória em curso — <em>adequada ou não, será calculado no Ato II</em>.`,
          explainWrong: {
            'Acidose respiratória': `Numa acidose respiratória primária, PaCO₂ estaria <em>alto</em> e HCO₃⁻ subiria para compensar. Aqui PaCO₂ ${PaCO2} está baixo.`,
            'Alcalose metabólica': `Alcalose teria pH > 7,45 e HCO₃⁻ alto. Aqui pH ${pH} (ácido) e HCO₃⁻ ${HCO3} (baixo).`,
            'Alcalose respiratória': `Alcalose teria pH > 7,45. Aqui pH ${pH}.`
          }
        },
        {
          kind: 'num',
          prompt: `<strong>Ato II — Compensação esperada (Winter).</strong><br>Calcule a PaCO₂ esperada pela compensação respiratória.`,
          grimoire: { title: 'Fórmula de Winter', body: '<code>PaCO₂ esperado = 1,5 × HCO₃⁻ + 8 (±2)</code><br>Aplica-se apenas a <em>acidose metabólica</em>.' },
          unit: 'mmHg',
          target: winterExpected,
          tolerance: 2,
          explainCorrect: `PaCO₂ esperada = 1,5 × ${HCO3} + 8 = <strong>${winterExpected} mmHg (±2)</strong>. O valor real (${PaCO2}) está dentro da faixa → a compensação respiratória é <strong>adequada</strong>. Não há distúrbio respiratório associado.`,
          explainWrong: `Reveja: 1,5 × ${HCO3} = ${_r1(1.5*HCO3)}. Some 8 → ${winterExpected}. Tolerância ±2.`
        },
        {
          kind: 'num',
          prompt: `<strong>Ato III — Ânion gap.</strong><br>Calcule o AG sérico (albumina = ${alb} g/dL).`,
          grimoire: { title: 'Ânion gap', body: '<code>AG = Na⁺ − (Cl⁻ + HCO₃⁻)</code><br>Normal: 8–12 mEq/L. Corrigir para albumina: <code>AG_corrigido = AG + 2,5 × (4 − alb)</code>.' },
          unit: 'mEq/L',
          target: AG,
          tolerance: 1,
          explainCorrect: `AG = ${Na} − (${Cl} + ${HCO3}) = <strong>${AG} mEq/L</strong> (alto, normal 8–12). Albumina ${alb} g/dL → sem correção significativa. <strong>AG elevado</strong> indica acúmulo de ácido orgânico — investigar <strong>lactato</strong> (exercício extremo + hipovolemia).`,
          explainWrong: `AG = Na − (Cl + HCO₃). Aqui: ${Na} − (${Cl} + ${HCO3}) = ${AG}.`
        },
        _buildCardsAct({
          prompt: '<strong>Ato IV — Conselho dos Diagnósticos Diferenciais.</strong><br>Selecione <em>todas</em> as causas que também produzem este padrão (acidose metabólica com ânion gap alto).',
          instruction: 'Marque todas as causas compatíveis. Algumas cartas são armadilhas.',
          cards: [
            _makeCard('sepsis_lactate', 'Sepse / choque', 'Lactato alto, AG elevado, taquipneia', 'Hipoperfusão e disfunção mitocondrial desviam o piruvato para lactato; o HCO₃⁻ é consumido ao tamponar o H⁺, elevando o ânion gap.', true, 'Causa clássica de acidose com AG alto; pode somar alcalose respiratória pela hiperventilação inflamatória.'),
            _makeCard('dka', 'Cetoacidose diabética', 'Hiperglicemia, cetonúria, Kussmaul', 'A falta de insulina libera ácidos graxos que o fígado converte em cetoácidos (β-hidroxibutirato/acetoacetato), ânions não medidos que consomem HCO₃⁻.', true, 'Uma das principais causas de AG alto; procure glicemia, cetonas e o gatilho (infecção, omissão de insulina).'),
            _makeCard('alcoholic_ka', 'Cetoacidose alcoólica', 'Etilismo + jejum, cetose', 'Álcool e jejum elevam o NADH e esgotam o glicogênio; a lipólise gera β-hidroxibutirato, acumulando ânions não medidos.', true, 'Produz AG alto com glicemia normal ou baixa; responde a soro glicosado e tiamina.'),
            _makeCard('uremia', 'Uremia / DRC avançada', 'TFG muito baixa, fosfato alto', 'A queda da TFG reduz a excreção de ácidos fixos e retém sulfato e fosfato — ânions não medidos que elevam o AG.', true, 'Na DRC avançada a retenção de ânions fixos eleva o AG; indica álcali e, se grave, diálise.'),
            _makeCard('ethylene_glycol', 'Etilenoglicol', 'Ingestão tóxica, gap osmolar, IRA', 'Metabolizado pela álcool-desidrogenase a glicolato e oxalato, que consomem HCO₃⁻ e elevam o AG; o oxalato precipita e causa IRA.', true, 'AG alto + gap osmolar elevado + IRA; antídoto é fomepizol e, se grave, hemodiálise.'),
            _makeCard('salicylate', 'Intoxicação por salicilato', 'Zumbido, taquipneia, febre', 'Estimula o centro respiratório (alcalose respiratória) e desacopla a fosforilação oxidativa, gerando ácidos orgânicos (AG alto).', true, 'Padrão misto típico: AG alto somado a alcalose respiratória.'),
            _makeCard('diarrhea', 'Diarreia', 'Perda fecal volumosa, AG normal', 'Perde o HCO₃⁻ rico no fluido intestinal; o Cl⁻ sobe para manter a eletroneutralidade → acidose com AG normal (hiperclorêmica).', false, 'Armadilha: causa acidose, mas hiperclorêmica (AG normal), não AG alto.'),
            _makeCard('vomiting', 'Vômitos', 'Perda de conteúdo gástrico', 'Remove HCl gástrico → perde H⁺ e Cl⁻, gerando alcalose metabólica, não acidose.', false, 'Armadilha: gera alcalose metabólica, o oposto deste caso.'),
            _makeCard('rta1', 'ATR tipo 1 (distal)', 'Hipocalemia, pH urinário alto', 'A falha da secreção distal de H⁺ gera acidose, mas com Cl⁻ alto e AG normal (hiperclorêmica).', false, 'Armadilha: acidose com AG normal e hipocalemia, não AG alto.')
          ],
          grimoire: {
            title: 'Diagnóstico diferencial por padrão ácido-base',
            body: 'O objetivo não é decorar listas, mas reconhecer mecanismos que reproduzem o mesmo padrão. Para AG alto, lembre o <strong>GOLD MARK</strong>: Glicóis, Oxoprolina, L-/D-Lactato, Metanol, Aspirina, Renal (uremia), Cetoacidose.'
          }
        }),
        {
          kind: 'mc',
          prompt: `<strong>Ato V — Conduta clínica.</strong><br>Qual é a sua conduta inicial?`,
          grimoire: {
            title: 'Bicarbonato em acidose metabólica grave — BICAR-ICU',
            body: 'Jaber S et al. <em>Lancet</em> 2018;392:31-40. Bicarbonato de sódio reduziu mortalidade em 28 dias no subgrupo com <strong>pH ≤ 7,20 + AKI KDIGO 2/3</strong> (acidose mista metabólica grave). Fora desse subgrupo, sem benefício e com riscos (hipernatremia, hipocalcemia, alcalose paradoxal intracelular). Tratar primeiro a causa da acidose.'
          },
          options: [
            { label: 'Bolus de bicarbonato de sódio 8,4% IV imediato', correct: false },
            { label: 'Reposição volêmica com cristaloide + investigar causa do AG alto (lactato, função renal)', correct: true },
            { label: 'Intubação e hiperventilação mecânica', correct: false },
            { label: 'Hemodiálise de urgência', correct: false }
          ],
          explainCorrect: `A causa provável é <strong>acidose láctica por hipoperfusão</strong> (desidratação + esforço). Tratar a causa: ressuscitação volêmica. Pelo <strong>BICAR-ICU (Lancet 2018)</strong>, bicarbonato só tem benefício de mortalidade se <strong>pH ≤ 7,20 + AKI KDIGO 2/3</strong> — aqui pH ${pH} não atinge o limiar e a função renal ainda precisa ser avaliada. Hemodiálise sem indicação clara no momento.`,
          explainWrong: {
            'Bolus de bicarbonato de sódio 8,4% IV imediato': `Pelo <strong>BICAR-ICU</strong>, bicarbonato só reduz mortalidade no subgrupo com pH ≤ 7,20 + AKI KDIGO 2/3. Aqui pH ${pH} ${pH<=7.20?'atinge o limiar de pH, mas falta confirmar AKI 2/3 e tratar a causa primeiro':'não atinge o limiar'}. Tratar a causa (volume) é a prioridade.`,
            'Intubação e hiperventilação mecânica': 'A compensação respiratória já é adequada (Winter). Intubar sem indicação ventilatória prejudica a compensação espontânea.',
            'Hemodiálise de urgência': 'Sem indicação clássica de HD aguda (sem AEIOU: Acidose refratária, distúrbio Eletrolítico, Intoxicação, sObrecarga, Uremia).'
          }
        }
      ],
      summary: `<strong>Acidose metabólica com AG alto (${AG})</strong> + compensação respiratória adequada (Winter prevê ${winterExpected}, real ${PaCO2}). Causa provável: <strong>acidose láctica</strong> por hipoperfusão (calor + esforço + desidratação). Conduta: volume + investigar lactato.`
    };
  }

  function _buildMara(){
    // Alcalose metabólica salina-responsiva por vômitos (perda de HCl)
    const HCO3 = _rand(34, 42);                      // alcalose metabólica
    const Na   = _rand(138, 144);
    const AG   = _rand(9, 12);                       // normal
    const Cl   = Na - AG - HCO3;                     // baixo (hipocloremia por perda de HCl)
    const alb  = _r1(3.8 + Math.random() * 0.4);
    const K    = _r1(2.6 + Math.random() * 0.6);     // hipocalemia (2,6–3,2)
    const compExpected = _r1(0.7 * HCO3 + 21);       // compensação respiratória esperada
    const PaCO2 = Math.round(compExpected + (Math.random() * 4 - 2)); // dentro da faixa
    const pH = _ph(HCO3, PaCO2);
    const BE = _be(HCO3, PaCO2);
    const ClU = _rand(6, 15);                         // cloreto urinário baixo → salina-responsiva
    try { console.info('[Câmara] Mara rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, compExpected, AG, ClU }); } catch {}

    return {
      narrative: 'A curandeira <strong>Mara</strong> é trazida após três dias vomitando sem cessar, vítima de um banquete envenenado. Está fraca, com cãibras, mucosas secas e pulso fino. Você colhe a gasometria.',
      gas: { pH, PaCO2, HCO3, BE, Na, Cl, K, alb },
      acts: [
        {
          kind: 'mc',
          prompt: '<strong>Ato I — Distúrbio primário.</strong><br>Analisando pH, PaCO₂ e HCO₃⁻, qual o distúrbio primário?',
          options: [
            { label: 'Alcalose metabólica', correct: true },
            { label: 'Alcalose respiratória', correct: false },
            { label: 'Acidose metabólica', correct: false },
            { label: 'Acidose respiratória', correct: false }
          ],
          explainCorrect: `pH ${pH} → <strong>alcalemia</strong> (> 7,45). HCO₃⁻ ${HCO3} mEq/L (alto) acompanha a alcalemia → distúrbio primário é <strong>metabólico</strong>. PaCO₂ ${PaCO2} mmHg está elevado (hipoventilação), sugerindo compensação respiratória em curso — <em>adequada ou não, será calculado no Ato II</em>.`,
          explainWrong: {
            'Alcalose respiratória': `Numa alcalose respiratória primária, PaCO₂ estaria <em>baixo</em> e o HCO₃⁻ cairia para compensar. Aqui PaCO₂ ${PaCO2} está alto e HCO₃⁻ ${HCO3} está alto.`,
            'Acidose metabólica': `Acidose metabólica teria pH < 7,35 e HCO₃⁻ baixo. Aqui pH ${pH} (alcalino) e HCO₃⁻ ${HCO3} (alto).`,
            'Acidose respiratória': `Acidose respiratória teria pH < 7,35 com PaCO₂ alto como causa primária. Aqui o pH é ${pH} (alcalino).`
          }
        },
        {
          kind: 'num',
          prompt: `<strong>Ato II — Compensação esperada.</strong><br>Calcule a PaCO₂ esperada pela compensação respiratória.`,
          grimoire: { title: 'Compensação respiratória — alcalose metabólica', body: '<code>PaCO₂ esperado = 0,7 × HCO₃⁻ + 21 (±2)</code><br>A hipoventilação compensatória é limitada (raramente PaCO₂ > 55 mmHg) pelo estímulo hipoxêmico.' },
          unit: 'mmHg',
          target: compExpected,
          tolerance: 2,
          explainCorrect: `PaCO₂ esperada = 0,7 × ${HCO3} + 21 = <strong>${compExpected} mmHg (±2)</strong>. O valor real (${PaCO2}) está dentro da faixa → a compensação respiratória é <strong>adequada</strong>. Não há distúrbio respiratório associado.`,
          explainWrong: `Reveja: 0,7 × ${HCO3} = ${_r1(0.7*HCO3)}. Some 21 → ${compExpected}. Tolerância ±2.`
        },
        {
          kind: 'mc',
          prompt: `<strong>Ato III — Classificação.</strong><br>O <strong>cloreto urinário</strong> volta em <strong>${ClU} mEq/L</strong>. Como você classifica esta alcalose?`,
          grimoire: { title: 'Cloreto urinário na alcalose metabólica', body: '<code>Cl⁻ urinário &lt; 20</code> → <strong>salina-responsiva</strong> (vômito/SNG, diuréticos prévios, pós-hipercapnia).<br><code>Cl⁻ urinário &gt; 20</code> → <strong>salina-resistente</strong> (hiperaldosteronismo, Bartter/Gitelman). Use o Cl⁻ urinário, não o Na⁺ (o Na⁺ pode estar alto pela bicarbonatúria).' },
          options: [
            { label: 'Salina-responsiva (Cl⁻ urinário < 20)', correct: true },
            { label: 'Salina-resistente (Cl⁻ urinário > 20)', correct: false },
            { label: 'Alcalose por excesso de mineralocorticoide', correct: false },
            { label: 'Indeterminada — precisa de mais exames', correct: false }
          ],
          explainCorrect: `Cl⁻ urinário ${ClU} mEq/L (< 20) → <strong>salina-responsiva</strong>. Compatível com perda de HCl por vômitos + contração de volume, que ativa a reabsorção renal ávida de Cl⁻ (deixando a urina pobre em cloreto).`,
          explainWrong: {
            'Salina-resistente (Cl⁻ urinário > 20)': `Salina-resistente exige Cl⁻ urinário > 20. Aqui é ${ClU} (< 20).`,
            'Alcalose por excesso de mineralocorticoide': `Hiperaldosteronismo é salina-resistente, com Cl⁻ urinário > 20 e geralmente hipertensão. Aqui o Cl⁻ urinário ${ClU} é baixo e há depleção de volume.`,
            'Indeterminada — precisa de mais exames': `O cloreto urinário (${ClU}) já permite classificar: < 20 = salina-responsiva.`
          }
        },
        _buildCardsAct({
          prompt: '<strong>Ato IV — Conselho dos Diagnósticos Diferenciais.</strong><br>Selecione <em>todas</em> as causas que também produzem este padrão (alcalose metabólica).',
          instruction: 'Marque todas as causas compatíveis. Algumas cartas são armadilhas.',
          cards: [
            _makeCard('vomiting', 'Vômitos / SNG', 'Perda de conteúdo gástrico', 'Remove HCl gástrico; a hipocloremia impede a troca Cl⁻/HCO₃⁻ no coletor e a hipovolemia ativa o RAAS, perpetuando a secreção distal de H⁺.', true, 'Causa salina-responsiva clássica (Cl⁻ urinário baixo); compatível com este caso.'),
            _makeCard('diuretic', 'Diuréticos (alça/tiazida)', 'Poliúria, K⁺ e Cl⁻ baixos', 'Aumentam a oferta distal de Na⁺ e ativam o RAAS; a secreção de H⁺ e K⁺ sobe e a contração de volume concentra o HCO₃⁻.', true, 'Causa comum de alcalose; o Cl⁻ urinário pode estar alto se o diurético ainda age.'),
            _makeCard('hyperaldo', 'Hiperaldosteronismo primário', 'Hipertensão + K⁺ baixo', 'A aldosterona aumenta o ENaC no coletor; o lúmen fica mais negativo, favorecendo a secreção de H⁺ e K⁺ → hipocalemia e alcalose.', true, 'Alcalose salina-resistente com hipertensão e Cl⁻ urinário alto; entra no diferencial.'),
            _makeCard('bartter', 'Síndrome de Bartter', 'Normotenso, Ca urinário alto', 'Defeito no ramo ascendente (tipo furosemida) ativa o RAAS, com perda renal de H⁺ e K⁺; cursa normotenso.', true, 'Alcalose hipocalêmica normotensa; compatível com o padrão.'),
            _makeCard('gitelman', 'Síndrome de Gitelman', 'Normotenso, Mg²⁺ baixo', 'Defeito no túbulo distal (tipo tiazida) ativa o RAAS; cursa com hipomagnesemia e Ca urinário baixo, normotenso.', true, 'Alcalose hipocalêmica normotensa com Mg baixo; compatível com o padrão.'),
            _makeCard('posthypercapnia', 'Pós-hipercapnia', 'DPOC ventilado rapidamente', 'Na hipercapnia crônica o rim retém HCO₃⁻; se a PaCO₂ cai rápido com a ventilação, o HCO₃⁻ alto persiste por dias → alcalose.', true, 'Mantém alcalose em pacientes pulmonares; reconheça pela história ventilatória.'),
            _makeCard('diarrhea', 'Diarreia', 'AG normal, Cl⁻ alto', 'Perde HCO₃⁻ intestinal → acidose hiperclorêmica (AG normal), oposto da alcalose.', false, 'Armadilha: causa acidose hiperclorêmica, o oposto deste caso.'),
            _makeCard('rta4', 'ATR tipo 4', 'K⁺ alto, acidose', 'O hipoaldosteronismo reduz a secreção distal de H⁺ e K⁺ → acidose hiperclorêmica com hipercalemia.', false, 'Armadilha: acidose hipercalêmica, não alcalose.'),
            _makeCard('sepsis', 'Sepse com lactato', 'AG alto, lactato elevado', 'A hipoperfusão gera lactato (ânion não medido) que consome HCO₃⁻ → acidose com AG alto.', false, 'Armadilha: acidose com AG alto, não alcalose.')
          ],
          grimoire: {
            title: 'Alcalose metabólica — responsiva vs resistente à salina',
            body: 'Separe pelo Cl⁻ urinário: <strong>&lt; 20</strong> = salina-responsiva (vômito, diurético remoto, pós-hipercapnia); <strong>&gt; 20</strong> = salina-resistente (hiperaldosteronismo, Bartter/Gitelman, diurético ativo).'
          }
        }),
        {
          kind: 'mc',
          prompt: `<strong>Ato V — Conduta clínica.</strong><br>Qual é a sua conduta inicial?`,
          grimoire: { title: 'Tratamento da alcalose metabólica salina-responsiva', body: 'Repor volume com <strong>SF 0,9%</strong> (fornece Cl⁻ e desliga o estímulo à reabsorção de HCO₃⁻) + corrigir a <strong>hipocalemia com KCl</strong>. Acetazolamida fica reservada para quando a sobrecarga de volume impede o uso de salina. Bloqueador H2/IBP se a perda gástrica continuar.' },
          options: [
            { label: 'Soro fisiológico 0,9% IV + reposição de KCl', correct: true },
            { label: 'Acetazolamida IV em bolus', correct: false },
            { label: 'Infusão de bicarbonato de sódio IV', correct: false },
            { label: 'Restrição hídrica rigorosa', correct: false }
          ],
          explainCorrect: `Alcalose salina-responsiva com hipocalemia (K ${K}) → <strong>SF 0,9%</strong> restaura volume e repõe Cl⁻, corrigindo a alcalose; <strong>KCl</strong> corrige o potássio (essencial, pois a hipocalemia perpetua a alcalose). Tratar a causa: antiemético/IBP.`,
          explainWrong: {
            'Acetazolamida IV em bolus': 'Acetazolamida só é indicada quando a sobrecarga de volume impede a reposição com salina. Aqui a paciente está depletada — SF 0,9% é a base.',
            'Infusão de bicarbonato de sódio IV': 'Bicarbonato pioraria a alcalose já existente.',
            'Restrição hídrica rigorosa': 'A paciente está hipovolêmica por vômitos; restringir volume agrava a contração e perpetua a alcalose.'
          }
        }
      ],
      summary: `<strong>Alcalose metabólica salina-responsiva</strong> (Cl⁻ urinário ${ClU} < 20) por perda de HCl (vômitos), com <strong>hipocalemia</strong> (K ${K}) e compensação respiratória adequada (esperado ${compExpected}, real ${PaCO2}). Conduta: SF 0,9% + KCl.`
    };
  }

  function _buildTheron(){
    // Alcalose respiratória aguda por hipoxemia/TEP (hiperventilação)
    const PaCO2 = _rand(22, 30);
    const Na = _rand(137, 143);
    const expHCO3 = _r1(24 - 2 * ((40 - PaCO2) / 10));   // queda ~2 por 10 de PaCO₂ (aguda)
    const HCO3 = Math.round(expHCO3 + (Math.random() * 2 - 1)); // medido ≈ esperado (isolada)
    const AG = _rand(9, 12);
    const Cl = Na - AG - HCO3;
    const K = _r1(3.6 + Math.random() * 0.8);
    const alb = _r1(3.8 + Math.random() * 0.4);
    const pH = _ph(HCO3, PaCO2);
    const BE = _be(HCO3, PaCO2);
    const PaO2 = _rand(52, 66);                            // hipoxemia
    try { console.info('[Câmara] Theron rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, expHCO3, PaO2 }); } catch {}

    return {
      narrative: 'O guarda <strong>Theron</strong> retorna da muralha com dispneia súbita e dor ao respirar, após dias imobilizado por um ferimento na perna. Está taquipneico e ansioso. A oximetria mostra hipoxemia.',
      gas: { pH, PaCO2, HCO3, BE, Na, Cl, K, alb },
      acts: [
        {
          kind: 'mc',
          prompt: '<strong>Ato I — Distúrbio primário.</strong><br>Analisando pH, PaCO₂ e HCO₃⁻, qual o distúrbio primário?',
          options: [
            { label: 'Alcalose respiratória', correct: true },
            { label: 'Alcalose metabólica', correct: false },
            { label: 'Acidose respiratória', correct: false },
            { label: 'Acidose metabólica', correct: false }
          ],
          explainCorrect: `pH ${pH} → <strong>alcalemia</strong> (> 7,45). A PaCO₂ ${PaCO2} mmHg (baixa) acompanha a alcalemia → o processo primário é <strong>respiratório</strong> (hiperventilação). O HCO₃⁻ ${HCO3} levemente reduzido é a resposta renal, não a causa.`,
          explainWrong: {
            'Alcalose metabólica': `Alcalose metabólica teria HCO₃⁻ alto como causa. Aqui o HCO₃⁻ ${HCO3} está baixo e a PaCO₂ ${PaCO2} baixa explica a alcalemia.`,
            'Acidose respiratória': `Acidose respiratória teria pH < 7,35 e PaCO₂ alta. Aqui pH ${pH} e PaCO₂ ${PaCO2} (baixa).`,
            'Acidose metabólica': `Acidose teria pH < 7,35 e HCO₃⁻ baixo como causa. Aqui o pH é ${pH} (alcalino).`
          }
        },
        {
          kind: 'num',
          prompt: '<strong>Ato II — Compensação aguda.</strong><br>Calcule o HCO₃⁻ esperado para esta alcalose respiratória <em>aguda</em>.',
          grimoire: { title: 'Compensação — alcalose respiratória', body: '<strong>Aguda:</strong> HCO₃⁻ cai ~2 mEq/L para cada −10 mmHg de PaCO₂.<br><strong>Crônica:</strong> cai ~4–5 mEq/L para cada −10 mmHg.<br><code>HCO₃⁻ esperado (aguda) = 24 − 2 × (40 − PaCO₂)/10</code>' },
          unit: 'mEq/L',
          target: expHCO3,
          tolerance: 2,
          explainCorrect: `HCO₃⁻ esperado = 24 − 2 × (40 − ${PaCO2})/10 = <strong>${expHCO3} mEq/L</strong>. O valor real (${HCO3}) bate com o esperado → alcalose respiratória aguda <strong>isolada</strong>, sem distúrbio metabólico associado.`,
          explainWrong: `Aguda: cada −10 mmHg de PaCO₂ baixa ~2 de HCO₃⁻. 24 − 2 × (40 − ${PaCO2})/10 = ${expHCO3}.`
        },
        {
          kind: 'mc',
          prompt: `<strong>Ato III — Distúrbio associado?</strong><br>O HCO₃⁻ medido (${HCO3}) é praticamente igual ao esperado (${expHCO3}). O que isso indica?`,
          grimoire: { title: 'Compensação adequada vs distúrbio misto', body: 'Se o HCO₃⁻ medido coincide com o esperado para a compensação, o distúrbio é simples. HCO₃⁻ <em>muito mais baixo</em> que o esperado sugere acidose metabólica associada; <em>mais alto</em> sugere alcalose metabólica associada.' },
          options: [
            { label: 'Alcalose respiratória aguda isolada (compensação adequada)', correct: true },
            { label: 'Alcalose respiratória + acidose metabólica', correct: false },
            { label: 'Alcalose respiratória + alcalose metabólica', correct: false },
            { label: 'Distúrbio triplo', correct: false }
          ],
          explainCorrect: `Como o HCO₃⁻ real (${HCO3}) coincide com o esperado (${expHCO3}), trata-se de <strong>alcalose respiratória aguda isolada</strong> — a queda do HCO₃⁻ é apenas a resposta tampão/renal precoce, não um segundo distúrbio.`,
          explainWrong: {
            'Alcalose respiratória + acidose metabólica': `Exigiria HCO₃⁻ bem <em>abaixo</em> do esperado. Aqui real ${HCO3} ≈ esperado ${expHCO3}.`,
            'Alcalose respiratória + alcalose metabólica': `Exigiria HCO₃⁻ <em>acima</em> do esperado. Aqui real ${HCO3} ≈ esperado ${expHCO3}.`,
            'Distúrbio triplo': `Não há dados para três distúrbios; o padrão é de alcalose respiratória aguda simples.`
          }
        },
        _buildCardsAct({
          prompt: '<strong>Ato IV — Conselho dos Diagnósticos Diferenciais.</strong><br>Selecione <em>todas</em> as causas que também produzem este padrão (alcalose respiratória).',
          instruction: 'Marque todas as causas compatíveis. Algumas cartas são armadilhas.',
          cards: [
            _makeCard('tep', 'Tromboembolismo pulmonar', 'Dispneia súbita, dor pleurítica, hipoxemia', 'O êmbolo cria espaço morto e hipoxemia; os quimiorreceptores aumentam a ventilação, eliminando CO₂ → alcalose respiratória.', true, 'Causa grave e tempo-dependente; este caso (imobilização + dispneia + hipoxemia) é altamente sugestivo.'),
            _makeCard('pneumonia', 'Pneumonia', 'Febre, tosse, hipoxemia', 'A hipoxemia estimula os quimiorreceptores periféricos, aumentando a ventilação e baixando a PaCO₂.', true, 'Hipoxemia de qualquer pneumopatia aguda gera hiperventilação e alcalose respiratória.'),
            _makeCard('sepse_resp', 'Sepse inicial', 'Febre, taquipneia, sem lactato alto ainda', 'Citocinas e febre estimulam diretamente o centro respiratório antes de a hipoperfusão gerar lactato.', true, 'Fase precoce da sepse cursa com alcalose respiratória; depois pode somar acidose lática.'),
            _makeCard('gestacao', 'Gestação', 'Mulher gestante, dispneia leve crônica', 'A progesterona aumenta a sensibilidade do centro respiratório ao CO₂, elevando o volume-minuto → alcalose respiratória crônica.', true, 'Alcalose respiratória fisiológica da gravidez, compensada pelo rim.'),
            _makeCard('salicilato_resp', 'Intoxicação por salicilato', 'Zumbido, taquipneia, febre', 'Estimula diretamente o centro respiratório (alcalose respiratória) e, em paralelo, gera acidose com AG alto.', true, 'O componente respiratório precoce do salicilato é alcalose; reconheça o padrão misto.'),
            _makeCard('altitude', 'Grande altitude', 'Exposição a alta montanha', 'A hipóxia hipobárica estimula os quimiorreceptores, aumentando a ventilação → alcalose respiratória.', true, 'Causa ambiental clássica de hiperventilação hipoxêmica.'),
            _makeCard('opioide', 'Opioide / sedação', 'Sonolência, respiração lenta', 'Deprime o centro respiratório → hipoventilação e <em>retenção</em> de CO₂ (acidose respiratória), o oposto.', false, 'Armadilha: causa acidose respiratória, não alcalose.'),
            _makeCard('dpoc_fadiga', 'DPOC com fadiga', 'Hipercapnia crônica que piora', 'A obstrução e a fadiga muscular reduzem a ventilação alveolar → CO₂ sobe (acidose respiratória).', false, 'Armadilha: hipoventilação → acidose respiratória.'),
            _makeCard('vomitos_resp', 'Vômitos', 'Perda de HCl gástrico', 'Gera alcalose metabólica (HCO₃⁻ alto), não um distúrbio respiratório.', false, 'Armadilha: é alcalose metabólica, não respiratória.')
          ],
          grimoire: { title: 'Alcalose respiratória — gatilhos do drive ventilatório', body: 'Pense em três motores: <strong>hipoxemia</strong> (TEP, pneumonia, altitude), <strong>estímulo central</strong> (sepse, salicilato, dor, gestação) e <strong>iatrogenia</strong> (ventilação excessiva). Excluir causas graves antes de atribuir à ansiedade.' }
        }),
        {
          kind: 'mc',
          prompt: '<strong>Ato V — Conduta clínica.</strong><br>Qual é a sua conduta inicial?',
          grimoire: { title: 'Abordagem da alcalose respiratória aguda', body: 'A prioridade é identificar e tratar a causa da hiperventilação. Em paciente com fator de risco para TEP + hipoxemia, investigar TEP (escore clínico, D-dímero/angio-TC) e suporte de O₂. Não rotular como "ansiedade" sem excluir causas graves.' },
          options: [
            { label: 'Investigar TEP/hipoxemia e ofertar O₂; tratar a causa', correct: true },
            { label: 'Tranquilizar e liberar como crise de ansiedade', correct: false },
            { label: 'Infundir bicarbonato de sódio IV', correct: false },
            { label: 'Sedar para reduzir a frequência respiratória', correct: false }
          ],
          explainCorrect: `Com imobilização recente + dispneia súbita + hipoxemia (PaO₂ ~${PaO2} mmHg), a hipótese principal é <strong>TEP</strong>. Investigar e ofertar O₂. A alcalose em si raramente exige tratamento direto — corrige-se tratando a causa.`,
          explainWrong: {
            'Tranquilizar e liberar como crise de ansiedade': 'Ansiedade é diagnóstico de exclusão; com hipoxemia e fator de risco para TEP, liberar seria perigoso.',
            'Infundir bicarbonato de sódio IV': 'Pioraria a alcalemia já existente.',
            'Sedar para reduzir a frequência respiratória': 'A hiperventilação é compensatória/protetora à hipoxemia; sedar pode agravar a hipoxemia.'
          }
        }
      ],
      summary: `<strong>Alcalose respiratória aguda</strong> por hiperventilação hipoxêmica, provável <strong>TEP</strong> (imobilização + dispneia súbita + hipoxemia). HCO₃⁻ ${HCO3} ≈ esperado ${expHCO3} → distúrbio simples. Conduta: investigar TEP, O₂, tratar a causa. Armadilha: rotular como ansiedade.`
    };
  }

  function _buildVance(){
    // Acidose metabólica hiperclorêmica (AG normal) por diarreia
    const HCO3 = _rand(12, 18);
    const Na = _rand(137, 142);
    const AG = _rand(9, 11);                              // normal
    const Cl = Na - AG - HCO3;                            // alto (hiperclorêmica)
    const alb = _r1(3.8 + Math.random() * 0.4);
    const K = _r1(3.0 + Math.random() * 0.8);            // tende a baixo
    const winterExpected = _r1(1.5 * HCO3 + 8);
    const PaCO2 = Math.round(winterExpected + (Math.random() * 4 - 2));
    const pH = _ph(HCO3, PaCO2);
    const BE = _be(HCO3, PaCO2);
    try { console.info('[Câmara] Vance rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, winterExpected, AG }); } catch {}

    return {
      narrative: 'O mercador <strong>Vance</strong> chega após dias de diarreia volumosa durante a travessia da rota das especiarias. Refere fraqueza, sede intensa e cãibras.',
      gas: { pH, PaCO2, HCO3, BE, Na, Cl, K, alb },
      acts: [
        {
          kind: 'mc',
          prompt: '<strong>Ato I — Distúrbio primário.</strong><br>Analisando pH, PaCO₂ e HCO₃⁻, qual o distúrbio primário?',
          options: [
            { label: 'Acidose metabólica', correct: true },
            { label: 'Acidose respiratória', correct: false },
            { label: 'Alcalose metabólica', correct: false },
            { label: 'Alcalose respiratória', correct: false }
          ],
          explainCorrect: `pH ${pH} → <strong>acidemia</strong> (< 7,35). HCO₃⁻ ${HCO3} mEq/L (baixo) acompanha a acidemia → distúrbio primário <strong>metabólico</strong>. PaCO₂ ${PaCO2} mmHg baixa é a compensação respiratória.`,
          explainWrong: {
            'Acidose respiratória': `Teria PaCO₂ alta como causa. Aqui a PaCO₂ ${PaCO2} está baixa (compensando).`,
            'Alcalose metabólica': `Teria pH > 7,45 e HCO₃⁻ alto. Aqui pH ${pH} e HCO₃⁻ ${HCO3} (baixo).`,
            'Alcalose respiratória': `Teria pH > 7,45. Aqui pH ${pH}.`
          }
        },
        {
          kind: 'num',
          prompt: '<strong>Ato II — Compensação esperada (Winter).</strong><br>Calcule a PaCO₂ esperada pela compensação respiratória.',
          grimoire: { title: 'Fórmula de Winter', body: '<code>PaCO₂ esperado = 1,5 × HCO₃⁻ + 8 (±2)</code><br>Aplica-se à <em>acidose metabólica</em>.' },
          unit: 'mmHg',
          target: winterExpected,
          tolerance: 2,
          explainCorrect: `PaCO₂ esperada = 1,5 × ${HCO3} + 8 = <strong>${winterExpected} mmHg (±2)</strong>. O valor real (${PaCO2}) está na faixa → compensação adequada, sem componente respiratório.`,
          explainWrong: `1,5 × ${HCO3} = ${_r1(1.5*HCO3)}; + 8 = ${winterExpected}. Tolerância ±2.`
        },
        {
          kind: 'num',
          prompt: `<strong>Ato III — Ânion gap.</strong><br>Calcule o AG sérico (albumina = ${alb} g/dL).`,
          grimoire: { title: 'Ânion gap', body: '<code>AG = Na⁺ − (Cl⁻ + HCO₃⁻)</code><br>Normal 8–12. AG normal numa acidose aponta para perda de HCO₃⁻ ou falha renal de excretar H⁺ (acidose hiperclorêmica).' },
          unit: 'mEq/L',
          target: AG,
          tolerance: 1,
          explainCorrect: `AG = ${Na} − (${Cl} + ${HCO3}) = <strong>${AG} mEq/L</strong> (normal). Com Cl⁻ ${Cl} elevado, trata-se de <strong>acidose metabólica hiperclorêmica (AG normal)</strong> — aqui por perda intestinal de HCO₃⁻.`,
          explainWrong: `AG = Na − (Cl + HCO₃) = ${Na} − (${Cl} + ${HCO3}) = ${AG}. É normal → hiperclorêmica.`
        },
        _buildCardsAct({
          prompt: '<strong>Ato IV — Conselho dos Diagnósticos Diferenciais.</strong><br>Selecione <em>todas</em> as causas que também produzem este padrão (acidose metabólica com AG normal / hiperclorêmica).',
          instruction: 'Marque todas as causas compatíveis. Algumas cartas são armadilhas.',
          cards: [
            _makeCard('diarreia', 'Diarreia', 'Perda fecal volumosa, K baixo', 'O fluido intestinal é rico em HCO₃⁻; sua perda baixa o HCO₃⁻ plasmático e o Cl⁻ sobe para manter a eletroneutralidade.', true, 'Causa extrarrenal mais comum de acidose com AG normal; o UAG costuma ser negativo.'),
            _makeCard('atr1', 'ATR tipo 1 (distal)', 'K baixo, pH urinário > 5,5, nefrocalcinose', 'A célula alfa-intercalada falha em secretar H⁺ no coletor; o ácido se acumula e o HCO₃⁻ cai, com Cl⁻ alto.', true, 'NAGMA renal com hipocalemia e incapacidade de acidificar a urina.'),
            _makeCard('atr2', 'ATR tipo 2 (proximal)', 'Bicarbonatúria, síndrome de Fanconi', 'O túbulo proximal não reabsorve o HCO₃⁻ filtrado; ele se perde na urina até o plasma atingir um novo limiar mais baixo.', true, 'NAGMA proximal; pode vir com glicosúria/fosfatúria (Fanconi).'),
            _makeCard('atr4', 'ATR tipo 4', 'K alto, diabético/IECA', 'O hipoaldosteronismo reduz a secreção distal de H⁺ e a amoniagênese → acidose hiperclorêmica com hipercalemia.', true, 'Única ATR com K alto; comum em diabético com DRC.'),
            _makeCard('salina', 'Excesso de SF 0,9%', 'Reanimação volumosa com salina', 'A grande carga de Cl⁻ reduz a diferença de íons fortes (SID), baixando o HCO₃⁻ → acidose hiperclorêmica dilucional.', true, 'Acidose hiperclorêmica iatrogênica; prefira cristaloide balanceado em grandes volumes.'),
            _makeCard('acetazolamida', 'Acetazolamida', 'Inibidor da anidrase carbônica', 'Inibe a reabsorção proximal de HCO₃⁻ (efeito tipo ATR-2), gerando bicarbonatúria e acidose com AG normal.', true, 'Causa medicamentosa de NAGMA por perda renal de HCO₃⁻.'),
            _makeCard('dka_vance', 'Cetoacidose diabética', 'Hiperglicemia, cetonas', 'A cetogênese gera β-hidroxibutirato — ânion não medido que eleva o AG.', false, 'Armadilha: dá AG ALTO, não acidose hiperclorêmica.'),
            _makeCard('lactato_vance', 'Acidose lática', 'Choque, lactato alto', 'O lactato é um ânion não medido que eleva o AG.', false, 'Armadilha: AG alto, não AG normal.'),
            _makeCard('vomitos_vance', 'Vômitos', 'Perda de HCl', 'Remove H⁺ e Cl⁻ → alcalose metabólica.', false, 'Armadilha: gera alcalose, o oposto deste caso.')
          ],
          grimoire: { title: 'Acidose com AG normal — GI vs renal', body: 'Diferencie pela origem: perda <strong>gastrointestinal</strong> de HCO₃⁻ (diarreia, fístula) com resposta renal preservada (UAG negativo) vs perda/falha <strong>renal</strong> (ATR, acetazolamida) com UAG positivo. <code>UAG = (Na⁺ + K⁺) − Cl⁻ urinários</code>.' }
        }),
        {
          kind: 'mc',
          prompt: '<strong>Ato V — Conduta clínica.</strong><br>Qual é a sua conduta inicial?',
          grimoire: { title: 'Conduta na acidose hiperclorêmica por perda GI', body: 'Repor volume e corrigir o potássio; tratar a causa (diarreia). Alcalinizar só se acidose grave/refratária. Em grandes volumes, preferir cristaloide balanceado a SF 0,9% para não agravar a hipercloremia.' },
          options: [
            { label: 'Reposição volêmica + correção de K⁺; tratar a diarreia', correct: true },
            { label: 'Bolus imediato de bicarbonato 8,4% IV', correct: false },
            { label: 'Grande volume de SF 0,9%', correct: false },
            { label: 'Restrição hídrica', correct: false }
          ],
          explainCorrect: `Acidose hiperclorêmica por diarreia com depleção de volume e K⁺ ${K} → <strong>repor volume e potássio</strong> e tratar a diarreia. A acidose corrige com a recuperação. Em grandes volumes, cristaloide balanceado evita piorar a hipercloremia.`,
          explainWrong: {
            'Bolus imediato de bicarbonato 8,4% IV': 'Reservado para acidose grave/refratária; a maioria corrige com volume e tratamento da causa.',
            'Grande volume de SF 0,9%': 'A carga de Cl⁻ pioraria a acidose hiperclorêmica — prefira solução balanceada.',
            'Restrição hídrica': 'O paciente está hipovolêmico pela diarreia; restringir volume agrava o quadro.'
          }
        }
      ],
      summary: `<strong>Acidose metabólica hiperclorêmica (AG ${AG} normal)</strong> por perda intestinal de HCO₃⁻ (diarreia), com compensação respiratória adequada (Winter ${winterExpected}, real ${PaCO2}). Conduta: volume + K⁺ + tratar a causa; evitar SF 0,9% em excesso.`
    };
  }

  function _buildKael(){
    // Acidose respiratória aguda por hipoventilação (sedação)
    const PaCO2 = _rand(55, 72);
    const Na = _rand(137, 143);
    const expHCO3 = _r1(24 + 1 * ((PaCO2 - 40) / 10));   // sobe ~1 por 10 de PaCO₂ (aguda)
    const HCO3 = Math.round(expHCO3 + (Math.random() * 2 - 1));
    const AG = _rand(9, 12);
    const Cl = Na - AG - HCO3;
    const K = _r1(3.8 + Math.random() * 0.8);
    const alb = _r1(3.8 + Math.random() * 0.4);
    const pH = _ph(HCO3, PaCO2);
    const BE = _be(HCO3, PaCO2);
    try { console.info('[Câmara] Kael rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, expHCO3 }); } catch {}

    return {
      narrative: 'O general <strong>Kael</strong> recebeu uma poção sedativa potente para a dor após a batalha. Tornou-se progressivamente sonolento, com respiração lenta e superficial.',
      gas: { pH, PaCO2, HCO3, BE, Na, Cl, K, alb },
      acts: [
        {
          kind: 'mc',
          prompt: '<strong>Ato I — Distúrbio primário.</strong><br>Analisando pH, PaCO₂ e HCO₃⁻, qual o distúrbio primário?',
          options: [
            { label: 'Acidose respiratória', correct: true },
            { label: 'Acidose metabólica', correct: false },
            { label: 'Alcalose respiratória', correct: false },
            { label: 'Alcalose metabólica', correct: false }
          ],
          explainCorrect: `pH ${pH} → <strong>acidemia</strong> (< 7,35). A PaCO₂ ${PaCO2} mmHg (alta) acompanha a acidemia → o processo primário é <strong>respiratório</strong> (hipoventilação). O HCO₃⁻ ${HCO3} pouco elevado é resposta tampão precoce.`,
          explainWrong: {
            'Acidose metabólica': `Acidose metabólica teria HCO₃⁻ baixo como causa. Aqui o HCO₃⁻ ${HCO3} está normal/alto e a PaCO₂ ${PaCO2} está alta.`,
            'Alcalose respiratória': `Teria pH > 7,45 e PaCO₂ baixa. Aqui pH ${pH} e PaCO₂ ${PaCO2} (alta).`,
            'Alcalose metabólica': `Teria pH > 7,45 e HCO₃⁻ alto. Aqui pH ${pH} (ácido).`
          }
        },
        {
          kind: 'mc',
          prompt: '<strong>Ato II — Aguda ou crônica?</strong><br>Diante de uma sedação que começou há poucas horas, esta acidose respiratória é aguda ou crônica?',
          grimoire: { title: 'Aguda vs crônica', body: 'Na <strong>aguda</strong> o HCO₃⁻ sobe ~1 mEq/L por +10 mmHg de PaCO₂ (tampão celular imediato). Na <strong>crônica</strong> (dias) sobe ~3,5–4 por +10, pela retenção renal de HCO₃⁻.' },
          options: [
            { label: 'Aguda', correct: true },
            { label: 'Crônica', correct: false },
            { label: 'Crônica agudizada', correct: false },
            { label: 'Impossível dizer', correct: false }
          ],
          explainCorrect: `A sedação iniciou há poucas horas → <strong>aguda</strong>. Espera-se elevação modesta do HCO₃⁻ (~1 por 10 de PaCO₂), sem tempo para a compensação renal plena.`,
          explainWrong: {
            'Crônica': 'Crônica exigiria dias de hipercapnia e HCO₃⁻ bem mais alto (~3,5–4 por 10).',
            'Crônica agudizada': 'Não há hipercapnia crônica de base na história — é um evento agudo (sedação).',
            'Impossível dizer': 'A história (sedação recente) e o HCO₃⁻ pouco elevado definem como aguda.'
          }
        },
        {
          kind: 'num',
          prompt: '<strong>Ato III — HCO₃⁻ esperado (aguda).</strong><br>Calcule o HCO₃⁻ esperado para esta acidose respiratória aguda.',
          grimoire: { title: 'Compensação — acidose respiratória aguda', body: '<code>HCO₃⁻ esperado = 24 + 1 × (PaCO₂ − 40)/10</code><br>Crônica: usar ~3,5–4 no lugar do 1.' },
          unit: 'mEq/L',
          target: expHCO3,
          tolerance: 2,
          explainCorrect: `HCO₃⁻ esperado = 24 + 1 × (${PaCO2} − 40)/10 = <strong>${expHCO3} mEq/L</strong>. O valor real (${HCO3}) bate → acidose respiratória aguda isolada.`,
          explainWrong: `24 + (${PaCO2} − 40)/10 = ${expHCO3}. Tolerância ±2.`
        },
        _buildCardsAct({
          prompt: '<strong>Ato IV — Conselho dos Diagnósticos Diferenciais.</strong><br>Selecione <em>todas</em> as causas que também produzem este padrão (acidose respiratória).',
          instruction: 'Marque todas as causas compatíveis. Algumas cartas são armadilhas.',
          cards: [
            _makeCard('opioides', 'Opioides', 'Sonolência, miose, FR baixa', 'Deprimem o centro respiratório bulbar → cai o volume-minuto e o CO₂ se retém.', true, 'Causa direta e reversível (naloxona) deste caso.'),
            _makeCard('benzo', 'Benzodiazepínicos / sedativos', 'Rebaixamento, hipoventilação', 'Reduzem o drive ventilatório central → hipoventilação alveolar e retenção de CO₂.', true, 'Sedativos somam-se aos opioides na depressão respiratória.'),
            _makeCard('dpoc_exac', 'DPOC exacerbado com fadiga', 'Hipercapnia que piora', 'A obstrução aumenta o trabalho respiratório; a fadiga muscular reduz a ventilação alveolar → CO₂ sobe.', true, 'Quando a musculatura fadiga, a PaCO₂ sobe — sinal de gravidade.'),
            _makeCard('oh', 'Obesidade-hipoventilação', 'Obesidade, sonolência diurna', 'A carga mecânica torácica e o drive reduzido diminuem a ventilação, retendo CO₂ (sobretudo no sono).', true, 'Hipoventilação crônica; pode agudizar com sedativos.'),
            _makeCard('neuromuscular', 'Doença neuromuscular', 'Fraqueza, tosse fraca', 'A falência da bomba ventilatória (diafragma/músculos) reduz a ventilação alveolar → hipercapnia.', true, 'Guillain-Barré, miastenia, ELA — a bomba falha e o CO₂ sobe.'),
            _makeCard('asma_grave', 'Asma grave com fadiga', 'Tórax silencioso, exaustão', 'Inicialmente há hipocapnia; quando o paciente fadiga, a PaCO₂ "normaliza" e depois sobe — sinal de gravidade.', true, 'PaCO₂ subindo na crise asmática indica exaustão iminente.'),
            _makeCard('tep_kael', 'TEP leve', 'Dispneia, hipoxemia', 'Gera hiperventilação → alcalose respiratória (PaCO₂ baixa), o oposto.', false, 'Armadilha: causa alcalose respiratória, não acidose.'),
            _makeCard('sepse_kael', 'Sepse inicial', 'Febre, taquipneia', 'Estimula o centro respiratório → alcalose respiratória precoce.', false, 'Armadilha: alcalose respiratória, não acidose.'),
            _makeCard('diarreia_kael', 'Diarreia', 'Perda fecal de HCO₃⁻', 'Causa acidose metabólica (hiperclorêmica), não respiratória.', false, 'Armadilha: distúrbio metabólico, não respiratório.')
          ],
          grimoire: { title: 'Acidose respiratória — falha do fole', body: 'A PaCO₂ sobe quando a ventilação alveolar cai. Localize a falha: <strong>drive</strong> (opioide, sedativo), <strong>bomba</strong> (neuromuscular, fadiga), ou <strong>carga/obstrução</strong> (DPOC, asma grave, obesidade).' }
        }),
        {
          kind: 'mc',
          prompt: '<strong>Ato V — Conduta clínica.</strong><br>Qual é a sua conduta inicial?',
          grimoire: { title: 'Acidose respiratória aguda por sedação', body: 'A prioridade é restaurar a ventilação: estímulo, suporte de via aérea/ventilação e, se for opioide, antagonista (naloxona). Bicarbonato NÃO trata acidose respiratória — pode piorar (gera mais CO₂).' },
          options: [
            { label: 'Suporte ventilatório e reverter a sedação (ex.: naloxona se opioide)', correct: true },
            { label: 'Infundir bicarbonato de sódio IV', correct: false },
            { label: 'Acetazolamida para baixar o HCO₃⁻', correct: false },
            { label: 'Observação sem intervenção', correct: false }
          ],
          explainCorrect: `A causa é <strong>hipoventilação por sedação</strong> → restaurar a ventilação (estímulo, suporte/ventilação; naloxona se opioide). A acidose respiratória corrige eliminando CO₂, não com álcali.`,
          explainWrong: {
            'Infundir bicarbonato de sódio IV': 'Bicarbonato em acidose respiratória gera mais CO₂ e, sem ventilação adequada, piora a acidemia.',
            'Acetazolamida para baixar o HCO₃⁻': 'O HCO₃⁻ alto é compensação apropriada; reduzi-lo agravaria a acidemia.',
            'Observação sem intervenção': 'Hipoventilação progressiva por sedação pode evoluir para parada — exige ação.'
          }
        }
      ],
      summary: `<strong>Acidose respiratória aguda</strong> por hipoventilação induzida por sedação (PaCO₂ ${PaCO2}). HCO₃⁻ ${HCO3} ≈ esperado ${expHCO3} → aguda isolada. Conduta: restaurar a ventilação (naloxona se opioide); bicarbonato é contraindicado.`
    };
  }

  function _buildVorgath(){
    // Acidose metabólica com AG alto + gap osmolar (etilenoglicol) — caso expert
    const HCO3 = _rand(6, 12);
    const Na = _rand(138, 144);
    const AG = _rand(22, 30);
    const Cl = Na - AG - HCO3;
    const alb = _r1(3.8 + Math.random() * 0.4);
    const K = _r1(3.8 + Math.random() * 1.0);
    const winterExpected = _r1(1.5 * HCO3 + 8);
    const PaCO2 = Math.round(winterExpected + (Math.random() * 4 - 2));
    const pH = _ph(HCO3, PaCO2);
    const BE = _be(HCO3, PaCO2);
    // Gap osmolar
    const glic = _rand(80, 110);
    const bun = _rand(10, 18);
    const osmCalc = Math.round(2 * Na + glic / 18 + bun / 2.8);
    const osmGap = _rand(22, 40);                          // elevado (normal < 10)
    const osmMed = osmCalc + osmGap;
    try { console.info('[Câmara] Vorgath rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, AG, winterExpected, glic, bun, osmCalc, osmMed, osmGap }); } catch {}

    return {
      narrative: 'O alquimista <strong>Vorgath</strong> bebeu uma solução cristalina esverdeada acreditando ser um elixir raro. Horas depois, evolui com náuseas, fala arrastada, confusão e dor lombar.',
      gas: { pH, PaCO2, HCO3, BE, Na, Cl, K, alb },
      acts: [
        {
          kind: 'mc',
          prompt: '<strong>Ato I — Distúrbio primário.</strong><br>Analisando pH, PaCO₂ e HCO₃⁻, qual o distúrbio primário?',
          options: [
            { label: 'Acidose metabólica', correct: true },
            { label: 'Acidose respiratória', correct: false },
            { label: 'Alcalose metabólica', correct: false },
            { label: 'Alcalose respiratória', correct: false }
          ],
          explainCorrect: `pH ${pH} → <strong>acidemia</strong> grave. HCO₃⁻ ${HCO3} mEq/L (muito baixo) acompanha a acidemia → distúrbio <strong>metabólico</strong>. PaCO₂ ${PaCO2} mmHg baixa é compensação respiratória.`,
          explainWrong: {
            'Acidose respiratória': `Teria PaCO₂ alta como causa. Aqui a PaCO₂ ${PaCO2} está baixa (compensando).`,
            'Alcalose metabólica': `Teria pH > 7,45 e HCO₃⁻ alto. Aqui pH ${pH} e HCO₃⁻ ${HCO3} (baixo).`,
            'Alcalose respiratória': `Teria pH > 7,45. Aqui pH ${pH}.`
          }
        },
        {
          kind: 'num',
          prompt: '<strong>Ato II — Compensação (Winter).</strong><br>Calcule a PaCO₂ esperada.',
          grimoire: { title: 'Fórmula de Winter', body: '<code>PaCO₂ esperado = 1,5 × HCO₃⁻ + 8 (±2)</code>' },
          unit: 'mmHg',
          target: winterExpected,
          tolerance: 2,
          explainCorrect: `PaCO₂ esperada = 1,5 × ${HCO3} + 8 = <strong>${winterExpected} mmHg (±2)</strong>; real ${PaCO2} → compensação adequada.`,
          explainWrong: `1,5 × ${HCO3} + 8 = ${winterExpected}. Tolerância ±2.`
        },
        {
          kind: 'num',
          prompt: `<strong>Ato III — Gap osmolar.</strong><br>Na⁺ ${Na}, glicose ${glic} mg/dL, BUN ${bun} mg/dL. Osmolaridade <em>medida</em> = <strong>${osmMed} mOsm/kg</strong>. Calcule o <strong>gap osmolar</strong>.`,
          grimoire: { title: 'Gap osmolar', body: '<code>Osm calculada = 2 × Na⁺ + glicose/18 + BUN/2,8</code><br><code>Gap osmolar = Osm medida − Osm calculada</code><br>Normal &lt; 10. Elevado sugere soluto osmótico não medido (álcoois tóxicos). Lembre: ureia (mg/dL) ÷ 2,14 = BUN.' },
          unit: 'mOsm/kg',
          target: osmGap,
          tolerance: 5,
          explainCorrect: `Osm calculada = 2 × ${Na} + ${glic}/18 + ${bun}/2,8 ≈ <strong>${osmCalc}</strong>. Gap = ${osmMed} − ${osmCalc} = <strong>${osmGap} mOsm/kg</strong> (elevado, normal < 10). AG alto + gap osmolar elevado aponta <strong>álcool tóxico</strong>.`,
          explainWrong: `Osm calc = 2×${Na} + ${glic}/18 + ${bun}/2,8 ≈ ${osmCalc}. Gap = ${osmMed} − ${osmCalc} = ${osmGap}.`
        },
        _buildCardsAct({
          prompt: '<strong>Ato IV — Conselho dos Diagnósticos Diferenciais.</strong><br>Selecione <em>todas</em> as causas compatíveis com <strong>acidose AG alto + gap osmolar elevado</strong>.',
          instruction: 'Marque só as que dão AG alto E gap osmolar. Há armadilhas clássicas.',
          cards: [
            _makeCard('etilenoglicol', 'Etilenoglicol', 'Anticongelante, IRA, cristais de oxalato', 'A álcool-desidrogenase o converte em glicolato e oxalato (AG alto); a molécula-mãe não medida eleva o gap osmolar; o oxalato precipita e causa IRA.', true, 'AG alto + gap osmolar + IRA: tríade clássica. Antídoto: fomepizol; HD se grave.'),
            _makeCard('metanol', 'Metanol', 'Perda visual, AG alto', 'Convertido a formato (AG alto e toxicidade retiniana); o metanol não medido eleva o gap osmolar.', true, 'AG alto + gap osmolar + alteração visual. Fomepizol + HD.'),
            _makeCard('propilenoglicol', 'Propilenoglicol', 'Solvente de medicações IV (ex.: lorazepam)', 'Metabolizado a lactato (AG alto) e, sendo um álcool, eleva o gap osmolar enquanto se acumula.', true, 'Toxicidade hospitalar por infusões prolongadas; dá AG alto com gap osmolar.'),
            _makeCard('dietilenoglicol', 'Dietilenoglicol', 'Contaminante de xaropes/solventes', 'Metabolizado por álcool-desidrogenase a ácidos (AG alto) e, como álcool, eleva o gap osmolar; causa IRA e neurotoxicidade.', true, 'Mesma via dos álcoois tóxicos: AG alto + gap osmolar + IRA.'),
            _makeCard('isopropanol', 'Isopropanol (álcool isopropílico)', 'Ebriedade, cetose, hálito de acetona', 'É oxidado a acetona — gera grande gap osmolar e cetonemia, mas <em>não</em> produz ácidos fixos.', false, 'Armadilha: gap osmolar SEM acidose com AG alto (gera acetona, não ácido).'),
            _makeCard('salicilato_v', 'Salicilato', 'Zumbido, taquipneia', 'Dá AG alto (ácidos orgânicos) + alcalose respiratória, mas é molécula medida — não eleva o gap osmolar.', false, 'Armadilha: AG alto SEM gap osmolar relevante.'),
            _makeCard('metformina_v', 'Metformina (acidose lática)', 'IRA, choque, lactato muito alto', 'Inibe a gliconeogênese e a oxidação mitocondrial → lactato (AG alto), mas não eleva o gap osmolar.', false, 'Armadilha: AG alto por lactato, sem gap osmolar.'),
            _makeCard('vomitos_v', 'Vômitos', 'Perda de HCl', 'Geram alcalose metabólica, não acidose.', false, 'Armadilha: alcalose metabólica, padrão oposto.')
          ],
          grimoire: { title: 'AG alto + gap osmolar — separando os álcoois', body: 'Álcoois tóxicos (etileno/metanol/propileno/dietilenoglicol) dão <strong>AG alto + gap osmolar</strong>. <strong>Isopropanol</strong> dá gap osmolar SEM acidose. Salicilato e metformina dão AG alto SEM gap osmolar. O gap osmolar cai à medida que o álcool é metabolizado em ácido — um gap normal não exclui ingestão tardia.' }
        }),
        {
          kind: 'mc',
          prompt: '<strong>Ato V — Conduta clínica.</strong><br>Qual é a sua conduta inicial?',
          grimoire: { title: 'Tratamento dos álcoois tóxicos', body: 'Bloquear a álcool-desidrogenase com <strong>fomepizol</strong> (ou etanol) impede a formação dos metabólitos tóxicos. <strong>Hemodiálise</strong> remove a toxina e corrige a acidose — indicada em acidose grave, lesão de órgão-alvo (visual/renal) ou níveis altos.' },
          options: [
            { label: 'Fomepizol (bloquear álcool-desidrogenase) + hemodiálise se critérios', correct: true },
            { label: 'Apenas hidratação e observação', correct: false },
            { label: 'Bicarbonato isolado, sem antídoto', correct: false },
            { label: 'Antiemético e alta', correct: false }
          ],
          explainCorrect: `AG alto + gap osmolar + IRA = intoxicação por <strong>álcool tóxico</strong> (etilenoglicol). Iniciar <strong>fomepizol</strong> imediatamente para bloquear a formação de metabólitos e indicar <strong>hemodiálise</strong> (acidose grave/lesão renal). Tiamina e piridoxina ajudam a desviar o metabolismo no etilenoglicol.`,
          explainWrong: {
            'Apenas hidratação e observação': 'A toxina continua sendo convertida em ácidos — atrasar o antídoto permite lesão renal/visual.',
            'Bicarbonato isolado, sem antídoto': 'Bicarbonato é adjuvante; sem bloquear a álcool-desidrogenase a produção de ácido continua.',
            'Antiemético e alta': 'Conduta perigosa: ignora uma intoxicação potencialmente fatal.'
          }
        }
      ],
      summary: `<strong>Acidose metabólica com AG alto (${AG}) + gap osmolar elevado (${osmGap})</strong> por <strong>etilenoglicol</strong>. A álcool-desidrogenase gera glicolato/oxalato (consome HCO₃⁻, eleva o AG) e causa IRA. Conduta: <strong>fomepizol + hemodiálise</strong> se critérios. Armadilha: isopropanol dá gap osmolar SEM acidose.`
    };
  }

  // ── Casos clínicos (Fase 3: 6 casos jogáveis) ────────────────────────────
  // Diagnóstico não aparece no hub (spoiler) — fica como metadata interna.
  // Desbloqueio é progressivo: um caso libera quando o anterior é concluído
  // (ver _isPlayable). Casos sem build() ficam como "Em breve".
  const CASES = [
    { id:'aldric',  caso:'Caso I',   title:'A Forja Escaldante',     character:'Ferreiro Aldric',     build:_buildAldric },
    { id:'mara',    caso:'Caso II',  title:'O Banquete Envenenado',  character:'Curandeira Mara',     build:_buildMara },
    { id:'theron',  caso:'Caso III', title:'Sentinela das Brumas',   character:'Guarda Theron',       build:_buildTheron  },
    { id:'vance',   caso:'Caso IV',  title:'A Rota das Especiarias', character:'Mercador Vance',      build:_buildVance   },
    { id:'kael',    caso:'Caso V',   title:'O Cerco de Aço',         character:'General Kael',        build:_buildKael    },
    { id:'vorgath', caso:'Caso VI',  title:'A Taça de Cristal Verde',character:'Alquimista Vorgath',  build:_buildVorgath }
  ];
  // Helper p/ telas internas que ainda referenciam o "chapter" antigo.
  function _chapterOf(meta){ return `${meta.caso} — ${meta.title}`; }

  // Um caso é jogável se: tem build() E (é o primeiro OU o anterior já foi
  // concluído). Casos sem build() ficam sempre bloqueados ("Em breve").
  function _isPlayable(meta, completed){
    if (typeof meta.build !== 'function') return false;
    const idx = CASES.indexOf(meta);
    if (idx <= 0) return true;
    return completed.has(CASES[idx - 1].id);
  }

  // ── UI: Hub (lista de casos) ───────────────────────────────────────────
  function showAcidBaseMinigame(){
    document.getElementById(AB_OVERLAY_ID)?.remove();
    const progress = _loadProgress();
    const completed = new Set(progress.completed || []);
    try { if (typeof _track === 'function') _track('minigame_acid_base_opened', {}); } catch {}

    const cardsHTML = CASES.map((c, idx) => {
      const isDone = completed.has(c.id);
      const hasBuild = typeof c.build === 'function';
      const playable = _isPlayable(c, completed);
      // Bloqueado por sequência: tem build, mas o caso anterior não foi concluído.
      const lockedBySeq = hasBuild && !playable;
      const stateClass = !playable ? 'ab-case-locked' : (isDone ? 'ab-case-done' : 'ab-case-ready');
      const cta = !hasBuild
        ? '🔒 Em breve'
        : (lockedBySeq ? '🔒 Conclua o caso anterior'
        : (isDone ? '↻ Jogar novamente' : '▶ Jogar'));
      const doneBadge = (playable && isDone) ? '<div class="ab-case-done-flag" title="Concluído" aria-label="Concluído">✓</div>' : '';
      const action = playable ? `data-ab-case="${c.id}"` : '';
      return `
        <button type="button" class="ab-case ${stateClass}" ${action} ${playable?'':'disabled'}>
          ${doneBadge}
          <div class="ab-case-num">${c.caso}</div>
          <div class="ab-case-title">${c.title}</div>
          <div class="ab-case-char">${c.character}</div>
          <div class="ab-case-cta">${cta}</div>
        </button>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.id = AB_OVERLAY_ID;
    overlay.className = 'nq-overlay acid-base-overlay';
    overlay.innerHTML = `
      <div class="ab-card">
        <button type="button" class="ab-close" data-ab-close aria-label="Fechar">✕</button>
        <div class="ab-scroll">
          <div class="ab-hub">
            <div class="ab-ornament">✦ A Câmara do Equilíbrio ✦</div>
            <h2 class="ab-title">Alquimista Renal</h2>
            <p class="ab-lead">Seis pacientes do reino aguardam diagnóstico ácido-base. Domine a fórmula de Winter, o ânion gap, a delta-delta e o gap osmolar para restaurar o equilíbrio.</p>
            <div class="ab-grid">${cardsHTML}</div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    _bindOverlayEvents(overlay);
  }

  function _bindOverlayEvents(overlay){
    // Fecha SOMENTE pelo botão ✕ (sem click-outside, sem ESC) para não
    // perder progresso de um ato no meio do raciocínio por engano.
    overlay.addEventListener('click', e => {
      const t = e.target;
      if (t.closest('[data-ab-close]')) { overlay.remove(); return; }
      const caseBtn = t.closest('[data-ab-case]');
      if (caseBtn){
        const id = caseBtn.getAttribute('data-ab-case');
        const c = CASES.find(x => x.id === id);
        const completed = new Set((_loadProgress().completed) || []);
        if (c && _isPlayable(c, completed)) _startCase(overlay, c);
      }
    });
  }

  // ── UI: Caso (atos sequenciais — nº variável por caso) ──────────────────
  function _startCase(overlay, meta){
    if (typeof meta.build !== 'function') return;
    // Cada partida sorteia uma instância nova: gas + atos + alvos
    // (Winter, AG) recalculados, mantendo a narrativa e os tipos de acto.
    const instance = meta.build();
    // chapter (= "Caso I — Título") + título visível (= personagem) consolidados
    // p/ que o header e o summary continuem usando kase.chapter / kase.title.
    const kase = Object.assign({}, meta, instance, {
      chapter: _chapterOf(meta),
      title: meta.character
    });
    try { if (typeof _track === 'function') _track('minigame_acid_base_case_started', { case: kase.id }); } catch {}
    const sess = { actIdx: 0, grimoireUses: 0, wrongAttempts: 0 };
    _renderIntro(overlay, kase, sess);
  }

  // Header compartilhado: caso + gasometria sempre visível em todas as telas.
  function _contextHeaderHTML(kase){
    const g = kase.gas;
    return `
      <div class="ab-context">
        <div class="ab-ornament">${kase.chapter}</div>
        <h2 class="ab-title">${kase.title}</h2>
        <p class="ab-narrative">${kase.narrative}</p>
        <div class="ab-gas-grid">
          <div class="ab-gas"><span>pH</span><strong>${g.pH}</strong></div>
          <div class="ab-gas"><span>PaCO₂</span><strong>${g.PaCO2}</strong><em>mmHg</em></div>
          <div class="ab-gas"><span>HCO₃⁻</span><strong>${g.HCO3}</strong><em>mEq/L</em></div>
          <div class="ab-gas"><span>BE</span><strong>${g.BE}</strong><em>mEq/L</em></div>
          <div class="ab-gas"><span>Na⁺</span><strong>${g.Na}</strong><em>mEq/L</em></div>
          <div class="ab-gas"><span>Cl⁻</span><strong>${g.Cl}</strong><em>mEq/L</em></div>
          <div class="ab-gas"><span>K⁺</span><strong>${g.K}</strong><em>mEq/L</em></div>
          <div class="ab-gas"><span>Albumina</span><strong>${g.alb}</strong><em>g/dL</em></div>
        </div>
      </div>`;
  }

  function _renderIntro(overlay, kase, sess){
    const card = overlay.querySelector('.ab-card');
    card.innerHTML = `
      <button type="button" class="ab-close" data-ab-close aria-label="Fechar">✕</button>
      <div class="ab-scroll">
        ${_contextHeaderHTML(kase)}
        <div class="ab-body ab-body--intro">
          <button type="button" class="ab-btn-primary" data-ab-start-acts>Iniciar Diagnóstico em ${kase.acts.length} Atos →</button>
        </div>
      </div>`;
    card.querySelector('[data-ab-start-acts]').onclick = () => _renderAct(overlay, kase, sess);
    card.querySelector('[data-ab-close]').onclick = () => overlay.remove();
  }

  function _renderAct(overlay, kase, sess){
    const act = kase.acts[sess.actIdx];
    const card = overlay.querySelector('.ab-card');
    // Bolinhas: passos já completados são clicáveis (volta ao ato anterior
     // para revisão); o ato atual e os futuros ficam inertes.
    const progressDots = kase.acts.map((_,i) => {
      const cls = i < sess.actIdx ? 'done' : i === sess.actIdx ? 'current' : '';
      const clickable = i < sess.actIdx;
      return clickable
        ? `<button type="button" class="ab-dot ${cls}" data-ab-goto="${i}" aria-label="Voltar ao Ato ${i+1}"></button>`
        : `<span class="ab-dot ${cls}"></span>`;
    }).join('');

    let bodyHTML = '';
    if (act.kind === 'mc') {
      bodyHTML = `<div class="ab-options">
        ${act.options.map((o,i) => `<button type="button" class="ab-option" data-ab-pick="${i}">${o.label}</button>`).join('')}
      </div>`;
    } else if (act.kind === 'num') {
      bodyHTML = `
        <div class="ab-num-row">
          <input type="number" step="0.1" inputmode="decimal" class="ab-num-input" id="abNumInput" placeholder="Digite o valor" aria-label="Valor calculado">
          <span class="ab-num-unit">${act.unit||''}</span>
          <button type="button" class="ab-btn-primary" data-ab-num-submit>Conferir</button>
        </div>`;
    } else if (act.kind === 'cards') {
      // Seleção persistida por id (sobrevive a voltar/avançar pelos dots).
      sess.cardSel = sess.cardSel || {};
      const sel = sess.cardSel[sess.actIdx] = sess.cardSel[sess.actIdx] || new Set();
      const cardsBtns = act.cards.map(c => {
        const isSel = sel.has(c.id);
        return `
          <button type="button" class="ab-ddx-card${isSel?' selected':''}" data-ab-card-id="${c.id}" aria-pressed="${isSel?'true':'false'}">
            <span class="ab-ddx-card-badge">${isSel?'Selecionada':''}</span>
            <span class="ab-ddx-card-title">${c.title}</span>
            <span class="ab-ddx-card-clue">${c.clue}</span>
            <span class="ab-ddx-card-mechanism">${c.mechanism}</span>
          </button>`;
      }).join('');
      bodyHTML = `
        ${act.instruction ? `<div class="ab-ddx-instruction">${act.instruction}</div>` : ''}
        <div class="ab-ddx-table">${cardsBtns}</div>
        <button type="button" class="ab-btn-primary ab-ddx-submit" data-ab-cards-submit>Conferir Conselho</button>`;
    }

    const grimoireBtn = act.grimoire
      ? `<button type="button" class="ab-grimoire-btn" data-ab-grimoire>📖 Consultar Grimório</button>`
      : '';

    card.innerHTML = `
      <button type="button" class="ab-close" data-ab-close aria-label="Fechar">✕</button>
      <div class="ab-scroll">
        ${_contextHeaderHTML(kase)}
        <div class="ab-body">
          <div class="ab-progress">${progressDots}</div>
          <div class="ab-prompt">${act.prompt}</div>
          ${grimoireBtn}
          <div class="ab-grimoire-panel" id="abGrimoirePanel" hidden></div>
          ${bodyHTML}
          <div class="ab-feedback" id="abFeedback" hidden></div>
        </div>
      </div>`;

    card.querySelector('[data-ab-close]').onclick = () => overlay.remove();
    card.querySelectorAll('[data-ab-goto]').forEach(b => {
      b.onclick = () => { sess.actIdx = parseInt(b.getAttribute('data-ab-goto'), 10); _renderAct(overlay, kase, sess); };
    });
    const grimBtn = card.querySelector('[data-ab-grimoire]');
    if (grimBtn) grimBtn.onclick = () => {
      const panel = card.querySelector('#abGrimoirePanel');
      if (!panel.hasAttribute('hidden')) { panel.setAttribute('hidden',''); return; }
      panel.innerHTML = `<div class="ab-grimoire-title">${act.grimoire.title}</div><div class="ab-grimoire-body">${act.grimoire.body}</div>`;
      panel.removeAttribute('hidden');
      sess.grimoireUses++;
    };

    if (act.kind === 'mc') {
      card.querySelectorAll('[data-ab-pick]').forEach(b => {
        b.onclick = () => _handleAnswerMC(overlay, kase, sess, parseInt(b.getAttribute('data-ab-pick'),10), b);
      });
    } else if (act.kind === 'num') {
      const input = card.querySelector('#abNumInput');
      const submit = card.querySelector('[data-ab-num-submit]');
      const go = () => _handleAnswerNum(overlay, kase, sess, parseFloat(input.value));
      submit.onclick = go;
      input.addEventListener('keydown', ev => { if (ev.key === 'Enter') go(); });
      setTimeout(() => input.focus(), 30);
    } else if (act.kind === 'cards') {
      const sel = sess.cardSel[sess.actIdx];
      card.querySelectorAll('[data-ab-card-id]').forEach(b => {
        b.onclick = () => {
          const id = b.getAttribute('data-ab-card-id');
          const nowSel = !sel.has(id);
          if (nowSel) sel.add(id); else sel.delete(id);
          b.classList.toggle('selected', nowSel);
          b.setAttribute('aria-pressed', nowSel ? 'true' : 'false');
          const badge = b.querySelector('.ab-ddx-card-badge');
          if (badge) badge.textContent = nowSel ? 'Selecionada' : '';
        };
      });
      card.querySelector('[data-ab-cards-submit]').onclick = () => _handleAnswerCards(overlay, kase, sess);
    }
  }

  function _handleAnswerMC(overlay, kase, sess, pickIdx, btn){
    const act = kase.acts[sess.actIdx];
    const picked = act.options[pickIdx];
    const card = overlay.querySelector('.ab-card');
    card.querySelectorAll('[data-ab-pick]').forEach(b => b.disabled = true);
    btn.classList.add(picked.correct ? 'correct' : 'wrong');
    if (picked.correct) {
      _showFeedback(card, true, act.explainCorrect);
    } else {
      sess.wrongAttempts++;
      const why = (act.explainWrong && act.explainWrong[picked.label]) || '';
      const correctOpt = act.options.find(o => o.correct);
      _showFeedback(card, false, `${why} <br><br><strong>Resposta correta:</strong> ${correctOpt.label}.<br>${act.explainCorrect}`);
    }
    _appendNextBtn(card, overlay, kase, sess);
  }

  function _handleAnswerNum(overlay, kase, sess, value){
    const act = kase.acts[sess.actIdx];
    if (!Number.isFinite(value)) return;
    const card = overlay.querySelector('.ab-card');
    const ok = Math.abs(value - act.target) <= act.tolerance;
    card.querySelector('[data-ab-num-submit]').disabled = true;
    card.querySelector('#abNumInput').disabled = true;
    if (ok) {
      _showFeedback(card, true, act.explainCorrect);
    } else {
      sess.wrongAttempts++;
      _showFeedback(card, false, `Valor informado: <strong>${value}</strong>. Resposta esperada: <strong>${act.target} ${act.unit||''}</strong> (±${act.tolerance}).<br><br>${act.explainWrong}<br><br>${act.explainCorrect}`);
    }
    _appendNextBtn(card, overlay, kase, sess);
  }

  function _handleAnswerCards(overlay, kase, sess){
    const act = kase.acts[sess.actIdx];
    const card = overlay.querySelector('.ab-card');
    const sel = (sess.cardSel && sess.cardSel[sess.actIdx]) || new Set();
    const correctIds = new Set(act.cards.filter(c => c.correct).map(c => c.id));

    let correctSel = 0, missed = 0, wrong = 0;
    act.cards.forEach(c => {
      const el = card.querySelector(`[data-ab-card-id="${c.id}"]`);
      const picked = sel.has(c.id);
      const badge = el && el.querySelector('.ab-ddx-card-badge');
      if (c.correct && picked)      { el.classList.add('correct'); if (badge) badge.textContent = 'Correta';     correctSel++; }
      else if (c.correct && !picked){ el.classList.add('missed');  if (badge) badge.textContent = 'Você esqueceu'; missed++; }
      else if (!c.correct && picked){ el.classList.add('wrong');   if (badge) badge.textContent = 'Armadilha';   wrong++; }
      if (el){ el.disabled = true; el.setAttribute('aria-disabled', 'true'); }
    });
    const perfect = (missed === 0 && wrong === 0 && correctSel === correctIds.size);
    if (!perfect) sess.wrongAttempts++;
    const submitBtn = card.querySelector('[data-ab-cards-submit]');
    if (submitBtn) submitBtn.disabled = true;

    try { if (typeof _track === 'function') _track('minigame_acid_base_cards_checked', {
      case: kase.id, correctCount: correctSel, selectedCount: sel.size, missedCount: missed, wrongCount: wrong, perfect
    }); } catch {}

    // Feedback estruturado: corretas acertadas / esquecidas / armadilhas.
    const _section = (title, list) => list.length ? `
      <div class="ab-ddx-feedback-section">
        <div class="ab-ddx-feedback-title">${title}</div>
        ${list.map(c => `<div class="ab-ddx-feedback-item"><strong>${c.title}.</strong> ${c.why}</div>`).join('')}
      </div>` : '';
    const goodPicks   = act.cards.filter(c => c.correct && sel.has(c.id));
    const missedCards = act.cards.filter(c => c.correct && !sel.has(c.id));
    const wrongCards  = act.cards.filter(c => !c.correct && sel.has(c.id));
    const head = perfect
      ? 'Conselho perfeito — você reconheceu todas as causas compatíveis e evitou as armadilhas.'
      : 'Reveja o conselho abaixo:';
    const html = `<div class="ab-ddx-feedback">${head}
      ${_section('✓ Corretas', goodPicks)}
      ${_section('Você esqueceu', missedCards)}
      ${_section('Armadilhas selecionadas', wrongCards)}
    </div>`;
    _showFeedback(card, perfect, html);
    _appendNextBtn(card, overlay, kase, sess);
  }

  function _showFeedback(card, ok, html){
    const fb = card.querySelector('#abFeedback');
    fb.className = 'ab-feedback ' + (ok ? 'ok' : 'err');
    fb.innerHTML = `<div class="ab-feedback-icon">${ok ? '✓' : '✗'}</div><div class="ab-feedback-body">${html}</div>`;
    fb.removeAttribute('hidden');
  }

  function _appendNextBtn(card, overlay, kase, sess){
    // Botão fica FORA do .ab-feedback (que é flex row) para ocupar largura
    // total abaixo, em vez de virar o terceiro item flex e esmagar o texto.
    card.querySelector('.ab-next')?.remove();
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'ab-btn-primary ab-next';
    const isLast = sess.actIdx >= kase.acts.length - 1;
    next.textContent = isLast ? 'Concluir Caso →' : 'Próximo Ato →';
    next.onclick = () => {
      if (isLast) { _renderSummary(overlay, kase, sess); }
      else { sess.actIdx++; _renderAct(overlay, kase, sess); }
    };
    const fb = card.querySelector('#abFeedback');
    fb.insertAdjacentElement('afterend', next);
    setTimeout(() => next.focus(), 30);
  }

  function _renderSummary(overlay, kase, sess){
    _markCompleted(kase.id, sess.grimoireUses);
    try { if (typeof _track === 'function') _track('minigame_acid_base_case_completed', {
      case: kase.id, grimoireUses: sess.grimoireUses, wrongAttempts: sess.wrongAttempts
    }); } catch {}
    const card = overlay.querySelector('.ab-card');
    const flawless = sess.wrongAttempts === 0;
    // Referências do caso = fórmulas e trials do Grimório usados nos atos.
    const refs = (kase.acts || []).filter(a => a.grimoire).map(a => a.grimoire);
    const refsHTML = refs.length ? `
          <div class="ab-refs">
            <div class="ab-refs-title">📖 Referências do Grimório</div>
            ${refs.map(r => `
              <div class="ab-ref-card">
                <div class="ab-ref-name">${r.title}</div>
                <div class="ab-ref-body">${r.body}</div>
              </div>`).join('')}
          </div>` : '';
    card.innerHTML = `
      <button type="button" class="ab-close" data-ab-close aria-label="Fechar">✕</button>
      <div class="ab-scroll">
        ${_contextHeaderHTML(kase)}
        <div class="ab-body ab-summary-view">
          <div class="ab-ornament">${kase.chapter} — Concluído</div>
          <h3 class="ab-summary-title">${flawless ? '🏆 Diagnóstico Impecável' : '✓ Caso Concluído'}</h3>
          <div class="ab-summary-text">${kase.summary}</div>
          <div class="ab-summary-stats">
            <div><span>Erros</span><strong>${sess.wrongAttempts}</strong></div>
            <div><span>Grimório</span><strong>${sess.grimoireUses}×</strong></div>
          </div>
          ${refsHTML}
          <div class="ab-summary-actions">
            <button type="button" class="ab-btn-secondary" data-ab-back>← Voltar à Câmara</button>
            <button type="button" class="ab-btn-primary" data-ab-replay>↻ Jogar novamente (novos valores)</button>
          </div>
        </div>
      </div>`;
    card.querySelector('[data-ab-close]').onclick = () => overlay.remove();
    card.querySelector('[data-ab-back]').onclick = () => { overlay.remove(); showAcidBaseMinigame(); };
    card.querySelector('[data-ab-replay]').onclick = () => {
      const meta = CASES.find(c => c.id === kase.id);
      if (meta) _startCase(overlay, meta);
    };
  }

  // ── Expor entry point ──────────────────────────────────────────────────
  window.showAcidBaseMinigame = showAcidBaseMinigame;
})();
