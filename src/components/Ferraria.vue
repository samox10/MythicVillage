<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, watch} from 'vue';
import { jogo, acoes, dadosItens, obterBuffRaca, mostrarAviso, salvarNaNuvem } from '../jogo.js';
import { DB_PEDRAS } from '../dados.js'; // Importa a tabela de pedras
import { corTier, nomeProfissao } from '../funcionarios.js';
import imgAprendiz from '../assets/icons/pedra-aprendiz.png';
import imgArtesao from '../assets/icons/pedra-artesao.png';
import imgGraomestre from '../assets/icons/pedra-graomestre.png';
import imgResiduo from '../assets/icons/residuo.png';
import { formatarTempo, formatarNumero } from '../utilidades.js';

// Define a classe do background baseada no nível
const classeBackgroundTier = computed(() => {
    if (!itemParaAprimorar.value) return 'bg-tier-comum'; // Padrão
    
    const nv = itemParaAprimorar.value.nivel;

    if (nv >= 10) return 'bg-tier-mitico';    // +10 (Ciano/SS)
    if (nv >= 8)  return 'bg-tier-lendario';  // +8 a +9 (Amarelo/S)
    if (nv >= 5)  return 'bg-tier-raro';      // +5 a +7 (Roxo/A)
    
    return 'bg-tier-comum';                   // +0 a +4 (Branco/Padrão)
});
// Este mapa ajuda o código a saber qual imagem usar para qual ID de pedra
const mapaImagensPedras = {
    'pedra_up_comum': imgAprendiz,
    'pedra_up_rara': imgArtesao,
    'pedra_up_mitica': imgGraomestre
};
const statusChanceClass = computed(() => {
    if (chanceSucessoAtual.value >= 75) return 'chance-alta';
    if (chanceSucessoAtual.value >= 40) return 'chance-media';
    return 'chance-baixa';
});
// --- ESTADO LOCAL ---
const filtroTipo = ref('todos');
const filtroStat = ref('todos');
const filtroNivel = ref('todos'); 
const abaAtual = ref('fabricacao'); 
const filtroCategoria = ref('aventureiro');
const mostrarBotaoTopo = ref(false);
const itemSelecionado = ref(null); 
const slotFocado = ref(null); 
const modalRelatorioInterrupcao = ref(null); 

// --- NOVO: ESTADO DA ABA DE APRIMORAMENTO ---
const filtroInv = ref('arma'); // Filtro da lista da esquerda (inventário)
const itemParaAprimorar = ref(null);
// --- CONTROLE DOS MODAIS DE CONFIRMAÇÃO ---
const modalReciclarAberto = ref(false);
const modalLixeiraAberto = ref(false);
const ganhoPrevistoReciclagem = ref(0); // Para mostrar quanto pó vai ganhar
// Função auxiliar para pegar a cor do tier na lista
const getTierMini = (nivel) => {
    if (nivel >= 10) return 'mini-tier-mitico';   // Ciano (+10)
    if (nivel >= 8)  return 'mini-tier-lendario'; // Dourado (+8, +9)
    if (nivel >= 5)  return 'mini-tier-raro';     // Roxo (+5 a +7)
    return 'mini-tier-comum';                     // Padrão (+0 a +4)
};
const pedraSelecionada = ref(null); // Qual pedra o usuário clicou
const qtdPoUsado = ref(0);
const modalSelecaoAberto = ref(null); 

const inventarioFiltrado = computed(() => {
    // Se a lista não existir ainda no save, retorna vazio para não dar erro
    if (!jogo.equipamentos) return [];
    
    return jogo.equipamentos.filter(instancia => {
        // 1. Regra de Ouro: Só mostra itens de Herói
        if (instancia.categoria !== 'heroi') return false;

        // 2. Filtro de Tipo (Arma, Elmo, etc)
        if (filtroInv.value !== 'todos' && instancia.tipo !== filtroInv.value) return false;
        
        return true;
    })
    .sort((a, b) => {
        // Ordena do Maior (b) para o Menor (a) baseado no Nível
        return b.nivel - a.nivel;
    });
});
// --- NOVAS AÇÕES: LIXEIRA E RECICLAGEM ---
const removerDoInventario = (uidAlvo) => {
    const index = jogo.equipamentos.findIndex(i => i.uid === uidAlvo);
    if (index !== -1) jogo.equipamentos.splice(index, 1);
    itemParaAprimorar.value = null; // Limpa a seleção
};

const clicarBotaoReciclar = () => {
    const item = itemParaAprimorar.value;
    if (!item) return;

    if (item.nivel < 5) {
        mostrarAviso("Item Fraco", "Apenas itens +5 ou superior geram Resíduo.");
        return;
    }

    // Calcula quanto vai ganhar só para mostrar no modal
    ganhoPrevistoReciclagem.value = Math.floor((item.nivel - 4) * 8);
    
    modalReciclarAberto.value = true; // ABRE O MODAL
};

const clicarBotaoLixeira = () => {
    if (!itemParaAprimorar.value) return;
    modalLixeiraAberto.value = true; // ABRE O MODAL
};
const confirmarReciclagem = () => {
    const item = itemParaAprimorar.value;
    if (!item) return;

    // Adiciona o pó
    jogo.poMistico = (jogo.poMistico || 0) + ganhoPrevistoReciclagem.value;
    
    // Remove o item
    removerDoInventario(item.uid);
    
    mostrarAviso("Reciclado!", `Você obteve ${ganhoPrevistoReciclagem.value} Resíduos.`, "sucesso");
    modalReciclarAberto.value = false; // Fecha modal
};

const confirmarLixeira = () => {
    if (itemParaAprimorar.value) {
        removerDoInventario(itemParaAprimorar.value.uid);
    }
    modalLixeiraAberto.value = false; // Fecha modal
};
// Pedras Disponíveis (Agora só mostra as de nível)
const minhasPedras = computed(() => {
    return DB_PEDRAS.nivel;
});

// Calcula a chance baseada na PEDRA SELECIONADA e no NÍVEL DO ITEM
const chanceSucessoAtual = computed(() => {
    if (!itemParaAprimorar.value || !pedraSelecionada.value) return 0;

    const nivelAtual = itemParaAprimorar.value.nivel;
    // Se o item já for +10, chance é 0
    if (nivelAtual >= 10) return 0;

    // Busca as chances da pedra selecionada
    const tabela = pedraSelecionada.value.chances;
    
    // Pega a chance base para o nível atual (se não tiver no array, é 0)
    let chance = tabela[nivelAtual] !== undefined ? tabela[nivelAtual] : 0;

    // Agora: Máximo 10% (1 unidade = 1%).
    chance += Math.min(10, qtdPoUsado.value);

    // Bônus do Ferreiro
    if (statsFerreiro.value) {
        chance += (statsFerreiro.value.poderReal / 5);
    }

    return Math.min(100, Math.max(0, chance));
});

// AÇÃO DE APRIMORAR (COM SISTEMA DE FALHA E DOWNGRADE)
const realizarAprimoramento = () => {
    const item = itemParaAprimorar.value;
    const pedra = pedraSelecionada.value;

    if (!item || !pedra) return;

    // --- NOVA TRAVA DE SEGURANÇA AQUI ---
    if (item.nivel >= 10) {
        mostrarAviso("Nível Máximo", "Este item atingiu seu verdadeiro potencial!", "aviso");
        return;
    }

    // Verifica Pedra
    const idPedra = pedra.id;
    if ((jogo[idPedra] || 0) < 1) {
        mostrarAviso("Sem Pedra", "Você não possui esta pedra.");
        return;
    }

    // Verifica Ouro
    const custoOuro = 3000; // Valor fixo solicitado (3k por tentativa)
    
    if (jogo.ouro < custoOuro) {
         mostrarAviso("Sem Ouro", `Custa ${custoOuro} ouros.`);
         return;
    }

    // Consome
    jogo[idPedra]--;
    jogo.ouro -= custoOuro;
    
    // Consome Resíduo (Se tiver)
    if (qtdPoUsado.value > 0) {
        if ((jogo.poMistico || 0) >= qtdPoUsado.value) {
             jogo.poMistico -= qtdPoUsado.value;
        } else {
            qtdPoUsado.value = 0; 
        }
    }

    const roll = Math.random() * 100;
    const sucesso = roll <= chanceSucessoAtual.value;

    if (sucesso) {
        item.nivel++;
        if (item.stats) {
            Object.keys(item.stats).forEach(k => item.stats[k] += Math.ceil(item.stats[k] * 0.1));
        }
        mostrarAviso("SUCESSO!", `O item brilhou! Agora é +${item.nivel}.`, 'sucesso');
    } else {
        // --- SISTEMA DE FALHA ---
        let msg = "A pedra quebrou e o encantamento falhou.";
        let tipoAviso = 'aviso';
        
        // --- NOVO: Recompensa de Consolação (Resíduo na Falha) ---
        // Só gera se for falha tentando ir para +7 ou mais (ou seja, item atual >= 6)
        if (item.nivel >= 6) {
            // Fórmula bem menor que a reciclagem
            // Ex: Nivel 6 (tentando +7) -> (6 - 4) * 2 = 4 resíduos.
            const ganhoConsolacao = Math.floor((item.nivel - 4) * 2);
            
            if (ganhoConsolacao > 0) {
                jogo.poMistico = (jogo.poMistico || 0) + ganhoConsolacao;
                msg += `\nVocê recolheu ${ganhoConsolacao} resíduos dos estilhaços.`;
            }
        }

        // Punição de Downgrade (+5 para cima)
        if (item.nivel >= 5) {
            item.nivel--;
            if (item.stats) {
                Object.keys(item.stats).forEach(k => item.stats[k] -= Math.ceil(item.stats[k] * 0.09));
            }
            msg = "FALHA CRÍTICA! O item perdeu poder e voltou um nível.\n" + (item.nivel >= 6 ? `(Você obteve resíduos)` : ``);
            tipoAviso = 'erro';
        }
        
        mostrarAviso(tipoAviso === 'erro' ? "QUEBROU!" : "FALHA", msg, tipoAviso);
    }
    qtdPoUsado.value = 0;
    salvarNaNuvem();
};

// --- CÁLCULOS E LÓGICA ---
// Função para abrir/fechar o balão ao clicar no quadrado
const toggleSlot = (index) => {
    if (slotFocado.value === index) {
        slotFocado.value = null; // Se já ta aberto, fecha
    } else {
        slotFocado.value = index; // Abre o novo
    }
};
const qtdModal = ref(1); // Variável simples para controlar o input

const abrirForja = (item) => {
    itemSelecionado.value = item;
    qtdModal.value = 1; // Sempre reseta para 1 ao abrir
};

const fecharForja = () => {
    itemSelecionado.value = null; // Fecha o modal
};
// Mapeia a chave do 'dados.js' para o arquivo de imagem e o nome legível
const mapaAtributos = {
    ataque: { nome: "Ataque", img: "icone_ataque.png" },
    defesa: { nome: "Defesa", img: "icone_defesafisica.png" },
    vida: { nome: "Vida", img: "icone_vida.png" },
    precisao: { nome: "Precisão", img: "icone_precisao.png" },
    evasao: { nome: "Evasão", img: "icone_evasao.png" },
    critico: { nome: "Chance Crítica", img: "icone_chancecritico.png" },
    danoCritico: { nome: "Danos Crít.", img: "icone_danocritico.png" },
    magia: { nome: "Magia", img: "icone_danomagico.png" },
    defesaMagica: { nome: "Def. Mágica", img: "icone_defesamagica.png" },
    penetracao: { nome: "Penetração", img: "icone_penetracao.png" },
    mana: { nome: "Mana", img: "icone_mana.png"}
};
// --- CONTROLE DO TOOLTIP ---
const tooltipData = reactive({
    visivel: false,
    texto: '',
    x: 0,
    y: 0
});

// Função chamada ao clicar no ícone
const abrirTooltip = (event, nomeAtributo) => {
    // Se clicar no mesmo que já está aberto, fecha
    if (tooltipData.visivel && tooltipData.texto === nomeAtributo) {
        fecharTooltip();
        return;
    }
    
    tooltipData.texto = nomeAtributo;
    tooltipData.visivel = true;

    // Calcula posição baseada onde o mouse clicou
    // Adiciona um pequeno offset (10px) para não ficar embaixo do mouse
    tooltipData.x = event.clientX + 10;
    tooltipData.y = event.clientY + 10;

    // Adiciona um ouvinte global para fechar se clicar fora
    setTimeout(() => { // Timeout pequeno para não detectar o próprio clique atual
        window.addEventListener('click', fecharTooltipFora);
    }, 50);
};

const fecharTooltip = () => {
    // 1. Fecha o tooltip de Atributos (se estiver aberto)
    tooltipData.visivel = false;
    window.removeEventListener('click', fecharTooltipFora);

    // 2. Fecha o tooltip da Fila de Produção (se estiver aberto)
    slotFocado.value = null; 
};

// Fecha se clicar em qualquer lugar que não seja o tooltip
const fecharTooltipFora = (e) => {
    const tooltipEl = document.getElementById('tooltip-flutuante');
    if (tooltipEl && !tooltipEl.contains(e.target)) {
        fecharTooltip();
    }
};
// --- LÓGICA DE FILTRO E ORDENAÇÃO ---
const itensFiltrados = computed(() => {
    // 1. Primeiro filtramos
    const listaFiltrada = dadosItens.filter(item => {
        
        // --- CORREÇÃO AQUI ---
        // A lógica tem que ficar DENTRO deste bloco 'filter', pois é aqui que o 'item' existe.
        const catItem = item.categoria || 'aventureiro'; 
        if (catItem !== filtroCategoria.value) return false;
        // ---------------------

        // Filtro de Tipo (Já existia)
        if (filtroTipo.value !== 'todos' && item.tipo !== filtroTipo.value) return false;
        
        // Filtro de Atributo (Stat)
        if (filtroStat.value !== 'todos') {
            if (!item.stats || !item.stats[filtroStat.value]) return false;
        }

        // --- Filtro de Nível ---
        if (filtroNivel.value !== 'todos') {
            const nivelMinimo = parseInt(filtroNivel.value);
            // Se o item for menor que o filtro, esconde ele
            if ((item.nivelItem || 1) < nivelMinimo) return false;
        }

        return true;
    });

    // 2. Agora ordenamos: Nível maior fica em cima (decrescente)
    return listaFiltrada.sort((a, b) => {
        const nivelA = a.nivelItem || 0; 
        const nivelB = b.nivelItem || 0;
        return nivelB - nivelA;
    });
});

