import { supabase } from './supabase.js';
import { reactive, computed } from 'vue';
import { tabelaMinerais, tabelaItens, tabelaCarcacas, catalogoMedicamentos, tiposFerimentos } from './dados.js';
import { gerarFuncionario, criarObjetoFuncionario, processarFusao, calcularChancesFusao, ORDEM_TIERS } from './funcionarios.js';

// --- DADOS DE ESTUDO BIBLIOTECA---
export const DADOS_ESTUDO = {
    'pergaminho_comum': { nome: 'Pergaminho Comum', xp: 10, tempo: 60, cor: '#f1c40f' }, // 60 seg
    'tabula_pedra':     { nome: 'Tábula de Pedra',  xp: 50, tempo: 300, cor: '#95a5a6' }, // 5 min
    'tomo_antigo':      { nome: 'Tomo Criptografado', xp: 200, tempo: 1200, cor: '#8e44ad' } // 20 min
};
// --- CONFIGURAÇÃO DOS PRÉDIOS (NOVO) ---
// Aqui você define as regras de cada prédio em um lugar só.
// attrNivel: nome da variável dentro do 'jogo' que guarda o nível
// attrCusto: nome da variável dentro do 'jogo' que guarda o custo
// multiplicador: quanto o preço sobe a cada nível (1.5 = +50%)
// tempoBase: tempo em segundos para construir
// efeitos: coisas extras que acontecem ao terminar (como aumentar população)
const DADOS_CONSTRUCOES = {
    casa: { 
        attrNivel: 'casas', 
        attrCusto: 'custoCasa', 
        multiplicador: 1.3, 
        tempoBase: 10,
        efeitos: () => { jogo.populacaoMax += 2; } 
    },
    armazem: { 
        attrNivel: 'armazens', 
        attrCusto: 'custoArmazem', 
        multiplicador: 1.4, 
        tempoBase: 15 
    },
    prefeitura: { 
        attrNivel: 'prefeitura', 
        attrCusto: 'custoPrefeitura', 
        multiplicador: 2.5, 
        tempoBase: null, // Usa cálculo especial
        calcTempo: (nivel) => Math.min(Math.floor(20 + Math.pow(nivel, 2.2) * 20), 14400)
    },
    mina: { 
        attrNivel: 'mina', 
        attrCusto: 'custoMina', 
        multiplicador: 1.8, 
        tempoBase: null,
        calcTempo: (nivel) => Math.min(Math.floor(20 + Math.pow(nivel, 2.2) * 20), 14400)
    },
    ferraria: { 
        attrNivel: 'ferraria', 
        attrCusto: 'custoFerraria', 
        multiplicador: 1.5, // Adicionei um custo crescente que não tinha antes
        tempoBase: 60 
    },
    taverna: { 
        attrNivel: 'taverna', 
        attrCusto: 'custoTaverna', 
        multiplicador: 1.6, 
        tempoBase: 40 
    },
    biblioteca: { 
    attrNivel: 'biblioteca',      // Nome exato da variável no 'jogo'
    attrCusto: 'custoBiblioteca', // Nome exato do custo no 'jogo'
    multiplicador: 1.6, 
    tempoBase: 20 
    },
    camaraProcessamento: { 
        attrNivel: 'camaraProcessamento', 
        attrCusto: 'custoCamaraProcessamento', 
        multiplicador: 1.5, 
        tempoBase: 30 
    },
    enfermaria: { 
        attrNivel: 'enfermaria', 
        attrCusto: 'custoEnfermaria', 
        multiplicador: 1.5, 
        tempoBase: 30 
    },
};
export const ui = reactive({
    modal: { aberto: false, titulo: '', texto: '', tipo: 'confirmacao', onConfirm: null }
});

// --- VERSÃO LOCAL (SEM INTERNET) ---
async function obterDataInternet() {
    // Retorna a data do seu computador instantaneamente
    return new Date().toISOString().split('T')[0];
}

// --- FUNÇÃO DE RESET DIÁRIO (CORREÇÃO DO BUG) ---
async function verificarNovoDia() {
    const dataInternet = await obterDataInternet();
    if (!dataInternet) return; // Sem internet, mantém como está

    // Se a data mudou, reseta tudo
    if (jogo.ultimoDiaContratacao !== dataInternet) {
        jogo.ultimoDiaContratacao = dataInternet;
        jogo.contratacoesHoje = 0;
        jogo.contratacoesEliteHoje = 0;
        processarPagamentoSalarios(); // Cobra salários na virada
        // console.log("Dia virou! Contadores resetados.");
        salvarNaNuvem();
    }
}

export function pedirConfirmacao(titulo, texto, callbackAcao) {
    ui.modal.tipo = 'confirmacao'; ui.modal.titulo = titulo; ui.modal.texto = texto; ui.modal.onConfirm = callbackAcao; ui.modal.aberto = true;
}
export function mostrarAviso(titulo, texto, tipo = 'aviso') {
    ui.modal.tipo = tipo; ui.modal.titulo = titulo; ui.modal.texto = texto; ui.modal.onConfirm = null; ui.modal.aberto = true;
}

let loopId = null;
const calcularTempoConstrucao = (n) => Math.min(Math.floor(20 + Math.pow(n, 2.2) * 20), 14400);

const mineriosIniciais = {}; const trabalhoInicial = {}; const timersIniciais = {};
// Inicializa a alocação (slots vazios)
const alocacaoInicial = {};
const bancoInicial = {};
tabelaMinerais.forEach(m => { mineriosIniciais[m.id] = 0; trabalhoInicial[m.id] = 0; timersIniciais[m.id] = 0; });
const itensIniciais = {}; tabelaItens.forEach(i => itensIniciais[i.id] = 0);
tabelaCarcacas.forEach(i => itensIniciais[i.id] = 0);

// --- ESTADO DO JOGO ---
export const jogo = reactive({
    equipamentos: [],
    poMistico: 0,
    tempoOciosidadeFila: 0,
    madeira: 100, carne: 100, ouro: 500, ciencia: 0, couro: 0,
    funcionarios: [],

    // Controle Diário
    contratacoesHoje: 0,
    contratacoesEliteHoje: 0,
    ultimoDiaContratacao: null,
    
    
    armazens: 0, custoArmazem: { madeira: 150, pedra: 50 },
    alocacaoMina: { ...alocacaoInicial }, // Guarda IDs: { pedra: ['id_joao', null], ... }
    bancoMinerios: { ...bancoInicial },   // Guarda frações de minério (ex: 0.45)
    biblioteca: 0, custoBiblioteca: { madeira: 300, pedra: 150, ouro: 50 },    
    alocacaoBiblioteca: [null, null, null], // Slots de estudo na biblioteca
    camaraProcessamento: 0, custoCamaraProcessamento: { madeira: 1, pedra: 1, ouro: 1 }, // Custo inicial da camara de processamento
    alocacaoCamaraProcessamento: [null], // Slots de funcionarios na camara de processamento ( 1 slot por enquanto )
    // Usamos Array.from para garantir que cada slot seja um objeto ÚNICO na memória
    processamento: Array.from({ length: 8 }, () => ({ 
        item: null, 
        tempoTotal: 0, 
        tempoRestante: 0, 
        progresso: 0 
    })),

    casas: 0, custoCasa: { madeira: 50, pedra: 10 },
    construindo: { tipo: null, tempoRestante: 0, tempoTotal: 0 },
    craftando: [], // Mudou de objeto {} para lista []
    desempregados: 0, lenhadores: 0, esfoladores: 0, academicos: 0, mineradores: 0, populacaoMax: 5,
    enfermaria: 0, custoEnfermaria: { madeira: 400, pedra: 200 },
    alocacaoEnfermaria: [null], // Slots de funcionarios na enfermaria ( 1 slot por enquanto )
    modoAutomaticoEnfermaria: false, // O botão liga/desliga
    tempoSemPaciente: 0, // Contador para ativar sozinho após 30min
    leitos: Array.from({ length: 3 }, (_, index) => ({ id: index, ocupado: null })),
    filaDeEspera: [
        // --- BANDAGENS (Cortes) ---
        { id: 't_01', nome: 'Recruta Azarado', doenca: 'corte_leve', tipo: 'tropa', qtd: 5, tempoTotal: 60, tempoAtual: 0, icone: '/assets/ui/icone_tropa.png' },
        { id: 't_02', nome: 'Lenhador Descuidado', doenca: 'corte_profundo', tipo: 'especial', qtd: 1, tempoTotal: 120, tempoAtual: 0, icone: '/assets/faces/humano/neutro_1_m.png' },
        
        // --- POÇÕES (Danos Internos) ---
        { id: 't_03', nome: 'Batedor Exausto', doenca: 'hemorragia_interna', tipo: 'tropa', qtd: 2, tempoTotal: 180, tempoAtual: 0, icone: '/assets/ui/icone_tropa.png' },
        
        // --- ERVAS (Infecções) ---
        { id: 't_04', nome: 'Aldeão Doente', doenca: 'febre_do_pantano', tipo: 'especial', qtd: 1, tempoTotal: 300, tempoAtual: 0, icone: '/assets/faces/humano/neutro_2_f.png' },
        
        // --- TALAS (Ossos) ---
        { id: 't_05', nome: 'Minerador Caído', doenca: 'fratura_exposta', tipo: 'especial', qtd: 1, tempoTotal: 600, tempoAtual: 0, icone: '/assets/faces/anao/neutro_1_m.png' },
        { id: 't_06', nome: 'Guerreiro Esmagado', doenca: 'costelas_quebradas', tipo: 'tropa', qtd: 1, tempoTotal: 500, tempoAtual: 0, icone: '/assets/ui/icone_tropa.png' },

        // --- POMADAS (Queimaduras/Pele) ---
        { id: 't_07', nome: 'Alquimista Chamuscado', doenca: 'queimadura_quimica', tipo: 'especial', qtd: 1, tempoTotal: 400, tempoAtual: 0, icone: '/assets/faces/elfo/neutro_1_m.png' },
        { id: 't_08', nome: 'Ferreiro Tostado', doenca: 'queimadura_termica', tipo: 'especial', qtd: 1, tempoTotal: 250, tempoAtual: 0, icone: '/assets/faces/humano/neutro_3_m.png' },

        // --- ANTÍDOTOS (Venenos) ---
        { id: 't_09', nome: 'Explorador da Caverna', doenca: 'picada_aranha', tipo: 'tropa', qtd: 3, tempoTotal: 350, tempoAtual: 0, icone: '/assets/ui/icone_tropa.png' },
        { id: 't_10', nome: 'Degustador Real', doenca: 'envenenamento_comida', tipo: 'especial', qtd: 1, tempoTotal: 150, tempoAtual: 0, icone: '/assets/faces/humano/nobre_1_m.png' },

        // --- TÔNICOS (Fadiga/Mental) ---
        { id: 't_11', nome: 'Sentinela Noturna', doenca: 'exaustao_extrema', tipo: 'tropa', qtd: 4, tempoTotal: 200, tempoAtual: 0, icone: '/assets/ui/icone_tropa.png' },
        { id: 't_12', nome: 'Mago Drenado', doenca: 'esgotamento_magico', tipo: 'especial', qtd: 1, tempoTotal: 800, tempoAtual: 0, icone: '/assets/faces/elfo/mago_1_f.png' },

        // --- TALISMÃS (Maldições) ---
        { id: 't_13', nome: 'Paladino Amaldiçoado', doenca: 'maldicao_sombria', tipo: 'especial', qtd: 1, tempoTotal: 1200, tempoAtual: 0, icone: '/assets/faces/humano/paladino_1_m.png' },
        { id: 't_14', nome: 'Vítima de Assombração', doenca: 'toque_espectral', tipo: 'tropa', qtd: 1, tempoTotal: 900, tempoAtual: 0, icone: '/assets/ui/icone_tropa.png' },
        { id: 't_15', nome: 'Aventureiro Azarado', doenca: 'azar_antigo', tipo: 'especial', qtd: 1, tempoTotal: 600, tempoAtual: 0, icone: '/assets/faces/orc/neutro_1_m.png' }
    ],
    // Loadout também precisa ser global para o loop saber qual item usar
    loadoutEnfermaria: {
        'bandagem': 'bandagem_comum',
        'pocao': 'pocao_vida_p',
        'ervas': 'ervas_comuns',
        // Adicione as outras categorias padrão para evitar erro se o jogo buscar
        'talisma': 'talisma_cura', 
        'talas': 'tala_madeira',   // (Se criar o item depois)
        'pomadas': 'pomada_base',  // (Se criar o item depois)
        'antidotos': 'antidoto_p', // (Se criar o item depois)
        'tonicos': 'tonico_revigorante' // (Se criar o item depois)
    },
    estudos: [
        { item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 }, // Slot 0 (Principal)
        { item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 }, // Slot 1 (Fila 1)
        { item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 },  // Slot 2 (Fila 2)
        { item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 }   // Slot 3 (Fila 3)
    ],
    ferraria: 0, custoFerraria: { madeira: 500, pedra: 200 },
    itens: { ...itensIniciais,
        pergaminho_comum: 5, 
        tabula_pedra: 2,
        tomo_antigo: 1 
    },
    mina: 0, custoMina: { madeira: 200, carne: 100 },    
    minerios: { pedra: 20, cobre: 0, ferro: 0, prata: 0, ouro_min: 0, obsidiana: 0, titanio: 0, diamante: 0, mithril: 0, aetherium: 0 },
    prefeitura: 1, custoPrefeitura: { madeira: 100, pedra: 100, carne: 50 },
    taverna: 0, custoTaverna: { madeira: 200, pedra: 100 },
    ultimaAtualizacao: Date.now(),
});

