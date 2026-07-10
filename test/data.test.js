import { describe, it, expect } from 'vitest';
import { validateData, OBJECTS, STATES, MAPS, TEMPLATES } from '../src/domain/data/index.js';

describe('integridade dos dados', () => {
  it('não há erros de validação nas bibliotecas', () => {
    expect(validateData()).toEqual([]);
  });

  it('todo estado irregular tem pelo menos uma evidência garantida (caso justo)', () => {
    for (const st of Object.values(STATES)) {
      if (st.irregular) {
        expect(st.required.length, `estado ${st.id}`).toBeGreaterThan(0);
      }
    }
  });

  it('as regras de consistência do CGS estão codificadas', () => {
    expect(STATES.CAMERA.required).toContain('LENS_REFLECTION');
    expect(STATES.MICROPHONE.forbidden).toContain('LENS_REFLECTION');
    expect(STATES.FALSE_MIRROR.forbidden).toContain('RF_SIGNAL');
  });

  it('todo objeto pode ser NORMAL', () => {
    for (const obj of Object.values(OBJECTS)) {
      expect(obj.allowedStates, `objeto ${obj.id}`).toContain('NORMAL');
    }
  });

  it('o mapa do MVP tem POIs suficientes para o MVP (>=10)', () => {
    expect(MAPS.apartment_01.pois.length).toBeGreaterThanOrEqual(10);
  });

  it('há um template de falso alarme e ao menos um de câmera', () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(ids).toContain('FALSO_ALARME');
    expect(ids).toContain('CAMERA_ESCONDIDA');
  });
});