// --- COMPUTEDS DE FERREIRO E BUFFS ---
const ferreiroAtivo = computed(() => {
    return jogo.funcionarios.find(f => f.profissao === 'ferreiro' && f.diasEmGreve === 0);
});
// --- SISTEMA DE SEGURANÇA CASO FERREIRO SEJA DEMITIDO ---
// Vigia: Aba, Ferreiro, Filtro e Fila de Produção
// 1. Função que faz a varredura (Separada para ser usada em dois lugares)
// 1. Função de Segurança Atualizada (Com Modal Visual)
// 1. Função de Segurança (Versão Corrigida: Aventureiro é Seguro)
const aplicarSegurancaFerreiro = (aba, temFerreiro, categoria) => {
    // 1. Navegação
    if (aba === 'aprimoramento' && !temFerreiro) abaAtual.value = 'fabricacao';
    if (categoria === 'heroi' && !temFerreiro) filtroCategoria.value = 'aventureiro';

    // 2. Cancelamento
    if (!temFerreiro) {
        // Fecha modal se for Herói
        if (itemSelecionado.value) {
            const cat = itemSelecionado.value.categoria || 'aventureiro';
            if (cat === 'heroi') fecharForja();
        }

        const itensAfetados = [];
        // Varre a fila
        for (let i = jogo.craftando.length - 1; i >= 0; i--) {
            const slot = jogo.craftando[i];
            const itemDados = dadosItens.find(it => it.id === slot.item);
            if (!itemDados) continue;

            const cat = itemDados.categoria || 'aventureiro';
            if (cat !== 'heroi') continue; // Aventureiro é seguro

            // Lógica de Reembolso
            const tempoDecorrido = slot.tempoTotal - slot.tempoRestante;
            const tempoPorItem = slot.tempoTotal / slot.qtdLote;
            const feitos = Math.floor(tempoDecorrido / tempoPorItem);
            const pendentes = Math.max(0, slot.qtdLote - feitos);

            if (feitos > 0) jogo.itens[itemDados.id] = (jogo.itens[itemDados.id] || 0) + (feitos * (itemDados.qtd || 1));
            
            if (pendentes > 0) {
                Object.keys(itemDados.custo).forEach(k => {
                    const dev = Math.floor((itemDados.custo[k] * pendentes) * 0.9);
                    if (jogo.minerios[k] !== undefined) jogo.minerios[k] += dev; 
                    else jogo[k] += dev;
                });
            }

            itensAfetados.push({ nome: itemDados.nome, img: itemDados.img, feitos: feitos, cancelados: pendentes });
            jogo.craftando.splice(i, 1);
        }
        if (itensAfetados.length > 0) modalRelatorioInterrupcao.value = itensAfetados;
    }
};
    const voltarAoTopo = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Faz a subida ser animada e suave
        });
    };
    // Função que verifica a posição da tela
    const verificarScroll = () => {
        // Se desceu mais que 300 pixels, mostra o botão
        mostrarBotaoTopo.value = window.scrollY > 300;
    };
    const protegerMultitarefa = (event) => {
    // Se o LocalStorage mudou em outra aba, recarrega essa aqui
    if (event.storageArea === localStorage) {
        fecharForja();
        alert("⚠️ ATENÇÃO: Ação detectada em outra aba!\nA página será atualizada para evitar erros.");
        window.location.reload();
    }
};
    // 2. O Vigilante (Monitora mudanças enquanto a tela está aberta)
    watch([abaAtual, ferreiroAtivo, filtroCategoria], ([novaAba, temFerreiro, novaCategoria]) => {
        aplicarSegurancaFerreiro(novaAba, temFerreiro, novaCategoria);
    });
    // Quando a página carregar, começa a vigiar o scroll
    // 3. A Varredura Inicial (Monitora assim que a tela abre)
    onMounted(() => {
    // 1. Roda a verificação de segurança inicial (para corrigir bugs ao abrir a aba)
    aplicarSegurancaFerreiro(abaAtual.value, ferreiroAtivo.value, filtroCategoria.value);
    
    // 2. Ativa o ouvinte de Scroll
    window.addEventListener('scroll', verificarScroll);

    // 3. Ativa a proteção contra Múltiplas Abas
    window.addEventListener('storage', protegerMultitarefa);
});
    // Quando sair da página, para de vigiar (para não pesar o navegador)
    onUnmounted(() => {
    // Limpa tudo ao sair para não pesar o navegador
    window.removeEventListener('scroll', verificarScroll);
    window.removeEventListener('storage', protegerMultitarefa);
});

// Calcula os buffs visuais baseado no ferreiro atual
const statsFerreiro = computed(() => {
    // 1. Caso não tenha ferreiro (Retornar o padrão '0')
    if (!ferreiroAtivo.value) {
        return { 
            tempo: 0, 
            falha: 0, 
            poderReal: 0, 
            poderFormatado: '0' // <--- Adicionado para não quebrar o HTML
        };
    }

    const base = ferreiroAtivo.value.poderEspecial || 0;
    const buffRaca = obterBuffRaca(ferreiroAtivo.value);
    const poderReal = base * (1 + (buffRaca / 100));

    // 2. Retorno com os dados calculados
    return {
        poderReal: Math.floor(poderReal), 
        tempo: Math.min(90, Math.floor(poderReal)),
        falha: Math.min(100, Math.floor(poderReal)),
        
        // <--- AQUI ESTÁ A CORREÇÃO:
        // Como no ferreiro o número é inteiro (ex: 20%), usamos toString() ou toFixed(0)
        poderFormatado: Math.floor(poderReal).toString() 
    };
});

// --- LÓGICA DE CRAFT ---

// Calcula o máximo que dá pra fazer com os recursos atuais
const getMaxCraft = (item) => {
    let max = 9999;
    for (const [recurso, qtd] of Object.entries(item.custo)) {
        const estoque = jogo.minerios[recurso] !== undefined ? jogo.minerios[recurso] : (jogo[recurso] || 0);
        const possivel = Math.floor(estoque / qtd);
        if (possivel < max) max = possivel;
    }
    return max;
};

// Função inteligente que valida o que você digita
const validarInputModal = (event, item) => {
    let valor = parseInt(event.target.value);
    const maximo = getMaxCraft(item);

    // Validações básicas
    if (isNaN(valor) || valor < 1) valor = 1;
    // Se quiser limitar ao máximo de recursos, descomente a linha abaixo:
    // if (maximo > 0 && valor > maximo) valor = maximo;

    // ATUALIZA A VARIÁVEL REATIVA (Isso faz o custo mudar na tela)
    qtdModal.value = valor;

    // Força o input a mostrar o número corrigido se necessário
    if (event.target.value != valor) {
        event.target.value = valor;
    }
};

const fabricarItemDaLista = (item) => {
    // Usa a variável qtdModal para saber quantos fazer
    const quantidade = qtdModal.value;
    
    if (quantidade > 0) {
        if (typeof acoes !== 'undefined' && acoes.fabricarItem) {
            acoes.fabricarItem(item, quantidade);
        }
    }
};

// --- FORMATAÇÃO VISUAL ---

// Tempo formatado com redução aplicada
const getTempoCraft = (item, qtd) => {
    const tempoBase = item.tempo * qtd;
    const redutor = statsFerreiro.value ? (statsFerreiro.value.tempo / 100) : 0;
    const final = Math.ceil(tempoBase * (1 - redutor));
    
    // Se for menos de 1 minuto, mostra segundos (ex: 45s)
    if (final < 60) return `${final}s`;

    // Se for menos de 1 hora, mostra minutos e segundos (ex: 59m 30s)
    if (final < 3600) return `${Math.floor(final/60)}m ${final%60}s`;

    // Se for 1 hora ou mais, mostra horas e minutos (ex: 1h03min)
    const h = Math.floor(final / 3600);
    const m = Math.floor((final % 3600) / 60);
    // O 'padStart' garante que o 3 vire '03' para ficar bonito
    return `${h}h${String(m).padStart(2, '0')}min`;
};

// Chance de sucesso (para exibir na lista)
const getChanceSucesso = () => {
    const baseFalha = 15; // 15% Base fixa do jogo
    const redutor = statsFerreiro.value ? statsFerreiro.value.falha : 0;
    const falhaFinal = baseFalha * (1 - (redutor / 100));
    return (100 - falhaFinal).toFixed(1);
};


// Cores de Tier (mesma da Taverna)
</script>

<template>
  <div class="mythic-container">
    
    <div class="header-titulo-aba">
        <div class="titulo-nivel">
            <h2>⚒️ Forja</h2>
        </div>
        <div class="info-nivel">
            <span class="badge-nivel">Nível {{ jogo.ferraria }}</span>
        </div>
    </div>
    <div class="abas-taverna">
        <button :class="{ ativo: abaAtual === 'fabricacao' }" @click="abaAtual = 'fabricacao'">FABRICAÇÃO</button>
        
        <button 
            :class="{ 'ativo': abaAtual === 'aprimoramento', 'bloqueado': !ferreiroAtivo }" 
            @click="abaAtual = 'aprimoramento'"
            :disabled="!ferreiroAtivo"
            :title="!ferreiroAtivo ? 'Requer um Ferreiro contratado (O Ajudante não sabe aprimorar itens)' : ''">
            APRIMORAMENTO <span v-if="!ferreiroAtivo" style="margin-left:5px; font-size: 0.9em;">🔒</span>
        </button>
        
    </div>
    <div v-if="abaAtual === 'fabricacao'">
    <div class="painel-controle-global">
        
<!-- INICIO DO CARD FUNCIONARIO CONTRATADO-->
            <div v-if="ferreiroAtivo" class="card-funcionario funcionario-ativo" :style="{ borderColor: corTier(ferreiroAtivo.tier) }">
                
                <div class="card-topo" :style="{ backgroundColor: corTier(ferreiroAtivo.tier) }">
                    <div class="topo-esquerda">
                        <span class="tier-badge">{{ ferreiroAtivo.tier }}</span>
                        <span class="card-nome">{{ ferreiroAtivo.nome }}</span>
                    </div>
                    
                    <div class="molde-icone-prof">
                        <img src="/assets/ui/i_ferreiro.png" class="img-prof-inner" title="Ferreiro">
                    </div>
                </div>

                <div class="card-mid">
                    <div class="avatar-box">
                         <img :src="`/assets/faces/${ferreiroAtivo.raca}/${ferreiroAtivo.imagem}.png`" class="avatar-func">
                    </div>

                    <div class="tabela-dados-func">
                        <div class="linha-dado">
                            <span class="dado-label">Profissão:</span>
                            <span class="dado-valor">{{ nomeProfissao(ferreiroAtivo) }}</span>
                        </div>
                        <div class="linha-dado">
                            <span class="dado-label">Raça:</span>
                            <span class="dado-valor capitalize">{{ ferreiroAtivo.raca }}</span>
                        </div>
                        <div class="linha-dado">
                            <span class="dado-label">Sexo:</span>
                            <span class="dado-valor">{{ ferreiroAtivo.sexo === 'masculino' ? 'Masculino' : 'Feminino' }}</span>
                        </div>
                        <div class="linha-dado">
                            <span class="dado-label">Salário:</span>
                            <span class="dado-valor">
                                {{ formatarNumero(ferreiroAtivo.salario) }} 
                                <img src="/assets/ui/icone_goldC.png" class="tiny-coin">
                            </span>
                        </div>
                    </div>
                </div>

                <div class="rodape-card">
                    <div class="info-produtividade">
                        Maestria na forja +<span class="verde">{{ statsFerreiro.poderFormatado }}%</span>
                    </div>
                    <div class="frase-efeito">
                        "{{ ferreiroAtivo.frase || 'Curarei os Feridos!' }}"
                    </div>
                </div>
            </div>
<!-- FIM DO CARD FUNCIONARIO CONTRATADO-->
<!-- INICIO DO CARD FUNCIONARIO AJUDANTE-->
            <div v-else class="card-funcionario funcionario-ativo" style="border-color: #95a5a6; opacity: 0.9;">
                
                <div class="card-topo" style="background-color: #95a5a6;">
                    <div class="topo-esquerda">
                        <span class="tier-badge" style="background: rgba(0,0,0,0.2)">-</span>
                        <span class="card-nome">Aprendiz da Vila</span>
                    </div>
                    
                    <div class="molde-icone-prof">
                        <img src="/assets/ui/i_ferreiro.png" class="img-prof-inner" title="Ferreiro Interino" style="filter: grayscale(1);">
                    </div>
                </div>

                <div class="card-mid">
                    <div class="avatar-box">
                         <img src="/assets/faces/humano/ferreiro_m.png" class="avatar-func" style="filter: sepia(0.4);">
                    </div>

                    <div class="tabela-dados-func" style="justify-content: flex-start; align-self: flex-start; margin-top: 5px;">
                        <div class="linha-dado">
                            <span class="dado-label">Profissão:</span>
                            <span class="dado-valor">Ajudante</span>
                        </div>
                        </div>
                </div>

                <div class="rodape-card">
                    <div class="frase-efeito">
                        "Segurando as pontas até o mestre chegar..."
                    </div>
                </div>
            </div>
