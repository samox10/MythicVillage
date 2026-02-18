<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useMiningStore } from '../stores/miningStore'
import BuildingLayout from './BuildingLayout.vue'
import { RECURSOS_MINERACAO } from '../data/balancing'

// Verifica se o slot específico está liberado
const isSlotLocked = (mineId, slotIndex) => {
  const info = RECURSOS_MINERACAO[mineId]
  const required = slotIndex === 0 ? info.unlockLvl : info.fullUnlockLvl
  return store.miningLevel < required
}

// Retorna o nível necessário para o tooltip
const getLockText = (mineId, slotIndex) => {
  const info = RECURSOS_MINERACAO[mineId]
  return `NVL ${slotIndex === 0 ? info.unlockLvl : info.fullUnlockLvl}`
}

const store = useGameStore()
const miningStore = useMiningStore()

// Controle do Modal
const showWorkerSelect = ref(false)
const selectedMineId = ref(null)
const selectedSlotIndex = ref(null)

// Filtra mineradores livres
const availableMiners = computed(() => {
  return store.workers.filter(w => 
    w.jobKey === 'minerador' && 
    w.strikeDays === 0 &&
    !miningStore.assignedWorkerIds.includes(w.id)
  )
})

// Ações
const openSlot = (mineId, slotIndex) => {
  selectedMineId.value = mineId
  selectedSlotIndex.value = slotIndex
  showWorkerSelect.value = true
}

const selectMiner = (workerId) => {
  miningStore.assignWorker(selectedMineId.value, selectedSlotIndex.value, workerId)
  showWorkerSelect.value = false
}

const removeMiner = (mineId, slotIndex) => {
  miningStore.removeWorker(mineId, slotIndex)
}

// Helpers Visuais
const getCartLabel = (mine) => {
  if (mine.cartStatus === 'MINING') return `${Math.floor(mine.cartLoad)} / ${mine.cartMax}`
  if (mine.cartStatus === 'FULL') return 'CHEIO'
  if (mine.cartStatus === 'TO_VILLAGE') return `CHEGANDO... (${Math.ceil(mine.travelTimer)}s)`
  if (mine.cartStatus === 'READY') return 'COLETAR'
  if (mine.cartStatus === 'TO_MINE') return `RETORNANDO (${Math.ceil(mine.travelTimer)}s)`
  return '...'
}

const getCartClass = (status) => {
  if (status === 'FULL') return 'btn-full'
  if (status === 'READY') return 'btn-ready'
  if (status === 'TO_VILLAGE' || status === 'TO_MINE') return 'btn-travel'
  return 'btn-mining'
}

const getWorkerAvatar = (id) => {
  const w = store.workers.find(x => x.id === id)
  return w ? w.avatarUrl : null
}
</script>

<template>
  <BuildingLayout
    title="Minas Profundas"
    :level="1"
    icon="⛏️"
    :hide-admin-panel="true"
    :hide-help="true"
  >
    <div class="mine-list">
      <div class="mine-header-row desktop-only">
        <div class="mh-col name">RECURSO</div>
        <div class="mh-col slots">OPERÁRIOS</div>
        <div class="mh-col cart">TRANSPORTE</div>
      </div>

      <div v-for="mine in miningStore.mines" :key="mine.id" class="mine-card" :style="{ borderLeftColor: mine.color }">
        
        <div class="mc-info">
          <div class="mc-icon-frame" :style="{ borderColor: mine.color }">
            <img :src="`/assets/recursos/min_${mine.id}.png`" class="mc-img" @error="$event.target.style.opacity='0.3'">
          </div>
          <div class="mc-text">
            <span class="mc-name" :style="{ color: mine.color }">{{ mine.name }}</span>
            <span class="mc-stock">ESTOQUE: {{ Math.floor(store.inventory[mine.id] || 0) }}</span>
          </div>
        </div>

        <div class="mc-slots">
          <div v-for="(slot, idx) in mine.slots" :key="idx" class="worker-slot">
            
            <div v-if="isSlotLocked(mine.id, idx)" class="slot-locked" :title="`Requer Mina Nível ${getLockText(mine.id, idx)}`">
               <span class="lock-icon">🔒</span>
               <span class="lock-lvl">{{ getLockText(mine.id, idx) }}</span>
            </div>

            <div v-else-if="slot" class="slot-filled" @click="removeMiner(mine.id, idx)" title="Remover (Clique)">
              <img :src="getWorkerAvatar(slot)" class="w-avatar">
            </div>

            <button v-else class="slot-empty" @click="openSlot(mine.id, idx)">+</button>
          
          </div>
        </div>

        <div class="mc-cart">
          <div class="cart-track">
            <div class="cart-fill" :style="{ width: (mine.cartLoad / mine.cartMax) * 100 + '%', backgroundColor: mine.color }"></div>
          </div>
          <button 
            class="cart-btn" 
            :class="getCartClass(mine.cartStatus)"
            @click="mine.cartStatus === 'READY' ? miningStore.collectAndReturnCart(mine.id) : miningStore.sendCartToVillage(mine.id)"
            :disabled="mine.cartStatus === 'TO_VILLAGE' || mine.cartStatus === 'TO_MINE' || (mine.cartStatus === 'MINING' && mine.cartLoad < 1)"
          >
            {{ getCartLabel(mine) }}
          </button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showWorkerSelect" @click.self="showWorkerSelect = false">
      <div class="tactical-card select-modal">
        <div class="tc-header"><span class="tc-title">SELECIONAR MINERADOR</span><button class="tc-close" @click="showWorkerSelect = false">✕</button></div>
        <div class="select-list">
          <div v-for="w in availableMiners" :key="w.id" class="select-item" @click="selectMiner(w.id)">
            <div class="si-left">
              <img :src="w.avatarUrl" class="si-avatar">
              <div class="si-info">
                <span class="si-name">{{ w.name }}</span>
                <span class="si-rank">TIER {{ w.tier }}</span>
              </div>
            </div>
            <span class="si-eff">{{ w.efficiency }}% EFIC.</span>
          </div>
          <div v-if="availableMiners.length === 0" class="empty-list">
            Nenhum minerador disponível.<br>
            <small>Contrate a classe "Minerador" no Recrutamento.</small>
          </div>
        </div>
      </div>
    </div>

  </BuildingLayout>