// --- COMPUTEDS ---
export const limites = reactive({
    casas: computed(() => jogo.prefeitura * 3),
    recursos: computed(() => Math.floor(200 + (jogo.armazens * 500))),
    // 1 vaga especial a cada 3 níveis de prefeitura 
    vagasEspeciais: computed(() => Math.ceil(jogo.prefeitura / 3))
});
export const populacaoTotal = computed(() => jogo.funcionarios.length);
export const custoContratacao = computed(() => (jogo.taverna || 1) * 500);

export const bonusSorteTotal = computed(() => {
    return jogo.funcionarios
        .filter(f => f.profissao === 'administrador' && f.diasEmGreve === 0)
        .reduce((acc, curr) => {
            const base = curr.poderEspecial || curr.poderGerencia || 0;
            
            // Aplica o buff racial na sorte também
            const pctBuff = obterBuffRaca(curr);
            const multi = 1 + (pctBuff / 100);
            
            return acc + (base * multi);
        }, 0);
});
// --- LÓGICA DE PRODUÇÃO DA MINA ---
export function calcularProducaoPorMinuto(minerioId) {
    const dados = tabelaMinerais.find(m => m.id === minerioId);
    if (!dados) return 0;

    const slots = jogo.alocacaoMina[minerioId]; // [id1, id2]
    if (!slots) return 0;

    let producaoTotal = 0;

    // Slot 1 (100% Eficiência)
    if (slots[0]) {
        const f1 = jogo.funcionarios.find(f => f.id === slots[0]);
        if (f1 && f1.diasEmGreve === 0) {
            const buffRaca = 1 + (obterBuffRaca(f1) / 100);
            const bonusProd = f1.bonus * buffRaca; // Ex: 1.10 * 1.10 = 1.21
            producaoTotal += dados.producaoBase * bonusProd * 1.0; // 100%
        }
    }

    // Slot 2 (60% Eficiência)
    if (slots[1]) {
        const f2 = jogo.funcionarios.find(f => f.id === slots[1]);
        if (f2 && f2.diasEmGreve === 0) {
            const buffRaca = 1 + (obterBuffRaca(f2) / 100);
            const bonusProd = f2.bonus * buffRaca;
            producaoTotal += dados.producaoBase * bonusProd * 0.6; // 60%
        }
    }

    // Tech Bônus (Ex: Picareta Diamante)
    // const temTech = jogo.listaTechs.find... (Adicionar depois se quiser)
    
    return producaoTotal;
}

// --- REMOVER ESSA LINHA DEPOIS? ---
export const dadosMinerais = tabelaMinerais; export const dadosItens = tabelaItens;

