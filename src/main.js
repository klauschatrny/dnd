import './style.css';
import * as THREE from 'three';

// Bootstrap mínimo para validar a toolchain (Vite + Three.js).
// Será substituído pela inicialização do jogo nos próximos passos do roadmap.
const app = document.getElementById('app');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14171c);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 4);

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(2, 3, 4);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040, 2));

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 1.4, 1.4),
  new THREE.MeshStandardMaterial({ color: 0x4a90d9, roughness: 0.4 }),
);
scene.add(cube);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop((t) => {
  cube.rotation.x = t / 2000;
  cube.rotation.y = t / 1400;
  renderer.render(scene, camera);
});

// eslint-disable-next-line no-console
console.log('My Hotel Spy — bootstrap OK');
