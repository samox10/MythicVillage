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
export const catalogoMedicamentos = [
    // --- CATEGORIA: BANDAGENS (Curativos) ---
    { 
        id: 'bandagem_comum', 
        categoria: 'bandagem', 
        nivelItem: 1, 
        fatorCura: CONFIG_CURA[1], // <--- Puxa 1.0
        nome: 'Bandagem de Linho', 
        icon: '🩹', 
        desc: 'Tecido simples para estancar sangue.',
        funcao: 'Cura ferimentos leves (Nível 1).',
        poder: `Velocidade Normal (${CONFIG_CURA[1]}x)`,
        onde: 'Tenda do Costureiro',
        nivelReq: 1 
    },
    { 
        id: 'bandagem_seda', 
        categoria: 'bandagem', 
        nivelItem: 2, 
        fatorCura: CONFIG_CURA[2], // <--- Puxa 1.5
        nome: 'Bandagem de Seda', 
        icon: '🧻', 
        desc: 'Tecido nobre, limpo e tratado.',
        funcao: 'Cura até Nível 2 (Combate).',
        poder: `Velocidade Média (${CONFIG_CURA[2]}x)`,
        onde: 'Tenda do Costureiro II',
        nivelReq: 3 
    },
    { 
        id: 'bandagem_magica', 
        categoria: 'bandagem', 
        nivelItem: 3, 
        fatorCura: CONFIG_CURA[3], // <--- Puxa 3.0
        nome: 'Bandagem Mágica', 
        icon: '✨', 
        desc: 'Impregnada com pó de fada.',
        funcao: 'Cura até Nível 3 (Hemorragias).',
        poder: `Velocidade Alta (${CONFIG_CURA[3]}x)`,
        onde: 'Torre do Mago',
        nivelReq: 6 
    },
    { 
        id: 'bandagem_aetherium', 
        categoria: 'bandagem', 
        nivelItem: 4, 
        fatorCura: CONFIG_CURA[4], // <--- Puxa 6.0
        nome: 'Bandagem de Aetherium', 
        icon: '🌌', 
        desc: 'Tecido dimensional que fecha a pele instantaneamente.',
        funcao: 'Cura TUDO (Nível 1 a 4).',
        poder: `Velocidade Divina (${CONFIG_CURA[4]}x)`,
        onde: 'Forja do Vazio',
        nivelReq: 10 
    },

    // --- CATEGORIA: POÇÕES (Vida/Interno) ---
    { 
        id: 'pocao_vida_p', 
        categoria: 'pocao', 
        nivelItem: 1, 
        fatorCura: CONFIG_CURA[1], 
        nome: 'Poção Menor', 
        icon: '🍷', 
        desc: 'Mistura básica de ervas vermelhas.',
        funcao: 'Trata dores leves (Nível 1).',
        poder: `Velocidade Normal (${CONFIG_CURA[1]}x)`,
        onde: 'Alquimista',
        nivelReq: 1 
    },
    { 
        id: 'pocao_vida_m', 
        categoria: 'pocao', 
        nivelItem: 2, 
        fatorCura: CONFIG_CURA[2], 
        nome: 'Poção Média', 
        icon: '🧪', 
        desc: 'Concentrado vital destilado.',
        funcao: 'Trata danos internos (Nível 2).',
        poder: `Velocidade Média (${CONFIG_CURA[2]}x)`,
        onde: 'Alquimista II',
        nivelReq: 3 
    },
    { 
        id: 'pocao_vida_g', 
        categoria: 'pocao', 
        nivelItem: 3, 
        fatorCura: CONFIG_CURA[3], 
        nome: 'Poção Maior', 
        icon: '🏺', 
        desc: 'Líquido espesso que regenera órgãos.',
        funcao: 'Trata falência orgânica (Nível 3).',
        poder: `Velocidade Alta (${CONFIG_CURA[3]}x)`,
        onde: 'Laboratório Mestre',
        nivelReq: 7 
    },
    { 
        id: 'elixir_vida', 
        categoria: 'pocao', 
        nivelItem: 4, 
        fatorCura: CONFIG_CURA[4], 
        nome: 'Elixir da Vida', 
        icon: '🩸', 
        desc: 'Gotas do próprio sangue de um Titã.',
        funcao: 'Ressuscita quase mortos (Nível 4).',
        poder: `Velocidade Divina (${CONFIG_CURA[4]}x)`,
        onde: 'Altar da Vida',
        nivelReq: 12 
    },

    // --- CATEGORIA: ERVAS (Doenças) ---
    { 
        id: 'ervas_comuns', 
        categoria: 'ervas', 
        nivelItem: 1, 
        fatorCura: CONFIG_CURA[1], 
        nome: 'Ervas Medicinais', 
        icon: '🌿', 
        desc: 'Folhas secas para chás simples.',
        funcao: 'Trata resfriados (Nível 1).',
        poder: `Velocidade Normal (${CONFIG_CURA[1]}x)`,
        onde: 'Horta',
        nivelReq: 1 
    },
    { 
        id: 'cataplasma_musgo', 
        categoria: 'ervas', 
        nivelItem: 2, 
        fatorCura: CONFIG_CURA[2], 
        nome: 'Musgo de Caverna', 
        icon: '🍵', 
        desc: 'Pasta verde que puxa toxinas.',
        funcao: 'Trata infecções (Nível 2).',
        poder: `Velocidade Média (${CONFIG_CURA[2]}x)`,
        onde: 'Estufa Subterrânea',
        nivelReq: 3 
    },
    { 
        id: 'raiz_mandragora', 
        categoria: 'ervas', 
        nivelItem: 3, 
        fatorCura: CONFIG_CURA[3], 
        nome: 'Raiz de Mandrágora', 
        icon: '🥕', 
        desc: 'Raiz que grita. Mata bactérias mágicas.',
        funcao: 'Trata pragas graves (Nível 3).',
        poder: `Velocidade Alta (${CONFIG_CURA[3]}x)`,
        onde: 'Jardim Proibido',
        nivelReq: 6 
    },
    { 
        id: 'flor_luz', 
        categoria: 'ervas', 
        nivelItem: 4, 
        fatorCura: CONFIG_CURA[4], 
        nome: 'Flor da Luz', 
        icon: '🌺', 
        desc: 'Só floresce uma vez a cada 100 anos.',
        funcao: 'Purifica qualquer mal (Nível 4).',
        poder: `Velocidade Divina (${CONFIG_CURA[4]}x)`,
        onde: 'Topo do Mundo',
        nivelReq: 11 
    },

    // --- CATEGORIA: TALAS (Fraturas) ---
    { 
        id: 'tala_madeira', 
        categoria: 'talas', 
        nivelItem: 1, 
        fatorCura: CONFIG_CURA[1], 
        nome: 'Tala de Madeira', 
        icon: '🪵', 
        desc: 'Galhos amarrados com corda.',
        funcao: 'Imobiliza torções (Nível 1).',
        poder: `Velocidade Normal (${CONFIG_CURA[1]}x)`,
        onde: 'Carpintaria',
        nivelReq: 1 
    },
    { 
        id: 'tala_ferro', 
        categoria: 'talas', 
        nivelItem: 2, 
        fatorCura: CONFIG_CURA[2], 
        nome: 'Tala Reforçada', 
        icon: '🔧', 
        desc: 'Hastes de ferro com acolchoamento.',
        funcao: 'Suporta ossos quebrados (Nível 2).',
        poder: `Velocidade Média (${CONFIG_CURA[2]}x)`,
        onde: 'Ferraria',
        nivelReq: 4 
    },
    { 
        id: 'tala_mithril', 
        categoria: 'talas', 
        nivelItem: 3, 
        fatorCura: CONFIG_CURA[3], 
        nome: 'Exoesqueleto Mithril', 
        icon: '🔩', 
        desc: 'Leve como pena, duro como diamante.',
        funcao: 'Reestrutura esmagamentos (Nível 3).',
        poder: `Velocidade Alta (${CONFIG_CURA[3]}x)`,
        onde: 'Forja Mágica',
        nivelReq: 8 
    },
    { 
        id: 'tala_runica', 
        categoria: 'talas', 
        nivelItem: 4, 
        fatorCura: CONFIG_CURA[4], 
        nome: 'Suporte Rúnico', 
        icon: '💠', 
        desc: 'Mantém o corpo junto com magia pura.',
        funcao: 'Solda ossos instantaneamente (Nível 4).',
        poder: `Velocidade Divina (${CONFIG_CURA[4]}x)`,
        onde: 'Santuário',
        nivelReq: 12 
    },

    // --- CATEGORIA: POMADAS (Queimaduras) ---
    { 
        id: 'pomada_base', 
        categoria: 'pomadas', 
        nivelItem: 1, 
        fatorCura: CONFIG_CURA[1], 
        nome: 'Pomada Básica', 
        icon: '🧴', 
        desc: 'Gordura animal misturada com cera.',
        funcao: 'Hidrata queimaduras solares (Nível 1).',
        poder: `Velocidade Normal (${CONFIG_CURA[1]}x)`,
        onde: 'Cozinha',
        nivelReq: 1 
    },
    { 
        id: 'pomada_aloe', 
        categoria: 'pomadas', 
        nivelItem: 2, 
        fatorCura: CONFIG_CURA[2], 
        nome: 'Gel de Aloe Vera', 
        icon: '🌵', 
        desc: 'Extrato refrescante para fogo e ácido.',
        funcao: 'Trata 2º grau e corrosão (Nível 2).',
        poder: `Velocidade Média (${CONFIG_CURA[2]}x)`,
        onde: 'Herbalista',
        nivelReq: 3 
    },
    { 
        id: 'unguento_gelo', 
        categoria: 'pomadas', 
        nivelItem: 3, 
        fatorCura: CONFIG_CURA[3], 
        nome: 'Unguento Glacial', 
        icon: '❄️', 
        desc: 'Feito com gelo que nunca derrete.',
        funcao: 'Anula calor extremo (Nível 3).',
        poder: `Velocidade Alta (${CONFIG_CURA[3]}x)`,
        onde: 'Alquimista de Gelo',
        nivelReq: 7 
    },
    { 
        id: 'balsamo_fenix', 
        categoria: 'pomadas', 
        nivelItem: 4, 
        fatorCura: CONFIG_CURA[4], 
        nome: 'Bálsamo de Fênix', 
        icon: '🔥', 
        desc: 'Cinzas de fênix misturadas com óleo sagrado.',
        funcao: 'Regenera pele destruída (Nível 4).',
        poder: `Velocidade Divina (${CONFIG_CURA[4]}x)`,
        onde: 'Templo do Sol',
        nivelReq: 13 
    },

    // --- CATEGORIA: ANTÍDOTOS (Venenos) ---
    { 
        id: 'antidoto_p', 
        categoria: 'antidotos', 
        nivelItem: 1, 
        fatorCura: CONFIG_CURA[1], 
        nome: 'Antídoto Caseiro', 
        icon: '🥛', 
        desc: 'Leite com carvão ativado.',
        funcao: 'Cura indigestão (Nível 1).',
        poder: `Velocidade Normal (${CONFIG_CURA[1]}x)`,
        onde: 'Cozinha',
        nivelReq: 1 
    },
    { 
        id: 'soro_ofidico', 
        categoria: 'antidotos', 
        nivelItem: 2, 
        fatorCura: CONFIG_CURA[2], 
        nome: 'Soro Antiofídico', 
        icon: '💉', 
        desc: 'Extraído de cobras comuns.',
        funcao: 'Neutraliza picadas (Nível 2).',
        poder: `Velocidade Média (${CONFIG_CURA[2]}x)`,
        onde: 'Laboratório',
        nivelReq: 4 
    },
    { 
        id: 'panaceia', 
        categoria: 'antidotos', 
        nivelItem: 3, 
        fatorCura: CONFIG_CURA[3], 
        nome: 'Panaceia Universal', 
        icon: '⚗️', 
        desc: 'Mistura complexa de 50 ervas.',
        funcao: 'Cura toxinas letais (Nível 3).',
        poder: `Velocidade Alta (${CONFIG_CURA[3]}x)`,
        onde: 'Mestre Alquimista',
        nivelReq: 8 
    },
    { 
        id: 'lagrima_unicornio', 
        categoria: 'antidotos', 
        nivelItem: 4, 
        fatorCura: CONFIG_CURA[4], 
        nome: 'Lágrima de Unicórnio', 
        icon: '🦄', 
        desc: 'A substância mais pura do mundo.',
        funcao: 'Expurga qualquer veneno (Nível 4).',
        poder: `Velocidade Divina (${CONFIG_CURA[4]}x)`,
        onde: 'Evento Raro',
        nivelReq: 15 
    },

    // --- CATEGORIA: TÔNICOS (Vigor/Cooldown) ---
    { 
        id: 'tonico_revigorante', 
        categoria: 'tonicos', 
        nivelItem: 1, 
        fatorCura: CONFIG_CURA[1], 
        nome: 'Água Termal', 
        icon: '🍵', 
        desc: 'Água mineral enriquecida.',
        funcao: 'Alivia cansaço leve (Nível 1).',
        poder: `Velocidade Normal (${CONFIG_CURA[1]}x)`,
        onde: 'Fonte',
        nivelReq: 1 
    },
    { 
        id: 'bebida_energetica', 
        categoria: 'tonicos', 
        nivelItem: 2, 
        fatorCura: CONFIG_CURA[2], 
        nome: 'Café de Batalha', 
        icon: '☕', 
        desc: 'Concentrado de grãos estimulantes.',
        funcao: 'Reseta exaustão física (Nível 2).',
        poder: `Velocidade Média (${CONFIG_CURA[2]}x)`,
        onde: 'Taverna',
        nivelReq: 3 
    },
    { 
        id: 'extrato_adrenalina', 
        categoria: 'tonicos', 
        nivelItem: 3, 
        fatorCura: CONFIG_CURA[3], 
        nome: 'Injeção de Adrenalina', 
        icon: '⚡', 
        desc: 'Extraído de glândulas de monstros.',
        funcao: 'Levanta mortos de cansaço (Nível 3).',
        poder: `Velocidade Alta (${CONFIG_CURA[3]}x)`,
        onde: 'Laboratório',
        nivelReq: 7 
    },
    { 
        id: 'nectar_deuses', 
        categoria: 'tonicos', 
        nivelItem: 4, 
        fatorCura: CONFIG_CURA[4], 
        nome: 'Néctar dos Deuses', 
        icon: '🍷', 
        desc: 'Ambrosia dourada.',
        funcao: 'Restaura vitalidade divina (Nível 4).',
        poder: `Velocidade Divina (${CONFIG_CURA[4]}x)`,
        onde: 'Olimpo',
        nivelReq: 14 
    },

    // --- CATEGORIA: TALISMÃS (Espiritual) ---
    { 
        id: 'talisma_cura', 
        categoria: 'talisma', 
        nivelItem: 1, 
        fatorCura: CONFIG_CURA[1], 
        nome: 'Talismã de Papel', 
        icon: '📜', 
        desc: 'Selo rúnico básico.',
        funcao: 'Afasta má sorte (Nível 1).',
        poder: `Velocidade Normal (${CONFIG_CURA[1]}x)`,
        onde: 'Escriba',
        nivelReq: 2 
    },
    { 
        id: 'amuleto_prata', 
        categoria: 'talisma', 
        nivelItem: 2, 
        fatorCura: CONFIG_CURA[2], 
        nome: 'Amuleto de Prata', 
        icon: '🧿', 
        desc: 'Prata abençoada repele espectros.',
        funcao: 'Quebra maldições (Nível 2).',
        poder: `Velocidade Média (${CONFIG_CURA[2]}x)`,
        onde: 'Ourives',
        nivelReq: 5 
    },
    { 
        id: 'totem_ouro', 
        categoria: 'talisma', 
        nivelItem: 3, 
        fatorCura: CONFIG_CURA[3], 
        nome: 'Totem Dourado', 
        icon: '🗿', 
        desc: 'Estatueta que absorve magia negra.',
        funcao: 'Exorciza possessões (Nível 3).',
        poder: `Velocidade Alta (${CONFIG_CURA[3]}x)`,
        onde: 'Templo',
        nivelReq: 9 
    },
    { 
        id: 'reliquia_sagrada', 
        categoria: 'talisma', 
        nivelItem: 4, 
        fatorCura: CONFIG_CURA[4], 
        nome: 'Relíquia Sagrada', 
        icon: '👑', 
        desc: 'Fragmento de um anjo caído.',
        funcao: 'Restaura a alma (Nível 4).',
        poder: `Velocidade Divina (${CONFIG_CURA[4]}x)`,
        onde: 'Catedral',
        nivelReq: 15 
    }
];
// ------------------------------------------
// TIPOS DE FERIMENTOS E DOENÇAS
// ------------------------------------------
export const tiposFerimentos = {
    // ==========================================
    // CATEGORIA: CURATIVOS (BANDAGENS)
    // Foco: 90% Batalha | 10% Acidentes de Trabalho
    // Escala: 10min a 12h
    // ==========================================

    // --- NÍVEL 1: SIMPLES (Acidentes de Trabalho & Mobs Iniciais) ---
    // Tempo: 10 a 20 minutos
    'corte_pergaminho': {
        nome: 'Corte de Pergaminho',
        tempoBase: 600, // 10 min
        reqCategoria: 'bandagem',
        nivelSeveridade: 1,
        desc: 'Acidente de escritório. Afeta: Acadêmicos, Tesoureiros e Lordes.'
    },
    'corte_rebarba': {
        nome: 'Corte de Rebarba',
        tempoBase: 900, // 15 min
        reqCategoria: 'bandagem',
        nivelSeveridade: 1,
        desc: 'Metal ou madeira mal lixada. Afeta: Ferreiros e Lenhadores.'
    },
    'corte_faca_esfolar': {
        nome: 'Dedo Cortado',
        tempoBase: 900, // 15 min
        reqCategoria: 'bandagem',
        nivelSeveridade: 1,
        desc: 'A faca escorregou na carne. Afeta: Esfoladores e Cozinheiros.'
    },
    'arranhao_pedra': {
        nome: 'Arranhão de Pedra',
        tempoBase: 1200, // 20 min
        reqCategoria: 'bandagem',
        nivelSeveridade: 1,
        desc: 'Pedra lascada comum. Afeta: Mineradores (Início de jogo).'
    },
    'arranhao_slime': {
        nome: 'Investida de Slime',
        tempoBase: 1200, // 20 min
        reqCategoria: 'bandagem',
        nivelSeveridade: 1,
        desc: 'Golpe básico de monstros de nível baixo.'
    },

    // --- NÍVEL 2: COMBATE INTERMEDIÁRIO (Batalhas de Campo) ---
    // Tempo: 45 min a 2 horas
    'corte_sabre_goblin': {
        nome: 'Corte de Sabre Goblin',
        tempoBase: 2700, // 45 min
        reqCategoria: 'bandagem',
        nivelSeveridade: 2,
        desc: 'Lâmina serrilhada e suja usada por batedores goblins.'
    },
    'mordida_warg': {
        nome: 'Mordida de Warg',
        tempoBase: 4500, // 1h 15m
        reqCategoria: 'bandagem',
        nivelSeveridade: 2,
        desc: 'Dentes profundos que rasgam a armadura de couro.'
    },
    'flechada_perfurante': {
        nome: 'Flechada Perfurante',
        tempoBase: 5400, // 1h 30m
        reqCategoria: 'bandagem',
        nivelSeveridade: 2,
        desc: 'Atravessou o ombro. Requer remoção cuidadosa.'
    },
    'corte_garras_urso': {
        nome: 'Garras de Urso-Coruja',
        tempoBase: 7200, // 2 horas
        reqCategoria: 'bandagem',
        nivelSeveridade: 2,
        desc: 'Três cortes paralelos profundos no peito.'
    },

    // --- NÍVEL 3: COMBATE AVANÇADO & MINERAÇÃO LATE-GAME ---
    // Tempo: 4 a 6 horas
    'corte_obsidiana': {
        nome: 'Corte de Obsidiana',
        tempoBase: 14400, // 4 horas
        reqCategoria: 'bandagem',
        nivelSeveridade: 3,
        desc: 'Acidente de Mineração Late-Game. O vidro vulcânico corta até o osso.'
    },
    'hemorragia_critica': {
        nome: 'Hemorragia Crítica',
        tempoBase: 16200, // 4h 30m
        reqCategoria: 'bandagem',
        nivelSeveridade: 3,
        desc: 'Dano massivo causado por um Boss de Masmorra.'
    },
    'perfuracao_lanca_cavaleiro': {
        nome: 'Estocada de Lança',
        tempoBase: 18000, // 5 horas
        reqCategoria: 'bandagem',
        nivelSeveridade: 3,
        desc: 'Golpe de um Cavaleiro Negro. Ferida aberta e extensa.'
    },
    'retalhado_por_laminas': {
        nome: 'Retalhado',
        tempoBase: 21600, // 6 horas
        reqCategoria: 'bandagem',
        nivelSeveridade: 3,
        desc: 'Caiu em uma armadilha de lâminas giratórias.'
    },

    // --- NÍVEL 4: DANOS MÍTICOS / ISEKAI (Batalhas Épicas) ---
    // Tempo: 8 a 12 horas
    'corte_vacuo': {
        nome: 'Corte do Vácuo',
        tempoBase: 28800, // 8 horas
        reqCategoria: 'bandagem',
        nivelSeveridade: 4,
        desc: 'Atingido por magia espacial. A pele não existe mais nessa dimensão.'
    },
    'mordida_dragao_ances': {
        nome: 'Presas do Dragão',
        tempoBase: 36000, // 10 horas
        reqCategoria: 'bandagem',
        nivelSeveridade: 4,
        desc: 'Ferida causada por um ser divino. Quase impossível de estancar.'
    },
    'ferida_eterna_rei_demonio': {
        nome: 'A Marca do Rei Demônio',
        tempoBase: 43200, // 12 horas
        reqCategoria: 'bandagem',
        nivelSeveridade: 4,
        desc: 'Um corte amaldiçoado que sangra escuridão. Exige bandagens sagradas.'
    },
    // ==========================================
    // CATEGORIA: POÇÕES (VIDA/INTERNO)
    // Foco: Impacto, Dano Interno, Vitalidade
    // Escala: 10min a 12h
    // ==========================================

    // --- NÍVEL 1: IMPACTOS LEVES (Tier 1+) ---
    // Tempo: 10 a 30 minutos
    'queda_mina': {
        nome: 'Queda de Andaime',
        tempoBase: 600, // 10 min
        reqCategoria: 'pocao',
        nivelSeveridade: 1,
        desc: 'Acidente de trabalho. O minerador caiu de uma altura média.'
    },
    'hematomas_globais': {
        nome: 'Hematomas de Combate',
        tempoBase: 900, // 15 min
        reqCategoria: 'pocao',
        nivelSeveridade: 1,
        desc: 'Múltiplos impactos de clavas ou pedras de Goblins.'
    },
    'impacto_escudo': {
        nome: 'Impacto no Escudo',
        tempoBase: 1200, // 20 min
        reqCategoria: 'pocao',
        nivelSeveridade: 1,
        desc: 'O bloqueio foi bem sucedido, mas o braço ficou dormente pelo choque.'
    },
    'falta_de_ar': {
        nome: 'Golpe no Estômago',
        tempoBase: 1500, // 25 min
        reqCategoria: 'pocao',
        nivelSeveridade: 1,
        desc: 'Um chute ou soco que tirou o ar. Dano interno leve.'
    },
    'concussao_leve': {
        nome: 'Tontura de Batalha',
        tempoBase: 1800, // 30 min
        reqCategoria: 'pocao',
        nivelSeveridade: 1,
        desc: 'Atingido de raspão na cabeça. Visão turva temporária.'
    },

    // --- NÍVEL 2: DANOS ESTRUTURAIS INTERNOS (Tier 2+) ---
    // Tempo: 45 min a 2 horas
    'costelas_trincadas': {
        nome: 'Costelas Trincadas',
        tempoBase: 2700, // 45 min
        reqCategoria: 'pocao',
        nivelSeveridade: 2,
        desc: 'Golpe de clava de um Orc ou Ogro. Dói ao respirar.'
    },
    'sangramento_interno': {
        nome: 'Hemorragia Gástrica',
        tempoBase: 3600, // 1 hora
        reqCategoria: 'pocao',
        nivelSeveridade: 2,
        desc: 'Causado por quedas altas ou magias de impacto sônico.'
    },
    'rebote_magico': {
        nome: 'Rebote de Mana',
        tempoBase: 5400, // 1h 30m
        reqCategoria: 'pocao',
        nivelSeveridade: 2,
        desc: 'A magia falhou e explodiu internamente. Afeta Magos e Alquimistas.'
    },
    'esmagamento_leve': {
        nome: 'Compressão Torácica',
        tempoBase: 7200, // 2 horas
        reqCategoria: 'pocao',
        nivelSeveridade: 2,
        desc: 'Pego por uma Jiboia Gigante ou tentáculo.'
    },

    // --- NÍVEL 3: FALÊNCIA ORGÂNICA (Tier 3+) ---
    // Tempo: 4 a 6 horas
    'ruptura_baco': {
        nome: 'Ruptura de Órgão',
        tempoBase: 14400, // 4 horas
        reqCategoria: 'pocao',
        nivelSeveridade: 3,
        desc: 'Dano crítico de um Boss. Requer regeneração mágica acelerada.'
    },
    'pulmao_perfurado': {
        nome: 'Pulmão Perfurado',
        tempoBase: 18000, // 5 horas
        reqCategoria: 'pocao',
        nivelSeveridade: 3,
        desc: 'Dificuldade extrema de respiração. Poção deve ser injetada direto na veia.'
    },
    'dreno_vital_vampiro': {
        nome: 'Exsanguinação Mística',
        tempoBase: 21600, // 6 horas
        reqCategoria: 'pocao',
        nivelSeveridade: 3,
        desc: 'Vítima de um Vampiro Lorde. O corpo está quase sem fluídos.'
    },

    // --- NÍVEL 4: ESTADOS DE QUASE-MORTE (Tier 4+) ---
    // Tempo: 8 a 12 horas
    'colapso_nucleo_mana': {
        nome: 'Colapso do Núcleo de Mana',
        tempoBase: 28800, // 8 horas
        reqCategoria: 'pocao',
        nivelSeveridade: 4,
        desc: 'O corpo físico não suporta mais a magia. Risco de explosão corporal.'
    },
    'corpo_quebrado': {
        nome: 'Todos os Ossos Quebrados',
        tempoBase: 36000, // 10 horas
        reqCategoria: 'pocao',
        nivelSeveridade: 4,
        desc: 'Caiu de um penhasco abissal ou foi pisado por um Titã.'
    },
    'alma_desancorada': {
        nome: 'Alma Desancorada',
        tempoBase: 43200, // 12 horas
        reqCategoria: 'pocao',
        nivelSeveridade: 4,
        desc: 'O HP chegou a zero, mas o herói se recusou a morrer. Estado crítico.'
    },
    // ==========================================
    // CATEGORIA: ERVAS (DOENÇAS/BIOLÓGICO)
    // Foco: Infecções, Fungos, Pragas, Ambiente
    // Escala: 10min a 12h
    // ==========================================

    // --- NÍVEL 1: DOENÇAS AMBIENTAIS (Tier 1+) ---
    // Tempo: 10 a 30 minutos
    'alergia_polen': {
        nome: 'Alergia a Pólen',
        tempoBase: 600, // 10 min
        reqCategoria: 'ervas',
        nivelSeveridade: 1,
        desc: 'Nariz escorrendo e olhos inchados. Afeta a produtividade na floresta.'
    },
    'resfriado_comum': {
        nome: 'Resfriado da Chuva',
        tempoBase: 900, // 15 min
        reqCategoria: 'ervas',
        nivelSeveridade: 1,
        desc: 'Pegou chuva voltando da caçada. Tosse leve.'
    },
    'erupcao_urtiga': {
        nome: 'Erupção de Urtiga',
        tempoBase: 1200, // 20 min
        reqCategoria: 'ervas',
        nivelSeveridade: 1,
        desc: 'Contato com plantas irritantes. Coceira insuportável.'
    },
    'infeccao_unha': {
        nome: 'Infecção na Unha',
        tempoBase: 1500, // 25 min
        reqCategoria: 'ervas',
        nivelSeveridade: 1,
        desc: 'Sujeira da terra entrou sob a unha. Dedo pulsando.'
    },
    'boca_do_mineiro': {
        nome: 'Tosse de Poeira',
        tempoBase: 1800, // 30 min
        reqCategoria: 'ervas',
        nivelSeveridade: 1,
        desc: 'Inalação de pó de pedra comum. Garganta seca e irritada.'
    },

    // --- NÍVEL 2: INFECÇÕES E FUNGOS (Tier 2+) ---
    // Tempo: 45 min a 2 horas
    'febre_do_pantano': {
        nome: 'Febre do Pântano',
        tempoBase: 2700, // 45 min
        reqCategoria: 'ervas',
        nivelSeveridade: 2,
        desc: 'Contraída ao viajar por áreas alagadas. Suor frio e tremores.'
    },
    'fungo_de_caverna': {
        nome: 'Esporos de Caverna',
        tempoBase: 3600, // 1 hora
        reqCategoria: 'ervas',
        nivelSeveridade: 2,
        desc: 'Fungo que cresce na pele de quem fica muito tempo no escuro (Minas).'
    },
    'infeccao_necrotica_leve': {
        nome: 'Dedo de Cadáver',
        tempoBase: 5400, // 1h 30m
        reqCategoria: 'ervas',
        nivelSeveridade: 2,
        desc: 'Infecção bacteriana ao esfolar monstros mortos-vivos.'
    },
    'parasita_intestinal': {
        nome: 'Parasita Intestinal',
        tempoBase: 7200, // 2 horas
        reqCategoria: 'ervas',
        nivelSeveridade: 2,
        desc: 'Ingestão de água não tratada ou carne mal cozida.'
    },

    // --- NÍVEL 3: PRAGAS E TOXICIDADE (Tier 3+) ---
    // Tempo: 4 a 6 horas
    'febre_do_ouro_toxica': {
        nome: 'Toxicidade Áurea',
        tempoBase: 14400, // 4 horas
        reqCategoria: 'ervas',
        nivelSeveridade: 3,
        desc: 'O sangue começa a endurecer pelo contato excessivo com ouro mágico.'
    },
    'gangrena_magica': {
        nome: 'Gangrena Mágica',
        tempoBase: 18000, // 5 horas
        reqCategoria: 'ervas',
        nivelSeveridade: 3,
        desc: 'A carne está apodrecendo rapidamente devido a feitiços de decomposição.'
    },
    'praga_dos_ratos': {
        nome: 'Peste Bubônica Rúnica',
        tempoBase: 21600, // 6 horas
        reqCategoria: 'ervas',
        nivelSeveridade: 3,
        desc: 'Variação mágica da peste negra transmitida por ratos de masmorra.'
    },

    // --- NÍVEL 4: MALES LENDÁRIOS (Tier 4+) ---
    // Tempo: 8 a 12 horas
    'parasita_cerebral': {
        nome: 'Larva Devoradora de Mente',
        tempoBase: 28800, // 8 horas
        reqCategoria: 'ervas',
        nivelSeveridade: 4,
        desc: 'Implantada por Illithids. Requer ervas raras para expurgar sem matar o hospedeiro.'
    },
    'podidao_divina': {
        nome: 'Podridão de Nurg',
        tempoBase: 36000, // 10 horas
        reqCategoria: 'ervas',
        nivelSeveridade: 4,
        desc: 'Uma doença criada por um Deus da Praga. O corpo se desfaz em lodo.'
    },
    'esporos_zumbificantes': {
        nome: 'Fungo Cordyceps Titânico',
        tempoBase: 43200, // 12 horas
        reqCategoria: 'ervas',
        nivelSeveridade: 4,
        desc: 'O fungo tenta controlar o sistema nervoso central. Tratamento agonizante.'
    },
    // ==========================================
    // CATEGORIA: TALAS (FRATURAS/ÓSSEO)
    // Foco: Quebras, Esmagamentos, Imobilização
    // Escala: 10min a 12h
    // ==========================================

    // --- NÍVEL 1: TORÇÕES E PANCADAS (Tier 1+) ---
    // Tempo: 10 a 30 minutos
    'dedo_martelado': {
        nome: 'Dedo Martelado',
        tempoBase: 600, // 10 min
        reqCategoria: 'talas',
        nivelSeveridade: 1,
        desc: 'Erro clássico de aprendiz na Ferraria ou Construção.'
    },
    'torcao_tornozelo': {
        nome: 'Tornozelo Torcido',
        tempoBase: 900, // 15 min
        reqCategoria: 'talas',
        nivelSeveridade: 1,
        desc: 'Pisou em falso numa pedra solta na mina ou floresta.'
    },
    'pulso_aberto': {
        nome: 'Pulso Aberto',
        tempoBase: 1200, // 20 min
        reqCategoria: 'talas',
        nivelSeveridade: 1,
        desc: 'Recuo excessivo ao bater com a picareta ou machado.'
    },
    'ombro_deslocado_leve': {
        nome: 'Ombro Deslocado',
        tempoBase: 1500, // 25 min
        reqCategoria: 'talas',
        nivelSeveridade: 1,
        desc: 'Esforço exagerado ao carregar baús pesados (Tesoureiros).'
    },
    'fissura_canela': {
        nome: 'Fissura na Tíbia',
        tempoBase: 1800, // 30 min
        reqCategoria: 'talas',
        nivelSeveridade: 1,
        desc: 'Chute bloqueado de forma errada no treinamento.'
    },

    // --- NÍVEL 2: FRATURAS DE COMBATE/MINA (Tier 2+) ---
    // Tempo: 45 min a 2 horas
    'braço_quebrado_escudo': {
        nome: 'Braço do Escudo Quebrado',
        tempoBase: 2700, // 45 min
        reqCategoria: 'talas',
        nivelSeveridade: 2,
        desc: 'O impacto no escudo foi tão forte que partiu o osso atrás dele.'
    },
    'pedra_na_cabeca': {
        nome: 'Traumatismo Craniano Leve',
        tempoBase: 3600, // 1 hora
        reqCategoria: 'talas',
        nivelSeveridade: 2,
        desc: 'Uma pedra média caiu do teto da mina. Requer colar cervical.'
    },
    'golpe_de_maca': {
        nome: 'Fratura por Maça',
        tempoBase: 5400, // 1h 30m
        reqCategoria: 'talas',
        nivelSeveridade: 2,
        desc: 'Golpe direto de uma arma contundente. Osso partido em dois.'
    },
    'costelas_esmagadas': {
        nome: 'Abraço de Urso',
        tempoBase: 7200, // 2 horas
        reqCategoria: 'talas',
        nivelSeveridade: 2,
        desc: 'Apertado por uma besta selvagem até as costelas cederem.'
    },

    // --- NÍVEL 3: ESMAGAMENTOS GRAVES (Tier 3+) ---
    // Tempo: 4 a 6 horas
    'fissura_vibracao_mithril': {
        nome: 'Fratura de Ressonância',
        tempoBase: 14400, // 4 horas
        reqCategoria: 'talas',
        nivelSeveridade: 3,
        desc: 'A frequência sonora ao bater no Mithril estilhaçou os ossos da mão.'
    },
    'pisao_gigante': {
        nome: 'Pisão de Gigante',
        tempoBase: 18000, // 5 horas
        reqCategoria: 'talas',
        nivelSeveridade: 3,
        desc: 'A perna foi achatada. Requer reconstrução óssea complexa.'
    },
    'coluna_comprometida': {
        nome: 'Lesão na Coluna',
        tempoBase: 21600, // 6 horas
        reqCategoria: 'talas',
        nivelSeveridade: 3,
        desc: 'Arremessado contra uma parede de pedra por um Boss.'
    },

    // --- NÍVEL 4: DESTRUIÇÃO ÓSSEA MÍTICA (Tier 4+) ---
    // Tempo: 8 a 12 horas
    'ossos_de_vidro': {
        nome: 'Maldição dos Ossos de Vidro',
        tempoBase: 28800, // 8 horas
        reqCategoria: 'talas',
        nivelSeveridade: 4,
        desc: 'Magia que torna o esqueleto frágil. Requer suporte corporal total.'
    },
    'esmagamento_gravitacional': {
        nome: 'Singularidade Gravitacional',
        tempoBase: 36000, // 10 horas
        reqCategoria: 'talas',
        nivelSeveridade: 4,
        desc: 'Atingido por magia de buraco negro. O corpo foi compactado.'
    },
    'pulverizacao_titanica': {
        nome: 'Ossos Pulverizados',
        tempoBase: 43200, // 12 horas
        reqCategoria: 'talas',
        nivelSeveridade: 4,
        desc: 'O osso virou pó após golpe de um Titã. Requer talas mágicas de suporte.'
    },
    // ==========================================
    // CATEGORIA: POMADAS (QUEIMADURAS/CORROSÃO)
    // Foco: Fogo, Gelo, Ácido, Magia Elemental
    // Escala: 10min a 12h
    // ==========================================

    // --- NÍVEL 1: ACIDENTES TÉRMICOS LEVES (Tier 1+) ---
    // Tempo: 10 a 30 minutos
    'queimadura_solar': {
        nome: 'Insolação Severa',
        tempoBase: 600, // 10 min
        reqCategoria: 'pomadas',
        nivelSeveridade: 1,
        desc: 'Trabalhou o dia todo no campo sem proteção.'
    },
    'respingo_oleo': {
        nome: 'Respingo de Óleo',
        tempoBase: 900, // 15 min
        reqCategoria: 'pomadas',
        nivelSeveridade: 1,
        desc: 'Acidente na cozinha da Taverna ou na manutenção de máquinas.'
    },
    'fagulha_olho': {
        nome: 'Fagulha no Rosto',
        tempoBase: 1200, // 20 min
        reqCategoria: 'pomadas',
        nivelSeveridade: 1,
        desc: 'O Ferreiro esqueceu de usar a viseira de proteção.'
    },
    'frieira_magica': {
        nome: 'Frieira de Masmorra',
        tempoBase: 1500, // 25 min
        reqCategoria: 'pomadas',
        nivelSeveridade: 1,
        desc: 'Pisou em poças de água gelada em cavernas úmidas.'
    },
    'irritacao_alquimica': {
        nome: 'Mancha Ácida',
        tempoBase: 1800, // 30 min
        reqCategoria: 'pomadas',
        nivelSeveridade: 1,
        desc: 'Derrubou reagente básico na mão durante um experimento.'
    },

    // --- NÍVEL 2: DANO ELEMENTAL DE COMBATE (Tier 2+) ---
    // Tempo: 45 min a 2 horas
    'bola_fogo_raspao': {
        nome: 'Chamuscado por Bola de Fogo',
        tempoBase: 2700, // 45 min
        reqCategoria: 'pomadas',
        nivelSeveridade: 2,
        desc: 'Atingido pela área de explosão de um feitiço ígneo.'
    },
    'congelamento_dedos': {
        nome: 'Congelamento de Extremidades',
        tempoBase: 3600, // 1 hora
        reqCategoria: 'pomadas',
        nivelSeveridade: 2,
        desc: 'Atingido por um Sopro de Gelo. Dedos roxos e sem sensibilidade.'
    },
    'acido_slime': {
        nome: 'Corrosão de Slime',
        tempoBase: 5400, // 1h 30m
        reqCategoria: 'pomadas',
        nivelSeveridade: 2,
        desc: 'O Slime tentou digerir o braço do herói. A pele está em carne viva.'
    },
    'escaldadura_vapor': {
        nome: 'Escaldadura de Vapor',
        tempoBase: 7200, // 2 horas
        reqCategoria: 'pomadas',
        nivelSeveridade: 2,
        desc: 'Armadilha de pressão ou explosão de caldeira.'
    },

    // --- NÍVEL 3: DANO ESTRUTURAL ELEMENTAL (Tier 3+) ---
    // Tempo: 4 a 6 horas
    'carbonizacao_parcial': {
        nome: 'Carbonização Parcial',
        tempoBase: 14400, // 4 horas
        reqCategoria: 'pomadas',
        nivelSeveridade: 3,
        desc: 'Contato direto com lava ou bafo de Dragão Vermelho.'
    },
    'necrose_gelida': {
        nome: 'Necrose Gélida',
        tempoBase: 18000, // 5 horas
        reqCategoria: 'pomadas',
        nivelSeveridade: 3,
        desc: 'O tecido morreu devido ao frio extremo causado por um Lich de Gelo.'
    },
    'corrosao_armadura': {
        nome: 'Fusão de Metal na Pele',
        tempoBase: 21600, // 6 horas
        reqCategoria: 'pomadas',
        nivelSeveridade: 3,
        desc: 'O ácido era tão forte que derreteu a armadura sobre o corpo.'
    },

    // --- NÍVEL 4: ELEMENTOS DIVINOS/PRIMORDIAIS (Tier 4+) ---
    // Tempo: 8 a 12 horas
    'chama_eterna': {
        nome: 'Maldição da Chama Eterna',
        tempoBase: 28800, // 8 horas
        reqCategoria: 'pomadas',
        nivelSeveridade: 4,
        desc: 'Fogo do Inferno que não apaga com água. Requer unguento sagrado.'
    },
    'zero_absoluto': {
        nome: 'Toque do Zero Absoluto',
        tempoBase: 36000, // 10 horas
        reqCategoria: 'pomadas',
        nivelSeveridade: 4,
        desc: 'As células foram paralisadas no tempo pelo frio divino.'
    },
    'dissolucao_total': {
        nome: 'Dissolução Caótica',
        tempoBase: 43200, // 12 horas
        reqCategoria: 'pomadas',
        nivelSeveridade: 4,
        desc: 'Cuspe de uma Hidra Lendária. O corpo está literalmente derretendo.'
    },
    // ==========================================
    // CATEGORIA: ANTÍDOTOS (VENENOS/TOXINAS)
    // Foco: Animais Peçonhentos, Alquimia, Gases
    // Escala: 10min a 12h
    // ==========================================

    // --- NÍVEL 1: INTOXICAÇÕES LEVES (Tier 1+) ---
    // Tempo: 10 a 30 minutos
    'indigestao_racao': {
        nome: 'Indigestão de Ração',
        tempoBase: 600, // 10 min
        reqCategoria: 'antidotos',
        nivelSeveridade: 1,
        desc: 'A ração de viagem estava vencida. Enjoo leve.'
    },
    'picada_abelha_gigante': {
        nome: 'Picada de Abelha',
        tempoBase: 900, // 15 min
        reqCategoria: 'antidotos',
        nivelSeveridade: 1,
        desc: 'Inchaço localizado causado por insetos da floresta.'
    },
    'bagas_alucinogenas': {
        nome: 'Bagas Alucinógenas',
        tempoBase: 1200, // 20 min
        reqCategoria: 'antidotos',
        nivelSeveridade: 1,
        desc: 'Comeu frutas da floresta sem saber o que eram. Visão colorida.'
    },
    'gas_de_pantano_leve': {
        nome: 'Tontura de Metano',
        tempoBase: 1500, // 25 min
        reqCategoria: 'antidotos',
        nivelSeveridade: 1,
        desc: 'Respirou gás de pântano por muito tempo. Dor de cabeça.'
    },
    'ferrao_escorpiao_areia': {
        nome: 'Ferrão de Escorpião P',
        tempoBase: 1800, // 30 min
        reqCategoria: 'antidotos',
        nivelSeveridade: 1,
        desc: 'Escorpião pequeno comum em minas de areia/arenito.'
    },

    // --- NÍVEL 2: VENENOS DE MONSTROS (Tier 2+) ---
    // Tempo: 45 min a 2 horas
    'veneno_aranha_lobo': {
        nome: 'Veneno de Aranha-Lobo',
        tempoBase: 2700, // 45 min
        reqCategoria: 'antidotos',
        nivelSeveridade: 2,
        desc: 'Causa paralisia muscular local e febre alta.'
    },
    'mordida_cobra_coral': {
        nome: 'Neurotoxina de Serpente',
        tempoBase: 3600, // 1 hora
        reqCategoria: 'antidotos',
        nivelSeveridade: 2,
        desc: 'Veneno que ataca o sistema nervoso. Requer soro rápido.'
    },
    'dardo_goblin': {
        nome: 'Dardo Envenenado',
        tempoBase: 5400, // 1h 30m
        reqCategoria: 'antidotos',
        nivelSeveridade: 2,
        desc: 'Armadilha goblin untada com extrato de raiz paralisante.'
    },
    'intoxicacao_mercurio': {
        nome: 'Envenenamento por Mercúrio',
        tempoBase: 7200, // 2 horas
        reqCategoria: 'antidotos',
        nivelSeveridade: 2,
        desc: 'Acidente de laboratório ao tentar transmutar metais (Alquimistas).'
    },

    // --- NÍVEL 3: TOXINAS LETAIS (Tier 3+) ---
    // Tempo: 4 a 6 horas
    'gas_da_morte': {
        nome: 'Gás Mostarda Mágico',
        tempoBase: 14400, // 4 horas
        reqCategoria: 'antidotos',
        nivelSeveridade: 3,
        desc: 'Nuvem tóxica criada por Liches. Derrete os pulmões.'
    },
    'veneno_quimera': {
        nome: 'Peçonha de Quimera',
        tempoBase: 18000, // 5 horas
        reqCategoria: 'antidotos',
        nivelSeveridade: 3,
        desc: 'Uma mistura complexa de venenos de cabra, leão e cobra.'
    },
    'sangue_acido_alien': {
        nome: 'Sangue Corrosivo',
        tempoBase: 21600, // 6 horas
        reqCategoria: 'antidotos',
        nivelSeveridade: 3,
        desc: 'Contato com sangue de aberrações do vazio. Envenena o sangue.'
    },

    // --- NÍVEL 4: VENENOS LENDÁRIOS (Tier 4+) ---
    // Tempo: 8 a 12 horas
    'petrificacao_basilisco': {
        nome: 'Maldição de Pedra (Basilisco)',
        tempoBase: 28800, // 8 horas
        reqCategoria: 'antidotos',
        nivelSeveridade: 4,
        desc: 'O veneno está transformando o sangue em pedra lentamente.'
    },
    'alento_dragao_verde': {
        nome: 'Sopro de Cloro Viroso',
        tempoBase: 36000, // 10 horas
        reqCategoria: 'antidotos',
        nivelSeveridade: 4,
        desc: 'Baforada de um Dragão Verde Antigo. Apodrece a carne instantaneamente.'
    },
    'veneno_dos_deuses': {
        nome: 'Ichor Corrompido',
        tempoBase: 43200, // 12 horas
        reqCategoria: 'antidotos',
        nivelSeveridade: 4,
        desc: 'Um veneno capaz de matar imortais. Requer antídoto divino.'
    },
    // ==========================================
    // CATEGORIA: TÔNICOS (VIGOR/ENERGIA)
    // Foco: Cansaço, Cooldown, Fadiga Mental
    // Escala: 10min a 12h
    // ==========================================

    // --- NÍVEL 1: CANSAÇO ROTINEIRO (Tier 1+) ---
    // Tempo: 10 a 30 minutos
    'sonolencia_pos_almoco': {
        nome: 'Sonolência Pesada',
        tempoBase: 600, // 10 min
        reqCategoria: 'tonicos',
        nivelSeveridade: 1,
        desc: 'A refeição foi farta demais. Produtividade caiu 50%.'
    },
    'fadiga_ocular': {
        nome: 'Vista Cansada',
        tempoBase: 900, // 15 min
        reqCategoria: 'tonicos',
        nivelSeveridade: 1,
        desc: 'Muitas horas lendo pergaminhos ou inspecionando joias.'
    },
    'cambra_panturrilha': {
        nome: 'Cãibra Muscular',
        tempoBase: 1200, // 20 min
        reqCategoria: 'tonicos',
        nivelSeveridade: 1,
        desc: 'Desidratação leve após correr ou carregar peso.'
    },
    'tremedeira_maos': {
        nome: 'Mãos Trêmulas',
        tempoBase: 1500, // 25 min
        reqCategoria: 'tonicos',
        nivelSeveridade: 1,
        desc: 'Excesso de precisão exigida na ourivesaria ou cirurgia.'
    },
    'dor_nas_costas': {
        nome: 'Lombar Travada',
        tempoBase: 1800, // 30 min
        reqCategoria: 'tonicos',
        nivelSeveridade: 1,
        desc: 'Muitas horas curvado minerando ou plantando.'
    },

    // --- NÍVEL 2: EXAUSTÃO DE BATALHA (Tier 2+) ---
    // Tempo: 45 min a 2 horas
    'esgotamento_mana_leve': {
        nome: 'Ressaca de Mana',
        tempoBase: 2700, // 45 min
        reqCategoria: 'tonicos',
        nivelSeveridade: 2,
        desc: 'O Mago usou todos os slots de magia. Cabeça latejando.'
    },
    'musculo_travado': {
        nome: 'Rigidez Cadavérica Temporária',
        tempoBase: 3600, // 1 hora
        reqCategoria: 'tonicos',
        nivelSeveridade: 2,
        desc: 'O corpo travou após a adrenalina da batalha baixar.'
    },
    'hipotermia_leve': {
        nome: 'Frio nos Ossos',
        tempoBase: 5400, // 1h 30m
        reqCategoria: 'tonicos',
        nivelSeveridade: 2,
        desc: 'Passou a noite de vigília na chuva fria.'
    },
    'surdez_temporaria': {
        nome: 'Zumbido de Explosão',
        tempoBase: 7200, // 2 horas
        reqCategoria: 'tonicos',
        nivelSeveridade: 2,
        desc: 'Ficou muito perto de um canhão ou magia sônica.'
    },

    // --- NÍVEL 3: COLAPSO FÍSICO/MENTAL (Tier 3+) ---
    // Tempo: 4 a 6 horas
    'efeito_berserk': {
        nome: 'Rebote de Berserk',
        tempoBase: 14400, // 4 horas
        reqCategoria: 'tonicos',
        nivelSeveridade: 3,
        desc: 'Usou a habilidade "Fúria". Agora o corpo não responde.'
    },
    'burnout_arcano': {
        nome: 'Burnout Arcano',
        tempoBase: 18000, // 5 horas
        reqCategoria: 'tonicos',
        nivelSeveridade: 3,
        desc: 'Tentou conjurar magia acima do nível. Canais de mana queimados.'
    },
    'dreno_sucubus': {
        nome: 'Dreno Vital',
        tempoBase: 21600, // 6 horas
        reqCategoria: 'tonicos',
        nivelSeveridade: 3,
        desc: 'Teve a energia vital sugada por um demônio ou espectro.'
    },

    // --- NÍVEL 4: EXAUSTÃO DIVINA (Tier 4+) ---
    // Tempo: 8 a 12 horas
    'coma_magico': {
        nome: 'Coma Mágico',
        tempoBase: 28800, // 8 horas
        reqCategoria: 'tonicos',
        nivelSeveridade: 4,
        desc: 'A mente se desligou para proteger a alma de se dissipar.'
    },
    'velhice_acelerada': {
        nome: 'Toque do Tempo',
        tempoBase: 36000, // 10 horas
        reqCategoria: 'tonicos',
        nivelSeveridade: 4,
        desc: 'Envelheceu 50 anos em segundos devido a magia cronomante.'
    },
    'vazio_interior': {
        nome: 'Oco Existencial',
        tempoBase: 43200, // 12 horas
        reqCategoria: 'tonicos',
        nivelSeveridade: 4,
        desc: 'Encarou o Abismo e ele olhou de volta. Requer Tônico da Esperança.'
    },
    // ==========================================
    // CATEGORIA: TALISMÃS (ESPIRITUAL/MALDIÇÕES)
    // Foco: Magia Negra, Fantasmas, Sorte, Alma
    // Escala: 10min a 12h
    // ==========================================

    // --- NÍVEL 1: ENCOSTOS E SUPERSTIÇÕES (Tier 1+) ---
    // Tempo: 10 a 30 minutos
    'mau_olhado': {
        nome: 'Mau Olhado',
        tempoBase: 600, // 10 min
        reqCategoria: 'talisma',
        nivelSeveridade: 1,
        desc: 'Inveja de vizinhos ou mercadores rivais. Causa má sorte leve.'
    },
    'sussurros_noturnos': {
        nome: 'Sussurros Noturnos',
        tempoBase: 900, // 15 min
        reqCategoria: 'talisma',
        nivelSeveridade: 1,
        desc: 'Dormiu perto de ruínas antigas. Vozes atrapalham o foco.'
    },
    'aura_fria': {
        nome: 'Aura Fria',
        tempoBase: 1200, // 20 min
        reqCategoria: 'talisma',
        nivelSeveridade: 1,
        desc: 'Passou por um cemitério à noite. Arrepios constantes.'
    },
    'azar_repentino': {
        nome: 'Azar de Duende',
        tempoBase: 1500, // 25 min
        reqCategoria: 'talisma',
        nivelSeveridade: 1,
        desc: 'Tropeça nos próprios pés. Maldição travessa de fadas.'
    },
    'paralisia_do_sono': {
        nome: 'Vulto no Quarto',
        tempoBase: 1800, // 30 min
        reqCategoria: 'talisma',
        nivelSeveridade: 1,
        desc: 'Acordou mas não conseguia se mexer. Energia espiritual baixa.'
    },

    // --- NÍVEL 2: MAGIA NEGRA E FANTASMAS (Tier 2+) ---
    // Tempo: 45 min a 2 horas
    'toque_espectral': {
        nome: 'Toque de Banshee',
        tempoBase: 2700, // 45 min
        reqCategoria: 'talisma',
        nivelSeveridade: 2,
        desc: 'Um fantasma atravessou o corpo do herói. Dano na alma.'
    },
    'silencio_maldito': {
        nome: 'Selo de Silêncio',
        tempoBase: 3600, // 1 hora
        reqCategoria: 'talisma',
        nivelSeveridade: 2,
        desc: 'Maldição de mago rival. Impede a fala e o canto.'
    },
    'marca_da_bruxa': {
        nome: 'Marca da Bruxa',
        tempoBase: 5400, // 1h 30m
        reqCategoria: 'talisma',
        nivelSeveridade: 2,
        desc: 'Um símbolo apareceu na pele. Atrai corvos e raios.'
    },
    'poltergeist_pessoal': {
        nome: 'Poltergeist Pessoal',
        tempoBase: 7200, // 2 horas
        reqCategoria: 'talisma',
        nivelSeveridade: 2,
        desc: 'Objetos voam na direção do trabalhador. Risco alto de acidente.'
    },

    // --- NÍVEL 3: POSSESSÕES E PACTOS (Tier 3+) ---
    // Tempo: 4 a 6 horas
    'possessao_imperfecta': {
        nome: 'Possessão Demoníaca Leve',
        tempoBase: 14400, // 4 horas
        reqCategoria: 'talisma',
        nivelSeveridade: 3,
        desc: 'Um demônio menor está tentando controlar o braço do herói.'
    },
    'maldicao_mumia': {
        nome: 'Maldição do Faraó',
        tempoBase: 18000, // 5 horas
        reqCategoria: 'talisma',
        nivelSeveridade: 3,
        desc: 'Abriu um sarcófago proibido. A carne está virando areia.'
    },
    'vampirismo_astral': {
        nome: 'Vampirismo Astral',
        tempoBase: 21600, // 6 horas
        reqCategoria: 'talisma',
        nivelSeveridade: 3,
        desc: 'A energia vital não regenera mais. Requer exorcismo potente.'
    },

    // --- NÍVEL 4: DANO NA ALMA E DESTINO (Tier 4+) ---
    // Tempo: 8 a 12 horas
    'fragmentacao_alma': {
        nome: 'Alma Fragmentada',
        tempoBase: 28800, // 8 horas
        reqCategoria: 'talisma',
        nivelSeveridade: 4,
        desc: 'Atingido por uma lâmina Lich. Parte da alma ficou na masmorra.'
    },
    'destino_quebrado': {
        nome: 'Fio do Destino Cortado',
        tempoBase: 36000, // 10 horas
        reqCategoria: 'talisma',
        nivelSeveridade: 4,
        desc: 'Ofendeu um Deus menor. A própria existência está instável.'
    },
    'corrupcao_void': {
        nome: 'Chamado do Vazio',
        tempoBase: 43200, // 12 horas
        reqCategoria: 'talisma',
        nivelSeveridade: 4,
        desc: 'Encarou o abismo por muito tempo. Loucura Lovecraftiana.'
    }
};
// ------------------------------------------
// FIM TIPOS DE FERIMENTOS E DOENÇAS
// ------------------------------------------
// ------------------------------------------
// INFO DAS CATEGORIAS MEDICAMENTOS
// ------------------------------------------
export const infoCategorias = {
    'bandagem': {
        nome: 'Curativos',
        icon: '🩹',
        desc: 'Materiais para estancar sangramentos e fechar cortes.\nEssenciais para traumas físicos.'
    },
    'pocao': {
        nome: 'Poções',
        icon: '🧪',
        desc: 'Compostos alquímicos para regeneração acelerada.\nTratam fraturas e danos internos.'
    },
    'ervas': {
        nome: 'Ervas',
        icon: '🌿',
        desc: 'Plantas naturais para combater infecções e febres.\nCura lenta, mas segura.'
    },
    'talas': {
        nome: 'Talas',
        icon: '🩻',
        desc: 'Plantas naturais para combater infecções e febres.\nCura lenta, mas segura.'
    },
    'pomadas': {
        nome: 'Pomadas',
        icon: '🧴',
        desc: 'Plantas naturais para combater infecções e febres.\nCura lenta, mas segura.'
    },
    'antidotos': {
        nome: 'Antídotos',
        icon: '☠️',
        desc: 'Plantas naturais para combater infecções e febres.\nCura lenta, mas segura.'
    },
    'tonicos': {
        nome: 'Tônico',
        icon: '⚗️',
        desc: 'Plantas naturais para combater infecções e febres.\nCura lenta, mas segura.'
    },
    'talisma': {
        nome: 'Talismãs',
        icon: '🧿',
        desc: 'Artefatos místicos infundidos com magia.\nRemovem maldições, medo e danos espirituais.'
    },
    
};
export const nomeProfissao = (func) => {
      const mapa = {
            // Mantidos (Sem alteração solicitada)
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