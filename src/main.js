import './style.css';
import * as THREE from 'three';
import { generateCase } from './domain/caseGenerator.js';
import { MAPS } from './domain/data/index.js';
import { buildScene } from './game/scene.js';
import { spawnObjects } from './game/objectSpawner.js';
import { createPlayer } from './game/player.js';
import { createToolSystem, TOOL_ORDER } from './game/tools.js';
import { createInspection } from './game/inspection.js';
import { createUI } from './game/ui.js';
import { evaluateReport } from './domain/report.js';

const app = document.getElementById('app');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);

// Caso atual (seed fixa até termos menu/briefing no passo 7)
const map = MAPS.apartment_01;
const { instance, solution } = generateCase({ seed: 84723191 });
let startTime = null;
let resultsShown = false;

const { scene, colliders } = buildScene(map);
scene.add(camera); // necessário para a lanterna (spotlight) presa à câmera
const inspectables = spawnObjects(scene, instance);

const player = createPlayer({
  camera,
  domElement: renderer.domElement,
  colliders,
  spawn: map.spawn,
  bounds: map.bounds,
});
const tools = createToolSystem({ camera });
const inspection = createInspection({ camera, inspectables });
const ui = createUI(app, {
  inspectables,
  onConclusion: (poiId, conclusion) => {
    const item = inspectables.find((i) => i.data.poiId === poiId);
    if (item) item.mesh.userData.inspect.conclusion = conclusion;
  },
  onFinish: () => emitReport(),
});
ui.setTool(tools.current);

// --- Overlay clique-para-jogar / pausa ---
const overlay = document.createElement('div');
overlay.className = 'overlay';
overlay.innerHTML = `
  <div class="overlay-card">
    <h1>My Hotel Spy</h1>
    <p>Clique para iniciar a inspeção</p>
    <p class="hint">WASD andar · Mouse olhar · 1-5 ferramentas · E inspecionar · TAB anotações</p>
  </div>`;
app.appendChild(overlay);

const crosshair = document.createElement('div');
crosshair.className = 'crosshair';
app.appendChild(crosshair);

overlay.addEventListener('click', () => player.controls.lock());
player.controls.addEventListener('lock', () => {
  overlay.classList.add('hidden');
  if (startTime === null) startTime = performance.now();
});
player.controls.addEventListener('unlock', () => {
  if (!ui.isNotebookOpen() && !resultsShown) overlay.classList.remove('hidden');
});

function emitReport() {
  const marks = {};
  for (const { mesh, data } of inspectables) {
    if (mesh.userData.inspect.conclusion) marks[data.poiId] = mesh.userData.inspect.conclusion;
  }
  const time = startTime ? (performance.now() - startTime) / 1000 : 0;
  const result = evaluateReport(solution, marks, time);
  resultsShown = true;
  crosshair.classList.add('hidden');
  player.controls.unlock();
  ui.showResults(result, { onNext: () => window.location.reload() });
}

// --- Entradas ---
function inspectNow() {
  if (!player.controls.isLocked) return;
  ui.reportInspection(inspection.inspect(tools.revealSet()));
}

function openNotebook() {
  ui.toggleNotebook(true);
  player.controls.unlock();
}
function closeNotebook() {
  ui.toggleNotebook(false);
  player.controls.lock();
}

document.addEventListener('keydown', (e) => {
  if (resultsShown) return;
  if (e.code === 'Tab') {
    e.preventDefault();
    ui.isNotebookOpen() ? closeNotebook() : openNotebook();
    return;
  }
  if (ui.isNotebookOpen()) return;
  const digit = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4 }[e.code];
  if (digit !== undefined) {
    tools.setTool(TOOL_ORDER[digit]);
    ui.setTool(tools.current);
  } else if (e.code === 'KeyE') {
    inspectNow();
  }
});

renderer.domElement.addEventListener('mousedown', (e) => {
  if (player.controls.isLocked && e.button === 0) inspectNow();
});
window.addEventListener('wheel', (e) => {
  if (!player.controls.isLocked) return;
  tools.cycle(e.deltaY > 0 ? 1 : -1);
  ui.setTool(tools.current);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Medidor RF (não aponta o objeto exato — GDD §6) ---
const camPos = new THREE.Vector3();
function updateRf() {
  if (tools.current !== 'RF') return;
  camera.getWorldPosition(camPos);
  let intensity = 0;
  for (const { mesh, data } of inspectables) {
    if (!data.evidences.includes('RF_SIGNAL')) continue;
    const dist = camPos.distanceTo(mesh.position);
    intensity = Math.max(intensity, Math.max(0, 1 - dist / 4.5));
  }
  ui.setRf(intensity);
}

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.1);
  player.move(delta);
  tools.update(delta);
  if (player.controls.isLocked) {
    ui.setTarget(inspection.update());
  }
  updateRf();
  renderer.render(scene, camera);
});
