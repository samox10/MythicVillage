<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useMiningStore } from '../stores/miningStore'
import BuildingLayout from './BuildingLayout.vue'
import WorkerSelectModal from './WorkerSelectModal.vue'
import { RECURSOS_MINERACAO, TIER_ORDER } from '../data/balancing'

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
  // 1. Primeiro a gente filtra quem pode trabalhar
  const miners = store.workers.filter(w => 
    w.jobKey === 'minerador' && 
    (w.strikeDays || 0) === 0 && 
    !miningStore.assignedWorkerIds.includes(w.id)
  )

  // 2. Depois a gente organiza a lista do maior Tier para o menor
  return miners.sort((a, b) => {
    const pesoA = TIER_ORDER.indexOf(a.tier)
    const pesoB = TIER_ORDER.indexOf(b.tier)
    return pesoB - pesoA
  })
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
// Calcula a produção por HORA baseada nos trabalhadores da mina
const getProductionPerHour = (mine) => {
  let productionPerSec = 0
  const resourceInfo = RECURSOS_MINERACAO[mine.id]
  const hardness = resourceInfo ? resourceInfo.dureza : 1

  mine.slots.forEach((workerId, index) => {
    if (!workerId) return
    
    // Verifica se o slot está bloqueado pelo nível da mina
    const requiredLvl = index === 0 ? resourceInfo.unlockLvl : resourceInfo.fullUnlockLvl
    if (store.miningLevel < requiredLvl) return

    const worker = store.workers.find(w => w.id === workerId)
    if (worker && (worker.strikeDays || 0) === 0) {
      // Fórmula idêntica ao miningStore.js
      productionPerSec += (worker.efficiency / 10) / hardness
    }
  })

  // Multiplica por 3600 (segundos em 1h)
  const perHour = productionPerSec * 3600
  return `${Math.floor(perHour)} / HR`
}
// === CONTROLE VISUAL DA FROTA (CORRIGIDO) ===
const isAnyReady = computed(() => miningStore.elevators.some(e => e.status === 'READY'))
const hasIdleElevator = computed(() => miningStore.elevators.some(e => e.status === 'IDLE'))
// Verifica se há algum carrinho a caminho ou na mina específica
const isElevatorOnWay = (mineId) => {
  return miningStore.elevators.some(e => e.targetMineId === mineId)
}

// === CONTROLE VISUAL PRECISO ===
const getElevatorStyle = (el) => {
  // CONFIGURAÇÃO DAS ALTURAS (Pixels)
  const HEADER_HEIGHT = 100; // Altura do topo + margem
  const LAYER_HEIGHT = 140;  // Altura de cada mina
  const HALF_LAYER = 70;     // Metade da mina (para centralizar)
  const SURFACE_CENTER = 61; // Onde o carrinho para na superfície (centro do header)

  let targetTop = `${SURFACE_CENTER}px`; // Padrão: Superfície

  // Se estiver descendo ou carregando, calcula a posição da mina
  if (el.status === 'MOVING_DOWN' || el.status === 'LOADING') {
    const idx = miningStore.mines.findIndex(m => m.id === el.targetMineId)
    if (idx !== -1) {
       // Cálculo: Pula o Header + (Quantos andares desceu) + Metade do andar atual
       const position = HEADER_HEIGHT + (idx * LAYER_HEIGHT) + HALF_LAYER;
       targetTop = `${position}px`;
    }
  }

  // Define a duração da viagem
  const duration = el.status === 'LOADING' ? '0s' : `${el.totalTravelTime}s`;

  return {
    top: targetTop,
    '--duration': duration
  }
}

