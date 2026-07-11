extends Node3D
class_name CarregadorMapa
## Constrói o mundo do labirinto em runtime a partir de `labirinto_map.json`
## (Especificação Técnica de Mapa). Substitui o antigo método de regiões ASCII:
## agora há UMA fonte da verdade (o JSON) e o mundo inteiro é montado sobre a
## grade de 240×192 m definida na spec.
##
## Graybox (Fase 4): geometria simples (caixas/CSG) nas coordenadas corretas.
## Curvas, alturas orgânicas e arte final pertencem à Fase 7.
##
## Ordem de montagem (métodos): terreno → muro perimetral → landmarks →
## grafo de caminhos → preenchimento do labirinto. Cada bloco pode ser ligado/
## desligado pelos flags exportados enquanto o graybox é construído por etapas.

const CAMINHO_JSON := "res://recursos/labirinto/labirinto_map.json"

@export_group("Etapas de montagem")
@export var montar_terreno_flag: bool = true
@export var montar_muro_flag: bool = true
@export var montar_landmarks_flag: bool = true
@export var montar_caminhos_flag: bool = true
@export var montar_labirinto_flag: bool = true

@export_group("Materiais")
@export var material_chao: Material
@export var material_pedra: Material
@export var material_sebe: Material
@export var material_pavimento: Material

# Dados do JSON, carregados em _ready.
var dados: Dictionary = {}


func _ready() -> void:
	dados = _carregar_json()
	if dados.is_empty():
		push_error("CarregadorMapa: falha ao carregar %s" % CAMINHO_JSON)
		return
	if montar_terreno_flag:
		_montar_terreno()
	if montar_muro_flag:
		_montar_muro_perimetral()
	if montar_landmarks_flag:
		_montar_landmarks()
	if montar_caminhos_flag:
		_montar_caminhos()
	if montar_labirinto_flag:
		_montar_labirinto()


func _carregar_json() -> Dictionary:
	var f := FileAccess.open(CAMINHO_JSON, FileAccess.READ)
	if f == null:
		return {}
	var texto := f.get_as_text()
	f.close()
	var resultado: Variant = JSON.parse_string(texto)
	if typeof(resultado) != TYPE_DICTIONARY:
		return {}
	return resultado


# ---------------------------------------------------------------------------
# Terreno
# ---------------------------------------------------------------------------

## Chão plano de 240×192 m, com a face superior em Y = 0. Origem no canto NO.
func _montar_terreno() -> void:
	var raiz := StaticBody3D.new()
	raiz.name = "Terreno"
	add_child(raiz)

	var espessura := 2.0
	var centro := Vector3(UtilidadesGrade.LARGURA_M * 0.5, -espessura * 0.5, UtilidadesGrade.ALTURA_M * 0.5)
	var tamanho := Vector3(UtilidadesGrade.LARGURA_M, espessura, UtilidadesGrade.ALTURA_M)

	var malha := MeshInstance3D.new()
	var caixa := BoxMesh.new()
	caixa.size = tamanho
	malha.mesh = caixa
	malha.position = centro
	if material_chao:
		malha.material_override = material_chao
	raiz.add_child(malha)

	var colisor := CollisionShape3D.new()
	var forma := BoxShape3D.new()
	forma.size = tamanho
	colisor.shape = forma
	colisor.position = centro
	raiz.add_child(colisor)


# ---------------------------------------------------------------------------
# Muro perimetral (4,5 m) — spec §2. Anel externo de 2 células (4 m) de espessura.
# Aberturas: Entrada (X=28, vão 4 m) e Saída (X=114, vão 6 m) no muro sul.
# ---------------------------------------------------------------------------

func _montar_muro_perimetral() -> void:
	var raiz := Node3D.new()
	raiz.name = "MuroPerimetral"
	add_child(raiz)

	var altura: float = float(dados.get("heights", {}).get("perimeter_wall", 4.5))
	var esp := 4.0  # 2 células
	var l := UtilidadesGrade.LARGURA_M
	var a := UtilidadesGrade.ALTURA_M

	# Muro norte (Z 0..4), largura total. A Torre do Relógio fica embutida sobre ele.
	_muro_segmento(raiz, "Norte", Vector2(0.0, 0.0), Vector2(l, esp), altura)
	# Muro oeste (X 0..4), entre norte e sul.
	_muro_segmento(raiz, "Oeste", Vector2(0.0, esp), Vector2(esp, a - esp * 2.0), altura)
	# Muro leste (X 236..240).
	_muro_segmento(raiz, "Leste", Vector2(l - esp, esp), Vector2(esp, a - esp * 2.0), altura)
	# Muro sul (Z 188..192) com aberturas da Entrada (26..30) e Saída (111..117).
	var z_sul := a - esp
	_muro_segmento(raiz, "SulA", Vector2(0.0, z_sul), Vector2(26.0, esp), altura)
	_muro_segmento(raiz, "SulB", Vector2(30.0, z_sul), Vector2(81.0, esp), altura)
	_muro_segmento(raiz, "SulC", Vector2(117.0, z_sul), Vector2(l - 117.0, esp), altura)


