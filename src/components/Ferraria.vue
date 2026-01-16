<script setup>
import { ref, computed, reactive } from 'vue';
import { jogo, acoes, dadosItens, obterBuffRaca } from '../jogo.js';

// --- ESTADO LOCAL ---
const qtdsPorItem = ref({});
const filtroTipo = ref('todos');
const filtroStat = ref('todos');
const filtroNivel = ref('todos'); // Apenas visual por enquanto

// Mapeia a chave do 'dados.js' para o arquivo de imagem e o nome legível
const mapaAtributos = {
    ataque: { img: 'icone_ataque.png', nome: 'Ataque Físico' },
    defesa: { img: 'icone_defesafisica.png', nome: 'Defesa Física' },
    precisao: { img: 'icone_precisao.png', nome: 'Precisão' },
    agilidade: { img: 'icone_evasao.png', nome: 'Evasão' }, // Usei evasao pois não vi agilidade na sua lista
    danocritico: { img: 'icone_danocritico.png', nome: 'Dano Crítico' },
    chancecritico: { img: 'icone_precisao.png', nome: 'Chance Crítica' }, // Usei precisao provisorio
    vida: { img: 'icone_vida.png', nome: 'Vida Máxima' },
    magia: { img: 'icone_mana.png', nome: 'Mana Máxima' }
    // Adicione outros se necessário, seguindo o padrão.
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
    const qtd = getQtd(item.id);
    const max = getMaxCraft(item);
    
    if (qtd > 0 && qtd <= max) {
        acoes.fabricarItem(item, qtd);
        // Opcional: Resetar quantidade após craftar
        // qtdsPorItem.value[item.id] = 1; 
    }
};

// --- FORMATAÇÃO VISUAL ---

// Tempo formatado com redução aplicada
const getTempoCraft = (item, qtd) => {
    const tempoBase = item.tempo * qtd;
    const redutor = statsFerreiro.value ? (statsFerreiro.value.tempo / 100) : 0;
    const final = Math.ceil(tempoBase * (1 - redutor));
    
    if (final < 60) return `${final}s`;
    return `${Math.floor(final/60)}m ${final%60}s`;
};

// Chance de sucesso (para exibir na lista)
const getChanceSucesso = () => {
    const baseFalha = 15; // 15% Base fixa do jogo
    const redutor = statsFerreiro.value ? statsFerreiro.value.falha : 0;
    const falhaFinal = baseFalha * (1 - (redutor / 100));
    return (100 - falhaFinal).toFixed(1);
};

// Formatação mm:ss para a fila
const formatarTempoFila = (s) => {
    if (s < 60) return `${Math.ceil(s)}s`;
    const m = Math.floor(s / 60);
    const rest = Math.ceil(s % 60);
    return `${m}m ${rest}s`;
};

// Cores de Tier (mesma da Taverna)
const corTier = (t) => ({'F':'#8A8A8A','E':'#659665','D':'#71c404','C':'#475fad','B':'#0233d1','A':'#8e44ad','S':'#f1c40f','SS':'#0fbdd1'}[t] || '#000');
</script>

