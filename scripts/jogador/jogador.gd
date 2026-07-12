extends CharacterBody3D
## Controlador do jogador em primeira pessoa.
##
## Ações: andar, correr, olhar ao redor, interagir e pular. Sem head bob.
## Nota: o GDD (pilar §4) prega ritmo contemplativo, sem sprint nem pulo; correr e
## pular foram adicionados a pedido do dono do projeto.
## Inclui um noclip TEMPORÁRIO (tecla N) só para teste/depuração — remover antes do MVP.

## Velocidade de caminhada (m/s). Confortável, pensada para incentivar a observação.
@export var velocidade_caminhada: float = 2.8
## Velocidade ao correr (segurando o comando de correr), em m/s.
@export var velocidade_corrida: float = 5.0
## Velocidade vertical inicial do pulo (m/s).
@export var velocidade_pulo: float = 4.5
## Velocidade do noclip de teste (m/s).
@export var velocidade_noclip: float = 8.0
## Limite vertical do olhar, em graus.
@export var limite_vertical: float = 89.0

# Ferramenta temporária de teste: voar atravessando a geometria.
var _noclip: bool = false

@onready var camera: Camera3D = $Camera3D
@onready var raio_interacao: RayCast3D = $Camera3D/RaioInteracao

var _gravidade: float = ProjectSettings.get_setting("physics/3d/default_gravity")


func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	add_to_group("jogador")


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		# Sensibilidade vem das Configurações, aplicada ao vivo.
		var sensibilidade := Configuracoes.sensibilidade_mouse
		rotate_y(-event.relative.x * sensibilidade)
		camera.rotate_x(-event.relative.y * sensibilidade)
		var limite := deg_to_rad(limite_vertical)
		camera.rotation.x = clampf(camera.rotation.x, -limite, limite)


func _physics_process(delta: float) -> void:
	if _noclip:
		_mover_noclip(delta)
		return

	if is_on_floor():
		velocity.y = 0.0
		if Input.is_action_just_pressed("pular"):
			velocity.y = velocidade_pulo
	else:
		velocity.y -= _gravidade * delta

	var entrada := Input.get_vector(
		"mover_esquerda", "mover_direita", "mover_frente", "mover_tras"
	)
	var direcao := (transform.basis * Vector3(entrada.x, 0.0, entrada.y)).normalized()
	var velocidade := velocidade_corrida if Input.is_action_pressed("correr") else velocidade_caminhada
	velocity.x = direcao.x * velocidade
	velocity.z = direcao.z * velocidade

	move_and_slide()


## Noclip de teste: voa na direção do olhar (WASD) e sobe com pular, ignorando
## colisão (move a posição direto, sem move_and_slide). Temporário — remover no MVP.
func _mover_noclip(delta: float) -> void:
	velocity = Vector3.ZERO
	var entrada := Input.get_vector(
		"mover_esquerda", "mover_direita", "mover_frente", "mover_tras"
	)
	var direcao := camera.global_transform.basis * Vector3(entrada.x, 0.0, entrada.y)
	if Input.is_action_pressed("pular"):
		direcao.y += 1.0
	if direcao.length() > 0.0:
		global_position += direcao.normalized() * velocidade_noclip * delta


func _process(_delta: float) -> void:
	if Input.is_action_just_pressed("interagir"):
		_tentar_interagir()
	if Input.is_action_just_pressed("noclip"):
		_noclip = not _noclip


## Interação padrão do GDD: olhar para o objeto e apertar um único botão.
func _tentar_interagir() -> void:
	if not raio_interacao.is_colliding():
		return
	var alvo := raio_interacao.get_collider()
	if alvo and alvo.has_method("interagir"):
		alvo.interagir(self)
