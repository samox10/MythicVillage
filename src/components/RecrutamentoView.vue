<script setup>
import { ref, onMounted, computed } from 'vue'

// === CONFIGURAÇÕES ===
const racas = ['automato', 'corvido', 'draconiano', 'elfo', 'espectral', 'humano', 'lobisomem', 'serpentideo', 'sombrineo', 'tiefling']

const profissoes = {
  minerador: { m: 'Minerador', f: 'Mineradora' },
  lenhador: { m: 'Lenhador', f: 'Lenhadora' },
  batedor: { m: 'Batedor', f: 'Batedora' },
  medico: { m: 'Médico', f: 'Médica' },
  ferreiro: { m: 'Ferreiro', f: 'Ferreira' },
  dissecador: { m: 'Dissecador', f: 'Dissecadora' },
  tesoureiro: { m: 'Tesoureiro', f: 'Tesoureira' },
  transportador: { m: 'Transportador', f: 'Transportadora' },
  pesquisador: { m: 'Pesquisador', f: 'Pesquisadora' },
  administrador: { m: 'Administrador', f: 'Administradora' },
  alquimista: { m: 'Alquimista', f: 'Alquimista' },
  mestreguilda: { m: 'Mestre da Guilda', f: 'Mestre da Guilda'}
}

const tierConfig = {
  'F': { minEff: 2, maxEff: 8, salary: 50, color: 'gray' },
  'E': { minEff: 6, maxEff: 14, salary: 80, color: 'gray' },
  'D': { minEff: 12, maxEff: 20, salary: 120, color: 'green' },
  'C': { minEff: 18, maxEff: 28, salary: 180, color: 'blue' },
  'B': { minEff: 25, maxEff: 38, salary: 250, color: 'blue' },
  'A': { minEff: 35, maxEff: 50, salary: 400, color: 'purple' },
  'S': { minEff: 48, maxEff: 70, salary: 700, color: 'gold' },
  'SS': { minEff: 68, maxEff: 100, salary: 1200, color: 'red' }
}
const baseDropRates = {
  'SS': 0.1,
  'S':  0.5,
  'A':  2.0,
  'B':  8.0,
  'C':  18.0,
  'D':  25.0,
  'E':  25.0,
  'F':  21.4
}
const getTierColor = (tier) => {
  const map = {
    'SS': '#ff003c', // Red
    'S':  '#ffd700', // Gold
    'A':  '#a855f7', // Purple
    'B':  '#38bdf8', // Blue
    'C':  '#2dd4bf', // Teal
    'D':  '#10b981', // Green
    'E':  '#94a3b8', // Gray
    'F':  '#64748b'  // Slate
  }
  return map[tier] || '#fff'
}
// === CÁLCULO DAS PROBABILIDADES REAIS ===
const dropRateTable = computed(() => {
  const efficiency = currentAdmin.value ? currentAdmin.value.efficiency : 0
  
  // 1. Quanto de % vamos mover do fundo para o topo?
  // Ex: Se eficiencia for 100%, movemos 15 pontos percentuais totais da tabela.
  // Isso é MUITO impacto. (Ex: F cai de 21% para 11%).
  const maxShiftAmount = 15 
  const shiftAmount = maxShiftAmount * (efficiency / 100)

  // 2. Pesos de Distribuição (Quem ganha mais?)
  // A soma dos pesos deve ser lógica para distribuir o 'shiftAmount'
  const gainers = {
    'SS': 0.05, // Ganha 5% do montante (Pequeno em volume, mas gigante pro SS que é 0.1)
    'S':  0.15, // Ganha 15% do montante
    'A':  0.30, // Ganha 30% do montante
    'B':  0.50  // Ganha 50% do montante (B vai subir bastante em volume)
  }

  // 3. Pesos de Dedução (Quem paga a conta?)
  // Tiers mais baixos devem pagar mais.
  const losers = {
    'C': 0.05, // C paga pouco (quase neutro)
    'D': 0.15,
    'E': 0.30,
    'F': 0.50  // F paga a maior parte da conta
  }

  let newRates = {}
  
  // APLICAR CÁLCULO
  const tiers = ['SS', 'S', 'A', 'B', 'C', 'D', 'E', 'F']
  
  tiers.forEach(tier => {
    let change = 0
    
    // Se for Gainer (B pra cima)
    if (gainers[tier]) {
      change = shiftAmount * gainers[tier]
    } 
    // Se for Loser (C pra baixo)
    else if (losers[tier]) {
      change = -(shiftAmount * losers[tier])
    }

    // Calcula e garante que não fique negativo
    let finalVal = baseDropRates[tier] + change
    newRates[tier] = Math.max(0, finalVal)
  })

  // Retorna formatado para o HTML
  return tiers.map(tier => {
    const base = baseDropRates[tier]
    const real = newRates[tier] // Valor calculado no loop
    const diff = real - base
    
    return {
      tier,
      base: base.toFixed(2),
      real: real.toFixed(2),
      diff: diff.toFixed(2), // O valor exato da mudança (ex: "-4.50")
      diffSign: diff > 0 ? '+' : '', // Para mostrar o "+" na frente
      isBuffed: diff > 0.001, // Margem de erro pequena pra float
      isNerfed: diff < -0.001,
      color: tierConfig[tier].color
    }
  })
})
const filterJob = ref('') // Armazena a profissão selecionada ('', 'minerador', etc)
// Propriedade Computada: Retorna apenas os trabalhadores que batem com o filtro
const filteredWorkers = computed(() => {
  if (!filterJob.value) return workers.value
  return workers.value.filter(w => w.jobKey === filterJob.value)
})

