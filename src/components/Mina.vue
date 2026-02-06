<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { jogo, acoes, calcularProducaoPorMinuto, obterBuffRaca } from '../jogo.js';
import { tabelaMinerais } from '../dados.js';
import { formatarNumero, getImagemMinerio } from '../utilidades.js';

const mostrarBotaoTopo = ref(false);
    // Função que verifica a posição da tela
    const verificarScroll = () => {
        // Se desceu mais que 300 pixels, mostra o botão
        mostrarBotaoTopo.value = window.scrollY > 300;
    };
    // Quando a página carregar, começa a vigiar o scroll
    onMounted(() => {
        window.addEventListener('scroll', verificarScroll);
    });
    // Quando sair da página, para de vigiar (para não pesar o navegador)
    onUnmounted(() => {
        window.removeEventListener('scroll', verificarScroll);
    });
    // Função para rolar a janela até o topo suavemente
    const voltarAoTopo = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
// Controle do Modal de Seleção
const modalSelecao = ref(null); // Formato: { minerioId: 'cobre', slot: 0 }

// Lista de candidatos filtrada
const candidatosMineracao = computed(() => {
    if (!modalSelecao.value) return [];
    
    return jogo.funcionarios.filter(f => {
        // 1. Filtra por profissão
        if (f.profissao !== 'minerador') return false;
        
        const mIdAlvo = modalSelecao.value.minerioId;
        const slotAlvo = modalSelecao.value.slot;

        // Proteção contra leitura de undefined (Save antigo)
        const slotsAlvo = jogo.alocacaoMina[mIdAlvo];
        if (!slotsAlvo) return false;

        // 2. Verifica se já está neste exato slot
        const alocadoAqui = slotsAlvo[slotAlvo] === f.id;
        if (alocadoAqui) return true;

        // 3. Verifica se está livre (não alocado em nenhum outro lugar)
        let ocupado = false;
        Object.keys(jogo.alocacaoMina).forEach(mId => {
            if (jogo.alocacaoMina[mId]?.includes(f.id)) ocupado = true;
        });
        
        return !ocupado;
    }).sort((a, b) => b.bonus - a.bonus);
});

// Ações de Interface
const abrirSelecao = (minerioId, slotIdx) => {
    modalSelecao.value = { minerioId, slot: slotIdx };
};

const selecionarMinerador = (funcId) => {
    acoes.alocarMinerador(modalSelecao.value.minerioId, modalSelecao.value.slot, funcId);
    modalSelecao.value = null;
};

const removerMinerador = () => {
    acoes.desalocarMinerador(modalSelecao.value.minerioId, modalSelecao.value.slot);
    modalSelecao.value = null;
};

// Helpers de Exibição
const getFuncionarioNoSlot = (minerioId, slotIdx) => {
    const id = jogo.alocacaoMina[minerioId]?.[slotIdx];
    if (!id) return null;
    return jogo.funcionarios.find(f => f.id === id);
};

const isSlotBloqueado = (minerio, slotIdx) => {
    if (slotIdx === 0) return jogo.mina < minerio.nivel;
    if (minerio.id === 'pedra') return jogo.mina < 1; 
    return jogo.mina < (minerio.nivel + 1);
};
// --- CÁLCULOS VISUAIS (SISTEMA DA TAVERNA) ---

// 1. Calcula a produtividade TOTAL (O número grande, ex: 59%)
const getPctTotal = (func) => {
    if (!func) return 0;
    const bonusTier = func.bonus || 1;
    const pctRaca = obterBuffRaca(func) || 0;
    const multiRaca = 1 + (pctRaca / 100);
    
    const valorFinal = bonusTier * multiRaca;
    return Math.floor((valorFinal - 1) * 100);
};

// 2. Calcula a produtividade BASE (O número cinza, ex: 42%)
const getPctBase = (func) => {
    if (!func) return 0;
    const bonusTier = func.bonus || 1;
    return Math.floor((bonusTier - 1) * 100);
};

