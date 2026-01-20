// --- CONFIGURAÇÃO DE TIERS ---
export const ORDEM_TIERS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS'];

// Dados básicos
export const DADOS_TIERS = {
    'F': { bonus: [1.05, 1.10], salario: [10, 20] },
    'E': { bonus: [1.09, 1.20], salario: [21, 40] },
    'D': { bonus: [1.18, 1.40], salario: [4100, 8000] },
    'C': { bonus: [1.35, 1.70], salario: [81, 150] },
    'B': { bonus: [1.65, 2.20], salario: [151, 300] },
    'A': { bonus: [2.10, 3.00], salario: [301, 600] },
    'S': { bonus: [2.90, 4.00], salario: [601, 1200] },
    'SS': { bonus: [3.90, 5.00], salario: [10000, 15000] }
};
// --- CONFIGURAÇÃO DE ATRIBUTOS ESPECIAIS (BALANCEAMENTO NOVO) ---
const STATS_ESPECIAIS = {
    administrador: {
        F: [15, 30], E: [25, 45], D: [40, 70], C: [60, 95],
        B: [85, 125], A: [115, 160], S: [150, 195], SS: [185, 230]
    },
    lorde: {
        F: [1, 4], E: [3, 7], D: [6, 10], C: [9, 14],
        B: [13, 18], A: [17, 22], S: [20, 27], SS: [25, 35]
    },
    tesoureiro: {
        F: [0.4, 0.9], E: [0.8, 1.5], D: [1.4, 2.2], C: [2.0, 3.0],
        B: [2.8, 4.0], A: [3.8, 5.2], S: [5.0, 6.5], SS: [6.0, 8.0]
    },
    curandeiro: {
        F: [3, 7], E: [6, 12], D: [10, 16], C: [14, 21],
        B: [19, 27], A: [25, 34], S: [32, 40], SS: [38, 45]
    },
    ferreiro: {
        F: [4, 9], E: [8, 14], D: [12, 20], C: [18, 28],
        B: [26, 38], A: [35, 48], S: [45, 54], SS: [52, 65]
    },
    saqueador: {
        F: [5, 12], E: [10, 18], D: [16, 25], C: [23, 35],
        B: [32, 48], A: [45, 62], S: [60, 68], SS: [65, 80]
    },
    batedor: {
        F: [5, 12], E: [10, 18], D: [16, 25], C: [23, 35],
        B: [32, 48], A: [45, 62], S: [61, 68], SS: [65, 80]
    }
};

export const DESBLOQUEIO_POR_NIVEL = {
    0: -1, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4,
    6: 5, 7: 5, 8: 6, 9: 6, 10: 7
};

// --- MATRIZ DE PROBABILIDADES (CONTRATAÇÃO) ---
const MATRIZ_CHANCES = {
    padrao: {
        1: { F: 100 },
        2: { F: 60, E: 40 },
        3: { F: 45, E: 35, D: 20 },
        4: { F: 35, E: 30, D: 25, C: 10 },
        5: { F: 30, E: 25, D: 25, C: 15, B: 5 },
        6: { F: 30, E: 25, D: 20, C: 15, B: 8, A: 2 },
        7: { F: 28, E: 24, D: 20, C: 16, B: 9, A: 3 },
        8: { F: 26, E: 24, D: 20, C: 18, B: 9, A: 3 },
        9: { F: 23, E: 22, D: 20, C: 20, B: 11, A: 3.96, S: 0.03, SS: 0.01 },
        //10: { F: 19.94, E: 20, D: 20, C: 20, B: 15, A: 5, S: 0.05, SS: 0.01 }
        10: { F: 0, E: 0, D: 0, C: 100, B: 0, A: 0, S: 0, SS: 0 }
    },
    elite: {
        2: { F: 30, E: 70 },
        3: { F: 20, E: 30, D: 50 },
        4: { F: 15, E: 25, D: 30, C: 30 },
        5: { F: 12, E: 18, D: 24, C: 30, B: 16},
        6: { F: 10, E: 15, D: 20, C: 25, B: 20, A: 10 },
        7: { F: 8, E: 12, D: 18, C: 25, B: 22, A: 15 },
        8: { F: 5, E: 10, D: 15, C: 25, B: 28.5, A: 15, S: 1.5 },
        9: { F: 3, E: 7, D: 14, C: 22, B: 30, A: 20.4, S: 3.5, SS: 0.1 },
        10: { F: 1, E: 4, D: 10, C: 19.5, B: 30, A: 30, S: 5, SS: 0.5 }
    }
};

