extends Node
## AudioManager — controla os volumes e sons globais do jogo (TDD §7).
##
## Ponto único de controle de áudio. Por enquanto expõe o volume geral
## (barramento Master); volumes por categoria e transições de música entram nas
## fases seguintes. Nenhum objeto deve mexer no AudioServer diretamente.

const BARRAMENTO_MASTER := "Master"


func definir_volume_geral(volume: float) -> void:
	var indice := AudioServer.get_bus_index(BARRAMENTO_MASTER)
	AudioServer.set_bus_volume_db(indice, linear_to_db(clampf(volume, 0.0, 1.0)))
