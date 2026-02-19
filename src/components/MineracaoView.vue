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
  const SURFACE_CENTER = 45; // Onde o carrinho para na superfície (centro do header)

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
        
        <div class="surface-level surface-module">
          <div class="surface-header">
            <h3>CENTRAL DE COMANDO</h3>
            <div class="magic-indicator"></div>
          </div>
          <div class="surface-body">
            <span class="stat-label">FROTA: <span class="stat-val">{{ miningStore.elevators.length }}</span></span>
            <button class="btn-main-action" :class="{'ready': isAnyReady}" @click="miningStore.collectElevators()" :disabled="!isAnyReady">
              {{ isAnyReady ? 'RECEBER CARGA' : 'AGUARDANDO...' }}
            </button>
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
                  <div class="silo-bar"><div class="silo-fill" :style="{ width: (mine.reservoirLoad / mine.reservoirMax * 100) + '%' }"></div></div>
                  <span class="silo-txt">{{ Math.floor(mine.reservoirLoad) }}/{{ mine.reservoirMax }}</span>
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
                  <div v-if="isSlotLocked(mine.id, idx)" class="slot-lock"></div>
                  <div v-else-if="slot" class="slot-filled" @click="removeMiner(mine.id, idx)"><img :src="getWorkerAvatar(slot)"></div>
                  <button v-else class="slot-add" @click="openSlot(mine.id, idx)">+</button>
               </div>
            </div>

            <div class="connector-tunnel">
              <div class="tunnel-light" :class="{'loading-green': isMineLoading(mine.id)}"></div>
            </div>

          </div>
        </div>
      </div>

      <div class="elevator-structure">
        
        <div class="shaft-background">
          <div class="shaft-header-bg">
            <div class="winch-crystal"></div>
          </div>
          <div class="shaft-body-bg">
            <div class="main-cable"></div>
          </div>
          <div class="shaft-footer-bg">
            <div class="bedrock-text">/// FUNDO ///</div>
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
/* === PAINEL DE ESTOQUE GLOBAL (HUD MINIMALISTA) === */
/* === PAINEL DE ESTOQUE GLOBAL (FLUTUANTE COM DEGRADÊ) === */
.floating-stock-panel {
  display: flex;
  justify-content: center;
  margin-bottom: 35px; /* Espaço generoso para os flutuantes não encostarem em nada */
}

.fs-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px; /* Aumentei o espaço para acomodar as novas badges flutuantes */
  justify-content: center;
  background: #0f172a; /* Fundo do painel que guarda os minérios */
  padding: 20px 25px; /* Espaço interno maior */
  border-radius: 12px;
  border: 1px solid #334155;
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
}

/* O "Soquete" (quadradinho base) COM DEGRADÊ */
.fs-item {
  position: relative;
  width: 48px;
  height: 48px;
  /* O DEGRADÊ: Começa num tom Slate mais claro e escurece na ponta */
  background: linear-gradient(135deg, #253147 0%, #0f172a 100%);
  border: 1px solid #475569;
  border-top: 1px solid #64748b; /* Brilho sutil na borda superior para dar profundidade */
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  cursor: default;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.5); /* Sombra interna para parecer um encaixe */
}

.fs-item:hover {
  border-color: #38bdf8;
  transform: translateY(-3px);
  /* Brilho neon ao passar o mouse */
  box-shadow: 0 6px 12px rgba(56, 189, 248, 0.2), inset 0 0 10px rgba(56, 189, 248, 0.1);
}

.fs-icon {
  width: 65%;
  height: 65%;
  object-fit: contain;
  filter: drop-shadow(0 3px 3px rgba(0,0,0,0.6));
}

