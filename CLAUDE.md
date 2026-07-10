# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Todo trabalho neste repositório é feito em português (código, commits, comunicação). Os documentos de design são a fonte da verdade.

## MVP em desenvolvimento — protótipo web (Three.js)

Decisão de implementação do MVP: em vez do Unity, o MVP é um **protótipo web em Three.js** (rodando no navegador via Vite), escolhido por entregar um MVP jogável e apresentável rapidamente. **Os documentos de design continuam sendo a fonte da verdade da arquitetura (CDIS).** A lógica de domínio (geração de casos, evidências, laudo) é mantida em módulos **independentes de engine** em `src/domain/`, para permanecer portável caso o projeto volte ao Unity.

Comandos:

```bash
npm install       # instala dependências (three, vite, vitest)
npm run dev       # servidor de desenvolvimento (http://localhost:5173)
npm run build     # build de produção em dist/
npm run preview   # serve o build de produção
npm test          # roda os testes (vitest) uma vez
npm run test:watch
```

Rodar um único teste: `npx vitest run test/caseGenerator.test.js` (ou `npx vitest -t "nome do teste"`).

Estado: **MVP jogável e verificado em navegador** — fluxo completo menu → briefing → inspeção → caderneta → laudo (nota S/A/B/C/D) → próximo caso. 32 testes de domínio passando.

Organização do código:

- `src/domain/` — núcleo CDIS **sem dependência de Three.js**: `rng.js` (seed determinística), `data/` (objetos/estados/evidências/denúncias/mapas/templates + `validateData`), `caseGenerator.js` (`generateCase`), `report.js` (`evaluateReport`). É aqui que vive o "conteúdo do jogo". Coberto por testes em `test/`.
- `src/game/` — camada de apresentação web (depende de Three.js): `scene.js` (apartamento + colisores + luzes), `objectSpawner.js` (instancia objetos do caso), `player.js` (1ª pessoa + colisão), `tools.js` (5 ferramentas), `inspection.js` (raycast + registro de evidências), `ui.js` (HUD, caderneta, menu, briefing, resultado).
- `src/main.js` — controlador de fluxo (máquina de estados) e loop de render.

Controles: **WASD** mover · **mouse** olhar · **1–5** trocar ferramenta (Lanterna/Zoom/UV/RF/Térmico) · **E** ou clique esquerdo inspecionar · **TAB** caderneta/laudo · **ESC** pausar.

Ao evoluir: mantenha `src/domain/` puro (nada de import de `three` nem de DOM) para preservar a portabilidade e a testabilidade. Novo objeto/evidência/estado/denúncia = editar dados em `src/domain/data/` (mais um prefab visual via `visual` no objeto); o gerador não muda.

Verificação em navegador: dá para usar Playwright pontualmente (`npm i -D playwright && npx playwright install chromium`) para carregar a página, exercitar o fluxo e capturar erros de console/screenshots. Não fica como dependência fixa.

## Documentos de design (fonte da verdade)

Os documentos em `Documentos de referência/`:

- `Game Design Document - My Hotel Spy.pdf` (GDD) — visão do jogo, loop de gameplay, ferramentas, categorias de irregularidade, progressão.
- `Technical Design Document - My Hotel Spy.pdf` (TDD) — arquitetura de código, managers, interfaces, estrutura de pastas, convenções.
- `Case Generation Specification.pdf` (CGS) — algoritmo procedural de geração de casos, POIs, estados, evidências, regras de consistência.
- `Ajuste.txt` — refinamento importante do CGS (ver "Geração baseada em templates" abaixo).

Ao iniciar a implementação: engine **Unity 6 (URP)**, alvo **WebGL** (MVP). Consulte os PDFs para qualquer detalhe não resumido aqui.

## O jogo em uma frase

Investigação em primeira pessoa: o jogador é inspetor de imóveis de hospedagem (Airbnb) e deve encontrar dispositivos ilegais / objetos adulterados usando ferramentas, cruzar evidências e emitir um laudo. Acusar inocentes ou perder irregularidades reduz a nota (S/A/B/C/D).

## Princípio central da arquitetura (CDIS — Case-Driven Investigation System)

**O conteúdo do jogo não são os mapas; são os casos.** Esta é a regra que governa todas as decisões de design de código:

- **Mapas** fornecem apenas o ambiente e os pontos de interesse (POIs) — nunca contêm a solução.
- **Objetos** são módulos reutilizáveis que só conhecem seus estados possíveis, nunca o caso atual.
- **Estados** definem a irregularidade e quais evidências são compatíveis.
- **Evidências** fornecem pistas; nenhuma evidência isolada confirma uma irregularidade.
- **O gerador** monta cada investigação a partir dessas peças, guiado por uma seed.

Consequência prática: **o código conhece apenas regras; todo conteúdo vem de dados (JSON) separados do código.** Adicionar objeto, evidência, mapa, caso ou tipo de irregularidade **nunca** deve exigir mudança no código do gerador ou dos sistemas existentes.

## Pipeline de geração de caso (o coração do jogo)

`GenerateCase(seed)` (ver CGS §26) é determinístico — a mesma seed sempre produz o mesmo caso:

