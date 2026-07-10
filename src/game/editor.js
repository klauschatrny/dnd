import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { buildScene } from './scene.js';
import { buildModel } from './models.js';
import { OBJECTS } from '../domain/data/index.js';
import { FURNITURE_LAYOUT, COLOR_ARGS } from './furniture.js';

// Editor visual de ambiente. Reaproveita a cena do jogo (paredes/piso/mobília) e
// adiciona os POIs, permitindo mover/girar/apagar objetos com o mouse e exportar
// as posições atualizadas para colar em maps.js (POIs) e furniture.js (mobília).

const round = (v, d = 2) => Number(v.toFixed(d));

/** Orienta o modelo de um POI conforme facing/anchor (igual ao objectSpawner). */
function orientPoi(model, poi) {
  model.position.set(...poi.position);
  if (poi.anchor === 'ceiling') {
    model.rotation.x = Math.PI / 2;
    return;
  }
  const f = new THREE.Vector3(...poi.facing);
  if (f.lengthSq() > 1e-6) model.lookAt(new THREE.Vector3(...poi.position).add(f.normalize()));
}

/** Direção +Z do objeto no mundo, "encaixada" no eixo dominante (para o campo facing). */
function forwardAxis(root) {
  const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(root.quaternion);
  dir.y = 0;
  if (Math.abs(dir.x) >= Math.abs(dir.z)) return [Math.sign(dir.x) || 1, 0, 0];
  return [0, 0, Math.sign(dir.z) || 1];
}

export function startEditor(app, renderer, map) {
  const { scene } = buildScene(map);
  scene.fog = null;
  const ceiling = scene.getObjectByName('ceiling');
  if (ceiling) ceiling.visible = false;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x30384a, 0.9));
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const grid = new THREE.GridHelper(Math.max(map.bounds.maxX - map.bounds.minX, map.bounds.maxZ - map.bounds.minZ) + 2, 40, 0x334, 0x223);
  grid.position.y = 0.005;
  scene.add(grid);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 300);
  camera.position.set(0, 13, 11);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.target.set(0, 0, 0);
  orbit.update();

  const transform = new TransformControls(camera, renderer.domElement);
  transform.setTranslationSnap(0.1);
  transform.setRotationSnap(THREE.MathUtils.degToRad(15));
  transform.setSize(0.9);
  transform.addEventListener('dragging-changed', (e) => (orbit.enabled = !e.value));
  transform.addEventListener('objectChange', () => writeBack(selected));
  scene.add(transform.getHelper());

  // --- Selecionáveis ---
  const selectables = [];
  const removedPois = new Set();
  const removedFurniture = new Set();

  const poiGroup = new THREE.Group();
  poiGroup.name = 'editor-pois';
  for (const poi of map.pois) {
    const model = buildModel(poi.objectType, OBJECTS[poi.objectType].visual);
    orientPoi(model, poi);
    model.userData.sel = { kind: 'poi', ref: poi };
    poiGroup.add(model);
    selectables.push(model);
  }
  scene.add(poiGroup);

  const furnitureGroup = scene.getObjectByName('furniture');
  for (const child of furnitureGroup.children) {
    child.userData.sel = { kind: 'furniture', ref: child.userData.item };
    selectables.push(child);
  }

  // --- Seleção por clique ---
  const raycaster = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let selected = null;
  const boxHelper = new THREE.BoxHelper(new THREE.Object3D(), 0xffc94d);
  boxHelper.visible = false;
  scene.add(boxHelper);

  function rootOf(obj) {
    let o = obj;
    while (o) {
      if (o.userData.sel) return o;
      o = o.parent;
    }
    return null;
  }

  function select(root) {
    selected = root;
    if (root) {
      transform.attach(root);
      boxHelper.setFromObject(root);
      boxHelper.visible = true;
    } else {
      transform.detach();
      boxHelper.visible = false;
    }
    updateInfo();
  }

  renderer.domElement.addEventListener('pointerdown', (e) => {
    if (transform.dragging || e.button !== 0) return;
    ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ptr, camera);
    const meshes = [];
    for (const s of selectables) if (s.visible) s.traverse((o) => o.isMesh && meshes.push(o));
    const hit = raycaster.intersectObjects(meshes, false)[0];
    select(hit ? rootOf(hit.object) : null);
  });

  function writeBack(root) {
    if (!root) return;
    const sel = root.userData.sel;
    if (sel.kind === 'poi') {
      sel.ref.position = [round(root.position.x), round(root.position.y), round(root.position.z)];
      if (sel.ref.anchor !== 'ceiling') sel.ref.facing = forwardAxis(root);
    } else {
      sel.ref.pos = [round(root.position.x), round(root.position.z)];
      if (Math.abs(root.position.y) > 0.001) sel.ref.y = round(root.position.y);
      else delete sel.ref.y;
      sel.ref.ry = round(root.rotation.y, 4);
    }
    if (boxHelper.visible) boxHelper.setFromObject(root);
    updateInfo();
  }

  function removeSelected() {
    if (!selected) return;
    const sel = selected.userData.sel;
    if (sel.kind === 'poi') removedPois.add(sel.ref.id);
    else removedFurniture.add(sel.ref);
    selected.parent.remove(selected);
    const i = selectables.indexOf(selected);
    if (i >= 0) selectables.splice(i, 1);
    select(null);
  }

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'g' || e.key === 't') transform.setMode('translate');
    else if (e.key === 'r') transform.setMode('rotate');
    else if (e.key === 'Escape') select(null);
    else if (e.key === 'Delete' || e.key === 'Backspace') removeSelected();
  });

  // --- UI ---
  buildUI({
    app,
    onMode: (m) => transform.setMode(m),
    onSnap: (on) => {
      transform.setTranslationSnap(on ? 0.1 : null);
      transform.setRotationSnap(on ? THREE.MathUtils.degToRad(15) : null);
    },
    onDelete: removeSelected,
    onExport: () => showExport(map, removedPois, removedFurniture),
  });
  const infoEl = document.getElementById('ed-info');
  function updateInfo() {
    if (!selected) {
      infoEl.textContent = 'Nada selecionado — clique em um objeto.';
      return;
    }
    const sel = selected.userData.sel;
    if (sel.kind === 'poi') {
      infoEl.innerHTML = `<b>POI:</b> ${sel.ref.id} <span class="mut">(${sel.ref.objectType})</span><br>pos [${sel.ref.position.join(', ')}] · facing [${sel.ref.facing.join(', ')}]`;
    } else {
      infoEl.innerHTML = `<b>Móvel:</b> ${sel.ref.type}<br>pos [${sel.ref.pos.join(', ')}]${sel.ref.y ? ` · y ${sel.ref.y}` : ''} · ry ${round(sel.ref.ry ?? 0, 3)}`;
    }
  }
  updateInfo();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  renderer.setAnimationLoop(() => {
    orbit.update();
    renderer.render(scene, camera);
  });

  if (import.meta.env.DEV) window.__editor = { select, selectables, transform, scene, camera };
}