// --- MATRIZ DE FUSÃO (BASE) ---
const MATRIZ_FUSAO = {
    'F': { upgrade: 100, manter: 0, downgrade: 0 },
    'E': { upgrade: 80, manter: 20, downgrade: 0 },
    'D': { upgrade: 60, manter: 40, downgrade: 0 },
    'C': { upgrade: 50, manter: 50, downgrade: 0 },
    'B': { upgrade: 40, manter: 50, downgrade: 10 },
    'A': { upgrade: 25, manter: 60, downgrade: 15 },
    'S': { upgrade: 10, manter: 65, downgrade: 25 },
    'SS': { upgrade: 0, manter: 100, downgrade: 0 }
};

const NOMES_M = [
    'Aldric', 'Borin', 'Cedric', 'Darian', 'Eldrin',
    'Faelar', 'Garrick', 'Haldor', 'Ithran', 'Jorvan',
    'Kael', 'Loric', 'Marek', 'Nydor', 'Orin',
    'Perrin', 'Quorin', 'Roderic', 'Sylas', 'Tharion',
    'Ulric', 'Vaelin', 'Wendell', 'Xandar', 'Yorin',
    'Zarek', 'Alaric', 'Branor', 'Caius', 'Dorian', 'Evander',
    'Fenris', 'Galen', 'Hadrian', 'Isen', 'Jareth',
    'Kieran', 'Lucian', 'Magnus', 'Nolan', 'Oberon',
    'Phineas', 'Quintus', 'Ronan', 'Soren', 'Tavian',
    'Ulthar', 'Vesper', 'Wulfric', 'Xavian', 'Yorick',
    'Zephyr', 'Cassian', 'Darius', 'Emrys', 'Felix', 'Gideon',
    'Hector', 'Ignatius', 'Julian', 'Kalos', 'Leander',
    'Marcellus', 'Nero', 'Octavian', 'Percival', 'Quillon',
    'Raphael', 'Sebastian', 'Tiberius', 'Valerius',
    'Xerxes', 'Zoltan', 'Alistair', 'Balthazar', 'Cyrus', 'Damon', 'Ezekiel',
    'Finnian', 'Griffin', 'Hawke', 'Icarus', 'Jaxon',
    'Kendrick', 'Lysander', 'Malachi', 'Nikolai', 'Orion',
    'Pharaoh', 'Quasar', 'Rafferty', 'Stellan', 'Theron',
    'Ulysses', 'Vladimir', 'Wraith', 'Xanthus', 'Yarden',
    'Zephyrus'
];
const NOMES_F = [
    'Alena', 'Brina', 'Cerys', 'Daena', 'Elira',
    'Fiora', 'Gwenna', 'Helena', 'Isolde', 'Jasira',
    'Kallia', 'Lyra', 'Mirela', 'Nerissa', 'Odette',
    'Priya', 'Quilla', 'Rhiannon', 'Selene', 'Talia',
    'Vesna', 'Wynna', 'Xylia', 'Yara', 'Zara', 'Aurora', 'Seraphina', 'Lunara', 'Elysia', 'Marisella',
    'Celestria', 'Valeria', 'Isabella', 'Ophelia', 'Celestia',
    'Aria', 'Elowen', 'Thalassa', 'Nymeria', 'Zephyra',
    'Calista', 'Selestia', 'Lyric', 'Amara', 'Serena',
    'Violetta', 'Mirabella', 'Evangeline', 'Liora', 'Cassandra',
    'Felicity', 'Isadora', 'Octavia', 'Rosalind', 'Vivienne',
    'Emberlyn', 'Sylvara', 'Damaris', 'Elara', 'Faelina',
    'Galadriel', 'Heliora', 'Ilyana', 'Jovanna', 'Kaelith',
    'Lunethia', 'Maerwynn', 'Nimue', 'Orinthia', 'Persephone',
    'Queniva', 'Ravenna', 'Seraphine', 'Thessalia', 'Umbrielle',
    'Vespera', 'Willowyn', 'Xanthea', 'Ysolde', 'Zinnia', 'Celandine', 'Elaria', 'Faylinn', 'Giselle', 'Hespera',
    'Illyria', 'Jacintha', 'Kierana', 'Melisande', 'Nerina',
    'Olwen', 'Phaedra', 'Quintessa', 'Rhianna', 'Tamsin',
    'Ulalia', 'Virelia', 'Wisteria', 'Xyliana', 'Yvaine',
    'Zorya', 'Amethyst', 'Briseis', 'Calantha', 'Desdemona', 'Evadne',
    'Fiammetta', 'Gwyneira', 'Hypatia', 'Ismeria', 'Kallistrate',
    'Lunaria', 'Melantha', 'Oceane', 'Rosenwyn', 'Willowisp',
    'Xanthe', 'Aurelia', 'Bellatrix', 'Cressida', 'Dione',
    'Galenna', 'Ianthe', 'Marcelline'
];
const SOBRENOMES = [
    'Valemont', 'Ravencroft', 'Stoneford', 'Windmere', 'Ashford',
    'Blackwell', 'Brightwater', 'Coldstream', 'Dawnridge', 'Eaglecrest',
    'Fairbrook', 'Goldhaven', 'Highmoor', 'Ironwood', 'Kingsfall',
    'Lightmere', 'Mistvale', 'Northwatch', 'Oakenshield', 'Redmont',
    'Riversong', 'Shadowmere', 'Silverkeep', 'Stormhold', 'Sunreach',
    'Thornfield', 'Truehart', 'Westvale', 'Whitecliff', 'Wintermere',
    'Amberfall', 'Brookstone', 'Clearwind', 'Deepmere', 'Evendell',
    'Frostmere', 'Greystone', 'Hollowmere', 'Longford', 'Stillwater',
    'Swiftbrook', 'Brightvale', 'Moonshadow', 'Starhaven', 'Duskwood',
    'Silvermoon', 'Goldenleaf', 'Crystalbrook', 'Sunshadow', 'Nightbreeze',
    'Rainwhisper', 'Stormrider', 'Thundershade', 'Windrider', 'Firesong',
    'Earthshaker', 'Skybreaker', 'Wavecrest', 'Ironfist', 'Stonehammer',
    'Flameheart', 'Shadowbane', 'Lightbringer', 'Dawnseeker', 'Nightwalker',
    'Stormcaller', 'Windwhisper', 'Frostwind', 'Earthwarden', 'Firewalker',
    'Skywatcher', 'Wavebreaker', 'Ironclad', 'Stoneguard', 'Flamestrike',
    'Shadowstrike', 'Lightweaver', 'Dawnbringer', 'Nightshade', 'Stormblade',
    'Windstorm', 'Frostblade', 'Firestorm', 'Skyblade', 'Waveweaver',
    'Ironshadow', 'Stoneflame', 'Flamewarden', 'Shadowflame', 'Lightshadow',
    'Dawnshadow', 'Nightflame', 'Stormshadow', 'Windflame', 'Frostshadow',
    'Earthflame', 'Fireshadow', 'Skyflame', 'Waveflame', 'Ironflame'
];
// --- LISTA DE RAÇAS (POR FUTURAS IMPLEMENTAÇÕES) ---
const RACAS = [
    'humano', 'draconiano', 'elfo', 'sombrineo', 'espectral', 
    'lobisomem', 'automato', 'serpentideo', 'corvido', 'tiefling'
];
export const CLASSES_RPG = [
    'Cavaleiro', 'Berserker', 'Ladino', 'Arqueiro', 
    'Arquimago', 'Necromante', 'Templário', 'Assassino', 'Demonologista'
];
const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- FUNÇÃO AUXILIAR: PROBABILIDADES ---
const calcularTabela = (tipoTabela, nivel, bonus) => {
    const base = MATRIZ_CHANCES[tipoTabela][nivel];
    if (!base) return null;

    let pesos = { ...base };
    let pesoTotal = 0;

    if (bonus > 0) {
        const fator = 1 + (bonus / 100);
        ['B', 'A', 'S', 'SS'].forEach(t => {
            if (pesos[t]) pesos[t] *= fator;
        });
    }

    for (let t in pesos) pesoTotal += pesos[t];

    let porcentagens = {};
    for (let t in pesos) {
        porcentagens[t] = ((pesos[t] / pesoTotal) * 100).toFixed(2);
    }
    return porcentagens;
};

