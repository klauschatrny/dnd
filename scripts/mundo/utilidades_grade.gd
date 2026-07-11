extends RefCounted
class_name UtilidadesGrade
## Conversões entre a grade do mapa (células) e o mundo (metros), conforme a
## Especificação Técnica de Mapa (ESPEC_MAPA_O_Labirinto_v1.md §1).
##
## Sistema de eixos (Godot, Y-up): +X = leste, +Z = sul, -Z = norte (frente
## padrão do player). Origem (0,0,0) no canto NOROESTE do terreno; chão em Y = 0.
## Coordenadas world caem sempre em múltiplos de 2 m (cantos de célula) para snap.

## Lado de cada célula, em metros.
const CELULA := 2.0
## Largura da grade, em células (eixo X, oeste→leste).
const GRADE_L := 120
## Altura da grade, em células (eixo Z, norte→sul).
const GRADE_A := 96
## Dimensões totais do terreno, em metros.
const LARGURA_M := 240.0
const ALTURA_M := 192.0


## Centro da célula (cx, cz) em metros world. Y = 0 (piso).
static func celula_para_centro(cx: int, cz: int) -> Vector3:
	return Vector3(cx * CELULA + CELULA * 0.5, 0.0, cz * CELULA + CELULA * 0.5)


## Canto noroeste da célula (cx, cz) em metros world.
static func celula_para_canto(cx: int, cz: int) -> Vector3:
	return Vector3(cx * CELULA, 0.0, cz * CELULA)


## Célula que contém o ponto world p.
static func mundo_para_celula(p: Vector3) -> Vector2i:
	return Vector2i(int(floor(p.x / CELULA)), int(floor(p.z / CELULA)))


## Ponto (x, z) em metros — vindo do JSON como [x, z] — para Vector3 no piso.
static func xz_para_mundo(par: Array) -> Vector3:
	return Vector3(float(par[0]), 0.0, float(par[1]))


## Verdadeiro se a célula está dentro da grade jogável.
static func celula_valida(cx: int, cz: int) -> bool:
	return cx >= 0 and cx < GRADE_L and cz >= 0 and cz < GRADE_A
