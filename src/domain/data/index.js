// Barrel dos dados do domínio + validação de integridade.
// A validação garante que o conteúdo (dados) permanece coerente à medida que cresce,
// sem exigir mudanças no código do gerador (princípio de extensibilidade do TDD §26).

import { EVIDENCE, EVIDENCE_IDS, TOOLS, TOOL_LABELS } from './evidence.js';
import { STATES, STATE_IDS, IRREGULAR_STATE_IDS, CATEGORIES, CONCLUSIONS, CONCLUSION_LABELS } from './states.js';
import { OBJECTS, OBJECT_IDS } from './objects.js';
import { TEMPLATES, TEMPLATES_BY_ID } from './templates.js';
import { DENUNCIAS } from './denuncias.js';
import { MAPS } from './maps.js';

export { EVIDENCE, EVIDENCE_IDS, TOOLS, TOOL_LABELS };
export { STATES, STATE_IDS, IRREGULAR_STATE_IDS, CATEGORIES, CONCLUSIONS, CONCLUSION_LABELS };
export { OBJECTS, OBJECT_IDS, TEMPLATES, TEMPLATES_BY_ID, DENUNCIAS, MAPS };

/**
 * Valida a consistência das bibliotecas de dados.
 * @returns {string[]} lista de erros (vazia = tudo certo).
 */
export function validateData() {
  const errors = [];
  const evSet = new Set(EVIDENCE_IDS);
  const stSet = new Set(STATE_IDS);
  const objSet = new Set(OBJECT_IDS);

  // Evidências apontam para uma ferramenta válida.
  for (const ev of Object.values(EVIDENCE)) {
    if (!TOOLS[ev.tool]) errors.push(`Evidência ${ev.id}: ferramenta inválida "${ev.tool}".`);
  }

  // Estados: referências de evidência válidas e sem contradição required/forbidden.
  for (const st of Object.values(STATES)) {
    for (const key of ['required', 'pool', 'forbidden']) {
      for (const e of st[key]) {
        if (!evSet.has(e)) errors.push(`Estado ${st.id}: evidência "${e}" (${key}) inexistente.`);
      }
    }
    for (const e of st.required) {
      if (st.forbidden.includes(e)) {
        errors.push(`Estado ${st.id}: evidência "${e}" está em required E forbidden.`);
      }
    }
    if (!CATEGORIES[st.category]) errors.push(`Estado ${st.id}: categoria inválida "${st.category}".`);
    if (!CONCLUSIONS[st.expectedConclusion]) {
      errors.push(`Estado ${st.id}: conclusão inválida "${st.expectedConclusion}".`);
    }
  }

  // Objetos: estados permitidos e sinais inocentes válidos.
  for (const obj of Object.values(OBJECTS)) {
    if (!obj.allowedStates.length) errors.push(`Objeto ${obj.id}: sem estados permitidos.`);
    for (const s of obj.allowedStates) {
      if (!stSet.has(s)) errors.push(`Objeto ${obj.id}: estado "${s}" inexistente.`);
    }
    for (const e of obj.innocentSignals ?? []) {
      if (!evSet.has(e)) errors.push(`Objeto ${obj.id}: sinal inocente "${e}" inexistente.`);
    }
  }

  // Templates: estados irregulares válidos e realmente irregulares.
  for (const t of TEMPLATES) {
    if (t.irregularStates === null) continue;
    for (const s of t.irregularStates) {
      if (!stSet.has(s)) errors.push(`Template ${t.id}: estado "${s}" inexistente.`);
      else if (!STATES[s].irregular) errors.push(`Template ${t.id}: estado "${s}" não é irregular.`);
    }
  }

  // Mapas: POIs apontam para tipos de objeto válidos; estados permitidos coerentes.
  for (const map of Object.values(MAPS)) {
    const poiIds = new Set();
    for (const poi of map.pois) {
      if (poiIds.has(poi.id)) errors.push(`Mapa ${map.id}: POI duplicado "${poi.id}".`);
      poiIds.add(poi.id);
      if (!objSet.has(poi.objectType)) {
        errors.push(`Mapa ${map.id}: POI ${poi.id} usa objeto inexistente "${poi.objectType}".`);
        continue;
      }
      const allowed = poi.allowedStates ?? OBJECTS[poi.objectType].allowedStates;
      for (const s of allowed) {
        if (!OBJECTS[poi.objectType].allowedStates.includes(s)) {
          errors.push(`Mapa ${map.id}: POI ${poi.id} permite estado "${s}" incompatível com o objeto.`);
        }
      }
    }
  }

  return errors;
}