// --- Exportação ---

function fmtArgs(type, args) {
  const colorIdx = COLOR_ARGS[type] ?? [];
  return args.map((a, i) => (colorIdx.includes(i) ? '0x' + a.toString(16).padStart(6, '0') : a)).join(', ');
}

function fmtPois(pois) {
  const lines = pois.map(
    (p) =>
      `    { id: '${p.id}', room: '${p.room}', objectType: '${p.objectType}', position: [${p.position.join(', ')}], facing: [${p.facing.join(', ')}], anchor: '${p.anchor}' },`,
  );
  return `  pois: [\n${lines.join('\n')}\n  ],`;
}

function fmtFurniture(items) {
  const lines = items.map((it) => {
    const parts = [`type: '${it.type}'`, `pos: [${it.pos.join(', ')}]`];
    if (it.ry !== undefined && it.ry !== 0) parts.push(`ry: ${round(it.ry, 4)}`);
    if (it.y !== undefined) parts.push(`y: ${it.y}`);
    if (it.args && it.args.length) parts.push(`args: [${fmtArgs(it.type, it.args)}]`);
    return `  { ${parts.join(', ')} },`;
  });
  return `export const FURNITURE_LAYOUT = [\n${lines.join('\n')}\n];`;
}

function showExport(map, removedPois, removedFurniture) {
  const pois = map.pois.filter((p) => !removedPois.has(p.id));
  const furniture = FURNITURE_LAYOUT.filter((it) => !removedFurniture.has(it));
  const poisText = fmtPois(pois);
  const furnText = fmtFurniture(furniture);

  const overlay = document.createElement('div');
  overlay.className = 'ed-export';
  overlay.innerHTML = `
    <div class="ed-export-inner">
      <h2>Exportar ambiente</h2>
      <p>Cole em <code>src/domain/data/maps.js</code> (substitua o array <code>pois</code>):</p>
      <textarea readonly rows="8">${poisText.replace(/</g, '&lt;')}</textarea>
      <p>Cole em <code>src/game/furniture.js</code> (substitua <code>FURNITURE_LAYOUT</code>):</p>
      <textarea readonly rows="8">${furnText.replace(/</g, '&lt;')}</textarea>
      <div class="ed-export-actions">
        <button id="ed-download">Baixar .txt</button>
        <button id="ed-close" class="primary">Fechar</button>
      </div>
    </div>`;
  document.getElementById('app').appendChild(overlay);
  overlay.querySelector('#ed-close').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#ed-download').addEventListener('click', () => {
    const blob = new Blob([`// maps.js\n${poisText}\n\n// furniture.js\n${furnText}\n`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ambiente-export.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

function buildUI({ app, onMode, onSnap, onDelete, onExport }) {
  const bar = document.createElement('div');
  bar.className = 'ed-bar';
  bar.innerHTML = `
    <span class="ed-title">Editor de ambiente</span>
    <button data-mode="translate" class="active">Mover (G)</button>
    <button data-mode="rotate">Girar (R)</button>
    <label class="ed-snap"><input type="checkbox" id="ed-snap" checked> Snap</label>
    <button id="ed-del">Apagar (Del)</button>
    <button id="ed-export" class="primary">Exportar</button>
    <a href="./" class="ed-back">← Jogo</a>`;
  app.appendChild(bar);

  const info = document.createElement('div');
  info.className = 'ed-infobox';
  info.innerHTML = `<div id="ed-info"></div>
    <div class="ed-help">Clique: selecionar · Arraste o gizmo: mover/girar · Orbitar: arraste o fundo · Zoom: scroll</div>`;
  app.appendChild(info);

  const modeBtns = bar.querySelectorAll('[data-mode]');
  modeBtns.forEach((b) =>
    b.addEventListener('click', () => {
      modeBtns.forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      onMode(b.dataset.mode);
    }),
  );
  bar.querySelector('#ed-snap').addEventListener('change', (e) => onSnap(e.target.checked));
  bar.querySelector('#ed-del').addEventListener('click', onDelete);
  bar.querySelector('#ed-export').addEventListener('click', onExport);
}