## Cria um segmento de muro (caixa colidível). `canto` = canto NO em metros (x, z);
## `tamanho_xz` = dimensões no plano XZ (x, z).
func _muro_segmento(pai: Node3D, nome: String, canto: Vector2, tamanho_xz: Vector2, altura: float) -> void:
	var sx: float = tamanho_xz.x
	var sz: float = tamanho_xz.y
	var cx: float = canto.x + sx * 0.5
	var cz: float = canto.y + sz * 0.5
	_caixa_solida(pai, nome, Vector3(sx, altura, sz), Vector3(cx, altura * 0.5, cz), material_pedra)


# ---------------------------------------------------------------------------
# Métodos das próximas etapas (preenchidos incrementalmente)
# ---------------------------------------------------------------------------

func _montar_landmarks() -> void:
	var raiz := Node3D.new()
	raiz.name = "Landmarks"
	add_child(raiz)
	for lm_v in dados.get("landmarks", []):
		var lm: Dictionary = lm_v
		var cont := Node3D.new()
		cont.name = lm.get("id", "LM")
		raiz.add_child(cont)
		match lm.get("id", ""):
			"LM_01": _lm_entrada(cont, lm)
			"LM_02": _lm_praca(cont, lm)
			"LM_03": _lm_lago(cont, lm)
			"LM_04": _lm_rosas(cont, lm)
			"LM_05": _lm_bosque(cont, lm)
			"LM_06": _lm_gazebo(cont, lm)
			"LM_07": _lm_estufa(cont, lm)
			"LM_08": _lm_claustro(cont, lm)
			"LM_09": _lm_fonte(cont, lm)
			"LM_10": _lm_mausoleu(cont, lm)
			"LM_11": _lm_torre(cont, lm)
			"LM_12": _lm_sombras(cont, lm)
			"LM_13": _lm_saida(cont, lm)
			"LM_A": _lm_ciprestes(cont, lm)
			_: _colocar_elementos(cont, lm)


func _centro2d(lm: Dictionary) -> Vector2:
	var c: Array = lm["center"]
	return Vector2(float(c[0]), float(c[2]))


# 01 · Entrada (Portão) --------------------------------------------------------
func _lm_entrada(cont: Node3D, lm: Dictionary) -> void:
	var c := _centro2d(lm)
	_piso_ret(cont, "Atrio", Vector2(12.0, 10.0), c + Vector2(0.0, -4.0), material_pavimento)
	_colocar_elementos(cont, lm)  # pilares, lintel, portão, lanternas, placa


# 02 · Praça das Quatro Estátuas ----------------------------------------------
func _lm_praca(cont: Node3D, lm: Dictionary) -> void:
	var c := _centro2d(lm)
	_piso_circ(cont, "Piso", float(lm.get("radius_pavement", 14.0)), c, material_pavimento)
	_anel_sebe(cont, c, float(lm.get("radius_hedge_outer", 16.0)) - 1.0, float(lm.get("max_height", 3.6)), lm.get("openings", []))
	# Relógio de sol central (base + gnômon).
	_cilindro_solido(cont, "RelogioSol", 1.2, 0.4, Vector3(c.x, 0.0, c.y), material_pedra)
	_cilindro_solido(cont, "Gnomon", 0.08, 1.6, Vector3(c.x, 0.4, c.y), material_pedra)
	_colocar_elementos(cont, lm)  # pedestais, estátuas, bancos, lampiões


