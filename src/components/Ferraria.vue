<script setup>
// CORREÇÃO 1: Adicionado 'reactive' na importação
import { ref, computed, reactive } from 'vue';
import { jogo, acoes, dadosItens } from '../jogo.js';

const filtroAtual = ref('todos');

// Estado local para controlar a quantidade selecionada
const quantidadesSelecionadas = reactive({});

// Função auxiliar para iniciar o contador se não existir
const getQtdSelecionada = (id) => {
    // CORREÇÃO 2: Corrigido o nome da variável (estava quantitiesSelecionadas)
    if (!quantidadesSelecionadas[id]) quantidadesSelecionadas[id] = 1;
    return quantidadesSelecionadas[id];
};

// Funções de controle (+ e -)
const alterarQtd = (id, delta) => {
    const atual = quantidadesSelecionadas[id] || 1;
    const novo = atual + delta;
    if (novo >= 1) quantidadesSelecionadas[id] = novo;
};

const itensFiltrados = computed(() => {
    if (filtroAtual.value === 'todos') return dadosItens;
    return dadosItens.filter(i => i.tipo === filtroAtual.value);
});
const custoAcelerar = computed(() => {
    if (!jogo.craftando.item) return 0;
    const minutos = Math.ceil(jogo.craftando.tempoRestante / 60);
    return minutos * 1000;
});

// --- Ícones de Recursos ---
const getIconeRecurso = (id) => {
    const basicos = ['madeira', 'couro', 'comida', 'ouro'];
    // Ajuste aqui se sua pasta se chama 'recursos' ou se as imagens estão na raiz de assets
    if (basicos.includes(id)) return `/assets/recursos/res_${id}.png`; 
    return `/assets/recursos/min_${id}.png`; // Se você moveu minérios para craft ou resources, ajuste aqui
};

// --- Ícones de Stats ---
const getIconeStat = (stat) => {
    const mapa = {
        ataque: '/assets/ui/icone_ataque.png',
        defesa: '/assets/ui/icone_defesa.png',
        vida: '/assets/ui/icone_vida.png',
        precisao: '/assets/ui/icone_precisao.png',
        evasao: '/assets/ui/icone_evasao.png',
        agilidade: '/assets/ui/icone_evasao.png',
        danocritico: '/assets/ui/icone_danocritico.png',
        chancecritico: '/assets/ui/icone_chancecritico.png',
        dano: '/assets/ui/icone_ataque.png' 
    };
    return mapa[stat] || null;
};

// Placeholder para imagem grande
const getImagemItemGrande = (item) => item.img || '/assets/ui/icone_ataque.png';

const getQuantidade = (nomeRecurso) => {
    if (jogo.minerios && jogo.minerios[nomeRecurso] !== undefined) return jogo.minerios[nomeRecurso];
    if (jogo[nomeRecurso] !== undefined) return jogo[nomeRecurso];
    return 0;
};

// VALIDAR SE PODE CRAFTAR
const podeCraftar = (item) => {
    const qtd = quantidadesSelecionadas[item.id] || 1;
    return Object.keys(item.custo).every(rec => {
        return getQuantidade(rec) >= (item.custo[rec] * qtd);
    });
};

const temRecursoSuficiente = (rec, custoUnitario, idItem) => {
    const qtd = quantidadesSelecionadas[idItem] || 1;
    return getQuantidade(rec) >= (custoUnitario * qtd);
};

const formatarTempo = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
};
</script>

