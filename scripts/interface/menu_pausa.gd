extends CanvasLayer
## Menu de pausa (fundação — provisório até o PAD).
##
## Vive dentro da cena de exploração e reage ao GerenciadorJogo por sinal, sem
## controlar a pausa em si — quem pausa/despausa é o núcleo. Aqui só mostramos as
## opções de pausa e o painel de configurações.

@onready var _painel: Control = $Painel
@onready var _opcoes: Control = $Opcoes


func _ready() -> void:
	visible = false
	_opcoes.visible = false
	GerenciadorJogo.pausa_alternada.connect(_ao_alternar_pausa)
	_opcoes.fechado.connect(_fechar_opcoes)

	$Painel/Centro/Coluna/Continuar.pressed.connect(GerenciadorJogo.alternar_pausa)
	$Painel/Centro/Coluna/Opcoes.pressed.connect(_abrir_opcoes)
	$Painel/Centro/Coluna/SairMenu.pressed.connect(GerenciadorJogo.ir_para_menu)


func _ao_alternar_pausa(pausado: bool) -> void:
	visible = pausado
	if pausado:
		# Ao (re)abrir, sempre voltamos à lista de botões.
		_painel.visible = true
		_opcoes.visible = false


func _abrir_opcoes() -> void:
	_painel.visible = false
	_opcoes.visible = true


func _fechar_opcoes() -> void:
	_opcoes.visible = false
	_painel.visible = true