// Helper para luz verde (Mantenha este se já não tiver)
const isMineLoading = (mineId) => {
  return miningStore.elevators.some(e => e.targetMineId === mineId && e.status === 'LOADING')
}
// Função que verifica se o elevador está descendo para a mina
const isMineApproaching = (mineId) => {
  return miningStore.elevators.some(e => e.targetMineId === mineId && e.status === 'MOVING_DOWN')
}
// Conta quantos operários estão ativos em todas as minas
const activeMinersCount = computed(() => {
  let count = 0;
  miningStore.mines.forEach(m => {
    count += m.slots.filter(s => s !== null).length;
  });
  return count;
});

// Verifica se existe algum elevador subindo ou descendo para girar a engrenagem
const isAnyElevatorMoving = computed(() => {
  return miningStore.elevators.some(e => e.status === 'MOVING_UP' || e.status === 'MOVING_DOWN');
});

const getWorkerAvatar = (id) => {
  const w = store.workers.find(x => x.id === id)
  return w ? w.avatarUrl : null
}
const handleImageError = (event) => {
  event.target.style.opacity = '0.3'
}

</script>

<template>
  <BuildingLayout
    title="Minas Profundas"
    :level="store.miningLevel"
    :maxLevel="21"
    icon="⛏️"
    :hide-admin-panel="true"
    :hide-help="true"
  >
    <div class="floating-stock-panel">
      <div class="fs-grid">
        <div v-for="mine in miningStore.mines" :key="'stock-'+mine.id" class="fs-item" :title="mine.name">
          <div class="fs-abbr">{{ mine.name.substring(0, 3).toUpperCase() }}</div>
          <img :src="`/assets/recursos/min_${mine.id}.png`" class="fs-icon" @error="handleImageError">
          <div class="fs-amount">{{ Math.floor(store.inventory[mine.id] || 0) }}</div>
        </div>
      </div>
    </div>

    <div class="mining-complex fixed-layout">
      
      <div class="mines-column">
        
        <div class="surface-level overseer-tent">
          <div class="tent-bg">
            
            <div class="notice-board">
              <div class="paper-note">
                <span class="note-title">Aviso de Turno</span>
                <div class="note-line">Operários: <strong>{{ activeMinersCount }}</strong></div>
                <div class="note-line">Carrinhos: <strong>{{ miningStore.elevators.length }}</strong></div>
              </div>
            </div>

            <div class="action-area">
              <button class="btn-wood-sign" :class="{'ready': isAnyReady}" @click="miningStore.collectElevators()" :disabled="!isAnyReady">
                <span class="sign-nails left"></span>
                {{ isAnyReady ? 'COLETAR RECURSOS' : 'AGUARDANDO...' }}
                <span class="sign-nails right"></span>
              </button>
            </div>

          </div>
        </div>

        <div v-for="(mine, index) in miningStore.mines" :key="mine.id" class="earth-layer">
          <div class="mine-card">
            
            <div class="card-header">
              <span class="lvl-tag">NV. {{ index + 1 }}</span>
              <span class="depth-tag">-{{ (index + 1) * 50 }}m</span>
            </div>

            <div class="card-body">
              <div class="mine-identity">
                <div class="mine-icon"><img :src="`/assets/recursos/min_${mine.id}.png`" @error="handleImageError"></div>
                <div class="mine-details">
                  <span class="m-name">{{ mine.name }}</span>
                  <span class="m-rate">{{ getProductionPerHour(mine) }}</span>
                </div>
              </div>

              <div class="mine-logistics">
                <div class="silo-display">
                  <div class="silo-bar">
                    <div class="silo-fill" :style="{ width: (mine.reservoirLoad / mine.reservoirMax * 100) + '%' }"></div>
                    <span class="silo-txt">{{ Math.floor(mine.reservoirLoad) }}/{{ mine.reservoirMax }}</span>
                  </div>
                </div>
                <button 
                  class="btn-call" 
                  :class="{'active': hasIdleElevator && mine.reservoirLoad > 0 && (store.inventory[mine.id] || 0) < store.maxStorage && !isElevatorOnWay(mine.id)}"
                  @click="miningStore.dispatchElevator(mine.id)"
                  :disabled="!hasIdleElevator || mine.reservoirLoad < 1 || (store.inventory[mine.id] || 0) >= store.maxStorage || isElevatorOnWay(mine.id)"
                >
                  {{ (store.inventory[mine.id] || 0) >= store.maxStorage ? 'CHEIO' : (isElevatorOnWay(mine.id) ? 'EM ROTA' : 'CHAMAR') }}
                </button>
              </div>
            </div>

            <div class="card-footer">
               <div v-for="(slot, idx) in mine.slots" :key="idx" class="worker-slot">
                  <div v-if="isSlotLocked(mine.id, idx)" class="slot-lock">🔒</div>
                  <div v-else-if="slot" class="slot-filled" @click="removeMiner(mine.id, idx)"><img :src="getWorkerAvatar(slot)"></div>
                  <button v-else class="slot-add" @click="openSlot(mine.id, idx)">+</button>
               </div>
            </div>

            <div class="connector-tunnel">
              <div class="tunnel-light" :class="{'loading-green': isMineLoading(mine.id), 'approaching-orange': isMineApproaching(mine.id)}"></div>
            </div>

          </div>
        </div>
      </div>

      <div class="elevator-structure">
        <div class="shaft-background">
          
          <div class="shaft-header-bg">
            <div class="crane-beam">
              <div class="gear-wrapper"><span class="winch-gear" :class="{'is-spinning': isAnyElevatorMoving}">⚙️</span></div>
              <div class="gear-wrapper"><span class="winch-gear reverse" :class="{'is-spinning': isAnyElevatorMoving}">⚙️</span></div>
            </div>
            
            <div class="parking-station">
               <div class="cable-line left-cable"></div>
               <div class="cable-line right-cable"></div>
               <div class="bumper-pad left-pad"></div>
               <div class="bumper-pad right-pad"></div>
               <div class="platform-base warning-stripes"></div>
            </div>
          </div>
          
          <div class="shaft-body-bg">
            <div class="main-cable left-cable"></div>
            <div class="main-cable right-cable"></div>
          </div>
          
          <div class="shaft-footer-bg">
          </div>
        </div>

        <div 
          v-for="(el, index) in miningStore.elevators" 
          :key="el.id"
          class="elevator-cab" 
          :class="[`cart-${index + 1}`, `state-${el.status.toLowerCase()}`]" 
          :style="getElevatorStyle(el)"
        >
           <div class="cab-clean">
             <img v-if="el.resourceId && el.currentLoad > 0" :src="`/assets/recursos/min_${el.resourceId}.png`" class="cab-cargo" @error="handleImageError">
             <img src="/assets/ui/i_mineracao.png" class="cab-img" @error="handleImageError">
           </div>
           <div class="cab-badge" v-if="el.currentLoad > 0">{{ Math.floor(el.currentLoad) }}</div>
        </div>

      </div>
    </div>

    <WorkerSelectModal 
      v-if="showWorkerSelect"
      title="SELECIONAR MINERADOR"
      :workers="availableMiners"
      emptyMessage1="Nenhum minerador disponível."
      emptyMessage2="Contrate a classe 'Minerador' no Recrutamento."
      @close="showWorkerSelect = false"
      @select="selectMiner"
    />
  </BuildingLayout>
