extends Interagivel
class_name AtalhoSebe
## Sebe rala de um atalho oculto (spec §6.3). Parece uma sebe densa, mas ao
## interagir (E) a ≤ alcance revela TODA a brecha: desliga a colisão e some com
## as sebes ralas irmãs, abrindo um caminho mais curto. Ganho médio 25–45 m.
##
## `descoberta` guarda o método previsto na spec (visual / interact / item:xxx);
## no graybox toda revelação é por interação — o gate por item entra na Fase 6.

@export var descoberta: String = "visual"
var _revelado := false


## Revela a brecha inteira: todas as sebes ralas irmãs sob o mesmo atalho.
func _ao_interagir(_jogador: Node) -> void:
	for irmao in get_parent().get_children():
		if irmao is AtalhoSebe:
			(irmao as AtalhoSebe).revelar()


func revelar() -> void:
	if _revelado:
		return
	_revelado = true
	visible = false
	for c in get_children():
		if c is CollisionShape3D:
			(c as CollisionShape3D).disabled = true