1. Selecionar mapa
2. Criar RNG a partir da seed
3. Selecionar dificuldade (Fácil 1–2 / Médio 2–4 / Difícil 4–6 irregularidades)
4. Obter POIs elegíveis do mapa
5. Escolher quantidade de irregularidades
6. Selecionar objetos (filtrar → remover incompatíveis → aplicar pesos → sortear)
7. Aplicar estados válidos aos objetos escolhidos; **todos os demais recebem `Normal`**
8. Gerar evidências compatíveis (subconjunto variável da biblioteca de evidências do estado)
9. Gerar objetos distratores (suspeitos porém `Normal`) e objetos inocentes que emitem sinais legítimos (TV/notebook/roteador → calor/RF)
10. Selecionar denúncia compatível (orienta, nunca entrega a resposta)
11. Construir `CaseInstance` (visível) e `CaseSolution` (interno, nunca mostrado ao jogador)

**Regras de consistência inegociáveis** (CGS §18, §23, §24): câmera sempre tem lente; microfone nunca reflete lente; espelho falso nunca emite RF; nunca gerar caso impossível, evidência sem explicação, objeto repetido, ou concentrar todas as irregularidades num só cômodo. O objetivo (CGS §27): casos coerentes, justos e resolvíveis só por observação e dedução — nunca por sorte.

### Geração baseada em templates (refinamento do `Ajuste.txt`)

Em vez de sortear estados de forma puramente aleatória, o gerador deve primeiro escolher um **template de caso** (ex.: câmera escondida, espionagem por áudio, estruturas adulteradas, caso misto, falso alarme) e então adaptá-lo ao mapa e à dificuldade. Isso dá identidade e ritmo a cada investigação. Preferir esta abordagem à aleatoriedade pura descrita no CGS original.

## Estrutura de pastas planejada (TDD §4)

```
Assets/
  Art/  Audio/  Materials/  Models/  Prefabs/  Player/  Scenes/  Settings/  UI/
  Data/                      # conteúdo em JSON, separado do código
    Objects/                 # Clock.json, SmokeDetector.json, Mirror.json...
    Cases/                   # Apartment01.json, Hotel02.json...
    Evidence/                # Reflection.json, RFSignal.json, Glue.json...
  Scripts/
    Core/  Player/  Interaction/  Inspection/  Objects/
    Evidence/  Case/  Report/  Managers/  UI/  Utilities/
```

## Sistemas principais e responsabilidades (não misturar)

- **Managers**: `GameManager` (estado do jogo, cenas, fluxo) · `CaseManager` (pede geração ao Case Generator, registra objetos ativos) · `UIManager` (HUD, briefing, tablet, relatório, menus) · `SaveManager` (progresso, dinheiro, cosméticos) · `AudioManager`.
- **Máquina de estados do jogo** (TDD §6): Main Menu → Briefing → Loading → Inspection → Report → Results → Next Case. Cada estado cuida só da própria responsabilidade.
- **Player**: Character Controller, Camera, Interaction, Tool Controller, Inspection Controller.
- **Ferramentas** — base `Tool`, interface `ITool` (`Activate/Deactivate/Inspect/Update/CanInspect`): Zoom, Flashlight, UV, RFScanner, Thermal, Endoscope. Todas disponíveis o tempo todo, sem upgrades; cada uma responde uma pergunta diferente.
- **Interação** — interface `IInteractable` (`Interact/Inspect/Highlight/GetInspectionData`). Qualquer objeto interativo a implementa.
- **Objetos** — `InspectableObject` (ID, ObjectType, CurrentState, EvidenceList, Mesh, Collider, Interaction Point). Um prefab por objeto; os estados só trocam componentes/materiais/dados, **nunca criam novos prefabs**.
- **Dados de conteúdo** — `ObjectState` (nome, categoria, irregularidade, evidências possíveis, modelo/material opcional, peso) · `Evidence` (ID, nome, ferramenta, descrição, peso, confiança) · `CaseDefinition` / `CaseInstance` / `CaseSolution` · `InspectionReport` (objetos marcados, conclusões, acertos, erros, falsos positivos, precisão, tempo, nota).

## Convenções de código (TDD §24–25)

- Classes e métodos: `PascalCase`. Campos privados: `_camelCase`. Interfaces: `IInteractable`, `ITool`. Enums: `ToolType`, `EvidenceType`, `ObjectStateType`.
- Single Responsibility; componentes pequenos; **composição sobre herança** (evitar heranças profundas).
- **Nunca codificar casos específicos** — toda regra deve ser reutilizável e todo conteúdo deve vir de dados.
- **Comunicação por eventos**, não referências diretas: ex. `ObjectInspected → EvidenceFound → UIUpdated`, em vez de o objeto chamar a UI diretamente.

## Filosofia de design que o código deve preservar (GDD §16–17)

O jogador **nunca** deve saber quantas irregularidades existem, quantos objetos escondem algo, nem quando a inspeção está completa — a decisão de finalizar é dele. HUD mínimo (ferramenta equipada, interação, troca de ferramenta); **sem** minimapa, marcadores, setas ou indicadores da solução.

## Escopo do MVP (validar só a mecânica principal)

1 apartamento pequeno · 10–15 objetos interativos · ~3 estados por objeto · ferramentas Zoom + Lanterna · briefing · sistema de inspeção · sistema de evidências · sistema de laudo · tela de relatório · gerador simples de casos. Partida esperada: 10–15 min. Nada além disso até o MVP validar a arquitetura.
