import { TOOL_ORDER } from './tools.js';
import { TOOL_LABELS, CONCLUSIONS, CONCLUSION_LABELS, EVIDENCE } from '../domain/data/index.js';

// Camada de UI (HUD + caderneta). Mantém o HUD mínimo (GDD §17): ferramenta atual,
// alvo/interação e anotações. Sem minimapa, marcadores ou indicadores da solução.

const toolKey = (t) => TOOL_ORDER.indexOf(t) + 1;

export function createUI(app, { getInspectables, onConclusion, onFinish }) {
  const hud = el('div', 'hud');
  app.appendChild(hud);

  const overlayTint = el('div', 'tool-overlay');
  hud.appendChild(overlayTint);

  const prompt = el('div', 'target-prompt');
  hud.appendChild(prompt);

  const toastArea = el('div', 'toast-area');
  hud.appendChild(toastArea);

  const rfMeter = el('div', 'rf-meter');
  rfMeter.innerHTML = `<span>RF</span><div class="rf-bar"><i></i></div>`;
  hud.appendChild(rfMeter);
  const rfFill = rfMeter.querySelector('i');

  // Barra de ferramentas
  const toolbar = el('div', 'toolbar');
  const chips = {};
  for (const t of TOOL_ORDER) {
    const chip = el('div', 'chip');
    chip.innerHTML = `<b>${toolKey(t)}</b> ${TOOL_LABELS[t]}`;
    toolbar.appendChild(chip);
    chips[t] = chip;
  }
  hud.appendChild(toolbar);

  const help = el('div', 'help');
  help.innerHTML = `WASD mover · Mouse olhar · <b>1-5</b> ferramenta · <b>E</b> inspecionar · <b>TAB</b> anotações`;
  hud.appendChild(help);

  // Caderneta / tablet
  const notebook = el('div', 'notebook hidden');
  app.appendChild(notebook);
  let notebookOpen = false;

  function setTool(current) {
    for (const t of TOOL_ORDER) chips[t].classList.toggle('active', t === current);
    overlayTint.className = 'tool-overlay' + (current === 'UV' ? ' uv' : current === 'THERMAL' ? ' thermal' : '');
    rfMeter.classList.toggle('visible', current === 'RF');
  }

  function setTarget(mesh, hint, toolLabel) {
    if (!mesh) {
      prompt.classList.remove('visible');
      return;
    }
    const st = mesh.userData.inspect;
    const conc = st.conclusion ? ` · <span class="tag">${CONCLUSION_LABELS[st.conclusion]}</span>` : '';
    const count = st.foundEvidence.size;
    const evTxt = count ? ` · ${count} evidência(s)` : '';
    let sig = `<span class="act">[E] inspecionar</span>`;
    if (hint === 'signal') sig = `<span class="act signal">● sinal (${toolLabel}) — [E] registrar</span>`;
    else if (hint === 'found') sig = `<span class="act done">✓ registrado (${toolLabel})</span>`;
    else if (hint === 'none') sig = `<span class="act none">nada com ${toolLabel}</span>`;
    prompt.innerHTML = `<b>${st.data.label}</b>${evTxt}${conc}${sig}`;
    prompt.classList.add('visible');
  }

  function setRf(intensity) {
    rfFill.style.width = `${Math.round(intensity * 100)}%`;
  }

  function toast(msg, type = 'info') {
    const t = el('div', `toast ${type}`);
    t.innerHTML = msg;
    toastArea.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 300);
    }, 2600);
  }

  function reportInspection(result) {
    if (!result) return;
    if (result.none) toast(`Nada detectado em <b>${result.label}</b> com esta ferramenta.`, 'muted');
    else if (result.found.length) toast(`<b>${result.label}</b>: ${result.found.join(', ')}`, 'found');
    else toast(`Evidências já registradas em <b>${result.label}</b>.`, 'muted');
  }

  function renderNotebook() {
    const examined = getInspectables().filter((i) => i.mesh.userData.inspect.examined);
    const rows = examined
      .map((i) => {
        const st = i.mesh.userData.inspect;
        const evs = [...st.foundEvidence].map((e) => EVIDENCE[e].nome).join(', ') || '<i>nenhuma</i>';
        const options = Object.values(CONCLUSIONS)
          .map(
            (c) =>
              `<option value="${c}" ${st.conclusion === c ? 'selected' : ''}>${CONCLUSION_LABELS[c]}</option>`,
          )
          .join('');
        return `<tr>
          <td>${st.data.label}<div class="room">${st.data.room}</div></td>
          <td class="evs">${evs}</td>
          <td><select data-poi="${st.data.poiId}"><option value="">— não marcado —</option>${options}</select></td>
        </tr>`;
      })
      .join('');

    notebook.innerHTML = `
      <div class="notebook-inner">
        <h2>Anotações da inspeção</h2>
        <p class="sub">Marque a conclusão de cada objeto examinado. Objetos não marcados contam como "sem irregularidade".</p>
        <table>
          <thead><tr><th>Objeto</th><th>Evidências encontradas</th><th>Conclusão</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="3"><i>Nenhum objeto examinado ainda.</i></td></tr>'}</tbody>
        </table>
        <div class="notebook-actions">
          <button class="btn-secondary" id="nb-close">Continuar inspeção (TAB)</button>
          <button class="btn-primary" id="nb-finish">Emitir laudo</button>
        </div>
      </div>`;

    notebook.querySelectorAll('select').forEach((sel) => {
      sel.addEventListener('change', () => onConclusion?.(sel.dataset.poi, sel.value || null));
    });
    notebook.querySelector('#nb-close').addEventListener('click', () => toggleNotebook(false));
    notebook.querySelector('#nb-finish').addEventListener('click', () => onFinish?.());
  }

  function toggleNotebook(force) {
    notebookOpen = force ?? !notebookOpen;
    if (notebookOpen) renderNotebook();
    notebook.classList.toggle('hidden', !notebookOpen);
    return notebookOpen;
  }

  function isNotebookOpen() {
    return notebookOpen;
  }

  function hideHud() {
    hud.classList.add('hidden');
  }
  function showHud() {
    hud.classList.remove('hidden');
  }

  // --- Tela de resultado (laudo) ---
  const results = el('div', 'results hidden');
  app.appendChild(results);

  const OUTCOME = {
    acerto: { txt: 'Irregularidade encontrada', cls: 'ok' },
    perdida: { txt: 'Irregularidade perdida', cls: 'bad' },
    falso_positivo: { txt: 'Falso positivo', cls: 'bad' },
    ok: { txt: '—', cls: 'muted' },
  };

  function showResults(r, { onNext }) {
    toggleNotebook(false);
    hideHud();
    const rows = r.breakdown
      .filter((b) => b.relevant)
      .map((b) => {
        const oc = OUTCOME[b.outcome];
        return `<tr>
          <td>${b.label}</td>
          <td>${b.stateLabel}</td>
          <td>${CONCLUSION_LABELS[b.playerConclusion]}</td>
          <td class="oc ${oc.cls}">${oc.txt}</td>
        </tr>`;
      })
      .join('');
    const mins = Math.floor(r.timeSeconds / 60);
    const secs = String(Math.floor(r.timeSeconds % 60)).padStart(2, '0');

    results.innerHTML = `
      <div class="results-inner">
        <div class="grade grade-${r.grade}">${r.grade}</div>
        <h2>Laudo emitido</h2>
        <div class="stats">
          <div><b>${r.stats.encontradas}/${r.stats.totalIrregular}</b><span>irregularidades</span></div>
          <div><b>${r.stats.perdidas}</b><span>perdidas</span></div>
          <div><b>${r.stats.falsosPositivos}</b><span>falsos positivos</span></div>
          <div><b>${Math.round(r.score * 100)}%</b><span>precisão</span></div>
          <div><b>${mins}:${secs}</b><span>tempo</span></div>
        </div>
        <table>
          <thead><tr><th>Objeto</th><th>Estado real</th><th>Seu laudo</th><th>Resultado</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4"><i>Nada relevante a exibir.</i></td></tr>'}</tbody>
        </table>
        <div class="results-actions">
          <button class="btn-primary" id="res-next">Próximo caso</button>
        </div>
      </div>`;
    results.querySelector('#res-next').addEventListener('click', () => onNext?.());
    results.classList.remove('hidden');
  }

  function hideResults() {
    results.classList.add('hidden');
  }

  // --- Menu principal ---
  const menu = el('div', 'screen menu hidden');
  app.appendChild(menu);

  function showMenu({ onStart }) {
    menu.innerHTML = `
      <div class="screen-inner">
        <h1>My Hotel Spy</h1>
        <p class="tag">Inspetor de imóveis — encontre os dispositivos ilegais e emita o laudo.</p>
        <div class="field"><label>Seed (opcional)</label><input id="menu-seed" placeholder="aleatória" /></div>
        <div class="field"><label>Dificuldade</label>
          <select id="menu-diff">
            <option value="">Aleatória</option>
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>
        <button class="btn-primary" id="menu-start">Nova inspeção</button>
      </div>`;
    menu.querySelector('#menu-start').addEventListener('click', () => {
      const seed = menu.querySelector('#menu-seed').value.trim();
      const difficulty = menu.querySelector('#menu-diff').value;
      onStart({ seed: seed || undefined, difficulty: difficulty || undefined });
    });
    menu.classList.remove('hidden');
  }
  const hideMenu = () => menu.classList.add('hidden');

  // --- Briefing do caso ---
  const briefing = el('div', 'screen briefing hidden');
  app.appendChild(briefing);
  const DIFF_LABEL = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };

  function showBriefing(instance, caseNumber, mapLabel, { onEnter }) {
    hideResults();
    briefing.innerHTML = `
      <div class="screen-inner brief">
        <div class="stamp">Caso #${String(caseNumber).padStart(3, '0')}</div>
        <h2>${mapLabel}</h2>
        <div class="meta">Dificuldade: ${DIFF_LABEL[instance.difficulty]} · Seed: ${instance.seed}</div>
        <div class="denuncia"><span>Denúncia</span><p>“${instance.denuncia}”</p></div>
        <p class="brief-hint">Investigue o imóvel e cruze as evidências. Você nunca saberá quantas
        irregularidades existem — decida quando encerrar e emitir o laudo.</p>
        <button class="btn-primary" id="brief-enter">Entrar no imóvel</button>
      </div>`;
    briefing.querySelector('#brief-enter').addEventListener('click', () => onEnter());
    briefing.classList.remove('hidden');
  }
  const hideBriefing = () => briefing.classList.add('hidden');

  return {
    setTool,
    setTarget,
    setRf,
    toast,
    reportInspection,
    toggleNotebook,
    isNotebookOpen,
    renderNotebook,
    hideHud,
    showHud,
    showResults,
    hideResults,
    showMenu,
    hideMenu,
    showBriefing,
    hideBriefing,
    notebookEl: notebook,
  };
}

function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}
