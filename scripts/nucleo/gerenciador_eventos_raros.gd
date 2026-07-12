extends Node
## GerenciadorEventosRaros (autoload) — dispara os "eventos raros" do jardim
## (Especificação de Mapa §10 / GDD: eventos raros de percepção).
##
## Lê os 13 eventos e as regras de `labirinto_map.json`. A cada quadro testa a
## posição do jogador contra as caixas de gatilho; ao ENTRAR num gatilho, tenta
## disparar respeitando: chance base (12%), cooldown global (180 s) e por evento
## (600 s), incremento de tensão e — para eventos `hidden` — a exigência de o
## alvo estar FORA do campo de visão (o susto só acontece quando você não olha).
##
## Efeitos geométricos (estátua vira, porta entreabre, portão range, cadeira se
## move, relógio muda, névoa rola, vela acende, corvos) já são concretos no
## graybox. Efeitos que dependem de áudio/shader/partículas (ondas, pétalas,
## vidros, pingos, sussurros) ficam registrados (tensão/cooldown) e marcados
## para a Fase 7 (arte/áudio).

const CAMINHO_JSON := "res://recursos/labirinto/labirinto_map.json"

## Nível de tensão acumulado (dirigirá trilha/AI director no futuro — GDD).
var tensao: int = 0
## Emite ao disparar um evento (para futura trilha/HUD invisível/telemetria).
signal evento_disparado(id: String, tensao: int)

var _chance_base := 0.12
var _cooldown_global := 180.0
var _cooldown_evento := 600.0
var _incremento_tensao := 1

var _eventos: Array = []
var _dentro: Dictionary = {}          # id -> estava dentro do gatilho no quadro anterior
var _ultimo_evento: Dictionary = {}   # id -> tempo (s) do último disparo
var _ultimo_global := -100000.0
var _preparado := false
var _rng := RandomNumberGenerator.new()

var _jogador: Node3D = null
var _camera: Camera3D = null
var _cues: Dictionary = {}  # nome -> AudioStreamWAV


func _ready() -> void:
	_rng.randomize()
	var dados := _carregar_json()
	_eventos = dados.get("rare_events", [])
	var regras: Dictionary = dados.get("rare_event_rules", {})
	_chance_base = float(regras.get("base_chance_on_enter", 0.12))
	_cooldown_global = float(regras.get("global_cooldown_s", 180))
	_cooldown_evento = float(regras.get("per_event_cooldown_s", 600))
	_incremento_tensao = int(regras.get("tension_increment", 1))
	for e_v in _eventos:
		var e: Dictionary = e_v
		_dentro[e["id"]] = false
		_ultimo_evento[e["id"]] = -100000.0
	# Gera os cues sonoros procedurais uma única vez.
	_cues = {
		"badalada": SonsEventos.badalada(),
		"rangido": SonsEventos.rangido(),
		"pingo": SonsEventos.pingo(),
		"sussurro": SonsEventos.sussurro(),
		"vidro": SonsEventos.vidro(),
		"asas": SonsEventos.asas(),
		"agua": SonsEventos.agua(),
	}


func _carregar_json() -> Dictionary:
	var f := FileAccess.open(CAMINHO_JSON, FileAccess.READ)
	if f == null:
		return {}
	var texto := f.get_as_text()
	f.close()
	var r: Variant = JSON.parse_string(texto)
	return r if typeof(r) == TYPE_DICTIONARY else {}


func _process(_delta: float) -> void:
	if get_tree().paused or _eventos.is_empty():
		return
	# Só opera durante a gameplay (quando existe um jogador na cena).
	if not is_instance_valid(_jogador):
		_jogador = get_tree().get_first_node_in_group("jogador") as Node3D
		_camera = _jogador.get_node_or_null("Camera3D") if _jogador else null
		_preparado = false
		if _jogador == null:
			return

	var pos := _jogador.global_position
	# Prime: registra o estado inicial sem disparar (evita susto no spawn).
	if not _preparado:
		for e_v in _eventos:
			var e: Dictionary = e_v
			_dentro[e["id"]] = _esta_ativo(e, pos)
		_preparado = true
		return

	var agora := Time.get_ticks_msec() / 1000.0
	for e_v in _eventos:
		var e: Dictionary = e_v
		var id: String = e["id"]
		var ativo := _esta_ativo(e, pos)
		if ativo and not _dentro[id]:
			_tentar_disparar(e, agora)
		_dentro[id] = ativo


