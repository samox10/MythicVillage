<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useButcheryStore } from '../stores/butcheryStore'
import { CARCACAS_INFO, RECURSOS_ANIMAIS, TIER_ORDER } from '../data/balancing'
import BuildingLayout from './BuildingLayout.vue'
import WorkerSelectModal from './WorkerSelectModal.vue'
import ModalAnaliseBiologica from './ModalAnaliseBiologica.vue' // Import do modal de detalhes
import ModalDescarte from './ModalDescarte.vue' // Import do modal de descarte

const store = useGameStore()
const butcheryStore = useButcheryStore()

const showWorkerSelect = ref(false)
const detailedCarcass = ref(null) 

// Controles do Modal de Descarte
const showDiscardModal = ref(false)
const carcassToDiscard = ref(null)

const openDiscardModal = (carcass) => {
  carcassToDiscard.value = carcass
  showDiscardModal.value = true
}

const closeDiscardModal = () => {
  showDiscardModal.value = false
  carcassToDiscard.value = null
}

// AQUI: A função agora recebe o "amount" do nosso novo ficheiro!
const confirmDiscard = (amount) => {
  if (carcassToDiscard.value && amount > 0) {
    butcheryStore.discardCarcass(carcassToDiscard.value.key, amount)
    closeDiscardModal()
  }
}

const buildingLevel = computed(() => {
  const b = store.buildings.find(x => x.key === 'destrinchador')
  return b ? b.level : 0
})

const getInventoryCount = (id) => store.inventory[id] || 0

// LÓGICA DE ORDENAÇÃO: Quem tem (count > 0) vem primeiro. O resto vai pro final ordenado por nível.
const sortedUnlockedCarcasses = computed(() => {
  const list = []
  for (const [key, info] of Object.entries(CARCACAS_INFO)) {
    if (info.unlockLvl <= buildingLevel.value) {
      list.push({ key, ...info, count: getInventoryCount(key) })
    }
  }
  return list.sort((a, b) => {
    const hasA = a.count > 0 ? 1 : 0
    const hasB = b.count > 0 ? 1 : 0
    if (hasA !== hasB) return hasB - hasA // 1 (tem) vem antes de 0 (não tem)
    return a.unlockLvl - b.unlockLvl // Se ambos tem ou não tem, organiza pelo nível de desbloqueio
  })
})

const availableWorkers = computed(() => {
  return store.workers.filter(w =>
    w.jobKey === 'dissecador' && 
    (w.strikeDays || 0) === 0 && 
    !w.injury && 
    w.id !== butcheryStore.workerId
  ).sort((a, b) => TIER_ORDER.indexOf(b.tier) - TIER_ORDER.indexOf(a.tier))
})

const selectWorker = (id) => {
  butcheryStore.assignWorker(id)
  showWorkerSelect.value = false
}

const getCarcassImg = (id) => id ? `/assets/monstros/${CARCACAS_INFO[id].img}` : ''

const getProgressPct = () => {
  if (!butcheryStore.activeSlot.carcacaId || butcheryStore.activeSlot.totalTime === 0) return 0
  return (butcheryStore.activeSlot.progress / butcheryStore.activeSlot.totalTime) * 100
}

const openDetails = (carcass) => { detailedCarcass.value = carcass }
const closeDetails = () => { detailedCarcass.value = null }
// Controle dos textos flutuantes
const floatingTexts = ref([])

watch(() => butcheryStore.recentDrops, (newDrops) => {
  if (newDrops && newDrops.length > 0) {
    const id = Date.now()
    floatingTexts.value.push({ id, drops: [...newDrops] })
    // Remove o texto da tela após 2.5 segundos
    setTimeout(() => {
      floatingTexts.value = floatingTexts.value.filter(t => t.id !== id)
    }, 2500)
  }
})

// === FUNÇÃO DE TESTE ===
const addTestCarcasses = () => {
  for (const key of Object.keys(CARCACAS_INFO)) { store.inventory[key] = (store.inventory[key] || 0) + 10 }
}
onMounted(() => { window.darCarcacas = addTestCarcasses })
onUnmounted(() => { delete window.darCarcacas })
</script>