<template>
  <div class="ferraria-container">
    
    <div v-if="jogo.ferraria === 0" class="construcao-card destaque-ferraria">
      <h4>⚔️ Construir Ferraria</h4>
      <p>Necessário para forjar equipamentos.</p>
      <div class="aviso-construcao">Vá até a aba <strong>CIDADE</strong>.</div>
    </div>

    <div v-else>
        <div class="header-ferraria">
            <h3>⚔️ Ferraria Nível {{ jogo.ferraria }}</h3>
        </div>

        <div class="status-forja" :class="{'ativo': jogo.craftando.item}">
            <div v-if="jogo.craftando.item">
                <div class="info-status">
                    
                    <span class="texto-produzindo">
                        🔥 Produzindo: 
                        <strong>
                            {{ (jogo.craftando.qtdLote > 1 ? jogo.craftando.qtdLote + 'x ' : '') + 
                               (dadosItens.find(i => i.id === jogo.craftando.item)?.nome || '...') }}
                        </strong>
                    </span>
                    <div class="status-actions">
                        <small class="tempo-restante">{{ formatarTempo(jogo.craftando.tempoRestante) }}</small>
                        
                        <button 
                            class="btn-acelerar" 
                            @click="acoes.acelerarCraft()" 
                            :title="'Pagar ' + custoAcelerar + ' ouro'"
                            :disabled="jogo.ouro < custoAcelerar"
                        >
                            ⚡ {{ custoAcelerar }}
                        </button>

                        <button class="btn-cancelar-mini" @click="acoes.cancelarCraft()" title="Cancelar">✖</button>
                    </div>
                </div>
                
                <div class="barra-fundo">
                    <div class="barra-progresso" :style="{width: (100 - (jogo.craftando.tempoRestante / jogo.craftando.tempoTotal * 100)) + '%'}"></div>
                </div>
            </div>
            <div v-else>❄️ Forja Livre</div>
        </div>

        <div class="filtros-container">
            <span class="label-filtro">Categoria:</span>
            <select v-model="filtroAtual">
                <option value="todos">Todos</option>
                <option value="arma">⚔️ Armas</option>
                <option value="armadura">🛡️ Armaduras</option>
                <option value="municao">🏹 Munição</option>
            </select>
        </div>

        <div class="lista-receitas">
            <div v-for="item in itensFiltrados" :key="item.id" class="item-card" 
                 :class="{ 'bloqueado': item.reqNivel > jogo.ferraria }">
                
                <div class="card-header">
                    <span class="item-nome">{{ item.nome }}</span>
                    <span v-if="item.reqNivel > jogo.ferraria" class="lock-tag">🔒 Nv {{ item.reqNivel }}</span>
                </div>

                <div class="card-body">
                    <div class="item-visual-box">
                        <img :src="getImagemItemGrande(item)" class="img-destaque" alt="Item">
                    </div>
                    <div class="item-stats-list">
                        <div v-if="item.stats">
                            <div v-for="(val, key) in item.stats" :key="key" class="stat-row">
                                <img v-if="getIconeStat(key)" :src="getIconeStat(key)" class="icon-stat-list">
                                <span v-else>{{ key }}:</span>
                                <strong class="stat-value" :class="val > 0 ? 'pos' : 'neg'">{{ val }}</strong>
                            </div>
                        </div>
                        <div v-else class="sem-stats">Recurso</div>
                    </div>
                </div>

                <div class="card-footer" v-if="item.reqNivel <= jogo.ferraria">
                    
                    <div class="info-craft-row">
                        <div class="recursos-necessarios">
                            <div v-for="(qtd, rec) in item.custo" :key="rec" 
                                 class="mini-custo"
                                 :class="{ 'falta': !temRecursoSuficiente(rec, qtd, item.id) }"
                                 :title="'Custo Total: ' + (qtd * (quantidadesSelecionadas[item.id] || 1))">
                                <img :src="getIconeRecurso(rec)">
                                <span>{{ qtd * (quantidadesSelecionadas[item.id] || 1) }}</span>
                            </div>
                        </div>
                        <div class="tempo-info">
                            ⏱️ {{ formatarTempo(item.tempo * (quantidadesSelecionadas[item.id] || 1)) }}
                        </div>
                    </div>

                    <div class="action-row">
                        <div class="selector-qtd-group">
                            <button class="btn-qtd side-l" @click="alterarQtd(item.id, -10)">-10</button>
                            <button class="btn-qtd" @click="alterarQtd(item.id, -1)">-</button>
                            
                            <span class="num-qtd">{{ quantidadesSelecionadas[item.id] || 1 }}</span>
                            
                            <button class="btn-qtd" @click="alterarQtd(item.id, 1)">+</button>
                            <button class="btn-qtd side-r" @click="alterarQtd(item.id, 10)">+10</button>
                        </div>

                        <button 
                            v-if="jogo.craftando.item === item.id"
                            class="btn-action btn-cancelar"
                            @click="acoes.cancelarCraft()"
                            title="Cancelar Produção"
                        >
                            ✖ Cancelar
                        </button>

                        <button 
                            v-else-if="jogo.craftando.item"
                            class="btn-action"
                            disabled
                        >
                            ⏳ Ocupado
                        </button>

                        <button 
                            v-else
                            class="btn-action btn-forjar"
                            @click="acoes.fabricarItem(item, quantidadesSelecionadas[item.id] || 1)"
                            :disabled="!podeCraftar(item)"
                        >
                            🔨 Forjar
                        </button>
                    </div>

                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
/* =========================================
   1. ESTRUTURA E CABEÇALHO
   ========================================= */
