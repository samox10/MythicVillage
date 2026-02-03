// ------------------------------------------
// TABELA DE MINERIOS
// ------------------------------------------
export const tabelaMinerais = [
  { id: 'pedra',      nome: 'Pedra',      nivel: 1,  producaoBase: 60 },  // 60 por minuto
  { id: 'cobre',      nome: 'Cobre',      nivel: 2,  producaoBase: 40 },  // 40 por minuto
  { id: 'ferro',      nome: 'Ferro',      nivel: 4,  producaoBase: 30 },  // 30 por minuto
  { id: 'prata',      nome: 'Prata',      nivel: 6,  producaoBase: 20 }, // 20 por minuto
  { id: 'ouro_min',   nome: 'Ouro (Min)', nivel: 8,  producaoBase: 15 }, // 15 por minuto
  { id: 'obsidiana',  nome: 'Obsidiana',  nivel: 10, producaoBase: 10 }, // 10 por minuto
  { id: 'titanio',    nome: 'Titânio',    nivel: 12, producaoBase: 8 }, // 8 por minuto
  { id: 'diamante',   nome: 'Diamante',   nivel: 14, producaoBase: 5 }, // 5 por minuto
  { id: 'mithril',    nome: 'Mithril',    nivel: 16, producaoBase: 3 }, // 3 por minuto
  { id: 'aetherium',  nome: 'Aetherium',  nivel: 18, producaoBase: 1 } // 1 por minuto
];

// ------------------------------------------
// TABELA DE ITENS CRAFTÁVEIS
// ------------------------------------------

export const tabelaItens = [
  // --- ARMAS ---
  
  { 
    id: 'espada_cobre', nome: 'Espada de Cobre', 
    img: '/assets/craft/espada_cobre.png',
    categoria: 'aventureiro', 
    tipo: 'arma',
    custo: { madeira: 10, cobre: 5, obsidiana: 1 }, 
    tempo: 10, 
    reqNivel: 1,
    nivelItem: 5,
    stats: { ataque: 8, critico: 2, danoCritico: 50, penetracao: 2, magia: 1,
    atributoInativo: "Dano contra slimes +10%"
     }     
  },
  { 
    id: 'espada_ferro', nome: 'Espada da Ruína Celestial', 
    categoria: 'heroi',
    tipo: 'arma', 
    img: '/assets/craft/espada_ferro.png', 
    custo: { madeira: 20, ferro: 10 }, tempo: 30, 
    reqNivel: 2,
    nivelItem: 5,
    stats: { ataque: 12, precisao: 3, danoCritico: 80, critico: 3  },
    atributoInativo: "Dano contra slimes +10%"
  },
  
  // --- ARMADURAS ---
  { 
    id: 'armadura_couro', nome: 'Armadura de Couro', 
    categoria: 'heroi',
    tipo: 'armadura', 
    custo: { couro: 10 }, tempo: 20, 
    reqNivel: 1,
    nivelItem: 5,
    img: '/assets/craft/armadura_couro.png',
    stats: { defesa: 3, evasao: 2, vida: 10, ataque: 1, critico: 1, 
      danoCritico: 10, magia: 1, defesaMagica: 2,},      
      atributoInativo: "Dano contra slimes +10%"
  },
  { 
    id: 'armadura_ferro', nome: 'Armadura de Ferro', 
    categoria: 'aventureiro',
    tipo: 'armadura', 
    custo: { ferro: 15, couro: 5 }, tempo: 60, 
    reqNivel: 2,
    nivelItem: 5,
    stats: { defesa: 10, evasao: -2 },
    atributoInativo: "Dano contra slimes +10%"
  },

  
  // --- MUNIÇÃO ---
  { 
    id: 'flecha_pedra', nome: 'Flechas de Pedra (x100)', 
    categoria: 'aventureiro',
    tipo: 'municao', 
    custo: { madeira: 100, pedra: 100 }, tempo: 20, qtd: 100, 
    reqNivel: 1,
    nivelItem: 102,
    stats: { ataque: 2, mana: 5  },
    atributoInativo: "Dano contra slimes +10%"
  }
];
// ------------------------------------------
// FIM TABELA DE ITENS CRAFTÁVEIS
// ------------------------------------------

// ------------------------------------------
// SISTEMA DE APRIMORAMENTO DE ITENS
// ------------------------------------------
export const DB_PEDRAS = {
    lista: [
        { 
            id: 'pedra_up_comum', 
            nome: 'Pedra do Aprendiz', 
            tier: 'comum',
                    // +1, +2, +3, +4,  +5,  +6, +7, +8...
            chances: [100, 80, 70, 50,  20,  10,  0,  0,  0,  0] 
        }, 
        { 
            id: 'pedra_up_rara', 
            nome: 'Pedra do Artesão', 
            tier: 'rara', 
                    // +1, +2,  +3, +4,  +5,  +6,  +7, +8,  +9,  +10
            chances: [100, 100, 90, 70,  65,  45,  30,  18,  5,  1] 
        }, 
        { 
            id: 'pedra_up_mitica', 
            nome: 'Pedra do Grão-Mestre', 
            tier: 'mitica', 
                    // +1, +2, +3,   +4,  +5,  +6, +7,  +8,  +9,  +10
            chances: [100, 100, 100, 100, 100, 75,  50,  30,  20,  10] 
        }
    ]
};

// ------------------------------------------
// FIM SISTEMA DE APRIMORAMENTO DE ITENS
// ------------------------------------------