# 03 · Lago Seco ---------------------------------------------------------------
func _lm_lago(cont: Node3D, lm: Dictionary) -> void:
	var c := _centro2d(lm)
	var bal: Dictionary = lm.get("balustrade", {})
	# Balaustrada elíptica baixa (aproximada por anel de postes).
	var rx: float = float(bal.get("size_x", 32.0)) * 0.5
	var rz: float = float(bal.get("size_z", 26.0)) * 0.5
	var alt: float = float(bal.get("height", 0.9))
	var aberturas: Array = lm.get("openings", [])
	var n := 48
	for i in n:
		var ang := TAU * float(i) / float(n)
		var x := c.x + cos(ang) * rx
		var z := c.y + sin(ang) * rz
		var vao := false
		for ab_v in aberturas:
			var ab: Dictionary = ab_v
			var pos: Array = ab["pos"]
			if Vector2(float(pos[0]), float(pos[1])).distance_to(Vector2(x, z)) < 2.0:
				vao = true
				break
		if not vao:
			_caixa_solida(cont, "Bal%d" % i, Vector3(0.5, alt, 0.5), Vector3(x, alt * 0.5, z), material_pedra)
	# Ponte seca (eixo L–O).
	var b: Dictionary = lm.get("bridge", {})
	var bs: Array = b.get("size", [30.0, 0.35, 3.0])
	_caixa_solida(cont, "PonteSeca", Vector3(float(bs[0]), float(bs[1]), float(bs[2])), Vector3(c.x, 0.05, c.y), material_pedra)


# 04 · Jardim das Rosas --------------------------------------------------------
func _lm_rosas(cont: Node3D, lm: Dictionary) -> void:
	var c := _centro2d(lm)
	var fp: Array = lm.get("footprint", [32.0, 24.0])
	var w: Dictionary = lm.get("wall", {})
	var gate: Dictionary = lm.get("gate", {})
	var entradas: Array = [{ "pos": gate.get("pos", [c.x, c.y + 12.0]), "width": gate.get("width", 3.0) }]
	_perimetro_com_vaos(cont, c, Vector2(float(fp[0]), float(fp[1])), float(w.get("height", 2.5)), float(w.get("thickness", 0.4)), entradas, material_pedra)
	# Pérgola central (4 colunas + travessas).
	for dx in [-3.0, 3.0]:
		for dz in [-3.0, 3.0]:
			_cilindro_solido(cont, "PergCol", 0.1, 2.6, Vector3(c.x + dx, 0.0, c.y + dz), material_pedra)
	_colocar_elementos(cont, lm)  # canteiros, roseiras, bancos


# 05 · Bosque Morto ------------------------------------------------------------
func _lm_bosque(cont: Node3D, lm: Dictionary) -> void:
	var bb: Dictionary = lm.get("bbox_m", {})
	var xr: Array = bb.get("x", [186, 230])
	var zr: Array = bb.get("z", [14, 62])
	var rng := RandomNumberGenerator.new()
	rng.seed = 20260711
	# Espalha árvores mortas deterministicamente dentro do bbox.
	for esp_v in lm.get("scatter", []):
		var esp: Dictionary = esp_v
		var qtd: int = int(esp.get("count", 20))
		var hr: Array = esp.get("height_range", [6.0, 8.0])
		var dr: Array = esp.get("trunk_d", [0.4, 0.5])
		for i in qtd:
			var x := rng.randf_range(float(xr[0]) + 2.0, float(xr[1]) - 2.0)
			var z := rng.randf_range(float(zr[0]) + 2.0, float(zr[1]) - 2.0)
			var h := rng.randf_range(float(hr[0]), float(hr[1]))
			var d := rng.randf_range(float(dr[0]), float(dr[1]))
			_cilindro_solido(cont, esp.get("prop", "PR_TREE"), d * 0.5, h, Vector3(x, 0.0, z), material_sebe)
	_colocar_elementos(cont, lm)  # pedra tombada (central)


# 06 · Gazebo Antigo -----------------------------------------------------------
func _lm_gazebo(cont: Node3D, lm: Dictionary) -> void:
	var c := _centro2d(lm)
	_piso_circ(cont, "Clareira", float(lm.get("radius_pavement", 13.0)), c, material_pavimento)
	_anel_sebe(cont, c, float(lm.get("radius_hedge_outer", 15.0)) - 1.0, 3.0, lm.get("openings", []))
	var g: Dictionary = lm.get("gazebo", {})
	var r_deck: float = float(g.get("circumscribed_d", 8.0)) * 0.5
	_cilindro_solido(cont, "Deck", r_deck, float(g.get("deck_height", 0.45)), Vector3(c.x, 0.0, c.y), material_pedra)
	# 8 colunas em octógono + telhado cônico.
	var col_h: float = float(g.get("column_h", 3.0))
	var deck_h: float = float(g.get("deck_height", 0.45))
	for i in 8:
		var ang := TAU * float(i) / 8.0
		var x := c.x + cos(ang) * (r_deck - 0.4)
		var z := c.y + sin(ang) * (r_deck - 0.4)
		_cilindro_solido(cont, "Coluna%d" % i, 0.125, col_h, Vector3(x, deck_h, z), material_pedra)
	var roof: Dictionary = g.get("roof", {})
	_cilindro_solido(cont, "Telhado", float(roof.get("d", 9.2)) * 0.5, 0.4, Vector3(c.x, float(roof.get("base_y", 3.45)), c.y), material_pedra)
	_colocar_elementos(cont, lm)


