# Modelos 3D (.glb) dos imóveis

Coloque aqui os arquivos `.glb` dos ambientes. O Vite serve esta pasta na raiz,
então `public/models/casa.glb` fica acessível em `/models/casa.glb` no jogo.

Um mapa passa a usar um modelo declarando `model: '/models/<arquivo>.glb'` em
`src/domain/data/maps.js`. Se o arquivo não existir, o mapa cai de volta para a
geometria procedural (paredes/mobília) — nada quebra.

## Convenções recomendadas na exportação
- Formato **`.glb`** (binário), **Y-up**, unidades em **metros**, escala real.
- Origem do modelo no **piso**, idealmente centralizada.
- Se possível, nomeie nós para separar visual de colisão:
  - `parede_*` / `collider_*` → geram colisão
  - o restante → apenas visual

A colisão (paredes) e os POIs (objetos inspecionáveis) continuam vindo dos dados
do mapa; o `.glb` entra como casca/decoração do ambiente.