.ferraria-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.header-ferraria { 
    background: #2c3e50; 
    color: white; 
    padding: 12px; 
    border-radius: 8px; 
    text-align: center; 
    box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
}

.aviso-construcao { 
    background: #fdedec; 
    color: #c0392b; 
    padding: 10px; 
    border-radius: 5px; 
    margin-top: 10px; 
    font-size: 0.9em; 
    border: 1px solid #fab1a0; 
}

/* =========================================
   2. STATUS DA FORJA (BARRA DE PROGRESSO)
   ========================================= */
.status-forja { 
    background: white; 
    padding: 12px; 
    border-radius: 8px; 
    border: 1px solid #ddd; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.05); 
}

.status-forja.ativo { 
    border-color: #f39c12; 
    background: #fef9e7; 
}

.info-status { 
    display: flex; 
    justify-content: space-between; /* Separa Texto <--> Botões */
    align-items: center; 
    margin-bottom: 8px; /* Um pouco mais de espaço pra barra */
    font-size: 0.9em; 
    flex-wrap: wrap; /* Garante que não quebre em celular muito pequeno */
    gap: 10px;
}

.status-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}
.texto-produzindo {
    color: #d35400; /* Um tom alaranjado para combinar com o tema */
    font-size: 1.05em;
}

.tempo-restante {
    font-weight: bold;
    color: #555;
}

.barra-fundo { 
    height: 6px; 
    background: #eee; 
    border-radius: 3px; 
    overflow: hidden; 
}

.barra-progresso { 
    height: 100%; 
    background: #f39c12; 
    transition: width 1s linear; 
}

/* Botão X pequeno para cancelar no status */
.btn-cancelar-mini {
    background: #c0392b; 
    color: white; 
    border: none; 
    width: 20px; 
    height: 20px; 
    border-radius: 50%; 
    font-size: 0.7em; 
    cursor: pointer; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    transition: background 0.2s;
}
.btn-cancelar-mini:hover { background: #a93226; }

/* Botão Acelerar (Dourado/Premium) */
.btn-acelerar {
    background: #f1c40f; 
    color: #2c3e50;
    border: 1px solid #d4ac0d;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 0.8em;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
    box-shadow: 0 2px 0 #b7950b;
}
.btn-acelerar:hover:not(:disabled) { background: #f4d03f; transform: translateY(-1px); }
.btn-acelerar:active:not(:disabled) { transform: translateY(1px); box-shadow: none; }
.btn-acelerar:disabled { background: #eee; color: #aaa; border-color: #ddd; box-shadow: none; cursor: not-allowed; }

/* =========================================
   3. FILTROS
   ========================================= */
.filtros-container { 
    display: flex; 
    align-items: center; 
    gap: 10px; 
    justify-content: flex-end; 
}

.label-filtro { 
    font-size: 0.9em; 
    color: #7f8c8d; 
    font-weight: bold; 
}

.filtros-container select { 
    padding: 6px 10px; 
    border-radius: 20px; 
    border: 1px solid #bdc3c7; 
    background: white; 
    color: #2c3e50; 
    font-weight: bold; 
    cursor: pointer; 
    outline: none; 
}

/* =========================================
   4. LISTA E CARDS (ESTRUTURA)
   ========================================= */
.lista-receitas { 
    display: flex; 
    flex-direction: column; 
    gap: 12px; 
}

.item-card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    transition: transform 0.2s;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.item-card.bloqueado { 
    opacity: 0.6; 
    background: #f9f9f9; 
    pointer-events: none; 
}

/* =========================================
   5. CONTEÚDO DO CARD (HEADER/BODY)
   ========================================= */
.card-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    border-bottom: 1px solid #f0f0f0; 
    padding-bottom: 8px; 
}

.item-nome { 
    font-size: 1.1em; 
    font-weight: bold; 
    color: #2c3e50; 
}

.lock-tag { 
    font-size: 0.8em; 
    color: #c0392b; 
    background: #fdedec; 
    padding: 2px 8px; 
    border-radius: 10px; 
    font-weight: bold; 
}

.card-body { 
    display: flex; 
    gap: 15px; 
    align-items: center; 
}

.item-visual-box {
    width: 60px;
    height: 60px;
    background: #f4f6f7;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ecf0f1;
    flex-shrink: 0;
}

.img-destaque { 
    width: 40px; 
    height: 40px; 
    object-fit: contain; 
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1)); 
}

.item-stats-list { 
    flex: 1; 
    display: flex; 
    flex-direction: column; 
    gap: 4px; 
}

