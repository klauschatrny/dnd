import { TOOL_ORDER } from './tools.js';
import { TOOL_LABELS, CONCLUSIONS, CONCLUSION_LABELS, EVIDENCE } from '../domain/data/index.js';

// Camada de UI (HUD + caderneta). Mantém o HUD mínimo (GDD §17): ferramenta atual,
// alvo/interação e anotações. Sem minimapa, marcadores ou indicadores da solução.

const TOOL_KEYS = { ZOOM: '1', FLASHLIGHT: '2', UV: '3', RF: '4', THERMAL: '5' };

export function createUI(app, { inspectables, onConclusion, onFinish }) {
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
    chip.innerHTML = `<b>${TOOL_KEYS[t]}</b> ${TOOL_LABELS[t]}`;
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

  function setTarget(mesh) {
    if (!mesh) {
      prompt.classList.remove('visible');
      return;
    }
    const st = mesh.userData.inspect;
    const conc = st.conclusion ? ` · <span class="tag">${CONCLUSION_LABELS[st.conclusion]}</span>` : '';
    const count = st.foundEvidence.size;
    const evTxt = count ? ` · ${count} evidência(s)` : '';
    prompt.innerHTML = `<b>${st.data.label}</b>${evTxt}${conc}<span class="act">[E] inspecionar</span>`;
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
    const examined = inspectables.filter((i) => i.mesh.userData.inspect.examined);
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
    notebookEl: notebook,
  };
}

function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}
