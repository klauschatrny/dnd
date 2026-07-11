extends Node
## SaveManager — persistência do progresso da partida (TDD §8).
##
## Regra do TDD: o mapa original nunca é salvo; guardam-se apenas os estados
## modificados (portas abertas, puzzles resolvidos, eventos concluídos, posição
## do jogador). Toda persistência passa por este manager.
##
## Esqueleto: a implementação real pertence à Fase 5 (Sistemas Base). Este
## arquivo fixa a responsabilidade única e o ponto de integração; ainda sem
## lógica de gravação/carregamento.

const CAMINHO_SAVE := "user://progresso.save"


func existe_save() -> bool:
	return FileAccess.file_exists(CAMINHO_SAVE)


func salvar() -> void:
	pass  # Fase 5 — Sistemas Base.


func carregar() -> void:
	pass  # Fase 5 — Sistemas Base.
