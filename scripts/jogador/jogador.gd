extends CharacterBody3D
## Controlador do jogador em primeira pessoa.
##
## Ações: andar, olhar ao redor, interagir e pular. Ritmo contemplativo, sem head bob.
## Nota: o GDD (pilar §4) desaconselha pular; adicionado a pedido do dono do projeto.

## Velocidade de caminhada (m/s). Confortável, pensada para incentivar a observação.
@export var velocidade_caminhada: float = 2.8
## Velocidade vertical inicial do pulo (m/s).
@export var velocidade_pulo: float = 4.5
## Limite vertical do olhar, em graus.
@export var limite_vertical: float = 89.0

@onready var camera: Camera3D = $Camera3D
@onready var raio_interacao: RayCast3D = $Camera3D/RaioInteracao

var _gravidade: float = ProjectSettings.get_setting("physics/3d/default_gravity")


func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		# Sensibilidade vem das Configurações, aplicada ao vivo.
		var sensibilidade := Configuracoes.sensibilidade_mouse
		rotate_y(-event.relative.x * sensibilidade)
		camera.rotate_x(-event.relative.y * sensibilidade)
		var limite := deg_to_rad(limite_vertical)
		camera.rotation.x = clampf(camera.rotation.x, -limite, limite)


func _physics_process(delta: float) -> void:
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
	velocity.x = direcao.x * velocidade_caminhada
	velocity.z = direcao.z * velocidade_caminhada

	move_and_slide()


func _process(_delta: float) -> void:
	if Input.is_action_just_pressed("interagir"):
		_tentar_interagir()


## Interação padrão do GDD: olhar para o objeto e apertar um único botão.
func _tentar_interagir() -> void:
	if not raio_interacao.is_colliding():
		return
	var alvo := raio_interacao.get_collider()
	if alvo and alvo.has_method("interagir"):
		alvo.interagir(self)