<!-- FIM DO CARD FUNCIONARIO AJUDANTE-->
            

        <div class="linha-divisoria"></div>

        <div class="lado-direito-filtros">
            <div class="botoes-categoria-wrapper">
                <button 
                    class="btn-cat" 
                    :class="{ 'ativo': filtroCategoria === 'aventureiro' }"
                    @click="filtroCategoria = 'aventureiro'">
                    Aventureiros
                </button>
                <button 
                    class="btn-cat" 
                    :class="{ 'ativo': filtroCategoria === 'heroi', 'bloqueado': !ferreiroAtivo }"
                    :disabled="!ferreiroAtivo"
                    :title="!ferreiroAtivo ? 'Requer um Ferreiro contratado (O Ajudante não sabe forjar itens de Herói)' : ''"
                    @click="filtroCategoria = 'heroi'">
                    Heróis <span v-if="!ferreiroAtivo" style="margin-left:5px; font-size: 0.9em;">🔒</span>
                </button>
            </div>
            
            <fieldset class="input-rpg">
                <legend>Tipo de Item</legend>
                <select v-model="filtroTipo">
                    <option value="todos">Todos</option>
                    <option value="arma">⚔️ Armas</option>
                    <option value="armadura">🛡️ Armaduras</option>
                    <option value="municao">🏹 Munição</option>
                </select>
            </fieldset>

            <fieldset class="input-rpg">
                <legend>Atributo Principal</legend>
                <select v-model="filtroStat">
                    <option value="todos">Qualquer</option>
                    <option value="ataque">Ataque</option>
                    <option value="defesa">Defesa</option>
                    <option value="agilidade">Agilidade</option>
                    <option value="precisao">Precisão</option>
                </select>
            </fieldset>

            <fieldset class="input-rpg">
                <legend>Nível do Item</legend>
                <select v-model="filtroNivel">
                    <option value="todos">Todos</option>
                    <option value="5">Nível 5+</option>
                    <option value="10">Nível 10+</option>
                    <option value="15">Nível 15+</option>
                    <option value="20">Nível 20+</option>
                </select>
            </fieldset>
        </div>
    </div>
    <div class="fila-quadrados-container">
        
        <div v-if="slotFocado !== null" class="mobile-overlay-backdrop" @click="fecharTooltip"></div>

        <div v-if="slotFocado !== null && jogo.craftando[slotFocado]" class="tooltip-progresso" @click.stop>
            
            <button class="btn-fechar-absoluto" @click.stop="fecharTooltip">✖</button>

            <div class="tooltip-seta" :style="{ left: (slotFocado === 0 ? '16%' : (slotFocado === 1 ? '50%' : '84%')) }"></div>

            <div class="tooltip-header">
                <span>{{ (dadosItens.find(i => i.id === jogo.craftando[slotFocado].item) || {}).nome }}</span>
                <small>{{ formatarTempo(jogo.craftando[slotFocado].tempoRestante) }}</small>
            </div>
            
            <div class="barra-fundo-tooltip">
                <div class="barra-fill-tooltip" 
                     :style="{ width: (100 - (jogo.craftando[slotFocado].tempoRestante / jogo.craftando[slotFocado].tempoTotal * 100)) + '%' }">
                </div>
            </div>

            <div class="tooltip-acoes">
                <button class="btn-tooltip cancelar" 
                        @click.stop="acoes.cancelarCraft(slotFocado); fecharTooltip()">
                    Cancelar
                </button>
                
                <button class="btn-tooltip acelerar" 
                        @click.stop="acoes.acelerarCraft(slotFocado); fecharTooltip()">
                    Acelerar
                </button>
            </div>
        </div>


        <div v-for="index in 3" :key="index" class="slot-wrapper-quadrado">
            
            <div v-if="jogo.craftando[index - 1]" 
                 class="quadrado-slot item-ativo"
                 @click.stop="toggleSlot(index - 1)">
                
                <img :src="(dadosItens.find(i => i.id === jogo.craftando[index - 1].item) || {}).img" class="img-slot-pulsante">
            </div>

            <div v-else-if="(index - 1) === 0 || ((index - 1) === 1 && jogo.ferraria >= 3) || ((index - 1) === 2 && jogo.ferraria >= 7)" 
                 class="quadrado-slot vazio"
                 @click="fecharTooltip"> <span class="icone-inativo">⚒️</span>
            </div>

            <div v-else class="quadrado-slot bloqueado" @click="fecharTooltip">
                <span class="icone-inativo">🔒</span>
            </div>

        </div>
    </div>
    <div class="lista-receitas-container">
        
        <div class="header-lista"></div>

        <div v-for="item in itensFiltrados" 
                 :key="item.id" 
                 class="card-light-fixed"
                 :class="{ 'indisponivel': getMaxCraft(item) === 0 }">
                
                <div class="box-img-light">
                    <img :src="item.img" class="img-light-fixa">
                    <div class="nivel-tag">Nv. {{ item.nivelItem || 1 }}</div>
                </div>

                <div class="miolo-light">
                    <div class="header-light">
                        <span class="nome-item-light">{{ item.nome }}</span>
                        <span class="tipo-tag-light">{{ item.tipo }}</span>
                    </div>

                    <div class="container-stats-split">
                        
                        <div class="stats-esquerda">
                            <template v-for="(valor, nomeStat, index) in item.stats" :key="nomeStat">
                                <div v-if="index < 6" class="linha-stat-light">
                                    <template v-if="mapaAtributos[nomeStat]">
                                        <img :src="`/assets/ui/${mapaAtributos[nomeStat].img}`" class="icone-stat-visivel">
                                        <span class="stat-label-light">{{ mapaAtributos[nomeStat].nome }}:</span>
                                        <span class="stat-valor-light">{{ valor }}</span>
                                    </template>
                                </div>
                            </template>
                        </div>

                        <div class="stats-direita">
                            <template v-for="(valor, nomeStat, index) in item.stats" :key="nomeStat">
                                <div v-if="index >= 6" class="linha-stat-light">
                                    <template v-if="mapaAtributos[nomeStat]">
                                        <img :src="`/assets/ui/${mapaAtributos[nomeStat].img}`" class="icone-stat-visivel">
                                        <span class="stat-label-light">{{ mapaAtributos[nomeStat].nome }}:</span>
                                        <span class="stat-valor-light">{{ valor }}</span>
                                    </template>
                                </div>
                            </template>
                        </div>

                    </div>
                    
                    <div v-if="!item.stats" class="desc-light">Sem atributos especiais.</div>
                </div>

                <div class="coluna-botao-light">
                    <button class="btn-forjar-light" @click="abrirForja(item)">
                        FORJAR
                    </button>
                </div>

            </div>

        <div v-if="itemSelecionado" class="modal-overlay" @click.self="fecharForja">
            <div class="modal-content-forja">
                
                <button class="btn-fechar-modal" @click="fecharForja">✖</button>

                <h3 class="modal-titulo">{{ itemSelecionado.nome }}</h3>

                <div class="modal-img-area">
                    <img :src="itemSelecionado.img" class="modal-icon-big">
                    <span class="modal-badge-tipo">{{ itemSelecionado.tipo || 'Item' }}</span>
                </div>

                <div class="modal-stats-area">
                    <template v-if="itemSelecionado.stats">
                        <template v-for="(valor, nomeStat) in itemSelecionado.stats" :key="nomeStat">
                            <div class="modal-stat-row" v-if="mapaAtributos[nomeStat]">
                                <div class="stat-left">
                                    <img :src="`/assets/ui/${mapaAtributos[nomeStat].img}`">
                                    <span>{{ mapaAtributos[nomeStat].nome }}</span>
                                </div>
                                <span class="stat-right">{{ valor }}</span>
                            </div>
                        </template>
                    </template>
                    <div v-else class="modal-desc-text">
                        {{ itemSelecionado.desc }}
                    </div>
                </div>

                <div class="modal-recursos-box">
                    <div class="label-section">RECURSOS NECESSÁRIOS:</div>
                    <div class="modal-lista-custos">
                        <div v-for="(custoBase, recurso) in itemSelecionado.custo" :key="recurso" 
                            class="modal-pill-custo"
                            :class="{ 'falta': (jogo.minerios[recurso]||jogo[recurso]||0) < (custoBase * qtdModal) }">
                            
                            <img :src="`/assets/recursos/min_${recurso}.png`" 
                                @error="$event.target.src = '/assets/recursos/res_' + recurso + '.png'"
                                class="icon-custo-modal">
                            
                            <div class="custo-texto">
                                <span class="custo-nome">{{ recurso }}</span>
                                <span class="custo-val">
                                    {{ (custoBase * qtdModal).toLocaleString('pt-BR') }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-controles-box">
                    <div class="modal-timer">
                        ⏳ {{ getTempoCraft(itemSelecionado, qtdModal) }}
                    </div>

                    
                    <div class="modal-input-group">
                        <button class="btn-max" @click="qtdModal = Math.max(1, getMaxCraft(itemSelecionado))" title="Máximo possível">MAX</button>
                        <button @click="qtdModal > 1 ? qtdModal-- : null">-</button>
                        
                        <input 
                            type="number" 
                            :value="qtdModal" 
                            @input="(e) => validarInputModal(e, itemSelecionado)"
                            @focus="$event.target.select()" 
                            min="1"
                        >
                        
                        <button @click="qtdModal < getMaxCraft(itemSelecionado) ? qtdModal++ : null">+</button>
                    </div>
                </div>

                <button class="btn-forjar-final"
                        :disabled="jogo.craftando.length >= (jogo.ferraria >= 7 ? 3 : (jogo.ferraria >= 3 ? 2 : 1)) || qtdModal < 1 || qtdModal > getMaxCraft(itemSelecionado)"
                        @click="fabricarItemDaLista(itemSelecionado); fecharForja()">
                    🔨 FORJAR AGORA
                </button>

            </div>
        </div>
    </div>
    <!-- Tooltip -->
    <div v-if="tooltipData.visivel" 
          id="tooltip-flutuante"
          class="tooltip-custom"
          :style="{ top: tooltipData.y + 'px', left: tooltipData.x + 'px' }">
        {{ tooltipData.texto }}
    </div>
    </div>
    <div v-if="abaAtual === 'aprimoramento'" class="container-aprimoramento-v2">
    
    <div class="painel-inventario-compacto">
        <div class="topo-filtro-inv">
            <h4 class="titulo-sessao">SEUS ITENS</h4>
            <div class="grade-botoes-filtro">
    <button :class="{ ativo: filtroInv === 'arma' }" @click="filtroInv = 'arma'" title="Armas">⚔️</button>
    <button :class="{ ativo: filtroInv === 'elmo' }" @click="filtroInv = 'elmo'" title="Elmos">🪖</button>
    <button :class="{ ativo: filtroInv === 'armadura' }" @click="filtroInv = 'armadura'" title="Armaduras">👕</button>
    <button :class="{ ativo: filtroInv === 'calca' }" @click="filtroInv = 'calca'" title="Calças">👖</button>
    
    <button :class="{ ativo: filtroInv === 'luva' }" @click="filtroInv = 'luva'" title="Luvas">🧤</button>
    <button :class="{ ativo: filtroInv === 'bota' }" @click="filtroInv = 'bota'" title="Botas">👢</button>
    <button :class="{ ativo: filtroInv === 'anel' }" @click="filtroInv = 'anel'" title="Anéis">💍</button>
    <button :class="{ ativo: filtroInv === 'colar' }" @click="filtroInv = 'colar'" title="Colares">📿</button>
</div>
        </div>

        <div class="lista-itens-scroll-v2">
            <div v-for="(item, index) in inventarioFiltrado" :key="item.uid + '-' + index" 
                class="item-linha-compacta"
                :class="{ 'selecionado': itemParaAprimorar && itemParaAprimorar.uid === item.uid }"
                @click="itemParaAprimorar = item">
                
                <div class="slot-icone-mini" :class="getTierMini(item.nivel)">
                    <img :src="(dadosItens.find(i=>i.id===item.id)||{}).img" class="img-inv-mini">
                </div>
                
                <div class="info-inv-mini">
                    <span class="nome-inv-mini">{{ item.nome }}</span>
                    <span class="nv-inv-mini">Nível +{{ item.nivel }}</span>
                </div>
            </div>
            
            <div v-if="inventarioFiltrado.length === 0" class="empty-state-container">
                <div class="ghost-circle">
                    <span class="ghost-icon">🎒</span>
                </div>
                <h4 class="ghost-title">Mochila Vazia</h4>
                <p class="ghost-desc">Nenhum item desta categoria encontrado.</p>
            </div>
        </div>
    </div>

    <div class="painel-encantamento-foco">
        <div v-if="!itemParaAprimorar" class="estado-espera-centro">
            <div class="big-rune-circle">
                <span class="rune-icon-pulsing">⚒️</span>
            </div>
            <h3 class="wait-title">Mesa de Encantamento</h3>
            <p class="wait-desc">Selecione um equipamento para aprimorar.</p>
        </div>

        <div v-else class="interface-mistica-ativa">
        <div class="moldura-carta-rpg card-vertical-stats">
            
            <div class="topo-imagem-centro" :class="classeBackgroundTier">
                <div class="nivel-flutuante-centro" style="z-index: 5;">+{{ itemParaAprimorar.nivel }}</div>
                
                <div class="botoes-flutuantes-esquerda" style="z-index: 5;">
                    <button v-if="itemParaAprimorar && itemParaAprimorar.nivel >= 5" 
                            class="btn-float-action reciclar" 
                            @click.stop="clicarBotaoReciclar"
                            title="Reciclar em Resíduo (+7 ou superior)">
                        ♻️
                    </button>

                    <button class="btn-float-action lixeira" 
                            @click.stop="clicarBotaoLixeira"
                            title="Jogar Fora">
                        🗑️
                    </button>
                </div>
                <div class="item-flutuante" style="z-index: 5;">
                    <img :src="(dadosItens.find(i=>i.id===itemParaAprimorar.id)||{}).img" class="img-centro-destaque">
                </div>
                <div class="overlay-cor-tier"></div>
            </div>
            

            <div class="divisor-fino"></div>

            <div class="area-stats-dupla">
                <template v-for="(valor, stat) in itemParaAprimorar.stats" :key="stat">
                    <div class="linha-stat-mini">
                        <div class="stat-label-box">
                            <img v-if="mapaAtributos[stat]" :src="`/assets/ui/${mapaAtributos[stat].img}`" class="ico-stat-pp">
                            <span class="lbl-stat">{{ mapaAtributos[stat] ? mapaAtributos[stat].nome : stat }}</span>
                        </div>
                        
                        <div class="stat-val-box">
                            <span class="v-old">{{ valor }}</span>
                            <span class="seta-mini">➜</span>
                            <span class="v-new">{{ valor + 2 }}</span>
                        </div>
                    </div>
                </template>
            </div>
            <div v-if="itemParaAprimorar.atributoInativo" class="box-atributo-especial" 
                 :class="{ 'despertado': itemParaAprimorar.nivel >= 10 }">
                
                <div class="texto-especial">
                    {{ itemParaAprimorar.atributoInativo }}
                </div>
            </div>
            <div v-if="itemParaAprimorar.stats" class="lista-atributos-carta">
   </div>

<div class="selecao-pedras-container">
    <div v-for="pedra in DB_PEDRAS.lista" :key="pedra.id"
         class="btn-pedra-opcao"
         :class="{ 
             'ativo': pedraSelecionada && pedraSelecionada.id === pedra.id,
             'sem-estoque': (jogo[pedra.id] || 0) <= 0
         }"
         @click="pedraSelecionada = pedra">
         
         <img :src="mapaImagensPedras[pedra.id]" class="img-pedra-btn">
         
         <div class="info-pedra-btn">
             <span class="nome-p-btn">{{ pedra.nome }}</span>
             <span class="qtd-p-btn">x{{ jogo[pedra.id] || 0 }}</span>
         </div>
         
         <div class="chance-preview-mini" v-if="itemParaAprimorar.nivel < 10">
             {{ pedra.chances[itemParaAprimorar.nivel] }}%
         </div>
    </div>