# 07 · Estufa ------------------------------------------------------------------
func _lm_estufa(cont: Node3D, lm: Dictionary) -> void:
	var b: Dictionary = lm.get("building", {})
	var sz: Array = b.get("size", [24.0, 32.0])
	var xr: Array = b.get("x", [150, 174])
	var zr: Array = b.get("z", [94, 126])
	var cx := (float(xr[0]) + float(xr[1])) * 0.5
	var cz := (float(zr[0]) + float(zr[1])) * 0.5
	var centro := Vector2(cx, cz)
	var wall_h: float = float(b.get("wall_height", 5.0))
	var entradas: Array = []
	for d_v in lm.get("doors", []):
		var d: Dictionary = d_v
		entradas.append({ "pos": d.get("pos", []), "width": d.get("width", 2.0) })
	_perimetro_com_vaos(cont, centro, Vector2(float(sz[0]), float(sz[1])), wall_h, 0.3, entradas, material_pedra)
	# Cumeeira (linha central alta) representando o telhado de duas águas.
	_caixa_solida(cont, "Cumeeira", Vector3(1.0, float(lm.get("max_height", 9.0)) - wall_h, float(sz[1])), Vector3(cx, wall_h + (float(lm.get("max_height", 9.0)) - wall_h) * 0.5, cz), material_pedra)
	_colocar_elementos(cont, lm)


# 08 · Claustro Verde ----------------------------------------------------------
func _lm_claustro(cont: Node3D, lm: Dictionary) -> void:
	var c := _centro2d(lm)
	var fp: Array = lm.get("footprint", [30.0, 30.0])
	var arc: Dictionary = lm.get("arcade", {})
	_perimetro_com_vaos(cont, c, Vector2(float(fp[0]), float(fp[1])), float(arc.get("roof_height", 4.4)), 0.5, lm.get("entrances", []), material_pedra)
	# Garth interno (piso) + poço central.
	var garth: Dictionary = lm.get("garth", {})
	var gs: Array = garth.get("size", [20.0, 20.0])
	_piso_ret(cont, "Garth", Vector2(float(gs[0]), float(gs[1])), c, material_pavimento)
	var well: Dictionary = lm.get("well", {})
	_cilindro_solido(cont, "Poco", float(well.get("d", 1.6)) * 0.5, float(well.get("height", 0.8)), Vector3(c.x, 0.0, c.y), material_pedra)
	# Colunata: postes a cada 2,5 m ao longo do anel interno.
	var meia := float(fp[0]) * 0.5 - float(arc.get("depth", 5.0))
	for i in range(-3, 4):
		var t := float(i) * 2.5
		for par in [[c.x + t, c.y - meia], [c.x + t, c.y + meia], [c.x - meia, c.y + t], [c.x + meia, c.y + t]]:
			_cilindro_solido(cont, "ColClaustro", 0.175, float(arc.get("column_h", 2.8)), Vector3(par[0], 0.0, par[1]), material_pedra)


# 09 · Fonte Principal ---------------------------------------------------------
func _lm_fonte(cont: Node3D, lm: Dictionary) -> void:
	var c := _centro2d(lm)
	_piso_circ(cont, "Praca", float(lm.get("radius_pavement", 12.0)), c, material_pavimento)
	_anel_sebe(cont, c, float(lm.get("radius_hedge_outer", 14.0)) - 1.0, 3.0, lm.get("openings", []))
	var f: Dictionary = lm.get("fountain", {})
	# Bacia (borda anelar baixa), pedestal, taça e estátua central.
	_cilindro_solido(cont, "Bacia", float(f.get("basin_d", 7.0)) * 0.5, float(f.get("rim_height", 0.6)), Vector3(c.x, 0.0, c.y), material_pedra)
	_cilindro_solido(cont, "Pedestal", float(f.get("pedestal", [1.2, 1.2])[0]) * 0.5, 1.2, Vector3(c.x, 0.6, c.y), material_pedra)
	_cilindro_solido(cont, "Taca", float(f.get("upper_bowl_d", 2.4)) * 0.5, 0.35, Vector3(c.x, float(f.get("upper_bowl_y", 2.4)), c.y), material_pedra)
	_cilindro_solido(cont, "Estatua", 0.45, 1.8, Vector3(c.x, float(f.get("upper_bowl_y", 2.4)), c.y), material_pedra)
	_colocar_elementos(cont, lm)


