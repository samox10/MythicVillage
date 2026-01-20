import { reactive, computed } from 'vue';
import { tabelaMinerais, tabelaItens } from './dados.js';
import { gerarFuncionario, criarObjetoFuncionario, processarFusao, calcularChancesFusao, ORDEM_TIERS } from './funcionarios.js';

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

// --- ESTADO DO JOGO ---
export const jogo = reactive({
    madeira: 100, comida: 100, ouro: 500, ciencia: 0, couro: 0,
    funcionarios: [],

    // Controle Diário
    contratacoesHoje: 0,
    contratacoesEliteHoje: 0,
    ultimoDiaContratacao: null,

    minerios: { pedra: 20, cobre: 0, ferro: 0, prata: 0, ouro_min: 0, obsidiana: 0, titanio: 0, diamante: 0, mithril: 0, aetherium: 0 },
    alocacaoMina: { ...alocacaoInicial }, // Guarda IDs: { pedra: ['id_joao', null], ... }
    bancoMinerios: { ...bancoInicial },   // Guarda frações de minério (ex: 0.45)
    itens: { ...itensIniciais },
    desempregados: 0, lenhadores: 0, cacadores: 0, academicos: 0, mineradores: 0, populacaoMax: 5,
    prefeitura: 1, custoPrefeitura: { madeira: 100, pedra: 100, comida: 50 },
    casas: 0, custoCasa: { madeira: 50, pedra: 10 },
    armazens: 0, custoArmazem: { madeira: 150, pedra: 50 },
    laboratorio: 0, custoLaboratorio: { madeira: 300, pedra: 150, ouro: 50 },
    ferraria: 0, custoFerraria: { madeira: 500, pedra: 200 },
    mina: 0, custoMina: { madeira: 200, comida: 100 },
    taverna: 0, custoTaverna: { madeira: 200, pedra: 100 },
    ultimaAtualizacao: Date.now(),
    construindo: { tipo: null, tempoRestante: 0, tempoTotal: 0 },
    craftando: [], // Mudou de objeto {} para lista []
    listaTechs: [
        { id: 'machado_ferro', nome: 'Machados de Ferro', desc: 'Lenhadores +50%', custo: { ciencia: 50 }, feito: false },
        { id: 'silos', nome: 'Silos', desc: 'Armazéns +50%', custo: { ciencia: 100 }, feito: false },
        { id: 'picareta_diamante', nome: 'Brocas de Diamante', desc: 'Mineração 2x mais rápida', custo: { ciencia: 1000, diamante: 10 }, feito: false }
    ]
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
    if (tipo === 'mina') { jogo.mina++; jogo.custoMina.madeira = Math.floor(jogo.custoMina.madeira * 1.8); jogo.custoMina.comida = Math.floor(jogo.custoMina.comida * 1.8); }
    else if (tipo === 'ferraria') jogo.ferraria++;
    else if (tipo === 'prefeitura') { jogo.prefeitura++; jogo.custoPrefeitura.madeira = Math.floor(jogo.custoPrefeitura.madeira * 2.5); jogo.custoPrefeitura.pedra = Math.floor(jogo.custoPrefeitura.pedra * 2.5); jogo.custoPrefeitura.comida = Math.floor(jogo.custoPrefeitura.comida * 2.5); }
    else if (tipo === 'casa') { jogo.casas++; jogo.populacaoMax += 2; jogo.custoCasa.madeira = Math.floor(jogo.custoCasa.madeira * 1.3); jogo.custoCasa.pedra = Math.floor(jogo.custoCasa.pedra * 1.3); }
    else if (tipo === 'armazem') { jogo.armazens++; jogo.custoArmazem.madeira = Math.floor(jogo.custoArmazem.madeira * 1.4); jogo.custoArmazem.pedra = Math.floor(jogo.custoArmazem.pedra * 1.4); }
    else if (tipo === 'taverna') { jogo.taverna++; jogo.custoTaverna.madeira = Math.floor(jogo.custoTaverna.madeira * 1.6); jogo.custoTaverna.pedra = Math.floor(jogo.custoTaverna.pedra * 1.6); }
    else if (tipo === 'laboratorio') jogo.laboratorio = 1;
    jogo.construindo.tipo = null;
}
function finalizarCraft(index) {
    const slot = jogo.craftando[index];
    if (!slot) return;

    const receita = tabelaItens.find(i => i.id === slot.item);
    if (receita) {
        // Simplesmente entrega tudo (sem lógica de falha complexa pra simplificar o loop)
        const qtdRecebida = slot.qtdLote * (receita.qtd || 1);
        jogo.itens[receita.id] += qtdRecebida;
    }
    // Remove da lista pois acabou
    jogo.craftando.splice(index, 1);
}
function processarOffline(segundosOffline) {
    if (segundosOffline <= 0) return;
    
    const minutosOffline = segundosOffline / 60;
    const eficiencia = 0.8; // 80%

    tabelaMinerais.forEach(m => {
        const prodPorMinuto = calcularProducaoPorMinuto(m.id);
        if (prodPorMinuto > 0) {
            const totalGerado = prodPorMinuto * minutosOffline * eficiencia;
            jogo.minerios[m.id] = Math.min((jogo.minerios[m.id] || 0) + Math.floor(totalGerado), limites.recursos);
        }
    });
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

// --- AÇÕES ---
export const acoes = {
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
        } else {
            mostrarAviso("Sem Ouro", `Você precisa de ${totalDevido} ouros para quitar ${func.diasEmGreve} dias de atraso.`);
        }
    },
    construir(tipo) {
        if (jogo.construindo.tipo) return mostrarAviso("Ocupado!", "A fila de construção já está ocupada.");
        const custos = {
            casa: jogo.custoCasa, armazem: jogo.custoArmazem, laboratorio: jogo.custoLaboratorio,
            ferraria: jogo.custoFerraria, mina: jogo.custoMina, taverna: jogo.custoTaverna
        };
        if (tipo === 'casa' && jogo.casas >= limites.casas) return mostrarAviso("Limite", "Evolua a Prefeitura.");
        if (tipo === 'armazem' && (jogo.casas + jogo.armazens) >= limites.casas) return mostrarAviso("Limite", "Evolua a Prefeitura.");
        if (tipo === 'laboratorio' && jogo.laboratorio === 0) {
            if (jogo.madeira >= jogo.custoLaboratorio.madeira && jogo.minerios.pedra >= jogo.custoLaboratorio.pedra && jogo.ouro >= jogo.custoLaboratorio.ouro) {
                jogo.madeira -= jogo.custoLaboratorio.madeira; jogo.minerios.pedra -= jogo.custoLaboratorio.pedra; jogo.ouro -= jogo.custoLaboratorio.ouro;
                jogo.construindo = { tipo: 'laboratorio', tempoRestante: 60, tempoTotal: 60 };
            }
        } else {
            const c = custos[tipo];
            if (c) {
                if ((c.madeira && jogo.madeira < c.madeira) || (c.pedra && jogo.minerios.pedra < c.pedra) || (c.ouro && jogo.ouro < c.ouro) || (c.comida && jogo.comida < c.comida))
                    return mostrarAviso("Sem Recursos", "Recursos insuficientes.");
                if (c.madeira) jogo.madeira -= c.madeira; if (c.pedra) jogo.minerios.pedra -= c.pedra;
                if (c.ouro) jogo.ouro -= c.ouro; if (c.comida) jogo.comida -= c.comida;
                const tempos = { casa: 10, armazem: 15, laboratorio: 60, ferraria: 60, mina: 30, taverna: 40 };
                jogo.construindo = { tipo, tempoRestante: tempos[tipo], tempoTotal: tempos[tipo] };
            }
        }
    },
    evoluir(tipo) {
        if (jogo.construindo.tipo) return mostrarAviso("Ocupado!", "Fila ocupada.");
        if (tipo === 'prefeitura') {
            const c = jogo.custoPrefeitura;
            if (jogo.madeira >= c.madeira && jogo.minerios.pedra >= c.pedra && jogo.comida >= c.comida) {
                jogo.madeira -= c.madeira; jogo.minerios.pedra -= c.pedra; jogo.comida -= c.comida;
                const t = calcularTempoConstrucao(jogo.prefeitura);
                jogo.construindo = { tipo: 'prefeitura', tempoRestante: t, tempoTotal: t };
            }
        } else if (tipo === 'mina' && jogo.mina < 20) {
            if (jogo.madeira >= jogo.custoMina.madeira && jogo.comida >= jogo.custoMina.comida) {
                jogo.madeira -= jogo.custoMina.madeira; jogo.comida -= jogo.custoMina.comida;
                const t = calcularTempoConstrucao(jogo.mina);
                jogo.construindo = { tipo: 'mina', tempoRestante: t, tempoTotal: t };
            }
        } else if (tipo === 'taverna' && jogo.taverna < 10) {
            const c = jogo.custoTaverna;
            if (jogo.madeira >= c.madeira && jogo.minerios.pedra >= c.pedra) {
                jogo.madeira -= c.madeira; jogo.minerios.pedra -= c.pedra;
                jogo.construindo = { tipo: 'taverna', tempoRestante: jogo.taverna * 60, tempoTotal: jogo.taverna * 60 };
            }
        }
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

        // --- VERIFICAÇÃO DE AVENTUREIROS (NOVO) ---
        // Se todos forem aventureiros (mesmo que classes diferentes), o resultado DEVE ser aventureiro
        const saoTodosAventureiros = funcs.every(f => f.profissao === 'aventureiro');
        
        let classeFinal = null;

        if (saoTodosAventureiros) {
            profissaoFinal = 'aventureiro'; // Força ser aventureiro
            
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
        // Sinergia se: Mesma Profissão OU Mesma Raça OU Mesma Classe (caso aventureiros)
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
        // Agora a função apenas apaga, sem perguntar.
        // A pergunta será feita pelo Modal visual na Taverna.
        const idx = jogo.funcionarios.findIndex(x => x.id === id);
        if (idx !== -1) jogo.funcionarios.splice(idx, 1);
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
                    // Entrega todos os itens do lote imediatamente
                    jogo.itens[receita.id] += ((receita.qtd || 1) * slot.qtdLote);
                }
                
                // Remove da fila
                jogo.craftando.splice(index, 1);
                
                // Opcional: Feedback de sucesso
                mostrarAviso("Acelerado!", "Produção concluída instantaneamente.", "sucesso");
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
        const mapa = { lenhador: 'lenhadores', minerador: 'mineradores', cacador: 'cacadores', academico: 'academicos' };
        const p = mapa[prof];
        if (qtd === -1 && jogo[p] > 0) {
            if (prof === 'minerador' && (jogo.mineradores - mineradoresOcupados.value) <= 0) return mostrarAviso("Erro", "Mineradores trabalhando.");
            jogo[p]--; jogo.desempregados++;
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
    },
    
    desalocarMinerador(minerioId, slotIndex) {
        jogo.alocacaoMina[minerioId][slotIndex] = null;
    },
    pesquisar(tech) { if (!tech.feito && jogo.ciencia >= tech.custo.ciencia) { jogo.ciencia -= tech.custo.ciencia; tech.feito = true; } },
    // HACKS PARA TESTES
    hack() { jogo.ouro += 100000000; jogo.madeira += 100000; jogo.comida += 100000; jogo.couro += 1000; Object.keys(jogo.minerios).forEach(k => jogo.minerios[k] += 1000); },
    // HACK DE CONSTRUÇÕES
    hackConstrucoes() {
        // Aumenta o nível dos prédios principais
        jogo.prefeitura++;
        jogo.mina++;
        jogo.ferraria++;
        jogo.taverna++;
        
        // Adiciona casas e armazéns extras
        jogo.casas += 2;
        jogo.armazens += 2;
        
        // Ativa o laboratório se não tiver
        if (jogo.laboratorio === 0) jogo.laboratorio = 1;
        
        // Aumenta população máxima (para acompanhar as casas novas)
        jogo.populacaoMax += 4; 

        mostrarAviso("HACK ATIVADO", "Todas as construções subiram de nível! 🏗️", "sucesso");
    },
    // HACK DE RECURSOS
    resetarRecursos() {
        pedirConfirmacao("Lixeira", "Zerar tudo?", () => {
            ['madeira', 'comida', 'ouro', 'ciencia', 'couro'].forEach(k => jogo[k] = 0);
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

export function iniciarLoop() {
    if (loopId) clearInterval(loopId);
    loopId = setInterval(() => {
        // 1. Calcula o tempo real que passou desde o último tick (Delta Time)
        const agora = Date.now();
        // Evita saltos gigantes se o jogo travou (limita a 1s min se for muito pequeno)
        const deltaSegundos = (agora - jogo.ultimaAtualizacao) / 1000;
        jogo.ultimaAtualizacao = agora;

        const lim = limites.recursos;
        
        // Verifica se tem a tecnologia de picareta (opcional, se ainda não tiver a tech, assume 1)
        const techPicareta = jogo.listaTechs.find(t => t.id === 'picareta_diamante');
        const multiplicadorTech = (techPicareta && techPicareta.feito) ? 2 : 1;

        // --- PROCESSAR MINERAÇÃO ---
        tabelaMinerais.forEach(m => {
            const prodPorMinuto = calcularProducaoPorMinuto(m.id);
            
            if (prodPorMinuto > 0) {
                // Aplica o multiplicador da Tech aqui se desejar, ou deixe no cálculo base
                const prodTotalMinuto = prodPorMinuto * multiplicadorTech;
                
                const prodPorSegundo = prodTotalMinuto / 60;
                const ganho = prodPorSegundo * deltaSegundos; // Agora deltaSegundos existe!
                
                // Usa o banco para acumular frações
                jogo.bancoMinerios[m.id] = (jogo.bancoMinerios[m.id] || 0) + ganho;
                
                if (jogo.bancoMinerios[m.id] >= 1) {
                    const inteiro = Math.floor(jogo.bancoMinerios[m.id]);
                    jogo.minerios[m.id] = Math.min((jogo.minerios[m.id] || 0) + inteiro, limites.recursos);
                    jogo.bancoMinerios[m.id] -= inteiro;
                }
            }
        });

        // --- TIMERS DE CONSTRUÇÃO E CRAFT ---
        if (jogo.construindo.tipo) { 
            jogo.construindo.tempoRestante -= deltaSegundos; // Usa delta para precisão
            if (jogo.construindo.tempoRestante <= 0) finalizarConstrucao(); 
        }
        // Percorre a lista de trás para frente para poder remover itens sem bugar o índice
        for (let i = jogo.craftando.length - 1; i >= 0; i--) {
            const slot = jogo.craftando[i];
            slot.tempoRestante -= deltaSegundos;
            if (slot.tempoRestante <= 0) {
                finalizarCraft(i);
            }
        }

        // --- RECURSOS BÁSICOS (COMIDA/MADEIRA) ---
        // Mantido simples (por tick) ou pode usar deltaSegundos também para precisão
        const cons = populacaoTotal.value;
        const prodCarne = calcularProducaoTotal('cacador') * 2;
        jogo.comida = Math.max(0, jogo.comida + (prodCarne - cons) * deltaSegundos); // Ajustado para Delta
        
        const prodCouro = calcularProducaoTotal('cacador') * 0.2;
        if (prodCouro > 0) jogo.couro = Math.min(jogo.couro + (prodCouro * deltaSegundos), lim);
        
        const prodMadeira = calcularProducaoTotal('lenhador');
        if (prodMadeira > 0) {
            const techMachado = jogo.listaTechs.find(t => t.id === 'machado_ferro');
            const bMad = (techMachado && techMachado.feito) ? 1.5 : 1;
            jogo.madeira = Math.min(jogo.madeira + (prodMadeira * bMad * deltaSegundos), lim);
        }

    }, 1000); // Roda a cada segundo
}

export function iniciarSave() {
    const s = localStorage.getItem('save-v15-refactor');
    if (s) { 
        try { 
            const dadosSalvos = JSON.parse(s);
            Object.assign(jogo, dadosSalvos);
            if (jogo.craftando && !Array.isArray(jogo.craftando)) {
                console.warn("Detectado save antigo da Ferraria. Resetando fila para evitar crash.");
                jogo.craftando = []; // Transforma em lista vazia à força
            }
            // --- CORREÇÃO: REPARO DE SLOTS INEXISTENTES ---
            // Garante que se você adicionou minérios novos no código, 
            // eles sejam criados no save antigo.
            tabelaMinerais.forEach(m => {
                if (!jogo.alocacaoMina[m.id]) {
                    jogo.alocacaoMina[m.id] = [null, null];
                    jogo.bancoMinerios[m.id] = 0; // Garante banco também
                    // Inicializa contadores se não existirem
                    if (jogo.minerios[m.id] === undefined) jogo.minerios[m.id] = 0;
                }
            });

            // Processamento Offline
            if (Date.now() - jogo.ultimaAtualizacao > 5000) {
                processarOffline((Date.now() - jogo.ultimaAtualizacao) / 1000);
            }
        } catch (e) { 
            console.error("Erro ao carregar save:", e);
        } 
    }

    // VERIFICAÇÃO AUTOMÁTICA AO CARREGAR O JOGO
    verificarNovoDia();

    setInterval(() => { 
        jogo.ultimaAtualizacao = Date.now(); 
        localStorage.setItem('save-v15-refactor', JSON.stringify(jogo)); 
    }, 5000);
}
export function resetar() { if (confirm("Resetar?")) { localStorage.removeItem('save-v15-refactor'); location.reload(); } }