export const obterProbabilidades = (nivelTaverna, bonusSorte = 0) => {
    const nivel = Math.min(nivelTaverna, 10);
    return {
        padrao: calcularTabela('padrao', nivel, bonusSorte),
        elite: calcularTabela('elite', nivel, bonusSorte)
    };
};

// --- GERADORES ---

const gerarBuffsComandante = (tier) => {
    const mult = { 'F': 1, 'E': 1.2, 'D': 1.5, 'C': 2, 'B': 3, 'A': 5, 'S': 8, 'SS': 15 }[tier] || 1;
    const tiposPossiveis = ['ataque', 'defesa', 'velocidade', 'xp', 'sorte'];
    let qtdBuffs = 1;
    if (tier === 'S') qtdBuffs = 2;
    if (tier === 'SS') qtdBuffs = 3;

    const tiposEscolhidos = tiposPossiveis.sort(() => 0.5 - Math.random()).slice(0, qtdBuffs);
    const atributosGerados = {};

    tiposEscolhidos.forEach(tipo => {
        if (tipo === 'ataque') atributosGerados.ataque = Math.floor(randomRange(5, 10) * mult);
        if (tipo === 'defesa') atributosGerados.defesa = Math.floor(randomRange(5, 10) * mult);
        if (tipo === 'velocidade') atributosGerados.velocidade = Math.floor(randomRange(1, 5) * mult);
        if (tipo === 'xp') atributosGerados.xp = parseFloat((Math.random() * mult).toFixed(1));
        if (tipo === 'sorte') atributosGerados.sorte = Math.floor(randomRange(1, 3) * mult);
    });

    return atributosGerados;
};

