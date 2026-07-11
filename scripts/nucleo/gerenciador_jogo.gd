extends Node
## Núcleo do jogo (fundação — arquitetura provisória até a chegada do PAD).
##
## Concentra três responsabilidades de alto nível, todas neutras em relação à
## futura arquitetura de mundo:
##   1. Estado global de alto nível (menu / exploração / pausa).
##   2. Controle de pausa (só durante a exploração) e navegação entre cenas.
##   3. Configurações do jogador, persistidas em disco.
##
## Registrado como singleton (autoload) em project.godot.

## Emitido ao alternar a pausa durante a exploração. A interface de pausa escuta
## este sinal para se mostrar ou esconder, sem referência direta ao núcleo.
signal pausa_alternada(pausado: bool)

enum Estado { MENU, EXPLORANDO, PAUSADO }

const CENA_MENU := "res://cenas/interface/menu_inicial.tscn"
const CENA_EXPLORACAO := "res://cenas/mundo/labirinto_teste.tscn"
const CAMINHO_CONFIG := "user://configuracoes.cfg"

var estado: Estado = Estado.MENU

# --- Configurações (valores padrão; sobrescritos por carregar_configuracoes) ---
## Sensibilidade do mouse, em radianos por pixel. O jogador puxa este valor.
var sensibilidade_mouse: float = 0.0022
## Volume geral (0.0 a 1.0), aplicado ao barramento de áudio principal.
var volume_geral: float = 0.8
## Se a janela deve abrir em tela cheia.
var tela_cheia: bool = false


func _ready() -> void:
	# O núcleo precisa continuar processando mesmo com a árvore pausada,
	# para conseguir despausar o jogo.
	process_mode = Node.PROCESS_MODE_ALWAYS
	carregar_configuracoes()
	aplicar_configuracoes()


func _unhandled_input(event: InputEvent) -> void:
	# Pausar só faz sentido durante a exploração (não nos menus).
	if event.is_action_pressed("pausar") and estado != Estado.MENU:
		alternar_pausa()


# --- Pausa -------------------------------------------------------------------

func alternar_pausa() -> void:
	var pausar := not get_tree().paused
	get_tree().paused = pausar
	if pausar:
		estado = Estado.PAUSADO
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	else:
		estado = Estado.EXPLORANDO
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	pausa_alternada.emit(pausar)


# --- Navegação entre cenas ---------------------------------------------------

## Vai do menu para o mundo de exploração.
func iniciar_exploracao() -> void:
	_trocar_cena(CENA_EXPLORACAO, Estado.EXPLORANDO)
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


## Volta para o menu inicial (também usado para sair da pausa).
func ir_para_menu() -> void:
	_trocar_cena(CENA_MENU, Estado.MENU)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


func sair_do_jogo() -> void:
	get_tree().quit()


func _trocar_cena(caminho: String, novo_estado: Estado) -> void:
	# Ao trocar de cena garantimos que a árvore não fique pausada.
	get_tree().paused = false
	estado = novo_estado
	get_tree().change_scene_to_file(caminho)


# --- Configurações -----------------------------------------------------------

func carregar_configuracoes() -> void:
	var config := ConfigFile.new()
	if config.load(CAMINHO_CONFIG) != OK:
		return  # Primeira execução: mantém os padrões.
	sensibilidade_mouse = config.get_value("controles", "sensibilidade_mouse", sensibilidade_mouse)
	volume_geral = config.get_value("audio", "volume_geral", volume_geral)
	tela_cheia = config.get_value("video", "tela_cheia", tela_cheia)


func salvar_configuracoes() -> void:
	var config := ConfigFile.new()
	config.set_value("controles", "sensibilidade_mouse", sensibilidade_mouse)
	config.set_value("audio", "volume_geral", volume_geral)
	config.set_value("video", "tela_cheia", tela_cheia)
	config.save(CAMINHO_CONFIG)


## Aplica as configurações atuais ao sistema (áudio e janela).
func aplicar_configuracoes() -> void:
	var barramento := AudioServer.get_bus_index("Master")
	AudioServer.set_bus_volume_db(barramento, linear_to_db(volume_geral))
	var modo := DisplayServer.WINDOW_MODE_FULLSCREEN if tela_cheia else DisplayServer.WINDOW_MODE_WINDOWED
	DisplayServer.window_set_mode(modo)


## Ajusta a sensibilidade e persiste (chamado pelo painel de opções).
func definir_sensibilidade(valor: float) -> void:
	sensibilidade_mouse = valor
	salvar_configuracoes()


## Ajusta o volume geral, aplica e persiste.
func definir_volume(valor: float) -> void:
	volume_geral = valor
	aplicar_configuracoes()
	salvar_configuracoes()


## Ajusta o modo de tela, aplica e persiste.
func definir_tela_cheia(ativo: bool) -> void:
	tela_cheia = ativo
	aplicar_configuracoes()
	salvar_configuracoes()