// ------------------------------------------
// TABELA DE CARCAÇAS
// ------------------------------------------
export const tabelaCarcacas = [
  { 
    id: 'besouro_rinoceronte', nome: 'Besouro Rinoceronte', // NOME DA CARCAÇA
    tipo: 'recurso', categoria: 'carcaca',
    img: '/assets/monstros/besouro_rinoceronte.png', // IMAGEM DO MONSTRO NOS BOTOES
    imgCorpo: '/assets/monstros/besouro_rinoceronte.png', // IMAGEM DA CARCAÇA EM CIMA DA MESA DE PROCESSAMENTO
    desc: 'Pode ser processada para obter carne e couro.',
    tempo: 10, // TEMPO EM SEGUNDOS PARA PROCESSAR ESSA CARCAÇA
    recursos: { carne: 50, couro: 10 }, // RECURSOS OBTIDOS AO PROCESSAR ESSA CARCAÇA
    ambiente: 'Floresta Densa', // AMBIENTE ONDE É POSSÍVEL CAÇAR ESSA CARCAÇA
    tamanhoVisual: 200, // TAMANHO DA CARCAÇA NA MESA DE PROCESSAMENTO (PC)
    tamanhoMobile: 150, // TAMANHO DA CARCAÇA NA MESA DE PROCESSAMENTO (MOBILE)
    rotacaoVisual: 20, // ROTAÇÃO DA CARCAÇA NA MESA DE PROCESSAMENTO (PC)
    rotacaoMobile: 20, // ROTAÇÃO DA CARCAÇA NA MESA DE PROCESSAMENTO (MOBILE)
    paddingVisual: 165, // POSICIONAMENTO VERTICAL NA MESA DE PROCESSAMENTO (PC) + SOBE - DESCE
    paddingMobile: 165, // POSICIONAMENTO VERTICAL NA MESA DE PROCESSAMENTO (MOBILE)
    nivelRequerido: 1 // NÍVEL QUE LIBERA MISSAO PRA CAÇAR ESSA CARCAÇA
  },
  { 
    id: 'tatu_pedra', nome: 'Tatu Pedra', 
    tipo: 'recurso', categoria: 'carcaca',
    img: '/assets/monstros/tatu_pedra.png', 
    imgCorpo: '/assets/monstros/tatu_pedra.png',
    desc: 'Couro resistente e carne fibrosa.',
    tempo: 20, // 20 segundos
    recursos: { carne: 30, couro: 25 },
    ambiente: 'Montanhas Nevadas',
    tamanhoVisual: 160,
    tamanhoMobile: 150,
    rotacaoVisual: 20,
    rotacaoMobile: 20,
    paddingVisual: 165,
    paddingMobile: 165,
    nivelRequerido: 1
  },
  { 
    id: 'javali_da_vila', nome: 'Javali da Vila', 
    tipo: 'recurso', categoria: 'carcaca',
    img: '/assets/monstros/javali_da_vila.png', 
    imgCorpo: '/assets/monstros/javali_da_vila.png',
    desc: 'Uma enorme fonte de recursos.',
    tempo: 40, // 40 segundos
    recursos: { carne: 120, couro: 40 },
    ambiente: 'Planícies',
    tamanhoVisual: 300,
    tamanhoMobile: 150,
    rotacaoVisual: 20,
    rotacaoMobile: 20,
    paddingVisual: 165,
    paddingMobile: 165,
    nivelRequerido: 1
  },
  { 
    id: 'javali_de_granito', nome: 'Javali de Granito', 
    tipo: 'recurso', categoria: 'carcaca',
    img: '/assets/monstros/javali_de_granito.png', 
    imgCorpo: '/assets/monstros/javali_de_granito.png',
    desc: 'Uma enorme fonte de recursos.',
    tempo: 40, // 40 segundos
    recursos: { carne: 120, couro: 40 },
    ambiente: 'Planícies',
    tamanhoVisual: 305,
    tamanhoMobile: 150,
    rotacaoVisual: 20,
    rotacaoMobile: 20,
    paddingVisual: 165,
    paddingMobile: 165,
    nivelRequerido: 1
  },
  { 
    id: 'basilisco', nome: 'Basilisco', 
    tipo: 'recurso', categoria: 'carcaca',
    img: '/assets/monstros/basilisco.png', 
    imgCorpo: '/assets/monstros/basilisco.png',
    desc: 'Uma enorme fonte de recursos.',
    tempo: 40, // 40 segundos
    recursos: { carne: 120, couro: 40 },
    ambiente: 'Planícies',
    tamanhoVisual: 265,
    tamanhoMobile: 150,
    rotacaoVisual: 20,
    rotacaoMobile: 20,
    paddingVisual: 165,
    paddingMobile: 165,
    nivelRequerido: 10
  },
  { 
    id: 'lagarto_de_brasa', nome: 'Lagarto de Brasa', 
    tipo: 'recurso', categoria: 'carcaca',
    img: '/assets/monstros/lagarto_de_brasa.png', 
    imgCorpo: '/assets/monstros/lagarto_de_brasa.png',
    desc: 'Uma enorme fonte de recursos.',
    tempo: 40, // 40 segundos
    recursos: { carne: 120, couro: 40 },
    ambiente: 'Planícies',
    tamanhoVisual: 269,
    tamanhoMobile: 150,
    rotacaoVisual: 20,
    rotacaoMobile: 20,
    paddingVisual: 165,
    paddingMobile: 165,
    nivelRequerido: 7
  },
  {
    id: 'sand_scorpion', nome: 'Escorpião de Areia', 
    tipo: 'recurso', categoria: 'carcaca',
    img: '/assets/monstros/sand_scorpion.png', 
    imgCorpo: '/assets/monstros/sand_scorpion.png',
    desc: 'Uma enorme fonte de recursos.',
    tempo: 40, // 40 segundos
    recursos: { carne: 120, couro: 40 },
    ambiente: 'Planícies',
    tamanhoVisual: 200,
    tamanhoMobile: 150,
    rotacaoVisual: 20,
    rotacaoMobile: 20,
    paddingVisual: 165,
    paddingMobile: 165,
    nivelRequerido: 6
  },
  {
    id: 'magma_hyena', nome: 'Hiena de Magma', 
    tipo: 'recurso', categoria: 'carcaca',
    img: '/assets/monstros/magma_hyena.png', 
    imgCorpo: '/assets/monstros/magma_hyena.png',
    desc: 'Uma enorme fonte de recursos.',
    tempo: 60, // 40 segundos
    recursos: { carne: 100, couro: 100 },
    ambiente: 'Planícies',
    tamanhoVisual: 290,
    tamanhoMobile: 150,
    rotacaoVisual: -20,
    rotacaoMobile: 20,
    paddingVisual: 165,
    paddingMobile: 165,
    nivelRequerido: 2
  },
  {
    id: 'salamandra', nome: 'Salamandra', 
    tipo: 'recurso', categoria: 'carcaca',
    img: '/assets/monstros/salamandra.png', 
    imgCorpo: '/assets/monstros/salamandra.png',
    desc: 'Uma enorme fonte de recursos.',
    tempo: 40, // 40 segundos
    recursos: { carne: 120, couro: 40 },
    ambiente: 'Planícies',
    tamanhoVisual: 250,
    tamanhoMobile: 150,
    rotacaoVisual: 20,
    rotacaoMobile: 20,
    paddingVisual: 165,
    paddingMobile: 165,
    nivelRequerido: 3
  },
  {
    id: 'fire_serpe', nome: 'Serpe de Fogo', 
    tipo: 'recurso', categoria: 'carcaca',
    img: '/assets/monstros/fire_serpe.png', 
    imgCorpo: '/assets/monstros/fire_serpe.png',
    desc: 'Uma enorme fonte de recursos.',
    tempo: 40, // 40 segundos
    recursos: { carne: 120, couro: 40 },
    ambiente: 'Planícies',
    tamanhoVisual: 430,
    tamanhoMobile: 150,
    rotacaoVisual: 20,
    rotacaoMobile: 20,
    paddingVisual: 165,
    paddingMobile: 165,
    nivelRequerido: 4
  },
  {
    id: 'snow_fox', nome: 'Raposa de Neve', 
    tipo: 'recurso', categoria: 'carcaca',
    img: '/assets/monstros/snow_fox.png', 
    imgCorpo: '/assets/monstros/snow_fox.png',
    desc: 'Uma enorme fonte de recursos.',
    tempo: 40, // 40 segundos
    recursos: { carne: 120, couro: 40 },
    ambiente: 'Planícies',
    tamanhoVisual: 280,
    tamanhoMobile: 150,
    rotacaoVisual: -25,
    rotacaoMobile: 20,
    paddingVisual: 175,
    paddingMobile: 175,
    nivelRequerido: 5
  }
];
// ------------------------------------------
// FIM TABELA DE CARCAÇAS
// ------------------------------------------
// ==========================================
// CONFIGURAÇÃO GLOBAL DE BALANCEAMENTO (MEDICINA)
// Edite aqui para alterar a velocidade de TODOS os itens de uma vez.
// ==========================================
const CONFIG_CURA = {
    1: 1.0,  // Tier 1 (Básico)   - Velocidade Normal
    2: 1.5,  // Tier 2 (Avançado) - +50% Velocidade
    3: 3.0,  // Tier 3 (Elite)    - 3x mais rápido
    4: 6.0   // Tier 4 (Lendário) - 6x mais rápido
};

