# CLAUDE.md

Guia para o Claude Code (claude.ai/code) ao trabalhar neste repositório.

## Idioma

Todo o trabalho é feito em **português** (código, comentários, commits, comunicação).
Os documentos de design são a fonte da verdade.

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

Controles atuais: **WASD** andar · **mouse** olhar · **E** interagir · **ESC** pausar.

## Documentos de design (fonte da verdade)

Em `Documentos de referência/`:

- `O labirinto - GDD.pdf` — **Game Design Document v2.0**, documento oficial do projeto.
  Define visão, pilares, mundo, regiões, atmosfera, escopo do MVP e roadmap.

Documentos previstos (serão adicionados pelo usuário e passam a valer como fonte da verdade):

- **PAD** — Project Architecture Document (arquitetura de código). **Enquanto o PAD não
  chega, a arquitetura em `scripts/` é provisória/fundacional** — evoluir com cautela e
  não cravar decisões estruturais que o PAD possa contradizer.
- Futuros: TDD, LDD (Level Design Document), Art Bible.

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

## Roadmap (GDD §34) — estado atual

- **Fase 1 — Fundação** *(em andamento)*: projeto Godot, arquitetura inicial, sistema
  modular, movimentação 1ª pessoa. ✅ base montada. Casca do jogo pronta: menu inicial,
  menu de pausa, opções (sensibilidade/volume/tela cheia, persistidas) e créditos.
- **Fase 2 — Graybox**: todo o mapa em cubos, sem arte definitiva; testar exploração.
  *(pendente decisão de direção com o usuário: método de construção e escopo — aguardando o PAD.)*
- **Fase 3 — Vertical Slice**: primeira região completa (iluminação, vegetação, áudio, eventos raros).
- **Fase 4 — Mundo Completo** (sem puzzles) → playtest.
- **Fase 5 — Puzzles** (só após validar navegação).
- **Fase 6 — Polimento**.

## Organização do código

```
project.godot                 # configuração do projeto, input map, autoloads, barramentos de áudio
default_bus_layout.tres       # barramentos: Master → Ambiente · Música
icon.svg
cenas/
  mundo/    labirinto_teste.tscn  (graybox atual) · parede_sebe.tscn (módulo de sebe)
  jogador/  jogador.tscn
  interface/  menu_inicial.tscn · menu_pausa.tscn · opcoes.tscn · creditos.tscn
scripts/
  nucleo/     gerenciador_jogo.gd  (autoload GerenciadorJogo: estado + pausa + config + navegação)
  jogador/    jogador.gd           (CharacterBody3D, 1ª pessoa: andar/olhar/interagir)
  interface/  interagivel.gd (padrão interagir()) · menu_inicial.gd · menu_pausa.gd
              · opcoes.gd (painel reutilizável) · creditos.gd
  mundo/      som_ambiente.gd       (ambiência de vento procedural, sem asset)
assets/
  materiais/  sebe.tres · pedra_chao.tres · pedra.tres
  modelos/                          (a fazer)
recursos/                           (recursos .tres compartilhados)
```

## Convenções

- Nós/cenas/arquivos em **português** (`Jogador`, `ParedeSebe`, `GerenciadorJogo`).
- GDScript com tipos estáticos sempre que possível; membros "privados" com prefixo `_`.
- **Sistema modular**: ambientes montados a partir de peças reutilizáveis (ex.: `parede_sebe.tscn`),
  instanciadas e posicionadas na cena — nunca geometria única gigante.
- **Comunicação por sinais**, não referências diretas, quando possível.
- Não codificar conteúdo/casos específicos em sistemas genéricos.
- A interface deve ser quase invisível durante a exploração (GDD §24): nada de barras,
  bússola, objetivos ou indicadores.
