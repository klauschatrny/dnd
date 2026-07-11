# CLAUDE.md

Guia para o Claude Code (claude.ai/code) ao trabalhar neste repositório.

## Idioma

Todo o trabalho é feito em **português** (código, comentários, commits, comunicação).
Os documentos de design são a fonte da verdade. **Decisão do dono (2026-07-11):** embora
o TDD traga exemplos em inglês e `camelCase`, o projeto mantém **identificadores em
português e `snake_case`** (padrão idiomático da Godot); adota-se do TDD a **arquitetura**
(estrutura, managers, hierarquia de mundo), não a nomenclatura em inglês.

## O jogo em uma frase

**The Labyrinth** — exploração em primeira pessoa num gigantesco jardim labiríntico
abandonado. Sem combate, sem perseguições, sem HUD, sem minimapa. O terror não vem de
monstros; vem da dúvida e da percepção. *"Essa estátua estava olhando para mim antes?"*

## Engine e plataforma

- **Godot 4.7** (stable). Renderização **Forward+**. Câmera em **primeira pessoa** (FOV 75).
- Alvo inicial: **Windows (Steam)**. Arquitetura preparada para Linux/macOS.
- Instalação local do editor usada para verificação:
  `C:\Users\klaus\Downloads\Godot_v4.7-stable_win64.exe\Godot_v4.7.exe`
  (versão console para logs: `...\Godot_v4.7-stable_win64_console.exe`).

Verificar sem abrir o editor (importa assets e reporta erros):

```bash
GODOT="/c/Users/klaus/Downloads/Godot_v4.7-stable_win64.exe/Godot_v4.7.exe"
"$GODOT" --headless --path "$(pwd)" --import        # importa e valida o projeto
"$GODOT" --headless --path "$(pwd)" --check-only     # checa scripts (se aplicável)
```

Para jogar: abrir o projeto no editor e rodar (F5), ou `"$GODOT" --path "$(pwd)"`.

Controles atuais: **WASD** andar · **Shift** correr · **mouse** olhar · **E** interagir · **Espaço** pular · **ESC** pausar.
(Correr e pular foram adicionados a pedido do dono; divergem da orientação de movimento do GDD §4.)
Teste/depuração: **N** alterna **noclip** (voa atravessando a geometria) — temporário, remover no MVP.

## Documentos de design (fonte da verdade)

Em `Documentos de referência/` (conjunto completo desde 2026-07-11):

- `O labirinto - GDD.pdf` — **Game Design Document**: visão, pilares, mundo, atmosfera, MVP.
- `O labirinto - TDD.pdf` — **Technical Design Document**: arquitetura técnica (estrutura de
  pastas, sistemas/managers, save, gameplay, convenções, ordem de implementação). **É a
  referência de arquitetura** — substitui o antigo "PAD" previsto.
- `O labirinto - LDD.pdf` — **Level Design Document**: estrutura do labirinto, regiões,
  landmarks, fluxo de exploração, loops, colocação de puzzles.
- `O labirinto - README.pdf` — visão geral, filosofia de desenvolvimento, workflow.
- `O Labirinto - TASKS.pdf` — backlog de desenvolvimento (tarefas, prioridades, milestones).
- `MAPSPECS/ESPEC_MAPA_O_Labirinto_v1.md` + `MAPSPECS/labirinto_map.json` — **Especificação
  Técnica de Mapa**: layout completo do labirinto em coordenadas (grade 240×192 m, 120×96
  células de 2 m, origem NO, +Z sul), os 13 locais + Alameda dos Ciprestes, grafo de
  caminhos, becos, atalhos, arcos, setores, eventos raros e convenções de implementação.
  **É a fonte da verdade do mapa** (desde 2026-07-11). O JSON está copiado em
  `recursos/labirinto/labirinto_map.json` e é lido em runtime pelo `carregador_mapa.gd`.

O TDD (§10) manda: sempre que uma decisão técnica mudar a arquitetura, atualizar a doc.

## Pilares de design (todo o projeto deve respeitá-los — GDD §3)

1. **Exploração acima de tudo** — o jogador caminha por querer descobrir o próximo lugar.
2. **O ambiente conta a história** — narrativa pelos cenários, não por textos/diálogos.
3. **Memória espacial** — o jogador aprende o mapa; sem minimapa, GPS, bússola ou marcadores.
4. **Atmosfera acima de ação** — ritmo contemplativo; sem sprint obrigatório, fuga ou perseguição.
5. **Mistério sem respostas imediatas** — a maior parte das coisas não é explicada.
6. **Beleza melancólica** — o jardim é bonito mesmo abandonado; dá vontade de parar e observar.