// ------------------------------------------
// CATALOGO DE MEDICAMENTOS
// Nota: O 'fatorCura' agora puxa automaticamente da CONFIG_CURA acima
// ------------------------------------------
const listaRawMedicamentos = [
    // --- BANDAGENS ---
    ['bandagem_comum',     'bandagem', 1, 'Bandagem de Linho',     '🩹', 'Tecido simples para estancar sangue.',  'Cura ferimentos leves (Nível 1).',      'Tenda do Costureiro', 1],
    ['bandagem_seda',      'bandagem', 2, 'Bandagem de Seda',      '🧻', 'Tecido nobre, limpo e tratado.',        'Cura até Nível 2 (Combate).',           'Tenda do Costureiro II', 3],
    ['bandagem_magica',    'bandagem', 3, 'Bandagem Mágica',       '✨', 'Impregnada com pó de fada.',            'Cura até Nível 3 (Hemorragias).',       'Torre do Mago', 6],
    ['bandagem_aetherium', 'bandagem', 4, 'Bandagem de Aetherium', '🌌', 'Tecido dimensional fecha a pele.',      'Cura TUDO (Nível 1 a 4).',              'Forja do Vazio', 10],

    // --- POÇÕES ---
    ['pocao_vida_p', 'pocao', 1, 'Poção Menor',      '🍷', 'Mistura básica de ervas vermelhas.',      'Trata dores leves (Nível 1).',          'Alquimista', 1],
    ['pocao_vida_m', 'pocao', 2, 'Poção Média',      '🧪', 'Concentrado vital destilado.',            'Trata danos internos (Nível 2).',       'Alquimista II', 3],
    ['pocao_vida_g', 'pocao', 3, 'Poção Maior',      '🏺', 'Líquido espesso que regenera órgãos.',    'Trata falência orgânica (Nível 3).',    'Laboratório Mestre', 7],
    ['elixir_vida',  'pocao', 4, 'Elixir da Vida',   '🩸', 'Gotas do próprio sangue de um Titã.',     'Ressuscita quase mortos (Nível 4).',    'Altar da Vida', 12],

    // --- ERVAS ---
    ['ervas_comuns',     'ervas', 1, 'Ervas Medicinais',   '🌿', 'Folhas secas para chás simples.',         'Trata resfriados (Nível 1).',           'Horta', 1],
    ['cataplasma_musgo', 'ervas', 2, 'Musgo de Caverna',   '🍵', 'Pasta verde que puxa toxinas.',           'Trata infecções (Nível 2).',            'Estufa Subterrânea', 3],
    ['raiz_mandragora',  'ervas', 3, 'Raiz de Mandrágora', '🥕', 'Raiz que grita. Mata bactérias mágicas.', 'Trata pragas graves (Nível 3).',        'Jardim Proibido', 6],
    ['flor_luz',         'ervas', 4, 'Flor da Luz',        '🌺', 'Só floresce uma vez a cada 100 anos.',    'Purifica qualquer mal (Nível 4).',      'Topo do Mundo', 11],

    // --- TALAS ---
    ['tala_madeira', 'talas', 1, 'Tala de Madeira',      '🪵', 'Galhos amarrados com corda.',             'Imobiliza torções (Nível 1).',          'Carpintaria', 1],
    ['tala_ferro',   'talas', 2, 'Tala Reforçada',       '🔧', 'Hastes de ferro com acolchoamento.',      'Suporta ossos quebrados (Nível 2).',    'Ferraria', 4],
    ['tala_mithril', 'talas', 3, 'Exoesqueleto Mithril', '🔩', 'Leve como pena, duro como diamante.',     'Reestrutura esmagamentos (Nível 3).',  'Forja Mágica', 8],
    ['tala_runica',  'talas', 4, 'Suporte Rúnico',       '💠', 'Mantém o corpo junto com magia pura.',      'Solda ossos instantaneamente (Nível 4).','Santuário', 12],

    // --- POMADAS ---
    ['pomada_base',   'pomadas', 1, 'Pomada Básica',    '🧴', 'Gordura animal misturada com cera.',      'Hidrata queimaduras solares (Nível 1).','Cozinha', 1],
    ['pomada_aloe',   'pomadas', 2, 'Gel de Aloe Vera', '🌵', 'Extrato refrescante para fogo e ácido.',  'Trata 2º grau e corrosão (Nível 2).',   'Herbalista', 3],
    ['unguento_gelo', 'pomadas', 3, 'Unguento Glacial', '❄️', 'Feito com gelo que nunca derrete.',       'Anula calor extremo (Nível 3).',        'Alquimista de Gelo', 7],
    ['balsamo_fenix', 'pomadas', 4, 'Bálsamo de Fênix', '🔥', 'Cinzas de fênix misturadas com óleo.',    'Regenera pele destruída (Nível 4).',    'Templo do Sol', 13],

    // --- ANTIDOTOS ---
    ['antidoto_p',        'antidotos', 1, 'Antídoto Caseiro',    '🥛', 'Leite com carvão ativado.',             'Cura indigestão (Nível 1).',            'Cozinha', 1],
    ['soro_ofidico',      'antidotos', 2, 'Soro Antiofídico',    '💉', 'Extraído de cobras comuns.',            'Neutraliza picadas (Nível 2).',         'Laboratório', 4],
    ['panaceia',          'antidotos', 3, 'Panaceia Universal',  '⚗️', 'Mistura complexa de 50 ervas.',         'Cura toxinas letais (Nível 3).',        'Mestre Alquimista', 8],
    ['lagrima_unicornio', 'antidotos', 4, 'Lágrima de Unicórnio','🦄', 'A substância mais pura do mundo.',      'Expurga qualquer veneno (Nível 4).',    'Evento Raro', 15],

    // --- TÔNICOS ---
    ['tonico_revigorante', 'tonicos', 1, 'Água Termal',          '🍵', 'Água mineral enriquecida.',             'Alivia cansaço leve (Nível 1).',        'Fonte', 1],
    ['bebida_energetica',  'tonicos', 2, 'Café de Batalha',      '☕', 'Concentrado de grãos estimulantes.',    'Reseta exaustão física (Nível 2).',     'Taverna', 3],
    ['extrato_adrenalina', 'tonicos', 3, 'Injeção de Adrenalina','⚡', 'Extraído de glândulas de monstros.',    'Levanta mortos de cansaço (Nível 3).',  'Laboratório', 7],
    ['nectar_deuses',      'tonicos', 4, 'Néctar dos Deuses',    '🍷', 'Ambrosia dourada.',                     'Restaura vitalidade divina (Nível 4).', 'Olimpo', 14],

    // --- TALISMÃS ---
    ['talisma_cura',     'talisma', 1, 'Talismã de Papel', '📜', 'Selo rúnico básico.',                 'Afasta má sorte (Nível 1).',            'Escriba', 2],
    ['amuleto_prata',    'talisma', 2, 'Amuleto de Prata', '🧿', 'Prata abençoada repele espectros.',   'Quebra maldições (Nível 2).',           'Ourives', 5],
    ['totem_ouro',       'talisma', 3, 'Totem Dourado',    '🗿', 'Estatueta que absorve magia negra.',  'Exorciza possessões (Nível 3).',        'Templo', 9],
    ['reliquia_sagrada', 'talisma', 4, 'Relíquia Sagrada', '👑', 'Fragmento de um anjo caído.',         'Restaura a alma (Nível 4).',            'Catedral', 15]
];