# 10 · Mausoléu ----------------------------------------------------------------
func _lm_mausoleu(cont: Node3D, lm: Dictionary) -> void:
	var c := _centro2d(lm)
	var st: Dictionary = lm.get("stylobate", {})
	var ss: Array = st.get("size", [26.0, 20.0])
	_caixa_solida(cont, "Estilobata", Vector3(float(ss[0]), float(st.get("height", 0.6)), float(ss[1])), Vector3(c.x, float(st.get("height", 0.6)) * 0.5, c.y), material_pedra)
	var b: Dictionary = lm.get("building", {})
	var bs: Array = b.get("size", [22.0, 16.0])
	var floor_y: float = float(lm.get("floor_y", 0.6))
	var wall_h: float = float(b.get("wall_height", 5.0))
	_caixa_solida(cont, "Corpo", Vector3(float(bs[0]), wall_h, float(bs[1])), Vector3(c.x, floor_y + wall_h * 0.5, c.y), material_pedra)
	# Cúpula (aproximada por cilindro achatado).
	var dome: Dictionary = lm.get("dome", {})
	var dc: Array = dome.get("center", [c.x, c.y + 2.0])
	_cilindro_solido(cont, "Cupula", float(dome.get("d", 8.0)) * 0.5, float(dome.get("top_y", 9.0)) - (floor_y + wall_h), Vector3(float(dc[0]), floor_y + wall_h, float(dc[1])), material_pedra)
	# Pórtico (6 colunas na fachada norte).
	var por: Dictionary = lm.get("portico", {})
	var ncol: int = int(por.get("columns", 6))
	var passo: float = float(por.get("spacing", 3.6))
	var z_col := c.y - float(bs[1]) * 0.5 - 1.5
	for i in ncol:
		var x := c.x + (float(i) - (ncol - 1) * 0.5) * passo
		_cilindro_solido(cont, "ColMaus%d" % i, float(por.get("column_d", 0.7)) * 0.5, float(por.get("column_h", 4.5)), Vector3(x, floor_y, z_col), material_pedra)
	_piso_ret(cont, "Adro", Vector2(26.0, 6.0), Vector2(c.x, c.y - 11.0), material_pavimento)
	_colocar_elementos(cont, lm)


# 11 · Torre do Relógio (marco global) ----------------------------------------
func _lm_torre(cont: Node3D, lm: Dictionary) -> void:
	var c := _centro2d(lm)
	var sh: Dictionary = lm.get("shaft", {})
	var ss: Array = sh.get("size", [10.0, 10.0])
	var sh_h: float = float(sh.get("height", 22.0))
	_caixa_solida(cont, "Fuste", Vector3(float(ss[0]), sh_h, float(ss[1])), Vector3(c.x, sh_h * 0.5, c.y), material_pedra)
	var bel: Dictionary = lm.get("belfry", {})
	var bs: Array = bel.get("size", [8.0, 8.0])
	var bel_h: float = float(bel.get("height", 4.0))
	_caixa_solida(cont, "Campanario", Vector3(float(bs[0]), bel_h, float(bs[1])), Vector3(c.x, sh_h + bel_h * 0.5, c.y), material_pedra)
	var sp: Dictionary = lm.get("spire", {})
	_cilindro_solido(cont, "Pinaculo", float(sp.get("d", 3.0)) * 0.5, float(sp.get("height", 2.0)), Vector3(c.x, sh_h + bel_h, c.y), material_pedra)
	# Mostrador do relógio (face sul).
	var cf: Dictionary = lm.get("clock_face", {})
	var cy_face: float = float(cf.get("center_y", 20.0))
	var mostrador := _cilindro_solido(cont, "Mostrador", float(cf.get("d", 3.6)) * 0.5, float(cf.get("thickness", 0.2)), Vector3(c.x, cy_face - float(cf.get("thickness", 0.2)) * 0.5, c.y + float(ss[1]) * 0.5), material_pedra)
	mostrador.rotate_x(PI * 0.5)


