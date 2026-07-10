import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Carrega o modelo 3D (.glb/.gltf) de um imóvel. Usado quando um mapa declara
// `model` — a casca/decoração do ambiente vem do arquivo, e não da geometria
// procedural. As texturas podem vir embutidas no próprio .glb.
//
// Sem cache proposital: cada caso reconstrói a cena e recebe uma cópia própria do
// modelo (geometrias/materiais exclusivos), para que o descarte da cena anterior
// (dispose) não afete a próxima. Se o tempo de carga incomodar, dá para cachear
// depois com clonagem + preservação de assets.

const loader = new GLTFLoader();

/** @returns {Promise<import('three').Group>} raiz do modelo carregado. */
export function loadModel(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
  });
}