// --- FUNÇÕES HELPER ---
function finalizarConstrucao() {
    const tipo = jogo.construindo.tipo;
    const dados = DADOS_CONSTRUCOES[tipo];

    if (!dados) return; // Segurança caso o tipo não exista

    // 1. Sobe o Nível
    // Acessa jogo['mina'] ou jogo['casas'] dinamicamente
    jogo[dados.attrNivel]++;

    // 2. Aplica Efeitos Extras (se houver, ex: Casas aumentam pop)
    if (dados.efeitos) {
        dados.efeitos();
    }

    // 3. Atualiza o Preço para o próximo nível
    // Pega o objeto de custo (ex: jogo.custoCasa)
    const custoObj = jogo[dados.attrCusto];
    
    // Multiplica cada recurso (madeira, pedra, etc) pelo multiplicador
    if (custoObj && dados.multiplicador !== 1.0) {
        Object.keys(custoObj).forEach(recurso => {
            custoObj[recurso] = Math.floor(custoObj[recurso] * dados.multiplicador);
        });
    }

    // 4. Limpa a fila
    jogo.construindo.tipo = null;
}
function finalizarCraft(index) {
    const slot = jogo.craftando[index];
    if (!slot) return;

    const receita = tabelaItens.find(i => i.id === slot.item);
    if (receita) {
        // Verifica se é item de Herói (gera item único com nível)
        if (receita.categoria === 'heroi') {
            for (let k = 0; k < slot.qtdLote; k++) {
                // Cria uma cópia única do item
                jogo.equipamentos.push({
                    uid: Date.now() + Math.random(), // ID único para o sistema
                    id: receita.id,
                    nome: receita.nome,
                    nivel: 0, // Começa +0
                    tipo: receita.tipo, // Importante para o filtro
                    categoria: 'heroi',
                    stats: { ...receita.stats }, // Copia os stats base
                    atributoInativo: receita.atributoInativo // Copia o atributo inativo
                });
            }
        } else {
            // Se for item comum (Aventureiro), mantém a lógica antiga de pilha
            const qtdRecebida = slot.qtdLote * (receita.qtd || 1);
            jogo.itens[receita.id] = (jogo.itens[receita.id] || 0) + qtdRecebida;
        }
    }
    // Remove da lista pois acabou
    jogo.craftando.splice(index, 1);
    salvarNaNuvem();
}
function processarOffline(segundosOffline) {
    if (segundosOffline <= 0) return;

    // --- CONFIGURAÇÃO DA PENALIDADE ---
    const penalidadeOffline = 0.8; // 0.8 = 80% de eficiência (20% de perda)
    
    // Calcula o tempo ÚTIL (com a penalidade)
    let tempoParaGastar = segundosOffline * penalidadeOffline;
    
    console.log(`[OFFLINE] Tempo Real: ${segundosOffline.toFixed(1)}s | Tempo Útil (80%): ${tempoParaGastar.toFixed(1)}s`);

    // --- 1. MINERAÇÃO (Também sofre a penalidade) ---
    const minutosUteis = tempoParaGastar / 60;
    const techPicareta = jogo.listaTechs ? jogo.listaTechs.find(t => t.id === 'picareta_diamante') : null;
    const multiplicadorTech = (techPicareta && techPicareta.feito) ? 2 : 1;

    tabelaMinerais.forEach(m => {
        const prodPorMinuto = calcularProducaoPorMinuto(m.id);
        if (prodPorMinuto > 0) {
            const totalGerado = prodPorMinuto * multiplicadorTech * minutosUteis;
            jogo.minerios[m.id] = Math.min((jogo.minerios[m.id] || 0) + Math.floor(totalGerado), limites.recursos);
        }
    });

    // --- 2. CÂMARA DE PROCESSAMENTO ---
    // Proteção de 24h
    // --- 2. CÂMARA DE PROCESSAMENTO (VERSÃO FINAL: LÊ DO DADOS.JS) ---
    let tempoProcessamento = tempoParaGastar;
    if (tempoProcessamento > 86400) tempoProcessamento = 86400; 

    let itensProcessados = 0;

    if (jogo.processamento && jogo.processamento.length > 0) {
        
        while (tempoProcessamento > 0 && jogo.processamento.length > 0) {
            const slotAtual = jogo.processamento[0];

            // Se vazio, pula
            if (!slotAtual || !slotAtual.item) {
                jogo.processamento.shift();
                continue;
            }

            // --- CORREÇÃO AQUI: Busca na tabelaCarcacas (dados.js) ---
            const dadosItem = tabelaCarcacas.find(c => c.id === slotAtual.item);

            if (!dadosItem) {
                // Se não achou na tabela oficial, aí sim remove
                console.log(`Item desconhecido removido: ${slotAtual.item}`);
                jogo.processamento.shift();
                continue;
            }

            // Se o slot não foi iniciado, pega o tempo da tabela
            if (slotAtual.tempoRestante <= 0 && slotAtual.progresso === 0) {
                 slotAtual.tempoRestante = dadosItem.tempo;
                 slotAtual.tempoTotal = dadosItem.tempo;
            }

            // Calcula velocidade (Esfolador)
            let velocidade = 1;
            const func = jogo.funcionarios.find(f => f.profissao === 'esfolador' && f.diasEmGreve === 0);
            if (func) velocidade += func.bonus;
            if (velocidade < 0.1) velocidade = 0.1;

            const custoParaTerminar = slotAtual.tempoRestante / velocidade;

            if (tempoProcessamento >= custoParaTerminar) {
                // --- TERMINOU O ITEM ---
                tempoProcessamento -= custoParaTerminar;
                
                // --- ENTREGA RECURSOS (Lê de dadosItem.recursos) ---
                if (dadosItem.recursos) {
                    for (const [chave, qtd] of Object.entries(dadosItem.recursos)) {
                        jogo.itens[chave] = (jogo.itens[chave] || 0) + qtd;
                    }
                }

                // Remove da fila e repõe slot vazio no final
                jogo.processamento.shift();
                jogo.processamento.push({ item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 });
                itensProcessados++;

            } else {
                // --- NÃO TERMINOU ---
                const avanco = tempoProcessamento * velocidade;
                slotAtual.tempoRestante -= avanco;
                
                if (slotAtual.tempoTotal > 0) {
                    slotAtual.progresso = 100 - ((slotAtual.tempoRestante / slotAtual.tempoTotal) * 100);
                }
                tempoProcessamento = 0;
            }
        }
    }
    
    if (itensProcessados > 0) {
        console.log(`[OFFLINE] Processou ${itensProcessados} itens da Tabela de Carcaças.`);
        mostrarAviso("Relatório Offline", `Sua equipe processou ${itensProcessados} carcaças enquanto você estava fora.`);
    }
    // --- INÍCIO DO CÓDIGO FERRARIA OFFLINE ---
    // Verifica se existe fila de craft na ferraria
    if (jogo.craftando && jogo.craftando.length > 0) {
        // Cria uma cópia do tempo offline para gastar na fila da ferraria
        let tempoFerraria = tempoOffline; 
        // COMANDO DE CONSOLE: Mostra quanto tempo tem pra gastar
        console.log(`%c[OFFLINE] Tempo disponível para Ferraria: ${tempoFerraria.toFixed(1)}s`, "color: cyan; font-weight: bold");

        // Passa item por item da fila
        for (let i = 0; i < jogo.craftando.length; i++) {
            let item = jogo.craftando[i];
            
            // Se o tempo acabou, para o loop
            if (tempoFerraria <= 0) break;

            // Só desconta se o item ainda precisa de tempo
            if (item.tempoRestante > 0) {
                if (tempoFerraria >= item.tempoRestante) {
                    // Caso 1: Ficou offline tempo suficiente para terminar este item
                    tempoFerraria -= item.tempoRestante; // Gasta o tempo usado
                    item.tempoRestante = 0; // Marca item como pronto (o jogo entrega ao abrir)
                } else {
                    // Caso 2: O tempo offline só adianta parte do item
                    item.tempoRestante -= tempoFerraria;
                    tempoFerraria = 0; // Zerou o tempo offline disponível
                }
                // COMANDO DE CONSOLE: Mostra o progresso individual
                console.log(`[OFFLINE] 🔨 Item: ${item.item} | Avançou: ${tempoGasto.toFixed(1)}s | Falta: ${item.tempoRestante.toFixed(1)}s`);
            }
        }
    }
    // --- FIM DO CÓDIGO FERRARIA OFFLINE ---
}
// --- NOVA FUNÇÃO DE BUFF RACIAL DO PREFEITO ---
export function obterBuffRaca(func) {
    // 1. Acha o prefeito (que não esteja em greve)
    const prefeito = jogo.funcionarios.find(f => f.profissao === 'lorde' && f.diasEmGreve === 0);
    
    // 2. Validações básicas
    if (!prefeito) return 0; // Sem prefeito, sem buff
    if (prefeito.id === func.id) return 0; // Prefeito não buffa a si mesmo
    if (prefeito.raca !== func.raca) return 0; // Raças diferentes, sem buff

    // 3. O Cálculo Conservador: 1/3 da Gestão
    // Ex: Gestão 30 -> Buff de 10%
    const gestao = prefeito.poderEspecial || 0;
    return (gestao / 3); 
}
tabelaMinerais.forEach(m => {
    alocacaoInicial[m.id] = [null, null]; // Slot 1, Slot 2
    bancoInicial[m.id] = 0.0;
});

// --- FUNÇÃO DE PRODUÇÃO ATUALIZADA COM O BUFF ---
function calcularProducaoTotal(profissao) {
    const trabalhadores = jogo.funcionarios.filter(f => f.profissao === profissao);
    let producaoTotal = 0;
    
    trabalhadores.forEach(f => {
        const penalidade = f.diasEmGreve * 0.2;
        const eficiencia = Math.max(0, 1 - penalidade);
        
        // Calcula o buff racial (ex: 10 virou 1.10)
        const pctBuff = obterBuffRaca(f); 
        const multiplicadorRaca = 1 + (pctBuff / 100);

        // Aplica o multiplicador na produção
        producaoTotal += (1 * f.bonus * eficiencia * multiplicadorRaca);
    });
    
    return producaoTotal;
}
// --- LÓGICA DE AUTOMAÇÃO DA ENFERMARIA ---
function processarLogicaEnfermaria(deltaSegundos) {
    // 1. Processar Cura nos Leitos (Tic Tac do tempo)
    jogo.leitos.forEach(leito => {
        if (leito.ocupado) {
            leito.ocupado.tempoAtual += deltaSegundos;
            if (leito.ocupado.tempoAtual >= leito.ocupado.tempoTotal) {
                // Curou! Libera o leito
                leito.ocupado = null;
            }
        }
    });

    // 2. Verificar se tem leitos livres
    const leitosLivres = jogo.leitos.filter(l => !l.ocupado);
    
    // LÓGICA DOS 30 MINUTOS (1800 segundos)
    if (leitosLivres.length === jogo.leitos.length && jogo.filaDeEspera.length > 0) {
        // Se todos os leitos estão vazios E tem gente na fila
        jogo.tempoSemPaciente += deltaSegundos;
        
        // Se passou de 30 minutos ocioso, força o automático
        if (jogo.tempoSemPaciente >= 1800 && !jogo.modoAutomaticoEnfermaria) {
            jogo.modoAutomaticoEnfermaria = true;
            mostrarAviso("Automação Ativada", "A enfermaria ficou ociosa por 30min e ativou o modo automático.", "aviso");
        }
    } else {
        // Se tem alguém tratando ou fila vazia, reseta o timer
        jogo.tempoSemPaciente = 0;
    }

    // 3. O Grande Loop do Modo Automático
    if (jogo.modoAutomaticoEnfermaria && leitosLivres.length > 0 && jogo.filaDeEspera.length > 0) {
        
        // Pega o enfermeiro (para calcular poder)
        const enfermeiro = jogo.funcionarios.find(f => f.profissao === 'enfermeiro' && f.diasEmGreve === 0);
        
        // Tenta encaixar pacientes nos leitos livres
        leitosLivres.forEach(leito => {
            if (jogo.filaDeEspera.length === 0) return;

            // Varre a fila procurando alguém que possamos pagar o tratamento
            let pacienteIndex = -1;
            let itemUsado = null;
            let dadosDoenca = null;

            // Loop de busca na fila (para pular quem não temos remédio)
            // Loop de busca na fila (para pular quem não temos remédio)
            for (let i = 0; i < jogo.filaDeEspera.length; i++) {
                const p = jogo.filaDeEspera[i];
                dadosDoenca = tiposFerimentos[p.doenca || 'corte_leve'];
                
                // --- CORREÇÃO DE SEGURANÇA (NOVO) ---
                // Se a doença não existir no banco de dados, removemos o paciente bugado
                if (!dadosDoenca) {
                    console.log("Paciente removido por erro na doença:", p.doenca);
                    jogo.filaDeEspera.splice(i, 1); // Remove da lista
                    i--; // Ajusta o índice para não pular o próximo
                    continue; // Vai para o próximo loop
                }
                // ------------------------------------

                // Qual item está configurado no loadout?
                const idItemConfig = jogo.loadoutEnfermaria[dadosDoenca.reqCategoria];
                const itemDados = catalogoMedicamentos.find(it => it.id === idItemConfig);
                
                // Tem estoque?
                if (itemDados && (jogo.itens[itemDados.id] || 0) > 0) {
                    pacienteIndex = i;
                    itemUsado = itemDados;
                    break; // Achou um tratável!
                }
            }

            // Se achou alguém tratável
            if (pacienteIndex !== -1 && itemUsado) {
                const paciente = jogo.filaDeEspera[pacienteIndex];
                
                // Consome item
                jogo.itens[itemUsado.id]--;

                // Calcula tempo com PENALIDADE de 10% (1.10)
                let tempoFinal = dadosDoenca.tempoBase / itemUsado.fatorCura;
                
                if (enfermeiro) {
                    // Lógica Nova: Usa MEDICINA (poderEspecial) como % de redução
                    const buffPct = obterBuffRaca(enfermeiro); 
                    const fatorRaca = 1 + (buffPct / 100);
                    
                    // Ex: Medicina 20 * 1.1 (Buff) = 22% de redução
                    const medicinaTotal = (enfermeiro.poderEspecial || 0) * fatorRaca;
                    
                    // Limite de segurança de 90% pra não zerar o tempo
                    const porcentagemReducao = Math.min(90, medicinaTotal);
                    
                    // Aplica a redução (Ex: Tempo * (1 - 0.22))
                    tempoFinal = tempoFinal * (1 - (porcentagemReducao / 100));
                }

                // APLICA A PENALIDADE DO MODO AUTO
                tempoFinal = tempoFinal * 1.50; 

                // Prepara objeto pro leito
                const pacienteNoLeito = { ...paciente };
                pacienteNoLeito.tempoTotal = tempoFinal;
                pacienteNoLeito.tempoAtual = 0;

                // Ocupa o leito
                leito.ocupado = pacienteNoLeito;

                // Remove da fila
                jogo.filaDeEspera.splice(pacienteIndex, 1);
            } else {
                // Se rodou a fila toda e não achou ninguem com remédio, 
                // PAUSA O AUTOMATICO para não ficar processando à toa
                jogo.modoAutomaticoEnfermaria = false;
                mostrarAviso("Sem Estoque", "Modo Automático pausado: Faltam medicamentos para os feridos da fila.");
            }
        });
    }
}