# 12 · Jardim das Sombras ------------------------------------------------------
func _lm_sombras(cont: Node3D, lm: Dictionary) -> void:
	var c := _centro2d(lm)
	var fp: Array = lm.get("footprint", [36.0, 28.0])
	_piso_ret(cont, "Cascalho", Vector2(float(fp[0]), float(fp[1])), c, material_pavimento)
	# Topiárias.
	var top: Dictionary = lm.get("topiaries", {})
	var ts: Array = top.get("size", [1.8, 2.5, 1.8])
	for p_v in top.get("positions", []):
		var p: Array = p_v
		_colocar_prop(cont, "PR_TOPIARY", Vector3(float(ts[0]), float(ts[1]), float(ts[2])), Vector3(float(p[0]), float(p[1]), float(p[2])))
	# Estátua encapuzada central (pedestal + figura).
	var stt: Dictionary = lm.get("statue", {})
	var sp: Array = stt.get("position", [c.x, 0.0, c.y])
	var ped_h: float = float(stt.get("pedestal_h", 0.6))
	_caixa_solida(cont, "PedestalSombra", Vector3(1.2, ped_h, 1.2), Vector3(float(sp[0]), ped_h * 0.5, float(sp[2])), material_pedra)
	var sst: Array = stt.get("size", [1.0, 2.6, 1.0])
	_cilindro_solido(cont, "EstatuaSombra", float(sst[0]) * 0.5, float(sst[1]), Vector3(float(sp[0]), ped_h, float(sp[2])), material_pedra)
	_colocar_elementos(cont, lm)


# 13 · Portão Final (Saída) ----------------------------------------------------
func _lm_saida(cont: Node3D, lm: Dictionary) -> void:
	var c := _centro2d(lm)
	_piso_ret(cont, "PracaSaida", Vector2(20.0, 12.0), Vector2(c.x, c.y - 4.0), material_pavimento)
	_colocar_elementos(cont, lm)  # pilares, portão, arco, braseiros, encaixes


# LM-A · Alameda dos Ciprestes -------------------------------------------------
func _lm_ciprestes(cont: Node3D, lm: Dictionary) -> void:
	var av: Dictionary = lm.get("avenue", {})
	var x: float = float(av.get("x", 80.0))
	var z0: float = float(av.get("z_from", 6.0))
	var z1: float = float(av.get("z_to", 48.0))
	_piso_ret(cont, "Alameda", Vector2(float(av.get("width", 4.0)), z1 - z0), Vector2(x, (z0 + z1) * 0.5), material_pavimento)
	var cy: Dictionary = lm.get("cypress", {})
	var cs: Array = cy.get("size", [1.6, 8.0, 1.6])
	for p_v in cy.get("positions", []):
		var p: Array = p_v
		_cilindro_solido(cont, "Cipreste", float(cs[0]) * 0.5, float(cs[1]), Vector3(float(p[0]), float(p[1]), float(p[2])), material_sebe)
	var mk: Dictionary = lm.get("marker", {})
	var mp: Array = mk.get("position", [x, 0.0, 26.0])
	var msz: Array = mk.get("size", [0.8, 2.2, 0.8])
	_cilindro_solido(cont, "Marco", float(msz[0]) * 0.5, float(msz[1]), Vector3(float(mp[0]), float(mp[1]), float(mp[2])), material_pedra)


func _montar_caminhos() -> void:
	pass


func _montar_labirinto() -> void:
	pass


# ---------------------------------------------------------------------------
# Helpers de geometria graybox
# ---------------------------------------------------------------------------

## Caixa estática (mesh + colisão) centrada em `centro` (world).
func _caixa_solida(pai: Node3D, nome: String, tamanho: Vector3, centro: Vector3, mat: Material) -> StaticBody3D:
	var corpo := StaticBody3D.new()
	corpo.name = nome
	corpo.position = centro
	pai.add_child(corpo)

	var malha := MeshInstance3D.new()
	var caixa := BoxMesh.new()
	caixa.size = tamanho
	malha.mesh = caixa
	if mat:
		malha.material_override = mat
	corpo.add_child(malha)

	var colisor := CollisionShape3D.new()
	var forma := BoxShape3D.new()
	forma.size = tamanho
	colisor.shape = forma
	corpo.add_child(colisor)
	return corpo


