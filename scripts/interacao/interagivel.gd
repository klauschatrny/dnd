extends StaticBody3D
class_name Interagivel
## Base para todo objeto interativo do labirinto (fundação).
##
## O jogador aponta e chama `interagir()`. Cada objeto concreto sobrescreve
## `_ao_interagir()` para definir seu comportamento. Nenhuma lógica de caso
## específico deve viver aqui — apenas o padrão de interação.

## Emitido sempre que o jogador interage com este objeto.
signal interagido(jogador: Node)


## Chamado pelo jogador via raycast. Não sobrescrever; sobrescreva `_ao_interagir`.
func interagir(jogador: Node) -> void:
	_ao_interagir(jogador)
	interagido.emit(jogador)


## Ponto de extensão. Comportamento específico do objeto entra aqui.
func _ao_interagir(_jogador: Node) -> void:
	pass
