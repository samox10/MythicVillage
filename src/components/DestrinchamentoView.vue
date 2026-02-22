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
    <div v-if="buildingLevel > 0" class="butchery-complex">
      
      <button @click="addTestCarcasses" class="debug-btn">🚨 RECEBER CARCAÇAS (TESTE)</button>

      <div class="table-area">
        <div class="arcane-table">
          
          <div class="arcane-grid"></div>
          <div v-if="butcheryStore.activeSlot.carcacaId" class="arcane-scanner"></div>

          <div v-if="butcheryStore.activeSlot.carcacaId" class="active-carcass-wrapper">
             <img :src="getCarcassImg(butcheryStore.activeSlot.carcacaId)" class="carcass-on-table">
          </div>
          <div v-else class="empty-table-text">MESA INATIVA</div>

          <div v-for="ft in floatingTexts" :key="ft.id" class="floating-loot-container">
             <div v-for="(loot, index) in ft.drops" :key="index" class="loot-pop" :style="{ animationDelay: `${index * 0.1}s` }">
                +{{ loot.qtd }} {{ RECURSOS_ANIMAIS[loot.item]?.nome }}
             </div>
          </div>
        </div>
        
        <div class="progress-container">
           <div class="progress-bar"><div class="progress-fill" :style="{ width: getProgressPct() + '%' }"></div></div>
        </div>
      </div>

      <div class="queue-section">
        <div class="section-title">FILA DE PROCESSAMENTO ({{ butcheryStore.queue.length }}/10)</div>
        <div class="queue-slots">
          <div v-for="n in 10" :key="n" class="q-slot" 
               :class="{'has-item': butcheryStore.queue[n-1]}"
               @click="butcheryStore.removeFromQueue(n-1)"
               title="Clique para remover e devolver à Câmara Fria">
            <img v-if="butcheryStore.queue[n-1]" :src="getCarcassImg(butcheryStore.queue[n-1])" class="q-img">
            <div class="remove-overlay">✕</div>
          </div>
        </div>
      </div>

      <div class="inventory-section">
        <div class="section-title">
            CÂMARA FRIA ({{ butcheryStore.totalCarcassesInStorage }} / {{ store.maxCarcassStorage }})
        </div>
        <div class="carcass-grid">
          <div v-for="carcass in sortedUnlockedCarcasses" :key="carcass.key" 
               class="carcass-card" :class="{'is-empty': carcass.count <= 0}">
             
             <div class="cc-visual" @click="openDetails(carcass)" title="Ver Detalhes do Monstro">
                <img :src="`/assets/monstros/${carcass.img}`" class="cc-img" @error="$event.target.style.opacity='0.3'">
                <div class="cc-badge" :class="{'bg-red': carcass.count <= 0}">{{ carcass.count }}</div>
                <div class="info-hover-icon">🔍</div>
             </div>

            <div class="card-actions">
               <button class="btn-add-queue" 
                  @click="butcheryStore.addToQueue(carcass.key)"
                  :disabled="carcass.count <= 0 || butcheryStore.queue.length >= 10">
                 ADICIONAR
               </button>
               <button class="btn-trash" 
                  @click="openDiscardModal(carcass)"
                  :disabled="carcass.count <= 0"
                  title="Descartar">
                 🗑️
               </button>
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
.butchery-complex { display: flex; flex-direction: column; gap: 20px; font-family: 'Chakra Petch', sans-serif; }
.section-title { font-size: 11px; color: #64748b; font-weight: 900; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; }

/* Botão de Teste */
.debug-btn { background: #eab308; color: #000; border: 2px solid #ca8a04; padding: 10px; font-family: 'Chakra Petch', sans-serif; font-weight: 900; font-size: 12px; border-radius: 4px; cursor: pointer; box-shadow: 0 4px 10px rgba(234, 179, 8, 0.4); text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s; }
.debug-btn:hover { background: #facc15; transform: translateY(-2px); }

/* Mesa */
/* Mesa Arcana Limpa */
.table-area { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 10px; position: relative; }
.arcane-table { width: 100%; max-width: 320px; height: 180px; background-color: #020617; border: 4px solid #1e293b; border-radius: 8px; position: relative; overflow: hidden; box-shadow: inset 0 0 30px rgba(56, 189, 248, 0.1), 0 10px 15px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }

/* Grade tecnomágica no fundo */
.arcane-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px); background-size: 20px 20px; opacity: 0.5; }

/* Laser Scanner subindo e descendo */
.arcane-scanner { position: absolute; width: 100%; height: 2px; background: #38bdf8; box-shadow: 0 0 15px #38bdf8, 0 0 5px #fff; z-index: 5; animation: scan 3s linear infinite alternate; opacity: 0.8; }
@keyframes scan { 0% { top: 10%; opacity: 0.2; } 50% { opacity: 1; } 100% { top: 90%; opacity: 0.2; } }

.empty-table-text { color: rgba(56, 189, 248, 0.3); font-size: 16px; font-weight: 900; letter-spacing: 4px; z-index: 2; }
.active-carcass-wrapper { position: relative; width: 130px; height: 130px; display: flex; align-items: center; justify-content: center; z-index: 3; }

/* A carcaça ganha um tom azulado quando está na mesa arcana */
.carcass-on-table { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.4)) contrast(1.1); }

/* Barra de progresso Arcana */
.progress-container { width: 100%; max-width: 320px; }
.progress-bar { width: 100%; height: 8px; background: #020617; border: 1px solid #1e293b; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: #38bdf8; box-shadow: 0 0 10px #38bdf8; transition: width 0.2s linear; }

/* Animação do Loot Flutuante */
.floating-loot-container { position: absolute; top: 30%; display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 10; pointer-events: none; }
.loot-pop { background: rgba(2, 6, 23, 0.9); border: 1px solid #22c55e; color: #4ade80; font-size: 12px; font-weight: 900; padding: 2px 8px; border-radius: 4px; opacity: 0; transform: translateY(0); animation: floatUp 2s ease-out forwards; font-family: 'Chakra Petch', sans-serif; box-shadow: 0 0 10px rgba(34, 197, 94, 0.3); }

@keyframes floatUp {
  0% { opacity: 0; transform: translateY(10px) scale(0.8); }
  20% { opacity: 1; transform: translateY(-5px) scale(1.1); }
  30% { transform: translateY(-10px) scale(1); }
  80% { opacity: 1; transform: translateY(-30px); }
  100% { opacity: 0; transform: translateY(-40px); }
}

/* Fila */
.queue-slots { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; background: #0f172a; padding: 10px; border-radius: 6px; border: 1px solid #1e293b; }
.q-slot { width: 35px; height: 35px; background: #020617; border: 1px dashed #334155; border-radius: 4px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.q-img { width: 80%; height: 80%; object-fit: contain; z-index: 1; }
/* Interação de Remoção na Fila */
.q-slot.has-item { cursor: pointer; border-style: solid; border-color: #475569; }
.remove-overlay { position: absolute; inset: 0; background: rgba(239, 68, 68, 0.8); color: #fff; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; z-index: 2; opacity: 0; transition: 0.2s; }
.q-slot.has-item:hover .remove-overlay { opacity: 1; }
.q-slot.has-item:hover { border-color: #ef4444; }

/* Inventário / Câmara Fria */
.carcass-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; }
.carcass-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 6px; padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: 0.2s; }
.carcass-card:hover:not(.is-empty) { border-color: #38bdf8; }
.carcass-card.is-empty { filter: grayscale(0.8); opacity: 0.5; } /* Apaga visualmente as cartas vazias */

.cc-visual { position: relative; width: 60px; height: 60px; background: #1e293b; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 1px solid #334155; box-shadow: inset 0 0 10px #000; cursor: pointer; transition: 0.2s; }
.cc-visual:hover { border-color: #38bdf8; transform: scale(1.05); }
.cc-img { width: 80%; height: 80%; object-fit: contain; filter: drop-shadow(0 2px 2px #000); }
.cc-badge { position: absolute; bottom: -5px; right: -5px; background: #38bdf8; color: #000; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 10px; border: 1px solid #000; z-index: 2; }
.cc-badge.bg-red { background: #ef4444; color: #fff; }
.info-hover-icon { position: absolute; top: -5px; left: -5px; font-size: 12px; opacity: 0; transition: 0.2s; filter: drop-shadow(0 2px 2px #000); }
.cc-visual:hover .info-hover-icon { opacity: 1; }

.cc-name { font-size: 9px; color: #e2e8f0; text-align: center; font-weight: 700; height: 22px; display: flex; align-items: center; }

/* === BOTÕES DO CARTÃO (Adicionar + Lixeira) === */
.card-actions { display: flex; gap: 4px; width: 100%; }
.btn-add-queue { flex: 1; padding: 6px 0; background: #1e293b; border: 1px solid #334155; color: #94a3b8; font-size: 9px; font-weight: 800; border-radius: 4px; cursor: pointer; transition: 0.2s; font-family: 'Chakra Petch', sans-serif; }
.btn-add-queue:hover:not(:disabled) { background: #38bdf8; color: #000; }
.btn-add-queue:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-trash { width: 30px; background: #1e293b; border: 1px solid #334155; color: #ef4444; border-radius: 4px; padding: 0; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.btn-trash:hover:not(:disabled) { background: #450a0a; border-color: #ef4444; }
.btn-trash:disabled { opacity: 0.4; filter: grayscale(1); cursor: not-allowed; }

@media (max-width: 550px) {
  .md-body { flex-direction: column; align-items: center; text-align: center; }
  .md-habitat, .md-time { text-align: left; }
  .md-loot-grid { justify-content: center; }
}
</style>