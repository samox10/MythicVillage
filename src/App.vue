<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import HeaderHUD from './components/HeaderHUD.vue'
import VilaView from './components/VilaView.vue'
import RecrutamentoView from './components/RecrutamentoView.vue' 

// === 1. ESTADO (PERSISTENTE) ===
const player = ref({
  name: 'SamOx',
  race: 'Automato', 
  avatar: '/assets/faces/automato/lorde_m.png', 
})

const buildingsState = ref([
  { id: 1, key: 'nexus', level: 1 },
  { id: 2, key: 'armazem', level: 1 },
  { id: 3, key: 'hospedagem', level: 1 },
  { id: 4, key: 'sifao', level: 0 }
])

const resources = ref({ mythicCoin: 10, goldCoin: 10000 })
const villageStats = ref({ populacao: 5 })

// === 2. FÓRMULAS ===
const calculatedVillage = computed(() => {
  const lvlHospedagem = buildingsState.value.find(b => b.key === 'hospedagem')?.level || 1
  const lvlArmazem = buildingsState.value.find(b => b.key === 'armazem')?.level || 1
  return {
    populacao: villageStats.value.populacao,
    maxPopulacao: 10 + (lvlHospedagem * 2),
    maxArmazem: 1000 + (lvlArmazem * 500)
  }
})

// === 3. SAVE SYSTEM ===
const loadGame = () => {
  const savedRes = localStorage.getItem('mythic_resources')
  const savedBuilds = localStorage.getItem('mythic_buildings')
  if (savedRes) resources.value = JSON.parse(savedRes)
  if (savedBuilds) {
    const loaded = JSON.parse(savedBuilds)
    buildingsState.value = buildingsState.value.map(b => {
      const found = loaded.find(lb => lb.key === b.key)
      return found ? { ...b, level: found.level } : b
    })
  }
}
const saveGame = () => {
  localStorage.setItem('mythic_resources', JSON.stringify(resources.value))
  localStorage.setItem('mythic_buildings', JSON.stringify(buildingsState.value))
}
watch([resources, buildingsState], () => saveGame(), { deep: true })

// === 4. GAME LOOP ===
onMounted(() => {
  loadGame()
  setInterval(() => { resources.value.goldCoin += 1 }, 1000)
})

// === 5. AÇÕES DE UPGRADE (CORRIGIDO) ===

// ETAPA A: Pagar (Imediato)
const handleSpend = (cost) => {
  if (resources.value.goldCoin >= cost.gold && resources.value.mythicCoin >= cost.mythic) {
    resources.value.goldCoin -= cost.gold
    resources.value.mythicCoin -= cost.mythic
  }
}

// ETAPA B: Upar (Só depois do tempo)
const handleLevelUp = (buildingId) => {
  const target = buildingsState.value.find(b => b.id === buildingId)
  if (target) {
    target.level++
    // Feedback visual ou sonoro poderia entrar aqui
    console.log(`Prédio ${buildingId} evoluiu para o nível ${target.level}`)
  }
}

const currentScreen = ref('vila')
const menuItems = [
  { id: 'vila', label: 'BASE', icon: '🏰' },
  { id: 'recrutamento', label: 'RECRUTAR', icon: '🤝' },
  { id: 'lab', label: 'LAB', icon: '⚗️' },
  { id: 'guilda', label: 'CLÃ', icon: '⚔️' },
  { id: 'arena', label: 'PVP', icon: '🏆' }
]
</script>

<template>
  <div class="layout-tactical-bg">
    <main class="tactical-frame">
      <HeaderHUD :player="player" :resources="resources" :village="calculatedVillage" />
      
      <nav class="skew-nav">
        <button v-for="item in menuItems" :key="item.id" @click="currentScreen = item.id" class="skew-btn" :class="{ active: currentScreen === item.id }">
          <div class="skew-content"><span class="sk-icon">{{ item.icon }}</span><span class="sk-lbl">{{ item.label }}</span></div>
        </button>
      </nav>

      <section class="tactical-viewport">
        <div class="slate-panel">
          <div class="panel-header-deco"><div class="deco-line"></div><div class="sys-txt">SYSTEM: ONLINE</div><div class="deco-line"></div></div>

          <VilaView 
            v-if="currentScreen === 'vila'" 
            :resources="resources"
            :buildings-state="buildingsState"
            @spend-resources="handleSpend"
            @finish-upgrade="handleLevelUp"
          />
          
          <RecrutamentoView v-if="currentScreen === 'recrutamento'" />
          
          <div v-if="!['vila', 'recrutamento'].includes(currentScreen)" class="locked-sector">
            <h2>{{ currentScreen }}</h2><p>SECTOR LOCKED</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