<template>
  <div class="ferraria-container">
    
    <div class="header-taverna" style="border-color: #e67e22;">
        <div class="titulo-nivel">
            <h2>⚒️ Ferraria</h2>
        </div>
        <div class="info-nivel">
            <span class="badge-nivel" style="background: #d35400;">Nv {{ jogo.ferraria }}</span>
        </div>
    </div>

    <div class="painel-controle-ferraria">
        
        <div class="lado-esquerdo-ferreiro">
            <div v-if="ferreiroAtivo" class="card-funcionario ferreiro-ativo" :style="{ borderColor: corTier(ferreiroAtivo.tier) }">
                <div class="card-topo" :style="{ backgroundColor: corTier(ferreiroAtivo.tier) }">
                    <span class="tier-badge">{{ ferreiroAtivo.tier }}</span>
                    <span class="card-nome">{{ ferreiroAtivo.nome }}</span>
                </div>
                <div class="card-mid">
                    <img :src="`/assets/faces/${ferreiroAtivo.raca}/${ferreiroAtivo.imagem}.png`" class="avatar-func">
                    <div class="stats-ferreiro">
                        <div class="stat-row">
                            <span class="label">Velocidade:</span>
                            <span class="valor verde">+{{ statsFerreiro.tempo }}%</span>
                        </div>
                        <div class="stat-desc">"Mestre da Forja!"</div>
                    </div>
                </div>
            </div>
            
            <div v-else class="vazio-ferreiro-mini">
                🚫 SEM FERREIRO
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
        
        <div class="header-lista">
            <span class="col-info">ITEM & ESTATÍSTICAS</span>
            <span class="col-custo">CUSTO (UNIDADE)</span>
            <span class="col-acao">PRODUÇÃO</span>
        </div>

        <div class="lista-receitas-scroll">
            <div v-for="item in itensFiltrados" :key="item.id" class="card-receita-moderno">
                
                <div class="linha-topo-card">
                    <h4 class="nome-item-topo">{{ item.nome }}</h4>

                    <div class="lista-custos-mini">
                        <div v-for="(qtd, rec) in item.custo" :key="rec" 
                             class="custo-item-mini"
                             :class="{ 'vermelho': (jogo.minerios[rec]||jogo[rec]||0) < (qtd * getQtd(item.id)) }">
                            <img :src="`/assets/recursos/min_${rec}.png`" 
                                 @error="$event.target.src = '/assets/recursos/res_' + rec + '.png'; $event.target.onerror = () => { $event.target.src = '/assets/ui/icone_' + rec + '.png' }"
                                 class="icon-custo-micro">
                            <span>{{ qtd * getQtd(item.id) }}</span>
                        </div>
                    </div>
                </div>

                <div class="linha-corpo-card">
                    
                    <div class="img-wrapper-moderno">
                        <img :src="item.img" class="icon-receita-grande">
                        <span class="qtd-badge">{{ jogo.itens[item.id] || 0 }}</span>
                    </div>

                    <div class="coluna-meio">
                         <div class="area-stats-grid">
                            <template v-if="item.stats">
                                <template v-for="(valor, nomeStat) in item.stats" :key="nomeStat">
                                    <div v-if="mapaAtributos[nomeStat]" 
                                         class="stat-row-detalhado">
                                        
                                        <img :src="`/assets/ui/${mapaAtributos[nomeStat].img}`" class="icon-stat-micro">
                                        
                                        <span class="nome-stat-texto">{{ mapaAtributos[nomeStat].nome }}:</span>
                                        
                                        <span class="valor-stat-destaque">{{ valor }}</span>
                                    </div>
                                </template>
                            </template>
                            <div v-else class="sem-stats">Item Cosmético</div>
                        </div>
                        
                        <div class="desc-moderna">{{ item.desc }}</div>
                    </div>

                    <div class="controles-finais">
                         <div class="tempo-estimado">⏳ {{ getTempoCraft(item, getQtd(item.id)) }}</div>

                        <div class="grupo-botoes-acao">
                            <div class="input-group-moderno">
                                <button class="btn-mini" @click="setQtd(item.id, getQtd(item.id) - 1)">-</button>
                                <input type="number" 
                                       :value="getQtd(item.id)" 
                                       @input="e => setQtd(item.id, e.target.value, getMaxCraft(item))">
                                <button class="btn-mini" @click="setQtd(item.id, getQtd(item.id) + 1, getMaxCraft(item))">+</button>
                            </div>
                            
                            <button class="btn-forjar-redondo" 
                                    :disabled="!!jogo.craftando.item || getQtd(item.id) > getMaxCraft(item) || getQtd(item.id) < 1"
                                    @click="fabricarItemDaLista(item)"
                                    title="FORJAR">
                                🔨
                            </button>
                        </div>
                    </div>

                </div>
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

.ferraria-container {
    padding: 10px;
    color: #ecf0f1;
    max-width: 1000px;
    margin: 0 auto;
}

/* SEÇÃO DO FERREIRO */
.painel-controle-ferraria {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(0,0,0,0.4);
    border: 1px solid #34495e;
    border-radius: 8px;
    margin: 15px 0;
    padding: 10px;
    gap: 15px;
    height: 180px; /* Altura fixa para alinhar */
}

