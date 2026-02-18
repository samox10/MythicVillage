<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore' // Conexão com o cérebro

const store = useGameStore()

// Dados Estáticos dos Prédios
const buildingDefinitions = [
  { id: 1, key: 'castelo', name: 'Castelo', type: 'COMANDO', desc: 'Gera Ouro Passivo', img: '🏰', baseCost: 500, baseTime: 5, effectDesc: (lvl) => `+${lvl * 10 + 100} Ouro/s` },
  { id: 2, key: 'armazem', name: 'Armazém', type: 'ESTOQUE', desc: 'Armazena Materiais', img: '📦', baseCost: 800, baseTime: 10, effectDesc: (lvl) => `Cap: ${1000 + (lvl * 500)}` },
  { id: 3, key: 'hospedagem', name: 'Estalagem', type: 'HABITAÇÃO', desc: 'Limite de População', img: '🛏️', baseCost: 300, baseTime: 8, effectDesc: (lvl) => `Pop: ${10 + (lvl * 2)}` },
  { id: 4, key: 'centrorecrutamento', name: 'Centro de Recrutamento', type: 'RECURSO', desc: 'Recrutar novos funcionários', img: '🔮', baseCost: 5000, baseTime: 30, reqId: 1, reqLvl: 1, effectDesc: (lvl) => `Nível ${lvl}` },
  { id: 5, key: 'mina', name: 'Minas Profundas', type: 'PRODUÇÃO', desc: 'Desbloqueia novos veios de minério', img: '⛏️', baseCost: 1500, baseTime: 1, reqId: 4, reqLvl: 1, effectDesc: (lvl) => lvl >= 20 ? 'Profundidade Máxima' : `Profundidade ${lvl}` },
]

// Merge dos dados com o Store (Cérebro)
const displayBuildings = computed(() => {
  return buildingDefinitions.map(def => {
    // Pega o nível real da store
    const state = store.buildings.find(b => b.key === def.key) || { level: 0 }
    const currentCost = Math.floor(def.baseCost * Math.pow(1.5, state.level))
    let status = 'idle'
    
    // Verifica requisitos
    if (def.reqId) {
      const req = store.buildings.find(b => b.id === def.reqId)
      if (!req || req.level < def.reqLvl) status = 'locked'
    }

    return { 
      ...def, 
      level: state.level, 
      status, 
      cost: { gold: currentCost, mythic: 0 }, 
      upgradeTime: def.baseTime, 
      currentEffect: def.effectDesc(state.level),
      nextEffect: def.effectDesc(state.level + 1)
    }
  })
})

// Controle de Fila (Visual)
const buildingQueue = ref({}) 
const activeBuilders = computed(() => Object.keys(buildingQueue.value).length)
const maxBuilders = 2
const formatNum = (n) => new Intl.NumberFormat('pt-BR').format(n)

// === LÓGICA DO UPGRADE (Integrada com Store) ===
const startUpgrade = (b) => {
  if (activeBuilders.value >= maxBuilders) return
  
  // 1. Tenta Gastar o dinheiro no Store
  const success = store.spendResources({ gold: b.cost.gold, mythic: b.cost.mythic })
  if (!success) {
    alert("Recursos insuficientes!")
    return
  }

  // 2. Inicia Timer Visual
  buildingQueue.value[b.id] = { progress: 0 }
  const tickRate = 100
  const totalTicks = (b.upgradeTime * 1000) / tickRate
  const increment = 100 / totalTicks

  const interval = setInterval(() => {
    if (buildingQueue.value[b.id]) {
      buildingQueue.value[b.id].progress += increment
      
      // 3. Terminou? Chama o Store para Upar
      if (buildingQueue.value[b.id].progress >= 100) {
        clearInterval(interval)
        delete buildingQueue.value[b.id]
        store.upgradeBuilding(b.id) // <--- AQUI SOBE O NÍVEL DE VERDADE
      }
    } else {
      clearInterval(interval)
    }
  }, tickRate)
}
</script>