</div>
        </div>

        <div class="controles-mistica-row">
    <div class="box-controle-residuo">
        <div class="linha-titulo-unica">
            RESÍDUO DE APRIMORAMENTO
        </div>

        <div class="linha-controles-central">
            <div class="coluna-icone">
                <img :src="imgResiduo" class="img-residuo-fixa">
            </div>
            <div class="coluna-slider">
                <input type="range" v-model.number="qtdPoUsado" min="0" max="10" class="slider-mistico-novo">
                <span class="bonus-tag-fixa">+{{ qtdPoUsado }}%</span>
            </div>
        </div>

        <div class="linha-estoque-footer">
            Disponível: <strong>{{ jogo.poMistico || 0 }}</strong>
        </div>
    </div>

    <div class="box-execucao-final">
        <div class="display-chance" :class="statusChanceClass">
            <span class="num-chance">{{ chanceSucessoAtual.toFixed(0) }}%</span>
        </div>

        <button class="btn-principal-encantar" 
                :disabled="!pedraSelecionada || !itemParaAprimorar || itemParaAprimorar.nivel >= 10" 
                @click="realizarAprimoramento">
            {{ itemParaAprimorar && itemParaAprimorar.nivel >= 10 ? 'ENCANTAR' : 'ENCANTAR' }}
        </button>
        
        <div class="info-custo-fixo" style="text-align: center; font-size: 0.85em; color: #7f8c8d; margin-top: 5px;">
            <template v-if="itemParaAprimorar && itemParaAprimorar.nivel < 10">
                Custo: <strong>3.000</strong> <img src="/assets/ui/icone_goldC.png" style="width: 14px; vertical-align: middle;">
            </template>
            
            <template v-else>
                &nbsp;
            </template>
        </div>
    </div>
</div>
    </div>
    </div>
</div>
    <button v-if="mostrarBotaoTopo"
        class="btn-scroll-topo"
        @click="voltarAoTopo"
        title="Voltar ao Topo">
    ▲
</button>

</div> 
<div v-if="modalRelatorioInterrupcao" class="modal-overlay" style="z-index: 9999;">
        <div class="modal-content-alert">
            
            <div class="alert-header">
                <div class="alert-icon">⚠️</div>
                <h3>Produção Interrompida</h3>
            </div>
            
            <p class="alert-msg">
                O Ferreiro deixou a forja! Os itens complexos não podem ser concluídos pelo Ajudante.
            </p>

            <div class="lista-cancelados-scroll">
                <div v-for="(relatorio, idx) in modalRelatorioInterrupcao" :key="idx" class="card-cancelamento">
                    
                    <div class="cancel-left">
                        <img :src="relatorio.img" class="img-cancelado">
                    </div>

                    <div class="cancel-right">
                        <span class="nome-cancelado">{{ relatorio.nome }}</span>
                        
                        <div class="stats-cancel">
                            <div class="stat-box success" v-if="relatorio.feitos > 0">
                                <span class="lbl">Entregues</span>
                                <span class="val">✅ {{ relatorio.feitos }}</span>
                            </div>
                            <div class="stat-box error">
                                <span class="lbl">Cancelados</span>
                                <span class="val">🚫 {{ relatorio.cancelados }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="alert-footer">
                <small>Recursos dos itens cancelados foram devolvidos (Multa de 10% aplicada).</small>
                <button class="btn-alert-ok" @click="modalRelatorioInterrupcao = null">Entendi</button>
            </div>

        </div>
    </div>
    <div v-if="modalReciclarAberto" class="modal-overlay" style="z-index: 10000;">
        <div class="modal-rpg-confirmacao tema-reciclar">
            
            <div class="modal-header-rpg">
                <h3>♻️ Ritual de Reciclagem</h3>
            </div>

            <div class="modal-body-rpg">
                <p class="aviso-texto">Você está prestes a desencantar este item para extrair sua essência mágica.</p>
                
                <div class="item-preview-modal" :class="classeBackgroundTier">
                    <img :src="(dadosItens.find(i=>i.id===itemParaAprimorar.id)||{}).img" class="img-modal-confirm">
                    
                    <div class="info-modal-item row-center">
                        <span class="nome-modal">{{ itemParaAprimorar.nome }}</span>
                        <span class="box-nivel-destaque">+{{ itemParaAprimorar.nivel }}</span>
                    </div>
                </div>

                <div class="box-ganho-destaque">
                    <span class="label-ganho">Você receberá:</span>
                    <div class="valor-ganho">
                        <img :src="imgResiduo" width="25">
                        <strong>+{{ ganhoPrevistoReciclagem }}</strong> Resíduos
                    </div>
                </div>

                <p class="aviso-final">O item será destruído permanentemente.</p>
            </div>

            <div class="modal-footer-rpg">
                <button class="btn-cancelar-rpg" @click="modalReciclarAberto = false">Cancelar</button>
                <button class="btn-confirmar-rpg btn-roxo" @click="confirmarReciclagem">⚗️ RECICLAR</button>
            </div>
        </div>
    </div>

<div v-if="modalLixeiraAberto" class="modal-overlay" style="z-index: 10000;">
    <div class="modal-rpg-confirmacao tema-lixeira">
        
        <div class="modal-header-rpg alerta">
            <h3>🗑️ Descartar Item</h3>
        </div>

        <div class="modal-body-rpg">
            <p class="aviso-texto">Tem certeza que deseja jogar este item fora? Esta ação não pode ser desfeita.</p>
            
            <div class="item-preview-modal" :class="classeBackgroundTier">
                <img :src="(dadosItens.find(i=>i.id===itemParaAprimorar.id)||{}).img" class="img-modal-confirm">
                <div class="info-modal-item row-center">
                        <span class="nome-modal">{{ itemParaAprimorar.nome }}</span>
                        <span class="box-nivel-destaque">+{{ itemParaAprimorar.nivel }}</span>
                    </div>
            </div>

            <p class="aviso-final perigo">Você NÃO receberá nada em troca.</p>
        </div>

        <div class="modal-footer-rpg">
            <button class="btn-cancelar-rpg" @click="modalLixeiraAberto = false">Manter Item</button>
            <button class="btn-confirmar-rpg btn-vermelho" @click="confirmarLixeira">🔥 DESTRUIR</button>
        </div>
    </div>
</div>
</template>

<style scoped>
@import '../css/importantes.css';
.abas-taverna button.bloqueado {
    opacity: 0.6;
    cursor: not-allowed;
    background: #95a5a6; /* Cinza Concreto */
    color: #ecf0f1;
    border-color: #7f8c8d;
    box-shadow: none;
}

/* Garante que não mude de cor ao passar o mouse se estiver bloqueado */
.abas-taverna button.bloqueado:hover {
    background: #95a5a6;
    transform: none;
    color: #ecf0f1;
}
/* Lista Container */
.lista-receitas-container {
    background: #ecf0f1; border: 1px solid #bdc3c7; border-radius: 8px;
    display: flex; flex-direction: column; height: 80%;
}
.header-lista { display: none; }
.lista-receitas-scroll { 
    overflow-y: auto; 
    flex: 1; 
    padding: 10px; 
    background: #e3e6ea;
    
    /* --- MÁGICA DAS 2 COLUNAS --- */
    display: grid;
    grid-template-columns: 1fr 1fr; /* Cria 2 colunas de tamanho igual */
    gap: 15px; /* Espaço entre os itens (lado e baixo) */
    align-content: start; /* Garante que os itens fiquem no topo */
}
/* ==================================================
   2. ESTILO DO MODAL (Janela Flutuante)
   ================================================== */
.modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 9999;
    display: flex; justify-content: center; align-items: center;
    padding: 20px;
}

.modal-content-forja {
    background: #fff;
    /* Mude width para 95% para deixar uma margem de segurança nas laterais */
    width: 95%; 
    max-width: 400px;
    border-radius: 12px;
    padding: 20px;
    position: relative;
    display: flex; 
    flex-direction: column; 
    gap: 15px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    animation: modalPop 0.3s ease-out;
    max-height: 90vh; 
    overflow-y: auto;
    
    /* IMPORTANTE: Garante que o padding não estoure a largura */
    box-sizing: border-box; 
    margin: auto; /* Centraliza se usar flex no pai */
}
@media(max-width: 480px) {
    /* 1. Remove o padding do fundo escuro no celular para não atrapalhar o cálculo */
    .modal-overlay {
        /* Garante que o container ocupe a tela toda */
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.75);
        z-index: 20000;
        backdrop-filter: blur(3px);
        
        /* O SEGREDO DO CENTRO: Flexbox */
        display: flex !important;
        align-items: center !important;     /* Centro Vertical */
        justify-content: center !important; /* Centro Horizontal */
        padding: 0 !important;              /* Remove padding para não atrapalhar */
    }

    /* 2. Força o modal a ficar centralizado e com tamanho correto */
    .modal-content-forja {
        /* Tamanho */
        width: 85% !important;        /* Deixa uma margem de respiro nas laterais */
        max-width: 380px !important;  /* Não deixa ficar gigante em tablets */
        max-height: 85vh !important;  /* Altura máxima segura */
        
        /* Posição: Removemos 'margin: auto' e deixamos o Flexbox (pai) centralizar */
        margin: 0 !important; 
        
        /* Reset de posições absolutas que possam estar atrapalhando */
        position: relative !important;
        top: auto !important; left: auto !important; 
        right: auto !important; bottom: auto !important;
        transform: none !important;

        /* Visual */
        border-radius: 12px !important;
        padding: 15px !important;
        box-sizing: border-box !important;
    }

    /* 3. Ajustes internos para o conteúdo caber bem */
    .modal-controles-box {
        flex-direction: column;
        gap: 10px;
        text-align: center;
    }

    .modal-input-group {
        justify-content: center; /* Centraliza o contador de +/- */
    }
    .lista-receitas-scroll {
        grid-template-columns: 1fr !important; /* 1 Coluna no celular */
    }
}

