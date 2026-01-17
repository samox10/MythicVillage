<script setup>
import { ref, computed, reactive } from 'vue';
import { jogo, acoes, dadosItens, obterBuffRaca } from '../jogo.js';

// --- ESTADO LOCAL ---
const qtdsPorItem = ref({});
const filtroTipo = ref('todos');
const filtroStat = ref('todos');
const filtroNivel = ref('todos'); // Apenas visual por enquanto
// --- Adicione isso logo abaixo das outras variáveis 'ref' ou 'const' ---
const itemSelecionado = ref(null); // Guarda qual item estamos vendo no modal
const formatarNumero = (n) => n ? Number(n).toLocaleString('pt-BR') : '0';
const abrirForja = (item) => {
    itemSelecionado.value = item; // Abre o modal com este item
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
    critico: { nome: "Crítico", img: "icone_chancecritico.png" },
    danoCritico: { nome: "Dano Crít.", img: "icone_danocritico.png" },
    magia: { nome: "Magia", img: "icone_danomagico.png" },
    defesaMagica: { nome: "Def. Mágica", img: "icone_defesamagica.png" },
    penetracao: { nome: "Penetração", img: "icone_penetracao.png" }
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
    tooltipData.visivel = false;
    window.removeEventListener('click', fecharTooltipFora);
};

// Fecha se clicar em qualquer lugar que não seja o tooltip
const fecharTooltipFora = (e) => {
    const tooltipEl = document.getElementById('tooltip-flutuante');
    if (tooltipEl && !tooltipEl.contains(e.target)) {
        fecharTooltip();
    }
};
// --- LÓGICA DE FILTRO ---
const itensFiltrados = computed(() => {
    return dadosItens.filter(item => {
        // 1. Filtro de Tipo
        if (filtroTipo.value !== 'todos' && item.tipo !== filtroTipo.value) return false;
        
        // 2. Filtro de Atributo (Stat)
        if (filtroStat.value !== 'todos') {
            // Verifica se o item tem esse status (ex: se tem 'ataque')
            if (!item.stats || !item.stats[filtroStat.value]) return false;
        }

        return true;
    });
});

// --- HELPERS DE ESTADO ---
const getQtd = (id) => qtdsPorItem.value[id] || 1;

const setQtd = (id, valor, max) => {
    let v = parseInt(valor) || 1;
    v = Math.max(1, v);
    if (max) v = Math.min(v, max);
    qtdsPorItem.value[id] = v;
};

// --- COMPUTEDS DE FERREIRO E BUFFS ---
const ferreiroAtivo = computed(() => {
    return jogo.funcionarios.find(f => f.profissao === 'ferreiro' && f.diasEmGreve === 0);
});

