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
	pass


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
