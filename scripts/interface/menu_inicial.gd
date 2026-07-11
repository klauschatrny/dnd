extends Control
## Menu inicial de The Labyrinth (fundação — provisório até o PAD).
##
## Porta de entrada do jogo. Atmosfera melancólica e discreta, coerente com o
## GDD: nada de brilho ou ruído visual. As opções abrem sobre o menu, sem trocar
## de cena; a navegação entre telas passa pelo GerenciadorCenas.

@onready var _menu: CenterContainer = $Centro
@onready var _opcoes: Control = $Opcoes


func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_opcoes.visible = false
	_opcoes.fechado.connect(_fechar_opcoes)

	$Centro/Coluna/Explorar.pressed.connect(GerenciadorJogo.iniciar_exploracao)
	$Centro/Coluna/Opcoes.pressed.connect(_abrir_opcoes)
	$Centro/Coluna/Creditos.pressed.connect(_abrir_creditos)
	$Centro/Coluna/Sair.pressed.connect(GerenciadorJogo.sair_do_jogo)


func _abrir_opcoes() -> void:
	_menu.visible = false
	_opcoes.visible = true


func _fechar_opcoes() -> void:
	_opcoes.visible = false
	_menu.visible = true


func _abrir_creditos() -> void:
	GerenciadorCenas.trocar_cena(GerenciadorCenas.CENA_CREDITOS)
