extends Node
## Configurações do jogador, centralizadas e persistidas entre sessões (TDD §7).
##
## Guarda as opções ajustáveis, aplica-as ao sistema (áudio via GerenciadorAudio,
## janela via DisplayServer) e as grava em disco. É a fonte da verdade das
## configurações — o jogador e a interface leem daqui.

const CAMINHO_CONFIG := "user://configuracoes.cfg"

## Sensibilidade do mouse, em radianos por pixel.
var sensibilidade_mouse: float = 0.0022
## Volume geral (0.0 a 1.0).
var volume_geral: float = 0.8
## Se a janela deve abrir em tela cheia.
var tela_cheia: bool = false


func _ready() -> void:
	carregar_configuracoes()
	aplicar_configuracoes()


func carregar_configuracoes() -> void:
	var config := ConfigFile.new()
	if config.load(CAMINHO_CONFIG) != OK:
		return  # Primeira execução: mantém os padrões.
	sensibilidade_mouse = config.get_value("controles", "sensibilidade_mouse", sensibilidade_mouse)
	volume_geral = config.get_value("audio", "volume_geral", volume_geral)
	tela_cheia = config.get_value("video", "tela_cheia", tela_cheia)


func salvar_configuracoes() -> void:
	var config := ConfigFile.new()
	config.set_value("controles", "sensibilidade_mouse", sensibilidade_mouse)
	config.set_value("audio", "volume_geral", volume_geral)
	config.set_value("video", "tela_cheia", tela_cheia)
	config.save(CAMINHO_CONFIG)


## Aplica as configurações atuais ao sistema.
func aplicar_configuracoes() -> void:
	GerenciadorAudio.definir_volume_geral(volume_geral)
	_aplicar_tela_cheia(tela_cheia)


func definir_sensibilidade(valor: float) -> void:
	sensibilidade_mouse = valor
	salvar_configuracoes()


func definir_volume(valor: float) -> void:
	volume_geral = valor
	GerenciadorAudio.definir_volume_geral(valor)
	salvar_configuracoes()


func definir_tela_cheia(ativo: bool) -> void:
	tela_cheia = ativo
	_aplicar_tela_cheia(ativo)
	salvar_configuracoes()


func _aplicar_tela_cheia(ativo: bool) -> void:
	var modo := DisplayServer.WINDOW_MODE_FULLSCREEN if ativo else DisplayServer.WINDOW_MODE_WINDOWED
	DisplayServer.window_set_mode(modo)