// Calcula os buffs visuais baseado no ferreiro atual
const statsFerreiro = computed(() => {
    if (!ferreiroAtivo.value) return { tempo: 0, falha: 0, poderReal: 0 };

    const base = ferreiroAtivo.value.poderEspecial || 0;
    const buffRaca = obterBuffRaca(ferreiroAtivo.value); // % extra vinda do Lorde
    const poderReal = base * (1 + (buffRaca / 100));

    return {
        poderReal: Math.floor(poderReal), 
        tempo: Math.min(90, Math.floor(poderReal)), // % Redução Tempo (Max 90%)
        falha: Math.min(100, Math.floor(poderReal)) // % Redução Falha
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

const fabricarItemDaLista = (item) => {
    const quantidade = getQtd(item.id); // Pega a quantidade que você digitou
    if (quantidade > 0) {
        // Tenta usar a função global de fabricar
        if (typeof acoes !== 'undefined' && acoes.fabricarItem) {
            acoes.fabricarItem(item, quantidade);
        } else {
            console.error("Erro: Sistema de craft não encontrado (acoes.fabricarItem)");
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

// Formatação mm:ss (e agora hh:mm) para a fila
const formatarTempoFila = (s) => {
    // Arredonda para cima para não mostrar "0s" quando ainda falta 0.5s
    const final = Math.ceil(s);

    if (final < 60) return `${final}s`;
    
    // Se for menos de 1 hora
    if (final < 3600) {
        const m = Math.floor(final / 60);
        const rest = final % 60;
        return `${m}m ${rest}s`;
    }

    // Se for 1 hora ou mais
    const h = Math.floor(final / 3600);
    const m = Math.floor((final % 3600) / 60);
    return `${h}h${String(m).padStart(2, '0')}min`;
};

// Cores de Tier (mesma da Taverna)
const corTier = (t) => ({'F':'#8A8A8A','E':'#659665','D':'#71c404','C':'#475fad','B':'#0233d1','A':'#8e44ad','S':'#f1c40f','SS':'#0fbdd1'}[t] || '#000');
</script>

<template>
  <div class="ferraria-container">
    
    <div class="header-taverna">
        <div class="titulo-nivel">
            <h2>⚒️ Ferraria</h2>
        </div>
        <div class="info-nivel">
            <span class="badge-nivel">Nível {{ jogo.ferraria }}</span>
        </div>
    </div>

    <div class="painel-controle-ferraria">
        
        <div v-if="ferreiroAtivo" class="card-funcionario ferreiro-ativo" :style="{ borderColor: corTier(ferreiroAtivo.tier) }">
                
                <div class="card-topo" :style="{ backgroundColor: corTier(ferreiroAtivo.tier) }">
                    <div class="topo-esquerda">
                        <span class="tier-badge">{{ ferreiroAtivo.tier }}</span>
                        <span class="card-nome">{{ ferreiroAtivo.nome }}</span>
                    </div>
                    <img src="/assets/ui/i_ferreiro.png" class="icon-prof-topo" title="Ferreiro">
                </div>

                <div class="card-mid">
                    <div class="avatar-box">
                         <img :src="`/assets/faces/${ferreiroAtivo.raca}/${ferreiroAtivo.imagem}.png`" class="avatar-func">
                    </div>

                    <div class="tabela-dados-func">
                        <div class="linha-dado">
                            <span class="dado-label">Profissão:</span>
                            <span class="dado-valor">Ferreiro</span>
                        </div>
                        <div class="linha-dado">
                            <span class="dado-label">Raça:</span>
                            <span class="dado-valor capitalize">{{ ferreiroAtivo.raca }}</span>
                        </div>
                        <div class="linha-dado">
                            <span class="dado-label">Sexo:</span>
                            <span class="dado-valor">{{ ferreiroAtivo.sexo === 'm' ? 'Masculino' : 'Feminino' }}</span>
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
                        Aumento de produtividade em <span class="verde">{{ statsFerreiro.tempo }}%</span>
                    </div>
                    <div class="frase-efeito">
                        "{{ ferreiroAtivo.frase || 'Pronto para forjar!' }}"
                    </div>
                </div>
            </div>
            <div v-else class="card-funcionario vazio-ferreiro-card">
                
                <div class="card-topo vazio-topo">
                    <div class="topo-esquerda">
                        <span class="tier-badge vazio-badge">-</span>
                        <span class="card-nome">Vaga Aberta</span>
                    </div>
                    <img src="/assets/ui/i_ferreiro.png" class="icon-prof-topo grayscale" title="Necessário Ferreiro">
                </div>

                <div class="card-mid">
                    <div class="avatar-box vazio-avatar-box">
                         <img src="/assets/ui/icone_morador.png" class="avatar-vazio">
                    </div>

                    <div class="tabela-dados-func vazio-dados">
                        <div class="texto-central-vazio">
                            <span class="titulo-vazio">Sem Ferreiro</span>
                            <span class="subtitulo-vazio">ESTAMOS CONTRATANDO</span>
                        </div>
                    </div>
                </div>

                <div class="rodape-card vazio-rodape">
                    <div class="frase-efeito">
                        "A forja está fria..."
                    </div>
                </div>
            </div>
            

        <div class="linha-divisoria"></div>

        <div class="lado-direito-filtros">
            <h4 class="titulo-filtros">🔍 Filtros de Produção</h4>
            
            <div class="grupo-select">
                <label>Tipo de Item:</label>
                <select v-model="filtroTipo">
                    <option value="todos">Todos</option>
                    <option value="arma">⚔️ Armas</option>
                    <option value="armadura">🛡️ Armaduras</option>
                    <option value="municao">🏹 Munição</option>
                </select>
            </div>

            <div class="grupo-select">
                <label>Atributo Principal:</label>
                <select v-model="filtroStat">
                    <option value="todos">Qualquer</option>
                    <option value="ataque">Ataque</option>
                    <option value="defesa">Defesa</option>
                    <option value="agilidade">Agilidade</option>
                    <option value="precisao">Precisão</option>
                </select>
            </div>

            <div class="grupo-select">
                <label>Nível Requerido:</label>
                <select v-model="filtroNivel">
                    <option value="todos">Todos</option>
                    <option value="5">Nível 5+</option>
                    <option value="10">Nível 10+</option>
                    <option value="15">Nível 15+</option>
                    <option value="20">Nível 20+</option>
                </select>
            </div>
        </div>
    </div>

    <div class="lista-receitas-container">
        
        <div class="header-lista"></div>

        <div class="lista-receitas-scroll">
            
            <div v-for="item in itensFiltrados" :key="item.id" class="card-capa-simples">
                
                <div class="capa-header">
                    <h4>{{ item.nome }}</h4>
                    <span class="badge-qtd" v-if="jogo.itens[item.id] > 0">Possui: {{ jogo.itens[item.id] }}</span>
                </div>

                <div class="capa-corpo">
                    <div class="capa-img-box">
                        <img :src="item.img" class="capa-icon">
                    </div>
                    
                    <div class="capa-stats">
                        <template v-if="item.stats">
                            <template v-for="(valor, nomeStat) in item.stats" :key="nomeStat">
                                <div class="mini-stat-row" v-if="mapaAtributos[nomeStat]">
                                    <img :src="`/assets/ui/${mapaAtributos[nomeStat].img}`">
                                    <span class="nome-stat-lista">{{ mapaAtributos[nomeStat].nome }}:</span>
                                    <span class="valor-stat-lista">{{ valor }}</span>
                                </div>
                            </template>
                        </template>
                        <div v-else class="desc-simples">{{ item.desc }}</div>
                    </div>
                </div>

                <button class="btn-abrir-modal" @click="abrirForja(item)">
                    EXAMINAR & FORJAR
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
                            <div v-for="(qtd, rec) in itemSelecionado.custo" :key="rec" 
                                 class="modal-pill-custo"
                                 :class="{ 'falta': (jogo.minerios[rec]||jogo[rec]||0) < (qtd * getQtd(itemSelecionado.id)) }">
                                <img :src="`/assets/recursos/min_${rec}.png`" 
                                     @error="$event.target.src = '/assets/recursos/res_' + rec + '.png'"
                                     class="icon-custo-modal">
                                <div class="custo-texto">
                                    <span class="custo-nome">{{ rec }}</span>
                                    <span class="custo-val">
                                        <span :class="{'text-red': (jogo.minerios[rec]||jogo[rec]||0) < (qtd * getQtd(itemSelecionado.id))}">
                                            {{ (jogo.minerios[rec]||jogo[rec]||0) }}
                                        </span>
                                        / {{ qtd * getQtd(itemSelecionado.id) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-controles-box">
                        <div class="modal-timer">
                            ⏳ {{ getTempoCraft(itemSelecionado, getQtd(itemSelecionado.id)) }}
                        </div>

                        <div class="modal-input-group">
                            <button @click="setQtd(itemSelecionado.id, getQtd(itemSelecionado.id) - 1)">-</button>
                            <input type="number" :value="getQtd(itemSelecionado.id)" readonly>
                            <button @click="setQtd(itemSelecionado.id, getQtd(itemSelecionado.id) + 1, getMaxCraft(itemSelecionado))">+</button>
                        </div>
                    </div>

                    <button class="btn-forjar-final"
                            :disabled="!!jogo.craftando.item || getQtd(itemSelecionado.id) > getMaxCraft(itemSelecionado) || getQtd(itemSelecionado.id) < 1"
                            @click="fabricarItemDaLista(itemSelecionado); fecharForja()">
                        🔨 FORJAR AGORA
                    </button>

                </div>
            </div>
    </div>

    <div v-if="jogo.craftando.item" class="fila-producao">
        <div class="fila-header">
            <h4>🔥 Forja em atividade...</h4>
            <div class="fila-detalhes-texto">
                Lote: <strong>{{ jogo.craftando.qtdLote }}x</strong> 
            </div>
        </div>
        
        <div class="barra-progresso-container">
            <div class="barra-progresso-fill" 
                 :style="{ width: (100 - (jogo.craftando.tempoRestante / jogo.craftando.tempoTotal * 100)) + '%' }">
            </div>
            <span class="texto-progresso">
                {{ formatarTempoFila(jogo.craftando.tempoRestante) }} restantes
            </span>
        </div>
        
        <div class="botoes-fila">
             <button class="btn-cancelar" @click="acoes.cancelarCraft">Cancelar (Perde 10%)</button>
             <button class="btn-acelerar" @click="acoes.acelerarCraft">Acelerar (Ouro)</button>
        </div>
    </div>

  <div v-if="tooltipData.visivel" 
          id="tooltip-flutuante"
          class="tooltip-custom"
          :style="{ top: tooltipData.y + 'px', left: tooltipData.x + 'px' }">
        {{ tooltipData.texto }}
    </div>

</div> 
</template>

<style scoped>
@import '../css/taverna.css';

/* Container Geral */
.ferraria-container {
    padding: 10px; color: #2c3e50; max-width: 1000px; margin: 0 auto;
}

/* --- PAINEL DE CONTROLE (Topo) --- */
.painel-controle-ferraria {
    display: flex; align-items: center; justify-content: space-between;
    background: #ecf0f1; border: 1px solid #bdc3c7; border-radius: 8px;
    margin: 15px 0; padding: 10px; gap: 15px; height: 180px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.lado-esquerdo-ferreiro { flex: 1; display: flex; justify-content: center; height: 100%; }
.ferreiro-ativo .card-mid { flex: 1; display: flex; align-items: center; padding: 5px; background: #fff; }
.vazio-ferreiro-mini { border: 2px dashed #999; width: 100%; display: flex; align-items: center; justify-content: center; color: #777; font-weight: bold; }
.linha-divisoria { width: 2px; height: 90%; background: #bdc3c7; opacity: 0.6; }
.lado-direito-filtros { flex: 1; display: flex; flex-direction: column; gap: 5px; padding: 5px; }
.titulo-filtros { color: #d35400; font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 5px; }
.grupo-select { display: flex; justify-content: space-between; background: #fff; padding: 4px; border: 1px solid #ccc; border-radius: 4px; }

/* Lista Container */
.lista-receitas-container {
    background: #ecf0f1; border: 1px solid #bdc3c7; border-radius: 8px;
    display: flex; flex-direction: column; height: 600px;
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
   1. ESTILO DO CARD SIMPLIFICADO (Na Lista)
   ================================================== */
.card-capa-simples {
    background: #fff;
    border: 1px solid #bdc3c7; 
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    display: flex; 
    flex-direction: column; 
    gap: 10px;
    /* margin-bottom: 15px;  <-- REMOVIDO para não duplicar espaço */
    height: fit-content; /* Garante que o card tenha o tamanho do conteúdo */
}

.capa-header {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid #ecf0f1; padding-bottom: 5px;
}
.capa-header h4 { margin: 0; color: #2c3e50; text-transform: uppercase; font-weight: 800; }
.badge-qtd { font-size: 0.75em; background: #2c3e50; color: white; padding: 2px 6px; border-radius: 4px; }

.capa-corpo {
    display: flex; align-items: center; gap: 15px;
}
.capa-img-box {
    width: 60px; height: 60px; background: #f8f9fa; border: 1px solid #dee2e6;
    border-radius: 8px; padding: 5px; flex-shrink: 0;
}
.capa-icon { width: 100%; height: 100%; object-fit: contain; }

/* AJUSTE AQUI: Mudado para 2 colunas para caber o nome do status */
.capa-stats {
    flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px;
}
.mini-stat-row {
    display: flex; align-items: center; gap: 4px; background: #fdfdfd;
    border: 1px solid #ecf0f1; padding: 3px 6px; border-radius: 4px;
    font-size: 0.85em; color: #555;
    white-space: nowrap; /* Não quebrar linha */
}
.mini-stat-row img { width: 14px; height: 14px; opacity: 0.8; }
.nome-stat-lista { color: #7f8c8d; font-weight: 600; font-size: 0.9em; margin-right: 2px; }
.valor-stat-lista { color: #2c3e50; font-weight: 800; }

.desc-simples { font-size: 0.8em; color: #7f8c8d; font-style: italic; }

.btn-abrir-modal {
    width: 100%; padding: 10px;
    background: #3498db; color: white; border: none; border-radius: 6px;
    font-weight: bold; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;
    transition: background 0.2s;
}
.btn-abrir-modal:hover { background: #2980b9; }


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
    width: 100%; max-width: 400px;
    border-radius: 12px;
    padding: 20px;
    position: relative;
    display: flex; flex-direction: column; gap: 15px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    animation: modalPop 0.3s ease-out;
    max-height: 90vh; overflow-y: auto;
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
}
.modal-badge-tipo {
    position: absolute; top: 5px; right: 5px;
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
.text-red { color: #e74c3c; }
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
.modal-input-group input { width: 50px; text-align: center; border: none; font-weight: bold; }

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
    .painel-controle-ferraria { flex-direction: column; height: auto; }
    
    .capa-corpo { flex-direction: column; align-items: stretch; }
    .capa-img-box { width: 100%; height: 100px; display: flex; justify-content: center; }
    .capa-icon { width: auto; height: 100%; }
    
    .capa-stats { grid-template-columns: repeat(2, 1fr); }
    .lista-receitas-scroll {
        grid-template-columns: 1fr; /* No celular, volta para 1 coluna */
    }
}

/* Classes legadas */
.stats-ferreiro { flex: 1; }
.fila-producao { margin-top: 20px; background: #fff; padding: 10px; border: 1px solid #ccc; border-radius: 8px; }
.barra-progresso-container { height: 20px; background: #eee; border-radius: 10px; position: relative; overflow: hidden; margin: 10px 0; }
.barra-progresso-fill { height: 100%; background: orange; transition: width 1s linear; }
.texto-progresso { position: absolute; width: 100%; text-align: center; font-size: 0.8em; font-weight: bold; top: 2px; }
/* --- ESTILO ATUALIZADO DO CARD DE FUNCIONÁRIO --- */


.topo-detalhe-nome {
    display: flex; align-items: center; gap: 6px;
}
.icon-prof-topo {
    width: 20px; height: 20px;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
}

/* Efeito Zebrado (Opcional, deixa mais legível) */
.linha-dado:nth-child(odd) { background-color: #ffffff; }
/* Frase Rodapé */
.frase-rodape {
    margin-top: auto; /* Empurra para o fundo */
    padding: 4px;
    text-align: center;
    font-style: italic;
    color: #a4b0be;
    font-size: 0.85em;
    border-top: 1px solid #f1f2f6;
    background: #fff;
}
/* Container Principal do Card */
.ferreiro-ativo {
    width: 100%;
    max-width: 220px; /* Largura consideravelmente menor (Carta) */
    margin: 0 auto;   /* Centraliza no espaço disponível */
    background: #ffffff;
    border-width: 2px; border-style: solid;
    border-radius: 8px; overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

/* Topo */
.card-topo {
    padding: 4px 8px; color: #fff; font-weight: bold;
    display: flex; justify-content: space-between; align-items: center;
    height: 28px; font-size: 0.9em;
}
.topo-esquerda { display: flex; align-items: center; gap: 6px; }
.tier-badge { background: rgba(0,0,0,0.3); padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
.icon-prof-topo { width: 22px; height: 22px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.5)); }

/* Meio (Avatar + Tabela) */
.card-mid { flex: 1; display: flex; align-items: stretch; background: #fff; }

.avatar-box {
    width: 75px; display: flex; align-items: center; justify-content: center;
    background: #f1f2f6; border-right: 1px solid #dfe4ea;
}
.avatar-func { width: 65px; height: 65px; border-radius: 4px; border: 1px solid #ced6e0; background: #fff; }

.tabela-dados-func { flex: 1; display: flex; flex-direction: column; font-size: 0.75em; }

.linha-dado {
    display: flex; justify-content: space-between; align-items: center;
    padding: 3px 6px; border-bottom: 1px solid #f1f2f6; color: #2f3542;
}
.linha-dado:nth-child(even) { background-color: #f8f9fa; }

.dado-label { color: #747d8c; font-weight: 600; }
.dado-valor { font-weight: bold; color: #2f3542; display: flex; align-items: center; gap: 3px; white-space: nowrap; }
.capitalize { text-transform: capitalize; }
.tiny-coin { width: 11px; height: 11px; }

/* Rodapé Novo */
.rodape-card {
    background: #fff;
    border-top: 1px solid #f1f2f6;
    padding: 6px 4px;
    text-align: center;
    display: flex; flex-direction: column; gap: 2px;
}
.info-produtividade {
    font-size: 0.75em; color: #2c3e50; font-weight: 600;
}
.verde { color: #27ae60; }

.frase-efeito {
    font-size: 0.7em; font-style: italic; color: #a4b0be;
}
/* --- ESTILO DO CARD VAZIO (SLOT) --- */

.vazio-ferreiro-card {
    width: 100%;
    max-width: 220px; /* Mesma largura do card ativo */
    margin: 0 auto;
    background: #f8f9fa; /* Fundo bem claro */
    border: 2px dashed #bdc3c7; /* Borda tracejada (padrão de slot vazio) */
    border-radius: 8px;
    overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: none; /* Sem sombra profunda para parecer "fundo" */
    height: 100%; /* Ocupa a mesma altura */
    min-height: 140px; /* Garante altura mínima visual */
}

/* Topo Desativado */
.vazio-topo {
    background-color: #95a5a6; /* Cinza Concreto */
    color: #ecf0f1;
}
.vazio-badge { background: rgba(0,0,0,0.1); }
.grayscale { filter: grayscale(100%) opacity(0.6); }

/* Avatar Vazio */
.vazio-avatar-box {
    width: 75px; 
    display: flex; align-items: center; justify-content: center;
    background: #ecf0f1;
    border-right: 1px dashed #bdc3c7;
}
.avatar-vazio {
    width: 40px; height: 40px;
    opacity: 0.3; /* Bem transparente */
    filter: grayscale(100%);
}

/* Dados/Mensagem Central */
.vazio-dados {
    display: flex; align-items: center; justify-content: center;
    padding: 10px;
    text-align: center;
}
.texto-central-vazio {
    display: flex; flex-direction: column; gap: 4px;
}
.titulo-vazio {
    font-weight: 800; color: #7f8c8d; text-transform: uppercase; font-size: 0.9em;
}
.subtitulo-vazio {
    font-size: 0.75em; color: #95a5a6;
}

/* Rodapé Vazio */
.vazio-rodape {
    background: #ecf0f1;
    border-top: 1px dashed #bdc3c7;
    color: #95a5a6;
}
</style>