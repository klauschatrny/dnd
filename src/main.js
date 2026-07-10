import './style.css';
import * as THREE from 'three';
import { generateCase } from './domain/caseGenerator.js';
import { MAPS } from './domain/data/index.js';
import { buildScene } from './game/scene.js';
import { spawnObjects } from './game/objectSpawner.js';
import { createPlayer } from './game/player.js';

const app = document.getElementById('app');

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);

// Caso (temporário: seed fixa até termos menu/briefing)
const map = MAPS.apartment_01;
const { instance } = generateCase({ seed: 84723191 });

const { scene, colliders } = buildScene(map);
spawnObjects(scene, instance);

const player = createPlayer({
  camera,
  domElement: renderer.domElement,
  colliders,
  spawn: map.spawn,
  bounds: map.bounds,
});

// Overlay "clique para jogar" (pointer lock exige gesto do usuário)
const overlay = document.createElement('div');
overlay.className = 'overlay';
overlay.innerHTML = `
  <div class="overlay-card">
    <h1>My Hotel Spy</h1>
    <p>Clique para iniciar a inspeção</p>
    <p class="hint">WASD para andar · Mouse para olhar · ESC para liberar o cursor</p>
  </div>`;
app.appendChild(overlay);

overlay.addEventListener('click', () => player.controls.lock());
player.controls.addEventListener('lock', () => (overlay.style.display = 'none'));
player.controls.addEventListener('unlock', () => (overlay.style.display = 'flex'));

// Mira
const crosshair = document.createElement('div');
crosshair.className = 'crosshair';
app.appendChild(crosshair);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.1);
  player.move(delta);
  renderer.render(scene, camera);
});

// eslint-disable-next-line no-console
console.log('My Hotel Spy — caso', instance.seed, 'template', instance.template);
