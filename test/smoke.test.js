import { describe, it, expect } from 'vitest';

// Teste-fumaça: garante que a toolchain de testes está funcionando.
describe('toolchain', () => {
  it('roda vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