// 3. Calcula a Diferença visual (O número verde, ex: 17%)
// Isso garante que Base + Verde = Total sempre.
const getDiferencaPrefeito = (func) => {
    const total = getPctTotal(func);
    const base = getPctBase(func);
    return Math.max(0, total - base);
};

</script>

<template>
<div class="mythic-container">
    
    <div class="header-mina">
        <div class="titulo-nivel">
            <h2>⛏️ Mina Profunda</h2>
            
        </div>
        
        <div class="info-mina"><span class="badge-nivel">Nível {{ jogo.mina }}</span>
        </div>
    </div>

    <div class="lista-minerios">
        <div v-for="minerio in tabelaMinerais" :key="minerio.id" 
             class="card-minerio" 
             :class="{ bloqueado: jogo.mina < minerio.nivel }">
            
            <div class="col-info">
                <div class="icone-wrapper">
                    <img :src="getImagemMinerio(minerio.id)" class="icon-grande">
                    <div class="nivel-req">Nv {{ minerio.nivel }}</div>
                </div>
                <div class="detalhes">
                    <h3>{{ minerio.nome }}</h3>
                    <div class="stats-row">
                        <div class="stat-item">
                            <span class="label">Produção:</span>
                            <span class="valor verde">+{{ formatarNumero(Math.floor(calcularProducaoPorMinuto(minerio.id))) }}/min</span>
                        </div>
                        <div class="stat-item">
                            <span class="label">Estoque:</span>
                            <span class="valor">{{ formatarNumero(Math.floor(jogo.minerios[minerio.id] || 0)) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-slots">
                <div v-if="jogo.mina < minerio.nivel" class="aviso-bloqueio">
                    🔒 Bloqueado
                </div>

                <div v-else class="slots-container">
                    <div class="slot-wrapper">
                        <div class="slot" @click="abrirSelecao(minerio.id, 0)">
                            <template v-if="getFuncionarioNoSlot(minerio.id, 0)">
                                <div class="funcionario-alocado">
                                    <img :src="`/assets/faces/${getFuncionarioNoSlot(minerio.id, 0).raca}/${getFuncionarioNoSlot(minerio.id, 0).imagem}.png`">
                                    <span class="badge-tier" :class="getFuncionarioNoSlot(minerio.id, 0).tier">
                                        {{ getFuncionarioNoSlot(minerio.id, 0).tier }}
                                    </span>
                                    <div v-if="getFuncionarioNoSlot(minerio.id, 0).diasEmGreve > 0" class="overlay-greve">
                                        ⛔
                                    </div>
                                </div>
                            </template>
                            <span v-else class="vazio">+</span>
                        </div>
                        <div class="label-slot">Líder (100%)</div>
                    </div>

                    <div class="slot-wrapper">
                        <div class="slot" 
                             :class="{ locked: isSlotBloqueado(minerio, 1) }"
                             @click="!isSlotBloqueado(minerio, 1) && abrirSelecao(minerio.id, 1)">
                            
                            <div v-if="isSlotBloqueado(minerio, 1)" class="lock-icon">🔒</div>
                            
                            <template v-else-if="getFuncionarioNoSlot(minerio.id, 1)">
                                <div class="funcionario-alocado">
                                    <img :src="`/assets/faces/${getFuncionarioNoSlot(minerio.id, 1).raca}/${getFuncionarioNoSlot(minerio.id, 1).imagem}.png`">
                                    <span class="badge-tier" :class="getFuncionarioNoSlot(minerio.id, 1).tier">
                                        {{ getFuncionarioNoSlot(minerio.id, 1).tier }}
                                    </span>
                                    <div v-if="getFuncionarioNoSlot(minerio.id, 1).diasEmGreve > 0" class="overlay-greve">
                                        ⛔
                                    </div>
                                </div>
                            </template>
                            <span v-else class="vazio">+</span>
                        </div>
                        <div class="label-slot">Auxiliar (60%)</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-if="modalSelecao" class="modal-overlay" @click.self="modalSelecao = null">
        <div class="modal-selecao">
            <div class="modal-header">
                <h3>Selecionar Minerador</h3>
                <button class="btn-fechar-topo" @click="modalSelecao = null">✖</button>
            </div>
            
            <div class="modal-content-scroll">
                <button v-if="getFuncionarioNoSlot(modalSelecao.minerioId, modalSelecao.slot)" 
                        class="btn-remover" @click="removerMinerador">
                    ❌ Remover do Cargo
                </button>

                <div v-if="candidatosMineracao.length === 0" class="sem-candidatos">
                    <p>Nenhum minerador disponível.</p>
                    <small>Contrate mais na Guilda dos Trabalhadores ou libere de outros slots.</small>
                </div>

                <div v-for="func in candidatosMineracao" :key="func.id" 
                     class="card-candidato" 
                     :class="{ 'em-greve': func.diasEmGreve > 0 }"
                     @click="selecionarMinerador(func.id)">
                    
                    <div class="img-wrapper">
                        <img :src="`/assets/faces/${func.raca}/${func.imagem}.png`">
                        <span class="badge-tier-mini" :class="func.tier">{{ func.tier }}</span>
                    </div>
                    
                    <div class="info-candidato">
                        <div class="nome-cand">{{ func.nome }}</div>
                        <div class="bonus-row">
                            <span>Produtividade: </span>
                            <strong class="verde">{{ getPctTotal(func) }}%</strong>
                        </div>
                        <div class="bonus-detalhe">
                            Base: {{ getPctBase(func) }}%
                            
                            <span v-if="getDiferencaPrefeito(func) > 0" class="buff-raca">
                                + {{ getDiferencaPrefeito(func) }}% (Lorde)
                            </span>
                        </div>
                         <div v-if="func.diasEmGreve > 0" class="tag-greve-lista">
                            ⚠️ EM GREVE (Não produz)
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
</template>

<style scoped>
@import '../css/importantes.css';
.mina-container { padding: 10px; max-width: 800px; margin: 0 auto; }
.header-mina {
    background: #f3f3f3;       /* Cinza muito claro (quase branco) */
    color: #2c3e50;            /* Texto Azul Escuro */
    border: 1px solid #bdc3c7; /* Borda cinza suave */
    border-left: 5px solid #3498db; /* Detalhe lateral (cor de pedra/mina) */
    
    padding: 10px 15px;
    border-radius: 8px;
    margin-bottom: 15px;
    
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
.btn-upgrade { 
    background: #27ae60; border: none; padding: 8px 15px; 
    color: white; font-weight: bold; border-radius: 5px; cursor: pointer; 
    transition: background 0.2s;
}
.btn-upgrade:hover { background: #2ecc71; }
.btn-upgrade:disabled { background: #95a5a6; cursor: not-allowed; opacity: 0.7; }
.lista-minerios { display: flex; flex-direction: column; gap: 10px; }
.card-minerio {
    background: rgba(255, 255, 255, 0.5); border: 1px solid #bdc3c7; border-radius: 8px;
    padding: 10px; display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.card-minerio.bloqueado { opacity: 0.6; filter: grayscale(0.9); pointer-events: none; background: #ecf0f1; }
.col-info { display: flex; align-items: center; gap: 15px; flex: 1.2; }
.icone-wrapper { position: relative; text-align: center; }
.icon-grande { width: 52px; height: 52px; object-fit: contain; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.2)); }
.nivel-req { font-size: 0.7em; background: #7f8c8d; color: white; border-radius: 10px; padding: 1px 5px; margin-top: -5px; position: relative; z-index: 2; }
.detalhes h3 { margin: 0 0 5px 0; color: #2c3e50; font-size: 1.1em; }
.stats-row { display: flex; flex-direction: column; font-size: 0.85em; gap: 2px; }
.stat-item { display: flex; gap: 5px; }
.label { color: #7f8c8d; }
.valor { font-weight: bold; }
.valor.verde { color: #27ae60; }
.col-slots { flex: 1; display: flex; justify-content: flex-end; align-items: center; }
.aviso-bloqueio { font-weight: bold; color: #e74c3c; font-size: 0.85em; background: #fadbd8; padding: 5px 10px; border-radius: 4px; }
.slots-container { display: flex; gap: 10px; }
.slot-wrapper { text-align: center; }
.label-slot { font-size: 0.65em; color: #95a5a6; margin-top: 4px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
.slot {
    width: 50px; height: 50px; border: 2px dashed #bdc3c7; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; position: relative; background: #f9f9f9; transition: all 0.2s; overflow: hidden;
}
.slot:hover { border-color: #3498db; background: #eaf2f8; }
.slot.locked { border: 2px solid #e0e0e0; background: #eee; cursor: not-allowed; }
.vazio { font-size: 1.5em; color: #bdc3c7; font-weight: bold; }
.funcionario-alocado { width: 100%; height: 100%; position: relative; }
.funcionario-alocado img { width: 100%; height: 100%; object-fit: cover; }
.overlay-greve {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(192, 57, 43, 0.7); display: flex; align-items: center; justify-content: center;
    color: white; font-size: 1.2em; cursor: help;
}
.badge-tier {
    position: absolute; bottom: 0; right: 0;
    font-size: 0.65em; padding: 1px 4px; border-radius: 3px 0 0 0; 
    color: white; font-weight: bold; z-index: 2;
}
.badge-tier.F { background: #7f8c8d; } .badge-tier.E { background: #27ae60; }
.badge-tier.D { background: #2ecc71; } .badge-tier.C { background: #3498db; }
.badge-tier.B { background: #2980b9; } .badge-tier.A { background: #9b59b6; }
.badge-tier.S { background: #f1c40f; color: #333; } .badge-tier.SS { background: #e74c3c; }
.modal-overlay { 
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.7); z-index: 2000; 
    display: flex; justify-content: center; align-items: center; backdrop-filter: blur(2px);
}
.modal-selecao { 
    background: white; width: 90%; max-width: 400px; max-height: 80vh; 
    border-radius: 10px; display: flex; flex-direction: column; 
    box-shadow: 0 10px 25px rgba(0,0,0,0.5); overflow: hidden;
}
.modal-header { 
    padding: 15px; border-bottom: 1px solid #eee; display: flex; 
    justify-content: space-between; align-items: center; background: #f8f9fa;
}
.modal-header h3 { margin: 0; font-size: 1.1em; color: #2c3e50; }
.btn-fechar-topo { background: none; border: none; font-size: 1.2em; color: #95a5a6; cursor: pointer; }
.modal-content-scroll { padding: 10px; overflow-y: auto; flex: 1; }
.btn-remover { width: 100%; background: #c0392b; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 15px; font-weight: bold; }
.sem-candidatos { text-align: center; color: #7f8c8d; padding: 20px; }
.card-candidato {
    display: flex; align-items: center; gap: 12px; padding: 10px;
    border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px;
    cursor: pointer; transition: all 0.2s;
}
.card-candidato:hover { background: #f4f6f7; border-color: #3498db; transform: translateX(2px); }
.card-candidato.em-greve { opacity: 0.7; background: #fff5f5; border-color: #ffcccc; }
.img-wrapper { position: relative; width: 45px; height: 45px; }
.img-wrapper img { width: 100%; height: 100%; border-radius: 6px; object-fit: cover; border: 1px solid #ccc; }
.badge-tier-mini { 
    position: absolute; bottom: -2px; right: -2px; font-size: 0.6em; 
    padding: 1px 3px; border-radius: 3px; color: white; background: #555; font-weight: bold;
}
.badge-tier-mini.S, .badge-tier-mini.SS { background: #f1c40f; color: black; }
.info-candidato { flex: 1; }
.nome-cand { font-weight: bold; font-size: 0.95em; color: #2c3e50; }
.bonus-row { font-size: 0.85em; margin-top: 2px; }
.bonus-detalhe { font-size: 0.75em; color: #95a5a6; }
.buff-raca { color: #27ae60; font-weight: bold; }
.tag-greve-lista { color: #c0392b; font-size: 0.75em; font-weight: bold; margin-top: 2px; }
@media (max-width: 600px) {
    .card-minerio { flex-direction: column; align-items: stretch; gap: 15px; }
    .col-slots { justify-content: center; border-top: 1px solid #eee; padding-top: 10px; }
}
</style>