// --- GERADOR AUTOMÁTICO DE OBJETOS ---
export const catalogoMedicamentos = listaRawMedicamentos.map(([id, categoria, nivelItem, nome, icon, desc, funcao, onde, nivelReq]) => {
    // Pega o fator de cura da configuração global com base no nível do item
    const fatorCura = CONFIG_CURA[nivelItem];
    
    // Define o texto da velocidade automaticamente
    const textosVelocidade = { 1: 'Normal', 2: 'Média', 3: 'Alta', 4: 'Divina' };
    const textoVel = textosVelocidade[nivelItem] || 'Desconhecida';

    // Retorna o objeto completo formatado
    return {
        id, categoria, nivelItem, fatorCura, nome, icon, desc, funcao, onde, nivelReq,
        poder: `Velocidade ${textoVel} (${fatorCura}x)`
    };
});
// ------------------------------------------
// TIPOS DE FERIMENTOS E DOENÇAS
// ------------------------------------------
const listaRawFerimentos = [
    // --- BANDAGENS ---
    // --- NÍVEL 1 ---
    ['corte_pergaminho', 'Corte de Pergaminho', 600, 'bandagem', 1, 'Acidente de escritório. Afeta: Acadêmicos, Tesoureiros e Lordes'],
    ['corte_rebarba', 'Corte de Rebarba', 900, 'bandagem', 1, 'Metal ou madeira mal lixada. Afeta: Ferreiros e Lenhadores'],
    ['corte_faca_esfolar', 'Dedo Cortado', 900, 'bandagem', 1, 'A faca escorregou na carne. Afeta: Esfoladores e Cozinheiros.'],
    ['arranhao_pedra', 'Arranhão de Pedra', 1200, 'bandagem', 1, 'Pedra lascada comum. Afeta: Mineradores (Início de jogo).'],
    ['arranhao_slime', 'Investida de Slime', 1200, 'bandagem', 1, 'Golpe básico de monstros de nível baixo.'],
    // --- NÍVEL 2 ---
    ['corte_sabre_goblin', 'Corte de Sabre Goblin', 2700, 'bandagem', 2, 'Lâmina serrilhada e suja usada por batedores goblins.'],
    ['mordida_warg', 'Mordida de Warg', 4500, 'bandagem', 2, 'Dentes profundos que rasgam a armadura de couro.'],
    ['flechada_perfurante', 'Flechada Perfurante', 5400, 'bandagem', 2, 'Atravessou o ombro. Requer remoção cuidadosa.'],
    ['corte_garras_urso', 'Garras de Urso-Coruja', 7200, 'bandagem', 2, 'Três cortes paralelos profundos no peito.'],
    // --- NÍVEL 3 ---
    ['corte_obsidiana', 'Corte de Obsidiana', 14400, 'bandagem', 3, 'Acidente de Mineração Late-Game. O vidro vulcânico corta até o osso.'],
    ['hemorragia_critica', 'Hemorragia Crítica', 16200, 'bandagem', 3, 'Dano massivo causado por um Boss de Masmorra.'],
    ['perfuracao_lanca_cavaleiro', 'Estocada de Lança', 18000, 'bandagem', 3, 'Golpe de um Cavaleiro Negro. Ferida aberta e extensa.'],
    ['retalhado_por_laminas', 'Retalhado', 21600, 'bandagem', 3, 'Caiu em uma armadilha de lâminas giratórias.'],
    // --- NÍVEL 4 ---
    ['corte_vacuo', 'Corte do Vácuo', 28800, 'bandagem', 4, 'Atingido por magia espacial. A pele não existe mais nessa dimensão.'],
    ['mordida_dragao_ances', 'Presas do Dragão', 36000, 'bandagem', 4, 'Ferida causada por um ser divino. Quase impossível de estancar.'],
    ['ferida_eterna_rei_demonio', 'A Marca do Rei Demônio', 43200, 'bandagem', 4, 'Um corte amaldiçoado que sangra escuridão. Exige bandagens sagradas.'],
    // --- POÇOES ---
    // --- NÍVEL 1 ---
    ['queda_mina', 'Queda de Andaime', 600, 'pocao', 1, 'Acidente de trabalho. O minerador caiu de uma altura média.'],
    ['hematomas_globais', 'Hematomas de Combate', 900, 'pocao', 1, 'Múltiplos impactos de clavas ou pedras de Goblins.'],
    ['impacto_escudo', 'Impacto no Escudo', 1200, 'pocao', 1, 'O bloqueio foi bem sucedido, mas o braço ficou dormente pelo choque.'],
    ['falta_de_ar', 'Golpe no Estômago', 1500, 'pocao', 1, 'Um chute ou soco que tirou o ar. Dano interno leve.'],
    ['concussao_leve', 'Tontura de Batalha', 1800, 'pocao', 1, 'Atingido de raspão na cabeça. Visão turva temporária.'],
    // --- NÍVEL 2 ---
    ['costelas_trincadas', 'Costelas Trincadas', 2700, 'pocao', 2, 'Golpe de clava de um Orc ou Ogro. Dói ao respirar.'],
    ['sangramento_interno', 'Hemorragia Gástrica', 3600, 'pocao', 2, 'Causado por quedas altas ou magias de impacto sônico.'],
    ['rebote_magico', 'Rebote de Mana', 5400, 'pocao', 2, 'A magia falhou e explodiu internamente. Afeta Magos e Alquimistas.'],
    ['esmagamento_leve', 'Compressão Torácica', 7200, 'pocao', 2, 'Pego por uma Jiboia Gigante ou tentáculo.'],
    // --- NÍVEL 3 ---
    ['ruptura_baco', 'Ruptura de Órgão', 14400, 'pocao', 3, 'Dano crítico de um Boss. Requer regeneração mágica acelerada.'],
    ['pulmao_perfurado', 'Pulmão Perfurado', 18000, 'pocao', 3, 'Dificuldade extrema de respiração. Poção deve ser injetada direto na veia.'],
    ['dreno_vital_vampiro', 'Exsanguinação Mística', 21600, 'pocao', 3, 'Vítima de um Vampiro Lorde. O corpo está quase sem fluídos.'],
    // --- NÍVEL 4 ---
    ['colapso_nucleo_mana', 'Colapso do Núcleo de Mana', 28800, 'pocao', 4, 'O corpo físico não suporta mais a magia. Risco de explosão corporal.'],
    ['corpo_quebrado', 'Todos os Ossos Quebrados', 36000, 'pocao', 4, 'Caiu de um penhasco abissal ou foi pisado por um Titã.'],
    ['alma_desancorada', 'Alma Desancorada', 43200, 'pocao', 4, 'O HP chegou a zero, mas o herói se recusou a morrer. Estado crítico.'],
    // --- ERVAS ---
    // --- NÍVEL 1 ---
    ['alergia_polen', 'Alergia a Pólen', 600, 'ervas', 1, 'Nariz escorrendo e olhos inchados. Afeta a produtividade na floresta.'],
    ['resfriado_comum', 'Resfriado da Chuva', 900, 'ervas', 1, 'Pegou chuva voltando da caçada. Tosse leve.'],
    ['erupcao_urtiga', 'Erupção de Urtiga', 1200, 'ervas', 1, 'Contato com plantas irritantes. Coceira insuportável.'],
    ['infeccao_unha', 'Infecção na Unha', 1500, 'ervas', 1, 'Sujeira da terra entrou sob a unha. Dedo pulsando.'],
    ['boca_do_mineiro', 'Tosse de Poeira', 1800, 'ervas', 1, 'Inalação de pó de pedra comum. Garganta seca e irritada.'],
    // --- NÍVEL 2 ---
    ['febre_do_pantano', 'Febre do Pântano', 2700, 'ervas', 2, 'Contraída ao viajar por áreas alagadas. Suor frio e tremores.'],
    ['fungo_de_caverna', 'Esporos de Caverna', 3600, 'ervas', 2, 'Fungo que cresce na pele de quem fica muito tempo no escuro (Minas).'],
    ['infeccao_necrotica_leve', 'Dedo de Cadáver', 5400, 'ervas', 2, 'Infecção bacteriana ao esfolar monstros mortos-vivos.'],
    ['parasita_intestinal', 'Parasita Intestinal', 7200, 'ervas', 2, 'Ingestão de água não tratada ou carne mal cozida.'],
    // --- NÍVEL 3 ---
    ['febre_do_ouro_toxica', 'Toxicidade Áurea', 14400, 'ervas', 3, 'O sangue começa a endurecer pelo contato excessivo com ouro mágico.'],
    ['gangrena_magica', 'Gangrena Mágica', 18000, 'ervas', 3, 'A carne está apodrecendo rapidamente devido a feitiços de decomposição.'],
    ['praga_dos_ratos', 'Peste Bubônica Rúnica', 21600, 'ervas', 3, 'Variação mágica da peste negra transmitida por ratos de masmorra.'],
    // --- NÍVEL 4 ---
    ['parasita_cerebral', 'Larva Devoradora de Mente', 28800, 'ervas', 4, 'Implantada por Illithids. Requer ervas raras para expurgar sem matar o hospedeiro.'],
    ['podidao_divina', 'Podridão de Nurg', 36000, 'ervas', 4, 'Uma doença criada por um Deus da Praga. O corpo se desfaz em lodo.'],
    ['esporos_zumbificantes', 'Fungo Cordyceps Titânico', 43200, 'ervas', 4, 'O fungo tenta controlar o sistema nervoso central. Tratamento agonizante.'],
    // --- TALAS ---
    // --- NÍVEL 1 ---
    ['dedo_martelado', 'Dedo Martelado', 600, 'talas', 1, 'Erro clássico de aprendiz na Ferraria ou Construção.'],
    ['torcao_tornozelo', 'Tornozelo Torcido', 900, 'talas', 1, 'Pisou em falso numa pedra solta na mina ou floresta.'],
    ['pulso_aberto', 'Pulso Aberto', 1200, 'talas', 1, 'Recuo excessivo ao bater com a picareta ou machado.'],
    ['ombro_deslocado_leve', 'Ombro Deslocado', 1500, 'talas', 1, 'Esforço exagerado ao carregar baús pesados (Tesoureiros).'],
    ['fissura_canela', 'Fissura na Tíbia', 1800, 'talas', 1, 'Chute bloqueado de forma errada no treinamento.'],
    // --- NÍVEL 2 ---
    ['braco_quebrado_escudo', 'Braço do Escudo Quebrado', 2700, 'talas', 2, 'O impacto no escudo foi tão forte que partiu o osso atrás dele.'],
    ['pedra_na_cabeca', 'Traumatismo Craniano Leve', 3600, 'talas', 2, 'Uma pedra média caiu do teto da mina. Requer colar cervical.'],
    ['golpe_de_maca', 'Fratura por Maça', 5400, 'talas', 2, 'Golpe direto de uma arma contundente. Osso partido em dois.'],
    ['costelas_esmagadas', 'Abraço de Urso', 7200, 'talas', 2, 'Apertado por uma besta selvagem até as costelas cederem.'],
    // --- NÍVEL 3 ---
    ['fissura_vibracao_mithril', 'Fratura de Ressonância', 14400, 'talas', 3, 'A frequência sonora ao bater no Mithril estilhaçou os ossos da mão.'],
    ['pisao_gigante', 'Pisão de Gigante', 18000, 'talas', 3, 'A perna foi achatada. Requer reconstrução óssea complexa.'],
    ['coluna_comprometida', 'Lesão na Coluna', 21600, 'talas', 3, 'Arremessado contra uma parede de pedra por um Boss.'],
    // --- NÍVEL 4 ---
    ['ossos_de_vidro', 'Maldição dos Ossos de Vidro', 28800, 'talas', 4, 'Magia que torna o esqueleto frágil. Requer suporte corporal total.'],
    ['esmagamento_gravitacional', 'Singularidade Gravitacional', 36000, 'talas', 4, 'Atingido por magia de buraco negro. O corpo foi compactado.'],
    ['pulverizacao_titanica', 'Ossos Pulverizados', 43200, 'talas', 4, 'O osso virou pó após golpe de um Titã. Requer talas mágicas de suporte.'],
    // --- POMADAS ---
    // --- NÍVEL 1 ---
    ['queimadura_solar', 'Insolação Severa', 600, 'pomadas', 1, 'Trabalhou o dia todo no campo sem proteção.'],
    ['respingo_oleo', 'Respingo de Óleo', 900, 'pomadas', 1, 'Acidente na cozinha da Taverna ou na manutenção de máquinas.'],
    ['fagulha_olho', 'Fagulha no Rosto', 1200, 'pomadas', 1, 'O Ferreiro esqueceu de usar a viseira de proteção.'],
    ['frieira_magica', 'Frieira de Masmorra', 1500, 'pomadas', 1, 'Pisou em poças de água gelada em cavernas úmidas.'],
    ['irritacao_alquimica', 'Mancha Ácida', 1800, 'pomadas', 1, 'Derrubou reagente básico na mão durante um experimento.'],
    // --- NÍVEL 2 ---
    ['bola_fogo_raspao', 'Chamuscado por Bola de Fogo', 2700, 'pomadas', 2, 'Atingido pela área de explosão de um feitiço ígneo.'],
    ['congelamento_dedos', 'Congelamento de Extremidades', 3600, 'pomadas', 2, 'Atingido por um Sopro de Gelo. Dedos roxos e sem sensibilidade.'],
    ['acido_slime', 'Corrosão de Slime', 5400, 'pomadas', 2, 'O Slime tentou digerir o braço do herói. A pele está em carne viva.'],
    ['escaldadura_vapor', 'Escaldadura de Vapor', 7200, 'pomadas', 2, 'Armadilha de pressão ou explosão de caldeira.'],
    // --- NÍVEL 3 ---
    ['carbonizacao_parcial', 'Carbonização Parcial', 14400, 'pomadas', 3, 'Contato direto com lava ou bafo de Dragão Vermelho.'],
    ['necrose_gelida', 'Necrose Gélida', 18000, 'pomadas', 3, 'O tecido morreu devido ao frio extremo causado por um Lich de Gelo.'],
    ['corrosao_armadura', 'Fusão de Metal na Pele', 21600, 'pomadas', 3, 'O ácido era tão forte que derreteu a armadura sobre o corpo.'],
    // --- NÍVEL 4 ---
    ['chama_eterna', 'Maldição da Chama Eterna', 28800, 'pomadas', 4, 'Fogo do Inferno que não apaga com água. Requer unguento sagrado.'],
    ['zero_absoluto', 'Toque do Zero Absoluto', 36000, 'pomadas', 4, 'As células foram paralisadas no tempo pelo frio divino.'],
    ['dissolucao_total', 'Dissolução Caótica', 43200, 'pomadas', 4, 'Cuspe de uma Hidra Lendária. O corpo está literalmente derretendo.'],
    // --- ANTIDOTOS ---
    // --- NÍVEL 1 ---
    ['indigestao_racao', 'Indigestão de Ração', 600, 'antidotos', 1, 'A ração de viagem estava vencida. Enjoo leve.'],
    ['picada_abelha_gigante', 'Picada de Abelha', 900, 'antidotos', 1, 'Inchaço localizado causado por insetos da floresta.'],
    ['bagas_alucinogenas', 'Bagas Alucinógenas', 1200, 'antidotos', 1, 'Comeu frutas da floresta sem saber o que eram. Visão colorida.'],
    ['gas_de_pantano_leve', 'Tontura de Metano', 1500, 'antidotos', 1, 'Respirou gás de pântano por muito tempo. Dor de cabeça.'],
    ['ferrao_escorpiao_areia', 'Ferrão de Escorpião P', 1800, 'antidotos', 1, 'Escorpião pequeno comum em minas de areia/arenito.'],
    // --- NÍVEL 2 ---
    ['veneno_aranha_lobo', 'Veneno de Aranha-Lobo', 2700, 'antidotos', 2, 'Causa paralisia muscular local e febre alta.'],
    ['mordida_cobra_coral', 'Neurotoxina de Serpente', 3600, 'antidotos', 2, 'Veneno que ataca o sistema nervoso. Requer soro rápido.'],
    ['dardo_goblin', 'Dardo Envenenado', 5400, 'antidotos', 2, 'Armadilha goblin untada com extrato de raiz paralisante.'],
    ['intoxicacao_mercurio', 'Envenenamento por Mercúrio', 7200, 'antidotos', 2, 'Acidente de laboratório ao tentar transmutar metais (Alquimistas).'],
    // --- NÍVEL 3 ---
    ['gas_da_morte', 'Gás Mostarda Mágico', 14400, 'antidotos', 3, 'Nuvem tóxica criada por Liches. Derrete os pulmões.'],
    ['veneno_quimera', 'Peçonha de Quimera', 18000, 'antidotos', 3, 'Uma mistura complexa de venenos de cabra, leão e cobra.'],
    ['sangue_acido_alien', 'Sangue Corrosivo', 21600, 'antidotos', 3, 'Contato com sangue de aberrações do vazio. Envenena o sangue.'],
    // --- NÍVEL 4 ---
    ['petrificacao_basilisco', 'Maldição de Pedra (Basilisco)', 28800, 'antidotos', 4, 'O veneno está transformando o sangue em pedra lentamente.'],
    ['alento_dragao_verde', 'Sopro de Cloro Viroso', 36000, 'antidotos', 4, 'Baforada de um Dragão Verde Antigo. Apodrece a carne instantaneamente.'],
    ['veneno_dos_deuses', 'Ichor Corrompido', 43200, 'antidotos', 4, 'Um veneno capaz de matar imortais. Requer antídoto divino.'],
    // --- TONICOS ---
    // --- NÍVEL 1 ---
    ['sonolencia_pos_almoco', 'Sonolência Pesada', 600, 'tonicos', 1, 'A refeição foi farta demais. Produtividade caiu 50%.'],
    ['fadiga_ocular', 'Vista Cansada', 900, 'tonicos', 1, 'Muitas horas lendo pergaminhos ou inspecionando joias.'],
    ['cambra_panturrilha', 'Cãibra Muscular', 1200, 'tonicos', 1, 'Desidratação leve após correr ou carregar peso.'],
    ['tremedeira_maos', 'Mãos Trêmulas', 1500, 'tonicos', 1, 'Excesso de precisão exigida na ourivesaria ou cirurgia.'],
    ['dor_nas_costas', 'Lombar Travada', 1800, 'tonicos', 1, 'Muitas horas curvado minerando ou plantando.'],
    // --- NÍVEL 2 ---
    ['esgotamento_mana_leve', 'Ressaca de Mana', 2700, 'tonicos', 2, 'O Mago usou todos os slots de magia. Cabeça latejando.'],
    ['musculo_travado', 'Rigidez Cadavérica Temporária', 3600, 'tonicos', 2, 'O corpo travou após a adrenalina da batalha baixar.'],
    ['hipotermia_leve', 'Frio nos Ossos', 5400, 'tonicos', 2, 'Passou a noite de vigília na chuva fria.'],
    ['surdez_temporaria', 'Zumbido de Explosão', 7200, 'tonicos', 2, 'Ficou muito perto de um canhão ou magia sônica.'],
    // --- NÍVEL 3 ---
    ['efeito_berserk', 'Rebote de Berserk', 14400, 'tonicos', 3, 'Usou a habilidade "Fúria". Agora o corpo não responde.'],
    ['burnout_arcano', 'Burnout Arcano', 18000, 'tonicos', 3, 'Tentou conjurar magia acima do nível. Canais de mana queimados.'],
    ['dreno_sucubus', 'Dreno Vital', 21600, 'tonicos', 3, 'Teve a energia vital sugada por um demônio ou espectro.'],
    // --- NÍVEL 4 ---
    ['coma_magico', 'Coma Mágico', 28800, 'tonicos', 4, 'A mente se desligou para proteger a alma de se dissipar.'],
    ['velhice_acelerada', 'Toque do Tempo', 36000, 'tonicos', 4, 'Envelheceu 50 anos em segundos devido a magia cronomante.'],
    ['vazio_interior', 'Oco Existencial', 43200, 'tonicos', 4, 'Encarou o Abismo e ele olhou de volta. Requer Tônico da Esperança.'],
    // --- TALISMAS ---
    // --- NÍVEL 1 ---
    ['mau_olhado', 'Mau Olhado', 600, 'talisma', 1, 'Inveja de vizinhos ou mercadores rivais. Causa má sorte leve.'],
    ['sussurros_noturnos', 'Sussurros Noturnos', 900, 'talisma', 1, 'Dormiu perto de ruínas antigas. Vozes atrapalham o foco.'],
    ['aura_fria', 'Aura Fria', 1200, 'talisma', 1, 'Passou por um cemitério à noite. Arrepios constantes.'],
    ['azar_repentino', 'Azar de Duende', 1500, 'talisma', 1, 'Tropeça nos próprios pés. Maldição travessa de fadas.'],
    ['paralisia_do_sono', 'Vulto no Quarto', 1800, 'talisma', 1, 'Acordou mas não conseguia se mexer. Energia espiritual baixa.'],
    // --- NÍVEL 2 ---
    ['toque_espectral', 'Toque de Banshee', 2700, 'talisma', 2, 'Um fantasma atravessou o corpo do herói. Dano na alma.'],
    ['silencio_maldito', 'Selo de Silêncio', 3600, 'talisma', 2, 'Maldição de mago rival. Impede a fala e o canto.'],
    ['marca_da_bruxa', 'Marca da Bruxa', 5400, 'talisma', 2, 'Um símbolo apareceu na pele. Atrai corvos e raios.'],
    ['poltergeist_pessoal', 'Poltergeist Pessoal', 7200, 'talisma', 2, 'Objetos voam na direção do trabalhador. Risco alto de acidente.'],
    // --- NÍVEL 3 ---
    ['possessao_imperfecta', 'Possessão Demoníaca Leve', 14400, 'talisma', 3, 'Um demônio menor está tentando controlar o braço do herói.'],
    ['maldicao_mumia', 'Maldição do Faraó', 18000, 'talisma', 3, 'Abriu um sarcófago proibido. A carne está virando areia.'],
    ['vampirismo_astral', 'Vampirismo Astral', 21600, 'talisma', 3, 'A energia vital não regenera mais. Requer exorcismo potente.'],
    // --- NÍVEL 4 ---
    ['fragmentacao_alma', 'Alma Fragmentada', 28800, 'talisma', 4, 'Atingido por uma lâmina Lich. Parte da alma ficou na masmorra.'],
    ['destino_quebrado', 'Fio do Destino Cortado', 36000, 'talisma', 4, 'Ofendeu um Deus menor. A própria existência está instável.'],
    ['corrupcao_void', 'Chamado do Vazio', 43200, 'talisma', 4, 'Encarou o abismo por muito tempo. Loucura Lovecraftiana.']
];
export const tiposFerimentos = Object.fromEntries(
    listaRawFerimentos.map(([id, nome, tempo, cat, nivel, desc]) => [
        id, 
        { nome, tempoBase: tempo, reqCategoria: cat, nivelSeveridade: nivel, desc }
    ])
);
// ------------------------------------------
// FIM TIPOS DE FERIMENTOS E DOENÇAS
// ------------------------------------------
// ------------------------------------------
// INFO DAS CATEGORIAS MEDICAMENTOS
// ------------------------------------------
const listaRawCategorias = [
    ['bandagem',  'Curativos',  '🩹',  'Materiais para estancar sangramentos.'],
    ['pocao',     'Poções',     '🧪',  'Compostos alquímicos para regeneração.'],
    ['ervas',     'Ervas',      '🌿',  'Plantas naturais para combater infecções.'],
    ['talas',     'Talas',      '🩻',  'Suportes para ossos quebrados.'],
    ['pomadas',   'Pomadas',    '🧴',  'Tratamento para queimaduras.'],
    ['antidotos', 'Antídotos',  '☠️',  'Neutraliza venenos e toxinas.'],
    ['tonicos',   'Tônico',     '⚗️',  'Restaura vigor e energia.'],
    ['talisma',   'Talismãs',   '🧿',  'Artefatos místicos de proteção.']
];