/* Reset */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Chakra Petch', sans-serif;
  color: #e2e8f0;
  min-height: 100vh;

  /* Fundo com imagem fixa */
  background-image: 
  linear-gradient(to bottom, rgba(15,23,42,0.5), rgba(30,41,59,0.6)),
  url('/assets/ui/fundo-mapa.png');
  background-size: cover;        /* ocupa 100% da tela */
  background-position: center;   /* centraliza */
  background-repeat: no-repeat;  
  background-attachment: fixed;  /* <- deixa fixo ao rolar */
  
  /* opcional: cor base caso a imagem demore a carregar */
  background-color: #0f172a;
}

.layout-tactical-bg { display: flex; justify-content: center; min-height: 100vh; }

.tactical-frame {
  width: 100%;
  max-width: 1000px;
  background: #1e293b;
  display: flex; flex-direction: column;
  box-shadow: 0 0 50px rgba(0,0,0,0.5);
  border-left: 1px solid #334155;
  border-right: 1px solid #334155;
}

/* NAVEGAÇÃO */
.skew-nav {
  display: flex;
  background: #0f172a;
  padding: 10px 20px 0 20px;
  gap: 5px;
  border-bottom: 1px solid #334155;
  overflow-x: auto; /* Garante scroll no mobile se tiver muitos itens */
}

.skew-btn {
  flex: 1;
  min-width: 70px; /* Garante tamanho mínimo */
  background: #334155;
  border: none;
  height: 45px;
  transform: skewX(-20deg); /* Botão inclinado */
  cursor: pointer;
  margin: 0 5px;
  transition: 0.2s;
  position: relative;
  border-top: 2px solid #475569;
}

.skew-btn:hover { background: #475569; }

.skew-content {
  transform: skewX(20deg); /* Des-inclina texto */
  display: flex; align-items: center; justify-content: center; gap: 8px;
  height: 100%;
  color: #94a3b8;
}

.sk-icon { font-size: 16px; }
.sk-lbl { font-weight: 700; font-size: 12px; letter-spacing: 1px; }

/* Botão Ativo */
.skew-btn.active {
  background: #38bdf8; /* Azul Neon */
  border-top-color: #e0f2fe;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);
  z-index: 2;
}
.skew-btn.active .skew-content { color: #0f172a; font-weight: 900; }

/* VIEWPORT */
.tactical-viewport {
  flex: 1; padding: 20px;
  background: #1e293b;
  background-image: radial-gradient(#334155 1px, transparent 1px);
  background-size: 20px 20px;
}

.slate-panel {
  background: #252f42;
  border: 1px solid #334155;
  border-top: 3px solid #38bdf8;
  min-height: 500px; padding: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.panel-header-deco {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; border-bottom: 1px solid #334155; padding-bottom: 5px;
}
.sys-txt { font-size: 10px; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase; }
.deco-line { width: 50px; height: 4px; background: repeating-linear-gradient(45deg, #38bdf8, #38bdf8 2px, transparent 2px, transparent 4px); }

.locked-sector { text-align: center; color: #64748b; margin-top: 50px; border: 1px dashed #334155; padding: 40px; }
.locked-sector h2 { color: #f43f5e; letter-spacing: 2px; text-transform: uppercase; }

/* === MOBILE MODE (APENAS ÍCONES) === */
@media (max-width: 600px) {
  .skew-nav { padding: 10px 5px 0 5px; gap: 2px; }
  .skew-btn { margin: 0 2px; }
  .sk-lbl { display: none; }
  .sk-icon { font-size: 20px; }
}
</style>