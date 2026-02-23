<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useAlchemyStore } from '../stores/alchemyStore'
import { MEDICAMENTOS, RECEITAS_ALQUIMIA, MULTIPLICADOR_ALQUIMIA, RECURSOS_MINERACAO, RECURSOS_ANIMAIS, TIER_ORDER } from '../data/balancing'
import BuildingLayout from './BuildingLayout.vue'
import WorkerSelectModal from './WorkerSelectModal.vue'

const store = useGameStore()
const alchemyStore = useAlchemyStore()

const showWorkerSelect = ref(false)
const showAbortModal = ref(false)
const showSpeedModal = ref(false)

// Estados da Interface
const selectedMed = ref('plasma')
const selectedTier = ref(1)
const craftAmount = ref(1)

const labLevel = computed(() => {
  const b = store.buildings.find(x => x.key === 'laboratorio')
  return b ? b.level : 0
})

const maxTierUnlocked = computed(() => Math.min(labLevel.value, 4))

const availableAlchemists = computed(() => {
  return store.workers.filter(w =>
    w.jobKey === 'alquimista' && (w.strikeDays || 0) === 0 && !w.injury && w.id !== alchemyStore.workerId
  ).sort((a, b) => TIER_ORDER.indexOf(b.tier) - TIER_ORDER.indexOf(a.tier))
})

const maxAmountPossible = computed(() => alchemyStore.getMaxCraftable(selectedMed.value, selectedTier.value))

const enforceValidAmount = () => {
  if (craftAmount.value < 1) craftAmount.value = 1
  if (craftAmount.value > maxAmountPossible.value && maxAmountPossible.value > 0) craftAmount.value = maxAmountPossible.value
}

// === NOVO SISTEMA DE 3 SLOTS RÍGIDOS ===
const getDisplayCost = (medKey, tier, amount) => {
  const recipe = RECEITAS_ALQUIMIA[medKey]
  const mult = MULTIPLICADOR_ALQUIMIA[tier].cost
  const costs = []
  
  // Adiciona os ingredientes reais
  for (const [res, baseQtd] of Object.entries(recipe.custo)) {
     const req = Math.floor(baseQtd * mult) * amount
     const name = RECURSOS_MINERACAO[res]?.nome || RECURSOS_ANIMAIS[res]?.nome || res
     costs.push({ req, name, key: res, isEmpty: false })
  }
  
  // Preenche os slots restantes até dar exatamente 3
  while (costs.length < 4) {
     costs.push({ req: ' ', name: ' ', key: 'empty_' + costs.length, isEmpty: true })
     
  }
  
  return costs
}

const getLiquidColor = (key) => {
  const colors = { plasma: '#ef4444', soro_reg: '#10b981', solucao: '#0ea5e9', resina: '#d4d4d8', derme: '#f97316', neutralizador: '#8b5cf6', estimulante: '#eab308', soro_psi: '#ec4899' }
  return colors[key] || '#38bdf8'
}

const activeThemeColor = computed(() => {
  const targetKey = alchemyStore.activeCraft.medicamentKey || selectedMed.value
  return getLiquidColor(targetKey)
})

const getUnitProgressPct = computed(() => {
  if (!alchemyStore.activeCraft.medicamentKey || alchemyStore.activeCraft.timePerUnit === 0) return '0%'
  const pct = (alchemyStore.activeCraft.progress / alchemyStore.activeCraft.timePerUnit) * 100
  return `${Math.min(100, pct)}%`
})

// === AÇÕES ===
const startCraft = () => {
  alchemyStore.startBatch(selectedMed.value, selectedTier.value, craftAmount.value)
  craftAmount.value = 1
}

const confirmAbort = () => {
  alchemyStore.abortBatch()
  showAbortModal.value = false
}

const confirmSpeedUp = () => {
  alchemyStore.speedUpBatch()
  showSpeedModal.value = false
}
</script>

