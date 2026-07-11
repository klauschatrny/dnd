extends Node3D
class_name CarregadorLabirinto
## Constrói a geometria de sebes de uma região a partir de um mapa em texto
## (grid autorado — TDD §5). Cada '#' vira um bloco de sebe numa célula; qualquer
## outro caractere ('.', espaço) é chão livre.
##
## Graybox (Fase 4): blocos cheios em ângulos retos, sem arte final. Curvas,
## alturas orgânicas e irregularidades das sebes pertencem à fase de arte (§7).
## A altura por região é o que dá identidade agora (baixa na entrada, alta no
## hedge maze).

const MODULO_SEBE := preload("res://cenas/mundo/modulos/sebe_bloco.tscn")

## Lado de cada célula do grid, em metros. Também é a largura mínima de corredor.
@export var tamanho_celula: float = 2.0
## Altura das sebes desta região.
@export var altura_sebe: float = 2.0
## Mapa da região. Cada linha é uma fileira (cresce em +Z); cada coluna, em +X.
@export_multiline var mapa: String = ""


func _ready() -> void:
	construir()


func construir() -> void:
	var fileiras := mapa.split("\n", false)
	for fileira in fileiras.size():
		var linha: String = fileiras[fileira]
		for coluna in linha.length():
			if linha[coluna] == "#":
				_colocar_sebe(coluna, fileira)


func _colocar_sebe(coluna: int, fileira: int) -> void:
	var bloco: Node3D = MODULO_SEBE.instantiate()
	bloco.scale = Vector3(tamanho_celula, altura_sebe, tamanho_celula)
	bloco.position = Vector3(
		(coluna + 0.5) * tamanho_celula,
		altura_sebe * 0.5,
		(fileira + 0.5) * tamanho_celula
	)
	add_child(bloco)
