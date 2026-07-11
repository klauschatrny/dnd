extends Control
## Tela de créditos (fundação — provisório até o PAD).

func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	$Fundo/Centro/Coluna/Voltar.pressed.connect(GerenciadorJogo.ir_para_menu)
