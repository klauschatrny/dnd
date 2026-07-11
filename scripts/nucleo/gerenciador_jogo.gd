extends Node
## GameManager — estado geral do jogo e controle de pausa (TDD §7).
##
## Responsabilidade única: manter o estado de alto nível (menu / exploração /
## pausa) e orquestrar o fluxo entre eles. Não troca cenas, não mexe em áudio e
## não guarda configurações — delega isso aos demais managers.

## Emitido ao alternar a pausa durante a exploração. A interface de pausa escuta
## este sinal, sem referência direta ao manager.
signal pausa_alternada(pausado: bool)

enum Estado { MENU, EXPLORANDO, PAUSADO }

var estado: Estado = Estado.MENU


func _ready() -> void:
	# Precisa processar input mesmo com a árvore pausada, para despausar.
	process_mode = Node.PROCESS_MODE_ALWAYS


func _unhandled_input(event: InputEvent) -> void:
	# Pausar só faz sentido durante a exploração (não nos menus).
	if event.is_action_pressed("pausar") and estado != Estado.MENU:
		alternar_pausa()


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


func iniciar_exploracao() -> void:
	estado = Estado.EXPLORANDO
	GerenciadorCenas.trocar_cena(GerenciadorCenas.CENA_EXPLORACAO)
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func ir_para_menu() -> void:
	estado = Estado.MENU
	GerenciadorCenas.trocar_cena(GerenciadorCenas.CENA_MENU)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


func sair_do_jogo() -> void:
	get_tree().quit()