// --- AÇÕES ---
export const acoes = {
    // Função auxiliar para iniciar qualquer construção
    iniciarProjeto(tipo) {
        // 1. Verificações Básicas
        if (jogo.construindo.tipo) return mostrarAviso("Ocupado!", "A fila de construção já está ocupada.");
        
        const dados = DADOS_CONSTRUCOES[tipo];
        if (!dados) return console.error("Prédio não configurado:", tipo);

        // 2. Verifica Limites Específicos (Lógica customizada ainda é necessária aqui)
        if (tipo === 'casa' && jogo.casas >= limites.casas) return mostrarAviso("Limite", "Evolua a Prefeitura.");
        if (tipo === 'armazem' && (jogo.casas + jogo.armazens) >= limites.casas) return mostrarAviso("Limite", "Evolua a Prefeitura.");
        
        // 3. Verifica e Cobra Recursos
        const custos = jogo[dados.attrCusto];
        let podePagar = true;
        
        // Verifica se tem recursos para TODOS os itens da lista de custo
        Object.keys(custos).forEach(res => {
            // Se o recurso for 'pedra', 'ferro' etc, olha em jogo.minerios. Se for 'madeira', olha em jogo.
            const qtdTenho = (jogo.minerios[res] !== undefined) ? jogo.minerios[res] : jogo[res];
            if (qtdTenho < custos[res]) podePagar = false;
        });

        if (!podePagar) return mostrarAviso("Sem Recursos", "Você não tem recursos suficientes.");

        // Se passou, desconta tudo
        Object.keys(custos).forEach(res => {
            if (jogo.minerios[res] !== undefined) jogo.minerios[res] -= custos[res];
            else jogo[res] -= custos[res];
        });

        // 4. Define o Tempo
        let tempoTotal = 0;
        if (dados.calcTempo) {
            // Se tiver fórmula (como a mina), calcula baseado no nível ATUAL
            tempoTotal = dados.calcTempo(jogo[dados.attrNivel]);
        } else {
            // Se for tempo fixo (como casa), usa o valor fixo
            // Opcional: Se quiser que a casa demore mais a cada nível, pode criar lógica aqui
            tempoTotal = dados.tempoBase;
            if (tipo === 'taverna') tempoTotal = jogo.taverna * 60; // Regra especial da Taverna mantida
        }

        // 5. Inicia
        jogo.construindo = { tipo: tipo, tempoRestante: tempoTotal, tempoTotal: tempoTotal };
        salvarNaNuvem();
    },
    pagarIndividual(idFuncionario) {
        const func = jogo.funcionarios.find(f => f.id === idFuncionario);
        if (!func) return;
        if (func.diasEmGreve === 0) return mostrarAviso("Em dia", "Este funcionário não está em greve.");
        const totalDevido = func.salario * func.diasEmGreve;
        if (jogo.ouro >= totalDevido) {
            jogo.ouro -= totalDevido;
            func.diasEmGreve = 0;
            func.pago = true;
            mostrarAviso("Pago!", `Dívida de ${totalDevido} ouros quitada. ${func.nome} voltou ao trabalho.`, 'sucesso');
            salvarNaNuvem();
        } else {
            mostrarAviso("Sem Ouro", `Você precisa de ${totalDevido} ouros para quitar ${func.diasEmGreve} dias de atraso.`);
        }
    },
    construir(tipo) {
        // Agora só chama a função mestre
        this.iniciarProjeto(tipo);
    },
    evoluir(tipo) {
        // Agora só chama a função mestre
        this.iniciarProjeto(tipo);
    },

    async recrutar(profissaoAlvo = null, premium = false, aoContratar = null, onConflito = null, onEscolhaTroca = null) {
        await verificarNovoDia();

        const dataInternet = await obterDataInternet();
        if (!dataInternet) return mostrarAviso("Sem Conexão", "Internet obrigatória.");

        // Se NÃO for premium, checa o limite comum ( AUMENTA LIMITE DE CONTRATAÇÕES COMUM )
        if (!premium && jogo.contratacoesHoje >= 5000000000000000000) return mostrarAviso("Limite Diário", "Máximo de 5 contratações por dia.");

        // Se FOR premium, checa o limite elite ( AUMENTA LIMITE DE CONTRATAÇÕES ELITE )
        if (premium && jogo.contratacoesEliteHoje >= 1000000000000000000) return mostrarAviso("Limite Elite", "Apenas 1 contratação de Elite por dia.");

        // Verifica População Comum (Só se NÃO for especial)
        if (!premium && jogo.funcionarios.length >= jogo.populacaoMax) return mostrarAviso("Vila Cheia", "Construa Casas.");

        let multiplicador = 1;
        if (profissaoAlvo) multiplicador = 5;
        if (premium) {
            // Custo Dinâmico: 5x por Nível da Taverna
            // Nível 2 = 10x (5000 ouros)
            // Nível 6 = 30x (15000 ouros)
            // Nível 10 = 50x (25000 ouros)
            multiplicador = (jogo.taverna * 5);
        }

        const custoFinal = custoContratacao.value * multiplicador;

        if (jogo.ouro >= custoFinal) {
            const execucao = () => {
                jogo.ouro -= custoFinal;
                const novo = gerarFuncionario(jogo.taverna || 1, profissaoAlvo, premium, bonusSorteTotal.value);

                // --- LÓGICA DE VAGAS ESPECIAIS ---
                if (novo.isEspecial) {
                    const atuaisEspeciais = jogo.funcionarios.filter(f => f.isEspecial);

                    // 1. DUELO DE PROFISSÃO (Prioridade Máxima)
                    const duplicado = atuaisEspeciais.find(f => f.profissao === novo.profissao);
                    if (duplicado) {
                        if (onConflito) {
                            onConflito(novo, duplicado, () => {
                                const idx = jogo.funcionarios.indexOf(duplicado);
                                jogo.funcionarios.splice(idx, 1);
                                jogo.funcionarios.push(novo);
                                // SEPARAÇÃO DOS CONTADORES
                                if (premium) jogo.contratacoesEliteHoje++;
                                else jogo.contratacoesHoje++;

                                if (aoContratar) aoContratar(novo);
                            });
                            return; 
                        }
                    }

                    // 2. PREFEITURA CHEIA (Novo: Escolha quem sai)
                    if (atuaisEspeciais.length >= limites.vagasEspeciais) {
                        if (onEscolhaTroca) {
                            // Chama o modal para o usuário escolher UM da lista para sair
                            onEscolhaTroca(novo, atuaisEspeciais, (candidatoParaSair) => {
                                const idx = jogo.funcionarios.indexOf(candidatoParaSair);
                                jogo.funcionarios.splice(idx, 1);
                                jogo.funcionarios.push(novo);
                                // SEPARAÇÃO DOS CONTADORES
                                if (premium) jogo.contratacoesEliteHoje++;
                                else jogo.contratacoesHoje++;

                                if (aoContratar) aoContratar(novo);
                            });
                            return;
                        } else {
                            // Fallback caso não tenha UI
                            jogo.ouro += custoFinal; // Devolve o ouro
                            return mostrarAviso("Prefeitura Cheia", "Evolua a Prefeitura ou demita um especialista manualmente.");
                        }
                    }
                } else {
                    // Funcionário Comum
                    const comuns = jogo.funcionarios.filter(f => !f.isEspecial);
                    if (comuns.length >= jogo.populacaoMax) {
                        jogo.ouro += custoFinal;
                        return mostrarAviso("Vila Cheia", "Não há casas para este trabalhador comum.");
                    }
                }

                // Se passou direto (tem vaga), adiciona
                jogo.funcionarios.push(novo);
                // SEPARAÇÃO DOS CONTADORES
                if (premium) jogo.contratacoesEliteHoje++;
                else jogo.contratacoesHoje++;

                if (aoContratar) aoContratar(novo);
                else mostrarAviso("Contratado!", `Você contratou um ${novo.profissao} Tier ${novo.tier}!`, 'sucesso');
                salvarNaNuvem();
            };

            execucao();
        } else mostrarAviso("Sem Ouro", `Faltam ${custoFinal - jogo.ouro} de ouro.`);
    },

    fundirFuncionarios(idsSelecionados, onSucessoFusao, onConfirmacaoVisual = null) {
        if (idsSelecionados.length !== 3) return mostrarAviso("Erro", "Selecione 3 funcionários.");

        const temGerente = idsSelecionados.some(id => {
            const f = jogo.funcionarios.find(func => func.id === id);
            return f && f.profissao === 'gerente';
        });
        if (temGerente) return mostrarAviso("Proibido", "Gerentes não podem ser fundidos.");

        const funcs = idsSelecionados.map(id => jogo.funcionarios.find(f => f.id === id)).filter(Boolean);
        if (funcs.length !== 3) return;
        
        const tierBase = funcs[0].tier;
        if (!funcs.every(f => f.tier === tierBase)) return mostrarAviso("Erro", "Tiers diferentes.");

        // --- VERIFICAÇÃO DE PROFISSÃO ---
        const profBase = funcs[0].profissao;
        const mesmaProf = funcs.every(f => f.profissao === profBase);
        // Se for tudo igual, a profissão final é essa. Se não, é null (aleatória)
        let profissaoFinal = mesmaProf ? profBase : null; 

        // --- VERIFICAÇÃO DE HEROIS (NOVO) ---
        // Se todos forem heróis (mesmo que classes diferentes), o resultado DEVE ser herói
        const saoTodosHerois = funcs.every(f => f.profissao === 'heroi');
        
        let classeFinal = null;

        if (saoTodosHerois) {
            profissaoFinal = 'heroi'; // Força ser herói
            
            // Verifica se são da mesma CLASSE
            const classeBase = funcs[0].classe;
            const mesmaClasse = funcs.every(f => f.classe === classeBase);
            
            if (mesmaClasse) {
                classeFinal = classeBase; // Mantém a classe (ex: 3 Necromantes viram 1 Necromante)
            }
            // Se não forem mesma classe, classeFinal fica null (gera uma aleatória)
        }

        // --- VERIFICAÇÃO DE RAÇA ---
        const racaBase = funcs[0].raca;
        const mesmaRaca = funcs.every(f => f.raca === racaBase);
        const racaFinal = mesmaRaca ? racaBase : null;

        // --- CÁLCULO DO BÔNUS DE SINERGIA ---
        // Sinergia se: Mesma Profissão OU Mesma Raça OU Mesma Classe (caso heróis)
        const temSinergia = mesmaProf || mesmaRaca; // (Classe igual já implica profissão igual, então está coberto)

        const bonusFusao = bonusSorteTotal.value * 0.6;
        
        const chances = calcularChancesFusao(tierBase, jogo.taverna || 1, bonusFusao, temSinergia);

        const executarLogica = () => {
            // Passamos profissaoFinal, racaFinal, temSinergia E AGORA classeFinal
            const novo = processarFusao(tierBase, jogo.taverna || 1, profissaoFinal, racaFinal, bonusFusao, temSinergia, classeFinal);
            
            idsSelecionados.forEach(id => {
                const idx = jogo.funcionarios.findIndex(f => f.id === id);
                if (idx !== -1) jogo.funcionarios.splice(idx, 1);
            });
            jogo.funcionarios.push(novo);
            if (onSucessoFusao) onSucessoFusao(novo, tierBase);
            console.log("Fusão realizada. Salvando..."); 
            salvarNaNuvem();
        };

        if (onConfirmacaoVisual) {
            onConfirmacaoVisual(chances, tierBase, executarLogica);
            return;
        }

        // Fallback (Modal antigo de texto)
        let texto = `Fusão de 3x Tier ${tierBase}.\n`;
        if (temSinergia) texto += `✨ BÔNUS DE SINERGIA ATIVO! ✨\n\n`;
        
        texto += `⬆️ Upgrade: ${chances.upgrade}%\n`;
        texto += `↔️ Manter: ${chances.manter}%\n`;
        if (chances.downgrade > 0) texto += `⬇️ Downgrade: ${chances.downgrade}%\n`;

        pedirConfirmacao("Confirmar Fusão?", texto, executarLogica);
    },

    demitirFuncionario(id) {
        // 1. Verificação de Segurança da Biblioteca
        // Se o ID do funcionário estiver na lista de alocação da biblioteca, bloqueia.
        if (jogo.alocacaoBiblioteca.includes(id)) {
            return mostrarAviso("Ação Bloqueada", "Este funcionário está alocado na Biblioteca. Remova-o de lá antes de demitir.");
        }

        // 2. Verificação de Segurança da Mina (Recomendado fazer também)
        // Varre todos os slots da mina para ver se ele está lá
        const estaNaMina = Object.values(jogo.alocacaoMina).some(slots => slots.includes(id));
        if (estaNaMina) {
             return mostrarAviso("Ação Bloqueada", "Este funcionário está trabalhando na Mina. Remova-o de lá antes de demitir.");
        }

        // 3. Código Original de Demissão (só acontece se passar pelas travas acima)
        const idx = jogo.funcionarios.findIndex(x => x.id === id);
        if (idx !== -1) jogo.funcionarios.splice(idx, 1);
        salvarNaNuvem(); // <--- ADICIONADO AQUI
        mostrarAviso("Demitido", "Funcionário removido com sucesso.", "sucesso");
    },

    fabricarItem(item, qtd = 1) {
        // 1. Define quantos slots o jogador tem direito
        let maxSlots = 1;
        if (jogo.ferraria >= 7) maxSlots = 3;
        else if (jogo.ferraria >= 3) maxSlots = 2;

        // 2. Verifica se tem espaço na fila
        if (jogo.craftando.length >= maxSlots) {
            return mostrarAviso("Fila Cheia", `Sua ferraria nível ${jogo.ferraria} suporta apenas ${maxSlots} filas.`);
        }

        const custoTotal = {};
        let pode = true;
        Object.keys(item.custo).forEach(k => { custoTotal[k] = item.custo[k] * qtd; });
        Object.keys(custoTotal).forEach(k => {
            const tenho = (jogo.minerios[k] !== undefined) ? jogo.minerios[k] : jogo[k];
            if (tenho < custoTotal[k]) pode = false;
        });

        if (pode) {
            Object.keys(custoTotal).forEach(k => {
                if (jogo.minerios[k] !== undefined) jogo.minerios[k] -= custoTotal[k]; else jogo[k] -= custoTotal[k];
            });

            // Bônus do Ferreiro
            const ferreiro = jogo.funcionarios.find(f => f.profissao === 'ferreiro' && f.diasEmGreve === 0);
            let redutorTempo = 0;
            let redutorFalha = 0;
            if (ferreiro) {
                const buffRaca = 1 + (obterBuffRaca(ferreiro) / 100);
                const poderReal = (ferreiro.poderEspecial || 0) * buffRaca;
                redutorTempo = Math.min(0.9, poderReal / 100); 
                redutorFalha = Math.min(1.0, poderReal / 100);
            }

            const tempoFinal = Math.ceil(item.tempo * qtd * (1 - redutorTempo));
            
            // Adiciona o novo item na lista (push) com um ID único (usamos Date.now para garantir unicidade simples)
            jogo.craftando.push({ 
                idUnico: Date.now() + Math.random(), // Identificador para cancelar o certo depois
                item: item.id, 
                qtdLote: qtd, 
                tempoRestante: tempoFinal, 
                tempoTotal: tempoFinal,
                chanceFalha: Math.max(0, 0.0 * (1 - redutorFalha)) // Base 0% falha por enquanto
            });
            console.log("Item adicionado à fila. Salvando...");
            salvarNaNuvem();
        } else mostrarAviso("Sem Recursos", "Faltam recursos.");
    },
    cancelarCraft(index) {
        // Recebe o índice da fila (0, 1 ou 2)
        const slot = jogo.craftando[index];
        if (!slot) return;
        
        pedirConfirmacao("Cancelar Produção?", "Recupera 90% dos pendentes.", () => {
            const receita = tabelaItens.find(i => i.id === slot.item);
            if (receita) {
                const tempoDecorrido = slot.tempoTotal - slot.tempoRestante;
                const tempoPorItem = slot.tempoTotal / slot.qtdLote;
                const feitos = Math.floor(tempoDecorrido / tempoPorItem);
                const pendentes = Math.max(0, slot.qtdLote - feitos);

                if (feitos > 0) jogo.itens[receita.id] += (feitos * (receita.qtd || 1));

                if (pendentes > 0) {
                    Object.keys(receita.custo).forEach(k => {
                        const dev = Math.floor((receita.custo[k] * pendentes) * 0.9);
                        if (jogo.minerios[k] !== undefined) jogo.minerios[k] += dev; else jogo[k] += dev;
                    });
                }
                
                // Remove o item da lista
                jogo.craftando.splice(index, 1);
                mostrarAviso("Cancelado", `Finalizados: ${feitos} | Cancelados: ${pendentes}`, 'aviso');
                salvarNaNuvem();
            }
        });
    },

    acelerarCraft(index) {
        // Busca o slot correto usando o índice (0, 1 ou 2)
        const slot = jogo.craftando[index];
        if (!slot) return;
        
        // Calcula custo: 1000 ouros por minuto restante
        const custo = Math.ceil(slot.tempoRestante / 60) * 1000;

        // Verifica se tem dinheiro
        if (jogo.ouro >= custo) {
            pedirConfirmacao("Acelerar Produção?", `Deseja gastar ${custo} ouros para terminar agora?`, () => {
                jogo.ouro -= custo;
                
                const receita = tabelaItens.find(i => i.id === slot.item);
                if (receita) {
                    // CORREÇÃO: Verifica se é Herói para criar item único (igual ao finalizarCraft)
                    if (receita.categoria === 'heroi') {
                        for (let k = 0; k < slot.qtdLote; k++) {
                             jogo.equipamentos.push({
                                uid: Date.now() + Math.random(), 
                                id: receita.id,
                                nome: receita.nome,
                                nivel: 0, 
                                tipo: receita.tipo,
                                categoria: 'heroi',
                                stats: { ...receita.stats },
                                atributoInativo: receita.atributoInativo
                            });
                        }
                    } else {
                        // Se for item comum, soma na pilha
                        jogo.itens[receita.id] = (jogo.itens[receita.id] || 0) + ((receita.qtd || 1) * slot.qtdLote);
                    }
                }
                
                // Remove da fila
                jogo.craftando.splice(index, 1);
                
                // Opcional: Feedback de sucesso
                mostrarAviso("Acelerado!", "Produção concluída instantaneamente.", "sucesso");
                salvarNaNuvem();
            });
        } else {
            // --- AQUI ESTÁ O AVISO QUE FALTAVA ---
            mostrarAviso("Ouro Insuficiente", `Você precisa de ${custo} ouros para acelerar esta produção.\nVocê tem apenas ${jogo.ouro}.`);
        }
    },
    // REMOVER ESSA FUNÇÃO DEPOIS?
    alocarMina(id, qtd) {
        if (qtd === 1) { if (mineradoresOcupados.value < jogo.mineradores) jogo.trabalhoMina[id]++; }
        else if (qtd === -1 && jogo.trabalhoMina[id] > 0) jogo.trabalhoMina[id]--;
    },
    gerenciarTrabalho(prof, qtd) {
        const mapa = { lenhador: 'lenhadores', minerador: 'mineradores', esfolador: 'esfoladores', academico: 'academicos' };
        const p = mapa[prof];
        if (qtd === -1 && jogo[p] > 0) {
            if (prof === 'minerador' && (jogo.mineradores - mineradoresOcupados.value) <= 0) return mostrarAviso("Erro", "Mineradores trabalhando.");
            jogo[p]--; jogo.desempregados++;
            salvarNaNuvem();
        }
    },
    // Nova função de alocação
    alocarMinerador(minerioId, slotIndex, funcionarioId) {
        // Se slotIndex for 1 (segundo slot), verificar se está desbloqueado
        const minerio = tabelaMinerais.find(m => m.id === minerioId);
        
        // Regra de Desbloqueio de Slots:
        // Slot 1: Nível da Mina >= Nível do Minério
        // Slot 2: Nível da Mina >= Nível do Minério + 1 (Exceto Pedra que já tem 2 no Nv 1)
        
        let bloqueado = false;
        if (slotIndex === 0) {
            if (jogo.mina < minerio.nivel) bloqueado = true;
        } else {
            // Slot 2
            if (minerio.id === 'pedra') {
                if (jogo.mina < 1) bloqueado = true; // Pedra libera 2 slots no nv 1
            } else {
                if (jogo.mina < minerio.nivel + 1) bloqueado = true;
            }
        }

        if (bloqueado) return; // Não faz nada se tentar burlar

        // Remove o funcionário de qualquer outro slot onde ele esteja
        if (funcionarioId) {
            Object.keys(jogo.alocacaoMina).forEach(mId => {
                const s = jogo.alocacaoMina[mId];
                if (s[0] === funcionarioId) s[0] = null;
                if (s[1] === funcionarioId) s[1] = null;
            });
        }

        // Atribui ao novo slot
        jogo.alocacaoMina[minerioId][slotIndex] = funcionarioId;
        salvarNaNuvem();
    },
    
    desalocarMinerador(minerioId, slotIndex) {
        jogo.alocacaoMina[minerioId][slotIndex] = null;
        salvarNaNuvem();
    },
    pesquisar(tech) { if (!tech.feito && jogo.ciencia >= tech.custo.ciencia) { jogo.ciencia -= tech.custo.ciencia; tech.feito = true; } },
    // HACKS PARA TESTES
    hack() { jogo.ouro += 100000000; jogo.madeira += 100000; jogo.carne += 100000; jogo.couro += 1000; Object.keys(jogo.minerios).forEach(k => jogo.minerios[k] += 1000); jogo.poMistico = (jogo.poMistico || 0) + 1000; 
    jogo.pedra_up_comum = (jogo.pedra_up_comum || 0) + 50;
    jogo.pedra_up_rara = (jogo.pedra_up_rara || 0) + 50;
    jogo.pedra_up_mitica = (jogo.pedra_up_mitica || 0) + 50;
    jogo.itens.carcaca_javali = (jogo.itens.carcaca_javali || 0) + 5;
    jogo.itens.carcaca_lobo = (jogo.itens.carcaca_lobo || 0) + 5;
    jogo.itens.carcaca_touro = (jogo.itens.carcaca_touro || 0) + 5;
    jogo.itens.carcaca_touro2 = (jogo.itens.carcaca_touro2 || 0) + 5;
    jogo.itens.carcaca_touro3 = (jogo.itens.carcaca_touro3 || 0) + 5;
    jogo.itens.javali_da_vila = (jogo.itens.javali_da_vila || 0) + 5;
    jogo.itens.tatu_pedra = (jogo.itens.tatu_pedra || 0) + 5;
    jogo.itens.besouro_rinoceronte = (jogo.itens.besouro_rinoceronte || 0) + 5;
    jogo.itens.javali_de_granito = (jogo.itens.javali_de_granito || 0) + 5;
    jogo.itens.basilisco = (jogo.itens.basilisco || 0) + 5;
    jogo.itens.lagarto_de_brasa = (jogo.itens.lagarto_de_brasa || 0) + 5;
    jogo.itens.sand_scorpion = (jogo.itens.sand_scorpion || 0) + 5;
    jogo.itens.magma_hyena = (jogo.itens.magma_hyena || 0) + 5;
    jogo.itens.salamandra = (jogo.itens.salamandra || 0) + 5;
    jogo.itens.fire_serpe = (jogo.itens.fire_serpe || 0) + 5;
    jogo.itens.snow_fox = (jogo.itens.snow_fox || 0) + 5;
    // --- TODOS OS MEDICAMENTOS (TIER 1 a 4) ---
        const itensMedicos = [
            // Bandagens
            'bandagem_comum', 'bandagem_seda', 'bandagem_magica', 'bandagem_aetherium',
            // Poções
            'pocao_vida_p', 'pocao_vida_m', 'pocao_vida_g', 'elixir_vida',
            // Ervas
            'ervas_comuns', 'cataplasma_musgo', 'raiz_mandragora', 'flor_luz',
            // Talas
            'tala_madeira', 'tala_ferro', 'tala_mithril', 'tala_runica',
            // Pomadas
            'pomada_base', 'pomada_aloe', 'unguento_gelo', 'balsamo_fenix',
            // Antídotos
            'antidoto_p', 'soro_ofidico', 'panaceia', 'lagrima_unicornio',
            // Tônicos
            'tonico_revigorante', 'bebida_energetica', 'extrato_adrenalina', 'nectar_deuses',
            // Talismãs
            'talisma_cura', 'amuleto_prata', 'totem_ouro', 'reliquia_sagrada'
        ];

        // Adiciona 50 de cada
        itensMedicos.forEach(id => {
            jogo.itens[id] = (jogo.itens[id] || 0) + 50;
        });

},
    
    // HACK DE CONSTRUÇÕES
    hackConstrucoes() {
        // Aumenta o nível dos prédios principais
        jogo.prefeitura++;
        jogo.mina++;
        jogo.ferraria++;
        jogo.taverna++;
        jogo.camaraProcessamento++;
        jogo.biblioteca++;
        jogo.enfermaria++;
        
        // Adiciona casas e armazéns extras
        jogo.casas += 2;
        jogo.armazens += 2;
        
        // Ativa o laboratório se não tiver
        if (jogo.laboratorio === 0) jogo.laboratorio = 1;
        
        // Aumenta população máxima (para acompanhar as casas novas)
        jogo.populacaoMax += 4; 
    },
    // HACK DE RECURSOS
    resetarRecursos() {
        pedirConfirmacao("Lixeira", "Zerar tudo?", () => {
            ['madeira', 'carne', 'ouro', 'ciencia', 'couro'].forEach(k => jogo[k] = 0);
            Object.keys(jogo.minerios).forEach(k => jogo.minerios[k] = 0);
        });
    }
};