export const criarObjetoFuncionario = (tier, nivelTaverna = 1, profissaoFixa = null, racaFixa = null, sexoFixo = null, isPremium = false, classeFixa = null) => {
    const dados = DADOS_TIERS[tier];

    // Lista de trabalhadores comuns (Vão para as Casas)
    const profissoesComuns = ['minerador', 'lenhador', 'cacador', 'academico', 'aventureiro', 'saqueador', 'batedor'];

    // --- CONFIGURAÇÃO DOS ESPECIAIS ---
    // Regra 1: Nível da Taverna necessário
    // Regra 2: Tier Mínimo necessário (Bancário E+, Ferreiro D+, etc)
    const configEspeciais = [
        { id: 'tesoureiro', minNivel: 2, minTier: 'E' }, // bancario -> tesoureiro
        { id: 'ferreiro',   minNivel: 3, minTier: 'D' }, // Mantido
        { id: 'lorde',      minNivel: 4, minTier: 'C' }, // prefeito -> lorde
        { id: 'curandeiro', minNivel: 5, minTier: 'B' }, // medico -> curandeiro
        { id: 'administrador', minNivel: 6, minTier: 'A' } // gerente -> administrador
    ];

    let listaSorteio = [...profissoesComuns];
    const idxTierAtual = ORDEM_TIERS.indexOf(tier);

    // Só adiciona especiais na roleta se for PREMIUM (Botão Elite)
    if (isPremium) {
        configEspeciais.forEach(esp => {
            const idxMinTier = ORDEM_TIERS.indexOf(esp.minTier);
            
            // Se o nível da taverna permite E o tier sorteado é suficiente
            if (nivelTaverna >= esp.minNivel && idxTierAtual >= idxMinTier) {
                listaSorteio.push(esp.id);
            }
        });
    }

    const sexo = sexoFixo || (Math.random() > 0.5 ? 'masculino' : 'feminino');
    const listaNomes = sexo === 'masculino' ? NOMES_M : NOMES_F;
    const nomeFinal = `${pickRandom(listaNomes)} ${pickRandom(SOBRENOMES)}`;

    // Geração da Imagem
    const racaEscolhida = racaFixa || pickRandom(RACAS);
    
    // Sorteia a profissão (agora incluindo os especiais válidos se for o caso)
    let profissaoFinal = profissaoFixa || pickRandom(listaSorteio);
    // 1. Define o sufixo do sexo (_m ou _f)
    const sulfixoSexo = (sexo === 'masculino') ? 'm' : 'f';

    // 2. Lista de profissões que possuem imagem exclusiva na pasta
    const cargosComImagemPropria = ['tesoureiro', 'ferreiro', 'administrador', 'curandeiro', 'lorde'];

    let imagemNome = '';

    // 3. Verifica: Se a profissão sorteada está na lista especial, usa o nome dela.
    if (cargosComImagemPropria.includes(profissaoFinal)) {
        // Exemplo: 'bancario_m', 'medico_f'
        imagemNome = `${profissaoFinal}_${sulfixoSexo}`;
    } 
    else {
        // 4. Se for profissão comum (Lenhador, Minerador, etc), usa uma imagem NEUTRA
        // Sorteia um número de 1 a 5 (já que vi que você tem neutro_1 até neutro_5)
        const numAleatorio = Math.floor(Math.random() * 5) + 1;
        
        // Exemplo: 'neutro_3_m', 'neutro_1_f'
        imagemNome = `neutro_${numAleatorio}_${sulfixoSexo}`;
    }

    
    let salarioFinal = randomRange(dados.salario[0], dados.salario[1]);
    let buffsBatalha = null;
    let statPrincipal = 0;
    let descricaoPassiva = ""; 

    // --- ATRIBUTOS DOS ESPECIAIS (ATUALIZADO PARA LER DA TABELA) ---
    const listaIdsEspeciais = configEspeciais.map(e => e.id);
    
    // Verifica se a profissão está na nossa tabela de Stats Especiais (inclui saqueador e batedor agora)
    if (STATS_ESPECIAIS[profissaoFinal]) {
        
        // Se for Elite (Gerente, Prefeito, etc), aplica bônus de salário
        if (listaIdsEspeciais.includes(profissaoFinal)) {
            salarioFinal *= randomRange(25, 40);
        }

        // Pega os limites (Min e Max) da tabela de configuração
        const limitesStat = STATS_ESPECIAIS[profissaoFinal][tier];

        if (limitesStat) {
            // Se for Bancário, precisa de número quebrado (float)
            if (profissaoFinal === 'bancario') {
                statPrincipal = parseFloat(randomFloat(limitesStat[0], limitesStat[1]));
            } else {
                // Para os outros, número inteiro
                statPrincipal = randomRange(limitesStat[0], limitesStat[1]);
            }
        }

        // Define as descrições automáticas
        switch (profissaoFinal) {
            case 'administrador': descricaoPassiva = "Aumenta chance de Tiers raros."; break;
            case 'lorde': descricaoPassiva = `Reduz custo de construções em ${statPrincipal}%.`; break;
            case 'tesoureiro': descricaoPassiva = `Rende ${statPrincipal}% do ouro atual por hora.`; break;
            case 'curandeiro': descricaoPassiva = `Reduz tempo de feridos em ${statPrincipal}%.`; break;
            case 'ferreiro': descricaoPassiva = `Acelera produção na Ferraria em ${statPrincipal}%.`; break;
        }
    }
    // Nova lógica para Aventureiros
    let classeSorteada = null;
    if (profissaoFinal === 'aventureiro') {
        // Se veio uma classe fixa (da fusão), usa ela. Se não, sorteia.
        if (classeFixa) {
            classeSorteada = classeFixa;
        } else {
            // Caso não tenha CLASSES_RPG definido, defina ou importe aqui
            // classeSorteada = pickRandom(CLASSES_RPG); 
            // Como segurança, se não achar a lista, cria uma básica:
            const listaClasses = ['Cavaleiro', 'Berserker', 'Ladino', 'Arqueiro', 'Arquimago', 'Necromante', 'Templário', 'Assassino', 'Demonologista'];
            classeSorteada = pickRandom(listaClasses);
        }
        salarioFinal = Math.floor(salarioFinal * 1.5);
    }

    return {
        id: Date.now() + Math.random().toString(16).slice(2),
        nome: nomeFinal,
        raca: racaEscolhida,
        sexo: sexo,
        profissao: profissaoFinal,
        tier: tier,
        salario: salarioFinal,
        bonus: parseFloat(randomFloat(dados.bonus[0], dados.bonus[1])), // Bônus de produção
        pago: true, // Se já foi pago o salário do dia
        diasEmGreve: 0, // Contador de dias em greve
        imagem: imagemNome, // Nome do arquivo de imagem
        classe: classeSorteada, // Apenas para aventureiros
        atributos: buffsBatalha, // Apenas para comandantes (desativado por enquanto)
        poderEspecial: statPrincipal, // Apenas para especiais
        desc: descricaoPassiva, // Apenas para especiais
        isEspecial: listaIdsEspeciais.includes(profissaoFinal) 
    };
};