## Verdadeiro se o jogador está dentro do gatilho do evento (caixa) ou, para o
## evento de linha de visão (RE_11), se o alvo está fora do campo de visão.
func _esta_ativo(e: Dictionary, pos: Vector3) -> bool:
	var t: Dictionary = e.get("trigger", {})
	if t.has("center"):
		var c: Array = t["center"]
		var s: Array = t["size"]
		return absf(pos.x - float(c[0])) <= float(s[0]) * 0.5 \
			and absf(pos.y - float(c[1])) <= float(s[1]) * 0.5 \
			and absf(pos.z - float(c[2])) <= float(s[2]) * 0.5
	if t.get("type", "") == "line_of_sight":
		# Ativo quando a Torre está fora do campo de visão (evento oculto).
		return not _no_frustum(Vector3(114.0, 20.0, 6.0))
	return false


func _tentar_disparar(e: Dictionary, agora: float) -> void:
	var id: String = e["id"]
	if agora - _ultimo_global < _cooldown_global:
		return
	if agora - float(_ultimo_evento[id]) < _cooldown_evento:
		return
	# Eventos "hidden" só disparam com o alvo fora do campo de visão.
	if e.get("visibility", "visible") == "hidden" and _no_frustum(_alvo(e)):
		return
	if _rng.randf() >= _chance_base:
		return
	_executar(e)
	_ultimo_global = agora
	_ultimo_evento[id] = agora
	tensao += _incremento_tensao
	evento_disparado.emit(id, tensao)
	print("[EventoRaro] %s — %s (tensão=%d)" % [id, e.get("name", ""), tensao])


## Centro do alvo do evento (para o teste de frustum dos eventos ocultos).
func _alvo(e: Dictionary) -> Vector3:
	var t: Dictionary = e.get("trigger", {})
	if t.has("center"):
		var c: Array = t["center"]
		return Vector3(float(c[0]), float(c[1]), float(c[2]))
	return Vector3(114.0, 20.0, 6.0)  # Torre


func _no_frustum(p: Vector3) -> bool:
	return _camera != null and _camera.is_position_in_frustum(p)


func _nos(grupo: String) -> Array:
	return get_tree().get_nodes_in_group(grupo)


# ---------------------------------------------------------------------------
# Efeitos
# ---------------------------------------------------------------------------

func _executar(e: Dictionary) -> void:
	var centro := _alvo(e)
	match e["id"]:
		"RE_01": _ef_nevoa()
		"RE_02": _ef_estatua_vira()
		"RE_03": _tocar("agua", centro)
		"RE_05":
			_ef_corvos(e)
			_tocar("asas", centro)
		"RE_06": _ef_cadeira()
		"RE_07": _tocar("vidro", centro)
		"RE_08": _ef_vela()
		"RE_09": _tocar("pingo", centro)
		"RE_10": _ef_porta_mausoleu()
		"RE_11":
			_ef_relogio()
			_tocar("badalada", Vector3(114.0, 20.0, 8.0))
		"RE_12": _tocar("sussurro", centro, -3.0)
		"RE_13":
			_ef_portao_range()
			_tocar("rangido", centro)
		_:
			# RE_04 pétalas murcham — efeito visual (partículas) fica p/ a Fase 7.
			pass


## Reproduz um cue posicional no barramento Ambiente; libera ao terminar.
func _tocar(nome: String, pos: Vector3, volume_db: float = 0.0) -> void:
	if not _cues.has(nome) or get_tree().current_scene == null:
		return
	var som := AudioStreamPlayer3D.new()
	som.stream = _cues[nome]
	som.bus = &"Ambiente"
	som.unit_size = 6.0
	som.max_distance = 60.0
	som.volume_db = volume_db
	som.position = pos
	get_tree().current_scene.add_child(som)
	som.finished.connect(som.queue_free)
	som.play()