function processarPagamentoSalarios() {
    const copiaFuncionarios = [...jogo.funcionarios].sort((a, b) => {
        const idxA = ORDEM_TIERS.indexOf(a.tier);
        const idxB = ORDEM_TIERS.indexOf(b.tier);
        return idxB - idxA;
    });
    copiaFuncionarios.forEach(func => {
        if (jogo.ouro >= func.salario) {
            jogo.ouro -= func.salario;
            func.diasEmGreve = 0;
        } else {
            func.diasEmGreve++;
        }
    });
    const demitidos = jogo.funcionarios.filter(f => f.diasEmGreve >= 5);
    if (demitidos.length > 0) {
        jogo.funcionarios = jogo.funcionarios.filter(f => f.diasEmGreve < 5);
        mostrarAviso("Demissões!", `${demitidos.length} funcionários se demitiram por falta de pagamento (5 dias de greve).`, "aviso");
    }
}

// --- NOVO LOOP COM DELTA TIME ---
// --- NOVO LOOP INTELIGENTE ---
export function iniciarLoop() {
    if (loopId) cancelAnimationFrame(loopId);
    jogo.ultimaAtualizacao = Date.now();

    const loop = () => {
        const agora = Date.now();
        
        // --- 1. A TRAVA DE SEGURANÇA (NOVO) ---
        // Se o save da nuvem ainda não terminou de carregar, nós TRAVAMOS o jogo aqui.
        if (!jogoIniciado) {
            // Atualizamos o relógio para que, quando o jogo começar, 
            // o delta seja 0 (sem saltos de tempo).
            jogo.ultimaAtualizacao = agora; 
            
            // Mantém o loop rodando em "ponto morto"
            loopId = requestAnimationFrame(loop);
            return; // <--- PARA TUDO, não executa o resto do código abaixo
        }
        // ---------------------------------------

        // Calcula o tempo REAL que passou
        let deltaSegundos = (agora - jogo.ultimaAtualizacao) / 1000;
        
        // Proteção mínima
        if (deltaSegundos < 0) deltaSegundos = 0;

        jogo.ultimaAtualizacao = agora;

        // --- LÓGICA DO JOGO COMEÇA AQUI ---
        processarLogicaEnfermaria(deltaSegundos);

        // --- LÓGICA DA BIBLIOTECA ---
        if (jogo.estudos && jogo.estudos.length > 0) {
            if (!jogo.estudos[0].item && jogo.estudos[1].item) {
                jogo.tempoOciosidadeFila = (jogo.tempoOciosidadeFila || 0) + deltaSegundos;
                if (jogo.tempoOciosidadeFila >= 8) {
                    jogo.estudos.shift();
                    jogo.estudos.push({ item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 });
                    jogo.tempoOciosidadeFila = 0;
                }
            } else {
                jogo.tempoOciosidadeFila = 0;
            }

            const slotAtual = jogo.estudos[0];
            if (slotAtual && slotAtual.item) {
                slotAtual.tempoRestante -= deltaSegundos;
                slotAtual.progresso = 100 - ((slotAtual.tempoRestante / slotAtual.tempoTotal) * 100);

                if (slotAtual.tempoRestante <= 0) {
                    const dadosItem = DADOS_ESTUDO[slotAtual.item];
                    if (dadosItem) jogo.ciencia += dadosItem.xp;
                    jogo.estudos.shift();
                    jogo.estudos.push({ item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 });
                }
            }
        }

        // --- LÓGICA DE PROCESSAMENTO (CARCAÇAS) ---
        if (jogo.processamento && jogo.processamento.length > 0) {
            let tempoParaGastar = deltaSegundos;
            
            // Limite de segurança: Máximo 24h
            if (tempoParaGastar > 86400) tempoParaGastar = 86400;

            while (tempoParaGastar > 0) {
                if (!jogo.processamento[0].item && jogo.processamento[1].item) {
                    jogo.processamento.shift();
                    jogo.processamento.push({ item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 });
                }

                const slotCarne = jogo.processamento[0];
                if (!slotCarne || !slotCarne.item) break; 

                let velocidade = 1;
                const func = jogo.funcionarios.find(f => f.profissao === 'esfolador' && f.diasEmGreve === 0);
                if (func) velocidade += func.bonus;
                if (velocidade < 0.1) velocidade = 0.1;

                const tempoRealNecessario = slotCarne.tempoRestante / velocidade;

                if (tempoParaGastar >= tempoRealNecessario) {
                    tempoParaGastar -= tempoRealNecessario;
                    
                    const receita = tabelaCarcacas.find(c => c.id === slotCarne.item);
                    if (receita) {
                        jogo.carne += (receita.recursos.carne || 0);
                        jogo.couro = Math.min(jogo.couro + (receita.recursos.couro || 0), limites.recursos);
                    }
                    
                    jogo.processamento.shift();
                    jogo.processamento.push({ item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 });
                } else {
                    slotCarne.tempoRestante -= (tempoParaGastar * velocidade);
                    slotCarne.progresso = 100 - ((slotCarne.tempoRestante / slotCarne.tempoTotal) * 100);
                    tempoParaGastar = 0; 
                }
            }
        }

        // --- MINERAÇÃO ---
        const techPicareta = jogo.listaTechs ? jogo.listaTechs.find(t => t.id === 'picareta_diamante') : null;
        const multiplicadorTech = (techPicareta && techPicareta.feito) ? 2 : 1;

        tabelaMinerais.forEach(m => {
            const prodPorMinuto = calcularProducaoPorMinuto(m.id);
            if (prodPorMinuto > 0) {
                const prodTotalMinuto = prodPorMinuto * multiplicadorTech;
                const prodPorSegundo = prodTotalMinuto / 60;
                const ganho = prodPorSegundo * deltaSegundos; 
                
                jogo.bancoMinerios[m.id] = (jogo.bancoMinerios[m.id] || 0) + ganho;
                if (jogo.bancoMinerios[m.id] >= 1) {
                    const inteiro = Math.floor(jogo.bancoMinerios[m.id]);
                    jogo.minerios[m.id] = Math.min((jogo.minerios[m.id] || 0) + inteiro, limites.recursos);
                    jogo.bancoMinerios[m.id] -= inteiro;
                }
            }
        });

        // --- TIMERS DIVERSOS ---
        if (jogo.construindo.tipo) { 
            jogo.construindo.tempoRestante -= deltaSegundos;
            if (jogo.construindo.tempoRestante <= 0) finalizarConstrucao(); 
        }
        for (let i = jogo.craftando.length - 1; i >= 0; i--) {
            const slot = jogo.craftando[i];
            slot.tempoRestante -= deltaSegundos;
            if (slot.tempoRestante <= 0) finalizarCraft(i);
        }

        // --- PRODUÇÃO MADEIRA ---
        const prodMadeira = calcularProducaoTotal('lenhador');
        if (prodMadeira > 0) {
            const techMachado = jogo.listaTechs ? jogo.listaTechs.find(t => t.id === 'machado_ferro') : null;
            const bMad = (techMachado && techMachado.feito) ? 1.5 : 1;
            jogo.madeira = Math.min(jogo.madeira + (prodMadeira * bMad * deltaSegundos), limites.recursos);
        }

        loopId = requestAnimationFrame(loop);
    };

    loopId = requestAnimationFrame(loop);
}

    // VERIFICAÇÃO AUTOMÁTICA AO CARREGAR O JOGO
    verificarNovoDia();

    /*setInterval(() => { 
        // Removemos a linha que alterava o tempo aqui. Deixe o loop cuidar do tempo.
        // Apenas salvamos o estado atual.
        localStorage.setItem('save-v15-refactor', JSON.stringify(jogo)); 
    }, 5000);
    }*/

    // Variável para impedir que o loop rode antes de carregar o save
    let jogoIniciado = false;   
    // Variável que vai guardar quem está jogando (começa vazia)
    let idUsuarioAtual = null;

    // Função que o App.vue vai chamar quando alguém fizer login
    export function definirIdUsuario(novoId) {
        idUsuarioAtual = novoId;
        console.log("Usuário definido no sistema:", idUsuarioAtual);
        // Assim que define o usuário, já tenta carregar o save dele
        carregarDaNuvem();
    } 

    export async function salvarNaNuvem() {
        // SEGURANÇA: Se não tiver usuário logado, não salva nada
        if (!idUsuarioAtual) return;

        // console.log("Tentando salvar na nuvem...");
        
        const { error } = await supabase
            .from('saves')
            .upsert({ 
                id: idUsuarioAtual,  // <--- Agora usa a variável, não mais o número 1
                dados_jogo: jogo 
            })

        if (error) {
            console.error('Erro ao salvar:', error)
        } else {
            console.log('Jogo salvo na nuvem com sucesso!')
        }
    }
    let carregandoDados = false;

    export async function carregarDaNuvem() {
        if (carregandoDados) return;
        if (!idUsuarioAtual) return;
        carregandoDados = true;

        console.log("Buscando save na nuvem para:", idUsuarioAtual);

        // 1. Buscamos o save E TAMBÉM a hora atual do servidor
        // O .rpc('ler_hora_servidor') chama aquela função que criamos no SQL
        const { data: horaServidor, error: erroHora } = await supabase.rpc('ler_hora_servidor');
        
        const { data, error } = await supabase
            .from('saves')
            .select('dados_jogo, data_real_save') // Trazemos a data real do banco
            .eq('id', idUsuarioAtual)
            .maybeSingle()

        if (error || erroHora) {
            console.log("Erro ao buscar dados ou hora:", error, erroHora);
            carregandoDados = false; 
        return;
    }

        if (data && data.dados_jogo) {
            // Carrega o jogo
            Object.assign(jogo, data.dados_jogo);
            jogo.ultimaAtualizacao = Date.now();
            
            console.log("Save carregado!");

            // --- CORREÇÃO DE BUG DA FILA (INTELIGENTE - NÃO APAGA ITENS) ---
            if (!Array.isArray(jogo.processamento)) {
                 // Se nem for lista, cria do zero
                 jogo.processamento = Array.from({ length: 8 }, () => ({ item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 }));
            } else {
                // Se for lista, mas o tamanho estiver errado (ex: 7 ou 15)
                if (jogo.processamento.length !== 8) {
                    console.log(`[FIX] Ajustando fila de ${jogo.processamento.length} para 8 slots (Mantendo itens)...`);
                    
                    // 1. Resgata os itens que você já tinha colocado (ignora slots vazios)
                    const itensSalvos = jogo.processamento.filter(slot => slot && slot.item);
                    
                    // 2. Cria uma fila nova zerada e perfeita
                    const novaFila = Array.from({ length: 8 }, () => ({ item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 }));
                    
                    // 3. Coloca os itens de volta nos primeiros slots
                    itensSalvos.forEach((dado, i) => {
                        if (i < 8) novaFila[i] = dado;
                    });
                    
                    jogo.processamento = novaFila;
                }
            }
            // Se houver um item na fila que NÃO existe na tabela oficial, apaga ele.
            jogo.processamento.forEach(slot => {
                if (slot.item) {
                    // Tenta achar esse item na lista de carcaças
                    const itemExiste = tabelaCarcacas.find(c => c.id === slot.item);
                    
                    // Se não achou (ou seja, é um ID velho ou bugado), limpa o slot
                    if (!itemExiste) {
                        console.log(`[FAXINA] Removendo item inválido da fila: ${slot.item}`);
                        slot.item = null;
                        slot.progresso = 0;
                        slot.tempoTotal = 0;
                        slot.tempoRestante = 0;
                    }
                }
            });
            // -------------------------------------------------

            // --- CÁLCULO DE TEMPO OFFLINE (V3 - SEM PENALIDADE) ---
            if (data.data_real_save && horaServidor) {
                const ultimoSaveReal = new Date(data.data_real_save).getTime();
                const agoraReal = new Date(horaServidor).getTime();
                const diferencaMs = agoraReal - ultimoSaveReal;

                if (diferencaMs > 0) {
                    // 1. Usamos 100% do tempo (SEM PENALIDADE DE 80%)
                    let segundosDisponiveis = diferencaMs / 1000; // COPIA OS SEGUNDOS OFFLINE PRO DESTRINCHAMENTO
                    let tempoParaFerraria = segundosDisponiveis; // COPIA OS SEGUNDOS OFFLINE PRA FERRARIA
                    let tempoParaMina = segundosDisponiveis; // COPIA OS SEGUNDOS OFFLINE PRA MINA
                    
                    console.log(`%c[OFFLINE] Tempo Total: ${segundosDisponiveis.toFixed(1)}s`, "color: gold; font-weight: bold; font-size: 12px;");
                    
                    let itensProcessados = 0;
                    let recursosGanhos = {}; 

                    // Loop WHILE: Processa um por um, na ordem certa
                    while (segundosDisponiveis > 0 && jogo.processamento.length > 0) {
                        
                        let slotAtual = jogo.processamento[0]; // Pega o primeiro da fila
                        
                        // Se for slot vazio/bugado, remove e passa pro próximo
                        if (!slotAtual.item) {
                            jogo.processamento.shift();
                            continue;
                        }

                        // Busca dados oficiais para garantir o tempo correto
                        const dadosItem = tabelaCarcacas.find(c => c.id === slotAtual.item);
                        // Se o item já estava iniciado, usa o tempo salvo. Se não, usa o do banco de dados.
                        let tempoTotalItem = (slotAtual.tempoTotal > 0) ? slotAtual.tempoTotal : (dadosItem ? dadosItem.tempo : 60);
                        
                        // Aplica bônus de funcionário se houver (Se não tiver, velocidade é 1)
                        let velocidade = 1;
                        const esfolador = jogo.funcionarios.find(f => f.profissao === 'esfolador' && f.diasEmGreve === 0);
                        if (esfolador) velocidade += esfolador.bonus;

                        // Calcula quanto tempo REAL leva para terminar este item
                        let tempoParaTerminar = (tempoTotalItem - slotAtual.progresso) / velocidade;

                        if (segundosDisponiveis >= tempoParaTerminar) {
                            // -> FINALIZOU O ITEM
                            segundosDisponiveis -= tempoParaTerminar;
                            console.log(`[OFFLINE] ✅ ${dadosItem ? dadosItem.nome : slotAtual.item} finalizado em ${tempoParaTerminar.toFixed(1)}s`);

                            // Entrega recursos
                            if (dadosItem && dadosItem.recursos) {
                                for (const [chave, qtd] of Object.entries(dadosItem.recursos)) {
                                    
                                    // CORREÇÃO: Verifica se é um recurso básico (carne, couro, madeira)
                                    // Se a variável existe direto no 'jogo', soma lá.
                                    if (jogo[chave] !== undefined) {
                                        jogo[chave] += qtd;
                                    } 
                                    // Se não, joga no inventário de itens
                                    else {
                                        jogo.itens[chave] = (jogo.itens[chave] || 0) + qtd;
                                    }

                                    recursosGanhos[chave] = (recursosGanhos[chave] || 0) + qtd;
                                }
                            }

                            // Remove da fila (o próximo anda)
                            jogo.processamento.shift();
                            itensProcessados++;

                        } else {
                            // -> NÃO DEU TEMPO, SÓ AVANÇOU
                            slotAtual.progresso += (segundosDisponiveis * velocidade);
                            slotAtual.tempoRestante = tempoTotalItem - slotAtual.progresso;
                            console.log(`[OFFLINE] ⏳ ${dadosItem ? dadosItem.nome : slotAtual.item} avançou ${(segundosDisponiveis * velocidade).toFixed(1)}s`);
                            segundosDisponiveis = 0; // Acabou o tempo
                        }
                    }

                    console.log(`[OFFLINE] Resumo: ${itensProcessados} itens completos.`);
                    console.log("[OFFLINE] Ganhos:", recursosGanhos);
                    
                    // --- INÍCIO: FERRARIA OFFLINE ---
                    if (tempoParaFerraria > 0 && jogo.craftando && jogo.craftando.length > 0) {
                        console.log(`[OFFLINE] 🔨 Processando Ferraria... Tempo Disp: ${tempoParaFerraria.toFixed(1)}s`);
                        
                        for (let i = 0; i < jogo.craftando.length; i++) {
                            let item = jogo.craftando[i];
                            
                            // Se o tempo acabou, para
                            if (tempoParaFerraria <= 0) break;
                            
                            if (item.tempoRestante > 0) {
                                if (tempoParaFerraria >= item.tempoRestante) {
                                    // CASO 1: Termina o item
                                    tempoParaFerraria -= item.tempoRestante;
                                    item.tempoRestante = 0; 
                                    console.log(`> Item PRONTO: ${item.item}`);
                                } else {
                                    // CASO 2: Só adianta
                                    item.tempoRestante -= tempoParaFerraria;
                                    console.log(`> Adiantou ${tempoParaFerraria.toFixed(1)}s no item ${item.item}`);
                                    tempoParaFerraria = 0;
                                }
                            }
                        }
                    }
                    // --- FIM DA FERRARIA OFFLINE ---
                    // --- INÍCIO: MINA OFFLINE ---
                    if (tempoParaMina > 0) {
                        console.log(`[OFFLINE] ⛏️ Processando Mina... Tempo: ${tempoParaMina.toFixed(1)}s`);
                        
                        const techPicareta = jogo.listaTechs ? jogo.listaTechs.find(t => t.id === 'picareta_diamante') : null;
                        const multiplicadorTech = (techPicareta && techPicareta.feito) ? 2 : 1;

                        // Lista para guardar o resumo do que ganhou
                        let relatorioMineracao = [];

                        tabelaMinerais.forEach(m => {
                            const prodPorMinuto = calcularProducaoPorMinuto(m.id);
                            
                            if (prodPorMinuto > 0) {
                                const prodTotalMinuto = prodPorMinuto * multiplicadorTech;
                                const prodPorSegundo = prodTotalMinuto / 60;
                                const ganho = prodPorSegundo * tempoParaMina;
                                
                                jogo.bancoMinerios[m.id] = (jogo.bancoMinerios[m.id] || 0) + ganho;
                                
                                if (jogo.bancoMinerios[m.id] >= 1) {
                                    const inteiro = Math.floor(jogo.bancoMinerios[m.id]);
                                    jogo.minerios[m.id] = Math.min((jogo.minerios[m.id] || 0) + inteiro, limites.recursos);
                                    jogo.bancoMinerios[m.id] -= inteiro;

                                    // Adiciona ao relatório (Ex: "10 Pedra")
                                    relatorioMineracao.push(`${inteiro} ${m.nome}`);
                                }
                            }
                        });

                        // Se minerou alguma coisa, mostra no console
                        if (relatorioMineracao.length > 0) {
                            const textoFinal = relatorioMineracao.join(', ');
                            console.log(`%c[OFFLINE] ⛏️ Mineração Concluída: +${textoFinal}`, "color: #e67e22; font-weight: bold;");
                            
                            // Opcional: Se quiser mostrar aviso na tela pro jogador também, descomente a linha abaixo:
                            // mostrarAviso("Mineração Offline", `Enquanto você dormia, seus mineradores extraíram: ${textoFinal}`);
                        }
                    }
                    // --- FIM MINA OFFLINE ---

                    salvarNaNuvem();
                }
                jogoIniciado = true;
                carregandoDados = false;
            }

            // Garantias de integridade (Arrays vazios etc...)
            if (!jogo.estudos) jogo.estudos = [];
            while (jogo.estudos.length < 4) {
                jogo.estudos.push({ item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 });
            }
            if (!jogo.leitos) jogo.leitos = Array.from({ length: 3 }, (_, index) => ({ id: index, ocupado: null }));
            if (!jogo.filaDeEspera) jogo.filaDeEspera = [];
            if (!jogo.loadoutEnfermaria) jogo.loadoutEnfermaria = { 'bandagem': 'bandagem_comum', 'pocao': 'pocao_vida_p', 'ervas': 'ervas_comuns' };

            tabelaMinerais.forEach(m => {
                if (!jogo.alocacaoMina[m.id]) {
                    jogo.alocacaoMina[m.id] = [null, null];
                    if (jogo.bancoMinerios[m.id] === undefined) jogo.bancoMinerios[m.id] = 0;
                    if (jogo.minerios[m.id] === undefined) jogo.minerios[m.id] = 0;
                }
            });
        }
    }

    export function iniciarSave() {

        // 2. Configura para salvar a cada 10 segundos automaticamente
        setInterval(() => { 
            salvarNaNuvem();
        }, 10000); // 10000 ms = 10 segundos
    }
