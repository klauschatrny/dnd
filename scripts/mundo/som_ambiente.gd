extends AudioStreamPlayer
## Ambiência sonora procedural (fundação — provisório até o PAD).
##
## O GDD trata o silêncio como o principal instrumento: nada de trilha durante a
## exploração, só uma cama de vento discreta. Em vez de um arquivo de áudio,
## sintetizamos o vento em tempo real — ruído branco filtrado (passa-baixa, para
## soar "ar" e não chiado) modulado por rajadas lentas. Barato, sem asset binário
## e totalmente ajustável.

## Amplitude média do vento (antes do barramento). Baixo de propósito.
@export_range(0.0, 1.0, 0.01) var volume_base: float = 0.22
## Brilho: quanto do agudo passa no filtro (mais alto = mais "assobio").
@export_range(0.02, 0.9, 0.01) var brilho: float = 0.18

const _TAXA: float = 22050.0

var _reprodutor: AudioStreamGeneratorPlayback
# Saída do passa-baixa de um polo, por canal (dá leve largura estéreo).
var _lp_esq: float = 0.0
var _lp_dir: float = 0.0
# Fases das duas LFOs que desenham as rajadas.
var _fase_rajada_1: float = 0.0
var _fase_rajada_2: float = 0.0


func _ready() -> void:
	# Continua tocando mesmo com o jogo pausado (a ambiência não corta no menu).
	process_mode = Node.PROCESS_MODE_ALWAYS
	var gerador := AudioStreamGenerator.new()
	gerador.mix_rate = _TAXA
	gerador.buffer_length = 0.2
	stream = gerador
	play()
	_reprodutor = get_stream_playback()
	_preencher()


func _process(_delta: float) -> void:
	_preencher()


func _preencher() -> void:
	if _reprodutor == null:
		return
	var quadros := _reprodutor.get_frames_available()
	if quadros <= 0:
		return

	var buffer := PackedVector2Array()
	buffer.resize(quadros)
	var coef := clampf(brilho, 0.02, 0.9)
	var passo_1 := TAU * 0.05 / _TAXA   # ~20 s por ciclo
	var passo_2 := TAU * 0.11 / _TAXA   # ~9 s por ciclo

	for i in quadros:
		# Passa-baixa de um polo em ruído branco -> sopro de vento.
		_lp_esq += coef * ((randf() * 2.0 - 1.0) - _lp_esq)
		_lp_dir += coef * ((randf() * 2.0 - 1.0) - _lp_dir)

		# Rajadas: duas LFOs lentas multiplicadas modulam a amplitude.
		_fase_rajada_1 += passo_1
		_fase_rajada_2 += passo_2
		if _fase_rajada_1 >= TAU:
			_fase_rajada_1 -= TAU
		if _fase_rajada_2 >= TAU:
			_fase_rajada_2 -= TAU
		var rajada := 0.55 + 0.45 \
			* (0.5 + 0.5 * sin(_fase_rajada_1)) \
			* (0.5 + 0.5 * sin(_fase_rajada_2))

		var ganho := volume_base * rajada
		buffer[i] = Vector2(_lp_esq * ganho, _lp_dir * ganho)

	_reprodutor.push_buffer(buffer)
