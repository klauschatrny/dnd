extends RefCounted
class_name SonsEventos
## Síntese procedural dos cues sonoros dos eventos raros (Fase 7 — sons, sem
## asset binário). Cada função devolve um `AudioStreamWAV` curto, mono, 22050 Hz,
## coerente com a filosofia do GDD: sons discretos sobre o silêncio, nunca música.
##
## Gerados uma vez e reproduzidos posicionalmente (AudioStreamPlayer3D) pelo
## GerenciadorEventosRaros. Volume propositalmente baixo — o silêncio manda.

const TAXA := 22050.0


## Converte amostras [-1,1] em PCM 16-bit (PackedByteArray little-endian).
static func _para_wav(amostras: PackedFloat32Array) -> AudioStreamWAV:
	var bytes := PackedByteArray()
	bytes.resize(amostras.size() * 2)
	for i in amostras.size():
		var v := int(clampf(amostras[i], -1.0, 1.0) * 32767.0)
		bytes.encode_s16(i * 2, v)
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = int(TAXA)
	wav.stereo = false
	wav.data = bytes
	return wav


static func _n(segundos: float) -> int:
	return int(segundos * TAXA)


## Badalada de sino (RE_11): parciais inarmônicas de sino com decaimento.
static func badalada() -> AudioStreamWAV:
	var n := _n(2.4)
	var a := PackedFloat32Array()
	a.resize(n)
	var f0 := 210.0
	var razoes := [1.0, 2.76, 5.40, 8.93, 11.34]
	var amps := [1.0, 0.6, 0.42, 0.28, 0.18]
	var decais := [2.2, 2.8, 3.6, 4.6, 6.0]
	for i in n:
		var t := float(i) / TAXA
		var s := 0.0
		for k in razoes.size():
			s += float(amps[k]) * sin(TAU * f0 * float(razoes[k]) * t) * exp(-t * float(decais[k]))
		# Ataque rápido (2 ms) para não estalar.
		s *= minf(1.0, t / 0.002)
		a[i] = s * 0.32
	return _para_wav(a)


## Rangido de portão (RE_13): ruído passa-baixa com "grãos" lentos e pitch baixo.
static func rangido() -> AudioStreamWAV:
	var n := _n(1.6)
	var a := PackedFloat32Array()
	a.resize(n)
	var lp := 0.0
	for i in n:
		var t := float(i) / TAXA
		# Grão: dente-de-serra lento (~14 Hz) dá o "ranger" intermitente.
		var grao := 0.5 + 0.5 * sin(TAU * 14.0 * t + 2.0 * sin(TAU * 3.0 * t))
		var ruido := randf() * 2.0 - 1.0
		lp += 0.08 * (ruido - lp)
		var env := sin(PI * clampf(t / 1.6, 0.0, 1.0))  # sobe e desce
		a[i] = lp * grao * env * 0.5
	return _para_wav(a)


## Pingo de água (RE_09): blip senoidal com chirp de pitch e decaimento rápido.
static func pingo() -> AudioStreamWAV:
	var n := _n(0.32)
	var a := PackedFloat32Array()
	a.resize(n)
	for i in n:
		var t := float(i) / TAXA
		var f := 1400.0 - 700.0 * (t / 0.32)  # cai de 1400 para 700 Hz
		var env := exp(-t * 22.0)
		a[i] = sin(TAU * f * t) * env * 0.3
	return _para_wav(a)


## Sussurro ao longe (RE_12): ruído em banda estreita, respiração suave.
static func sussurro() -> AudioStreamWAV:
	var n := _n(2.2)
	var a := PackedFloat32Array()
	a.resize(n)
	var bp := 0.0
	var lp := 0.0
	for i in n:
		var t := float(i) / TAXA
		var ruido := randf() * 2.0 - 1.0
		lp += 0.25 * (ruido - lp)      # passa-baixa
		bp = lp - bp * 0.6             # realça uma banda -> "sopro"
		# Duas respirações (envelope duplo).
		var env := (0.5 + 0.5 * sin(TAU * 0.9 * t - PI * 0.5)) * sin(PI * clampf(t / 2.2, 0.0, 1.0))
		a[i] = bp * env * 0.28
	return _para_wav(a)


## Vidro quebrando (RE_07): estouro de ruído + estilhaços agudos decaindo.
static func vidro() -> AudioStreamWAV:
	var n := _n(0.7)
	var a := PackedFloat32Array()
	a.resize(n)
	var tings := [3300.0, 4700.0, 6100.0, 7900.0]
	for i in n:
		var t := float(i) / TAXA
		var estouro := (randf() * 2.0 - 1.0) * exp(-t * 30.0)
		var ting := 0.0
		for f in tings:
			ting += sin(TAU * f * t) * exp(-t * 12.0)
		a[i] = (estouro * 0.6 + ting * 0.12) * 0.35
	return _para_wav(a)


## Bater de asas (RE_05): rajada curta de ruído com "flaps" a ~10 Hz.
static func asas() -> AudioStreamWAV:
	var n := _n(0.8)
	var a := PackedFloat32Array()
	a.resize(n)
	var lp := 0.0
	for i in n:
		var t := float(i) / TAXA
		var flap := 0.5 + 0.5 * sin(TAU * 10.0 * t)
		var ruido := randf() * 2.0 - 1.0
		lp += 0.3 * (ruido - lp)
		var env := exp(-t * 2.5)
		a[i] = lp * flap * env * 0.3
	return _para_wav(a)


## Ondulação/água no lago (RE_03): whoosh grave com ruído filtrado.
static func agua() -> AudioStreamWAV:
	var n := _n(1.6)
	var a := PackedFloat32Array()
	a.resize(n)
	var lp := 0.0
	for i in n:
		var t := float(i) / TAXA
		var ruido := randf() * 2.0 - 1.0
		lp += 0.05 * (ruido - lp)  # bem grave
		var onda := sin(TAU * 3.0 * t)
		var env := sin(PI * clampf(t / 1.6, 0.0, 1.0))
		a[i] = (lp * 0.7 + lp * onda * 0.3) * env * 0.4
	return _para_wav(a)
