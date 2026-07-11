extends Node
## SceneManager — centraliza as transições entre cenas (TDD §7).
##
## Toda navegação entre telas passa por aqui, evitando que menus e sistemas
## troquem de cena por conta própria.

## Emitido após uma troca de cena bem-sucedida.
signal cena_trocada(caminho: String)

const CENA_MENU := "res://cenas/menus/menu_inicial.tscn"
const CENA_EXPLORACAO := "res://cenas/principal/principal.tscn"
const CENA_CREDITOS := "res://cenas/menus/creditos.tscn"


func trocar_cena(caminho: String) -> void:
	# Ao trocar de cena, garantimos que a árvore não fique pausada.
	get_tree().paused = false
	get_tree().change_scene_to_file(caminho)
	cena_trocada.emit(caminho)