</template>

<style scoped>
/* CSS Específico da Mina (O resto vem do UI.css) */
.mine-list { display: flex; flex-direction: column; gap: 10px; }
.mine-header-row { display: flex; padding: 0 15px; color: #64748b; font-size: 10px; font-weight: 700; margin-bottom: 5px; }
.mh-col { flex: 1; }
.mh-col.name { flex: 1.5; }

.mine-card { 
  background: #1e293b; border: 1px solid #334155; border-left: 4px solid #fff; 
  border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 15px; 
  transition: 0.2s;
}
.mine-card:hover { transform: translateX(5px); background: #252f42; }

.mc-info { flex: 1.5; display: flex; align-items: center; gap: 10px; }
.mc-icon-frame { width: 40px; height: 40px; border: 1px solid #475569; border-radius: 4px; background: #0f172a; padding: 2px; }
.mc-img { width: 100%; height: 100%; object-fit: contain; }
.mc-text { display: flex; flex-direction: column; }
.mc-name { font-weight: 800; font-size: 12px; text-transform: uppercase; }
.mc-stock { font-size: 9px; color: #94a3b8; }

.mc-slots { flex: 1; display: flex; gap: 5px; justify-content: center; }
.worker-slot { width: 35px; height: 35px; }
.slot-empty { width: 100%; height: 100%; background: #0f172a; border: 1px dashed #475569; color: #475569; cursor: pointer; transition: 0.2s; }
.slot-empty:hover { border-color: #38bdf8; color: #38bdf8; }
.slot-filled { width: 100%; height: 100%; cursor: pointer; border: 1px solid #38bdf8; border-radius: 4px; overflow: hidden; }
.w-avatar { width: 100%; height: 100%; object-fit: cover; }

.mc-cart { flex: 1.5; display: flex; flex-direction: column; gap: 5px; }
.cart-track { height: 6px; background: #0f172a; border-radius: 3px; overflow: hidden; }
.cart-fill { height: 100%; transition: width 0.5s; }

.cart-btn { 
  width: 100%; padding: 6px; border: none; border-radius: 4px; 
  font-family: 'Chakra Petch'; font-weight: 700; font-size: 10px; cursor: pointer; 
}
.btn-mining { background: #334155; color: #94a3b8; }
.btn-mining:hover:not(:disabled) { background: #475569; color: #fff; }
.btn-full { background: #eab308; color: #000; animation: pulse-yellow 1s infinite; }
.btn-travel { background: #0f172a; border: 1px solid #38bdf8; color: #38bdf8; cursor: wait; }
.btn-ready { background: #10b981; color: #000; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
.slot-locked {
  width: 100%; height: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  opacity: 0.5; cursor: not-allowed;
}
.lock-icon { font-size: 12px; }
.lock-lvl { font-size: 7px; color: #ef4444; font-weight: 700; margin-top: -2px; }

@keyframes pulse-yellow { 0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); } 70% { box-shadow: 0 0 0 5px rgba(234, 179, 8, 0); } }

@media (max-width: 600px) {
  .mine-card { flex-wrap: wrap; gap: 10px; }
  .mc-info { width: 100%; flex: none; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; }
  .mc-slots { flex: 1; justify-content: flex-start; }
  .mc-cart { flex: 1.5; }
  .desktop-only { display: none; }
}
</style>