/* Flutuante Superior (Nome Abreviado) */
.fs-abbr {
  position: absolute;
  top: -12px; /* Flutua pra cima */
  left: 50%;
  transform: translateX(-50%);
  
  /* Degradê escuro no nome para destacar */
  background: linear-gradient(to bottom, #334155, #1e293b);
  border: 1px solid #475569;
  color: #cbd5e1;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 1px;
  padding: 3px 8px;
  border-radius: 4px;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

/* Flutuante Inferior (MUDANÇA DE ESTILO NO VALOR) */
/* OPÇÃO 3: MICRO TAG NEUTRA */
.fs-amount {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  
  background: #0f172a; /* Cor base mais escura do seu tema */
  border: 1px solid #334155; /* Borda bem sutil */
  border-radius: 12px; /* Deixa redondinho igual uma pílula */
  
  color: #94a3b8; /* Cor de texto neutra (slate) */
  font-size: 10px;
  font-weight: 800;
  font-family: monospace;
  padding: 2px 8px;
  z-index: 2;
  white-space: nowrap;
  
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}






/* === LAYOUT GERAL === */
.mining-complex.fixed-layout {
  display: flex;
  align-items: flex-start; /* Alinha tudo ao topo */
  background: transparent;
  gap: 0;
  width: 100%;
  position: relative;
}

.mines-column {
  flex: 1; /* Ocupa todo o espaço restante */
  display: flex; flex-direction: column;
  padding-right: 15px;
  min-width: 0; /* Previne estouro */
}

/* === SUPERFÍCIE (MÓDULO) === */
.surface-level.surface-module {
  height: 90px; /* Altura fixa importante */
  margin-bottom: 10px; /* Margem de 10px -> Total 100px */
  background: #1e293b; border: 2px solid #334155; border-radius: 8px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
}
.surface-header { background: #0f172a; padding: 5px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
.surface-header h3 { margin: 0; color: #38bdf8; font-size: 11px; font-weight: 900; letter-spacing: 1px; }
.magic-indicator { width: 8px; height: 8px; background: #38bdf8; border-radius: 50%; box-shadow: 0 0 8px #38bdf8; animation: pulse 2s infinite; }
@keyframes pulse { 0% { opacity: 0.5; } 100% { opacity: 1; box-shadow: 0 0 15px #38bdf8; } }

.surface-body { flex: 1; padding: 0 15px; display: flex; align-items: center; justify-content: space-between; }
.stat-label { font-size: 10px; color: #64748b; font-weight: bold; }
.stat-val { color: #38bdf8; font-size: 14px; font-family: monospace; }
.btn-main-action { padding: 8px 16px; background: #334155; color: #cbd5e1; border: none; border-radius: 4px; font-weight: 900; font-size: 10px; cursor: pointer; transition: 0.2s; }
.btn-main-action.ready { background: #38bdf8; color: #020617; box-shadow: 0 0 10px rgba(56,189,248,0.4); }

/* === MINAS (CARDS) === */
.earth-layer {
  height: 140px; /* ALTURA FIXA VITAL */
  display: flex; align-items: center; position: relative;
}
.mine-card {
  width: 100%; height: 125px; /* Um pouco menor que o layer para dar respiro */
  background: #0f172a; border: 1px solid #334155; border-radius: 8px;
  display: flex; flex-direction: column; position: relative;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
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
.silo-display { display: flex; align-items: center; gap: 8px; }
.silo-bar { width: 40px; height: 5px; background: #020617; border-radius: 3px; overflow: hidden; border: 1px solid #334155; }
.silo-fill { height: 100%; background: #facc15; transition: width 0.3s; }
.silo-txt { font-size: 9px; color: #94a3b8; font-family: monospace; }
.btn-call { padding: 4px 8px; font-size: 9px; font-weight: 900; text-transform: uppercase; background: transparent; border: 1px solid #475569; color: #64748b; border-radius: 4px; cursor: pointer; transition: 0.2s; min-width: 60px; }
.btn-call.active { background: #38bdf8; color: #020617; border-color: #38bdf8; }
.card-footer { padding: 4px 10px; background: #020617; border-top: 1px solid #334155; border-radius: 0 0 8px 8px; display: flex; gap: 6px; }
.worker-slot { width: 24px; height: 24px; }
.slot-filled { width: 100%; height: 100%; border: 1px solid #38bdf8; border-radius: 4px; overflow: hidden; cursor: pointer; }
.slot-filled img { width: 100%; height: 100%; object-fit: cover; }
.slot-add { width: 100%; height: 100%; background: #1e293b; border: 1px dashed #475569; color: #64748b; cursor: pointer; border-radius: 4px; }
.slot-lock { width: 100%; height: 100%; background: #0f172a; opacity: 0.3; border-radius: 4px; }

/* TÚNEL DE CONEXÃO */
.connector-tunnel { position: absolute; right: -16px; top: 50%; transform: translateY(-50%); width: 16px; height: 24px; background: #0f172a; border-top: 2px solid #334155; border-bottom: 2px solid #334155; z-index: 1; display: flex; align-items: center; justify-content: center; }
.tunnel-light { width: 6px; height: 6px; background: #ef4444; border-radius: 50%; box-shadow: 0 0 5px #ef4444; transition: 0.3s; }
.tunnel-light.loading-green { background: #10b981; box-shadow: 0 0 10px #10b981; transform: scale(1.3); }

/* === COLUNA DIREITA: ESTRUTURA DO ELEVADOR === */
.elevator-structure {
  width: 90px;
  /* CORREÇÃO 1: min-height auto garante que ele acompanhe o pai */
  min-height: 100%; 
  display: flex;
  flex-direction: column;
  position: relative; /* Pai relativo para os carrinhos */
  margin-left: -1px;
}

/* O Background agora é absoluto para garantir que ocupe 100% da altura da coluna */
.shaft-background {
  position: absolute;
  top: 0; bottom: 0; left: 0; right: 0;
  display: flex;
  flex-direction: column;
  z-index: 0; /* Fica atrás dos carrinhos */
}

/* 1. TOPO MÁGICO (Altura Fixa) */
.shaft-header-bg {
  height: 90px; /* Mesmo tamanho da superfície */
  margin-bottom: 10px; /* Mesma margem */
  background: #1e293b; 
  border: 2px solid #334155; 
  border-radius: 8px;
  display: flex; justify-content: center; align-items: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  position: relative;
  z-index: 1; /* Garante que fique sobre o cabo */
  flex-shrink: 0; /* Impede que seja esmagado */
}
.winch-crystal { 
  width: 24px; height: 40px; background: #38bdf8; 
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  box-shadow: 0 0 20px #38bdf8, inset 0 0 10px rgba(255,255,255,0.8); 
  animation: crystal-hover 3s infinite ease-in-out;
}
@keyframes crystal-hover { 0%, 100% { transform: translateY(0); opacity: 0.9; } 50% { transform: translateY(-4px); opacity: 1; } }

/* 2. CORPO DO POÇO (CORREÇÃO: Ocupa todo o espaço restante) */
.shaft-body-bg {
  flex: 1; /* AQUI ESTÁ A MÁGICA: Ocupa todo o espaço entre o topo e o fundo */
  background: #0f172a; 
  border-left: 2px solid #334155; 
  border-right: 2px solid #334155;
  position: relative;
  /* Textura de fundo para você VER o caminho */
  background-image: repeating-linear-gradient(to bottom, #0f172a, #0f172a 20px, #0b1121 20px, #0b1121 40px);
}
.main-cable { 
  position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%); width: 4px; 
  background: rgba(255,255,255,0.1); 
  border-left: 1px solid rgba(0,0,0,0.5); 
  border-right: 1px solid rgba(0,0,0,0.5); 
}

/* 3. FUNDO (Altura Fixa) */
.shaft-footer-bg {
  height: 40px; 
  background: #1e293b; 
  border: 2px solid #334155; 
  border-top: none; 
  border-radius: 0 0 8px 8px;
  display: flex; justify-content: center; align-items: center;
  flex-shrink: 0; /* Impede que seja esmagado */
  z-index: 1;
}
.bedrock-text { font-size: 8px; color: #475569; font-weight: 900; background: #020617; padding: 2px 6px; border-radius: 4px; letter-spacing: 1px; }


/* === OS CARRINHOS (LIVRES NA COLUNA) === */
.elevator-cab {
  position: absolute; 
  width: 44px; height: 44px;
  z-index: 10;
  transition: top var(--duration, 1s) linear; will-change: top;
  left: 50%; transform: translateX(-50%);
}
.elevator-cab.state-loading { transition: top 0s linear !important; }

/* Ajuste lateral para os carrinhos não baterem */
.elevator-cab.cart-1 { margin-left: -8px; }
.elevator-cab.cart-2 { margin-left: 8px; }

.cab-clean { width: 100%; height: 100%; position: relative; display: flex; justify-content: center; align-items: center; }
.cab-img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.8)); position: relative; z-index: 2; }
/* Animação suave de flutuação no minério carregado */
.cab-cargo { position: absolute; top: 0px; width: 22px; height: 22px; object-fit: contain; z-index: 3; animation: float-c 2s infinite ease-in-out; filter: drop-shadow(0 0 5px rgba(255,255,255,0.2)); }
@keyframes float-c { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

.cab-badge { position: absolute; bottom: -4px; right: -4px; background: #ef4444; color: white; font-size: 9px; font-weight: 900; padding: 1px 4px; border-radius: 4px; z-index: 4; box-shadow: 0 2px 2px rgba(0,0,0,0.5); border: 1px solid #000; }
</style>