/* ESQUERDA */
.lado-esquerdo-ferreiro {
    flex: 1;
    display: flex;
    justify-content: center;
    height: 100%;
}
.ferreiro-ativo {
    width: 100%;
    height: 100%;
    background: #2c3e50;
    border-width: 2px;
    border-style: solid;
    display: flex;
    flex-direction: column;
    font-size: 0.85em; /* Reduzi um pouco para caber */
}
.ferreiro-ativo .card-mid {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
}
.vazio-ferreiro-mini {
    border: 2px dashed #555;
    color: #777;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-weight: bold;
}

/* MEIO */
.linha-divisoria {
    width: 2px;
    height: 90%;
    background: linear-gradient(to bottom, transparent, #e67e22, transparent);
    opacity: 0.7;
}

/* DIREITA */
.lado-direito-filtros {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    padding: 5px;
}
.titulo-filtros {
    margin: 0 0 5px 0;
    font-size: 0.9em;
    color: #f39c12;
    text-transform: uppercase;
    text-align: left;
    border-bottom: 1px solid #555;
    padding-bottom: 3px;
}
.grupo-select {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255,255,255,0.05);
    padding: 4px 8px;
    border-radius: 4px;
}
.grupo-select label {
    font-size: 0.8em;
    color: #bdc3c7;
}
.grupo-select select {
    background: #111;
    color: #ecf0f1;
    border: 1px solid #555;
    padding: 3px;
    border-radius: 3px;
    font-size: 0.85em;
    width: 120px;
}