Regra de ouro (GDD §32): antes de adicionar qualquer coisa, pergunte *"isto melhora a
exploração?"*. Se não, provavelmente não pertence ao jogo.

## Escopo do MVP (GDD §33 — validar apenas a experiência principal)

**Incluído:** movimentação 1ª pessoa · um único grande mapa · colisão · áudio ambiente ·
atmosfera · iluminação · neblina · landmarks · eventos raros · menu inicial · menu de
pausa · configurações básicas · créditos.

**NÃO incluído (não implementar antes de o MVP validar a exploração):** inventário,
puzzles, chaves, coletáveis, monstros, combate, IA, missões, diálogos, multiplayer,
crafting, economia, progressão/habilidades, HUD complexa, conquistas.

Progressão = **conhecimento do mapa**, não poder. O jogador nunca recebe lista de objetivos.

## Estrutura do mundo (GDD §10–12)

Macro (base para o futuro LDD): Torre do Relógio → Jardim dos Ciprestes → Praça das Quatro
Estátuas → (Lago Seco · Jardim Central · Roseiral) → (Bosque Morto · Fonte Principal ·
Estufa) → Claustro Verde/Gazebo Antigo → Mausoléu → Jardim das Sombras → Portão Final.
São 12 regiões, cada uma com identidade visual e função emocional próprias.
**Landmarks** (Torre do Relógio, Estufa, Gazebo, Fonte Principal) são vistos de longe e
sustentam o mapa mental do jogador.

## Atmosfera (GDD §18–19)

Fim de tarde, luz suave, sombras longas, neblina discreta — **nunca noite completa**.
Sempre nublado, sem chuva/sol forte. Paleta: verdes dessaturados, cinzas frios, marrons
envelhecidos, pedra com musgo, ferro oxidado. **Silêncio é o principal instrumento**:
só som ambiente durante a exploração; música pouquíssima (início/créditos).
Estado atual: ambiência de **vento procedural** (`som_ambiente.gd`) no barramento
`Ambiente` — cama discreta, gerada em tempo real, sem arquivo de áudio.

## Roadmap (ordem de implementação — TDD §10) — estado atual

- **Fase 1 — Fundação**: config do projeto, estrutura de pastas, versão, cena `Principal`. ✅
- **Fase 2 — Player**: input, movimento, câmera, colisão. ✅ (`jogador.gd`)
- **Fase 3 — Interação**: raycast, sistema de interação, objetos interativos básicos.
  ✅ base (`interagivel.gd`) — faltam objetos interativos concretos.
- **Fase 4 — Graybox** *(mapa completo montado)*: construir o labirinto em geometria simples.
  **Decisão do dono (2026-07-11):** o antigo método de regiões ASCII improvisadas foi
  **descartado** e substituído pela **Especificação Técnica de Mapa (MAPSPEC)** como fonte
  única da verdade. O mundo inteiro é montado **em runtime** a partir de
  `recursos/labirinto/labirinto_map.json` pelo `carregador_mapa.gd`, sobre a grade de
  240×192 m. ✅ Já montados: terreno + muro perimetral (4,5 m, com aberturas Entrada/Saída) ·
  os **13 locais + Alameda dos Ciprestes** nas coordenadas exatas · o **grafo de caminhos**
  (alamedas CP/CS, becos, atalhos), marcos e arcos de setor · o **labirinto** (recursive
  backtracker seed 20260711 + braid, sebes por setor via MultiMesh + colisão). Falta
  (Fase 7/8): arte final das sebes/landmarks, névoa por setor, navmesh, streaming de chunks,
  eventos raros, atalhos reveláveis, becos com props.
- **Fase 5 — Sistemas Base**: Save · Menu Principal · Menu de Pausa · Configurações.
  Menus e Configurações ✅ (adiantados). **Save pendente** — só há o esqueleto
  `gerenciador_save.gd` (implementar aqui).
- **Fase 6 — Gameplay**: framework de puzzles, eventos raros, objetos especiais.
- **Fase 7 — Arte**: modelos low poly, materiais, vegetação, iluminação, sons ambientes.
  Atmosfera/áudio de exploração ✅ parcialmente adiantados.
