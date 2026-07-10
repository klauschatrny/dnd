import * as THREE from 'three';
import { EVIDENCE } from '../domain/data/index.js';

// Sistema de inspeção: raycast a partir do centro da tela para mirar objetos.
// Ao inspecionar (tecla E), revela as evidências do objeto detectáveis pela
// ferramenta ativa e as acumula. Nenhuma evidência isolada prova algo (GDD §7).

const MAX_DIST = 3.6;

export function createInspection({ camera, inspectables }) {
  const raycaster = new THREE.Raycaster();
  raycaster.far = MAX_DIST;
  const center = new THREE.Vector2(0, 0);
  const meshes = inspectables.map((i) => i.mesh);
  let targeted = null;

  /** Atualiza o objeto mirado. Retorna o mesh mirado (ou null). O realce visual
   *  do alvo é responsabilidade do sistema de revelação (reveal.js). */
  function update() {
    raycaster.setFromCamera(center, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    targeted = hit ? hit.object : null;
    return targeted;
  }

  /**
   * Inspeciona o objeto mirado com a ferramenta atual.
   * @param {string[]} revealIds  Evidências detectáveis pela ferramenta.
   * @returns {null|{label:string, found:string[], already:string[], none:boolean}}
   */
  function inspect(revealIds) {
    if (!targeted) return null;
    const st = targeted.userData.inspect;
    st.examined = true;
    const detectable = st.data.evidences.filter((e) => revealIds.includes(e));
    const found = [];
    const already = [];
    for (const e of detectable) {
      if (st.foundEvidence.has(e)) already.push(EVIDENCE[e].nome);
      else {
        st.foundEvidence.add(e);
        found.push(EVIDENCE[e].nome);
      }
    }
    return { label: st.data.label, found, already, none: detectable.length === 0 };
  }

  function current() {
    return targeted;
  }

  return { update, inspect, current };
}