<template>
  <div class="vila-container">
    <div class="builders-hud">
      <div class="b-status">
        <span class="lbl">CONSTRUÇÕES EM ANDAMENTO:</span>
        <div class="b-dots">
          <span v-for="n in maxBuilders" :key="n" class="dot" :class="{ 'busy': n <= activeBuilders }"></span>
        </div>
      </div>
      <div class="b-count">{{ activeBuilders }} / {{ maxBuilders }}</div>
    </div>

    <div class="rpg-grid">
      <div v-for="b in displayBuildings" :key="b.id" class="rpg-card" :class="{ 'is-locked': b.status === 'locked' }">
        
        <div class="card-visual">
          <div class="lvl-badge">LVL {{ b.level }}</div>
          <div class="visual-icon">{{ b.img }}</div>
          <div v-if="buildingQueue[b.id]" class="building-overlay">
            <div class="spinner"></div><span class="prog-txt">{{ Math.floor(buildingQueue[b.id].progress) }}%</span>
          </div>
        </div>

        <div class="card-info">
          <div class="info-head"><h3>{{ b.name }}</h3><span class="type-pill">{{ b.type }}</span></div>
          <div class="stats-area">
            <div class="stat-line current"><span>Atual:</span> <strong>{{ b.currentEffect }}</strong></div>
            <div class="stat-line next" v-if="b.status !== 'locked'"><span>Próx:</span> <strong>{{ b.nextEffect }}</strong></div>
          </div>

          <button class="action-btn" @click="startUpgrade(b)" 
            :disabled="b.status === 'locked' || store.resources.goldCoin < b.cost.gold || buildingQueue[b.id] || activeBuilders >= maxBuilders">
            
            <div v-if="b.status === 'locked'" class="btn-content locked">🔒 REQ: NÍVEL {{ b.reqLvl }}</div>
            <div v-else-if="buildingQueue[b.id]" class="btn-content construction">EM ANDAMENTO...</div>
            <div v-else class="btn-content available">
              <span class="btn-lbl">EVOLUIR</span>
              <div class="cost-pill"><span class="gold-icon">G</span> {{ formatNum(b.cost.gold) }}</div>
            </div>
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Copie o CSS do seu VilaView.vue antigo (está perfeito, não precisa mudar) */
.vila-container { width: 100%; display: flex; flex-direction: column; gap: 20px; font-family: 'Chakra Petch', sans-serif; }
.builders-hud { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; }
.b-status { display: flex; align-items: center; gap: 10px; }
.lbl { font-size: 11px; font-weight: 700; color: #94a3b8; }
.b-dots { display: flex; gap: 4px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: #334155; border: 1px solid #475569; }
.dot.busy { background: #facc15; box-shadow: 0 0 5px #facc15; border-color: #facc15; }
.b-count { font-weight: 800; color: #fff; }
.rpg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
.rpg-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; position: relative; transition: 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
.rpg-card:hover { transform: translateY(-5px); border-color: #38bdf8; box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
.rpg-card.is-locked { opacity: 0.7; filter: grayscale(1); }
.card-visual { height: 110px; background: #0f172a; display: flex; align-items: center; justify-content: center; position: relative; border-bottom: 4px solid #334155; }
.visual-icon { font-size: 40px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.1)); }
.lvl-badge { position: absolute; top: 8px; left: 8px; background: #38bdf8; color: #000; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px; }
.building-overlay { position: absolute; inset: 0; background: rgba(15,23,42,0.9); z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; }
.prog-txt { color: #facc15; font-weight: 800; font-size: 16px; }
.spinner { width: 20px; height: 20px; border: 3px solid #334155; border-top: 3px solid #facc15; border-radius: 50%; animation: spin 1s linear infinite; }
.card-info { padding: 15px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
.info-head { display: flex; justify-content: space-between; align-items: flex-start; }
.info-head h3 { font-size: 14px; color: #fff; margin: 0; font-weight: 700; text-transform: uppercase; }
.type-pill { font-size: 9px; background: #334155; padding: 2px 5px; border-radius: 4px; color: #94a3b8; font-weight: 700; }
.stats-area { background: #0f172a; padding: 8px; border-radius: 6px; font-size: 11px; }
.stat-line { display: flex; justify-content: space-between; margin-bottom: 2px; color: #94a3b8; }
.stat-line strong { color: #e2e8f0; }
.stat-line.next strong { color: #10b981; }
.action-btn { margin-top: auto; border: none; border-radius: 6px; padding: 0; background: #38bdf8; color: #000; cursor: pointer; transition: 0.2s; font-family: 'Chakra Petch', sans-serif; overflow: hidden; }
.action-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
.action-btn:disabled { background: #334155; cursor: not-allowed; opacity: 0.8; }
.btn-content { padding: 10px; font-weight: 700; font-size: 12px; display: flex; justify-content: space-between; align-items: center; }
.btn-content.available { background: linear-gradient(to bottom, #38bdf8, #0ea5e9); color: #fff; }
.btn-content.locked { background: #1e293b; color: #ef4444; justify-content: center; }
.btn-content.construction { background: #1e293b; color: #facc15; justify-content: center; }
.cost-pill { background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 12px; display: flex; align-items: center; gap: 4px; }
.gold-icon { color: #facc15; font-weight: 900; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>