export const infoCategorias = Object.fromEntries(
    listaRawCategorias.map(([id, nome, icon, desc]) => [
        id, 
        { nome, icon, desc }
    ])
);
// PROFISSOES COM NOMES MASCULINOS E FEMININOS
export const nomeProfissao = (func) => {
      const mapa = {
            'minerador': { m: 'Minerador', f: 'Mineradora' },
            'lenhador':  { m: 'Lenhador',  f: 'Lenhadora' },
            'esfolador':   { m: 'Esfolador',   f: 'Esfoladora' },
            'ferreiro':  { m: 'Ferreiro',  f: 'Ferreira' },
            'saqueador': { m: 'Saqueador',  f: 'Saqueadora' },
            'batedor':   { m: 'Batedor',    f: 'Batedora' },
            'heroi': { m: 'Herói', f: 'Heroína' },
            'academico':     { m: 'Acadêmico',   f: 'Acadêmica' },
            'administrador': { m: 'Administrador', f: 'Administradora' },
            'enfermeiro':    { m: 'Enfermeiro',  f: 'Enfermeira' },
            'lorde':         { m: 'Lorde',       f: 'Lady' },
            'tesoureiro':    { m: 'Tesoureiro',  f: 'Tesoureira' }
        };
      const p = func.profissao.toLowerCase();
      if (!mapa[p]) return p.charAt(0).toUpperCase() + p.slice(1);
      return func.sexo === 'feminino' ? mapa[p].f : mapa[p].m;
  };