// === ESTADO ===
const buildingLevel = ref(3)
const maxLevel = 10
const workers = ref([])
const playerRace = ref('automato')

// Controle do Modal
const showModal = ref(false)
const showProbModal = ref(false)
const newHire = ref(null) // Armazena o funcionário recém gerado para mostrar no modal

// Administrador Atual
const currentAdmin = ref({
  id: 'adm-001',
  name: 'Lady Sofy',
  race: 'draconiano',
  sex: 'f',
  jobTitle: 'Administradora',
  tier: 'S',
  efficiency: 42,
  salary: 11400,
  avatarUrl: '/assets/faces/draconiano/administrador_f.png'
})

// === LÓGICA ===
const sanitize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]

const generateRecruit = (forcedJob = null) => {
  const race = randomItem(racas)
  const sex = randomItem(['m', 'f'])
  
  const jobKey = forcedJob || randomItem(Object.keys(profissoes)) // <--- jobKey é a chave
  const jobTitle = profissoes[jobKey][sex] 
  // ... (código existente de tier, efficiency, salary...)
  
  const tiers = ['F','E','D','C','B','A','S','SS']
  const tier = tiers[Math.floor(Math.random() * tiers.length)]
  const config = tierConfig[tier]
  let efficiency = randomRange(config.minEff, config.maxEff)
  const isSameRace = race === playerRace.value
  if (isSameRace) efficiency += 5
  const salary = config.salary
  const avatarUrl = `/assets/faces/${sanitize(race)}/${jobKey}_${sex}.png`

  return { 
    id: Date.now() + Math.random(), 
    name: `Recruta ${Math.floor(Math.random() * 900) + 100}`,
    race, 
    sex: sex === 'm' ? 'Masculino' : 'Feminino', 
    jobKey, // (Mantendo o filtro que fizemos antes)
    jobTitle, 
    tier, 
    efficiency, 
    happiness: 100, // <--- NOVO STATUS: Inicia sempre em 100
    salary, 
    avatarUrl,
    isSameRace 
  }
}
const workerspecific = (jobKey) => {
  // 1. Gera o boneco
  const worker = generateRecruit(jobKey)
  
  // 2. Salva no "palco" do modal
  newHire.value = worker
  
  // 3. Adiciona na lista de funcionários
  workers.value.unshift(worker)
  
  // 4. Abre o modal
  showModal.value = true
}
// Função para fechar modal
const closeModal = () => {
  showModal.value = false
  newHire.value = null
}
const fireWorker = (id) => {
  workers.value = workers.value.filter(w => w.id !== id)
}
const recruitTen = () => { for(let i=0; i<10; i++) workers.value.unshift(generateRecruit()) }
onMounted(() => { recruitTen() })

const getTierClass = (tier) => `tier-${tierConfig[tier].color}`
const formatNum = (n) => new Intl.NumberFormat('pt-BR').format(n)

</script>

