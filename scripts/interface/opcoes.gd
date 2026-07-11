extends Control
## Painel de opções reutilizável (fundação — provisório até o PAD).
##
## Usado tanto pelo menu inicial quanto pelo menu de pausa. Não conhece quem o
## abriu: ao terminar, apenas emite `fechado` e deixa o chamador decidir o que
## fazer. Todas as mudanças vão direto ao GerenciadorJogo, que aplica e persiste.

## Emitido quando o jogador pede para voltar.
signal fechado

@onready var _sensibilidade: HSlider = $Fundo/Centro/Coluna/Sensibilidade/Controle
@onready var _volume: HSlider = $Fundo/Centro/Coluna/Volume/Controle
@onready var _tela_cheia: CheckButton = $Fundo/Centro/Coluna/TelaCheia
@onready var _voltar: Button = $Fundo/Centro/Coluna/Voltar


func _ready() -> void:
	# Refletir o estado atual das configurações.
	_sensibilidade.value = GerenciadorJogo.sensibilidade_mouse
	_volume.value = GerenciadorJogo.volume_geral
	_tela_cheia.button_pressed = GerenciadorJogo.tela_cheia

	_sensibilidade.value_changed.connect(_ao_mudar_sensibilidade)
	_volume.value_changed.connect(_ao_mudar_volume)
	_tela_cheia.toggled.connect(GerenciadorJogo.definir_tela_cheia)
	_voltar.pressed.connect(_ao_voltar)


func _ao_mudar_sensibilidade(valor: float) -> void:
	GerenciadorJogo.definir_sensibilidade(valor)


func _ao_mudar_volume(valor: float) -> void:
	GerenciadorJogo.definir_volume(valor)


func _ao_voltar() -> void:
	fechado.emit()