export const gerarFuncionario = (nivelTaverna = 1, profissaoFixa = null, isPremium = false, bonusSorteGerentes = 0) => {
    const tipoTabela = isPremium ? 'elite' : 'padrao';
    const nivel = Math.min(nivelTaverna, 10);

    let chancesNivel = JSON.parse(JSON.stringify(MATRIZ_CHANCES[tipoTabela][nivel]));
    if (!chancesNivel && isPremium) chancesNivel = JSON.parse(JSON.stringify(MATRIZ_CHANCES['padrao'][nivel]));

    if (bonusSorteGerentes > 0) {
        const fator = 1 + (bonusSorteGerentes / 100);
        ['B', 'A', 'S', 'SS'].forEach(t => {
            if (chancesNivel[t]) chancesNivel[t] *= fator;
        });
    }

    let totalChance = 0;
    for (let key in chancesNivel) totalChance += chancesNivel[key];

    const r = Math.random() * totalChance;
    let acumulado = 0;
    let tierEscolhido = 'F';

    for (const [tier, chance] of Object.entries(chancesNivel)) {
        acumulado += chance;
        if (r <= acumulado) {
            tierEscolhido = tier;
            break;
        }
    }

    const func = criarObjetoFuncionario(tierEscolhido, nivel, profissaoFixa, null, null, isPremium);   

    if (profissaoFixa) func.salario *= 2;
    return func;
};