.stat-row { 
    display: flex; 
    align-items: center; 
    gap: 6px; 
    font-size: 0.9em; 
    color: #34495e; 
}

.icon-stat-list { width: 16px; height: 16px; object-fit: contain; }
.stat-value.pos { color: #27ae60; font-weight: bold; }
.stat-value.neg { color: #c0392b; font-weight: bold; }
.sem-stats { font-style: italic; color: #95a5a6; font-size: 0.85em; }

/* =========================================
   6. RODAPÉ DO CARD (CUSTOS E AÇÕES)
   ========================================= */
.card-footer { 
    display: flex; 
    flex-direction: column; 
    gap: 10px; 
    margin-top: 5px; 
}

/* Linha de Custos */
.info-craft-row {
    background: #f8f9fa; 
    border: 1px solid #eee; 
    border-radius: 8px;
    padding: 6px 10px; 
    display: flex; 
    justify-content: space-between; 
    align-items: center;
}

.recursos-necessarios { display: flex; gap: 10px; flex-wrap: wrap; }
.mini-custo { display: flex; align-items: center; gap: 4px; font-size: 0.9em; font-weight: bold; color: #555; }
.mini-custo img { width: 18px; height: 18px; }
.mini-custo.falta { color: #e74c3c; opacity: 1; }
.tempo-info { font-size: 0.85em; color: #7f8c8d; font-weight: bold; }

/* Linha de Controles */
.action-row { 
    display: flex; 
    gap: 10px; 
    align-items: center; 
    justify-content: space-between;
}

/* =========================================
   7. SELETOR DE QUANTIDADE
   ========================================= */
.selector-qtd-group {
    display: flex;
    align-items: center;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fff;
    overflow: hidden;
    height: 36px;
}

.btn-qtd {
    background: #f9f9f9;
    border: none;
    padding: 0 10px;
    height: 100%;
    cursor: pointer;
    font-weight: bold;
    font-size: 0.9em;
    border-right: 1px solid #eee;
    color: #555;
    transition: background 0.2s;
}
.btn-qtd:hover { background: #e0e0e0; }
.btn-qtd:last-child { border-right: none; }

.btn-qtd.mini { background: #f0f0f0; color: #777; font-size: 0.8em; }

.num-qtd { 
    padding: 0 12px; 
    font-weight: bold; 
    min-width: 30px; 
    text-align: center; 
    color: #2c3e50; 
    border-right: 1px solid #eee;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* =========================================
   8. BOTÕES DE AÇÃO (FORJAR/CANCELAR)
   ========================================= */
.btn-action {
    height: 36px;
    padding: 0 20px;
    border-radius: 6px;
    border: none;
    font-weight: bold;
    cursor: pointer;
    font-size: 0.95em;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.1s;
    box-shadow: 0 2px 0 rgba(0,0,0,0.1);
    color: white;
}

/* Verde - Forjar */
.btn-forjar {
    background: #27ae60;
    box-shadow: 0 3px 0 #219150;
}
.btn-forjar:active { transform: translateY(2px); box-shadow: none; }
.btn-forjar:disabled { background: #bdc3c7; box-shadow: none; cursor: not-allowed; }

/* Vermelho - Cancelar */
.btn-cancelar {
    background: #c0392b;
    box-shadow: 0 3px 0 #96281b;
}
.btn-cancelar:active { transform: translateY(2px); box-shadow: none; }

/* =========================================
   9. RESPONSIVIDADE (CORREÇÃO PARA CELULAR)
   ========================================= */
@media (max-width: 600px) {
    /* Diminui o espaço entre o seletor e o botão forjar */
    .action-row {
        gap: 6px; 
    }

    /* Força o seletor a tentar caber no espaço disponível */
    .selector-qtd-group {
        flex: 1; /* Ocupa todo espaço sobrando */
        min-width: 0; /* Permite encolher abaixo do conteúdo se necessário */
    }

    /* Reduz drasticamente o espaçamento interno dos botões */
    .btn-qtd {
        padding: 0 4px; /* Era 10px, agora é 4px para caber */
        font-size: 0.85em; /* Letra um pouco menor */
        flex: 1; /* Distribui o espaço igualmente entre os botões */
    }

    /* Ajusta o número central */
    .num-qtd {
        padding: 0 6px;
        min-width: 25px;
        font-size: 0.9em;
    }

    /* Ajusta o botão de forjar/cancelar para ser mais compacto */
    .btn-action {
        padding: 0 12px;
        font-size: 0.9em;
        white-space: nowrap; /* Impede que o texto "Forjar" quebre linha */
    }
}
</style>