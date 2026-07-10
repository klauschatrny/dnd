// Biblioteca de Denúncias (CGS §19).
// A denúncia orienta, nunca entrega a resposta. É escolhida de acordo com a categoria
// das irregularidades presentes no caso. Casos sem irregularidade usam denúncias vagas.

/**
 * @typedef {Object} DenunciaDef
 * @property {string} texto
 * @property {string[]} categories  Categorias compatíveis (vazio = qualquer/falso alarme).
 */

/** @type {DenunciaDef[]} */
export const DENUNCIAS = [
  // Câmeras / dispositivos ópticos
  {
    texto: 'Hóspede afirma ter visto um LED azul atrás de um móvel durante a madrugada.',
    categories: ['DISPOSITIVO_ILEGAL'],
  },
  {
    texto: 'Um hóspede percebeu um brilho estranho refletindo de um objeto no quarto.',
    categories: ['DISPOSITIVO_ILEGAL'],
  },
  {
    texto: 'Relato de sensação de estar sendo observado na sala de estar.',
    categories: ['DISPOSITIVO_ILEGAL'],
  },
  // Áudio
  {
    texto: 'Hóspede ouviu um leve clique eletrônico vindo de perto da cabeceira.',
    categories: ['DISPOSITIVO_ILEGAL'],
  },
  // Estruturas adulteradas
  {
    texto: 'Um hóspede achou que o espelho do quarto parecia estranho e escuro.',
    categories: ['ESTRUTURA_ADULTERADA'],
  },
  {
    texto: 'Relato de uma tomada que esquentava sem nada conectado.',
    categories: ['ESTRUTURA_ADULTERADA'],
  },
  // Compartimentos secretos
  {
    texto: 'Hóspede suspeitou de um vão oco ao encostar em um móvel.',
    categories: ['COMPARTIMENTO_SECRETO'],
  },
  // Vagas / falso alarme
  {
    texto: 'Denúncia anônima genérica: "algo não parece certo neste imóvel".',
    categories: [],
  },
  {
    texto: 'Hóspede relatou desconforto, sem apontar nada específico.',
    categories: [],
  },
];
