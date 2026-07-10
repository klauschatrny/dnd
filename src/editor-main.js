import './style.css';
import * as THREE from 'three';
import { MAPS } from './domain/data/index.js';
import { startEditor } from './game/editor.js';

// Ponto de entrada do editor de ambiente (página separada: editor.html).
const app = document.getElementById('app');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

startEditor(app, renderer, MAPS.apartment_01);