<template>
  <BuildingLayout
    title="Mesa de Dissecação"
    :level="buildingLevel"
    :maxLevel="12"
    icon="🔪"
    :leader="butcheryStore.currentWorker"
    leader-label="DISSECADOR"
    leader-stat-label="EFICIÊNCIA"
    empty-title="MESA VAZIA"
    empty-desc="Nenhum profissional na mesa. O processo de destrinchamento está parado."
    :hide-help="true"
    @remove-leader="butcheryStore.assignWorker(null)"
    @assign-leader="showWorkerSelect = true"
  >
    <div v-if="buildingLevel > 0" class="tactical-slaughter-layout">
      
      <button @click="addTestCarcasses" class="btn-sys-override">
        [!] SOBRESCREVER SISTEMA: INJETAR CARCAÇAS
      </button>

      <div class="facility-core">
        
        <div class="facility-panel cryo-vault">
          <div class="panel-header">
            <span class="ph-title">❄️ COFRE CRIOGÊNICO</span>
            <span class="ph-capacity">{{ butcheryStore.totalCarcassesInStorage }} / {{ store.maxCarcassStorage }}</span>
          </div>
          
          <div class="vault-grid">
            <div v-for="carcass in sortedUnlockedCarcasses" :key="carcass.key" 
                 class="cryo-locker" :class="{'is-empty': carcass.count <= 0}">
               
               <div class="locker-window" @click="openDetails(carcass)" title="Ver Dados da Carcaça">
                  <div class="frost-fx"></div>
                  <img :src="`/assets/monstros/${carcass.img}`" class="locker-entity" @error="$event.target.style.opacity='0.3'">
                  <div class="locker-qty">{{ carcass.count }}</div>
               </div>

              <div class="locker-actions">
                 <button class="btn-tactical btn-suspend" 
                    @click="butcheryStore.addToQueue(carcass.key)"
                    :disabled="carcass.count <= 0 || butcheryStore.queue.length >= 10">
                   PENDURAR
                 </button>
                 <button class="btn-tactical btn-incinerate" 
                    @click="openDiscardModal(carcass)"
                    :disabled="carcass.count <= 0"
                    title="Incinerar">
                   ✕
                 </button>
               </div>
            </div>
          </div>
        </div>

        <div class="facility-panel slaughter-floor">
          
          <div class="magnetic-rail-system">
            <div class="panel-header border-none">
              <span class="ph-title">⛓️ MONOTRILHO DE SUSPENSÃO ({{ butcheryStore.queue.length }}/10)</span>
            </div>
            
            <div class="rail-track">
              <div v-for="n in 10" :key="n" class="mag-hook" 
                   :class="{'has-carcass': butcheryStore.queue[n-1]}"
                   @click="butcheryStore.removeFromQueue(n-1)"
                   title="Devolver ao Cofre">
                
                <div class="rail-glider"></div> <div class="hook-cable"></div>
                <img v-if="butcheryStore.queue[n-1]" :src="getCarcassImg(butcheryStore.queue[n-1])" class="hanging-carcass">
                <div v-else class="hook-empty"></div>
                
                <div class="hook-remove-label">SOLTAR</div>
              </div>
            </div>
          </div>

          <div class="dissection-slab-area">
            
            <div class="heavy-slab">
               
               <div class="drainage-grate"></div>

               <div v-if="butcheryStore.activeSlot.carcacaId" class="laser-scalpel" :style="{ left: getProgressPct() + '%' }">
                  <div class="laser-emitter top"></div>
                  <div class="cutting-beam"></div>
                  <div class="beam-impact"></div> <div class="laser-emitter bottom"></div>
               </div>

               <div v-if="butcheryStore.activeSlot.carcacaId" class="carcass-on-slab">
                  <img :src="getCarcassImg(butcheryStore.activeSlot.carcacaId)" class="slab-entity">
               </div>
               <div v-else class="slab-idle">MESA DE DISSECAÇÃO AGUARDANDO ALVO</div>

               <div class="loot-burst-zone">
                 <div v-for="ft in floatingTexts" :key="ft.id" class="epic-loot-burst">
                    <div v-for="(loot, index) in ft.drops" :key="index" class="burst-item" :style="{ animationDelay: `${index * 0.05}s` }">
                       <span class="loot-icon" :style="{ backgroundColor: RECURSOS_ANIMAIS[loot.item]?.cor }"></span>
                       <span class="loot-text" :style="{ color: RECURSOS_ANIMAIS[loot.item]?.cor }">+{{ loot.qtd }} {{ RECURSOS_ANIMAIS[loot.item]?.nome }}</span>
                    </div>
                 </div>
               </div>

            </div>
          </div>

        </div>

      </div>
    </div>

    <WorkerSelectModal v-if="showWorkerSelect" title="SELECIONAR DISSECADOR" :workers="availableWorkers" @close="showWorkerSelect = false" @select="selectWorker" />

    <div class="modal-overlay" v-if="detailedCarcass" @click.self="closeDetails">
      <div class="tactical-card monster-detail-card">
        
        <div class="md-header">
           <span class="md-title">ANÁLISE BIOLÓGICA</span>
           <button class="tc-close" @click="closeDetails">✕</button>
        </div>

        <div class="md-body">
           <div class="md-visual">
              <img :src="`/assets/monstros/${detailedCarcass.img}`" class="md-big-img">
           </div>
           
           <div class="md-info">
              <h2 class="md-monster-name">{{ detailedCarcass.nome }}</h2>
              <div class="md-habitat">📍 <strong>Habitat:</strong> {{ detailedCarcass.habitat }}</div>
              <div class="md-time">⏱️ <strong>Tempo Base de Corte:</strong> {{ detailedCarcass.tempoBase }} Segundos</div>
              <div class="md-time">🛡️ <strong>Dureza Estrutural:</strong> Nível {{ detailedCarcass.dureza }}</div>
              
              <div class="md-loot-section">
                 <div class="md-loot-title">MATERIAIS EXTRAÍDOS</div>
                 <div class="md-loot-grid">
                    <div v-for="(qtd, itemKey) in detailedCarcass.drops" :key="itemKey" class="md-loot-item">
                       <div class="loot-color-bar" :style="{ backgroundColor: RECURSOS_ANIMAIS[itemKey].cor }"></div>
                       <span class="loot-q">{{ qtd }}x</span>
                       <span class="loot-n">{{ RECURSOS_ANIMAIS[itemKey].nome }}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
    <ModalAnaliseBiologica 
        v-if="detailedCarcass" 
        :carcass="detailedCarcass" 
        @close="closeDetails" 
        />

        <ModalDescarte 
        v-if="showDiscardModal" 
        :carcass="carcassToDiscard" 
        :inventoryCount="getInventoryCount(carcassToDiscard.key)"
        @close="closeDiscardModal" 
        @confirm="confirmDiscard" 
        />

  </BuildingLayout>