## Cilindro estático (mesh + colisão) com base em `base` (world, y = fundo).
func _cilindro_solido(pai: Node3D, nome: String, raio: float, altura: float, base: Vector3, mat: Material) -> StaticBody3D:
	var corpo := StaticBody3D.new()
	corpo.name = nome
	corpo.position = base + Vector3(0.0, altura * 0.5, 0.0)
	pai.add_child(corpo)

	var malha := MeshInstance3D.new()
	var cil := CylinderMesh.new()
	cil.top_radius = raio
	cil.bottom_radius = raio
	cil.height = altura
	malha.mesh = cil
	if mat:
		malha.material_override = mat
	corpo.add_child(malha)

	var colisor := CollisionShape3D.new()
	var forma := CylinderShape3D.new()
	forma.radius = raio
	forma.height = altura
	colisor.shape = forma
	corpo.add_child(colisor)
	return corpo


## Piso fino retangular (só visual, sem colisão — o terreno já colide).
func _piso_ret(pai: Node3D, nome: String, tam_xz: Vector2, centro2d: Vector2, mat: Material, y: float = 0.03) -> MeshInstance3D:
	var malha := MeshInstance3D.new()
	malha.name = nome
	var caixa := BoxMesh.new()
	caixa.size = Vector3(tam_xz.x, 0.06, tam_xz.y)
	malha.mesh = caixa
	malha.position = Vector3(centro2d.x, y, centro2d.y)
	if mat:
		malha.material_override = mat
	pai.add_child(malha)
	return malha


## Piso fino circular (só visual).
func _piso_circ(pai: Node3D, nome: String, raio: float, centro2d: Vector2, mat: Material, y: float = 0.03) -> MeshInstance3D:
	var malha := MeshInstance3D.new()
	malha.name = nome
	var cil := CylinderMesh.new()
	cil.top_radius = raio
	cil.bottom_radius = raio
	cil.height = 0.06
	malha.mesh = cil
	malha.position = Vector3(centro2d.x, y, centro2d.y)
	if mat:
		malha.material_override = mat
	pai.add_child(malha)
	return malha


## True para props melhor representados como cilindro no graybox.
func _prop_e_cilindro(nome: String) -> bool:
	for chave in ["LAMP", "COLUMN", "URN", "BRAZIER", "CYPRESS", "TREE", "PLANTER", "POST", "FERN", "WELL", "MARKER", "TABLE"]:
		if nome.contains(chave):
			return true
	return false


## Material graybox por tipo de prop.
func _mat_prop(nome: String) -> Material:
	if nome.contains("HEDGE") or nome.contains("TOPIARY") or nome.contains("ROSE") or nome.contains("CYPRESS") or nome.contains("TREE") or nome.contains("FERN"):
		return material_sebe
	return material_pedra


## Coloca um prop (caixa ou cilindro) com a base em `base` (y = fundo).
## `tam` é o tamanho em Godot (x, y, z); para cilindros usa x como diâmetro.
func _colocar_prop(pai: Node3D, prop: String, tam: Vector3, base: Vector3) -> void:
	if _prop_e_cilindro(prop):
		_cilindro_solido(pai, prop, tam.x * 0.5, tam.y, base, _mat_prop(prop))
	else:
		_caixa_solida(pai, prop, tam, base + Vector3(0.0, tam.y * 0.5, 0.0), _mat_prop(prop))


## Percorre `elements` do landmark e instancia cada prop nas suas `positions`.
## Posições do JSON são a base (y = fundo) do prop.
func _colocar_elementos(pai: Node3D, lm: Dictionary) -> void:
	for el_v in lm.get("elements", []):
		var el: Dictionary = el_v
		if not el.has("positions") or not el.has("size"):
			continue
		var s: Array = el["size"]
		var tam := Vector3(float(s[0]), float(s[1]), float(s[2]))
		var prop: String = el.get("prop", "PROP")
		for p_v in el["positions"]:
			var p: Array = p_v
			_colocar_prop(pai, prop, tam, Vector3(float(p[0]), float(p[1]), float(p[2])))