<template>
  <div class="recruit-view">
    
    <div class="building-header">
      <div class="bh-left">
        <div class="bh-icon">🤝</div>
        <div class="bh-data">
          <h2>Centro de Recrutamento</h2>
          <span class="bh-lvl">NÍVEL {{ buildingLevel }} / {{ maxLevel }}</span>
        </div>
      </div>
      <div class="bh-right">
         <button class="help-btn" @click="showProbModal = true">?</button>
      </div>
    </div>

    <div class="admin-panel">
      
      <div class="panel-header">
        <span class="ph-title">ADMINISTRADOR RESPONSÁVEL</span>
        <div class="ph-line"></div>
        <button class="header-action-btn" title="Trocar Administrador" v-if="currentAdmin">
        <span class="btn-icon">🔄</span>
        <span class="btn-text">TROCAR</span> </button>
      </div>
      
      <div class="admin-card hud-style" v-if="currentAdmin">

        <div class="hud-left">
          <div class="h-frame" :class="getTierClass(currentAdmin.tier)">
            <img :src="currentAdmin.avatarUrl" @error="$event.target.src='https://placehold.co/150?text=No+Img'">
          </div>
          <div class="h-tier-label" :class="getTierClass(currentAdmin.tier)">TIER {{ currentAdmin.tier }}</div>
        </div>
        
        <div class="hud-right">
          <div class="h-title-row">
            <h3 class="h-name">{{ currentAdmin.name }}</h3>
            <div class="h-line"></div>
          </div>
          <div class="admin-race-tag tactical-plate">{{ currentAdmin.race }}</div>
          
          <div class="h-metrics">
            <div class="metric">
              <span class="m-val blue">{{ currentAdmin.efficiency }}%</span>
              <span class="m-lbl">EFICIÊNCIA</span>
            </div>
            <div class="metric">
              <span class="m-val gold">{{ formatNum(currentAdmin.salary) }}</span>
              <span class="m-lbl">SALÁRIO (G)</span>
            </div>
          </div>
        </div>
      </div>
      <div class="admin-card empty-slot" v-else>
        
        <div class="slot-frame">
          <img src="/assets/ui/i_habitantes.png" class="slot-icon" alt="👤">
        </div>
        
        <div class="slot-info">
          <span class="s-title">SLOT DE COMANDO VAZIO</span>
          <span class="s-desc">Nenhum operador designado. O centro de recrutamento está operando sem bônus de eficiência.</span>
        </div>
      </div>

    </div>

    <div class="recruit-panel tactical-style">
      
      <div class="rp-compact-header">
        <div class="rp-label">
          <span class="rp-ico">💠</span>
          <span>CONTRATAR</span>
        </div>
        <div class="rp-price">
          CUSTO: <span class="val-gold">500 G</span>
        </div>
      </div>

      <div class="slots-container">
        <button 
          v-for="(labels, key) in profissoes" 
          :key="key"
          class="slot-btn"
          @click="workerspecific(key)"
          :title="labels.m"
        >
          <div class="slot-icon-frame">
             <img :src="`/assets/ui/i_${key}.png`" class="s-icon" @error="$event.target.style.opacity='0.3'">
          </div>
          
          <span class="slot-name">{{ labels.m }}</span>
          
          <div class="corner-mark top-right"></div>
          <div class="corner-mark bottom-left"></div>
        </button>
      </div>

    </div>

    <div class="modal-overlay" v-if="showModal && newHire" @click.self="closeModal">
      <div class="new-hire-card style-tcg" :class="getTierClass(newHire.tier)">
        
        <div class="tcg-header">
           <span class="p-rank">RANK {{ newHire.tier }}</span>
           <button class="p-close" @click="closeModal">✕</button>
        </div>

        <div class="tcg-body">
           <div class="tcg-visual-container">
              <img :src="newHire.avatarUrl" class="tcg-img">
              <div class="tcg-shine"></div> </div>
           
           <div class="tcg-info">
              <h2 class="tcg-name">{{ newHire.name }}</h2>
              <span class="tcg-job">{{ newHire.jobTitle }}</span>
           </div>

           <div class="tcg-stats-box">
              <div class="ts-row">
                 <span class="lbl">RAÇA</span>
                 <span class="val capitalize">{{ newHire.race }}</span>
              </div>
              
              <div class="ts-row">
                 <span class="lbl">EFICIÊNCIA</span>
                 <span class="val highlight">{{ newHire.efficiency }}%</span>
              </div>

              <div class="ts-row">
                 <span class="lbl">HUMOR</span>
                 <span class="val teal">{{ newHire.happiness }}%</span>
              </div>

              <div class="ts-row highlight-row">
                 <span class="lbl">CUSTO</span>
                 <span class="val gold">{{ formatNum(newHire.salary) }} Ouro</span>
              </div>
           </div>
        </div>

        <button class="game-btn confirm lg portal-btn" @click="closeModal">CONTRATAR</button>
      </div>
    </div>

    <div class="candidates-list">
      
      <div class="list-header">
        <div class="lh-left">
          <div class="lh-icon">💠</div>
          <span class="lh-title">FUNCIONÁRIOS ({{ workers.length }})</span>
        </div>

        <div class="lh-right">
          <select v-model="filterJob" class="tactical-select">
            <option value="">TODAS AS CLASSES</option>
            <option v-for="(labels, key) in profissoes" :key="key" :value="key">
              {{ labels.m.toUpperCase() }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid-workers">
        <div v-for="worker in filteredWorkers" :key="worker.id" class="worker-card" :class="getTierClass(worker.tier)">
           <div class="card-visual">
             <img :src="worker.avatarUrl">
             <div class="card-rank-badge">{{ worker.tier }}</div>
             <div class="card-gradient-overlay"></div>
             <div class="card-floating-name">
                <span class="c-name">{{ worker.name }}</span>
                <span class="c-job">{{ worker.jobTitle }}</span>
             </div>
          </div>

          <div class="card-body">
             <div class="stat-line">
                <span class="s-label">RAÇA</span>
                <span class="s-value">{{ worker.race }}</span>
             </div>
             <div class="stat-line">
                <span class="s-label">EFICIÊNCIA</span>
                <span class="s-value blue">{{ worker.efficiency }}%</span>
             </div>

             <div class="stat-line">
                <span class="s-label">HUMOR</span>
                <span class="s-value teal">{{ worker.happiness }}%</span>
             </div>

             <div class="stat-line">
                <span class="s-label">SALÁRIO</span>
                <span class="s-value gold">{{ formatNum(worker.salary) }} G</span>
             </div>

             <button class="btn-fire" @click="fireWorker(worker.id)">DISPENSAR</button>
          </div>
           </div>
        
        <div v-if="filteredWorkers.length === 0" class="empty-filter-msg">
          NENHUM HABITANTE ENCONTRADO COM ESTA PROFISSÃO.
        </div>
      </div>
    </div>

  </div>
  <div class="modal-overlay" v-if="showProbModal" @click.self="showProbModal = false">
      <div class="tactical-card">
        
        <div class="tc-header">
          <span class="tc-title">LOG DE PROBABILIDADE DO SISTEMA</span>
          <button class="tc-close" @click="showProbModal = false">✕</button>
        </div>

        <div class="tc-admin-bar">
          <div class="ab-info">
             <span class="ab-lbl">FONTE:</span>
             <span class="ab-val">{{ currentAdmin ? currentAdmin.name : 'N/A' }}</span>
          </div>
          <div class="ab-stat">
             <span class="ab-lbl">EFICIÊNCIA:</span>
             <span class="ab-val blue">+{{ currentAdmin ? currentAdmin.efficiency : 0 }}%</span>
          </div>
        </div>

        <div class="tc-grid">
          
          <div class="grid-row header-row">
            <div class="col-rank">RANK</div>
            <div class="col-base">BASE</div>
            <div class="col-mod">MOD</div>
            <div class="col-final">FINAL</div>
            <div class="col-vis">VISUALIZAÇÃO</div>
          </div>

          <div v-for="rate in dropRateTable" :key="rate.tier" class="grid-row data-row">
            
            <div class="col-rank">
              <div class="tc-badge" :class="`tier-${rate.color}`">{{ rate.tier }}</div>
            </div>

            <div class="col-base muted">{{ rate.base }}%</div>

            <div class="col-mod" :class="{ 'text-buff': rate.isBuffed, 'text-nerf': rate.isNerfed, 'text-neut': !rate.isBuffed && !rate.isNerfed }">
               {{ rate.diffSign }}{{ rate.diff }}%
            </div>

            <div class="col-final strong">{{ rate.real }}%</div>

            <div class="col-vis">
              <div class="vis-track">
                <div class="vis-marker" :style="{ left: (rate.base * 3) + '%' }"></div>
                
                <div class="vis-fill" 
                     :style="{ width: (rate.real * 3) + '%' }"
                     :class="rate.isBuffed ? 'fill-buff' : 'fill-nerf'">
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="tc-footer">
          * A soma total das probabilidades permanece 100%. O aumento nos Tiers altos causa redução proporcional nos baixos.
        </div>

      </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&display=swap');
/* === MODAL BLUEPRINT (ESTILO NATIVO) === */

/* === MODAL TACTICAL DATA === */

.tactical-card {
  width: 600px; /* Bem largo para caber tudo */
  background: #1e293b; /* Slate 800 */
  border: 1px solid #334155;
  box-shadow: 0 0 40px rgba(0,0,0,0.8);
  border-radius: 6px;
  display: flex; flex-direction: column;
  overflow: hidden;
  font-family: 'Chakra Petch', sans-serif;
}

/* Header */
.tc-header {
  background: #0f172a; padding: 10px 15px;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #334155;
}
.tc-title { font-size: 12px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; }
.tc-close { background: none; border: none; color: #64748b; font-weight: bold; cursor: pointer; }
.tc-close:hover { color: #fff; }

/* Admin Bar */
.tc-admin-bar {
  background: #1e293b; padding: 10px 15px;
  display: flex; gap: 20px; border-bottom: 1px solid #334155;
}
.ab-info, .ab-stat { display: flex; gap: 5px; align-items: center; font-size: 11px; }
.ab-lbl { color: #64748b; font-weight: 700; }
.ab-val { color: #e2e8f0; font-weight: 700; }
.ab-val.blue { color: #38bdf8; }

/* GRID SYSTEM */
.tc-grid { display: flex; flex-direction: column; background: #0f172a; }

.grid-row {
  display: grid;
  /* Definição exata das colunas */
  grid-template-columns: 50px 70px 70px 70px 1fr; 
  align-items: center;
  padding: 6px 15px;
  border-bottom: 1px solid #1e293b;
}

.header-row {
  background: rgba(30, 41, 59, 0.5);
  font-size: 9px; color: #64748b; font-weight: 700; letter-spacing: 1px;
}
.data-row { transition: 0.2s; font-size: 11px; font-family: monospace; }
.data-row:hover { background: #1e293b; }

/* Colunas Específicas */
.col-rank { display: flex; align-items: center; }
.col-base { color: #64748b; text-align: right; padding-right: 15px; } /* Muted */
.col-mod { text-align: right; padding-right: 15px; font-weight: 700; }
.col-final { text-align: right; padding-right: 15px; color: #fff; font-weight: 700; font-size: 12px; }
.col-vis { padding-left: 10px; }

/* Badges */
.tc-badge {
  width: 24px; height: 20px; font-size: 10px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  border-radius: 3px; background: #334155; color: #fff; font-family: sans-serif;
}
/* Cores (Usando suas classes globais) */
.tier-gold { background: #facc15; color: #000; }
.tier-red { background: #f43f5e; color: #fff; }
.tier-purple { background: #c084fc; color: #000; }

/* Cores de Texto (Modificador) */
.text-buff { color: #38bdf8; } /* Azul para ganho (Tech) */
.text-nerf { color: #ef4444; } /* Vermelho para perda */
.text-neut { color: #475569; }

/* Barra Visual */
.vis-track {
  width: 100%; height: 6px; background: #020617; border-radius: 3px; position: relative;
  border: 1px solid #334155;
}
.vis-fill { height: 100%; position: absolute; top: 0; left: 0; transition: width 0.3s; }

.fill-buff { background: #38bdf8; box-shadow: 0 0 5px rgba(56, 189, 248, 0.5); }
.fill-nerf { background: #ef4444; opacity: 0.6; }

/* Marcador de Onde era a Base */
.vis-marker {
  position: absolute; top: -1px; bottom: -1px; width: 1px;
  background: #fff; opacity: 0.3; z-index: 5;
}

/* Footer */
.tc-footer {
  padding: 10px 15px; background: #0f172a; color: #475569; font-size: 9px;
  border-top: 1px solid #334155; text-align: center;
}

/* =========================================
   1. VARIAVEIS
   ========================================= */
.recruit-view {
  font-family: 'Chakra Petch', sans-serif;
  color: #e2e8f0;
  display: flex; flex-direction: column; gap: 20px;
  width: 100%;
}

/* Cores de Rank (Usadas para bordas e brilhos) */
.tier-gray   { --rk-c: #94a3b8; --rk-bg: #1e293b; }
.tier-green  { --rk-c: #10b981; --rk-bg: #064e3b; }
.tier-blue   { --rk-c: #00f0ff; --rk-bg: #1e3a8a; }
.tier-purple { --rk-c: #d946ef; --rk-bg: #581c87; }
.tier-gold   { --rk-c: #ffd700; --rk-bg: #713f12; }
.tier-red    { --rk-c: #ff003c; --rk-bg: #7f1d1d; }

/* Utilitários */
.gold { color: #ffd700; text-shadow: 0 0 2px #000; }
.blue { color: #38bdf8; text-shadow: 0 0 2px #000; }
.highlight { color: #fff; font-weight: 700; }
.capitalize { text-transform: capitalize; }


/* =========================================
   2. HEADER
   ========================================= */
.building-header {
  background: #1e293b;
  border-bottom: 1px solid #334155;
  border-left: 4px solid #38bdf8;
  padding: 12px 20px;
  display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}

.bh-left { display: flex; align-items: center; gap: 12px; }
.bh-icon { font-size: 20px; filter: drop-shadow(0 0 2px #fff); }
.bh-data h2 { margin: 0; font-size: 14px; text-transform: uppercase; color: #fff; letter-spacing: 1px; font-weight: 700; }
.bh-lvl { font-size: 10px; color: #94a3b8; background: #0f172a; padding: 2px 8px; border-radius: 10px; border: 1px solid #334155; }



/* =========================================
   3. ADMIN PANEL (O CLÁSSICO PONTILHADO)
   ========================================= */
.admin-panel { display: flex; flex-direction: column; gap: 8px; }

.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 0 5px; border-bottom: 1px solid #334155; padding-bottom: 5px; }
.ph-title { font-size: 11px; color: #94a3b8; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }

.header-action-btn {
  background: #0f172a; border: 1px solid #334155; color: #94a3b8;
  padding: 4px 12px; font-size: 10px; cursor: pointer; text-transform: uppercase;
  font-weight: 700; transition: 0.2s; border-radius: 4px;
}
.header-action-btn:hover { border-color: #38bdf8; color: #38bdf8; }

.admin-card {
  background-color: #1e293b;
  /* GRID PONTILHADO PRESERVADO */
  background-image: radial-gradient(#64748b 1.5px, transparent 1.5px);
  background-size: 12px 12px;
  
  border: 1px solid #475569;
  padding: 15px;
  display: flex; gap: 20px; align-items: center;
  position: relative;
  box-shadow: inset 0 0 50px rgba(0,0,0,0.5); 
}

/* Camada escura por cima para legibilidade */
.admin-card::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(30,41,59,0.95) 20%, rgba(30,41,59,0.6) 100%);
  pointer-events: none;
}

.admin-card.empty-slot { border-style: dashed; justify-content: center; opacity: 0.7; }
.hud-left, .hud-right { position: relative; z-index: 2; }

/* Avatar Admin */
.h-frame {
  width: 70px; height: 70px;
  background: #000;
  border: 2px solid var(--rk-c, #64748b);
  border-radius: 8px;
  padding: 2px;
  box-shadow: 0 0 15px rgba(0,0,0,0.5);
}
.h-frame img { width: 100%; height: 100%; object-fit: cover; border-radius: 5px; }

.hud-left { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.h-tier-label {
  background: var(--rk-c); color: #0f172a;
  font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 4px;
  margin-top: -10px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.hud-right { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.h-name { font-size: 18px; color: #fff; margin: 0; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
.admin-race-tag { font-size: 10px; color: var(--rk-c); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700; }

.h-metrics { display: flex; gap: 25px; }
.metric { display: flex; flex-direction: column; border-left: 2px solid rgba(255,255,255,0.1); padding-left: 10px; }
.m-val { font-size: 15px; font-weight: 700; color: #fff; }
.m-lbl { font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }


/* =========================================
   4. BOTÕES DE PROFISSÃO (SLOTS DE SKILL)
   ========================================= */
/* =========================================
   PAINEL DE RECRUTAMENTO (TEMA: WIDE TACTICAL)
   ========================================= */

.recruit-panel.tactical-style {
  background: #1e293b;
  border: 1px solid #334155;
  border-left: 4px solid #38bdf8;
  padding: 15px;
  display: flex; flex-direction: column; gap: 15px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  margin-top: 10px;
}

/* HEADER COMPACTO */
.rp-compact-header {
  display: flex; justify-content: space-between; align-items: center;
  background: #0f172a;
  padding: 8px 12px;
  border: 1px solid #334155;
  border-radius: 4px;
}
.rp-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
.rp-ico { color: #38bdf8; font-size: 14px; }
.rp-price { font-size: 10px; color: #64748b; font-weight: 700; }
.val-gold { color: #facc15; font-size: 12px; margin-left: 5px; }


/* CONTAINER CENTRALIZADO */
.slots-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center; /* Centraliza o bloco */
  gap: 8px;
}

/* O BOTÃO (WIDE & COMPACT) */
.slot-btn {
  /* LARGURA E ALTURA */
  width: 125px;   /* Largo */
  height: 50px;   /* Baixo */

  /* LAYOUT: Coluna (Icone Topo, Texto Base) */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;       /* Espaço mínimo entre ícone e texto */
  
  background: #0f172a;
  border: 1px solid #334155;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  padding: 4px;
}

/* Hover */
.slot-btn:hover {
  background: #1e293b;
  border-color: #38bdf8;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(56, 189, 248, 0.15);
}
.slot-btn:active { transform: translateY(0); border-color: #facc15; }

/* ÍCONE (PEQUENO) */
.slot-icon-frame {
  width: 22px; 
  height: 22px;
  display: flex; align-items: center; justify-content: center;
  opacity: 0.8;
  transition: 0.2s;
}

.s-icon { width: 100%; height: 100%; object-fit: contain; }
.slot-btn:hover .slot-icon-frame { opacity: 1; transform: scale(1.1); }

/* TEXTO (FONTE PEQUENA) */
.slot-name {
  font-size: 10px;        /* Fonte pequena */
  line-height: 1;         /* Linha compacta */
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
  max-width: 100%;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.slot-btn:hover .slot-name { color: #fff; }

/* CANTOS DECORATIVOS (SUTIS) */
.corner-mark {
  position: absolute; width: 4px; height: 4px;
  border-color: #475569; transition: 0.2s;
}
.corner-mark.top-right {
  top: 2px; right: 2px;
  border-top: 1px solid; border-right: 1px solid;
  border-color: #64748b;
}
.corner-mark.bottom-left {
  bottom: 2px; left: 2px;
  border-bottom: 1px solid; border-left: 1px solid;
  border-color: #64748b;
}
.slot-btn:hover .corner-mark { border-color: #38bdf8; }

/* MOBILE */
@media (max-width: 600px) {
  /* No mobile, botões um pouco menores para caber na tela */
  .slot-btn { width: 100px; height: 45px; } 
  .slot-name { font-size: 8px; }
}



/* =========================================
   5. LISTA: CARTAS DE COLECIONADOR (TCG)
   ========================================= */
.candidates-list { margin-top: 25px; }
.list-header { 
  display: flex; 
  justify-content: space-between; /* Joga um pra esq, outro pra dir */
  align-items: center; 
  margin-bottom: 15px; 
  border-bottom: 1px solid #334155; 
  padding-bottom: 8px;
}
.lh-left { display: flex; align-items: center; gap: 8px; }
.lh-title { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
.tactical-select {
  background-color: #0f172a;
  color: #94a3b8;
  border: 1px solid #334155;
  padding: 4px 8px;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  transition: 0.2s;
  
  /* Remove a seta padrão feia e adiciona espaço */
  appearance: none; 
  padding-right: 25px;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 5px center;
  background-size: 12px;
}
/* Mensagem de lista vazia */
.empty-filter-msg {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  border: 1px dashed #334155;
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.grid-workers {
  display: grid;
  /* Cards Largos o suficiente para texto completo */
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
  gap: 15px;
}

.worker-card {
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 8px;
  overflow: hidden;
  transition: 0.3s;
  position: relative;
  display: flex; flex-direction: column;
}

/* Efeito de Hover: Carta Levita e Brilha a Borda */
.worker-card:hover {
  transform: translateY(-5px);
  border-color: var(--rk-c);
  box-shadow: 0 5px 20px rgba(0,0,0,0.4);
}

/* Área Visual (Imagem + Rank) */
.card-visual {
  height: 140px; /* Imagem Alta */
  position: relative;
  background: #000;
}
.card-visual img { width: 100%; height: 100%; object-fit: cover; transition: 0.3s; }
.worker-card:hover .card-visual img { transform: scale(1.05); opacity: 0.8; }

.card-rank-badge {
  position: absolute; top: 8px; right: 8px; z-index: 2;
  background: var(--rk-c); color: #000;
  font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.5);
}

/* Overlay Escuro para o Nome */
.card-gradient-overlay {
  position: absolute; bottom: 0; left: 0; width: 100%; height: 60%;
  background: linear-gradient(to top, #1e293b 10%, transparent);
  pointer-events: none;
}

.card-floating-name {
  position: absolute; bottom: 10px; left: 10px; right: 10px; z-index: 2;
  display: flex; flex-direction: column;
}
.c-name { font-size: 14px; font-weight: 700; color: #fff; text-shadow: 0 2px 4px #000; }
.c-job { font-size: 10px; color: #38bdf8; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 4px #000; }


/* Corpo da Carta (Stats Completos) */
.card-body {
  padding: 10px 12px;
  background: #1e293b;
  display: flex; flex-direction: column; gap: 8px; flex: 1;
}

.stat-line {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;
}
.stat-line:last-of-type { border-bottom: none; }

.s-label { font-size: 9px; color: #94a3b8; font-weight: 700; }
.s-value { font-size: 11px; color: #e2e8f0; font-weight: 600; text-transform: capitalize; }

.btn-fire {
  margin-top: auto;
  width: 100%; background: #0f172a; border: 1px solid #ef4444;
  color: #ef4444; font-size: 10px; padding: 8px; border-radius: 4px;
  cursor: pointer; text-transform: uppercase; font-weight: 700;
  transition: 0.2s;
}
.btn-fire:hover { background: #ef4444; color: #fff; }


/* =========================================
   6. MODAL (CARTA PREMIUM)
   ========================================= */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.9);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}

.new-hire-card {
  width: 320px;
  background: #1e293b;
  border: 2px solid var(--rk-c);
  border-radius: 12px;
  box-shadow: 0 0 50px rgba(0,0,0,0.8);
  display: flex; flex-direction: column; overflow: hidden;
  animation: cardFlip 0.4s ease-out;
}
@keyframes cardFlip { from { transform: rotateY(90deg); opacity: 0; } to { transform: rotateY(0); opacity: 1; } }

.tcg-header {
  background: var(--rk-c); padding: 10px 15px;
  display: flex; justify-content: space-between; align-items: center;
}
.p-rank { font-weight: 900; color: #000; font-size: 16px; letter-spacing: 1px; }
.p-close { background: none; border: none; color: #000; font-weight: bold; font-size: 16px; cursor: pointer; }

.tcg-body { padding: 0; display: flex; flex-direction: column; }

/* Imagem Grande no Modal */
.tcg-visual-container {
  height: 180px; width: 100%; position: relative;
  background: #000;
}
.tcg-img { width: 100%; height: 100%; object-fit: cover; }
.tcg-shine { 
  position: absolute; inset: 0; 
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%); 
  pointer-events: none;
}

.tcg-info { padding: 15px; text-align: center; background: #162032; border-bottom: 1px solid #334155; }
.tcg-name { font-size: 20px; color: #fff; margin: 0; font-weight: 700; }
.tcg-job { font-size: 11px; color: #38bdf8; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; }

/* Stats Box */
.tcg-stats-box { padding: 15px; display: flex; flex-direction: column; gap: 8px; }

.ts-row { 
  display: flex; justify-content: space-between; align-items: center;
  background: #0f172a; padding: 8px 12px; border-radius: 4px; border: 1px solid #334155;
}
.highlight-row { border-color: rgba(255, 215, 0, 0.3); }

.ts-row .lbl { font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; }
.ts-row .val { font-size: 12px; font-weight: 700; color: #fff; }

.game-btn.portal-btn {
  width: 100%; padding: 15px; border: none;
  background: var(--rk-c); color: #000;
  font-weight: 800; font-size: 14px; text-transform: uppercase; cursor: pointer;
  transition: 0.2s;
}
.game-btn.portal-btn:hover { filter: brightness(1.1); }
.teal { 
  color: #2dd4bf; /* Teal 400 (Verde Água Tech) */
  text-shadow: 0 0 5px rgba(45, 212, 191, 0.4); 
  font-weight: 700;
}

/* MOBILE */
@media (max-width: 600px) {
  .building-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .bh-right { width: 100%; }
  .grid-workers { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
}
</style>