// --- FUSÃO COM BÔNUS NERFADO ---
export const calcularChancesFusao = (tierAtual, nivelTaverna, bonusSorte = 0, temSinergia = false) => {
    const idx = ORDEM_TIERS.indexOf(tierAtual);
    const idxMaxDesbloqueado = DESBLOQUEIO_POR_NIVEL[Math.min(nivelTaverna, 10)];

    if (tierAtual === 'SS') return { upgrade: 0, manter: 100, downgrade: 0, erro: "Tier Máximo" };

    const base = MATRIZ_FUSAO[tierAtual];

    // Se o upgrade já for 100% (Tier F), não precisa calcular bônus
    if (base.upgrade >= 100) {
        return { ...base };
    }

    // Aplica Bônus no Upgrade
    let pesoUpgrade = base.upgrade;
    
    // 1. Bônus de Gerentes (Influência)
    if (bonusSorte > 0) {
        const fator = 1 + (bonusSorte / 100);
        pesoUpgrade *= fator;
    }

    // 2. Bônus de Sinergia (Raça ou Profissão iguais)
    // Aumenta o "peso" do upgrade em 20% (multiplicador 1.2)
    if (temSinergia) {
        pesoUpgrade *= 1.2; 
    }

    const pesoTotal = pesoUpgrade + base.manter + base.downgrade;

    // Normaliza para %
    let prob = {
        upgrade: parseFloat(((pesoUpgrade / pesoTotal) * 100).toFixed(1)),
        manter: parseFloat(((base.manter / pesoTotal) * 100).toFixed(1)),
        downgrade: parseFloat(((base.downgrade / pesoTotal) * 100).toFixed(1))
    };

    // Ajuste de arredondamento
    const soma = prob.upgrade + prob.manter + prob.downgrade;
    if (soma !== 100) {
        prob.manter += (100 - soma); 
        prob.manter = parseFloat(prob.manter.toFixed(1));
    }

    // Trava de Nível da Taverna
    if (idx + 1 > idxMaxDesbloqueado) {
        prob.manter += prob.upgrade;
        prob.upgrade = 0;
        prob.travado = true;
    }

    return prob;
};
// --- PROCESSAR FUSÃO ---
export const processarFusao = (tierAtual, nivelTaverna, profissaoFixa, racaFixa, bonusSorte = 0, temSinergia = false, classeFixa = null) => {
    // Agora passamos 'temSinergia' para o cálculo matemático
    const chances = calcularChancesFusao(tierAtual, nivelTaverna, bonusSorte, temSinergia);
    
    const rand = Math.random() * 100;
    const idx = ORDEM_TIERS.indexOf(tierAtual);
    let novoTier = tierAtual;

    // Determina o novo Tier
    if (rand < chances.downgrade) novoTier = ORDEM_TIERS[idx - 1];
    else if (rand < (chances.downgrade + chances.manter)) novoTier = tierAtual;
    else novoTier = ORDEM_TIERS[idx + 1];

    const proibidosNaFusao = ['administrador', 'lorde', 'tesoureiro', 'curandeiro', 'ferreiro'];
    
    // Gera o novo funcionário passando a racaFixa também
    // Nota: Passamos 'null' no sexoFixo para continuar aleatório
    let obj = criarObjetoFuncionario(novoTier, nivelTaverna, profissaoFixa, racaFixa, null, false, classeFixa);
    
    // Garante que não saia um especial na fusão
    while (proibidosNaFusao.includes(obj.profissao)) {
        obj = criarObjetoFuncionario(novoTier, nivelTaverna, profissaoFixa, racaFixa, null, false, classeFixa);
    }
    return obj;
};