/* Mobile: Em telas pequenas, empilha tudo */
@media(max-width: 768px) {
    .painel-controle-ferraria {
        flex-direction: column;
        height: auto;
    }
    .linha-divisoria {
        width: 100%;
        height: 2px;
        background: linear-gradient(to right, transparent, #e67e22, transparent);
        margin: 10px 0;
    }
    .ferreiro-ativo { min-height: 140px; }
}
.ferreiro-ativo .card-mid {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
}
.ferreiro-ativo .avatar-func {
    width: 80px;
    height: 80px;
    border: 2px solid rgba(255,255,255,0.1);
    border-radius: 8px;
}
.stats-ferreiro { flex: 1; }
.stat-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 0.95em;
    border-bottom: 1px dashed rgba(255,255,255,0.1);
}
.valor.verde { color: #2ecc71; font-weight: bold; }
.valor.ouro { color: #f1c40f; font-weight: bold; }
.stat-desc {
    margin-top: 8px;
    font-style: italic;
    font-size: 0.8em;
    color: #95a5a6;
    text-align: center;
}
.vazio-ferreiro {
    border: 2px dashed #7f8c8d;
    padding: 20px;
    text-align: center;
    border-radius: 8px;
    width: 100%;
    color: #7f8c8d;
    background: rgba(0,0,0,0.2);
}

/* LISTA VERTICAL */
.lista-receitas-container {
    background: rgba(0,0,0,0.3);
    border: 1px solid #34495e;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    height: 600px; /* Altura fixa com scroll interno */
}

.header-lista {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1.2fr;
    background: rgba(0,0,0,0.5);
    padding: 12px 15px;
    font-size: 0.85em;
    font-weight: bold;
    color: #95a5a6;
    border-bottom: 1px solid #34495e;
    text-transform: uppercase;
}

.lista-receitas-scroll {
    overflow-y: auto;
    flex: 1;
    padding: 10px;
}

/* CARD DA LINHA */

.img-wrapper {
    position: relative;
    width: 54px;
    height: 54px;
    background: rgba(0,0,0,0.4);
    border-radius: 6px;
    border: 1px solid #444;
    padding: 2px;
}
.icon-receita { width: 100%; height: 100%; object-fit: contain; }
.qtd-possuida {
    position: absolute;
    bottom: -18px; left: 0;
    width: 100%;
    text-align: center;
    font-size: 0.7em;
    color: #95a5a6;
    white-space: nowrap;
}
.textos-receita h4 { margin: 0 0 6px 0; color: #ecf0f1; font-size: 1.1em; letter-spacing: 0.5px; }

/* BADGES */
.stats-badges { display: flex; gap: 6px; align-items: center; }
.badge-stat {
    font-size: 0.8em;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: bold;
    box-shadow: 0 2px 0 rgba(0,0,0,0.2);
}
.badge-tipo { font-size: 0.75em; background: #34495e; padding: 2px 5px; border-radius: 3px; color: #bdc3c7; font-weight: bold; }
.desc-simples { font-size: 0.85em; color: #7f8c8d; font-style: italic; margin-top: 4px; }

.custo-pill {
    background: #111;
    border: 1px solid #333;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9em;
    display: flex;
    align-items: center;
    gap: 5px;
}
.custo-pill.falta-recurso { border-color: #e74c3c; color: #e74c3c; }
.icon-micro { width: 16px; height: 16px; }
.subtotal { font-size: 0.8em; color: #7f8c8d; margin-left: 2px; }

.controle-qtd { display: flex; align-items: center; gap: 4px; width: 100%; justify-content: flex-end; }
.controle-qtd input {
    width: 50px;
    background: #000;
    border: 1px solid #444;
    color: #fff;
    text-align: center;
    padding: 4px;
    font-weight: bold;
    border-radius: 3px;
}
.btn-qtd-mini {
    background: #34495e; border: none; color: #fff;
    width: 24px; height: 24px; cursor: pointer; border-radius: 3px;
    font-weight: bold;
}
.btn-qtd-mini:hover { background: #455a64; }
.btn-max-mini {
    background: #e67e22; border: none; color: #fff;
    font-size: 0.75em; padding: 4px 8px; cursor: pointer; border-radius: 3px;
    margin-left: 4px; font-weight: bold;
}
.btn-max-mini:hover { background: #d35400; }

.info-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
}
.info-tempo { font-size: 0.85em; color: #f39c12; }
.info-chance { font-size: 0.8em; color: #7f8c8d; }
.info-chance.chance-alta { color: #2ecc71; }

.btn-craft-lista {
    background: linear-gradient(to bottom, #27ae60, #219150);
    border: none;
    color: white;
    padding: 8px 0;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    font-size: 0.95em;
    box-shadow: 0 3px 0 #145a32;
    width: 100%;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
.btn-craft-lista:hover { filter: brightness(1.1); }
.btn-craft-lista:active { transform: translateY(2px); box-shadow: none; }
.btn-craft-lista:disabled {
    background: #555;
    box-shadow: none;
    cursor: not-allowed;
    opacity: 0.7;
    transform: none;
}

/* FILA DE PRODUÇÃO */
.fila-producao {
    margin-top: 20px;
    background: #2c3e50;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #34495e;
    box-shadow: 0 -4px 15px rgba(0,0,0,0.3);
}
.fila-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.fila-header h4 { margin: 0; color: #e67e22; }
.fila-detalhes-texto { font-size: 0.9em; color: #bdc3c7; }

.barra-progresso-container {
    height: 24px;
    background: #000;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    margin: 10px 0;
    border: 1px solid #34495e;
}
.barra-progresso-fill {
    height: 100%;
    background: linear-gradient(90deg, #e67e22, #d35400);
    transition: width 1s linear;
}
.texto-progresso {
    position: absolute;
    top: 0; left: 0; right: 0;
    text-align: center;
    font-size: 0.85em;
    line-height: 24px;
    text-shadow: 0 0 3px #000;
    font-weight: bold;
}
.botoes-fila { display: flex; gap: 10px; justify-content: flex-end; }
.botoes-fila button { padding: 6px 12px; border: none; cursor: pointer; border-radius: 4px; font-size: 0.85em; color: #fff; font-weight: bold; }
.btn-cancelar { background: #c0392b; box-shadow: 0 3px 0 #922b21; }
.btn-cancelar:active { transform: translateY(2px); box-shadow: none; }
.btn-acelerar { background: #f1c40f; color: #000 !important; box-shadow: 0 3px 0 #d4ac0d; }
.btn-acelerar:active { transform: translateY(2px); box-shadow: none; }

/* Responsividade Mobile */
@media(max-width: 768px) {
    .header-lista { display: none; }
    .card-receita-row {
        grid-template-columns: 1fr;
        gap: 15px;
        padding: 15px;
    }
    .receita-acao { align-items: stretch; flex-direction: column; width: 100%; gap: 10px; border-top: 1px solid #333; padding-top: 10px; }
    .controle-qtd { justify-content: space-between; }
    .info-meta { flex-direction: row; justify-content: space-between; align-items: center; }
}
/* Container do ícone + valor */
.stat-item-img {
    display: inline-flex;
    align-items: center;
    background: rgba(255,255,255,0.05); /* Cor neutra de fundo */
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #444;
    cursor: pointer; /* Mãozinho para indicar clique */
    transition: background 0.2s;
}
.stat-item-img:hover {
    background: rgba(255,255,255,0.15); /* Realce ao passar o mouse */
}

/* A imagem do ícone */
.icone-atributo-mini {
    height: 1.1em; /* Tamanho relativo à fonte para ficar alinhado */
    width: auto;
    margin-right: 4px;
    vertical-align: middle;
    filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5));
}

/* O texto do valor */
.valor-atributo {
    font-weight: bold;
    color: #ecf0f1; font-size: 0.9em;
}

/* A caixinha do Tooltip Flutuante */
.tooltip-custom {
    position: fixed; /* Fica fixo na tela nas coordenadas X/Y */
    z-index: 9999; /* Fica por cima de tudo */
    background: #2c3e50;
    color: #ecf0f1;
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid #34495e;
    box-shadow: 2px 2px 10px rgba(0,0,0,0.5);
    font-size: 0.85em;
    pointer-events: none; /* O mouse ignora o tooltip, para não atrapalhar o clique de fechar */
    white-space: nowrap;
}


.img-wrapper-moderno {
    position: relative;
    width: 50px;
    height: 50px;
    background: rgba(0,0,0,0.5);
    border-radius: 8px;
    border: 1px solid #555;
    padding: 4px;
    flex-shrink: 0;
}
.icon-receita-grande { width: 100%; height: 100%; object-fit: contain; }
.qtd-badge {
    position: absolute; top: -5px; left: -5px;
    background: #34495e; color: #fff;
    font-size: 0.7em; padding: 2px 5px; border-radius: 4px;
    border: 1px solid #7f8c8d;
}
.textos-identidade { display: flex; flex-direction: column; gap: 2px; }
.titulo-row { display: flex; align-items: center; gap: 8px; }
.titulo-row h4 { margin: 0; color: #ecf0f1; font-size: 1em; }
.tag-tipo { font-size: 0.65em; background: #000; padding: 2px 4px; border-radius: 3px; color: #95a5a6; }
.desc-moderna { font-size: 0.8em; color: #7f8c8d; font-style: italic; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }


/* 2. ÁREA DE STATS (Meio - O Grid Mágico) */
.stat-box-moderno {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #2c3e50;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid #34495e;
    cursor: help;
    transition: background 0.2s;
}
.stat-box-moderno:hover { background: #34495e; border-color: #95a5a6; }
.icon-stat-micro { width: 14px; height: 14px; }
.valor-stat-moderno { font-size: 0.85em; font-weight: bold; color: #bdc3c7; }
.sem-stats { font-size: 0.8em; color: #555; width: 100%; text-align: center; }

.card-receita-moderno {
    display: flex;
    flex-direction: column; /* Agora é uma coluna (Topo em cima do corpo) */
    background: linear-gradient(90deg, #1e272e 0%, #252f38 100%);
    margin-bottom: 12px;
    border: 1px solid #34495e;
    border-radius: 10px;
    padding: 8px 12px;
    position: relative;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    transition: all 0.2s;
}
.card-receita-moderno:hover {
    border-color: #f39c12;
    transform: translateY(-2px);
}

/* LINHA 1: TOPO */
.linha-topo-card {
    display: flex;
    justify-content: space-between;
    align-items: center; /* Centraliza verticalmente nome e custos */
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-bottom: 5px;
    gap: 10px; /* Espaço mínimo entre nome e custos */
}
.nome-item-topo {
    margin: 0;
    font-size: 0.9em;
    color: #f39c12;
    text-transform: uppercase;
    letter-spacing: 1px;
    white-space: nowrap; /* Impede que o nome quebre em duas linhas */
    flex-shrink: 0; /* Impede que o nome seja esmagado pelos custos */
}
.lista-custos-mini { 
    display: flex; 
    flex-wrap: nowrap; /* OBRIGATÓRIO: Impede quebrar linha */
    justify-content: flex-end; /* Alinha à direita */
    align-items: center;
    gap: 4px; 
    
    /* Se tiver muitos recursos, permite rolar pro lado em vez de quebrar */
    overflow-x: auto; 
    max-width: 100%; 
    
    /* Esconde a barra de rolagem (estética) */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE/Edge */
}
.lista-custos-mini::-webkit-scrollbar {
    display: none;
}
.custo-item-mini {
    display: flex; align-items: center; gap: 3px;
    background: #111; padding: 2px 6px; border-radius: 3px;
    font-size: 0.75em; color: #aaa; border: 1px solid #333;
    flex-shrink: 0; /* Garante que o item de custo não amasse */
}
.custo-item-mini.vermelho { color: #e74c3c; border-color: #e74c3c; }
.icon-custo-micro { 
    width: 14px; 
    height: 14px;
    min-width: 14px; /* OBRIGATÓRIO: Impede o navegador de esmagar o ícone para 0px */
    object-fit: contain; 
    flex-shrink: 0; 
    display: block;
    background-color: rgba(0,0,0,0.2); /* Fundo escuro sutil para ver se a imagem quebrou */
    border-radius: 50%;
}


/* LINHA 2: CORPO */
.linha-corpo-card {
    display: flex;
    align-items: center;
    gap: 12px;
}

/* FOTO */
.img-wrapper-moderno {
    position: relative;
    width: 50px;
    height: 50px;
    background: rgba(0,0,0,0.5);
    border-radius: 8px;
    border: 1px solid #555;
    padding: 4px;
    flex-shrink: 0;
}
.icon-receita-grande { width: 100%; height: 100%; object-fit: contain; }
.qtd-badge {
    position: absolute; top: -5px; left: -5px;
    background: #34495e; color: #fff;
    font-size: 0.7em; padding: 2px 5px; border-radius: 4px;
    border: 1px solid #7f8c8d;
}

/* MEIO (STATS + DESC) */
.coluna-meio {
    flex: 1; /* Ocupa o espaço que sobrar */
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.icon-stat-micro { width: 14px; height: 14px; }
.coluna-meio {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px; /* Espaço entre stats e descrição */
    padding: 0 10px; /* Um pouco de respiro nas laterais */
}

.area-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* MUDANÇA: 3 Colunas iguais */
    gap: 2px 8px; /* Gap menor para caber melhor em 3 colunas */
    background: rgba(0,0,0,0.2);
    padding: 6px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.05);
}

.stat-row-detalhado {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.8em; /* Fonte pequena para caber */
    color: #bdc3c7;
}

.icon-stat-micro { 
    width: 14px; 
    height: 14px; 
    opacity: 0.9;
}

.nome-stat-texto {
    color: #95a5a6;
    white-space: nowrap; /* Não quebra linha no nome */
}

.valor-stat-destaque {
    color: #ecf0f1;
    font-weight: bold;
    margin-left: 4px; /* MUDANÇA: Apenas um espacinho, sem jogar pra direita absoluta */
}

.sem-stats { 
    grid-column: span 2; /* Ocupa as 2 colunas se não tiver nada */
    text-align: center; 
    font-size: 0.8em; 
    color: #555; 
    padding: 5px;
}

/* Mobile: Em celular muito estreito, vira 1 coluna só */
@media(max-width: 500px) {
    .area-stats-grid { grid-template-columns: 1fr; }
}
.desc-moderna { 
    font-size: 0.75em; color: #666; font-style: italic; 
    display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1;
    -webkit-box-orient: vertical; overflow: hidden; 
}

/* DIREITA (CONTROLES) */
.controles-finais {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}
.grupo-botoes-acao {
    display: flex;
    align-items: center;
    gap: 8px;
}
.tempo-estimado { font-size: 0.7em; color: #f39c12; margin-right: 2px; }

/* INPUT E BOTOES */
.input-group-moderno {
    display: flex;
    align-items: center;
    background: #000;
    border-radius: 20px;
    border: 1px solid #444;
    overflow: hidden;
}
.input-group-moderno input {
    width: 70px; /* AUMENTADO PARA 60px (cabe 6 digitos) */
    background: transparent; 
    border: none;
    color: white; 
    text-align: center; 
    font-weight: bold; 
    font-size: 0.9em;
}

/* REMOVER SETAS DO INPUT (CHROME/SAFARI/EDGE) */
.input-group-moderno input::-webkit-outer-spin-button,
.input-group-moderno input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
/* REMOVER SETAS DO INPUT (FIREFOX) */
.input-group-moderno input[type=number] {
  -moz-appearance: textfield;
}

.btn-mini {
    background: #34495e; border: none; color: #fff;
    width: 24px; height: 24px; cursor: pointer;
    font-weight: bold;
}
.btn-mini:hover { background: #455a64; }

.btn-forjar-redondo {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #e67e22, #d35400);
    color: white;
    font-size: 1.1em;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 10px rgba(230, 126, 34, 0.4);
    transition: all 0.2s;
}
.btn-forjar-redondo:hover:not(:disabled) { transform: scale(1.1); }
.btn-forjar-redondo:active:not(:disabled) { transform: scale(0.95); }
.btn-forjar-redondo:disabled { background: #555; cursor: not-allowed; opacity: 0.5; box-shadow: none; }

/* Mobile */
@media(max-width: 768px) {
    .linha-corpo-card { flex-wrap: wrap; }
    .coluna-meio { min-width: 100%; order: 3; } /* Joga a desc pra baixo em mobile */
}

/* Custos */
.lista-custos-mini { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px; }
.custo-item-mini {
    display: flex; align-items: center; gap: 3px;
    background: #111; padding: 2px 6px; border-radius: 3px;
    font-size: 0.75em; color: #aaa; border: 1px solid #333;
}
.custo-item-mini.vermelho { color: #e74c3c; border-color: #e74c3c; }
.icon-custo-micro { width: 12px; height: 12px; }

/* Controles */
.controles-finais {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 4px;
}
.input-group-moderno {
    display: flex;
    align-items: center;
    background: #000;
    border-radius: 20px; /* Arredondado */
    border: 1px solid #444;
    overflow: hidden;
}
.input-group-moderno input {
    width: 35px; background: transparent; border: none;
    color: white; text-align: center; font-weight: bold; font-size: 0.9em;
}
.btn-mini {
    background: #34495e; border: none; color: #fff;
    width: 24px; height: 24px; cursor: pointer;
    font-weight: bold;
}
.btn-mini:hover { background: #455a64; }

/* O BOTÃO REDONDO */
.btn-forjar-redondo {
    width: 42px;
    height: 42px;
    border-radius: 50%; /* Perfeitamente redondo */
    border: none;
    background: linear-gradient(135deg, #e67e22, #d35400);
    color: white;
    font-size: 1.2em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(230, 126, 34, 0.4);
    transition: all 0.2s;
}
.btn-forjar-redondo:hover:not(:disabled) {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 6px 15px rgba(230, 126, 34, 0.6);
}
.btn-forjar-redondo:active:not(:disabled) {
    transform: scale(0.95);
}
.btn-forjar-redondo:disabled {
    background: #555;
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.5;
}
.tempo-estimado { font-size: 0.75em; color: #f39c12; margin-top: -2px; }

/* Responsividade Mobile */
@media(max-width: 768px) {
    .card-receita-moderno { flex-direction: column; align-items: stretch; gap: 10px; }
    .area-identidade, .area-stats-grid, .area-acao-moderna { width: 100%; border: none; padding: 0; }
    .area-acao-moderna { flex-direction: row; justify-content: space-between; align-items: center; border-top: 1px solid #333; padding-top: 8px; }
    .titulo-row { flex-grow: 1; }
}
</style>