- **Fase 8 — Polimento**: bugs, ajustes, otimização, balanceamento, melhorias visuais.

Obs.: menus, configurações, atmosfera e áudio foram feitos **fora de ordem** (antes do
Graybox). Com o mapa da MAPSPEC montado, as lacunas do MVP passam a ser o **acabamento da
Fase 4** (navmesh, névoa por setor, eventos raros, streaming) e o **Save (Fase 5)**.

## Organização do código

Estrutura seguindo o TDD §3 (nomes em PT). Managers globais são **autoloads**
(a "camada Managers" do TDD); a cena `Principal` segue `Main → World/Player/UI/Audio`.

```
project.godot                 # config, input map, autoloads, barramentos de áudio
default_bus_layout.tres       # barramentos: Master → Ambiente · Música
icon.svg
cenas/
  principal/  principal.tscn       (Main: Mundo/Jogador/Interface/Audio — cena de gameplay)
  mundo/      mundo.tscn           (World: ambiente, sol; raiz "Mapa" = CarregadorMapa)
    modulos/  sebe_bloco.tscn      (bloco de sebe unitário — módulo de referência)
  jogador/    jogador.tscn
  menus/      menu_inicial.tscn · menu_pausa.tscn · opcoes.tscn · creditos.tscn
scripts/
  nucleo/     gerenciador_jogo.gd  (GameManager: estado + pausa + fluxo)
              gerenciador_cenas.gd (SceneManager: transições)
              gerenciador_audio.gd (AudioManager: volumes/sons)
              configuracoes.gd     (Configurações persistidas: sensib./volume/tela cheia)
  save/       gerenciador_save.gd  (SaveManager: esqueleto — implementar na Fase 5)
  jogador/    jogador.gd           (CharacterBody3D, 1ª pessoa: andar/olhar/interagir)
  interacao/  interagivel.gd       (base de objeto interativo: padrão interagir())
  interface/  menu_inicial.gd · menu_pausa.gd · opcoes.gd (painel reutilizável) · creditos.gd
  mundo/      som_ambiente.gd      (ambiência de vento procedural, sem asset)
              utilidades_grade.gd  (conversões célula↔world; grade 240×192, célula 2 m)
              carregador_mapa.gd   (lê labirinto_map.json e monta o mundo inteiro em runtime:
                                    terreno, muro, landmarks, grafo de caminhos, labirinto)
assets/
  materiais/  sebe.tres · pedra_chao.tres · pedra.tres
recursos/                          (dados .tres/.json compartilhados — só dados, sem lógica)
  labirinto/  labirinto_map.json   (cópia da MAPSPEC lida pelo carregador_mapa em runtime)
```

Ordem dos autoloads (importa): `GerenciadorAudio` → `GerenciadorCenas` → `GerenciadorSave`
→ `Configuracoes` (usa o Áudio ao aplicar) → `GerenciadorJogo`.

## Convenções (TDD §9, adaptadas para PT)

- Nós/cenas/arquivos em **português**. Classes/nós em `PascalCase` (`Jogador`, `ParedeSebe`),
  variáveis e funções em `snake_case` (padrão Godot; o TDD sugere `camelCase`, mas o dono
  optou por manter o idiomático), constantes em `UPPER_CASE`, "privados" com prefixo `_`.
- **Responsabilidade única**: cada script/cena faz uma coisa. Managers globais separados
  (Game/Cenas/Audio/Save + Configurações) — nunca um manager "faz-tudo".
- **Baixo acoplamento**: o Player só *pede* interação; o objeto decide como responder.
  Comunicação por **sinais** e chamadas simples, não referências diretas quando possível.
- **Simplicidade**: entre duas soluções, a mais simples que atenda. Sem abstração prematura;
  construir a menor versão jogável antes de expandir.
- **Sistema modular**: ambientes montados a partir de peças reutilizáveis (ex.: `parede_sebe.tscn`),
  instanciadas e posicionadas na cena — nunca geometria única gigante.
- Regras de pasta (TDD): nenhum script na raiz · cenas não contêm lógica de sistema ·
  `recursos/` só guarda dados · assets nunca misturados com código.
- A interface deve ser quase invisível durante a exploração (GDD §24): nada de barras,
  bússola, objetivos ou indicadores.