## RE_01 — a névoa adensa por alguns segundos e volta.
func _ef_nevoa() -> void:
	var ambs := _nos("ambiente_mundo")
	if ambs.is_empty():
		return
	var env: Environment = (ambs[0] as WorldEnvironment).environment
	if env == null:
		return
	var original := env.fog_density
	var t := create_tween()
	t.tween_property(env, "fog_density", 0.022, 3.0)
	t.tween_property(env, "fog_density", original, 4.0)


## RE_02 — uma das quatro estátuas da Praça gira ±90° (só quando não olhada).
func _ef_estatua_vira() -> void:
	var ests := _nos("ev_estatua_praca")
	if ests.is_empty():
		return
	var s := ests[_rng.randi() % ests.size()] as Node3D
	var sinal := 1.0 if _rng.randf() < 0.5 else -1.0
	s.rotate_y(deg_to_rad(90.0) * sinal)


## RE_05 — alguns "corvos" (caixas escuras) levantam voo do Bosque.
func _ef_corvos(e: Dictionary) -> void:
	var c: Array = e["trigger"]["center"]
	var centro := Vector3(float(c[0]), 5.0, float(c[2]))
	for i in 6:
		var corvo := MeshInstance3D.new()
		var m := BoxMesh.new()
		m.size = Vector3(0.45, 0.2, 0.3)
		corvo.mesh = m
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color(0.06, 0.06, 0.07)
		corvo.material_override = mat
		corvo.position = centro + Vector3(_rng.randf_range(-10, 10), _rng.randf_range(0, 3), _rng.randf_range(-12, 12))
		get_tree().current_scene.add_child(corvo)
		var t := create_tween()
		t.tween_property(corvo, "position", corvo.position + Vector3(_rng.randf_range(-6, 6), 12.0, _rng.randf_range(-6, 6)), 4.0)
		t.tween_callback(corvo.queue_free)


## RE_06 — a cadeira de vime do Gazebo se desloca e gira (oculto).
func _ef_cadeira() -> void:
	var cs := _nos("ev_cadeira_gazebo")
	if cs.is_empty():
		return
	var ch := cs[0] as Node3D
	ch.position += Vector3(0.85, 0.0, 0.85)
	ch.rotate_y(deg_to_rad(35.0))


## RE_08 — uma vela acende no Claustro (luz quente fraca).
func _ef_vela() -> void:
	var luz := OmniLight3D.new()
	luz.light_energy = 0.6
	luz.omni_range = 4.0
	luz.light_color = Color(1.0, 0.82, 0.5)
	luz.position = Vector3(40.0, 1.4, 90.5)  # nicho junto à parede norte do Claustro
	get_tree().current_scene.add_child(luz)


## RE_10 — a porta de bronze do Mausoléu se entreabre 15° (oculto).
func _ef_porta_mausoleu() -> void:
	var ds := _nos("ev_porta_mausoleu")
	if ds.is_empty():
		return
	var t := create_tween()
	t.tween_property(ds[0], "rotation:y", deg_to_rad(15.0), 1.2)


## RE_11 — os ponteiros da Torre pulam para 03:33.
func _ef_relogio() -> void:
	for h_v in _nos("ev_ponteiros_torre"):
		var h := h_v as Node3D
		if h.name == "PonteiroHora":
			h.rotation.z = deg_to_rad(-106.5)  # 3h33 ≈ 106,5° do topo
		else:
			h.rotation.z = deg_to_rad(-198.0)  # 33 min = 198° do topo


## RE_13 — as folhas do Portão Final oscilam ±4° (rangido).
func _ef_portao_range() -> void:
	for g_v in _nos("ev_portao_saida"):
		var g := g_v as Node3D
		var t := create_tween()
		t.tween_property(g, "rotation:y", deg_to_rad(4.0), 0.5)
		t.tween_property(g, "rotation:y", deg_to_rad(-4.0), 1.0)
		t.tween_property(g, "rotation:y", 0.0, 0.5)
