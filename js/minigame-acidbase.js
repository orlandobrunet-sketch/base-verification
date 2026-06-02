// NefroQuest — Minigame: A Câmara do Equilíbrio (Ácido-Base)
// Plain script — shares global scope with game.js
// Fase 1: hub + Caso 1 (Ferreiro Aldric — acidose metabólica + Winter)

(function(){
  const AB_KEY = 'nq-acidbase-progress';
  const AB_OVERLAY_ID = 'acidBaseOverlay';
  // Logs de verificação só em debug (não poluir o console em produção).
  // Ative no DevTools com: window.NQ_ACIDBASE_DEBUG = true
  function _dbg(label, data){
    if (typeof window !== 'undefined' && window.NQ_ACIDBASE_DEBUG) {
      try { console.info('[Câmara] ' + label, data); } catch {}
    }
  }

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
  // Formata número para exibição em pt-BR (vírgula decimal). Inteiros ficam iguais.
  function _c(n){ return String(n).replace('.', ','); }
  // Henderson–Hasselbalch: pH = 6,1 + log10(HCO3 / (0,03 × PaCO2))
  function _ph(HCO3, PaCO2){ return _r2(6.1 + Math.log10(HCO3 / (0.03 * PaCO2))); }
  // Base excess pela equação de Van Slyke. A fórmula antiga ((HCO3−24)−0,4×(40−PaCO2))
  // produzia BE enganoso em distúrbios respiratórios (ex.: acidose respiratória aguda
  // dava BE muito positivo, sugerindo alcalose metabólica inexistente). Van Slyke usa
  // o pH e dá ~0 em distúrbios respiratórios puros, refletindo só o componente metabólico.
  function _be(HCO3, PaCO2){ return Math.round(0.9287 * (HCO3 - 24.4 + 14.83 * (_ph(HCO3, PaCO2) - 7.4))); }

  // ── Mesa de Cartas (Ato do Conselho dos Diagnósticos) ───────────────────
  // Modelo de duas faces:
  //   pre    → pistas clínicas/laboratoriais visíveis ANTES de confirmar
  //   reveal → mecanismo (cadeia causal) + "why", revelados SÓ após confirmar
  // A fisiopatologia nunca aparece antes do julgamento (não entrega a resposta).
  function _makeCard(id, title, clinical, lab, correct, mechanism, why){
    return { id, title, pre: { clinical, lab }, correct, reveal: { mechanism, why } };
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
  // Falas do Arquivista e narrativas do ato (genéricas a todos os casos).
  const _DDX_NARRATIVE_PRE = 'O diagnóstico principal foi aceito. Mas a Câmara exige domínio do padrão, não apenas do caso. O Arquivista espalha cartas lacradas sobre a mesa — algumas pertencem ao mesmo distúrbio ácido-base, outras são armadilhas. Os mecanismos só serão revelados após o julgamento.';
  const _DDX_NARRATIVE_POST = 'O Arquivista abre os selos. As cartas verdadeiras brilham; as armadilhas revelam seu engano fisiológico.';
  const _DDX_ARQUIVISTA_PRE = 'Não basta nomear o distúrbio. É preciso reconhecer seus imitadores.';
  const _DDX_ARQUIVISTA_PERFECT = 'Você não decorou: reconheceu o mecanismo.';
  const _DDX_ARQUIVISTA_PARTIAL = 'A armadilha mais comum é confundir qualquer bicarbonato baixo com acidose de ânion gap alto.';

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
    _dbg('Aldric rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, winterExpected, AG });

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
          explainCorrect: `pH ${_c(pH)} → <strong>acidemia</strong> (< 7,35). HCO₃⁻ ${HCO3} mEq/L (baixo) acompanha a acidemia → distúrbio primário é <strong>metabólico</strong>. PaCO₂ ${PaCO2} mmHg também está baixo (taquipneia), sugerindo compensação respiratória em curso — <em>adequada ou não, será calculado no Ato II</em>.`,
          explainWrong: {
            'Acidose respiratória': `Numa acidose respiratória primária, PaCO₂ estaria <em>alto</em> e HCO₃⁻ subiria para compensar. Aqui PaCO₂ ${PaCO2} está baixo.`,
            'Alcalose metabólica': `Alcalose teria pH > 7,45 e HCO₃⁻ alto. Aqui pH ${_c(pH)} (ácido) e HCO₃⁻ ${HCO3} (baixo).`,
            'Alcalose respiratória': `Alcalose teria pH > 7,45. Aqui pH ${_c(pH)}.`
          }
        },
        {
          kind: 'num',
          prompt: `<strong>Ato II — Compensação esperada (Winter).</strong><br>Calcule a PaCO₂ esperada pela compensação respiratória.`,
          grimoire: { title: 'Fórmula de Winter', body: '<code>PaCO₂ esperado = 1,5 × HCO₃⁻ + 8 (±2)</code><br>Aplica-se apenas a <em>acidose metabólica</em>.' },
          unit: 'mmHg',
          target: winterExpected,
          tolerance: 2,
          explainCorrect: `PaCO₂ esperada = 1,5 × ${HCO3} + 8 = <strong>${_c(winterExpected)} mmHg (±2)</strong>. O valor real (${PaCO2}) está dentro da faixa → a compensação respiratória é <strong>adequada</strong>. Não há distúrbio respiratório associado.`,
          explainWrong: `Reveja: 1,5 × ${HCO3} = ${_c(_r1(1.5*HCO3))}. Some 8 → ${_c(winterExpected)}. Tolerância ±2.`
        },
        {
          kind: 'num',
          prompt: `<strong>Ato III — Ânion gap.</strong><br>Calcule o AG sérico (albumina = ${_c(alb)} g/dL).`,
          grimoire: { title: 'Ânion gap', body: '<code>AG = Na⁺ − (Cl⁻ + HCO₃⁻)</code><br>Normal: 8–12 mEq/L. Corrigir para albumina: <code>AG_corrigido = AG + 2,5 × (4 − alb)</code>.' },
          unit: 'mEq/L',
          target: AG,
          tolerance: 1,
          explainCorrect: `AG = ${Na} − (${Cl} + ${HCO3}) = <strong>${AG} mEq/L</strong> (alto, normal 8–12). Albumina ${_c(alb)} g/dL → sem correção significativa. <strong>AG elevado</strong> indica acúmulo de ácido orgânico — investigar <strong>lactato</strong> (exercício extremo + hipovolemia).`,
          explainWrong: `AG = Na − (Cl + HCO₃). Aqui: ${Na} − (${Cl} + ${HCO3}) = ${AG}.`
        },
        _buildCardsAct({
          prompt: '<strong>Ato IV — O Conselho dos Diagnósticos.</strong><br>Selecione <em>todas</em> as causas que também produzem este padrão (acidose metabólica com ânion gap alto). Não selecione causas de outro padrão.',
          instruction: 'Os mecanismos serão revelados somente após o julgamento.',
          cards: [
            _makeCard('sepsis_lactate', 'Sepse / choque', 'Febre, hipotensão, má perfusão', 'Lactato alto, AG elevado', true, 'Hipoperfusão/disfunção mitocondrial → lactato ↑ → HCO₃⁻ consumido → AG ↑.', 'Reproduz acidose metabólica com ânion gap alto; pode coexistir com alcalose respiratória por febre e citocinas.'),
            _makeCard('dka', 'Cetoacidose diabética', 'Poliúria, dor abdominal, respiração de Kussmaul', 'Cetonemia, glicose alta, AG elevado', true, 'Insulina ↓ + glucagon/catecolaminas ↑ → lipólise → β-hidroxibutirato/acetoacetato ↑ → HCO₃⁻ consumido → AG ↑.', 'Causa clássica de acidose metabólica com AG alto.'),
            _makeCard('euglycemic_ka', 'Cetoacidose euglicêmica (iSGLT2)', 'Diabético em iSGLT2, jejum ou infecção', 'Cetonemia com glicose normal ou pouco elevada', true, 'Glicosúria reduz a glicemia aparente; insulina efetiva ↓ + glucagon ↑ → cetogênese → AG ↑.', 'Acidose grave pode ocorrer sem hiperglicemia marcada — a glicemia normal engana.'),
            _makeCard('alcoholic_ka', 'Cetoacidose alcoólica / jejum', 'Álcool, vômitos, jejum prolongado', 'Glicose baixa/normal, cetose, AG elevado', true, 'Jejum + NADH alto pelo etanol → β-hidroxibutirato ↑ → HCO₃⁻ consumido → AG ↑.', 'Causa AG alto e pode coexistir com alcalose metabólica por vômitos.'),
            _makeCard('uremia', 'Uremia / DRC avançada', 'DRC avançada, sintomas urêmicos', 'TFG muito baixa, fosfato alto, AG elevado', true, 'Menor excreção de ácidos fixos + menor amoniagênese → sulfato/fosfato/ácidos orgânicos retidos → AG ↑.', 'Causa nefrológica clássica de acidose metabólica com AG alto.'),
            _makeCard('ethylene_glycol', 'Etilenoglicol', 'Ingestão tóxica, confusão, dor lombar', 'Gap osmolar, IRA, cristais de oxalato', true, 'Etilenoglicol → glicolato/oxalato → HCO₃⁻ consumido → AG ↑; oxalato de cálcio precipita → IRA.', 'Intoxicação com AG alto e lesão renal aguda.'),
            _makeCard('salicylate', 'Salicilato', 'Zumbido, febre, taquipneia', 'PaCO₂ muito baixo, AG elevado', true, 'Estímulo respiratório central → alcalose respiratória; desacoplamento oxidativo → lactato/cetoácidos ↑ → AG ↑.', 'Distúrbio misto clássico: AG alto somado a alcalose respiratória.'),
            _makeCard('diarrhea', 'Diarreia', 'Perda fecal volumosa', 'HCO₃⁻ baixo, Cl⁻ alto, AG normal', false, 'Perda fecal de HCO₃⁻ → Cl⁻ sobe para eletroneutralidade → acidose hiperclorêmica.', 'É armadilha: causa acidose metabólica, mas com ânion gap NORMAL.'),
            _makeCard('vomiting', 'Vômitos', 'Náuseas, perda de conteúdo gástrico', 'Hipocloremia, K⁺ baixo', false, 'Perda de HCl gástrico → HCO₃⁻ sobe → alcalose metabólica.', 'É armadilha: produz alcalose metabólica, direção oposta ao padrão.'),
            _makeCard('rta1', 'ATR tipo 1 (distal)', 'Nefrolitíase, nefrocalcinose, Sjögren', 'pH urinário alto, K⁺ baixo, AG normal', false, 'Falha distal de secreção de H⁺ → acidose metabólica hiperclorêmica.', 'É armadilha: acidose com AG normal, não AG alto.')
          ],
          grimoire: {
            title: 'O padrão: acidose metabólica com AG alto',
            body: 'Ocorre quando <strong>ácidos não medidos se acumulam</strong> e consomem HCO₃⁻. O ânion gap (Na⁺ − Cl⁻ − HCO₃⁻) diferencia esse grupo da acidose hiperclorêmica (AG normal). Reconheça o padrão pelas pistas antes de nomear cada causa.'
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
          explainCorrect: `A causa provável é <strong>acidose láctica por hipoperfusão</strong> (desidratação + esforço). Tratar a causa: ressuscitação volêmica. Pelo <strong>BICAR-ICU (Lancet 2018)</strong>, bicarbonato só tem benefício de mortalidade se <strong>pH ≤ 7,20 + AKI KDIGO 2/3</strong> — aqui pH ${_c(pH)} não atinge o limiar e a função renal ainda precisa ser avaliada. Hemodiálise sem indicação clara no momento.`,
          explainWrong: {
            'Bolus de bicarbonato de sódio 8,4% IV imediato': `Pelo <strong>BICAR-ICU</strong>, bicarbonato só reduz mortalidade no subgrupo com pH ≤ 7,20 + AKI KDIGO 2/3. Aqui pH ${_c(pH)} ${pH<=7.20?'atinge o limiar de pH, mas falta confirmar AKI 2/3 e tratar a causa primeiro':'não atinge o limiar'}. Tratar a causa (volume) é a prioridade.`,
            'Intubação e hiperventilação mecânica': 'A compensação respiratória já é adequada (Winter). Intubar sem indicação ventilatória prejudica a compensação espontânea.',
            'Hemodiálise de urgência': 'Sem indicação clássica de HD aguda (sem AEIOU: Acidose refratária, distúrbio Eletrolítico, Intoxicação, sObrecarga, Uremia).'
          }
        }
      ],
      summary: `<strong>Acidose metabólica com AG alto (${AG})</strong> + compensação respiratória adequada (Winter prevê ${_c(winterExpected)}, real ${PaCO2}). Causa provável: <strong>acidose láctica</strong> por hipoperfusão (calor + esforço + desidratação). Conduta: volume + investigar lactato.`
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
    _dbg('Mara rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, compExpected, AG, ClU });

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
          explainCorrect: `pH ${_c(pH)} → <strong>alcalemia</strong> (> 7,45). HCO₃⁻ ${HCO3} mEq/L (alto) acompanha a alcalemia → distúrbio primário é <strong>metabólico</strong>. PaCO₂ ${PaCO2} mmHg está elevado (hipoventilação), sugerindo compensação respiratória em curso — <em>adequada ou não, será calculado no Ato II</em>.`,
          explainWrong: {
            'Alcalose respiratória': `Numa alcalose respiratória primária, PaCO₂ estaria <em>baixo</em> e o HCO₃⁻ cairia para compensar. Aqui PaCO₂ ${PaCO2} está alto e HCO₃⁻ ${HCO3} está alto.`,
            'Acidose metabólica': `Acidose metabólica teria pH < 7,35 e HCO₃⁻ baixo. Aqui pH ${_c(pH)} (alcalino) e HCO₃⁻ ${HCO3} (alto).`,
            'Acidose respiratória': `Acidose respiratória teria pH < 7,35 com PaCO₂ alto como causa primária. Aqui o pH é ${_c(pH)} (alcalino).`
          }
        },
        {
          kind: 'num',
          prompt: `<strong>Ato II — Compensação esperada.</strong><br>Calcule a PaCO₂ esperada pela compensação respiratória.`,
          grimoire: { title: 'Compensação respiratória — alcalose metabólica', body: '<code>PaCO₂ esperado = 0,7 × HCO₃⁻ + 21 (±2)</code><br>A hipoventilação compensatória é limitada (raramente PaCO₂ > 55 mmHg) pelo estímulo hipoxêmico.' },
          unit: 'mmHg',
          target: compExpected,
          tolerance: 5,
          explainCorrect: `PaCO₂ esperada = 0,7 × ${HCO3} + 21 = <strong>${_c(compExpected)} mmHg (±5)</strong>. A compensação respiratória da alcalose metabólica tem variância ampla (raramente PaCO₂ > 55). O valor real (${PaCO2}) está na faixa → compensação <strong>adequada</strong>, sem distúrbio respiratório associado.`,
          explainWrong: `Reveja: 0,7 × ${HCO3} = ${_c(_r1(0.7*HCO3))}. Some 21 → ${_c(compExpected)}. Tolerância ±5 (variância clínica ampla).`
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
          prompt: '<strong>Ato IV — O Conselho dos Diagnósticos.</strong><br>Selecione <em>todas</em> as causas que também produzem este padrão (alcalose metabólica). Não selecione causas de outro padrão.',
          instruction: 'Os mecanismos serão revelados somente após o julgamento.',
          cards: [
            _makeCard('vomiting', 'Vômitos / SNG', 'Náuseas, perda de conteúdo gástrico', 'Hipocloremia, K⁺ baixo, Cl⁻ urinário baixo', true, 'Perda de HCl gástrico → hipocloremia impede a troca Cl⁻/HCO₃⁻; hipovolemia ativa o RAAS → secreção distal de H⁺ persiste → HCO₃⁻ ↑.', 'Alcalose metabólica salina-responsiva clássica; compatível com o padrão.'),
            _makeCard('diuretic', 'Diuréticos (alça/tiazida)', 'Poliúria, uso de diurético', 'K⁺ e Cl⁻ baixos', true, 'Maior oferta distal de Na⁺ + ativação do RAAS → secreção de H⁺/K⁺ ↑; a contração de volume concentra o HCO₃⁻ → alcalose.', 'Causa comum de alcalose metabólica; o Cl⁻ urinário pode estar alto se o diurético ainda age.'),
            _makeCard('hyperaldo', 'Hiperaldosteronismo primário', 'Hipertensão resistente, fraqueza', 'K⁺ baixo, HCO₃⁻ alto, Cl⁻ urinário alto', true, 'Aldosterona ↑ → ENaC ↑ → lúmen mais negativo → secreção distal de H⁺/K⁺ ↑ → alcalose metabólica hipocalêmica.', 'Alcalose salina-resistente; entra no diferencial das alcaloses.'),
            _makeCard('bartter', 'Síndrome de Bartter', 'Normotenso, jovem, poliúria', 'K⁺ baixo, Ca urinário alto', true, 'Defeito tipo furosemida no ramo ascendente → ativação do RAAS → perda renal de H⁺/K⁺ → alcalose; cursa normotenso.', 'Alcalose hipocalêmica normotensa; compatível com o padrão.'),
            _makeCard('gitelman', 'Síndrome de Gitelman', 'Normotenso, cãibras', 'K⁺ baixo, Mg²⁺ baixo, Ca urinário baixo', true, 'Defeito tipo tiazida no túbulo distal → ativação do RAAS → alcalose hipocalêmica; hipomagnesemia associada.', 'Alcalose hipocalêmica normotensa com Mg baixo; compatível com o padrão.'),
            _makeCard('posthypercapnia', 'Pós-hipercapnia', 'DPOC ventilado rapidamente', 'HCO₃⁻ alto, PaCO₂ normalizando', true, 'Na hipercapnia crônica o rim retém HCO₃⁻; se a PaCO₂ cai rápido com a ventilação, o HCO₃⁻ alto persiste por dias → alcalose.', 'Mantém alcalose em pacientes pulmonares; reconheça pela história ventilatória.'),
            _makeCard('diarrhea', 'Diarreia', 'Perda fecal volumosa', 'HCO₃⁻ baixo, Cl⁻ alto, AG normal', false, 'Perda fecal de HCO₃⁻ → Cl⁻ sobe para eletroneutralidade → acidose hiperclorêmica.', 'É armadilha: causa acidose hiperclorêmica, direção oposta à alcalose.'),
            _makeCard('rta4', 'ATR tipo 4', 'Diabético, IECA/espironolactona', 'K⁺ alto, HCO₃⁻ baixo, AG normal', false, 'Hipoaldosteronismo → menor secreção distal de H⁺/K⁺ → acidose hiperclorêmica com hipercalemia.', 'É armadilha: acidose hipercalêmica, não alcalose.'),
            _makeCard('sepsis', 'Sepse com lactato', 'Febre, hipotensão', 'Lactato alto, AG elevado', false, 'Hipoperfusão → lactato ↑ (ânion não medido) → HCO₃⁻ consumido → acidose com AG alto.', 'É armadilha: acidose com AG alto, não alcalose.')
          ],
          grimoire: {
            title: 'O padrão: alcalose metabólica',
            body: 'HCO₃⁻ sobe por perda de H⁺ ou ganho de base, e só se mantém se o rim não consegue excretar o excesso de HCO₃⁻ (hipovolemia, hipocloremia, hipocalemia, aldosterona). O <strong>Cl⁻ urinário</strong> separa salina-responsiva (&lt; 20) de salina-resistente (&gt; 20).'
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
      summary: `<strong>Alcalose metabólica salina-responsiva</strong> (Cl⁻ urinário ${ClU} < 20) por perda de HCl (vômitos), com <strong>hipocalemia</strong> (K ${K}) e compensação respiratória adequada (esperado ${_c(compExpected)}, real ${PaCO2}). Conduta: SF 0,9% + KCl.`
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
    _dbg('Theron rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, expHCO3, PaO2 });

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
          explainCorrect: `pH ${_c(pH)} → <strong>alcalemia</strong> (> 7,45). A PaCO₂ ${PaCO2} mmHg (baixa) acompanha a alcalemia → o processo primário é <strong>respiratório</strong> (hiperventilação). O HCO₃⁻ ${HCO3} levemente reduzido é a resposta renal, não a causa.`,
          explainWrong: {
            'Alcalose metabólica': `Alcalose metabólica teria HCO₃⁻ alto como causa. Aqui o HCO₃⁻ ${HCO3} está baixo e a PaCO₂ ${PaCO2} baixa explica a alcalemia.`,
            'Acidose respiratória': `Acidose respiratória teria pH < 7,35 e PaCO₂ alta. Aqui pH ${_c(pH)} e PaCO₂ ${PaCO2} (baixa).`,
            'Acidose metabólica': `Acidose teria pH < 7,35 e HCO₃⁻ baixo como causa. Aqui o pH é ${_c(pH)} (alcalino).`
          }
        },
        {
          kind: 'num',
          prompt: '<strong>Ato II — Compensação aguda.</strong><br>Calcule o HCO₃⁻ esperado para esta alcalose respiratória <em>aguda</em>.',
          grimoire: { title: 'Compensação — alcalose respiratória', body: '<strong>Aguda:</strong> HCO₃⁻ cai ~2 mEq/L para cada −10 mmHg de PaCO₂.<br><strong>Crônica:</strong> cai ~4–5 mEq/L para cada −10 mmHg.<br><code>HCO₃⁻ esperado (aguda) = 24 − 2 × (40 − PaCO₂)/10</code>' },
          unit: 'mEq/L',
          target: expHCO3,
          tolerance: 2,
          explainCorrect: `HCO₃⁻ esperado = 24 − 2 × (40 − ${PaCO2})/10 = <strong>${_c(expHCO3)} mEq/L</strong>. O valor real (${HCO3}) bate com o esperado → alcalose respiratória aguda <strong>isolada</strong>, sem distúrbio metabólico associado.`,
          explainWrong: `Aguda: cada −10 mmHg de PaCO₂ baixa ~2 de HCO₃⁻. 24 − 2 × (40 − ${PaCO2})/10 = ${_c(expHCO3)}.`
        },
        {
          kind: 'mc',
          prompt: `<strong>Ato III — Distúrbio associado?</strong><br>O HCO₃⁻ medido (${HCO3}) é praticamente igual ao esperado (${_c(expHCO3)}). O que isso indica?`,
          grimoire: { title: 'Compensação adequada vs distúrbio misto', body: 'Se o HCO₃⁻ medido coincide com o esperado para a compensação, o distúrbio é simples. HCO₃⁻ <em>muito mais baixo</em> que o esperado sugere acidose metabólica associada; <em>mais alto</em> sugere alcalose metabólica associada.' },
          options: [
            { label: 'Alcalose respiratória aguda isolada (compensação adequada)', correct: true },
            { label: 'Alcalose respiratória + acidose metabólica', correct: false },
            { label: 'Alcalose respiratória + alcalose metabólica', correct: false },
            { label: 'Distúrbio triplo', correct: false }
          ],
          explainCorrect: `Como o HCO₃⁻ real (${HCO3}) coincide com o esperado (${_c(expHCO3)}), trata-se de <strong>alcalose respiratória aguda isolada</strong> — a queda do HCO₃⁻ é apenas a resposta tampão/renal precoce, não um segundo distúrbio.`,
          explainWrong: {
            'Alcalose respiratória + acidose metabólica': `Exigiria HCO₃⁻ bem <em>abaixo</em> do esperado. Aqui real ${HCO3} ≈ esperado ${_c(expHCO3)}.`,
            'Alcalose respiratória + alcalose metabólica': `Exigiria HCO₃⁻ <em>acima</em> do esperado. Aqui real ${HCO3} ≈ esperado ${_c(expHCO3)}.`,
            'Distúrbio triplo': `Não há dados para três distúrbios; o padrão é de alcalose respiratória aguda simples.`
          }
        },
        _buildCardsAct({
          prompt: '<strong>Ato IV — O Conselho dos Diagnósticos.</strong><br>Selecione <em>todas</em> as causas que também produzem este padrão (alcalose respiratória). Não selecione causas de outro padrão.',
          instruction: 'Os mecanismos serão revelados somente após o julgamento.',
          cards: [
            _makeCard('tep', 'Tromboembolismo pulmonar', 'Dispneia súbita, dor pleurítica, imobilização', 'Hipoxemia, PaCO₂ baixo', true, 'Êmbolo → espaço morto + hipoxemia → quimiorreceptores ↑ ventilação → CO₂ eliminado → alcalose respiratória.', 'Causa grave e tempo-dependente; imobilização + dispneia + hipoxemia é altamente sugestivo.'),
            _makeCard('pneumonia', 'Pneumonia', 'Febre, tosse, dispneia', 'Hipoxemia, PaCO₂ baixo', true, 'Hipoxemia → quimiorreceptores periféricos ↑ ventilação → PaCO₂ ↓ → alcalose respiratória.', 'Qualquer pneumopatia aguda hipoxêmica gera hiperventilação.'),
            _makeCard('sepse_resp', 'Sepse inicial', 'Febre, taquipneia', 'Lactato ainda normal, PaCO₂ baixo', true, 'Citocinas e febre → estímulo direto do centro respiratório (antes de a hipoperfusão gerar lactato) → alcalose respiratória.', 'Fase precoce da sepse; depois pode somar acidose lática.'),
            _makeCard('gestacao', 'Gestação', 'Gestante, dispneia leve crônica', 'PaCO₂ basal baixo, HCO₃⁻ levemente baixo', true, 'Progesterona ↑ sensibilidade do centro respiratório ao CO₂ → volume-minuto ↑ → alcalose respiratória crônica.', 'Alcalose respiratória fisiológica da gravidez, compensada pelo rim.'),
            _makeCard('salicilato_resp', 'Salicilato', 'Zumbido, taquipneia, febre', 'PaCO₂ muito baixo, AG elevado', true, 'Estímulo respiratório central → alcalose respiratória; em paralelo gera acidose com AG alto.', 'O componente respiratório precoce do salicilato é alcalose; reconheça o padrão misto.'),
            _makeCard('altitude', 'Grande altitude', 'Exposição a alta montanha', 'Hipoxemia hipobárica, PaCO₂ baixo', true, 'Hipóxia hipobárica → quimiorreceptores ↑ ventilação → PaCO₂ ↓ → alcalose respiratória.', 'Causa ambiental clássica de hiperventilação hipoxêmica.'),
            _makeCard('opioide', 'Opioide / sedação', 'Sonolência, respiração lenta', 'PaCO₂ alto', false, 'Deprime o centro respiratório → hipoventilação → retenção de CO₂ → acidose respiratória.', 'É armadilha: causa acidose respiratória, direção oposta.'),
            _makeCard('dpoc_fadiga', 'DPOC com fadiga', 'Hipercapnia crônica que piora', 'PaCO₂ alto, HCO₃⁻ alto', false, 'Obstrução + fadiga muscular → ventilação alveolar ↓ → CO₂ ↑ → acidose respiratória.', 'É armadilha: hipoventilação → acidose respiratória.'),
            _makeCard('vomitos_resp', 'Vômitos', 'Perda de conteúdo gástrico', 'HCO₃⁻ alto, hipocloremia', false, 'Perda de HCl gástrico → HCO₃⁻ ↑ → alcalose metabólica.', 'É armadilha: alcalose metabólica, não distúrbio respiratório.')
          ],
          grimoire: { title: 'O padrão: alcalose respiratória', body: 'A hiperventilação alveolar elimina CO₂ → H₂CO₃ cai → alcalemia. Pense em três motores: <strong>hipoxemia</strong> (TEP, pneumonia, altitude), <strong>estímulo central</strong> (sepse, salicilato, dor, gestação) e <strong>iatrogenia</strong> (ventilação excessiva). Excluir causas graves antes de atribuir à ansiedade.' }
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
      summary: `<strong>Alcalose respiratória aguda</strong> por hiperventilação hipoxêmica, provável <strong>TEP</strong> (imobilização + dispneia súbita + hipoxemia). HCO₃⁻ ${HCO3} ≈ esperado ${_c(expHCO3)} → distúrbio simples. Conduta: investigar TEP, O₂, tratar a causa. Armadilha: rotular como ansiedade.`
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
    _dbg('Vance rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, winterExpected, AG });

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
          explainCorrect: `pH ${_c(pH)} → <strong>acidemia</strong> (< 7,35). HCO₃⁻ ${HCO3} mEq/L (baixo) acompanha a acidemia → distúrbio primário <strong>metabólico</strong>. PaCO₂ ${PaCO2} mmHg baixa é a compensação respiratória.`,
          explainWrong: {
            'Acidose respiratória': `Teria PaCO₂ alta como causa. Aqui a PaCO₂ ${PaCO2} está baixa (compensando).`,
            'Alcalose metabólica': `Teria pH > 7,45 e HCO₃⁻ alto. Aqui pH ${_c(pH)} e HCO₃⁻ ${HCO3} (baixo).`,
            'Alcalose respiratória': `Teria pH > 7,45. Aqui pH ${_c(pH)}.`
          }
        },
        {
          kind: 'num',
          prompt: '<strong>Ato II — Compensação esperada (Winter).</strong><br>Calcule a PaCO₂ esperada pela compensação respiratória.',
          grimoire: { title: 'Fórmula de Winter', body: '<code>PaCO₂ esperado = 1,5 × HCO₃⁻ + 8 (±2)</code><br>Aplica-se à <em>acidose metabólica</em>.' },
          unit: 'mmHg',
          target: winterExpected,
          tolerance: 2,
          explainCorrect: `PaCO₂ esperada = 1,5 × ${HCO3} + 8 = <strong>${_c(winterExpected)} mmHg (±2)</strong>. O valor real (${PaCO2}) está na faixa → compensação adequada, sem componente respiratório.`,
          explainWrong: `1,5 × ${HCO3} = ${_c(_r1(1.5*HCO3))}; + 8 = ${_c(winterExpected)}. Tolerância ±2.`
        },
        {
          kind: 'num',
          prompt: `<strong>Ato III — Ânion gap.</strong><br>Calcule o AG sérico (albumina = ${_c(alb)} g/dL).`,
          grimoire: { title: 'Ânion gap', body: '<code>AG = Na⁺ − (Cl⁻ + HCO₃⁻)</code><br>Normal 8–12. AG normal numa acidose aponta para perda de HCO₃⁻ ou falha renal de excretar H⁺ (acidose hiperclorêmica).' },
          unit: 'mEq/L',
          target: AG,
          tolerance: 1,
          explainCorrect: `AG = ${Na} − (${Cl} + ${HCO3}) = <strong>${AG} mEq/L</strong> (normal). Com Cl⁻ ${Cl} elevado, trata-se de <strong>acidose metabólica hiperclorêmica (AG normal)</strong> — aqui por perda intestinal de HCO₃⁻.`,
          explainWrong: `AG = Na − (Cl + HCO₃) = ${Na} − (${Cl} + ${HCO3}) = ${AG}. É normal → hiperclorêmica.`
        },
        _buildCardsAct({
          prompt: '<strong>Ato IV — O Conselho dos Diagnósticos.</strong><br>Selecione <em>todas</em> as causas que também produzem este padrão (acidose metabólica com AG normal / hiperclorêmica). Não selecione causas de outro padrão.',
          instruction: 'Os mecanismos serão revelados somente após o julgamento.',
          cards: [
            _makeCard('diarreia', 'Diarreia', 'Perda fecal volumosa', 'HCO₃⁻ baixo, Cl⁻ alto, AG normal, K⁺ baixo', true, 'Fluido intestinal rico em HCO₃⁻ → sua perda baixa o HCO₃⁻ plasmático → Cl⁻ sobe para eletroneutralidade → acidose hiperclorêmica.', 'Causa extrarrenal mais comum de NAGMA; o UAG costuma ser negativo.'),
            _makeCard('atr1', 'ATR tipo 1 (distal)', 'Nefrocalcinose, litíase', 'pH urinário > 5,5, K⁺ baixo, AG normal', true, 'Falha da célula alfa-intercalada em secretar H⁺ no coletor → ácido se acumula → HCO₃⁻ cai, Cl⁻ alto.', 'NAGMA renal com hipocalemia e incapacidade de acidificar a urina.'),
            _makeCard('atr2', 'ATR tipo 2 (proximal)', 'Síndrome de Fanconi', 'Bicarbonatúria, glicosúria, fosfatúria', true, 'O túbulo proximal não reabsorve o HCO₃⁻ filtrado → ele se perde na urina até o plasma atingir um limiar mais baixo.', 'NAGMA proximal; pode vir com glicosúria/fosfatúria (Fanconi).'),
            _makeCard('atr4', 'ATR tipo 4', 'Diabético, IECA/BRA', 'K⁺ alto, AG normal', true, 'Hipoaldosteronismo → secreção distal de H⁺ ↓ + amoniagênese ↓ → acidose hiperclorêmica com hipercalemia.', 'Única ATR com K alto; comum em diabético com DRC.'),
            _makeCard('salina', 'Excesso de SF 0,9%', 'Reanimação volumosa com salina', 'Cl⁻ alto, HCO₃⁻ baixo, AG normal', true, 'Grande carga de Cl⁻ → reduz a diferença de íons fortes (SID) → HCO₃⁻ ↓ → acidose hiperclorêmica dilucional.', 'NAGMA iatrogênica; prefira cristaloide balanceado em grandes volumes.'),
            _makeCard('acetazolamida', 'Acetazolamida', 'Inibidor da anidrase carbônica', 'Bicarbonatúria, AG normal', true, 'Inibe a reabsorção proximal de HCO₃⁻ (efeito tipo ATR-2) → bicarbonatúria → acidose com AG normal.', 'Causa medicamentosa de NAGMA por perda renal de HCO₃⁻.'),
            _makeCard('dka_vance', 'Cetoacidose diabética', 'Hiperglicemia, Kussmaul', 'Cetonas, AG elevado', false, 'Cetogênese → β-hidroxibutirato (ânion não medido) → AG ↑.', 'É armadilha: dá AG ALTO, não acidose hiperclorêmica.'),
            _makeCard('lactato_vance', 'Acidose lática', 'Choque, má perfusão', 'Lactato alto, AG elevado', false, 'Lactato é um ânion não medido → AG ↑.', 'É armadilha: AG alto, não AG normal.'),
            _makeCard('vomitos_vance', 'Vômitos', 'Perda de conteúdo gástrico', 'HCO₃⁻ alto, hipocloremia', false, 'Perda de HCl → H⁺ e Cl⁻ ↓ → alcalose metabólica.', 'É armadilha: gera alcalose, direção oposta a este caso.')
          ],
          grimoire: { title: 'O padrão: acidose com AG normal (hiperclorêmica)', body: 'O HCO₃⁻ cai e o Cl⁻ sobe; o AG permanece normal. Diferencie a origem: perda <strong>gastrointestinal</strong> de HCO₃⁻ (UAG negativo) vs falha <strong>renal</strong> de excretar H⁺/NH₄⁺ (ATR, acetazolamida — UAG positivo). <code>UAG = (Na⁺ + K⁺) − Cl⁻ urinários</code>.' }
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
      summary: `<strong>Acidose metabólica hiperclorêmica (AG ${AG} normal)</strong> por perda intestinal de HCO₃⁻ (diarreia), com compensação respiratória adequada (Winter ${_c(winterExpected)}, real ${PaCO2}). Conduta: volume + K⁺ + tratar a causa; evitar SF 0,9% em excesso.`
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
    _dbg('Kael rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, expHCO3 });

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
          explainCorrect: `pH ${_c(pH)} → <strong>acidemia</strong> (< 7,35). A PaCO₂ ${PaCO2} mmHg (alta) acompanha a acidemia → o processo primário é <strong>respiratório</strong> (hipoventilação). O HCO₃⁻ ${HCO3} pouco elevado é resposta tampão precoce.`,
          explainWrong: {
            'Acidose metabólica': `Acidose metabólica teria HCO₃⁻ baixo como causa. Aqui o HCO₃⁻ ${HCO3} está normal/alto e a PaCO₂ ${PaCO2} está alta.`,
            'Alcalose respiratória': `Teria pH > 7,45 e PaCO₂ baixa. Aqui pH ${_c(pH)} e PaCO₂ ${PaCO2} (alta).`,
            'Alcalose metabólica': `Teria pH > 7,45 e HCO₃⁻ alto. Aqui pH ${_c(pH)} (ácido).`
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
          explainCorrect: `HCO₃⁻ esperado = 24 + 1 × (${PaCO2} − 40)/10 = <strong>${_c(expHCO3)} mEq/L</strong>. O valor real (${HCO3}) bate → acidose respiratória aguda isolada.`,
          explainWrong: `24 + (${PaCO2} − 40)/10 = ${_c(expHCO3)}. Tolerância ±2.`
        },
        _buildCardsAct({
          prompt: '<strong>Ato IV — O Conselho dos Diagnósticos.</strong><br>Selecione <em>todas</em> as causas que também produzem este padrão (acidose respiratória). Não selecione causas de outro padrão.',
          instruction: 'Os mecanismos serão revelados somente após o julgamento.',
          cards: [
            _makeCard('opioides', 'Opioides', 'Sonolência, miose, FR baixa', 'PaCO₂ alto', true, 'Deprimem o centro respiratório bulbar → volume-minuto ↓ → CO₂ retido → acidose respiratória.', 'Causa direta e reversível (naloxona) deste caso.'),
            _makeCard('benzo', 'Benzodiazepínicos / sedativos', 'Rebaixamento, hipoventilação', 'PaCO₂ alto', true, 'Reduzem o drive ventilatório central → hipoventilação alveolar → retenção de CO₂.', 'Sedativos somam-se aos opioides na depressão respiratória.'),
            _makeCard('dpoc_exac', 'DPOC exacerbado com fadiga', 'Dispneia, uso de musculatura acessória', 'PaCO₂ alto, HCO₃⁻ alto (crônico)', true, 'Obstrução ↑ trabalho respiratório + fadiga muscular → ventilação alveolar ↓ → CO₂ ↑.', 'Quando a musculatura fadiga, a PaCO₂ sobe — sinal de gravidade.'),
            _makeCard('oh', 'Obesidade-hipoventilação', 'Obesidade, sonolência diurna', 'PaCO₂ alto, HCO₃⁻ alto', true, 'Carga mecânica torácica + drive reduzido → ventilação ↓ → retenção de CO₂ (sobretudo no sono).', 'Hipoventilação crônica; pode agudizar com sedativos.'),
            _makeCard('neuromuscular', 'Doença neuromuscular', 'Fraqueza, tosse fraca', 'PaCO₂ alto, capacidade vital baixa', true, 'Falência da bomba ventilatória (diafragma/músculos) → ventilação alveolar ↓ → hipercapnia.', 'Guillain-Barré, miastenia, ELA — a bomba falha e o CO₂ sobe.'),
            _makeCard('asma_grave', 'Asma grave com fadiga', 'Tórax silencioso, exaustão', 'PaCO₂ "normalizando" e subindo', true, 'Inicialmente hipocapnia; ao fadigar, a PaCO₂ normaliza e depois sobe → acidose respiratória.', 'PaCO₂ subindo na crise asmática indica exaustão iminente.'),
            _makeCard('tep_kael', 'TEP leve', 'Dispneia, dor pleurítica', 'Hipoxemia, PaCO₂ baixo', false, 'Hiperventilação → CO₂ eliminado → alcalose respiratória.', 'É armadilha: causa alcalose respiratória, direção oposta.'),
            _makeCard('sepse_kael', 'Sepse inicial', 'Febre, taquipneia', 'PaCO₂ baixo', false, 'Estímulo do centro respiratório → alcalose respiratória precoce.', 'É armadilha: alcalose respiratória, não acidose.'),
            _makeCard('diarreia_kael', 'Diarreia', 'Perda fecal volumosa', 'HCO₃⁻ baixo, Cl⁻ alto, AG normal', false, 'Perda fecal de HCO₃⁻ → acidose metabólica hiperclorêmica.', 'É armadilha: distúrbio metabólico, não respiratório.')
          ],
          grimoire: { title: 'O padrão: acidose respiratória', body: 'A PaCO₂ sobe quando a ventilação alveolar cai → H₂CO₃ ↑ → acidemia. Localize a falha do fole: <strong>drive</strong> (opioide, sedativo), <strong>bomba</strong> (neuromuscular, fadiga) ou <strong>carga/obstrução</strong> (DPOC, asma grave, obesidade).' }
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
      summary: `<strong>Acidose respiratória aguda</strong> por hipoventilação induzida por sedação (PaCO₂ ${PaCO2}). HCO₃⁻ ${HCO3} ≈ esperado ${_c(expHCO3)} → aguda isolada. Conduta: restaurar a ventilação (naloxona se opioide); bicarbonato é contraindicado.`
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
    _dbg('Vorgath rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, AG, winterExpected, glic, bun, osmCalc, osmMed, osmGap });

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
          explainCorrect: `pH ${_c(pH)} → <strong>acidemia</strong> grave. HCO₃⁻ ${HCO3} mEq/L (muito baixo) acompanha a acidemia → distúrbio <strong>metabólico</strong>. PaCO₂ ${PaCO2} mmHg baixa é compensação respiratória.`,
          explainWrong: {
            'Acidose respiratória': `Teria PaCO₂ alta como causa. Aqui a PaCO₂ ${PaCO2} está baixa (compensando).`,
            'Alcalose metabólica': `Teria pH > 7,45 e HCO₃⁻ alto. Aqui pH ${_c(pH)} e HCO₃⁻ ${HCO3} (baixo).`,
            'Alcalose respiratória': `Teria pH > 7,45. Aqui pH ${_c(pH)}.`
          }
        },
        {
          kind: 'num',
          prompt: '<strong>Ato II — Compensação (Winter).</strong><br>Calcule a PaCO₂ esperada.',
          grimoire: { title: 'Fórmula de Winter', body: '<code>PaCO₂ esperado = 1,5 × HCO₃⁻ + 8 (±2)</code>' },
          unit: 'mmHg',
          target: winterExpected,
          tolerance: 2,
          explainCorrect: `PaCO₂ esperada = 1,5 × ${HCO3} + 8 = <strong>${_c(winterExpected)} mmHg (±2)</strong>; real ${PaCO2} → compensação adequada.`,
          explainWrong: `1,5 × ${HCO3} + 8 = ${_c(winterExpected)}. Tolerância ±2.`
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
          prompt: '<strong>Ato IV — O Conselho dos Diagnósticos.</strong><br>Selecione <em>todas</em> as causas compatíveis com <strong>acidose AG alto + gap osmolar elevado</strong>. Cuidado com as armadilhas clássicas.',
          instruction: 'Os mecanismos serão revelados somente após o julgamento.',
          cards: [
            _makeCard('etilenoglicol', 'Etilenoglicol', 'Anticongelante, confusão, dor lombar', 'AG alto, gap osmolar, IRA, cristais de oxalato', true, 'Álcool-desidrogenase → glicolato/oxalato (AG ↑); a molécula-mãe não medida eleva o gap osmolar; oxalato precipita → IRA.', 'Tríade clássica AG alto + gap osmolar + IRA. Fomepizol; HD se grave.'),
            _makeCard('metanol', 'Metanol', 'Alteração visual, confusão', 'AG alto, gap osmolar', true, 'Convertido a formato (AG ↑ e toxicidade retiniana); o metanol não medido eleva o gap osmolar.', 'AG alto + gap osmolar + alteração visual. Fomepizol + HD.'),
            _makeCard('propilenoglicol', 'Propilenoglicol', 'Infusão IV prolongada (ex.: lorazepam)', 'AG alto, gap osmolar, lactato', true, 'Metabolizado a lactato (AG ↑) e, sendo álcool, eleva o gap osmolar enquanto se acumula.', 'Toxicidade hospitalar por infusões prolongadas; AG alto com gap osmolar.'),
            _makeCard('dietilenoglicol', 'Dietilenoglicol', 'Contaminante de xaropes/solventes', 'AG alto, gap osmolar, IRA', true, 'Álcool-desidrogenase → ácidos (AG ↑) e, como álcool, eleva o gap osmolar; causa IRA e neurotoxicidade.', 'Mesma via dos álcoois tóxicos: AG alto + gap osmolar + IRA.'),
            _makeCard('isopropanol', 'Isopropanol (álcool isopropílico)', 'Ebriedade, hálito de acetona', 'Gap osmolar alto, cetose, SEM acidose', false, 'Oxidado a acetona → grande gap osmolar e cetonemia, mas NÃO produz ácidos fixos.', 'É armadilha: gap osmolar SEM acidose com AG alto (gera acetona, não ácido).'),
            _makeCard('salicilato_v', 'Salicilato', 'Zumbido, taquipneia, febre', 'AG alto, PaCO₂ baixo, gap osmolar normal', false, 'Ácidos orgânicos (AG ↑) + alcalose respiratória, mas é molécula medida → não eleva o gap osmolar.', 'É armadilha: AG alto SEM gap osmolar relevante.'),
            _makeCard('metformina_v', 'Metformina (acidose lática)', 'IRA, choque', 'Lactato muito alto, AG alto, gap osmolar normal', false, 'Inibe a gliconeogênese e a oxidação mitocondrial → lactato (AG ↑), mas não eleva o gap osmolar.', 'É armadilha: AG alto por lactato, sem gap osmolar.'),
            _makeCard('vomitos_v', 'Vômitos', 'Perda de conteúdo gástrico', 'HCO₃⁻ alto, hipocloremia', false, 'Perda de HCl → HCO₃⁻ ↑ → alcalose metabólica.', 'É armadilha: alcalose metabólica, padrão oposto.')
          ],
          grimoire: { title: 'O padrão: AG alto + gap osmolar — separando os álcoois', body: 'Álcoois tóxicos (etileno/metanol/propileno/dietilenoglicol) dão <strong>AG alto + gap osmolar</strong>. <strong>Isopropanol</strong> dá gap osmolar SEM acidose. Salicilato e metformina dão AG alto SEM gap osmolar. O gap osmolar cai à medida que o álcool vira ácido — gap normal não exclui ingestão tardia.' }
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

  function _buildSelene(){
    // Cetoacidose diabética (acidose metabólica com AG alto, cetose)
    const HCO3 = _rand(6, 14);
    const AG   = _rand(20, 28);
    const Na   = _rand(130, 138);
    const Cl   = Na - AG - HCO3;
    const alb  = _r1(3.8 + Math.random() * 0.4);
    const K    = _r1(4.6 + Math.random() * 1.0);   // déficit total, sérico normal/alto antes do tratamento
    const glic = _rand(380, 620);
    const winterExpected = _r1(1.5 * HCO3 + 8);
    const PaCO2 = Math.round(winterExpected + (Math.random() * 4 - 2));
    const pH = _ph(HCO3, PaCO2);
    const BE = _be(HCO3, PaCO2);
    _dbg('Selene rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, winterExpected, AG, glic });

    return {
      narrative: `A jovem maga <strong>Selene</strong> chega com poliúria intensa, perda de peso, dor abdominal e respiração profunda e ritmada (Kussmaul). Hálito cetônico. A glicemia capilar marca <strong>${glic} mg/dL</strong>.`,
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
          explainCorrect: `pH ${_c(pH)} → <strong>acidemia</strong>. HCO₃⁻ ${HCO3} mEq/L (baixo) acompanha a acidemia → distúrbio <strong>metabólico</strong>. A PaCO₂ ${PaCO2} baixa é a respiração de Kussmaul (compensação), não a causa.`,
          explainWrong: {
            'Acidose respiratória': `Teria PaCO₂ alta como causa. Aqui a PaCO₂ ${PaCO2} está baixa (Kussmaul compensando).`,
            'Alcalose metabólica': `Teria pH > 7,45 e HCO₃⁻ alto. Aqui pH ${_c(pH)} e HCO₃⁻ ${HCO3} (baixo).`,
            'Alcalose respiratória': `Teria pH > 7,45. Aqui pH ${_c(pH)}.`
          }
        },
        {
          kind: 'num',
          prompt: '<strong>Ato II — Compensação esperada (Winter).</strong><br>Calcule a PaCO₂ esperada pela compensação respiratória.',
          grimoire: { title: 'Fórmula de Winter', body: '<code>PaCO₂ esperado = 1,5 × HCO₃⁻ + 8 (±2)</code>' },
          unit: 'mmHg',
          target: winterExpected,
          tolerance: 2,
          explainCorrect: `PaCO₂ esperada = 1,5 × ${HCO3} + 8 = <strong>${_c(winterExpected)} mmHg (±2)</strong>; real ${PaCO2} → compensação adequada (Kussmaul).`,
          explainWrong: `1,5 × ${HCO3} + 8 = ${_c(winterExpected)}. Tolerância ±2.`
        },
        {
          kind: 'num',
          prompt: `<strong>Ato III — Ânion gap.</strong><br>Calcule o AG sérico (albumina = ${_c(alb)} g/dL).`,
          grimoire: { title: 'Ânion gap', body: '<code>AG = Na⁺ − (Cl⁻ + HCO₃⁻)</code><br>Normal 8–12. Na DKA, os cetoácidos (β-hidroxibutirato) são os ânions não medidos que elevam o AG.' },
          unit: 'mEq/L',
          target: AG,
          tolerance: 1,
          explainCorrect: `AG = ${Na} − (${Cl} + ${HCO3}) = <strong>${AG} mEq/L</strong> (alto). Com hiperglicemia + cetonemia, é <strong>cetoacidose diabética</strong> — o β-hidroxibutirato consome HCO₃⁻ e eleva o AG.`,
          explainWrong: `AG = Na − (Cl + HCO₃) = ${Na} − (${Cl} + ${HCO3}) = ${AG}.`
        },
        _buildCardsAct({
          prompt: '<strong>Ato IV — O Conselho dos Diagnósticos.</strong><br>Selecione <em>todas</em> as causas que também produzem este padrão (acidose metabólica com ânion gap alto). Não selecione causas de outro padrão.',
          instruction: 'Os mecanismos serão revelados somente após o julgamento.',
          cards: [
            _makeCard('dka_s', 'Cetoacidose diabética', 'Poliúria, dor abdominal, Kussmaul', 'Hiperglicemia, cetonemia, AG alto', true, 'Insulina ↓ + glucagon ↑ → lipólise → β-hidroxibutirato/acetoacetato → consomem HCO₃⁻ → AG ↑.', 'É exatamente este caso; investigar o gatilho (infecção, omissão de insulina).'),
            _makeCard('euglycemic_s', 'Cetoacidose euglicêmica (iSGLT2)', 'Diabético em iSGLT2, jejum/infecção', 'Cetonemia com glicose normal ou pouco alta', true, 'A glicosúria do iSGLT2 reduz a glicemia aparente; insulina efetiva ↓ + glucagon ↑ → cetogênese → AG ↑.', 'Acidose grave sem hiperglicemia marcada — a glicemia normal engana.'),
            _makeCard('alcoholic_s', 'Cetoacidose alcoólica', 'Etilismo + jejum, vômitos', 'Glicose baixa/normal, cetose, AG alto', true, 'Álcool + jejum → NADH ↑ e glicogênio esgotado → β-hidroxibutirato ↑ → AG ↑.', 'AG alto com glicemia normal/baixa; responde a soro glicosado + tiamina.'),
            _makeCard('starvation_s', 'Cetoacidose de jejum', 'Inanição prolongada', 'Cetose leve, HCO₃⁻ pouco reduzido', true, 'O jejum prolongado mobiliza ácidos graxos → cetogênese hepática → leve acúmulo de cetoácidos.', 'Costuma ser leve (HCO₃⁻ raramente < 18); ainda assim entra no padrão de AG alto.'),
            _makeCard('lactate_s', 'Sepse / choque (lactato)', 'Febre, hipotensão, má perfusão', 'Lactato alto, AG alto', true, 'Hipoperfusão/disfunção mitocondrial → lactato ↑ → consome HCO₃⁻ → AG ↑.', 'Pode coexistir com a DKA (sepse é gatilho clássico de descompensação).'),
            _makeCard('uremia_s', 'Uremia / DRC avançada', 'DRC avançada, sintomas urêmicos', 'TFG muito baixa, fosfato alto, AG alto', true, 'Menor excreção de ácidos fixos + retenção de sulfato/fosfato → AG ↑.', 'Causa renal de acidose com AG alto.'),
            _makeCard('diarrhea_s', 'Diarreia', 'Perda fecal volumosa', 'HCO₃⁻ baixo, Cl⁻ alto, AG normal', false, 'Perda fecal de HCO₃⁻ → Cl⁻ sobe para eletroneutralidade → acidose hiperclorêmica.', 'É armadilha: acidose, mas com AG normal.'),
            _makeCard('vomiting_s', 'Vômitos', 'Perda de conteúdo gástrico', 'HCO₃⁻ alto, hipocloremia', false, 'Perda de HCl → HCO₃⁻ ↑ → alcalose metabólica.', 'É armadilha: alcalose, padrão oposto.'),
            _makeCard('rta1_s', 'ATR tipo 1 (distal)', 'Nefrocalcinose, litíase', 'pH urinário > 5,5, K⁺ baixo, AG normal', false, 'Falha distal de secreção de H⁺ → acidose hiperclorêmica.', 'É armadilha: AG normal, não AG alto.')
          ],
          grimoire: { title: 'O padrão: acidose metabólica com AG alto', body: 'Ácidos não medidos se acumulam e consomem HCO₃⁻. O ânion gap separa esse grupo da acidose hiperclorêmica (AG normal). No diabético, pense em cetoácidos — inclusive na forma euglicêmica.' }
        }),
        {
          kind: 'mc',
          prompt: '<strong>Ato V — Conduta clínica.</strong><br>Qual é a sua conduta inicial?',
          grimoire: { title: 'Tratamento da cetoacidose diabética', body: 'Pilares: <strong>volume</strong> (SF 0,9%), <strong>insulina regular IV</strong> em infusão e <strong>reposição de potássio</strong>. Regra de segurança: <strong>não iniciar insulina se K⁺ < 3,3 mEq/L</strong> (a insulina joga K⁺ para dentro da célula e pode causar hipocalemia grave) — repor K⁺ antes. Bicarbonato só se pH < 6,9.' },
          options: [
            { label: 'SF 0,9% + insulina regular IV + reposição de K⁺ (não iniciar insulina se K⁺ < 3,3)', correct: true },
            { label: 'Insulina subcutânea isolada, sem hidratação', correct: false },
            { label: 'Bolus de bicarbonato 8,4% IV de rotina', correct: false },
            { label: 'Apenas hidratação, sem insulina nem potássio', correct: false }
          ],
          explainCorrect: `DKA → <strong>volume + insulina IV + K⁺</strong>. O K⁺ sérico (${_c(K)}) costuma mascarar déficit corporal total; monitorar e repor. Bicarbonato fica reservado a pH < 6,9.`,
          explainWrong: {
            'Insulina subcutânea isolada, sem hidratação': 'A desidratação é grave na DKA; sem volume a perfusão e a resposta à insulina ficam comprometidas. Via IV em infusão é o padrão.',
            'Bolus de bicarbonato 8,4% IV de rotina': 'Bicarbonato de rotina não melhora desfecho e pode causar hipocalemia/alcalose tardia; reservado a pH < 6,9.',
            'Apenas hidratação, sem insulina nem potássio': 'Sem insulina a cetogênese continua; sem repor K⁺ há risco de hipocalemia grave ao iniciar insulina.'
          }
        }
      ],
      summary: `<strong>Cetoacidose diabética</strong> (acidose metabólica com AG ${AG} alto + hiperglicemia + cetonemia), compensação de Kussmaul adequada (Winter ${_c(winterExpected)}, real ${PaCO2}). Conduta: SF 0,9% + insulina IV + K⁺ (cuidado com K⁺ < 3,3). Bicarbonato só se pH < 6,9.`
    };
  }

  function _buildEdrin(){
    // Acidose urêmica da DRC avançada — AG mascarado por hipoalbuminemia (AG corrigido)
    const HCO3 = _rand(14, 19);
    const Na   = _rand(136, 142);
    const measAG = _rand(12, 16);                  // AG medido parece normal/limítrofe
    const Cl   = Na - measAG - HCO3;
    const alb  = _r1(2.4 + Math.random() * 0.7);   // hipoalbuminemia (2,4–3,1)
    const AGcorr = Math.round(measAG + 2.5 * (4 - alb));
    const K    = _r1(4.6 + Math.random() * 1.0);
    const cr   = _r1(4.5 + Math.random() * 3.5);   // creatinina alta (narrativa)
    const winterExpected = _r1(1.5 * HCO3 + 8);
    // Acidose leve: PaCO₂ na faixa do Winter mas sem cair abaixo do esperado
    // (PaCO₂ baixa demais alcalinizaria → deixaria de ser acidemia). Mantém
    // distúrbio simples com compensação adequada e pH < 7,35.
    const PaCO2 = Math.round(winterExpected + Math.random() * 2);
    const pH = _ph(HCO3, PaCO2);
    const BE = _be(HCO3, PaCO2);
    _dbg('Edrin rolled:', { pH, PaCO2, HCO3, BE, Na, Cl, K, alb, measAG, AGcorr, cr, winterExpected });

    return {
      narrative: `O cronista <strong>Edrin</strong>, idoso com doença renal crônica avançada, apresenta inapetência, fadiga e respiração mais profunda. A creatinina está em <strong>${_c(cr)} mg/dL</strong> e a albumina, baixa (<strong>${_c(alb)} g/dL</strong>).`,
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
          explainCorrect: `pH ${_c(pH)} → <strong>acidemia</strong>. HCO₃⁻ ${HCO3} mEq/L (baixo) acompanha a acidemia → distúrbio <strong>metabólico</strong>. PaCO₂ ${PaCO2} baixa é compensação respiratória.`,
          explainWrong: {
            'Acidose respiratória': `Teria PaCO₂ alta como causa. Aqui a PaCO₂ ${PaCO2} está baixa (compensando).`,
            'Alcalose metabólica': `Teria pH > 7,45 e HCO₃⁻ alto. Aqui pH ${_c(pH)} e HCO₃⁻ ${HCO3} (baixo).`,
            'Alcalose respiratória': `Teria pH > 7,45. Aqui pH ${_c(pH)}.`
          }
        },
        {
          kind: 'num',
          prompt: '<strong>Ato II — Compensação esperada (Winter).</strong><br>Calcule a PaCO₂ esperada pela compensação respiratória.',
          grimoire: { title: 'Fórmula de Winter', body: '<code>PaCO₂ esperado = 1,5 × HCO₃⁻ + 8 (±2)</code>' },
          unit: 'mmHg',
          target: winterExpected,
          tolerance: 2,
          explainCorrect: `PaCO₂ esperada = 1,5 × ${HCO3} + 8 = <strong>${_c(winterExpected)} mmHg (±2)</strong>; real ${PaCO2} → compensação adequada.`,
          explainWrong: `1,5 × ${HCO3} + 8 = ${_c(winterExpected)}. Tolerância ±2.`
        },
        {
          kind: 'num',
          prompt: `<strong>Ato III — Ânion gap CORRIGIDO.</strong><br>O AG medido = Na⁺ − (Cl⁻ + HCO₃⁻) = <strong>${measAG}</strong> (parece normal). Com albumina baixa (${_c(alb)} g/dL), calcule o <strong>AG corrigido</strong>.`,
          grimoire: { title: 'AG corrigido pela albumina', body: '<code>AG = Na⁺ − (Cl⁻ + HCO₃⁻)</code><br><code>AG corrigido = AG + 2,5 × (4 − albumina)</code><br>Cada 1 g/dL de queda da albumina reduz o AG medido em ~2,5 — por isso a hipoalbuminemia <em>mascara</em> um AG alto.' },
          unit: 'mEq/L',
          target: AGcorr,
          tolerance: 2,
          explainCorrect: `AG corrigido = ${measAG} + 2,5 × (4 − ${_c(alb)}) = <strong>${AGcorr} mEq/L</strong> (alto). O AG medido (${measAG}) parecia normal, mas a <strong>hipoalbuminemia mascarava um AG alto</strong> — típico da retenção de sulfato/fosfato na uremia.`,
          explainWrong: `AG corrigido = AG medido + 2,5 × (4 − albumina) = ${measAG} + 2,5 × (4 − ${_c(alb)}) = ${AGcorr}.`
        },
        _buildCardsAct({
          prompt: '<strong>Ato IV — O Conselho dos Diagnósticos.</strong><br>Selecione <em>todas</em> as causas <em>renais</em> que também produzem acidose metabólica. Não selecione causas de outro padrão.',
          instruction: 'Os mecanismos serão revelados somente após o julgamento.',
          cards: [
            _makeCard('ckd_e', 'DRC avançada (acidose urêmica)', 'Uremia, anemia, fadiga', 'TFG muito baixa, fosfato alto', true, 'A queda da TFG reduz a excreção de ácidos fixos e a amoniagênese → retenção de sulfato/fosfato/ácidos orgânicos → AG ↑ (com componente hiperclorêmico em fases iniciais).', 'É o caso; indica álcali oral e, se grave/refratária, diálise.'),
            _makeCard('atr4_e', 'ATR tipo 4', 'Diabético, IECA/BRA/espironolactona', 'K⁺ alto, AG normal', true, 'Hipoaldosteronismo → secreção distal de H⁺/K⁺ ↓ + amoniagênese ↓ → acidose hiperclorêmica com hipercalemia.', 'Única ATR com K⁺ alto; muito comum na DRC do diabético.'),
            _makeCard('atr1_e', 'ATR tipo 1 (distal)', 'Nefrocalcinose, litíase', 'pH urinário > 5,5, K⁺ baixo, AG normal', true, 'Falha da célula alfa-intercalada em secretar H⁺ no coletor → acidose hiperclorêmica.', 'NAGMA renal com hipocalemia e urina que não acidifica.'),
            _makeCard('atr2_e', 'ATR tipo 2 (proximal)', 'Síndrome de Fanconi', 'Bicarbonatúria, glicosúria, fosfatúria', true, 'O túbulo proximal não reabsorve o HCO₃⁻ filtrado → perda urinária de HCO₃⁻ até um novo limiar mais baixo.', 'NAGMA proximal; associada a mieloma, fármacos e doenças tubulares.'),
            _makeCard('hipoaldo_e', 'Hipoaldosteronismo hiporreninêmico', 'Diabético com DRC', 'K⁺ alto, AG normal', true, 'Renina e aldosterona baixas → menos secreção distal de H⁺/K⁺ → acidose hiperclorêmica hipercalêmica.', 'Mecanismo de fundo da ATR tipo 4 no diabético.'),
            _makeCard('ira_e', 'IRA grave (oligúrica)', 'Oligúria aguda', 'Creatinina subindo rápido, K⁺ alto', true, 'A queda abrupta da filtração e da amoniagênese retém ácidos fixos → acidose metabólica.', 'Acidose aguda; pode exigir diálise por critérios (AEIOU).'),
            _makeCard('vomitos_e', 'Vômitos', 'Perda de conteúdo gástrico', 'HCO₃⁻ alto, hipocloremia', false, 'Perda de HCl → HCO₃⁻ ↑ → alcalose metabólica.', 'É armadilha: alcalose, padrão oposto.'),
            _makeCard('hiperaldo_e', 'Hiperaldosteronismo primário', 'Hipertensão resistente', 'K⁺ baixo, HCO₃⁻ alto', false, 'Aldosterona ↑ → secreção distal de H⁺/K⁺ ↑ → alcalose metabólica hipocalêmica.', 'É armadilha: alcalose, não acidose.'),
            _makeCard('tep_e', 'Tromboembolismo pulmonar', 'Dispneia súbita', 'PaCO₂ baixo, hipoxemia', false, 'Hiperventilação → CO₂ eliminado → alcalose respiratória.', 'É armadilha: distúrbio respiratório alcalótico, não acidose metabólica.')
          ],
          grimoire: { title: 'Acidose de origem renal', body: 'O rim acidifica o sangue excretando H⁺ (como NH₄⁺) e regenerando HCO₃⁻. Falhas geram acidose: <strong>queda de TFG</strong> (uremia, AG alto), <strong>ATR</strong> (1 distal, 2 proximal, 4 hipoaldosteronismo — AG normal) e <strong>IRA</strong>. Diferencie das alcaloses (vômito, hiperaldo) e dos distúrbios respiratórios.' }
        }),
        {
          kind: 'mc',
          prompt: '<strong>Ato V — Conduta clínica.</strong><br>Qual é a sua conduta inicial?',
          grimoire: { title: 'Acidose metabólica da DRC', body: 'Na DRC estável, a recomendação é <strong>repor álcali por via oral</strong> (bicarbonato de sódio) com alvo de HCO₃⁻ ≥ 22 mEq/L — corrigir a acidose crônica retarda o catabolismo muscular/ósseo e a progressão da DRC. Bicarbonato IV em bolus é para acidemia aguda grave. Diálise se acidose grave/refratária ou outros critérios.' },
          options: [
            { label: 'Bicarbonato de sódio ORAL, alvo HCO₃⁻ ≥ 22 (DRC estável); avaliar diálise se grave/refratária', correct: true },
            { label: 'Bolus de bicarbonato 8,4% IV imediato', correct: false },
            { label: 'Grande volume de SF 0,9%', correct: false },
            { label: 'Apenas observar — acidose crônica não precisa de tratamento', correct: false }
          ],
          explainCorrect: `Acidose metabólica crônica da DRC → <strong>álcali oral</strong> (bicarbonato de sódio), alvo HCO₃⁻ ≥ 22. Corrigir a acidose retarda a progressão da DRC e o catabolismo. Diálise se grave/refratária.`,
          explainWrong: {
            'Bolus de bicarbonato 8,4% IV imediato': 'Reservado a acidemia aguda grave; na DRC estável a correção é oral e gradual.',
            'Grande volume de SF 0,9%': 'A carga de Cl⁻ pioraria a acidose (hiperclorêmica) e o paciente com DRC pode não tolerar o volume.',
            'Apenas observar — acidose crônica não precisa de tratamento': 'A acidose crônica acelera a perda muscular/óssea e a progressão da DRC — deve ser tratada.'
          }
        }
      ],
      summary: `<strong>Acidose metabólica da DRC avançada</strong> com <strong>AG corrigido alto (${AGcorr})</strong> mascarado pela hipoalbuminemia (AG medido ${measAG}). Compensação adequada (Winter ${_c(winterExpected)}, real ${PaCO2}). Conduta: álcali oral (alvo HCO₃⁻ ≥ 22); diálise se grave. Lição: corrija o AG pela albumina.`
    };
  }

  // ── Casos clínicos (Fase 4: 8 casos jogáveis) ────────────────────────────
  // Diagnóstico não aparece no hub (spoiler) — fica como metadata interna.
  // Desbloqueio é progressivo: um caso libera quando o anterior é concluído
  // (ver _isPlayable). Casos sem build() ficam como "Em breve".
  const CASES = [
    { id:'aldric',  caso:'Caso I',    title:'A Forja Escaldante',     character:'Ferreiro Aldric',     build:_buildAldric },
    { id:'mara',    caso:'Caso II',   title:'O Banquete Envenenado',  character:'Curandeira Mara',     build:_buildMara },
    { id:'theron',  caso:'Caso III',  title:'Sentinela das Brumas',   character:'Guarda Theron',       build:_buildTheron  },
    { id:'vance',   caso:'Caso IV',   title:'A Rota das Especiarias', character:'Mercador Vance',      build:_buildVance   },
    { id:'kael',    caso:'Caso V',    title:'O Cerco de Aço',         character:'General Kael',        build:_buildKael    },
    { id:'vorgath', caso:'Caso VI',   title:'A Taça de Cristal Verde',character:'Alquimista Vorgath',  build:_buildVorgath },
    { id:'selene',  caso:'Caso VII',  title:'O Véu Açucarado',        character:'Maga Selene',         build:_buildSelene  },
    { id:'edrin',   caso:'Caso VIII', title:'O Cronista Urêmico',     character:'Escriba Edrin',       build:_buildEdrin   }
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
            <p class="ab-lead">Oito pacientes do reino aguardam diagnóstico ácido-base. Domine a fórmula de Winter, o ânion gap (e sua correção pela albumina), a delta-delta e o gap osmolar para restaurar o equilíbrio.</p>
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
          <div class="ab-gas"><span>pH</span><strong>${_c(g.pH)}</strong></div>
          <div class="ab-gas"><span>PaCO₂</span><strong>${g.PaCO2}</strong><em>mmHg</em></div>
          <div class="ab-gas"><span>HCO₃⁻</span><strong>${g.HCO3}</strong><em>mEq/L</em></div>
          <div class="ab-gas"><span>BE</span><strong>${g.BE}</strong><em>mEq/L</em></div>
          <div class="ab-gas"><span>Na⁺</span><strong>${g.Na}</strong><em>mEq/L</em></div>
          <div class="ab-gas"><span>Cl⁻</span><strong>${g.Cl}</strong><em>mEq/L</em></div>
          <div class="ab-gas"><span>K⁺</span><strong>${_c(g.K)}</strong><em>mEq/L</em></div>
          <div class="ab-gas"><span>Albumina</span><strong>${_c(g.alb)}</strong><em>g/dL</em></div>
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

    // Estado de resposta de MC/NUM persistido por actIdx — voltar pelos dots
    // mostra a resposta dada (read-only), sem re-contar erro nem permitir re-responder.
    sess.actResults = sess.actResults || {};
    const actRes = sess.actResults[sess.actIdx];

    let bodyHTML = '';
    if (act.kind === 'mc') {
      bodyHTML = `<div class="ab-options">
        ${act.options.map((o,i) => {
          let cls = '';
          if (actRes) {
            if (i === actRes.pickIdx) cls = actRes.correct ? ' correct' : ' wrong';
            else if (o.correct) cls = ' correct';
          }
          return `<button type="button" class="ab-option${cls}" data-ab-pick="${i}"${actRes?' disabled':''}>${o.label}</button>`;
        }).join('')}
      </div>`;
    } else if (act.kind === 'num') {
      const valAttr = actRes ? ` value="${actRes.value}"` : '';
      const dis = actRes ? ' disabled' : '';
      bodyHTML = `
        <div class="ab-num-row">
          <input type="number" step="0.1" inputmode="decimal" class="ab-num-input" id="abNumInput" placeholder="Digite o valor" aria-label="Valor calculado"${valAttr}${dis}>
          <span class="ab-num-unit">${act.unit||''}</span>
          <button type="button" class="ab-btn-primary" data-ab-num-submit${dis}>Conferir</button>
        </div>`;
    } else if (act.kind === 'cards') {
      // Estado persistido por actIdx (sobrevive a voltar/avançar pelos dots).
      sess.cardSel = sess.cardSel || {};
      sess.cardResults = sess.cardResults || {};
      const sel = sess.cardSel[sess.actIdx] = sess.cardSel[sess.actIdx] || new Set();
      const result = sess.cardResults[sess.actIdx];

      if (result && result.confirmed) {
        // ── Pós-confirmação: selos rompidos, mecanismos revelados ──────────
        const selSet = new Set(result.selectedIds);
        const cardsHtml = act.cards.map(c => {
          const picked = selSet.has(c.id);
          let status, badge;
          if (c.correct && picked)       { status = 'correct';  badge = 'Correta'; }
          else if (c.correct && !picked) { status = 'missed';   badge = 'Você esqueceu'; }
          else if (!c.correct && picked) { status = 'wrong';    badge = 'Armadilha'; }
          else                           { status = 'rejected'; badge = 'Rejeitada corretamente'; }
          return `
            <div class="ab-ddx-card revealed ${status}" aria-disabled="true">
              <span class="ab-ddx-card-badge">${badge}</span>
              <span class="ab-ddx-card-title">${c.title}</span>
              <div class="ab-ddx-card-reveal">
                <div class="ab-ddx-reveal-block"><span class="ab-ddx-reveal-label">Mecanismo</span>${c.reveal.mechanism}</div>
                <div class="ab-ddx-reveal-block"><span class="ab-ddx-reveal-label">Por que importa</span>${c.reveal.why}</div>
              </div>
            </div>`;
        }).join('');
        bodyHTML = `
          <div class="ab-ddx-judgment">
            <p class="ab-ddx-narrative">${_DDX_NARRATIVE_POST}</p>
            <p class="ab-ddx-arquivista">Arquivista: “${result.perfect ? _DDX_ARQUIVISTA_PERFECT : _DDX_ARQUIVISTA_PARTIAL}”</p>
          </div>
          <div class="ab-ddx-table ab-ddx-table--revealed">${cardsHtml}</div>`;
      } else {
        // ── Pré-confirmação: cartas lacradas, só pistas ────────────────────
        const cardsHtml = act.cards.map(c => {
          const isSel = sel.has(c.id);
          return `
            <button type="button" class="ab-ddx-card${isSel?' selected':''}" data-ab-card-id="${c.id}" aria-pressed="${isSel?'true':'false'}">
              <span class="ab-ddx-card-check" aria-hidden="true">✓</span>
              <span class="ab-ddx-card-title">${c.title}</span>
              <div class="ab-ddx-card-pre">
                <div class="ab-ddx-clue"><span class="ab-ddx-clue-label">Pista clínica</span>${c.pre.clinical}</div>
                <div class="ab-ddx-clue"><span class="ab-ddx-clue-label">Pista laboratorial</span>${c.pre.lab}</div>
              </div>
            </button>`;
        }).join('');
        bodyHTML = `
          <div class="ab-ddx-narrative">${_DDX_NARRATIVE_PRE}</div>
          <p class="ab-ddx-arquivista">Arquivista: “${_DDX_ARQUIVISTA_PRE}”</p>
          ${act.instruction ? `<div class="ab-ddx-instruction">${act.instruction}</div>` : ''}
          <div class="ab-ddx-table">${cardsHtml}</div>
          <div class="ab-ddx-counter">Selecionadas: <strong id="abDdxCount">${sel.size}</strong></div>
          <div class="ab-ddx-actions">
            <button type="button" class="ab-btn-secondary ab-ddx-clear" data-ab-cards-clear>Limpar seleção</button>
            <button type="button" class="ab-btn-primary ab-ddx-submit" data-ab-cards-submit>Conferir Conselho</button>
          </div>`;
      }
    }

    const grimoireBtn = act.grimoire
      ? `<button type="button" class="ab-grimoire-btn" data-ab-grimoire aria-expanded="false" aria-controls="abGrimoirePanel">📖 Consultar Grimório</button>`
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
      if (!panel.hasAttribute('hidden')) { panel.setAttribute('hidden',''); grimBtn.setAttribute('aria-expanded','false'); return; }
      panel.innerHTML = `<div class="ab-grimoire-title">${act.grimoire.title}</div><div class="ab-grimoire-body">${act.grimoire.body}</div>`;
      panel.removeAttribute('hidden');
      grimBtn.setAttribute('aria-expanded','true');
      sess.grimoireUses++;
    };

    if (act.kind === 'mc') {
      if (actRes) {
        const fb = _mcFeedback(act, actRes.pickIdx);
        _showFeedback(card, fb.ok, fb.html);
        _appendNextBtn(card, overlay, kase, sess);
      } else {
        card.querySelectorAll('[data-ab-pick]').forEach(b => {
          b.onclick = () => _handleAnswerMC(overlay, kase, sess, parseInt(b.getAttribute('data-ab-pick'),10));
        });
      }
    } else if (act.kind === 'num') {
      if (actRes) {
        const fb = _numFeedback(act, actRes.value);
        _showFeedback(card, fb.ok, fb.html);
        _appendNextBtn(card, overlay, kase, sess);
      } else {
        const input = card.querySelector('#abNumInput');
        const submit = card.querySelector('[data-ab-num-submit]');
        const go = () => _handleAnswerNum(overlay, kase, sess, parseFloat(input.value));
        submit.onclick = go;
        input.addEventListener('keydown', ev => { if (ev.key === 'Enter') go(); });
        setTimeout(() => input.focus(), 30);
      }
    } else if (act.kind === 'cards') {
      const result = sess.cardResults[sess.actIdx];
      if (result && result.confirmed) {
        // Já julgado: mostra o feedback global e libera o avanço.
        _renderCardsFeedback(card, act, result);
        _appendNextBtn(card, overlay, kase, sess);
      } else {
        const sel = sess.cardSel[sess.actIdx];
        const countEl = card.querySelector('#abDdxCount');
        card.querySelectorAll('[data-ab-card-id]').forEach(b => {
          b.onclick = () => {
            const id = b.getAttribute('data-ab-card-id');
            const nowSel = !sel.has(id);
            if (nowSel) sel.add(id); else sel.delete(id);
            b.classList.toggle('selected', nowSel);
            b.setAttribute('aria-pressed', nowSel ? 'true' : 'false');
            if (countEl) countEl.textContent = sel.size;
          };
        });
        card.querySelector('[data-ab-cards-clear]').onclick = () => {
          sel.clear();
          card.querySelectorAll('[data-ab-card-id]').forEach(b => {
            b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false');
          });
          if (countEl) countEl.textContent = 0;
        };
        card.querySelector('[data-ab-cards-submit]').onclick = () => _handleAnswerCards(overlay, kase, sess);
      }
    }
  }

  // Constrói o feedback (reutilizado na 1ª resposta e ao revisitar pelos dots).
  function _mcFeedback(act, pickIdx){
    const picked = act.options[pickIdx];
    if (picked.correct) return { ok: true, html: act.explainCorrect };
    const why = (act.explainWrong && act.explainWrong[picked.label]) || '';
    const correctOpt = act.options.find(o => o.correct);
    return { ok: false, html: `${why} <br><br><strong>Resposta correta:</strong> ${correctOpt.label}.<br>${act.explainCorrect}` };
  }
  function _numFeedback(act, value){
    const ok = Math.abs(value - act.target) <= act.tolerance;
    if (ok) return { ok: true, html: act.explainCorrect };
    return { ok: false, html: `Valor informado: <strong>${_c(value)}</strong>. Resposta esperada: <strong>${_c(act.target)} ${act.unit||''}</strong> (±${act.tolerance}).<br><br>${act.explainWrong}<br><br>${act.explainCorrect}` };
  }

  function _handleAnswerMC(overlay, kase, sess, pickIdx){
    const act = kase.acts[sess.actIdx];
    sess.actResults = sess.actResults || {};
    if (!sess.actResults[sess.actIdx]) {            // conta o erro só na 1ª resposta
      const picked = act.options[pickIdx];
      if (!picked.correct) sess.wrongAttempts++;
      sess.actResults[sess.actIdx] = { kind: 'mc', pickIdx, correct: picked.correct };
    }
    _renderAct(overlay, kase, sess);                // re-renderiza em modo respondido
  }

  function _handleAnswerNum(overlay, kase, sess, value){
    if (!Number.isFinite(value)) {
      const inp = overlay.querySelector('#abNumInput');
      if (inp) inp.focus();
      if (typeof _toast === 'function') _toast('Digite um valor para conferir.', 'info', 2200);
      return;
    }
    const act = kase.acts[sess.actIdx];
    sess.actResults = sess.actResults || {};
    if (!sess.actResults[sess.actIdx]) {            // conta o erro só na 1ª resposta
      const ok = Math.abs(value - act.target) <= act.tolerance;
      if (!ok) sess.wrongAttempts++;
      sess.actResults[sess.actIdx] = { kind: 'num', value, ok };
    }
    _renderAct(overlay, kase, sess);                // re-renderiza em modo respondido
  }

  function _handleAnswerCards(overlay, kase, sess){
    const act = kase.acts[sess.actIdx];
    const sel = (sess.cardSel && sess.cardSel[sess.actIdx]) || new Set();
    const correctIds = act.cards.filter(c => c.correct).map(c => c.id);

    let correctSel = 0, missed = 0, wrong = 0;
    act.cards.forEach(c => {
      const picked = sel.has(c.id);
      if (c.correct && picked)       correctSel++;
      else if (c.correct && !picked) missed++;
      else if (!c.correct && picked) wrong++;
    });
    const perfect = (missed === 0 && wrong === 0 && correctSel === correctIds.length);
    if (!perfect) sess.wrongAttempts++;

    sess.cardResults = sess.cardResults || {};
    sess.cardResults[sess.actIdx] = { confirmed: true, selectedIds: [...sel], perfect };

    try { if (typeof _track === 'function') _track('minigame_acid_base_cards_checked', {
      case: kase.id, correctCount: correctSel, selectedCount: sel.size, missedCount: missed, wrongCount: wrong, perfect
    }); } catch {}

    // Re-renderiza o ato em modo "julgamento" (mecanismos revelados).
    _renderAct(overlay, kase, sess);
  }

  // Feedback global do Conselho (resumo estruturado abaixo das cartas).
  function _renderCardsFeedback(card, act, result){
    const selSet = new Set(result.selectedIds);
    const good   = act.cards.filter(c => c.correct && selSet.has(c.id));
    const missed = act.cards.filter(c => c.correct && !selSet.has(c.id));
    const wrong  = act.cards.filter(c => !c.correct && selSet.has(c.id));
    const head = result.perfect
      ? 'O Conselho aprova seu raciocínio: você reconheceu o padrão e rejeitou as armadilhas.'
      : 'O Conselho aceita o avanço, mas exige revisão: algumas cartas pertenciam ao padrão e outras foram confundidas por semelhança clínica.';
    const _list = (title, items, withWhy) => items.length ? `
      <div class="ab-ddx-feedback-section">
        <div class="ab-ddx-feedback-title">${title}</div>
        ${items.map(c => `<div class="ab-ddx-feedback-item"><strong>${c.title}</strong>${withWhy ? ` — ${c.reveal.why}` : ''}</div>`).join('')}
      </div>` : '';
    const html = `<div class="ab-ddx-feedback">
      ${head}
      ${_list('Corretas selecionadas', good, false)}
      ${_list('Corretas esquecidas', missed, true)}
      ${_list('Armadilhas selecionadas', wrong, true)}
    </div>`;
    _showFeedback(card, result.perfect, html);
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
