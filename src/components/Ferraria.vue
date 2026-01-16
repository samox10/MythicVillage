<script setup>
import { ref, computed } from 'vue';
import { jogo, acoes, dadosItens, obterBuffRaca } from '../jogo.js';

// --- ESTADO LOCAL ---
const qtdsPorItem = ref({}); // Armazena a quantidade digitada para cada item (ex: { 'espada': 10 })

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
            <h2>⚒️ Grande Forja</h2>
        </div>
        <div class="info-nivel">
            <span class="badge-nivel" style="background: #d35400;">Nv {{ jogo.ferraria }}</span>
        </div>
    </div>

    <div class="secao-ferreiro-destaque">
        <div v-if="ferreiroAtivo" class="card-funcionario ferreiro-ativo" :style="{ borderColor: corTier(ferreiroAtivo.tier) }">
            <div class="card-topo" :style="{ backgroundColor: corTier(ferreiroAtivo.tier) }">
                <span class="tier-badge">{{ ferreiroAtivo.tier }}</span>
                <span class="card-nome">{{ ferreiroAtivo.nome }}</span>
                <span class="tag-cargo">Mestre Ferreiro</span>
            </div>
            <div class="card-mid">
                <img :src="`/assets/faces/${ferreiroAtivo.raca}/${ferreiroAtivo.imagem}.png`" class="avatar-func">
                <div class="stats-ferreiro">
                    <div class="stat-row">
                        <span class="label">Velocidade:</span>
                        <span class="valor verde">+{{ statsFerreiro.tempo }}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="label">Qualidade:</span>
                        <span class="valor ouro">+{{ statsFerreiro.falha }}% Redução de Falha</span>
                    </div>
                    <div class="stat-desc">
                        "Com meu martelo, forjo o destino!"
                    </div>
                </div>
            </div>
        </div>
        
        <div v-else class="vazio-ferreiro">
            <div class="msg-vazio">
                🚫 NENHUM FERREIRO ALOCADO<br>
                <span class="sub-msg">Contrate um na Taverna para reduzir tempo e evitar falhas (quebras).</span>
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
            <div v-for="item in dadosItens" :key="item.id" class="card-receita-row">
                
                <div class="receita-info">
                    <div class="img-wrapper">
                        <img :src="item.img" class="icon-receita">
                        <span class="qtd-possuida">{{ jogo.itens[item.id] || 0 }} em estoque</span>
                    </div>
                    
                    <div class="textos-receita">
                        <h4>{{ item.nome }}</h4>
                        
                        <div class="stats-badges">
                             <span v-if="item.tipo" class="badge-tipo">
                                {{ item.tipo.toUpperCase() }}
                            </span>
                            <span v-if="item.ataque" class="badge-stat ataque" title="Ataque">
                                ⚔️ {{ item.ataque }}
                            </span>
                            <span v-if="item.defesa" class="badge-stat defesa" title="Defesa">
                                🛡️ {{ item.defesa }}
                            </span>
                        </div>
                        <div class="desc-simples">{{ item.desc }}</div>
                    </div>
                </div>

                <div class="receita-custos">
                    <div v-for="(qtd, rec) in item.custo" :key="rec" class="custo-pill"
                         :class="{ 'falta-recurso': (jogo.minerios[rec]||jogo[rec]||0) < (qtd * getQtd(item.id)) }">
                        <img :src="`/assets/recursos/min_${rec}.png`" @error="$event.target.src='/assets/ui/icone_madeira.png'" class="icon-micro">
                        <span>{{ qtd }}</span>
                        <span v-if="getQtd(item.id) > 1" class="subtotal">
                            (Tot: {{ qtd * getQtd(item.id) }})
                        </span>
                    </div>
                </div>

                <div class="receita-acao">
                    
                    <div class="controle-qtd">
                        <button class="btn-qtd-mini" @click="setQtd(item.id, getQtd(item.id) - 1)">-</button>
                        <input type="number" 
                               :value="getQtd(item.id)" 
                               @input="e => setQtd(item.id, e.target.value, getMaxCraft(item))"
                               min="1" 
                               :max="getMaxCraft(item)">
                        <button class="btn-qtd-mini" @click="setQtd(item.id, getQtd(item.id) + 1, getMaxCraft(item))">+</button>
                        <button class="btn-max-mini" @click="setQtd(item.id, getMaxCraft(item))">MAX</button>
                    </div>

                    <div class="info-meta">
                        <span class="info-tempo">⏳ {{ getTempoCraft(item, getQtd(item.id)) }}</span>
                        <span class="info-chance" :class="{ 'chance-alta': parseFloat(getChanceSucesso()) > 90 }">
                            {{ getChanceSucesso() }}% Sucesso
                        </span>
                    </div>

                    <button class="btn-craft-lista" 
                            :disabled="!!jogo.craftando.item || getQtd(item.id) > getMaxCraft(item) || getQtd(item.id) < 1"
                            @click="fabricarItemDaLista(item)">
                        🔨 FORJAR
                    </button>
                </div>

            </div>
        </div>
    </div>

    <div v-if="jogo.craftando.item" class="fila-producao">
        <div class="fila-header">
            <h4>🔥 Forja em atividade...</h4>
            <div class="fila-detalhes-texto">
                Lote: <strong>{{ jogo.craftando.qtdLote }}x</strong> 
                (Risco: {{ (jogo.craftando.chanceFalha * 100).toFixed(1) }}%)
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
.secao-ferreiro-destaque {
    margin: 20px 0;
    display: flex;
    justify-content: center;
}
.ferreiro-ativo {
    width: 100%;
    max-width: 400px;
    background: #2c3e50;
    border-width: 2px;
    border-style: solid;
    display: flex;
    flex-direction: column;
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
.card-receita-row {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1.2fr;
    background: #1e272e;
    margin-bottom: 8px;
    border: 1px solid #2c3e50;
    border-radius: 6px;
    align-items: center;
    padding: 12px;
    transition: transform 0.2s, border-color 0.2s, background-color 0.2s;
}
.card-receita-row:hover {
    border-color: #e67e22;
    background: #252f38;
}

/* COLUNA 1: INFO */
.receita-info {
    display: flex;
    align-items: center;
    gap: 15px;
}
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
.badge-stat.ataque { background: #c0392b; color: #fff; }
.badge-stat.defesa { background: #2980b9; color: #fff; }
.badge-tipo { font-size: 0.75em; background: #34495e; padding: 2px 5px; border-radius: 3px; color: #bdc3c7; font-weight: bold; }
.desc-simples { font-size: 0.85em; color: #7f8c8d; font-style: italic; margin-top: 4px; }

/* COLUNA 2: CUSTOS */
.receita-custos {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
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

/* COLUNA 3: AÇÃO */
.receita-acao {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
}
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
</style>