@keyframes modalPop {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

.btn-fechar-modal {
    position: absolute; top: 10px; right: 10px;
    background: transparent; border: none; font-size: 1.5em; color: #95a5a6; cursor: pointer;
}

.modal-titulo {
    text-align: center; color: #e67e22; text-transform: uppercase; margin: 0;
    border-bottom: 2px solid #ecf0f1; padding-bottom: 10px;
}

.modal-img-area {
    position: relative;
    display: flex; justify-content: center; background: #ecf0f1;
    border-radius: 8px; padding: 15px; border: 1px solid #bdc3c7;
    margin-bottom: 10px;
    background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url('/assets/ui/bg_ferraria_dark_long.png') !important;

    background-size: 100% 100% !important;

    background-position: center !important;

    background-repeat: no-repeat !important;
}
.modal-badge-tipo {
    position: absolute; top: 5px; right: 18px; top: 10px;
    background: rgba(0,0,0,0.1); font-size: 0.7em; padding: 2px 6px; border-radius: 4px;
    color: #7f8c8d; text-transform: uppercase; font-weight: bold;
}
.modal-stats-area {
    background: #fff;
    border: 1px solid #bdc3c7;
    border-radius: 8px;
    padding: 8px;
    margin-bottom: 10px;
    display: flex; flex-direction: column; gap: 4px;
}
.modal-stat-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9em;
}
.modal-stat-row:nth-child(odd) { background: #f8f9fa; }
.stat-left { display: flex; align-items: center; gap: 8px; color: #555; }
.stat-left img { width: 16px; height: 16px; opacity: 0.8; }
.stat-right { font-weight: bold; color: #2c3e50; }

.modal-desc-text {
    font-style: italic; color: #7f8c8d; text-align: center; padding: 10px; font-size: 0.9em;
}
.modal-icon-big { width: 80px; height: 80px; object-fit: contain; }

.modal-recursos-box {
    background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 10px;
}
.label-section { font-size: 0.75em; font-weight: bold; color: #7f8c8d; margin-bottom: 8px; }

.modal-lista-custos {
    display: flex; flex-direction: column; gap: 8px;
}
.modal-pill-custo {
    display: flex; align-items: center; gap: 10px;
    background: #fff; padding: 8px; border-radius: 6px; border: 1px solid #dee2e6;
}
.modal-pill-custo.falta { border-color: #e74c3c; background: #fadbd8; }

.icon-custo-modal { width: 24px; height: 24px; }
.custo-texto { display: flex; justify-content: space-between; flex: 1; font-size: 0.9em; font-weight: bold; color: #2c3e50; }
.custo-nome { text-transform: capitalize; }

.modal-controles-box {
    display: flex; justify-content: space-between; align-items: center;
    background: #ecf0f1; padding: 10px; border-radius: 8px;
}
.modal-timer { font-weight: bold; color: #7f8c8d; }

.modal-input-group {
    display: flex; background: #fff; border-radius: 6px; border: 1px solid #bdc3c7;
}
.modal-input-group button { width: 35px; height: 35px; border: none; background: transparent; font-weight: bold; cursor: pointer; }
.modal-input-group input {
    width: 70px; /* Aumentei de 50px para caber números maiores (ex: 1000) */
    text-align: center;
    border: none;
    font-weight: bold;
    font-size: 1.1em; /* Texto um pouco maior */
    color: #2c3e50;
    background: #fff; /* Fundo branco para indicar que pode escrever */
    outline: none;
    
    /* Remove as setinhas padrão chatas do input number */
    appearance: textfield;
    -webkit-appearance: textfield; /* Safari / Chrome antigos */
    -moz-appearance: textfield;     /* Firefox antigo */
}

/* Remove setinhas no Chrome/Safari/Edge */
.modal-input-group input::-webkit-outer-spin-button,
.modal-input-group input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* Efeito de foco para saber que está editando */
.modal-input-group input:focus {
    background: #e8f6f3; /* Um verde bem clarinho */
    color: #2c3e50;
}
.btn-forjar-final {
    width: 100%; padding: 15px;
    background: #27ae60; color: white; border: none; border-radius: 8px;
    font-size: 1.1em; font-weight: bold; letter-spacing: 1px; cursor: pointer;
    box-shadow: 0 4px 0 #219150; transition: transform 0.1s;
}
.btn-forjar-final:active { transform: translateY(4px); box-shadow: none; }
.btn-forjar-final:disabled { background: #bdc3c7; box-shadow: none; cursor: not-allowed; }

/* ==================================================
   RESPONSIVIDADE (MOBILE)
   ================================================== */
@media(max-width: 768px) {
    .lista-receitas-scroll {
        grid-template-columns: 1fr; /* No celular, volta para 1 coluna */
    }
}
/* --- ESTILO ATUALIZADO DO CARD DE FUNCIONÁRIO --- */
.icon-prof-topo {
    width: 20px; height: 20px;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
}
/* 1. O cabeçalho precisa ser relative para o ícone se alinhar a ele */

.icon-prof-topo { width: 22px; height: 22px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.5)); }








/* Rodapé Novo */


/* --- ESTILO DO CARD VAZIO (SLOT) --- */


.grayscale { filter: grayscale(100%) opacity(0.6); }


/* Título */
.titulo-filtros { 
    color: #d35400; 
    font-weight: bold; 
    border-bottom: 1px solid #ccc; 
    margin-bottom: 5px; 
    width: 90%; 
    text-align: center;
}

/* --- NOVO ESTILO: FIELDSET RPG --- */
.input-rpg {
    width: 220px;      /* Largura fixa para manter o padrão */
    border: 2px solid #bdc3c7;
    border-radius: 8px;
    padding: 0 10px;
    margin: 0;
    background: #fff;
    /* Reset do padding padrão do navegador */
    margin-inline-start: 0;
    margin-inline-end: 0;
    padding-block-start: 0;
    padding-block-end: 0;
    padding-bottom: 2px; /* Leve respiro embaixo */
    
    transition: border-color 0.2s;
}

.input-rpg:hover {
    border-color: #3498db; /* Muda a cor da borda ao passar o mouse */
}

.input-rpg legend {
    font-size: 0.70em;
    font-weight: 800;      /* Texto bem grosso */
    color: #2c3e50;         /* Cor Laranja do tema */
    padding: 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.input-rpg select {
    width: 100%;
    border: none;
    background: transparent;
    font-weight: 500;
    color: #2c3e50;
    padding: 5px 0;
    outline: none;
    cursor: pointer;
    font-size: 0.80em;
}
.btn-max {
    font-size: 0.7em !important; /* Letra menor */
    background: #b80000df !important; /* Laranja */
    color: #fff !important;
    width: auto !important; /* Largura automática */
    padding: 0 8px !important;
    margin-right: 5px;
    border-right: 1px solid #bdc3c7;
}
/* Container que centraliza os 3 quadrados */
.fila-quadrados-container {
    display: flex;
    justify-content: center; /* Centraliza na Horizontal (Esquerda/Direita) */
    align-items: center;     /* Centraliza na Vertical (Cima/Baixo) - O CORRETOR DO PROBLEMA */
    gap: 40px; 
    margin-bottom: 20px; 
    padding-top: 20px;
    position: relative;
    min-height: 20px; /* Garante altura suficiente para alinhar */
}

/* O Quadrado Base */
.quadrado-slot {
    width: 60px;
    height: 60px;
    margin: 0; /* Adicione isso para garantir que não haja empurrões invisíveis */
    background: #ecf0f1;
    border: 2px solid #bdc3c7;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    position: relative;
    transition: transform 0.2s;
}

/* Ícones Cinza Apagado (Vazio e Bloqueado) */
.icone-inativo {
    font-size: 1.8em;
    filter: grayscale(100%);
    opacity: 0.3; /* Bem apagado como pediu */
}

/* --- ITEM ATIVO (CRAFTANDO) --- */
.quadrado-slot.item-ativo {
    background: linear-gradient(
    to bottom,
    #f8f9fa,
    #e9ecef
  );

  border: 2px solid #ccd1d6;

  box-shadow:
    0 3px 6px rgba(0,0,0,0.08),
    inset 0 1px 0 rgba(255,255,255,0.9);
}

.quadrado-slot.item-ativo:hover {
    transform: scale(1.05);
}

.img-slot-pulsante {
    width: 80%;
    height: 80%;
    object-fit: contain;
    /* Animação de Luz na Imagem */
}

/* --- TOOLTIP (O BALÃO QUE ABRE) --- */
.tooltip-progresso {
    position: absolute;
    bottom: 75px;
    left: 50%;
    transform: translateX(-50%);

    width: 210px;

    background: linear-gradient(
        to bottom,
        #f8f9fb,
        #eef2f6
    );

    color: #2c3e50;
    padding: 12px;

    border-radius: 14px;
    border: 1px solid #d5dde5;

    box-shadow:
        0 6px 16px rgba(0,0,0,0.12),
        inset 0 1px 0 rgba(255,255,255,0.8);

    z-index: 100;

    display: flex;
    flex-direction: column;
    gap: 8px;

    animation: slideUp 0.2s ease-out;
}

/* Setinha */
.tooltip-seta {
    position: absolute;
    bottom: -7px;
    left: 50%;
    transform: translateX(-50%);

    width: 0;
    height: 0;

    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-top: 7px solid #eef2f6;
}

/* Header */
.tooltip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    font-size: 0.78em;
    font-weight: 600;
    color: #2c3e50;
}

/* Barra */
.barra-fundo-tooltip {
    width: 100%;
    height: 7px;

    background: #dfe6ee;
    border-radius: 4px;
    overflow: hidden;
}

.barra-fill-tooltip {
    height: 100%;
    background: linear-gradient(
        to right,
        #f39c12,
        #ffb84d
    );

    border-radius: 4px;
    transition: width 1s linear;
}

/* Ações */
.tooltip-acoes {
    display: flex;
    gap: 6px;
    margin-top: 6px;
}

/* Botões */
.btn-tooltip {
    flex: 1;
    border: none;

    padding: 5px 6px;
    border-radius: 6px;

    font-size: 0.72em;
    font-weight: 600;

    cursor: pointer;

    background: #e9edf2;
    color: #2c3e50;

    box-shadow: inset 0 -2px 0 rgba(0,0,0,0.12);
}

.btn-tooltip.cancelar {
    background: #f2dede;
    color: #a94442;
}

.btn-tooltip.acelerar {
    background: #fde9c9;
    color: #9c5a00;
}


/* --- ANIMAÇÕES SUTIS --- */
@keyframes luzInterna {
    0% { filter: drop-shadow(0 0 0px rgba(230, 126, 34, 0)); opacity: 0.9; }
    50% { filter: drop-shadow(0 0 8px rgba(230, 126, 34, 0.6)); opacity: 1; }
    100% { filter: drop-shadow(0 0 0px rgba(230, 126, 34, 0)); opacity: 0.9; }
}

@keyframes bordaPulsante {
    0% { box-shadow: 0 0 0 rgba(230, 126, 34, 0); }
    50% { box-shadow: 0 0 10px rgba(230, 126, 34, 0.3); } /* Brilho laranja muito leve */
    100% { box-shadow: 0 0 0 rgba(230, 126, 34, 0); }
}

@keyframes slideUp {
    from { opacity: 0; transform: translate(-50%, 10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}
/* Botão de Fechar (X) - Invisível no PC, Visível no Mobile */
.btn-fechar-absoluto {
    display: none; /* Escondido por padrão */
}
.mobile-overlay-backdrop {
    display: none; /* Escondido por padrão */
}

/* =========================================================
   AJUSTES PARA CELULAR (Mobile) - VERSÃO CORRIGIDA
   ========================================================= */
@media (max-width: 600px) {

    /* 1. Cortina Escura de Fundo */
    .mobile-overlay-backdrop {
        display: block;
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.8);
        z-index: 9998;
        backdrop-filter: blur(2px);
    }
    .area-stats-dupla { 
        gap: 5px 5px !important; 
        padding: 10px 6px !important;
    }

    /* 2. A Janela Centralizada (COM FORÇA TOTAL) */
    .tooltip-progresso {
        /* Muda de Absolute (PC) para Fixed (Celular) */
        position: fixed !important; 
        
        /* Zera o posicionamento antigo do PC */
        margin: 0 !important;
        
        /* Força o Centro da Tela */
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        
        /* Tamanho e Visual */
        width: 80vw !important;
        max-width: 320px !important;
        background: #2c3e50;
        z-index: 9999;
        padding: 25px 20px;
        border: 2px solid #34495e;
        box-shadow: 0 0 30px rgba(0,0,0,0.8);
        
        /* Garante que os botões caibam */
        display: flex;
        flex-direction: column;
    }

    /* 3. Botão Fechar (X) - Fica Grande */
    .btn-fechar-absoluto {
        display: block;
        position: absolute;
        top: -15px;
        right: -10px;
        background: #c0392b;
        color: white;
        border: 3px solid #fff;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-weight: bold;
        font-size: 1.2em;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }

    /* 4. Botões de Ação (Cancelar/Acelerar) */
    .tooltip-acoes {
        display: flex;
        flex-direction: column; /* Um embaixo do outro */
        gap: 12px;
        margin-top: 20px;
    }

    .btn-tooltip {
        padding: 15px; /* Botão Gordinho para o dedo */
        font-size: 1.1rem;
        width: 100%;
    }

    /* Esconde a setinha no mobile pois a janela flutua no meio */
    .tooltip-seta { display: none !important; }
    
    /* Aumenta letra do título */
    .tooltip-header { font-size: 1.3rem; margin-bottom: 15px; text-align: center; }
}
/* --- ESTILO V7: GRID 3 COLUNAS (COMPACTO) --- */
/* Ajuste do Container da Lista */
.lista-receitas-scroll {
    display: flex !important;
    flex-direction: column !important;
    gap: 15px !important;
    padding: 15px !important;
    background: #e3e6ea !important; 
    border: 1px solid #bdc3c7;
    border-radius: 8px;
}

/* O CARTÃO (Base) */
.card-light-fixed {
    display: flex;
    align-items: stretch;
    
    /* ALTURA: 150px é perfeito para 3 linhas de atributos (3x3 = 9 stats) */
    height: 150px; 
    
    background: #f7f9fa;
    border: 1px solid #b2bec3;
    border-radius: 8px;
    box-shadow: 0 3px 6px rgba(0,0,0,0.08);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
}

.card-light-fixed:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
    border-color: #7f8c8d;
}

.card-light-fixed.indisponivel {
    opacity: 0.6;
    filter: grayscale(1);
    background: #e0e0e0;
}

/* 1. CAIXA DE IMAGEM (Esquerda) */
.box-img-light {
    width: 115px;
    min-width: 115px;
    
    /* --- SUA IMAGEM DE VOLTA --- */
    /* Adicionei um leve escurecimento (rgba) por cima da imagem para garantir leitura */
    background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url('/assets/ui/bg_ferraria_dark.png') !important;
    background-size: 100% 100% !important;
    background-position: center !important;
    background-repeat: no-repeat !important;
    
    /* Fallback (cor de segurança se a imagem falhar) */
    background-color: #2d3436; 
    
    border-right: 1px solid #b2bec3;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.img-light-fixa {
    max-width: 85%;
    max-height: 85%;
    object-fit: contain;
    
    /* O SEGREDO DO CONTRASTE: */
    /* 1. Luz branca suave atrás (0 0 5px rgba...) */
    /* 2. Sombra escura forte para dar volume (0 4px 6px...) */
    filter: drop-shadow(0 0 4px rgba(255,255,255,0.2)) drop-shadow(0 4px 6px rgba(0,0,0,0.8));
    
    transition: transform 0.2s;
}

/* Efeito extra: Item cresce um pouquinho ao passar o mouse no card */
.card-light-fixed:hover .img-light-fixa {
    transform: scale(1.05) translateY(-2px);
}

.nivel-tag {
    position: absolute;
    bottom: 5px; right: 5px;
    background: #2d3436;
    color: #dfe6e9;
    font-size: 0.65em;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 4px;
    box-shadow: 0 2px 2px rgba(0,0,0,0.2);
}

/* 2. MIOLO (Centro) */
.miolo-light {
    flex: 1;
    padding: 10px 15px;
    display: flex;
    flex-direction: column;
    overflow: hidden; 
}

.header-light {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
    border-bottom: 2px solid #dfe6e9;
    padding-bottom: 5px;
}

.nome-item-light {
    font-size: 1.05em;
    font-weight: 800;
    color: #2d3436;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tipo-tag-light {
    font-size: 0.65em;
    color: #636e72;
    font-weight: bold;
    text-transform: uppercase;
    background: #dfe6e9;
    padding: 3px 8px;
    border-radius: 12px;
}



.desc-light {
    font-size: 0.75em; color: #aaa; font-style: italic; margin-top: 10px;
}

/* 3. COLUNA DO BOTÃO (Direita) */
.coluna-botao-light {
    width: 100px;
    display: flex;
    flex-direction: column;
    background: #2d3436;
    border-left: 1px solid #636e72;
}

.btn-forjar-light {
    flex: 1;
    width: 100%;
    border: none;
    background: #2d3436;
    color: #ecf0f1;
    font-weight: 900;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.85em;
    letter-spacing: 1px;
    display: flex; align-items: center; justify-content: center;
}

.btn-forjar-light:hover {
    background: #00b894;
    color: #fff;
}

.btn-forjar-light:active {
    background: #00cec9;
}
/* Container que segura os dois blocos */
.container-stats-split {
    display: flex;
    width: 100%;
    /* Removemos o gap do container para controlar espaçamento internamente */
    gap: 0; 
    overflow: hidden;
}

/* BLOCO 1: Esquerda (2 Colunas) - Onde ficam 1 a 6 */
.stats-esquerda {
    flex: 2; /* Ocupa 66% da largura */
    display: grid;
    grid-template-columns: 1fr 1fr; 
    grid-auto-rows: min-content; 
    
    /* Espaçamento interno para não colar na direita */
    padding-right: 10px; 
    gap: 0 10px; /* Espaço horizontal entre coluna 1 e 2 */
}

/* BLOCO 2: Direita (1 Coluna) - Onde ficam 7, 8, 9 */
.stats-direita {
    flex: 1; /* Ocupa 33% da largura */
    display: flex;
    flex-direction: column;
    
    /* REMOVIDO: border-left (a linha que separava) */
    /* Adicionado padding para alinhar visualmente como uma 3ª coluna */
    padding-left: 5px; 
}

/* Estilo das linhas individuais (Mantido Igual) */
.linha-stat-light {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75em;
    color: #2d3436;
    
    /* ALTURA FIXA: Crucial para o alinhamento 1-2-7 funcionar */
    height: 25px; 
    
    /* MUDANÇA AQUI: "dashed" para tracejado e "0.15" para ficar mais visível */
    border-bottom: 1px dashed rgba(0,0,0,0.15); 
    white-space: nowrap;
}

.icone-stat-visivel {
    width: 14px; height: 14px; object-fit: contain; opacity: 0.8;
}

.stat-label-light { 
    font-weight: 600; 
    color: #636e72; 
    overflow: hidden;
    text-overflow: ellipsis;
    /* Ajuste para caber bem na coluna */
    max-width: 75px; 
}

.stat-valor-light { 
    font-weight: 800; 
    color: #0984e3; 
    margin-left: auto; 
}

/* --- AJUSTES MOBILE --- */
@media(max-width: 600px) {
    .lista-receitas-scroll { gap: 25px !important; }

    .card-light-fixed { 
        height: auto; 
        flex-direction: column;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15); 
    }

    .box-img-light { width: 100%; height: 100px; border-right: none; border-bottom: 1px solid #b2bec3; 
    
    /* Adicionei um leve escurecimento (rgba) por cima da imagem para garantir leitura */
    background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url('/assets/ui/bg_ferraria_dark_long.png') !important;
    background-size: 100% 100% !important;
    background-position: center !important; 
    background-repeat: no-repeat !important;
}
    
    .miolo-light { min-height: 100px; }

    .coluna-botao-light { 
        width: 100%; height: 55px; border-left: none; border-top: 1px solid #b2bec3;
        padding: 5px; background: #ecf0f1; 
    }

    .btn-forjar-light {
        border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
    }
    .container-stats-split { flex-direction: column; }
    .stats-esquerda { padding-right: 0; }
    .stats-direita { padding-left: 0; margin-top: 5px; border-top: 1px dashed #ccc; }
}
h4 { 
    margin: 0 0 5px 0; 
    font-size: 0.75em; 
    text-transform: uppercase; 
    letter-spacing: 1px; 
    text-align: center; 
    width: 100%; 
}
/* Container dos botões Aventureiro/Heroi */
.botoes-categoria-wrapper {
    display: flex;
    gap: 10px;
    margin-bottom: 15px; /* Espaço para os filtros de baixo */
    width: 80%;
    justify-content: center;
}

/* --- OPÇÃO 1: PLACA DE METAL (Rústico) --- */
.btn-cat {
    flex: 1;
    padding: 6px 4px;
    /* Degradê suave de branco para azul gelo */
    background: linear-gradient(to bottom, #ffffff, #eaf2f8);
    border: 1px solid #b1b6b9;
    border-radius: 20px; /* Bordas bem redondas (pílula) */
    color: #85929e;
    font-weight: 600;
    font-size: 0.75em;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-cat:hover {
    background: #eaf2f8;
    color: #2e86c1;
}

.btn-cat.ativo {
    background: #3498db;
    border-color: #2980b9;
    color: white;
    /* Remove a redondeza ao ativar ou mantém? Vamos manter */
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); /* Parece "apertado" para dentro */
}
.btn-cat:disabled {
    cursor: not-allowed !important; /* O !important garante que o ponteiro mude */
    opacity: 0.5;
    background: #bdc3c7;
    border-color: #95a5a6;
    color: #7f8c8d;
    box-shadow: none;
}
/* --- ESTILO DO MODAL DE ALERTA --- */
.modal-content-alert {
    background: #fff;
    width: 90%;
    max-width: 380px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    animation: modalPop 0.3s ease-out;
    display: flex; flex-direction: column;
}

.alert-header {
    background: #e74c3c; /* Vermelho Alerta */
    color: white;
    padding: 15px;
    display: flex; align-items: center; gap: 10px;
}
.alert-icon { font-size: 1.5em; }
.alert-header h3 { margin: 0; font-size: 1.1em; text-transform: uppercase; letter-spacing: 0.5px; }

.alert-msg {
    padding: 15px 15px 5px 15px;
    color: #7f8c8d;
    font-size: 0.9em;
    text-align: center;
    line-height: 1.4;
}

/* Lista de Itens */
.lista-cancelados-scroll {
    padding: 10px 15px;
    max-height: 250px;
    overflow-y: auto;
    display: flex; flex-direction: column; gap: 10px;
}

.card-cancelamento {
    display: flex;
    background: #fdfefe;
    border: 1px solid #ecf0f1;
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.img-cancelado {
    width: 50px; height: 50px;
    object-fit: contain;
    background: #ecf0f1;
    border-radius: 4px;
    border: 1px solid #bdc3c7;
}

.cancel-right {
    flex: 1; margin-left: 10px;
    display: flex; flex-direction: column; justify-content: center;
}

.nome-cancelado {
    font-weight: bold; color: #2c3e50; font-size: 0.9em; margin-bottom: 5px;
}

.stats-cancel { display: flex; gap: 10px; }

.stat-box {
    display: flex; flex-direction: column;
    font-size: 0.75em;
    background: #f4f6f7;
    padding: 3px 6px;
    border-radius: 4px;
}
.stat-box.success .val { color: #27ae60; font-weight: bold; font-size: 1.1em; }
.stat-box.error .val { color: #c0392b; font-weight: bold; font-size: 1.1em; }

.alert-footer {
    background: #f9f9f9;
    padding: 15px;
    text-align: center;
    border-top: 1px solid #ecf0f1;
}
.alert-footer small { display: block; color: #95a5a6; margin-bottom: 10px; font-size: 0.75em; }

.btn-alert-ok {
    background: #34495e;
    color: white;
    border: none;
    padding: 10px 30px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
}
.btn-alert-ok:hover { background: #2c3e50; }
@keyframes pulseGlow { 0% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.5; transform: scale(0.9); } }
@keyframes pulseBar { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
/* --- ESTILO CARTA MÍSTICA --- */


.topo-carta {
    padding: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8f9fa;
}

.raridade-label { font-size: 0.6em; font-weight: 800; color: #b2bec3; letter-spacing: 1px; }

.cristal-nivel {
    background: #8e44ad;
    color: white;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 0.8em;
    font-weight: bold;
    box-shadow: 0 0 10px rgba(142, 68, 173, 0.4);
}

/* 2. Área da Imagem */
.imagem-carta-foco {
    height: 160px;
    background: radial-gradient(circle, #fdfbfb 0%, #ebedee 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border-bottom: 2px solid #f1f2f6;
}

.aura-magica {
    position: absolute;
    width: 100px; height: 100px;
    background: #9b59b6;
    filter: blur(40px);
    opacity: 0.15;
    animation: pulsarAura 3s infinite alternate;
}

@keyframes pulsarAura { from { transform: scale(1); opacity: 0.1; } to { transform: scale(1.3); opacity: 0.2; } }

.img-carta { width: 100px; height: 100px; object-fit: contain; z-index: 2; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1)); }

/* 3. Corpo da Carta */
.corpo-carta { padding: 15px; text-align: center; flex-grow: 1; }

.titulo-carta { margin: 0; color: #2d3436; font-size: 1.1em; font-family: 'Georgia', serif; }

.divisor-ornado {
    height: 1px;
    background: linear-gradient(to right, transparent, #dcdde1, transparent);
    margin: 10px 0;
}

.lista-atributos-carta { display: flex; flex-direction: column; gap: 5px; }

.atributo-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.8em;
    color: #636e72;
    padding: 3px 0;
    border-bottom: 1px solid #f8f9fa;
}

.at-nome { text-transform: uppercase; font-weight: bold; font-size: 0.8em; }
.at-valor { color: #2d3436; font-weight: bold; }
.upgrade-ghost { color: #27ae60; font-size: 0.9em; margin-left: 5px; opacity: 0.8; }

/* Container que divide Esquerda e Direita */
.container-aprimoramento-v2 {
    display: flex;
    gap: 15px;
    height: auto;
    min-height: 450px;    /* ...mas nunca fica menor que 500px... */
    max-height: 77vh;     /* ...E NUNCA fica maior que 80% da altura da tela (Trava o infinito) */
    background: #ecf0f1;
    border-radius: 12px;
    padding: 15px;
    border: 1px solid #bdc3c7;

}

/* Painel Esquerdo (Inventário) */
.painel-inventario-compacto {
    width: 250px;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #dcdde1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.topo-filtro-inv { padding: 10px; background: #f8f9fa; border-bottom: 1px solid #eee; }
.titulo-sessao { font-size: 0.7em; margin-bottom: 8px; color: #7f8c8d; text-align: left; }
.grade-botoes-filtro {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important; /* Força 4 colunas */
    gap: 6px !important; /* Espaço entre os botões */
    padding: 5px 0 !important;
}

.grade-botoes-filtro button {
    aspect-ratio: 1 / 1; /* Garante que os botões sejam quadrados perfeitos */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1em;
    border: 1px solid #dcdde1;
    background: #fff;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.grade-botoes-filtro button.ativo {
    background: #8e44ad;
    color: #fff;
    border-color: #8e44ad;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}
.lista-itens-scroll-v2 { flex: 1; overflow-y: auto; padding: 1px; min-height: 0; }
.item-linha-compacta {
    display: flex; align-items: center; gap: 5px; padding: 4px;
    border-radius: 6px; cursor: pointer; border: 1px solid transparent; margin-bottom: 4px;
}
.item-linha-compacta:hover { background: #f1f2f6; }
.item-linha-compacta.selecionado { background: #f4ecf7; border-color: #5c44ad; }

.slot-icone-mini { width: 37px; height: 37px; background: #eee; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.img-inv-mini { width: 30px; height: 30px; object-fit: contain; }
.info-inv-mini { display: flex; flex-direction: column; }
.nome-inv-mini { font-size: 0.75em; font-weight: bold; color: #2d3436; }
.nv-inv-mini { font-size: 0.65em; color: #8e44ad; font-weight: bold; }

/* Painel Direito (Foco) */

.painel-encantamento-foco { 
    flex: 1; 
    background: #fff; 
    border-radius: 8px; 
    border: 1px solid #dcdde1; 
    
    display: flex; 
    /* MUDANÇA AQUI: Alinhamento vertical e horizontal total */
    flex-direction: column;
    align-items: center;     /* Centro Horizontal */
    justify-content: flex-start;  /* Início Vertical */
    
    position: relative; 
    min-height: 500px; /* Garante altura para ter onde centralizar */
    padding-top: 0px;
}
/* --- ESTADO DE ESPERA (DIREITA) --- */
.estado-espera-centro {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0.6; /* Deixa sutil */
    animation: fadeInSuave 0.5s ease;
    padding-top: 145px;
    
}

.big-rune-circle {
    width: 100px;
    height: 100px;
    background: #fdfdfd;
    border: 4px solid #ecf0f1;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    box-shadow: 0 0 20px rgba(0,0,0,0.03);
}

.rune-icon-pulsing {
    font-size: 3.5em;
    filter: grayscale(1);
    opacity: 0.4;
    animation: pulsarRuna 3s infinite ease-in-out;
}

.wait-title {
    margin: 0;
    font-size: 1.1em;
    font-weight: 800;
    color: #95a5a6;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.wait-desc {
    margin: 8px 0 0 0;
    font-size: 0.85em;
    color: #bdc3c7;
}

@keyframes pulsarRuna {
    0% { transform: scale(1); opacity: 0.4; }
    50% { transform: scale(1.05); opacity: 0.6; }
    100% { transform: scale(1); opacity: 0.4; }
}

@keyframes fadeInSuave {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 0.6; transform: translateY(0); }
}
.estado-espera { text-align: center; color: #bdc3c7; }
.icone-espera { font-size: 4em; display: block; opacity: 0.3; }

/* Interface de Encantamento Ativa */
.interface-mistica-ativa {
    display: flex;
    flex-direction: column; /* FORÇA COLUNA NO DESKTOP */
    align-items: center;    /* CENTRALIZA TUDO */
    gap: 20px;
    padding: 20px;
    width: 100%;
    box-sizing: border-box;
    /* Removemos qualquer configuração que forçava "lado a lado" */
}
/* Reuso do Estilo Carta Mistica */
.moldura-carta-rpg {
    display: flex;
    flex-direction: column !important; /* Força vertical */
    width: 100%;
    max-width: 480px; /* Um pouco mais largo para caber 3 colunas de números */
    background: #fff;
    border: 1px solid #bdc3c7;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
    overflow: hidden;
    flex-shrink: 0;
}
.img-centro-destaque {
    width: 100px; height: 100px;
    object-fit: contain;
    filter: drop-shadow(0 5px 5px rgba(0, 0, 0, 0.5));
    transition: transform 0.3s;
}
.moldura-carta-rpg:hover .img-centro-destaque { transform: scale(1.1); }
.info-titulo-centro { text-align: center; margin-top: 10px; }

.barra-nome-item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px; /* Espaço entre texto e linhas */
    padding: 5px 0; /* Altura mínima */
}

/* Cria as linhas antes e depois do texto automaticamente */
.barra-nome-item::before,
.barra-nome-item::after {
    content: "";
    height: 1px;
    flex-grow: 1; /* Ocupa o espaço restante */
    background: linear-gradient(90deg, transparent, #bdc3c7, transparent); /* Linha que "some" nas pontas */
}
.titulo-centro {
    font-family: 'Averia Bold', serif;
    margin: 0;
    font-size: 1.1em;
    color: #2c3e50;
    text-transform: uppercase;
    font-weight: 800;
    line-height: 1; /* Garante que a linha de texto não fique alta */
}

.badge-tipo-centro {
    font-size: 0.7em; background: rgba(0,0,0,0.1); color: #555;
    padding: 2px 8px; border-radius: 10px; font-weight: bold; text-transform: uppercase;
}

.divisor-fino { height: 1px; background: #ecf0f1; width: 100%; }

/* Bloco Direito: Ocupa 33% e tem 1 coluna interna */
.coluna-simples-direita {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.area-stats-dupla {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Duas colunas iguais */
    gap: 8px 20px; /* Espaço vertical 8px, horizontal 20px */
    padding: 15px;
    background: #fdfdfd;
    border-top: 1px solid #f1f2f6;
}

/* Mantemos o estilo da linha igual, pois estava bom */
.linha-stat-mini {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8em; /* Tamanho confortável */
    border-bottom: 1px dotted #eee;
    padding-bottom: 3px;
}

.stat-label-box { display: flex; align-items: center; gap: 6px; overflow: hidden; }
.ico-stat-pp { width: 14px; height: 14px; opacity: 0.8; }
.lbl-stat { font-weight: 600; color: #7f8c8d; white-space: nowrap; text-transform: capitalize; }

.stat-val-box { display: flex; align-items: center; gap: 4px; margin-left: auto; }
.v-old { color: #2c3e50; font-weight: bold; }
.seta-mini { color: #bdc3c7; font-size: 0.8em; }
.v-new { color: #27ae60; font-weight: 800; }
.topo-imagem-centro {
    background: url('/assets/ui/bg-mythicVillage3.png');
    background-size: cover;
    background-position: center;
    height: 180px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    transition: all 0.5s ease;
}

/* Ajuste no Overlay para focar no centro */
.overlay-cor-tier {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 1;
    pointer-events: none;
    
    /* MUDANÇA: 'plus-lighter' ou 'screen' faz a cor somar luz, 
       criando um efeito de brilho intenso, não de tinta. */
    mix-blend-mode: screen; 
    opacity: 1; /* Opacidade alta pois o gradiente controla a suavidade */
    transition: background 0.5s ease;
}
/* TIER 1: COMUM (+0 a +4) - Apenas clareia um pouco */
.topo-imagem-centro.bg-tier-comum .overlay-cor-tier {
    background: rgba(255, 255, 255, 0.5);
    mix-blend-mode: multiply;
}
.topo-imagem-centro.bg-tier-comum {
    border-bottom: 2px solid #000000;
}

/* TIER 2: RARO (+5 a +7) - Roxo (Sua referência exata) */
.topo-imagem-centro.bg-tier-raro .overlay-cor-tier {
    background: rgba(174, 0, 255, 0.40);
    mix-blend-mode: multiply;
}
.topo-imagem-centro.bg-tier-raro {
    border-bottom: 2px solid #ae00ff;
}

/* TIER 3: LENDÁRIO (+8 a +9) - Dourado Intenso */
.topo-imagem-centro.bg-tier-lendario .overlay-cor-tier {
    background: #fff200f2;
    mix-blend-mode: multiply;
}
.topo-imagem-centro.bg-tier-lendario {
    border-bottom: 2px solid rgba(255, 242, 0, 1);
}
/* TIER 4: MÍTICO (+10) - Ciano Neon */
.topo-imagem-centro.bg-tier-mitico .overlay-cor-tier {
    background: rgba(0, 225, 255, 0.50);
    mix-blend-mode: multiply;
}


.topo-imagem-centro.bg-tier-mitico {
    border-bottom: 2px solid #00ffff;
}
/* Padrão (Cinza Claro) */
.mini-tier-comum {
    background: #ecf0f1;
    border: 1px solid #bdc3c7;
}

/* Raro (+5 a +7) - Roxo Suave */
.mini-tier-raro {
    background: linear-gradient(135deg, #e1bee7, #d1c4e9);
    border: 1px solid #9b59b6;
    box-shadow: inset 0 0 5px rgba(155, 89, 182, 0.2);
}

/* Lendário (+8 a +9) - Dourado Pálido */
.mini-tier-lendario {
    background: linear-gradient(135deg, #fff9c4, #ffecb3);
    border: 1px solid #f1c40f;
    box-shadow: inset 0 0 5px rgba(241, 196, 15, 0.3);
}

/* Mítico (+10) - Ciano/Azul Neon Suave */
.mini-tier-mitico {
    background: linear-gradient(135deg, #e0f7fa, #b2ebf2);
    border: 1px solid #00cec9;
    box-shadow: 0 0 5px rgba(0, 206, 201, 0.4); /* Brilho externo */
}
.nivel-flutuante-centro {
    position: absolute; top: 10px; left: 10px;
    background: #4d4d4d; color: #fff; font-weight: bold;
    padding: 2px 8px; border-radius: 4px; font-size: 0.8em;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
.botoes-flutuantes-esquerda {
    position: absolute;
    top: 40px; /* Distância do topo (Logo abaixo do badge de Nível) */
    left: 10px; /* Alinhado à esquerda igual ao badge */
    display: flex;
    flex-direction: column; /* Um embaixo do outro */
    gap: 8px; /* Espaço entre os botões */
    z-index: 10;
}

/* Estilo Base dos Botões Redondos */
.btn-float-action {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.4);
    background: rgba(0, 0, 0, 0.5); /* Fundo escuro transparente */
    color: #fff;
    font-size: 1.1em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(2px);
    padding: 0;
}

/* Efeito ao passar o mouse */
.btn-float-action:hover {
    transform: scale(1.15);
    border-color: #fff;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

/* Cores específicas no Hover */
.btn-float-action.reciclar:hover {
    background: #27ae60; /* Verde ao focar */
}

.btn-float-action.lixeira:hover {
    background: #c0392b; /* Vermelho ao focar */
}
.box-direita-info {
    flex: 1;
    padding: 12px 15px;
    display: flex;
    flex-direction: column;
    background: #fdfdfd;
}

.cabecalho-novo {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.titulo-novo {
    margin: 0;
    font-size: 1.1em;
    color: #2c3e50;
    text-transform: uppercase;
    font-weight: 800;
}

.tag-tipo-novo {
    font-size: 0.7em;
    background: #ecf0f1;
    color: #7f8c8d;
    padding: 3px 8px;
    border-radius: 12px;
    font-weight: bold;
    text-transform: uppercase;
}


/* --- O GRID MÁGICO (4 LINHAS x 2 COLUNAS) --- */
.grid-stats-novo {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Duas colunas iguais */
    grid-auto-rows: auto;          /* Linhas automáticas */
    gap: 5px 15px;                 /* Espaço vertical 5px, horizontal 15px */
}

.celula-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8em;
    border-bottom: 1px dashed #e0e0e0;
    padding-bottom: 2px;
}

.stat-nome-box {
    display: flex; align-items: center; gap: 5px; color: #555;
}
.icon-stat-mini { width: 14px; height: 14px; opacity: 0.7; }
.texto-stat { font-weight: 600; text-transform: capitalize; }

.stat-valores-box {
    font-weight: bold; color: #2c3e50; display: flex; gap: 5px;
}
.seta-up { color: #ccc; font-size: 0.8em; }
.v-novo { color: #27ae60; } /* Verde para o valor novo */

.box-esquerda-img {
    width: 140px; /* Largura fixa da imagem */
    min-width: 140px;
    background-size: cover;
    background-position: center;
    border-right: 1px solid #bdc3c7;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}
.img-destaque-nova {
    width: 80%;
    height: 80%;
    object-fit: contain;
    filter: drop-shadow(0 5px 5px rgba(0,0,0,0.5));
    transition: transform 0.3s;
}
.imagem-carta-foco { height: 110px; background: #f8f9fa; display: flex; align-items: center; justify-content: center; }
.img-carta { width: 100px; }
.corpo-carta { padding: 10px; text-align: center; }
.titulo-carta { font-size: 1em; }
.up-val { color: #27ae60; font-size: 0.85em; }

/* Controles Laterais */
.controles-mistica-row {
    display: flex;
    gap: 12px;
    padding: 10px 15px; /* Reduzido o padding vertical de 15px para 10px */
    background: #f1f2f6;
    border-radius: 12px;
    border: 1px solid #dcdde1;
    margin-top: 5px; /* Reduzido de 15px para 5px para subir a box */
    align-items: stretch; /* Garante que as boxes internas tenham a mesma altura */
}

/* Bloco do Resíduo - Aumentando o preenchimento interno */
.box-controle-residuo {
    flex: 1.5;
    background: #fff;
    padding: 12px 15px;
    border-radius: 10px;
    border: 1px solid #dfe4ea;
    display: flex;
    flex-direction: column;
    /* Altura fixa impede que a box cresça para baixo */
    height: 115px; 
    box-sizing: border-box;
}

/* Linha 1: Título Centralizado ou à Esquerda */
.linha-titulo-unica {
    font-size: 0.75em;
    font-weight: 800;
    color: #2c3e50;
    text-transform: uppercase;
    margin-bottom: 5px;
    /* Impede que o texto quebre ou mude a altura */
    white-space: nowrap; 
}
/* Alinhamento da Imagem com o Texto */
.info-item-superior {
    display: flex;
    align-items: center;
    gap: 12px;
}
.img-residuo-destaque {
    width: 38px; /* Aumentado para dar destaque */
    height: 38px;
    object-fit: contain;
    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.1));
}
.bloco-texto {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
}

.label-titulo {
    font-size: 0.85em;
    font-weight: 800;
    color: #2c3e50;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.valor-estoque {
    font-size: 0.7em;
    color: #95a5a6;
}

.header-inline {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.mini-icon { width: 50px; height: 50px; }
.label-purity { font-size: 0.7em; font-weight: bold; color: #7f8c8d; text-transform: uppercase; flex: 1; }
.valor-bonus { font-weight: 800; color: #8e44ad; font-size: 1.1em; }

.slider-container-novo {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
}

.linha-controles-central {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 40px; /* Trava a altura da linha central */
}

.img-residuo-fixa {
    width: 40px;
    height: 40px;
    object-fit: contain;
}

.coluna-slider {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f8f9fa;
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid #eee;
}

.slider-mistico-novo {
    flex: 1;
    accent-color: #8e44ad;
    cursor: pointer;
}
.bonus-flutuante {
    font-weight: 900;
    color: #8e44ad;
    font-size: 1em;
    min-width: 45px;
    text-align: right;
}
.bonus-tag {
    font-weight: 900;
    color: #8e44ad;
    font-size: 0.9em;
    min-width: 35px;
}
.bonus-tag-fixa {
    font-weight: 900;
    color: #8e44ad;
    font-size: 0.9em;
    /* Largura suficiente para o "+10%" sem empurrar a borda */
    min-width: 42px; 
    text-align: right;
    display: inline-block;
}

/* Linha 3: Footer */
.linha-estoque-footer {
    font-size: 0.65em;
    color: #95a5a6;
    text-align: right;
    margin-top: auto; /* Garante que fique sempre colado no fundo */
}

.estoque-footer { font-size: 0.65em; color: #95a5a6; margin-top: 5px; text-align: right; }

/* --- BLOCO DIREITO: AÇÃO --- */
.box-execucao-final {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    justify-content: space-between; /* Espalha os elementos para ocupar a altura */
}

.display-chance {
    background: #2c3e50;
    color: white;
    padding: 5px;
    border-radius: 6px;
    text-align: center;
    display: flex;
    flex-direction: column;
    line-height: 1;
}

.display-chance small { font-size: 0.55em; opacity: 0.7; margin-bottom: 2px; }
.num-chance { font-size: 1.2em; font-weight: 600; }

/* Dinâmica de Cores da Chance */
.chance-alta { color: #2ecc71; }
.chance-media { color: #f1c40f; }
.chance-baixa { color: #e74c3c; }

.btn-principal-encantar {
    background: linear-gradient(to bottom, #9b59b6, #8e44ad);
    color: white;
    border: none;
    padding: 14px;
    border-radius: 6px;
    font-weight: 900;
    font-size: 0.95em;
    cursor: pointer;
    box-shadow: 0 4px 0 #71368a;
    transition: all 0.1s;
}

.btn-principal-encantar:active { transform: translateY(2px); box-shadow: 0 2px 0 #71368a; }
.btn-principal-encantar:disabled { background: #bdc3c7; box-shadow: none; cursor: not-allowed; }

.btn-trash, .btn-recycle { 
    background: none; border: none; cursor: pointer; font-size: 1.1em; opacity: 0.6; 
}
.btn-trash:hover { opacity: 1; filter: drop-shadow(0 0 5px red); }
.btn-recycle:hover { opacity: 1; filter: drop-shadow(0 0 5px green); }

/* Responsividade Celular */
@media (max-width: 600px) {
    .controles-mistica-row { flex-direction: column; align-items: stretch; }
    .img-centro-destaque {
    width: 70px; height: 70px !important;
}
}
.box-residuo-mini {
    flex: 1; /* Ocupa 50% ou o que der */
    width: 250px;
    background: #fff;
    border: 1px solid #bdc3c7;
    border-radius: 6px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.header-residuo { display: flex; align-items: center; gap: 5px; margin-bottom: 5px; }
.icone-texto-mini { width: 35px; height: 35px; }
.titulo-mini { font-size: 0.6em; font-weight: bold; color: #7f8c8d; text-transform: uppercase; }

.input-area-mini { width: 100%; display: flex; flex-direction: column; align-items: center; }
.valor-mini { font-size: 1.2em; font-weight: 800; color: #8e44ad; }
.slider-mistico-mini { width: 90%; accent-color: #8e44ad; height: 4px; }
.estoque-mini { font-size: 0.6em; color: #95a5a6; margin-top: 2px; }

/* Caixa Direita (Ação) */
.box-acao-mini {
    flex: 1.2; /* Um pouquinho maior que o resíduo */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.chance-mini {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #2c3e50;
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.7em;
    font-weight: bold;
}

.btn-encantar-mini {
    flex: 1;
    margin: 5px 0;
    background: linear-gradient(to bottom, #9b59b6, #8e44ad);
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 800;
    font-size: 0.9em;
    cursor: pointer;
    box-shadow: 0 3px 0 #71368a;
    transition: all 0.1s;
}
.btn-encantar-mini:active { transform: translateY(2px); box-shadow: 0 1px 0 #71368a; }
.btn-encantar-mini:disabled { background: #bdc3c7; box-shadow: none; cursor: not-allowed; }

.botoes-extra-mini {
    display: flex;
    justify-content: flex-end;
    gap: 5px;
}

.btn-icon-clean {
    background: none; border: 1px solid #bdc3c7; border-radius: 4px;
    cursor: pointer; font-size: 0.8em; padding: 2px 6px; background: #fff;
}
.btn-icon-clean:hover { background: #f1f2f6; }
.consumivel-box { background: #f8f9fa; padding: 12px; border-radius: 8px; border: 1px solid #eee; }
.pedra-label { font-size: 0.75em; font-weight: bold; color: #8e44ad; }
.po-info { font-size: 0.7em; margin: 10px 0 5px; color: #636e72; }
.slider-mistico { width: 100%; accent-color: #8e44ad; cursor: pointer; }

.c-txt { font-size: 0.6em; font-weight: bold; color: #b2bec3; text-transform: uppercase; }
.c-num { display: block; font-size: 2em; font-weight: 900; color: #2d3436; }

.btn-encantar-v2 {
    width: 100%; padding: 15px; background: #8e44ad; color: #fff; border: none;
    border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 0 #71368a;
}
.btn-encantar-v2:active { transform: translateY(2px); box-shadow: 0 2px 0 #71368a; }
/* --- TEXTO RPG ESTILIZADO (Adeus árvore de natal simples) --- */
.texto-rpg {
    font-family: 'Georgia', serif;
    font-size: 1.8em; /* REDUZIDO (Era 2.5em) */
    font-weight: 800;
    transition: all 0.3s;
    text-shadow: 1px 1px 0px rgba(0,0,0,0.1); /* Sombra suave, sem brilho excessivo */
}

/* Verde mais sóbrio */
.rpg-sucesso {
    color: #27ae60;
    background: none;
    -webkit-text-fill-color: initial; /* Remove o degradê exagerado */
    filter: none; /* Remove o brilho neon */
}

/* Amarelo mais sóbrio */
.rpg-atencao {
    color: #f39c12;
    background: none;
    -webkit-text-fill-color: initial;
    filter: none;
}

/* Vermelho mais sóbrio */
.rpg-perigo {
    color: #c0392b;
    background: none;
    -webkit-text-fill-color: initial;
    filter: none;
}

/* --- BOTÕES DE DESCARTE --- */
.painel-descarte {
    display: flex; gap: 10px; margin-top: 10px; justify-content: flex-end; width: 100%;
}
.btn-lixeira {
    background: #7f8c8d; border: none; padding: 10px; border-radius: 6px; cursor: pointer;
}
.btn-reciclar {
    background: linear-gradient(45deg, #8e44ad, #9b59b6);
    color: white; border: none; padding: 10px 15px; border-radius: 6px; 
    font-weight: bold; cursor: pointer; box-shadow: 0 4px 0 #6c3483;
}
.btn-reciclar:hover { filter: brightness(1.1); transform: translateY(-2px); }
.icone-texto {
    height: 2.5em; /* Define o tamanho do ícone baseado no tamanho do texto */
    width: auto;
    vertical-align: middle; /* Alinha com o meio do texto */
    margin-right: 6px; /* Espacinho entre imagem e texto */
    filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.5)); /* Sombra para destacar */
}
/* Container dos 3 botões */
.selecao-pedras-container {
    display: flex;
    justify-content: space-between;
    gap: 5px;
    padding: 10px;
    background: #f8f9fa;
    border-top: 1px solid #e0e0e0;
    margin-top: 14px; /* Empurra para baixo se sobrar espaço */
}

/* O Botão da Pedra */
.btn-pedra-opcao {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border: 2px solid #dcdde1;
    border-radius: 8px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    min-height: 80px;
}

/* Estados do Botão */
.btn-pedra-opcao:hover { transform: translateY(-2px); border-color: #bdc3c7; }
.btn-pedra-opcao.ativo {
    border-color: #8e44ad;
    background: #f4ecf7;
    box-shadow: 0 0 8px rgba(142, 68, 173, 0.3);
}
.btn-pedra-opcao.sem-estoque {
    opacity: 0.6;
    filter: grayscale(1);
}

/* Imagem e Textos */
.img-pedra-btn { width: 32px; height: 32px; object-fit: contain; margin-bottom: 4px; }
.info-pedra-btn { display: flex; flex-direction: column; align-items: center; line-height: 1; }
.nome-p-btn { font-size: 0.6em; font-weight: bold; text-align: center; color: #7f8c8d; margin-bottom: 2px; }
.qtd-p-btn { font-size: 0.75em; font-weight: 800; color: #2c3e50; }

/* Mini preview da chance */
.chance-preview-mini {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #2d3436;
    color: #fff;
    font-size: 0.6em;
    padding: 2px 5px;
    border-radius: 10px;
    font-weight: bold;
}
/* --- ESTILO DO ATRIBUTO OCULTO/DESPERTADO --- */
.box-atributo-especial {
    width: 85%;
    margin: 2px auto;
    padding: 7px;
    background: #f9f9f9;
    /* A mágica está aqui: uma borda cinza na esquerda quando bloqueado */
    border-left: 4px solid #bdc3c7; 
    border-right: 4px solid #bdc3c7; 
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
    border-radius: 15px 15px 15px 15px; /* Arredonda só a direita */
    text-align: center; /* Texto alinhado à esquerda fica mais sério */
    transition: all 0.3s ease;
}

.titulo-especial {
    font-size: 0.6em;
    font-weight: 800;
    color: #95a5a6;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 2px;
}

.texto-especial {
    font-size: 0.8em;
    color: #bdc3c7;
    font-style: italic;
}

/* --- ESTADO DESPERTADO --- */
.box-atributo-especial.despertado {
    background: #37ff0009;
    /* A borda vira Dourada/Laranja */
    border-left: 4px solid #36c905; 
    border-right: 4px solid #36c905;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05); /* Sombra quase imperceptível */
}

.box-atributo-especial.despertado .titulo-especial {
    color: #f39c12;
}

.box-atributo-especial.despertado .texto-especial {
    color: #2c3e50;
    font-style: italic;
    font-weight: 500;
}
.empty-state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0px 10px;
    height: 100%;       /* Ocupa a altura disponível */
    min-height: 100px;  /* Altura mínima para não ficar espremido */
    opacity: 0.7;       /* Leve transparência geral */
    text-align: center;
}

.ghost-circle {
    width: 60px;
    height: 60px;
    background: #f1f2f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    border: 1px dashed #bdc3c7; /* Borda tracejada dá ideia de slot vazio */
}

.ghost-icon {
    font-size: 2em;
    filter: grayscale(1); /* Deixa o emoji cinza para combinar */
    opacity: 0.5;
}

.ghost-title {
    margin: 0;
    font-size: 0.9em;
    font-weight: 800;
    color: #7f8c8d;
    text-transform: uppercase;
}

.ghost-desc {
    margin: 5px 0 0 0;
    font-size: 0.75em;
    color: #95a5a6;
    max-width: 80%; /* Garante que o texto não bata nas bordas */
}
/* --- MODAL RPG CONFIRMAÇÃO --- */
.modal-rpg-confirmacao {
    background: #fff;
    width: 90%;
    max-width: 380px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex; flex-direction: column;
}

/* Temas de Cor */
.tema-reciclar { border: 2px solid #8e44ad; }
.tema-reciclar .modal-header-rpg { background: #8e44ad; color: #fff; }

.tema-lixeira { border: 2px solid #c0392b; }
.tema-lixeira .modal-header-rpg { background: #c0392b; color: #fff; }

.modal-header-rpg {
    padding: 15px; text-align: center;
}
.modal-header-rpg h3 { margin: 0; font-size: 1.1em; text-transform: uppercase; letter-spacing: 1px; }

.modal-body-rpg {
    padding: 20px;
    background: #fdfdfd;
    display: flex; flex-direction: column; align-items: center; gap: 15px;
}

.aviso-texto { text-align: center; color: #7f8c8d; font-size: 0.9em; margin: 0; }

/* O Card do Item dentro do modal */
.item-preview-modal {
    display: flex; align-items: center; gap: 15px;
    background: #fff;
    border: 1px solid #e0e0e0;
    padding: 10px;
    border-radius: 8px;
    width: 100%;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
/* Reuso das cores de Tier no fundo do card */
.item-preview-modal.bg-tier-mitico { background: linear-gradient(to right, #fff, #e0f7fa); border-color: #00cec9; }
.item-preview-modal.bg-tier-lendario { background: linear-gradient(to right, #fff, #fff9c4); border-color: #f1c40f; }

.img-modal-confirm { width: 50px; height: 50px; object-fit: contain; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3)); }

.info-modal-item.row-center {
    display: flex;
    flex-direction: row;       /* Garante que fique lado a lado */
    align-items: center;       /* Centraliza verticalmente */
    justify-content: center;   /* Centraliza horizontalmente (opcional) */
    gap: 8px;                  /* Espaço entre o Nome e a Box */
    flex: 1;
}

/* O estilo do Nome */
.nome-modal {
    font-weight: 600;
    color: #2c3e50;
    font-size: 0.8em;
    text-transform: uppercase; /* Fica bonito em nomes de item */
}

/* A Caixinha do Nível */
.box-nivel-destaque {
    background: #2c3e50;       /* Fundo escuro */
    color: #fff;               /* Texto branco */
    padding: 2px 8px;          /* Espaçamento interno */
    border-radius: 6px;        /* Bordas arredondadas */
    font-weight: bold;
    font-size: 0.75em;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.nivel-modal { font-weight: bold; color: #8e44ad; font-size: 0.8em; }

.stats-resumo-modal {
    display: flex; flex-wrap: wrap; gap: 5px; margin-top: 3px;
}
.stats-resumo-modal small {
    background: #ecf0f1; padding: 2px 4px; border-radius: 4px; font-size: 0.65em; color: #7f8c8d;
}

/* Caixa de Ganho (Reciclagem) */
.box-ganho-destaque {
    background: #f3e5f5; border: 1px dashed #8e44ad;
    padding: 10px; border-radius: 8px; width: 100%;
    display: flex; justify-content: space-between; align-items: center;
}
.label-ganho { font-size: 0.8em; color: #8e44ad; font-weight: bold; }
.valor-ganho { display: flex; align-items: center; gap: 5px; font-size: 1.1em; color: #2c3e50; }

.aviso-final { font-size: 0.75em; color: #95a5a6; font-style: italic; margin: 0; }
.aviso-final.perigo { color: #c0392b; font-weight: bold; }

/* Botões */
.modal-footer-rpg {
    padding: 15px;
    display: flex; gap: 10px;
    background: #f4f6f7;
    border-top: 1px solid #ecf0f1;
}
.btn-cancelar-rpg {
    flex: 1; padding: 12px; border: 1px solid #bdc3c7; background: #fff;
    border-radius: 6px; cursor: pointer; font-weight: bold; color: #7f8c8d;
}
.btn-confirmar-rpg {
    flex: 1.5; padding: 12px; border: none; border-radius: 6px;
    cursor: pointer; font-weight: 800; color: #fff;
    box-shadow: 0 4px 0 rgba(0,0,0,0.2);
}
.btn-confirmar-rpg:active { transform: translateY(2px); box-shadow: none; }

.btn-roxo { background: #8e44ad; }
.btn-vermelho { background: #c0392b; }
/* =========================================================
   CORREÇÃO RESPONSIVA - ABA DE APRIMORAMENTO (MOBILE)
   ========================================================= */
@media (max-width: 768px) {
    /* 1. Transforma o container que era lado-a-lado em coluna */
    .container-aprimoramento-v2 {
        flex-direction: column !important; /* Força ficar um em cima do outro */
        height: auto !important;
        max-height: none !important; /* Remove a trava de 80vh */
        overflow: visible !important; /* Deixa a página crescer e rolar normalmente */
        padding: 5px !important;
    }

    /* 2. O Inventário (que estava na esquerda) vira uma caixa no topo */
    .painel-inventario-compacto {
        width: 100% !important; /* Ocupa a largura total do celular */
        height: 220px !important; /* Altura fixa para você rolar os itens */
        margin-bottom: 20px; /* Espaço para não colar na parte de baixo */
    }
    
    /* 3. Ajuste nos botões de filtro de itens (Armas, Botas, etc) para não quebrar */
    .grade-botoes-filtro {
        grid-template-columns: repeat(8, 1fr) !important; /* Tenta manter em 1 linha ou rolar */
        gap: 2px !important;
        overflow-x: auto; /* Permite rolar para o lado se não couber */
        padding-bottom: 5px !important;
    }
    .grade-botoes-filtro button {
        min-width: 30px; /* Garante tamanho mínimo para o dedo */
    }

    /* 4. A Mesa de Encantamento (que estava na direita) vai para baixo */
    .painel-encantamento-foco {
        /* MUDANÇA: Em vez de 100%, usamos 94% para deixar um respiro nas laterais */
        width: 93% !important;
        
        /* Centraliza a caixa na tela */
        margin: 15px auto !important; 

        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;

        /* Removemos a altura fixa para ela ficar do tamanho do conteúdo */
        min-height: auto !important; 
        height: auto !important;
        
        /* Padding menor para não ficar muito "gorda" verticalmente também */
        padding: 25px 10px !important; 
    }

    /* 2. Ajuste do tamanho do Ícone/Texto para celular */
    .big-rune-circle {
        width: 70px;  /* Menor que no PC */
        height: 70px;
        border-width: 3px;
    }
    
    .rune-icon-pulsing {
        font-size: 2em; /* Ícone menor */
    }

    .wait-title {
        font-size: 0.9em; /* Texto menor */
    }

    /* 5. A Carta e os Controles agora ficam empilhados */
    .interface-mistica-ativa {
        flex-direction: column !important;
        align-items: center !important;
        gap: 15px;
        width: 100%;
        box-sizing: border-box;
        padding: 5px !important; /* <--- ADICIONE ESTA LINHA (Reduz a borda geral) */
    }

    /* 6. A Carta do Item */
    .moldura-carta-rpg {
        width: 100% !important;
        /* Aumentamos de 320px para 380px para caber os números */
        max-width: 380px; 
        margin: 0 auto;/* Centraliza */
    }
    .linha-stat-mini {
    font-size: 0.7em !important; /* Tamanho confortável */
    }

    /* 7. Os Controles (Slider de Pó e Botão) */
    .controles-mistica {
        width: 100% !important;
        padding: 0 10px;
        box-sizing: border-box;
    }

    /* Botão de Ação grande para facilitar o clique */
    .btn-encantar-v2 {
        padding: 18px !important;
        font-size: 1.1em !important;
    }
    
    /* Estado de espera (quando não tem item selecionado) */
    .estado-espera {
        padding: 40px 10px;
    }
    .estado-espera-centro {
    padding-top: 0px !important;
    
}
}
</style>