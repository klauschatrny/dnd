extends Node
## Núcleo do jogo (fundação — arquitetura provisória até a chegada do PAD).
##
## Mantém o estado global de alto nível e centraliza o controle de pausa.
## Registrado como singleton (autoload) em project.godot.

enum Estado { MENU, EXPLORANDO, PAUSADO }

var estado: Estado = Estado.EXPLORANDO


func _ready() -> void:
	# O núcleo precisa continuar processando input mesmo com a árvore pausada,
	# para conseguir despausar o jogo.
	process_mode = Node.PROCESS_MODE_ALWAYS


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pausar"):
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