<template>
  <BuildingLayout
    title="Laboratório Arcano"
    :level="labLevel"
    :maxLevel="4"
    icon="⚗️"
    :leader="alchemyStore.currentWorker"
    leader-label="ALQUIMISTA"
    leader-stat-label="EFICIÊNCIA"
    empty-title="LABORATÓRIO INATIVO"
    empty-desc="Aloque um alquimista para operar o núcleo."
    :hide-help="true"
    @remove-leader="alchemyStore.assignWorker(null)"
    @assign-leader="showWorkerSelect = true"
  >
    <div v-if="labLevel > 0" class="factory-layout" :style="{'--theme': activeThemeColor}">
      
      <div class="f-panel">
         <div class="f-header">1. PROTOCOLO DE ENTRADA</div>
         <div class="f-body">
            
            <div class="f-group">
               <label>COMPOSTO ALVO</label>
               <select v-model="selectedMed" class="f-input" @change="craftAmount = 1" :disabled="alchemyStore.activeCraft.medicamentKey != null">
                  <option v-for="(data, key) in MEDICAMENTOS" :key="key" :value="key">{{ data.nome.toUpperCase() }}</option>
               </select>
            </div>

            <div class="f-group">
               <label>NÍVEL DE PUREZA (TIER)</label>
               <div class="tier-grid">
                  <button v-for="t in 4" :key="t" class="t-btn" 
                          :class="{'active': selectedTier === t, 'locked': t > maxTierUnlocked}"
                          @click="selectedTier = t"
                          :disabled="t > maxTierUnlocked || alchemyStore.activeCraft.medicamentKey != null">
                     T{{ t }}
                  </button>
               </div>
            </div>

            <div class="f-group">
               <label>VOLUME DO LOTE</label>
               <div class="amount-row">
                  <input type="number" v-model.number="craftAmount" @change="enforceValidAmount" class="f-input text-center" :disabled="alchemyStore.activeCraft.medicamentKey != null">
                  <button class="btn-max" @click="craftAmount = maxAmountPossible; enforceValidAmount()" :disabled="alchemyStore.activeCraft.medicamentKey != null">MÁX</button>
               </div>
            </div>

            <div class="f-group mt-auto">
               <label>REQUISITOS MATERIAIS</label>
               <div class="rigid-slots-container">
                  <div v-for="cost in getDisplayCost(selectedMed, selectedTier, craftAmount)" :key="cost.key" 
                       class="material-slot" :class="{'is-empty': cost.isEmpty}">
                     <span class="ms-name">{{ cost.name }}</span>
                     <span v-if="!cost.isEmpty" class="ms-req" :class="{'text-red': (store.inventory[cost.key] || 0) < cost.req}">{{ cost.req }} UN</span>
                     <span v-else class="ms-req">-</span>
                  </div>
               </div>
            </div>

         </div>
      </div>

      <div class="f-panel center-panel theme-border">
         <div class="f-header text-center">2. NÚCLEO DE SÍNTESE</div>
         <div class="f-body process-body">
            
            <template v-if="alchemyStore.activeCraft.medicamentKey">
               <div class="process-active">
                  <div class="pa-title" :style="{ color: activeThemeColor }">
                     {{ MEDICAMENTOS[alchemyStore.activeCraft.medicamentKey].nome.toUpperCase() }} [T{{ alchemyStore.activeCraft.tier }}]
                  </div>

                  <div class="core-tank">
                     <div class="tank-glass">
                        <div class="tank-liquid" :style="{ height: getUnitProgressPct, backgroundColor: activeThemeColor, boxShadow: `0 0 15px ${activeThemeColor}80` }"></div>
                     </div>
                     <div class="tank-base">
                        <span class="tb-pct">{{ parseInt(getUnitProgressPct) }}%</span>
                     </div>
                  </div>

                  <div class="pa-lote">
                     <span class="lote-lbl">PROGRESSO DO LOTE</span>
                     <span class="lote-val">{{ alchemyStore.activeCraft.completedAmount }} / {{ alchemyStore.activeCraft.requestedAmount }}</span>
                  </div>

                  <div class="pa-controls">
                     <button class="btn-ctrl" @click="showAbortModal = true">ABORTAR LOTE</button>
                     <button class="btn-ctrl" @click="showSpeedModal = true">ACELERAR</button>
                  </div>
               </div>
            </template>
            
            <template v-else>
               <div class="process-idle">
                  <button class="btn-massive theme-bg" @click="startCraft" :disabled="craftAmount < 1 || craftAmount > maxAmountPossible">
                     INICIAR<br>OPERAÇÃO
                  </button>
               </div>
            </template>

         </div>
      </div>

      <div class="f-panel">
         <div class="f-header">3. ARMAZÉM DE SAÍDA</div>
         <div class="f-body p-0">
            
            <div class="tray-list">
               <template v-for="(tiers, medKey) in alchemyStore.tray" :key="medKey">
                  <template v-for="(amount, tIndex) in tiers" :key="tIndex">
                     <div v-if="amount > 0" class="tl-item" :style="{'border-left-color': getLiquidColor(medKey)}">
                        <div class="tl-info">
                           <span class="tl-name">{{ MEDICAMENTOS[medKey].nome }}</span>
                           <span class="tl-tier">Tier {{ tIndex + 1 }}</span>
                        </div>
                        <span class="tl-amount">{{ amount }} UN</span>
                     </div>
                  </template>
               </template>
               <div v-if="alchemyStore.isTrayEmpty" class="tl-empty">Sistema vazio. Nenhum item aguardando.</div>
            </div>

            <div class="tray-footer">
               <button class="btn-collect" :disabled="alchemyStore.isTrayEmpty" @click="alchemyStore.collectTray()">COLETAR LOTES</button>
            </div>

         </div>
      </div>

    </div>

    <div class="modal-overlay" v-if="showAbortModal" @click.self="showAbortModal = false">
      <div class="tactical-card confirm-modal border-red">
         <div class="tc-header bg-red"><span class="tc-title text-white">⚠️ INTERROMPER LOTE</span></div>
         <div class="cm-body">
            <p><strong>{{ alchemyStore.activeCraft.completedAmount }} frascos</strong> prontos serão armazenados.</p>
            <p>Materiais de <strong>{{ alchemyStore.activeCraft.requestedAmount - alchemyStore.activeCraft.completedAmount }} unidades</strong> serão devolvidos ao armazém.</p>
         </div>
         <div class="cm-footer">
            <button class="btn-cancel" @click="showAbortModal = false">CANCELAR</button>
            <button class="btn-confirm-red" @click="confirmAbort">CONFIRMAR</button>
         </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showSpeedModal" @click.self="showSpeedModal = false">
      <div class="tactical-card confirm-modal border-purple">
         <div class="tc-header bg-purple"><span class="tc-title text-white">⚡ ACELERAÇÃO DE SÍNTESE</span></div>
         <div class="cm-body">
            <p>Concluir as <strong>{{ alchemyStore.activeCraft.requestedAmount - alchemyStore.activeCraft.completedAmount }} unidades</strong> restantes custará:</p>
            <h2 class="text-purple text-center">{{ Math.ceil((alchemyStore.activeCraft.requestedAmount - alchemyStore.activeCraft.completedAmount) / 10) }} MYTHIC COINS</h2>
         </div>
         <div class="cm-footer">
            <button class="btn-cancel" @click="showSpeedModal = false">CANCELAR</button>
            <button class="btn-confirm-purple" @click="confirmSpeedUp">ACELERAR</button>
         </div>
      </div>
    </div>

    <WorkerSelectModal v-if="showWorkerSelect" title="ESCOLHER ALQUIMISTA" :workers="availableAlchemists" @close="showWorkerSelect = false" @select="alchemyStore.assignWorker" />
  </BuildingLayout>