## Anel de sebe (circular) com aberturas. `aberturas` = lista de dicts com "pos"
## [x, z] e "width". Coloca blocos de sebe ao longo do círculo, pulando os vãos.
func _anel_sebe(pai: Node3D, centro2d: Vector2, raio: float, altura: float, aberturas: Array) -> void:
	var raiz := Node3D.new()
	raiz.name = "AnelSebe"
	pai.add_child(raiz)
	# Pré-calcula ângulos e meias-larguras angulares das aberturas.
	var vaos: Array = []
	for ab_v in aberturas:
		var ab: Dictionary = ab_v
		var pos: Array = ab.get("pos", [centro2d.x, centro2d.y])
		var ang := atan2(float(pos[1]) - centro2d.y, float(pos[0]) - centro2d.x)
		var largura: float = float(ab.get("width", 3.0))
		vaos.append({ "ang": ang, "meia": (largura * 0.6) / raio })
	var n := maxi(8, int(round(TAU * raio / 2.0)))
	for i in n:
		var ang := TAU * float(i) / float(n)
		var aberto := false
		for v in vaos:
			if absf(wrapf(ang - float(v["ang"]), -PI, PI)) < float(v["meia"]):
				aberto = true
				break
		if aberto:
			continue
		var x := centro2d.x + cos(ang) * raio
		var z := centro2d.y + sin(ang) * raio
		var b := _caixa_solida(raiz, "Sebe%d" % i, Vector3(2.0, altura, 2.0), Vector3(x, altura * 0.5, z), material_sebe)
		b.rotation.y = -ang


## 4 paredes de perímetro (caixas finas) com vãos nas posições de entrada dadas.
## `entradas` = lista de dicts com "pos" [x, z] e "width"; um vão é aberto na
## parede mais próxima de cada entrada.
func _perimetro_com_vaos(pai: Node3D, centro2d: Vector2, tam_xz: Vector2, altura: float, espessura: float, entradas: Array, mat: Material) -> void:
	var raiz := Node3D.new()
	raiz.name = "Perimetro"
	pai.add_child(raiz)
	var meia_x := tam_xz.x * 0.5
	var meia_z := tam_xz.y * 0.5
	# Cada lado: nome, eixo ("H"=varia X, "V"=varia Z), coordenada fixa, extensão.
	var lados := [
		{ "nome": "N", "eixo": "H", "fixo": centro2d.y - meia_z, "de": centro2d.x - meia_x, "ate": centro2d.x + meia_x },
		{ "nome": "S", "eixo": "H", "fixo": centro2d.y + meia_z, "de": centro2d.x - meia_x, "ate": centro2d.x + meia_x },
		{ "nome": "O", "eixo": "V", "fixo": centro2d.x - meia_x, "de": centro2d.y - meia_z, "ate": centro2d.y + meia_z },
		{ "nome": "L", "eixo": "V", "fixo": centro2d.x + meia_x, "de": centro2d.y - meia_z, "ate": centro2d.y + meia_z },
	]
	for lado in lados:
		# Vão neste lado (se alguma entrada cai nele).
		var vao_min := INF
		var vao_max := -INF
		for ent_v in entradas:
			var ent: Dictionary = ent_v
			var pos: Array = ent.get("pos", [])
			if pos.is_empty():
				continue
			var w: float = float(ent.get("width", 2.5))
			var no_lado := false
			var centro_vao := 0.0
			if lado["eixo"] == "H" and absf(float(pos[1]) - float(lado["fixo"])) < 1.5:
				no_lado = true
				centro_vao = float(pos[0])
			elif lado["eixo"] == "V" and absf(float(pos[0]) - float(lado["fixo"])) < 1.5:
				no_lado = true
				centro_vao = float(pos[1])
			if no_lado:
				vao_min = minf(vao_min, centro_vao - w * 0.5)
				vao_max = maxf(vao_max, centro_vao + w * 0.5)
		_parede_com_vao(raiz, str(lado["nome"]), lado, altura, espessura, vao_min, vao_max, mat)


func _parede_com_vao(pai: Node3D, nome: String, lado: Dictionary, altura: float, esp: float, vao_min: float, vao_max: float, mat: Material) -> void:
	var de: float = float(lado["de"])
	var ate: float = float(lado["ate"])
	var fixo: float = float(lado["fixo"])
	var horizontal: bool = lado["eixo"] == "H"
	# Trechos: antes do vão e depois do vão (se houver vão).
	var trechos: Array = []
	if vao_min == INF:
		trechos.append([de, ate])
	else:
		if vao_min > de:
			trechos.append([de, vao_min])
		if vao_max < ate:
			trechos.append([vao_max, ate])
	for i in trechos.size():
		var t: Array = trechos[i]
		var comp: float = t[1] - t[0]
		if comp <= 0.05:
			continue
		var meio: float = (t[0] + t[1]) * 0.5
		var tam: Vector3
		var centro: Vector3
		if horizontal:
			tam = Vector3(comp, altura, esp)
			centro = Vector3(meio, altura * 0.5, fixo)
		else:
			tam = Vector3(esp, altura, comp)
			centro = Vector3(fixo, altura * 0.5, meio)
		_caixa_solida(pai, "%s%d" % [nome, i], tam, centro, mat)