export function resetar() { if (confirm("Resetar?")) { localStorage.removeItem('save-v15-refactor'); location.reload(); } }
// Se o jogador trocar de aba, o navegador pausa o loop.
// Quando voltar, precisamos resetar o relógio para não dar um salto no tempo.
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        // Saiu da aba: não faz nada, deixa o tempo correr
    } else {
        // Voltou para a aba: 
        // O próximo frame vai comparar Date.now() com a última vez que rodou.
        // Isso vai gerar um 'deltaSegundos' grande, e o jogo vai processar
        // tudo o que ficou pendente instantaneamente.
        console.log("Voltou para a aba! Processando tempo offline...");
    }
});
setTimeout(() => {
    if (jogo.filaDeEspera.length === 0) {
        jogo.filaDeEspera = [
            { id: 't_01', nome: 'Recruta Azarado', doenca: 'corte_pergaminho', tipo: 'tropa', qtd: 5, tempoTotal: 60, tempoAtual: 0, icone: '/assets/ui/icone_tropa.png' },
            { id: 't_02', nome: 'Lenhador Descuidado', doenca: 'torcao_tornozelo', tipo: 'especial', qtd: 1, tempoTotal: 120, tempoAtual: 0, icone: '/assets/faces/humano/neutro_1_m.png' },
            { id: 't_05', nome: 'Minerador Caído', doenca: 'petrificacao_basilisco', tipo: 'especial', qtd: 1, tempoTotal: 600, tempoAtual: 0, icone: '/assets/faces/anao/neutro_1_m.png' }
        ];
        console.log("Forçando doentes na lista!");
    }
}, 2000); // Espera 2 segundos para o save carregar antes de forçar