</template>

<style scoped>
.floating-stock-panel { display: flex; justify-content: center; margin-bottom: 35px; }
.fs-grid { display: flex; flex-wrap: wrap; gap: 35px 20px; justify-content: center; background: #0f172a; padding: 20px 25px; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
.fs-item { position: relative; width: 48px; height: 48px; background: linear-gradient(135deg, #253147 0%, #0f172a 100%); border: 1px solid #475569; border-top: 1px solid #64748b; border-radius: 10px; display: flex; justify-content: center; align-items: center; transition: all 0.3s ease; cursor: default; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); }
.fs-item:hover { border-color: #38bdf8; transform: translateY(-3px); box-shadow: 0 6px 12px rgba(56, 189, 248, 0.2), inset 0 0 10px rgba(56, 189, 248, 0.1); }
.fs-icon { width: 65%; height: 65%; object-fit: contain; filter: drop-shadow(0 3px 3px rgba(0,0,0,0.6)); }
.fs-abbr { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(to bottom, #334155, #1e293b); border: 1px solid #475569; color: #cbd5e1; font-size: 8px; font-weight: 900; letter-spacing: 1px; padding: 3px 8px; border-radius: 4px; z-index: 2; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }
.fs-amount { position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); background: #0f172a; border: 1px solid #334155; border-radius: 12px; color: #94a3b8; font-size: 10px; font-weight: 800; font-family: monospace; padding: 2px 8px; z-index: 2; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }

.mining-complex.fixed-layout { display: flex; align-items: stretch; background: transparent; gap: 0; width: 100%; position: relative; }
.mines-column { flex: 1; display: flex; flex-direction: column; padding-right: 15px; min-width: 0; }

/* === SUPERFÍCIE TEMÁTICA (TENDA DO FEITOR / QUADRO DA GUILDA) === */
.surface-level.overseer-tent { 
  height: 90px; 
  margin-bottom: 10px; 
  border-radius: 8px; 
  display: flex; 
  overflow: hidden; 
  /* Fundo simulando tábuas de madeira escura */
  background: #271c19;
  background-image: repeating-linear-gradient(to right, #271c19, #271c19 30px, #30221f 30px, #30221f 32px);
  border: 2px solid #1a1210; 
  box-shadow: inset 0 0 15px rgba(0,0,0,0.8), 0 4px 10px rgba(0,0,0,0.5);
  position: relative;
}

.tent-bg {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  /* Sombra interna para dar profundidade do telhado/tenda */
  box-shadow: inset 0 15px 15px -10px rgba(0,0,0,0.8);
}

/* O Papel de Pergaminho Pregado */
.notice-board { display: flex; align-items: center; }
.paper-note {
  background: #e2d3b3; /* Cor de papel velho/pergaminho */
  padding: 6px 10px;
  border-radius: 2px;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
  position: relative;
  transform: rotate(-3deg); /* Dá um ar despojado e realista */
  color: #3e2723;
  border: 1px solid #c7b48f;
}
/* O Prego prateado no papel */
.paper-note::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  background: #9e9e9e;
  border-radius: 50%;
  box-shadow: 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.8);
}
.note-title {
  display: block;
  font-size: 8px;
  font-weight: 900;
  text-transform: uppercase;
  border-bottom: 1px dashed #a1887f;
  margin-bottom: 4px;
  padding-top: 2px;
  text-align: center;
  letter-spacing: 0.5px;
}
.note-line {
  font-size: 9px;
  font-family: monospace;
  font-weight: bold;
  line-height: 1.3;
}
.note-line strong {
  color: #b71c1c; /* Destaque em vermelho rústico para os números */
  font-size: 11px;
}

/* O Botão no formato de Placa de Madeira */
.btn-wood-sign {
  background: #4e342e; /* Madeira base */
  border: 2px solid #212121;
  color: #bcaaa4;
  padding: 8px 16px;
  font-size: 9px;
  font-weight: 900;
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: not-allowed;
  border-radius: 4px;
  position: relative;
  box-shadow: 0 4px 6px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1);
  text-shadow: 1px 1px 1px #000;
  transition: all 0.2s;
}
/* Preguinhos nas laterais da placa */
.sign-nails {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #111;
  border-radius: 50%;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.3);
}
.sign-nails.left { left: 4px; }
.sign-nails.right { right: 4px; }

/* Botão "Pronto para Coletar" (Brilha e chama atenção) */
.btn-wood-sign.ready {
  background: linear-gradient(to bottom, #795548, #4e342e);
  color: #fff;
  border-color: #fbc02d; /* Borda dourada avisando que a carga chegou */
  cursor: pointer;
  box-shadow: 0 0 10px rgba(251, 192, 45, 0.4), inset 0 1px 1px rgba(255,255,255,0.3);
}
.btn-wood-sign.ready:active {
  transform: translateY(2px);
  box-shadow: none;
}




.earth-layer { height: 140px; display: flex; align-items: center; position: relative; }
.mine-card { width: 100%; height: 125px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; display: flex; flex-direction: column; position: relative; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
.card-header { background: #1e293b; padding: 4px 10px; border-bottom: 1px solid #334155; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; }
.lvl-tag { font-size: 9px; font-weight: 900; color: #38bdf8; }
.depth-tag { font-size: 9px; font-weight: bold; color: #64748b; font-family: monospace; }
.card-body { padding: 8px 10px; display: flex; align-items: center; justify-content: space-between; flex: 1; }
.mine-identity { display: flex; align-items: center; gap: 10px; }
.mine-icon { width: 36px; height: 36px; background: #020617; border-radius: 6px; padding: 4px; border: 1px solid #334155; }
.mine-icon img { width: 100%; height: 100%; object-fit: contain; }
.mine-details { display: flex; flex-direction: column; }
.m-name { font-size: 13px; font-weight: 900; color: #fff; text-transform: uppercase; }
.m-rate { font-size: 10px; color: #10b981; font-family: monospace; font-weight: bold; }
.mine-logistics { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.silo-display { 
  display: flex; 
  align-items: center; 
  width: 70px; /* LARGURA CRAVADA */
  margin-bottom: 4px; 
}
.silo-bar { 
  position: relative; 
  width: 100%; 
  height: 16px; 
  background: #020617; 
  border: 1px solid #334155; 
  border-radius: 4px; 
  overflow: hidden; 
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.8);
}
.silo-fill { 
  height: 100%; 
  background: linear-gradient(90deg, #d97706, #fbbf24); /* Degradê amarelo/laranja industrial */
  transition: width 0.3s ease; 
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
}
.silo-txt { 
  position: absolute; 
  top: 50%; 
  left: 50%; 
  transform: translate(-50%, -50%); 
  font-size: 8px; 
  color: #fff; 
  font-weight: 900; 
  font-family: monospace; 
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px #000, 0 0 4px #000;
  z-index: 2; 
  white-space: nowrap; 
}

/* === NOVO ESTILO DO BOTÃO DE CHAMAR === */
.btn-call { 
  width: 70px; /* LARGURA EXATAMENTE IGUAL AO SILO */
  height: 20px; /* ALTURA FIXA para não pular ao mudar de texto */
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0; /* Remove o padding que esticava o botão */
  box-sizing: border-box; /* Garante que a borda não aumente o tamanho */
  
  font-size: 8px; 
  font-weight: 900; 
  text-transform: uppercase; 
  letter-spacing: 0.5px;
  
  background: #0f172a; 
  border: 1px solid #334155; 
  color: #475569; 
  border-radius: 4px; 
  cursor: not-allowed; 
  transition: all 0.2s ease; 
}

/* Quando o botão está pronto para ser clicado (Ativo) */
.btn-call.active { 
  background: linear-gradient(to bottom, #0284c7, #0369a1); /* Azul industrial brilhante */
  color: #f0f9ff; 
  border-color: #38bdf8; 
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.btn-call.active:active {
  transform: translateY(1px); /* Efeitinho de afundar ao clicar */
  box-shadow: none;
}
.card-footer { padding: 4px 10px; background: #020617; border-top: 1px solid #334155; border-radius: 0 0 8px 8px; display: flex; gap: 6px; }
.worker-slot { width: 24px; height: 24px; }
.slot-filled { width: 100%; height: 100%; border: 1px solid #38bdf8; border-radius: 4px; overflow: hidden; cursor: pointer; }
.slot-filled img { width: 100%; height: 100%; object-fit: cover; }
.slot-add { width: 100%; height: 100%; background: #1e293b; border: 1px dashed #475569; color: #64748b; cursor: pointer; border-radius: 4px; }
.slot-lock { width: 100%; height: 100%; background: #020617; border: 1px dashed #334155; border-radius: 4px; display: flex; justify-content: center; align-items: center; font-size: 10px; opacity: 0.8; cursor: not-allowed; box-shadow: inset 0 0 5px rgba(0,0,0,0.8); }

/* TÚNEL DE CONEXÃO AGORA SEM AS BORDAS CINZAS */
.connector-tunnel { position: absolute; right: -16px; top: 50%; transform: translateY(-50%); width: 16px; height: 24px; background: transparent; z-index: 1; display: flex; align-items: center; justify-content: center; }
.tunnel-light { width: 6px; height: 6px; background: #ef4444; border-radius: 50%; box-shadow: 0 0 5px #ef4444; transition: 0.3s; }
.tunnel-light.loading-green { background: #10b981; box-shadow: 0 0 5px #10b981; }
.tunnel-light.approaching-orange { background: #f97316; box-shadow: 0 0 5px #f97316;}

/* === ESTRUTURA DO ELEVADOR === */
.elevator-structure { width: 90px; min-height: 100%; display: flex; flex-direction: column; position: relative; margin-left: -1px; z-index: 5; }
.shaft-background { position: absolute; top: 0; bottom: 0; left: 0; right: 0; display: flex; flex-direction: column; z-index: 0; }

/* TOPO DO ELEVADOR (Sincronizado sem o vão) */
.shaft-header-bg { height: 90px; background: #0f172a; border: 2px solid #334155; border-bottom: none; border-radius: 8px 8px 0 0; display: flex; flex-direction: column; box-shadow: 0 -4px 10px rgba(0,0,0,0.5); position: relative; z-index: 1; flex-shrink: 0; overflow: hidden; }

.crane-beam { height: 45px; background: #1e293b; border-bottom: 3px solid #020617; display: flex; justify-content: space-around; align-items: center; padding: 0 5px; }
.gear-wrapper { display: flex; align-items: center; justify-content: center; }
.winch-gear { font-size: 24px; line-height: 1; color: #94a3b8; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8)); }
/* A mágica do giro ativada pela classe "is-spinning" */
.winch-gear.is-spinning { animation: spin-gear 4s linear infinite; }
.winch-gear.reverse.is-spinning { animation: spin-gear-reverse 4s linear infinite; }
@keyframes spin-gear { 100% { transform: rotate(360deg); } }
@keyframes spin-gear-reverse { 100% { transform: rotate(-360deg); } }

.parking-station { flex: 1; position: relative; display: flex; flex-direction: column; justify-content: flex-end; }
.cable-line { position: absolute; top: 0; bottom: 0; width: 2px; background: #475569; z-index: 1; transform: translateX(-50%); }
.cable-line.left-cable { left: 30%; }
.cable-line.right-cable { left: 70%; }
.bumper-pad { position: absolute; bottom: 8px; width: 14px; height: 6px; background: #475569; border: 1px solid #000; border-radius: 2px 2px 0 0; transform: translateX(-50%); z-index: 4; }
.bumper-pad.left-pad { left: 30%; }
.bumper-pad.right-pad { left: 70%; }
.platform-base.warning-stripes { height: 8px; width: 100%; background: repeating-linear-gradient(45deg, #facc15, #facc15 8px, #1e293b 8px, #1e293b 16px); border-top: 1px solid #fff; position: relative; z-index: 5; }

/* CORPO DO POÇO (Sincronizado com o topo sem borda extra em cima) */
.shaft-body-bg { 
  flex: 1; 
  background-color: #0f172a; 
  border-left: 2px solid #334155; 
  border-right: 2px solid #334155; 
  border-top: none; 
  position: relative; 
  overflow: hidden; 
  /* Mistura a textura listrada com um degradê que escurece até ficar preto no fundo */
  background-image: 
    linear-gradient(to bottom, transparent 0%, rgba(2, 6, 23, 1) 100%),
    repeating-linear-gradient(to bottom, #0f172a, #0f172a 20px, #0b1121 20px, #0b1121 40px); 
}
.main-cable { position: absolute; top: 0; bottom: 0; width: 2px; background: rgba(255,255,255,0.1); border-left: 1px solid rgba(0,0,0,0.5); box-shadow: 0 0 2px #000; z-index: 2; transform: translateX(-50%); }
.main-cable.left-cable { left: 30%; }
.main-cable.right-cable { left: 70%; }

.shaft-footer-bg { height: 40px; background: #1e293b; border: 2px solid #334155; border-top: none; border-radius: 0 0 8px 8px; display: flex; justify-content: center; align-items: center; flex-shrink: 0; z-index: 1; }

/* OS CARRINHOS */
.elevator-cab { position: absolute; width: 30px; height: 30px; z-index: 10; transition: top var(--duration, 1s) linear; will-change: top; transform: translateX(-50%); margin-top: -15px; }
.elevator-cab.state-loading { transition: top 0s linear !important; }
.elevator-cab.cart-1 { left: 30%; } 
.elevator-cab.cart-2 { left: 70%; }

.cab-clean { width: 100%; height: 100%; position: relative; display: flex; justify-content: center; align-items: center; }
.cab-img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 4px 5px rgba(0,0,0,0.8)); position: relative; z-index: 2; }
.cab-cargo { position: absolute; top: -6px; left: 50%; transform: translateX(-50%); width: 18px; height: 18px; object-fit: contain; z-index: 3; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5)); }
.cab-badge { position: absolute; bottom: -6px; right: -6px; background: #ef4444; color: white; font-size: 8px; font-weight: 900; padding: 2px 4px; border-radius: 4px; z-index: 4; border: 1px solid #000; }

@media (max-width: 500px) {  
  .mines-column { padding-right: 8px; }
  .elevator-structure { width: 65px; } 
  .surface-body { flex-direction: row; padding: 0 8px; justify-content: space-between; }
  .surface-stats-panel { padding: 4px 8px; gap: 10px; }
  .stat-val { font-size: 12px; }
  .btn-main-action { padding: 6px 8px; font-size: 7px; }
  .mine-identity { gap: 6px; }
  .mine-icon { width: 28px; height: 28px; padding: 2px; }
  .m-name { font-size: 9px; }
  .m-rate { font-size: 8px; }
  .silo-display, .btn-call { width: 55px; } /* Ambos encolhem para 55px juntos */
  .silo-bar { height: 14px; }
  .btn-call { height: 18px; font-size: 7px; }
  .silo-txt { font-size: 7px; }
  .worker-slot { width: 20px; height: 20px; }
  .connector-tunnel { width: 10px; right: -10px; }
  .winch-gear { font-size: 18px; }
  .elevator-cab { width: 22px; height: 22px; margin-top: -11px; }
  .cab-cargo { width: 14px; height: 14px; top: -4px; }
  .cab-badge { font-size: 7px; padding: 1px 3px; bottom: -4px; right: -4px; }
  .fs-grid { gap: 28px 8px; padding: 15px 10px; }
  .fs-icon { width: 45%; height: 45%;}
}
@media (max-width: 400px) {
  .surface-stats-panel { padding: 2px 4px; gap: 6px; }
  .stat-lbl { font-size: 7px; }
  .stat-val { font-size: 11px; }
  .btn-main-action { padding: 6px 6px; font-size: 7px; }

}
</style>