</template>

<style scoped>
/* =========================================
   AÇOUGUE TÁTICO 2.0 (ARCANEPUNK)
========================================== */
.tactical-slaughter-layout { display: flex; flex-direction: column; gap: 15px; font-family: 'Chakra Petch', sans-serif; }

.btn-sys-override { background: #0f172a; border: 1px dashed #ef4444; color: #ef4444; padding: 10px; font-weight: 900; font-size: 11px; cursor: pointer; border-radius: 4px; transition: 0.2s; letter-spacing: 1px; }
.btn-sys-override:hover { background: rgba(239, 68, 68, 0.1); box-shadow: 0 0 10px rgba(239, 68, 68, 0.3); }

.facility-core { display: flex; gap: 15px; align-items: flex-start; }

/* Painéis de Alta Segurança */
.facility-panel { background: #0f172a; border: 2px solid #1e293b; border-radius: 6px; padding: 15px; box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 5px 15px rgba(0,0,0,0.5); }
.cryo-vault { flex: 1; }
.slaughter-floor { flex: 1.2; display: flex; flex-direction: column; gap: 20px; }

/* Cabeçalhos */
.panel-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 8px; margin-bottom: 15px; }
.panel-header.border-none { border: none; padding-bottom: 0; margin-bottom: 10px; }
.ph-title { color: #e2e8f0; font-size: 12px; font-weight: 900; letter-spacing: 1px; }
.ph-capacity { background: #020617; color: #38bdf8; font-size: 10px; font-weight: 900; padding: 2px 8px; border: 1px solid #1e293b; border-radius: 4px; }

/* =========================================
   COFRE CRIOGÊNICO (ESQUERDA)
========================================== */
.vault-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(95px, 1fr)); gap: 10px; }

.cryo-locker { display: flex; flex-direction: column; gap: 4px; background: #020617; border: 1px solid #1e293b; border-radius: 4px; padding: 4px; transition: 0.2s; }
.cryo-locker:hover:not(.is-empty) { border-color: #38bdf8; box-shadow: 0 0 10px rgba(56, 189, 248, 0.1); }
.cryo-locker.is-empty { filter: grayscale(1); opacity: 0.3; }

.locker-window { height: 75px; background: #0f172a; border: 2px solid #334155; position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; }
.frost-fx { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(224, 242, 254, 0.05), rgba(56, 189, 248, 0.1)); pointer-events: none; z-index: 3; border-top: 2px solid rgba(255,255,255,0.1); }
.locker-entity { width: 75%; height: 75%; object-fit: contain; z-index: 2; filter: drop-shadow(0 2px 4px #000); transition: 0.2s; }
.cryo-locker:hover:not(.is-empty) .locker-entity { transform: scale(1.1); }
.locker-qty { position: absolute; top: 4px; right: 4px; background: #020617; color: #e2e8f0; font-size: 10px; font-weight: 900; padding: 1px 5px; border: 1px solid #334155; z-index: 4; border-radius: 2px; }

.locker-actions { display: flex; gap: 4px; }
.btn-tactical { background: #1e293b; border: 1px solid #334155; font-size: 9px; font-weight: 900; cursor: pointer; padding: 6px 0; border-radius: 2px; font-family: 'Chakra Petch', sans-serif; transition: 0.2s; }
.btn-suspend { flex: 1; color: #cbd5e1; }
.btn-suspend:hover:not(:disabled) { background: #38bdf8; color: #000; border-color: #38bdf8; }
.btn-incinerate { width: 28px; color: #ef4444; }
.btn-incinerate:hover:not(:disabled) { background: #ef4444; color: #fff; border-color: #ef4444; }
.btn-tactical:disabled { opacity: 0.4; cursor: not-allowed; }

/* =========================================
   MONOTRILHO DE GANCHOS (A FILA)
========================================== */
.magnetic-rail-system { background: #020617; border: 1px solid #1e293b; padding: 12px; border-radius: 4px; box-shadow: inset 0 0 15px #000; }

.rail-track { 
  display: flex; justify-content: center; gap: 8px; position: relative; 
  padding-top: 15px; margin-top: 5px; border-top: 4px solid #1e293b; 
}
/* O trilho de metal metálico */
.rail-track::before { content: ''; position: absolute; top: -2px; left: 0; right: 0; height: 2px; background: #475569; }

.mag-hook { width: 35px; height: 50px; display: flex; flex-direction: column; align-items: center; cursor: pointer; position: relative; }
.rail-glider { width: 12px; height: 6px; background: #38bdf8; border-radius: 2px; position: absolute; top: -18px; box-shadow: 0 0 5px #38bdf8; } /* Luz do gancho ativo */
.hook-cable { width: 2px; height: 10px; background: #475569; margin-top: -10px; z-index: 1; }
.hanging-carcass { width: 100%; height: 35px; object-fit: contain; z-index: 2; filter: drop-shadow(0 4px 4px #000); transition: 0.2s; }

/* Interação ao tentar remover da fila */
.hook-remove-label { position: absolute; bottom: -15px; font-size: 8px; font-weight: bold; color: #ef4444; opacity: 0; transition: 0.2s; background: rgba(0,0,0,0.8); padding: 2px 4px; border-radius: 2px; }
.mag-hook.has-carcass:hover .hanging-carcass { filter: brightness(0.4) sepia(1) hue-rotate(-50deg) saturate(5); }
.mag-hook.has-carcass:hover .hook-remove-label { opacity: 1; bottom: 0; z-index: 10; }

.hook-empty { width: 10px; height: 15px; border: 2px solid #334155; border-top: none; border-radius: 0 0 10px 10px; margin-top: 5px; } /* Desenho de um gancho vazio */

/* =========================================
   LAJE DE DISSECAÇÃO (MESA PRINCIPAL)
========================================== */
.dissection-slab-area { display: flex; flex-direction: column; align-items: center; padding: 10px 0; }

.heavy-slab { 
  width: 100%; max-width: 360px; height: 160px; 
  background: #020617; border: 4px solid #1e293b; border-radius: 6px; 
  position: relative; display: flex; align-items: center; justify-content: center;
  box-shadow: inset 0 0 40px #000, 0 10px 20px rgba(0,0,0,0.6);
  border-bottom-width: 12px; /* Espessura da laje */
}

/* Grade de escoamento no fundo */
.drainage-grate {
  position: absolute; inset: 6px;
  background-image: repeating-linear-gradient(45deg, #0f172a 0, #0f172a 2px, transparent 2px, transparent 8px);
  border: 1px solid #1e293b; z-index: 1; opacity: 0.8;
}

.slab-idle { font-size: 11px; font-weight: 900; color: #334155; z-index: 2; letter-spacing: 2px; text-shadow: 0 1px 1px #000; }

.carcass-on-slab { position: relative; z-index: 2; width: 120px; height: 120px; }
.slab-entity { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 10px 15px #000); }

/* === O LASER DE DISSECAÇÃO (Barra de Progresso) === */
.laser-scalpel {
  position: absolute; top: -6px; bottom: -6px; width: 4px;
  display: flex; flex-direction: column; align-items: center;
  z-index: 10; transition: left 0.1s linear; pointer-events: none;
}
.laser-emitter { width: 16px; height: 8px; background: #0f172a; border: 2px solid #38bdf8; border-radius: 2px; box-shadow: 0 0 10px #38bdf8; }
.cutting-beam { flex: 1; width: 2px; background: #fff; box-shadow: 0 0 15px 4px #0ea5e9, 0 0 5px 1px #fff; }
.beam-impact { position: absolute; top: 50%; width: 25px; height: 25px; background: radial-gradient(circle, #fff 10%, #38bdf8 40%, transparent 70%); opacity: 0.8; transform: translateY(-50%); animation: flash-cut 0.05s infinite alternate; mix-blend-mode: screen; }

@keyframes flash-cut { 0% { transform: translateY(-50%) scale(0.8); opacity: 0.6; } 100% { transform: translateY(-50%) scale(1.2); opacity: 1; } }

/* =========================================
   O LOOT EXPLOSIVO (FIM DA BANDEJA!)
========================================== */
.loot-burst-zone { position: absolute; inset: 0; z-index: 20; pointer-events: none; display: flex; justify-content: center; align-items: center; }

.epic-loot-burst { display: flex; flex-direction: column; align-items: center; gap: 4px; position: absolute; }

.burst-item { 
  display: flex; align-items: center; gap: 6px; 
  background: rgba(2, 6, 23, 0.95); padding: 4px 12px; border-radius: 20px;
  border: 1px solid #334155; box-shadow: 0 5px 15px rgba(0,0,0,0.9);
  opacity: 0; transform: scale(0.5) translateY(0);
  animation: dynamic-burst 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.loot-icon { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 5px currentColor; }
.loot-text { font-size: 13px; font-weight: 900; text-transform: uppercase; text-shadow: 0 2px 4px #000; }

/* A animação fantástica do Loot subindo da mesa */
@keyframes dynamic-burst {
  0% { opacity: 0; transform: scale(0.5) translateY(20px); }
  20% { opacity: 1; transform: scale(1.2) translateY(-40px); }
  80% { opacity: 1; transform: scale(1) translateY(-60px); }
  100% { opacity: 0; transform: scale(0.8) translateY(-100px); }
}

/* Responsividade */
@media (max-width: 768px) {
  .facility-core { flex-direction: column; }
  .facility-panel { width: 100%; }
}
</style>