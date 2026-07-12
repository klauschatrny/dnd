extends Node
## SaveManager — persistência do progresso da partida (TDD §8).
##
## Regra do TDD: o mapa original nunca é salvo; guardam-se apenas os estados
## MODIFICADOS mais a posição do jogador. No MVP isso é: onde o jogador está
## (posição + orientação), quais atalhos ele já revelou (mudança que ele fez no
## mundo) e o nível de tensão acumulado. Toda persistência passa por aqui.
##
## Formato: JSON em `user://progresso.save`. O carregamento é adiado: o menu
## "Continuar" lê o arquivo e entra na exploração; a aplicação acontece quando o
## mundo fica pronto (o CarregadorMapa chama `aplicar_pendente`).

const CAMINHO_SAVE := "user://progresso.save"
const VERSAO := 1

# Dados lidos do arquivo, aguardando o mundo ficar pronto para serem aplicados.
var _pendente: Dictionary = {}


func existe_save() -> bool:
	return FileAccess.file_exists(CAMINHO_SAVE)


func apagar_save() -> void:
	if existe_save():
		DirAccess.remove_absolute(CAMINHO_SAVE)


# ---------------------------------------------------------------------------
# Gravação
# ---------------------------------------------------------------------------

## Grava o estado atual da partida. Silencioso se não houver jogador na cena
## (ex.: chamado a partir de um menu).
func salvar() -> void:
	var jogador := get_tree().get_first_node_in_group("jogador") as Node3D
	if jogador == null:
		return
	var cam := jogador.get_node_or_null("Camera3D") as Camera3D
	var pos := jogador.global_position
	var dados := {
		"versao": VERSAO,
		"jogador": {
			"pos": [pos.x, pos.y, pos.z],
			"yaw": jogador.rotation.y,
			"pitch": cam.rotation.x if cam else 0.0,
		},
		"atalhos_revelados": _atalhos_revelados(),
		"tensao": GerenciadorEventosRaros.tensao,
	}
	var f := FileAccess.open(CAMINHO_SAVE, FileAccess.WRITE)
	if f == null:
		push_error("SaveManager: não foi possível gravar %s" % CAMINHO_SAVE)
		return
	f.store_string(JSON.stringify(dados, "\t"))
	f.close()


# ---------------------------------------------------------------------------
# Carregamento
# ---------------------------------------------------------------------------

## Chamado pelo menu "Continuar": lê o arquivo e entra na exploração. A aplicação
## do estado é adiada até o mundo ficar pronto (ver `aplicar_pendente`).
func carregar_partida() -> void:
	_pendente = _ler_arquivo()
	GerenciadorJogo.iniciar_exploracao()


## Chamado pelo CarregadorMapa ao terminar de montar o mundo. Aplica o estado
## pendente (se houver) — jogador, atalhos revelados e tensão.
func aplicar_pendente() -> void:
	if _pendente.is_empty():
		return
	var dados := _pendente
	_pendente = {}
	_aplicar(dados)


func _aplicar(dados: Dictionary) -> void:
	var jogador := get_tree().get_first_node_in_group("jogador") as Node3D
	if jogador:
		var j: Dictionary = dados.get("jogador", {})
		var p: Array = j.get("pos", [28.0, 0.1, 186.5])
		jogador.global_position = Vector3(float(p[0]), float(p[1]), float(p[2]))
		jogador.rotation.y = float(j.get("yaw", 0.0))
		var cam := jogador.get_node_or_null("Camera3D") as Camera3D
		if cam:
			cam.rotation.x = float(j.get("pitch", 0.0))
	var revelados: Array = dados.get("atalhos_revelados", [])
	var atalhos := _no_atalhos()
	if atalhos:
		for grupo in atalhos.get_children():
			if String(grupo.name) in revelados:
				for b in grupo.get_children():
					if b is AtalhoSebe:
						(b as AtalhoSebe).revelar()
	GerenciadorEventosRaros.tensao = int(dados.get("tensao", 0))


# ---------------------------------------------------------------------------
# Auxiliares
# ---------------------------------------------------------------------------

## Lista de ids (AT-01…) dos atalhos já revelados na cena atual.
func _atalhos_revelados() -> Array:
	var resultado: Array = []
	var atalhos := _no_atalhos()
	if atalhos == null:
		return resultado
	for grupo in atalhos.get_children():
		for b in grupo.get_children():
			if b is AtalhoSebe and (b as AtalhoSebe).esta_revelado():
				resultado.append(String(grupo.name))
				break
	return resultado


## Nó "Atalhos" do mundo na cena de exploração (ou null fora dela).
func _no_atalhos() -> Node:
	var cena := get_tree().current_scene
	return cena.find_child("Atalhos", true, false) if cena else null


func _ler_arquivo() -> Dictionary:
	if not existe_save():
		return {}
	var f := FileAccess.open(CAMINHO_SAVE, FileAccess.READ)
	if f == null:
		return {}
	var texto := f.get_as_text()
	f.close()
	var r: Variant = JSON.parse_string(texto)
	return r if typeof(r) == TYPE_DICTIONARY else {}