</template>

<style scoped>
/* =========================================
   LAYOUT DE FÁBRICA (3 COLUNAS)
========================================== */
.factory-layout {
  display: grid;
  grid-template-columns: 260px 1fr 260px;
  gap: 15px;
  font-family: 'Chakra Petch', sans-serif;
  align-items: stretch;
  min-height: 320px;
  --theme: #38bdf8;
}

/* Painéis Base */
.f-panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 4px; display: flex; flex-direction: column; overflow: hidden; }
.f-header { background: #162032; padding: 10px; font-size: 10px; font-weight: 800; color: #38bdf8; border-bottom: 1px solid #1e293b; letter-spacing: 0.5px; }
.f-body { padding: 15px; flex: 1; display: flex; flex-direction: column; gap: 15px; }
.p-0 { padding: 0; gap: 0; }
.text-center { text-align: center; }
.mt-auto { margin-top: auto; }

/* Sotaque Dinâmico no Painel Central */
.center-panel.theme-border { border-top: 3px solid var(--theme); transition: border-color 0.3s ease; }

/* =========================================
   COLUNA 1: FORMULÁRIOS
========================================== */
.f-group { display: flex; flex-direction: column; gap: 6px; }
.f-group label { font-size: 9px; color: #64748b; font-weight: 700; }

.f-input { background: #020617; border: 1px solid #334155; color: #38bdf8; padding: 8px; border-radius: 2px; font-family: 'Chakra Petch', sans-serif; font-size: 11px; outline: none; transition: border-color 0.2s; }
.f-input:focus { border-color: var(--theme); }
.f-input:disabled { opacity: 0.5; cursor: not-allowed; }

.tier-grid { display: flex; gap: 4px; }
.t-btn { flex: 1; background: #020617; border: 1px solid #334155; color: #f8fafc; padding: 6px 0; font-size: 10px; font-weight: 800; cursor: pointer; border-radius: 2px; transition: 0.2s; }
.t-btn.active { background: #1e293b; color: #38bdf8; border-color: #38bdf8;}
.t-btn.locked { opacity: 0.2; cursor: not-allowed; }

.amount-row { display: flex; gap: 4px; }
.amount-row .f-input { flex: 1; font-weight: 800; font-size: 13px; }
.btn-max { background: #1e293b; border: 1px solid #334155; color: #94a3b8; padding: 0 10px; font-size: 10px; font-weight: 800; border-radius: 2px; cursor: pointer; }
.btn-max:hover:not(:disabled) { background: #334155; color: #fff; }

/* 3 SLOTS RÍGIDOS (GARANTIA DE NÃO-MOVIMENTO) */
.rigid-slots-container { display: flex; flex-direction: column; gap: 4px; background: #020617; padding: 4px; border: 1px solid #1e293b; border-radius: 2px; }
.material-slot { height: 26px; display: flex; justify-content: space-between; align-items: center; padding: 0 8px; background: #0f172a; border: 1px solid #1e293b; border-radius: 2px; font-size: 10px; font-weight: 700; }
.ms-name { color: #cbd5e1; }
.ms-req { color: #f8fafc; }
.material-slot.is-empty { opacity: 0.4; border-style: dashed; }
.material-slot.is-empty .ms-name { color: #64748b; font-style: italic; font-weight: 500; font-size: 9px; }
.text-red { color: #ef4444; }

/* =========================================
   COLUNA 2: O PROCESSO (TANQUE CENTRAL)
========================================== */
.process-body { align-items: center; justify-content: center; }

/* Botão Iniciar Gigante e Temático */
.process-idle { display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; }
.btn-massive { 
  width: 80%; /* Não é mais redondo, é um retângulo largo */
  height: 60px; /* Altura fixa menor */
  border-radius: 4px; 
  border: 1px solid #1e293b; 
  background: #020617; 
  color: #475569; 
  font-family: 'Chakra Petch', sans-serif; 
  font-size: 14px; 
  font-weight: 900; 
  letter-spacing: 2px; 
  cursor: pointer; 
  transition: 0.3s; 
}

.btn-massive.theme-bg:not(:disabled) { 
  border-color: var(--theme); 
  color: var(--theme); 
  background: rgba(2, 6, 23, 0.8);
  /* Colocamos uma borda brilhante em cima para dar um efeito neon tecnológico */
  box-shadow: 0 4px 15px rgba(0,0,0,0.5), inset 0 2px 0 var(--theme); 
}

.btn-massive.theme-bg:hover:not(:disabled) { 
  background: var(--theme); 
  color: #020617; 
  box-shadow: 0 0 20px var(--theme); 
  transform: translateY(-2px); 
}

/* Tanque Operacional */
.process-active { display: flex; flex-direction: column; align-items: center; gap: 15px; width: 100%; }
.pa-title { font-size: 13px; font-weight: 900; letter-spacing: 0.5px; transition: color 0.3s ease; border-bottom: 1px solid #1e293b; padding-bottom: 5px; width: 100%; text-align: center; }

.core-tank { display: flex; flex-direction: column; align-items: center; }
.tank-glass { width: 100px; height: 100px; border: 2px solid #334155; border-radius: 6px 6px 0 0; background: rgba(255,255,255,0.02); position: relative; overflow: hidden; border-bottom: none; }
.tank-liquid { position: absolute; bottom: 0; left: 0; width: 100%; transition: height 0.1s linear, background-color 0.3s ease; opacity: 0.8; }
.tank-base { width: 120px; height: 24px; background: #1e293b; border-radius: 2px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; position: relative; z-index: 2; box-shadow: 0 5px 10px rgba(0,0,0,0.3); }
.tb-pct { font-size: 12px; font-weight: 900; color: #fff; font-family: monospace; }

.pa-lote { display: flex; flex-direction: column; align-items: center; gap: 2px; background: #020617; padding: 6px 15px; border-radius: 4px; border: 1px solid #1e293b; }
.lote-lbl { font-size: 9px; color: #64748b; font-weight: 800; }
.lote-val { font-size: 14px; color: #f8fafc; font-weight: 900; font-family: monospace; }

.pa-controls { display: flex; gap: 10px; width: 100%; margin-top: auto; }
.btn-ctrl { 
  flex: 1; 
  padding: 6px; /* Diminuímos o preenchimento para deixá-lo mais fino */
  font-family: 'Chakra Petch', sans-serif; 
  font-size: 9px; /* Fonte menor */
  font-weight: 700; 
  border-radius: 2px; 
  cursor: pointer; 
  border: 1px solid #334155; /* Borda cinza escura */
  background: #020617; /* Fundo bem escuro */
  color: #64748b; /* Texto cinza */
  transition: 0.2s; 
}

.btn-ctrl:hover { 
  background: #1e293b; 
  color: #e2e8f0; /* Fica clarinho ao passar o mouse */
  border-color: #475569; 
}

/* =========================================
   COLUNA 3: SAÍDA
========================================== */
.tray-list { 
  flex: 1; 
  overflow-y: scroll; /* O 'scroll' reserva o espaço da barra permanentemente */
  display: flex; 
  flex-direction: column; 
  max-height: 313px; /* Trava a altura para a caixa nunca crescer e empurrar o resto */
}
.tl-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid #1e293b; border-left: 3px solid transparent; background: #0f172a; transition: background 0.2s; }
.tl-item:hover { background: #162032; }
.tl-info { display: flex; flex-direction: column; gap: 2px; }
.tl-name { font-size: 10px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; }
.tl-tier { font-size: 9px; color: #64748b; font-weight: 700; }
.tl-amount { font-size: 11px; font-weight: 800; color: #10b981; }
.tl-empty { padding: 20px; text-align: center; font-size: 10px; color: #475569; font-style: italic; }

.tray-footer { padding: 10px; background: #162032; border-top: 1px solid #1e293b; }
.btn-collect { width: 100%; padding: 10px; font-family: 'Chakra Petch', sans-serif; font-size: 10px; font-weight: 800; background: transparent; border: 1px solid #10b981; color: #10b981; border-radius: 2px; cursor: pointer; transition: 0.2s; }
.btn-collect:hover:not(:disabled) { background: #10b981; color: #020617; }
.btn-collect:disabled { border-color: #334155; color: #475569; opacity: 0.5; cursor: not-allowed; }

/* Modais (Mantidos) */
.confirm-modal { width: 90%; max-width: 350px; background: #0f172a; }
.border-red { border-color: #ef4444; }
.border-purple { border-color: #c084fc; }
.bg-red { background: #7f1d1d; }
.bg-purple { background: #581c87; }
.cm-body { padding: 20px; color: #cbd5e1; font-size: 11px; text-align: center; display: flex; flex-direction: column; gap: 10px; }
.cm-footer { display: flex; gap: 10px; padding: 10px; border-top: 1px solid #1e293b; }
.btn-cancel, .btn-confirm-red, .btn-confirm-purple { flex: 1; padding: 8px; font-family: 'Chakra Petch', sans-serif; font-size: 11px; font-weight: 700; cursor: pointer; border-radius: 4px; border: none; }
.btn-cancel { background: #1e293b; color: #94a3b8; }
.btn-confirm-red { background: #ef4444; color: #fff; }
.btn-confirm-purple { background: #c084fc; color: #fff; }

@media (max-width: 900px) {
  .factory-layout { grid-template-columns: 1fr; }
  .center-panel { min-height: 250px; }
}

input[type="number"]::-webkit-inner-spin-button, 
input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
input[type="number"] { -moz-appearance: textfield; }
</style>