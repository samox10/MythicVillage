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
// O filtro atual do cofre (Padrão: mostra tudo)
const filterResource = ref('todos')
// O texto digitado na barra de pesquisa
const searchQuery = ref('')

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

// Lista de carcaças desbloqueadas, já filtrada e ordenada
const sortedUnlockedCarcasses = computed(() => { 
  const list = [] 
  // Pegamos o que o usuário digitou, deixamos minúsculo e tiramos os espaços das pontas
  const query = searchQuery.value.toLowerCase().trim()

  for (const [key, info] of Object.entries(CARCACAS_INFO)) {
    if (info.unlockLvl <= buildingLevel.value) {
      
      // 1. Filtro da Caixa Suspensa (Select)
      if (filterResource.value !== 'todos') {
        if (!info.drops[filterResource.value]) {
          continue // Se não tiver o recurso, pula para o próximo
        }
      }

      // 2. Filtro da Barra de Pesquisa (Texto)
      if (query) {
        const matchName = info.nome.toLowerCase().includes(query)
        const matchHabitat = info.habitat.toLowerCase().includes(query)
        
        // Verifica se a palavra digitada bate com o nome de algum loot (ex: "carne", "osso")
        const matchResource = Object.keys(info.drops).some(dropKey => {
           const resourceName = RECURSOS_ANIMAIS[dropKey]?.nome.toLowerCase() || ''
           return resourceName.includes(query) || dropKey.includes(query)
        })

        // Se o que o cara digitou não está no nome, nem no habitat, nem no loot... pula!
        if (!matchName && !matchHabitat && !matchResource) {
          continue
        }
      }
      
      list.push({ key, ...info, count: getInventoryCount(key) })
    }
  }
  
  // A ordenação: quem tem no inventário aparece primeiro
  return list.sort((a, b) => {
    const hasA = a.count > 0 ? 1 : 0
    const hasB = b.count > 0 ? 1 : 0
    if (hasA !== hasB) return hasB - hasA 
    return a.unlockLvl - b.unlockLvl 
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
    empty-desc="Nenhum profissional na mesa. O processo está parado."
    :hide-help="true"
    @remove-leader="butcheryStore.assignWorker(null)"
    @assign-leader="showWorkerSelect = true"
  >
    <div v-if="buildingLevel > 0" class="mythic-butchery-layout">
      
      <button @click="addTestCarcasses" class="btn-dev-override">
        [ DEV ] INJETAR ESPÉCIMES
      </button>

      <div class="workspace-panel">
        
        <div class="queue-section">
          <div class="section-title text-center">FILA DE PROCESSAMENTO ({{ butcheryStore.queue.length }}/10)</div>
          
          <div class="queue-tray">
            <div class="queue-hotbar">
              <div v-for="n in 10" :key="n" class="hotbar-slot" 
                   :class="{'is-filled': butcheryStore.queue[n-1]}"
                   @click="butcheryStore.removeFromQueue(n-1)"
                   title="Remover da fila">
                
                <img v-if="butcheryStore.queue[n-1]" :src="getCarcassImg(butcheryStore.queue[n-1])" class="slot-img">
                <div v-else class="slot-empty"></div>
                <div v-if="butcheryStore.queue[n-1]" class="slot-remove-hover">✕</div>
              </div>
            </div>
          </div>
        </div>

        <div class="slab-section">
          
          <div class="heavy-operation-table">
            
            <div class="drain-channel left"></div>
            <div class="drain-channel right"></div>

            <div v-if="butcheryStore.activeSlot.carcacaId" class="table-active-state">
               
               <img :src="getCarcassImg(butcheryStore.activeSlot.carcacaId)" class="table-specimen">
               
               <div class="laser-bridge" :style="{ left: getProgressPct() + '%' }">
                  <div class="bridge-top"></div>
                  <div class="bridge-beam"></div>
                  <div class="bridge-bottom"></div>
               </div>

               <div class="embedded-hud">
                 <div class="hud-label">PROCESSO: {{ Math.floor(getProgressPct()) }}%</div>
                 <div class="hud-progress-container">
                   <div class="hud-progress-fill" :style="{ width: getProgressPct() + '%' }"></div>
                 </div>
               </div>
            </div>
            
            <div v-else class="table-idle-state">
               <span class="idle-text">MESA LIVRE</span>
               <div class="idle-subtext">Aguardando espécime biológico</div>
            </div>

            <div class="loot-zone">
               <div v-for="ft in floatingTexts" :key="ft.id" class="loot-burst">
                  <div v-for="(loot, index) in ft.drops" :key="index" class="loot-tag" 
                       :style="{ borderColor: RECURSOS_ANIMAIS[loot.item]?.cor, animationDelay: `${index * 0.05}s` }">
                     <span class="loot-dot" :style="{ backgroundColor: RECURSOS_ANIMAIS[loot.item]?.cor }"></span>
                     <span class="loot-text" :style="{ color: RECURSOS_ANIMAIS[loot.item]?.cor }">+{{ loot.qtd }} {{ RECURSOS_ANIMAIS[loot.item]?.nome }}</span>
                  </div>
               </div>
            </div>

          </div>

        </div>

      </div>

      <div class="vault-panel">
        <div class="vault-header">
          <div class="vault-info">
            <span class="section-title">COFRE CRIOGÊNICO</span>
            <span class="capacity-tag">{{ butcheryStore.totalCarcassesInStorage }} / {{ store.maxCarcassStorage }} ARMAZENADO</span>
          </div>

          <div class="vault-filters">
            <input type="text" v-model="searchQuery" class="game-input" placeholder="Pesquisar monstro ou loot...">
            <select v-model="filterResource" class="game-select">
              <option value="todos">FILTRO: TODOS</option>
              <option value="carne">CARNE</option>
              <option value="osso">OSSO</option>
              <option value="couro">COURO</option>
              <option value="escama">ESCAMA</option>
              <option value="sangue">SANGUE</option>
              <option value="presa">PRESA</option>
            </select>
          </div>
        </div>
        
        <div class="card-grid">
          <div v-for="carcass in sortedUnlockedCarcasses" :key="carcass.key" 
               class="game-card" :class="{'out-of-stock': carcass.count <= 0}">
             
             <div class="card-img-area" @click="openDetails(carcass)" title="Ver Dados Biológicos">
                <img :src="`/assets/monstros/${carcass.img}`" class="card-monster" @error="$event.target.style.opacity='0.1'">
                <div class="card-qty">{{ carcass.count }}</div>
             </div>

             <div class="card-buttons">
               <button class="btn-game btn-action" 
                  @click="butcheryStore.addToQueue(carcass.key)"
                  :disabled="carcass.count <= 0 || butcheryStore.queue.length >= 10">
                 PENDURAR
               </button>
               <button class="btn-game btn-delete" 
                  @click="openDiscardModal(carcass)"
                  :disabled="carcass.count <= 0"
                  title="Descartar">
                 ✕
               </button>
             </div>
          </div>
          
          <div v-if="sortedUnlockedCarcasses.length === 0" class="empty-search">
             Nenhum espécime encontrado com estes filtros.
          </div>
        </div>
      </div>

    </div>

    <WorkerSelectModal v-if="showWorkerSelect" title="ESCOLHER DISSECADOR" :workers="availableWorkers" @close="showWorkerSelect = false" @select="selectWorker" />
    <ModalAnaliseBiologica v-if="detailedCarcass" :carcass="detailedCarcass" @close="closeDetails" />
    <ModalDescarte v-if="showDiscardModal" :carcass="carcassToDiscard" :inventoryCount="getInventoryCount(carcassToDiscard.key)" @close="closeDiscardModal" @confirm="confirmDiscard" />
  </BuildingLayout>
</template>

<style scoped>
/* =========================================
   VISUAL OFICIAL MYTHIC VILLAGE
========================================== */
.mythic-butchery-layout { display: flex; flex-direction: column; gap: 20px; font-family: 'Chakra Petch', sans-serif; }
.btn-dev-override { align-self: flex-start; background: #0f172a; color: #ef4444; border: 1px dashed #ef4444; padding: 6px 12px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.btn-dev-override:hover { background: #ef4444; color: #fff; }

.section-title { color: #94a3b8; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
.text-center { text-align: center; width: 100%; }

/* =========================================
   PAINEL SUPERIOR (Trabalho)
========================================== */
.workspace-panel {
  background: #0f172a; border: 1px solid #1e293b; border-radius: 8px;
  padding: 20px; display: flex; flex-direction: column; gap: 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

/* Fila (Agora centralizada na Bandeja) */
.queue-section { display: flex; flex-direction: column; align-items: center; }
.queue-tray {
  background: #020617; padding: 10px 15px; border-radius: 8px;
  border: 1px solid #1e293b; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
  display: inline-block;
}
.queue-hotbar { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }

.hotbar-slot {
  width: 50px; height: 50px; background: #0f172a; border: 1px solid #334155;
  border-radius: 6px; display: flex; justify-content: center; align-items: center;
  position: relative; transition: 0.2s; cursor: pointer;
}
.hotbar-slot.is-filled { background: #1e293b; border-color: #475569; }
.hotbar-slot:hover.is-filled { border-color: #ef4444; }
.slot-empty { width: 15px; height: 2px; background: #1e293b; border-radius: 2px; }
.slot-img { max-width: 80%; max-height: 80%; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
.slot-remove-hover {
  position: absolute; inset: 0; background: rgba(239, 68, 68, 0.9); border-radius: 5px;
  color: white; display: flex; justify-content: center; align-items: center;
  font-size: 14px; font-weight: bold; opacity: 0; transition: 0.2s;
}
.hotbar-slot:hover .slot-remove-hover { opacity: 1; }

/* =========================================
   A MESA DE CORTE (Formato Pesado / Real)
========================================== */
.slab-section { display: flex; justify-content: center; padding-bottom: 20px; }

.heavy-operation-table {
  position: relative;
  width: 320px; height: 160px; /* Formato retangular de mesa */
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border: 3px solid #334155;
  border-radius: 12px;
  /* O segredo para parecer pesada: um box-shadow sólido embaixo imitando espessura 3D */
  box-shadow: 
    0 12px 0 #020617,
    0 18px 20px rgba(0,0,0,0.8),
    inset 0 0 20px rgba(0,0,0,0.6);
  margin-bottom: 12px; /* Compensar a sombra 3D */
  display: flex; justify-content: center; align-items: center;
}

/* Calhas de Drenagem */
.drain-channel {
  position: absolute; top: 10px; bottom: 10px; width: 15px;
  background: repeating-linear-gradient(0deg, transparent, transparent 4px, #020617 4px, #020617 6px);
  border: 1px solid #020617; border-radius: 4px; opacity: 0.4;
}
.drain-channel.left { left: 15px; }
.drain-channel.right { right: 15px; }

/* ESTADO ATIVO */
.table-active-state { position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; z-index: 5; }

.table-specimen { max-width: 160px; max-height: 110px; object-fit: contain; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.8)); z-index: 6; }

/* Braço do Laser (Ponte de Scanner) */
.laser-bridge {
  position: absolute; top: -10px; bottom: -10px; width: 10px;
  background: #334155; border: 1px solid #020617; border-radius: 4px;
  display: flex; flex-direction: column; align-items: center;
  z-index: 10; transition: left 0.1s linear; pointer-events: none;
  box-shadow: 0 0 10px rgba(0,0,0,0.9);
}
.bridge-top, .bridge-bottom { width: 14px; height: 10px; background: #0f172a; border: 1px solid #38bdf8; border-radius: 2px; }
.bridge-beam { flex: 1; width: 2px; background: #fff; box-shadow: 0 0 10px 2px #38bdf8; }

/* HUD da Mesa */
.embedded-hud {
  position: absolute; bottom: 10px;
  background: #020617; border: 1px solid #38bdf8; border-radius: 4px;
  padding: 4px 10px; width: 160px; text-align: center;
  box-shadow: 0 5px 10px rgba(0,0,0,0.8); z-index: 20;
}
.hud-label { font-size: 9px; color: #38bdf8; font-weight: bold; margin-bottom: 4px; letter-spacing: 1px; }
.hud-progress-container { width: 100%; height: 4px; background: #1e293b; border-radius: 2px; overflow: hidden; }
.hud-progress-fill { height: 100%; background: #38bdf8; box-shadow: 0 0 5px #38bdf8; transition: width 0.1s linear; }

/* ESTADO INATIVO */
.table-idle-state { display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2; }
.idle-text { color: #475569; font-size: 14px; font-weight: bold; letter-spacing: 2px; }
.idle-subtext { color: #334155; font-size: 9px; text-transform: uppercase; }

/* Loot Flutuante Restrito */
.loot-zone { position: absolute; top: -40px; left: 50%; transform: translateX(-50%); pointer-events: none; z-index: 30; display: flex; flex-direction: column; align-items: center; }
.loot-burst { display: flex; flex-direction: column; align-items: center; gap: 4px; position: absolute; bottom: 0; }
.loot-tag {
  display: flex; align-items: center; gap: 6px; background: #020617;
  padding: 4px 10px; border-radius: 20px; border: 1px solid;
  opacity: 0; animation: float-tag 1.2s ease-out forwards;
}
.loot-dot { width: 6px; height: 6px; border-radius: 50%; }
.loot-text { font-size: 11px; font-weight: bold; text-transform: uppercase; white-space: nowrap; }
@keyframes float-tag {
  0% { opacity: 0; transform: translateY(10px) scale(0.8); }
  20% { opacity: 1; transform: translateY(-10px) scale(1); }
  80% { opacity: 1; transform: translateY(-30px) scale(1); }
  100% { opacity: 0; transform: translateY(-40px) scale(0.9); }
}

/* =========================================
   PAINEL INFERIOR (Cofre / Inventário)
========================================== */
.vault-panel { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 15px; }
.vault-header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 10px; border-bottom: 2px solid #1e293b; padding-bottom: 15px; }
.vault-info { display: flex; flex-direction: column; gap: 4px; }
.capacity-tag { background: #020617; color: #38bdf8; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; border: 1px solid #1e293b; align-self: flex-start; }

.vault-filters { display: flex; gap: 8px; flex: 1; max-width: 400px; justify-content: flex-end; }
.game-input, .game-select { background: #020617; border: 1px solid #334155; color: #e2e8f0; padding: 8px 12px; border-radius: 4px; outline: none; font-family: 'Chakra Petch', sans-serif; font-size: 11px; transition: 0.2s; }
.game-input { flex: 1; }
.game-input:focus, .game-select:focus { border-color: #38bdf8; }

/* Grade de Cartões */
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
.game-card { background: #1e293b; border: 1px solid #334155; border-radius: 6px; display: flex; flex-direction: column; overflow: hidden; transition: 0.2s; }
.game-card:hover { border-color: #38bdf8; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transform: translateY(-2px); }
.game-card.out-of-stock { opacity: 0.5; filter: grayscale(1); pointer-events: none; }

.card-img-area { position: relative; height: 90px; background: #020617; display: flex; justify-content: center; align-items: center; cursor: pointer; border-bottom: 1px solid #334155; }
.card-monster { max-width: 80%; max-height: 80%; object-fit: contain; transition: 0.2s; }
.card-img-area:hover .card-monster { transform: scale(1.1); }
.card-qty { position: absolute; top: 5px; right: 5px; background: #0f172a; color: #38bdf8; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; border: 1px solid #1e293b; }

.card-buttons { display: flex; gap: 2px; padding: 4px; background: #0f172a; }
.btn-game { font-family: 'Chakra Petch', sans-serif; font-size: 10px; font-weight: bold; padding: 6px 0; border-radius: 4px; cursor: pointer; border: none; transition: 0.2s; }
.btn-action { flex: 1; background: #334155; color: #f8fafc; }
.btn-action:hover:not(:disabled) { background: #38bdf8; color: #020617; }
.btn-delete { flex: 0 0 30px; background: transparent; border: 1px solid #ef4444; color: #ef4444; }
.btn-delete:hover:not(:disabled) { background: #ef4444; color: #fff; }

.empty-search { grid-column: 1 / -1; padding: 20px; text-align: center; color: #64748b; font-size: 12px; font-style: italic; border: 1px dashed #334155; border-radius: 6px; }

@media (max-width: 600px) {
  .vault-filters { max-width: 100%; flex-direction: column; }
  .card-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
}
</style>