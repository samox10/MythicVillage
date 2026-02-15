<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { PROFISSOES, RACAS, TIER_CONFIG, BASE_DROP_RATES, DROP_RATE_META, UNLOCK_THRESHOLDS, TIER_ORDER } from '../data/balancing'

const store = useGameStore()

// === FILTROS E ESTADO VISUAL ===
const filterJob = ref('')
const showModal = ref(false)
const showProbModal = ref(false)
const showAdminSelect = ref(false)
const newHire = ref(null)

// Computed: Pega workers da store e filtra
const filteredWorkers = computed(() => {
  if (!filterJob.value) return store.workers
  return store.workers.filter(w => w.jobKey === filterJob.value)
})
// Filtro de Administradores Disponíveis (Para o botão Designar)
const availableAdmins = computed(() => {
  return store.workers.filter(w => w.jobKey === 'administrador' && w.id !== store.adminId)
})

// === CÁLCULO DE PROBABILIDADE COM DESBLOQUEIO ===
// === CÁLCULO DE PROBABILIDADE (DISTRIBUIÇÃO PONDERADA) ===
const dropRateTable = computed(() => {
  const adminEff = store.currentAdmin ? store.currentAdmin.efficiency : 0
  const buildingLvl = store.recruitmentLevel || 1

  // 1. Definição do Teto (Tier Máximo Liberado)
  const effectiveLvl = Math.min(buildingLvl, 5)
  const maxAllowedTier = UNLOCK_THRESHOLDS[effectiveLvl] || 'E'
  const maxIndex = TIER_ORDER.indexOf(maxAllowedTier)

  // Separa Tiers Liberados e Bloqueados
  let unlockedTiers = TIER_ORDER.filter((_, i) => i <= maxIndex)
  let lockedTiers = TIER_ORDER.filter((_, i) => i > maxIndex)

  // 2. Normalização Inicial (Regra de Três)
  // Faz com que os tiers liberados ocupem 100% do espaço proporcionalmente à sua base
  let sumBaseUnlocked = unlockedTiers.reduce((acc, t) => acc + BASE_DROP_RATES[t], 0)
  let currentRates = {}
  
  unlockedTiers.forEach(tier => {
    // Ex: Se só tem F e E, a soma é ~46. F vira (21/46)*100 = ~45%
    currentRates[tier] = (BASE_DROP_RATES[tier] / sumBaseUnlocked) * 100
  })

  // 3. Aplicação do Bônus (Shift)
  const totalShift = (buildingLvl * DROP_RATE_META.shiftPerLevel) + ((adminEff / 100) * DROP_RATE_META.shiftPerAdmin)
  
  if (totalShift > 0) {
    // A) CALCULAR O POTE DE PERDA (De onde sai a %)
    // Apenas tiers F e E perdem. Se E for o máximo (Nível 1), ele não perde, ele ganha.
    let validLosers = unlockedTiers.filter(t => 
      DROP_RATE_META.losersWeights[t] && t !== maxAllowedTier
    )
    
    // Se não tiver quem perder (Ex: Nível 1 só tem F e E, e E é o max), o shift sai só do F
    let lossPot = 0
    let loserWeightsSum = validLosers.reduce((acc, t) => acc + DROP_RATE_META.losersWeights[t], 0)
    
    validLosers.forEach(tier => {
      // Normaliza o peso da perda
      const weight = DROP_RATE_META.losersWeights[tier] / (loserWeightsSum || 1)
      const loss = Math.min(currentRates[tier], totalShift * weight) // Não deixa ficar negativo
      currentRates[tier] -= loss
      lossPot += loss
    })

    // B) DISTRIBUIR O POTE DE GANHO (Para onde vai a %)
    // O ganho vai para todos os tiers liberados que NÃO são losers (D até SS)
    // Se estiver no Nível 1 (E é max), o E recebe tudo.
    let validGainers = unlockedTiers.filter(t => !DROP_RATE_META.losersWeights[t])
    
    // Caso especial Nível 1: E é gainer
    if (validGainers.length === 0 && unlockedTiers.includes('E')) validGainers.push('E')

    let gainerWeightsSum = validGainers.reduce((acc, t) => acc + (DROP_RATE_META.bonusDistribution[t] || 1), 0)

    validGainers.forEach(tier => {
      // Pega o peso do balancing.js (B=35, S=8, etc)
      const weight = (DROP_RATE_META.bonusDistribution[tier] || 1) / gainerWeightsSum
      currentRates[tier] += lossPot * weight
    })
  }

  // 4. Formatação Final
  return TIER_ORDER.slice().reverse().map(tier => {
    const isLocked = lockedTiers.includes(tier)
    // Base recalculada para exibição (mostra quanto seria sem o bônus do admin/nível)
    const normalizedBase = isLocked ? 0 : (BASE_DROP_RATES[tier] / sumBaseUnlocked) * 100
    const real = isLocked ? 0 : currentRates[tier]
    const diff = real - normalizedBase

    return {
      tier,
      base: isLocked ? "BLOQ" : normalizedBase.toFixed(2),
      real: real.toFixed(2),
      diff: diff.toFixed(2),
      diffSign: diff > 0 ? '+' : '',
      isBuffed: diff > 0.05,
      isNerfed: diff < -0.05,
      isLocked: isLocked,
      color: TIER_CONFIG[tier].color
    }
  })
})

// === FUNÇÃO GERADORA ===
const sanitize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]

const generateRecruit = (forcedJob = null) => {
  // 1. Validação de Ouro
  if (store.resources.goldCoin < 500) {
    alert("Ouro Insuficiente! Requer 500 G.")
    return null
  }

  // 2. Dados Básicos
  const race = randomItem(RACAS)
  const sex = randomItem(['m', 'f'])
  const jobKey = forcedJob || randomItem(Object.keys(PROFISSOES))
  const jobTitle = PROFISSOES[jobKey][sex] 
  
  // 3. LÓGICA DE DROP RATE REAL (CORRIGIDO)
  // Pega a tabela de probabilidades calculada (aquela que aparece no modal)
  const rates = dropRateTable.value 
  
  // Gera um número entre 0 e 100 (Soma total das porcentagens)
  // Usamos reduce para garantir precisão caso a soma varie levemente de 100%
  const totalWeight = rates.reduce((sum, r) => sum + parseFloat(r.real), 0)
  let randomNum = Math.random() * totalWeight
  
  let selectedTier = 'F' // Tier padrão caso algo falhe

  // Roda a roleta: vai subtraindo a chance de cada tier até o número zerar
  for (const rate of rates) {
    randomNum -= parseFloat(rate.real)
    if (randomNum <= 0) {
      selectedTier = rate.tier
      break
    }
  }
  
  const tier = selectedTier
  
  // 4. Configuração Final do Boneco
  const config = TIER_CONFIG[tier]
  let efficiency = randomRange(config.minEff, config.maxEff)
  
  if (race === 'automato') efficiency += 5 
  
  const avatarUrl = `/assets/faces/${sanitize(race)}/${jobKey}_${sex}.png`

  return { 
    id: Date.now() + Math.random(), 
    name: `Recruta ${Math.floor(Math.random() * 900) + 100}`,
    race,
    sex: sex === 'm' ? 'Masculino' : 'Feminino', 
    jobKey, jobTitle, tier, efficiency, 
    happiness: 100,
    salary: config.salary, 
    avatarUrl
  }
}

// === AÇÕES ===
const tryHire = (jobKey) => {
  const worker = generateRecruit(jobKey)
  if (worker) {
    const success = store.hireWorker(worker)
    if (success) {
        newHire.value = worker
        showModal.value = true
    }
  }
}

const selectAdmin = (id) => {
  store.setAdmin(id)
  showAdminSelect.value = false
}
const closeModal = () => {
  showModal.value = false
  newHire.value = null
}

const getTierClass = (tier) => `tier-${TIER_CONFIG[tier].color}`
const formatNum = (n) => new Intl.NumberFormat('pt-BR').format(n)

</script>

<template>
  <div class="recruit-view">
    
    <div class="building-header">
      <div class="bh-left">
        <div class="bh-icon">🤝</div>
        <div class="bh-data">
          <h2>Centro de Recrutamento</h2>
          <span class="bh-lvl">NÍVEL {{ store.recruitmentLevel }} / 10</span>
        </div>
      </div>
      <div class="bh-right">
         <button class="help-btn" @click="showProbModal = true">?</button>
      </div>
    </div>

    <div class="admin-panel">
      <div class="panel-header">
        <span class="ph-title">GESTÃO DE OPERAÇÕES</span>
        <div class="ph-line"></div>
      </div>
      
      <div class="admin-card hud-style" v-if="store.currentAdmin">
        <div class="hud-left">
          <div class="h-frame" :class="getTierClass(store.currentAdmin.tier)">
            <img :src="store.currentAdmin.avatarUrl">
          </div>
          <div class="h-tier-label" :class="getTierClass(store.currentAdmin.tier)">TIER {{ store.currentAdmin.tier }}</div>
        </div>
        
        <div class="hud-right">
          <div class="h-title-row">
            <h3 class="h-name">{{ store.currentAdmin.name }}</h3>
             <button class="header-action-btn remove" title="Remover Admin" @click="store.setAdmin(store.currentAdmin.id)">
                REMOVER
             </button>
          </div>
          <div class="admin-race-tag tactical-plate">{{ store.currentAdmin.race }}</div>
          
          <div class="h-metrics">
            <div class="metric"><span class="m-val blue">{{ store.currentAdmin.efficiency }}%</span><span class="m-lbl">EFICIÊNCIA</span></div>
            <div class="metric"><span class="m-val gold">{{ formatNum(store.currentAdmin.salary) }}</span><span class="m-lbl">SALÁRIO (G)</span></div>
          </div>
        </div>
      </div>

      <div class="admin-card empty-slot" v-else>
        <div class="slot-frame">
          <img src="/assets/ui/i_habitantes.png" class="slot-icon" alt="👤">
        </div>
        
        <div class="slot-content-wrapper">
          <div class="slot-info">
            <span class="s-title">SISTEMA OFFLINE</span>
            <span class="s-desc">Bônus de eficiência inativos. Requer unidade classe [ADMINISTRADOR].</span>
          </div>
          
          <button class="btn-designar" @click="showAdminSelect = true">
             ✚ DESIGNAR
          </button>
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
          v-for="(labels, key) in PROFISSOES" 
          :key="key"
          class="slot-btn"
          @click="tryHire(key)"
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
              <div class="tcg-shine"></div> 
           </div>
           
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
              <div class="ts-row highlight-row">
                 <span class="lbl">SALÁRIO</span>
                 <span class="val gold">{{ formatNum(newHire.salary) }} G/dia</span>
              </div>
           </div>
        </div>
        <button class="game-btn confirm lg portal-btn" @click="closeModal">CONFIRMAR CONTRATAÇÃO</button>
      </div>
    </div>
    <div class="modal-overlay" v-if="showAdminSelect" @click.self="showAdminSelect = false">
      <div class="tactical-card select-modal">
        <div class="tc-header">
          <span class="tc-title">SELECIONAR ADMINISTRADOR</span>
          <button class="tc-close" @click="showAdminSelect = false">✕</button>
        </div>
        
        <div class="select-list">
          <div v-if="availableAdmins.length === 0" class="empty-list">
            NENHUM ADMINISTRADOR DISPONÍVEL NA VILA.
            <br><small>Contrate um funcionário da classe "Administrador" primeiro.</small>
          </div>

          <div v-else v-for="admin in availableAdmins" :key="admin.id" class="select-item" @click="selectAdmin(admin.id)">
            <div class="si-left">
              <img :src="admin.avatarUrl" class="si-avatar">
              <div class="si-info">
                <span class="si-name">{{ admin.name }}</span>
                <span class="si-rank" :class="`text-${TIER_CONFIG[admin.tier].color}`">RANK {{ admin.tier }}</span>
              </div>
            </div>
            <div class="si-stats">
              <span class="si-eff">{{ admin.efficiency }}% EFIC.</span>
              <button class="btn-pick">ESCOLHER</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="candidates-list">
      
      <div class="list-header">
        <div class="lh-left">
          <div class="lh-icon">💠</div>
          <span class="lh-title">FUNCIONÁRIOS ({{ store.workers.length }})</span>
        </div>

        <div class="lh-right">
          <select v-model="filterJob" class="tactical-select">
            <option value="">TODAS AS CLASSES</option>
            <option v-for="(labels, key) in PROFISSOES" :key="key" :value="key">
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
                <span class="s-value capitalize">{{ worker.race }}</span>
             </div>
             <div class="stat-line">
                <span class="s-label">HUMOR</span>
                <span class="s-value teal">{{ worker.happiness || 100 }}%</span>
             </div>
             <div class="stat-line">
                <span class="s-label">EFICIÊNCIA</span>
                <span class="s-value blue">{{ worker.efficiency }}%</span>
             </div>
             <div class="stat-line">
                <span class="s-label">SALÁRIO</span>
                <span class="s-value gold">{{ formatNum(worker.salary) }} G</span>
             </div>

             <div class="card-actions">
                <button class="btn-action fire" @click="store.fireWorker(worker.id)">DEMITIR</button>
             </div>
          </div>
        </div>
        
        <div v-if="filteredWorkers.length === 0" class="empty-filter-msg">
          NENHUM HABITANTE ENCONTRADO COM ESTA PROFISSÃO.
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
             <span class="ab-val">{{ store.currentAdmin ? store.currentAdmin.name : 'SEM ADMIN' }}</span>
          </div>
          <div class="ab-stat">
             <span class="ab-lbl">EFICIÊNCIA:</span>
             <span class="ab-val blue">+{{ store.currentAdmin ? store.currentAdmin.efficiency : 0 }}%</span>
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
                <div class="vis-fill" :style="{ width: (rate.real * 3) + '%' }" :class="rate.isBuffed ? 'fill-buff' : 'fill-nerf'"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="tc-footer">
          * A soma total das probabilidades permanece 100%. A eficiência do Administrador altera a distribuição.
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&display=swap');

/* =========================================
   1. ESTRUTURA E CORES
   ========================================= */
.recruit-view {
  font-family: 'Chakra Petch', sans-serif;
  color: #e2e8f0;
  display: flex; flex-direction: column; gap: 20px;
  width: 100%;
}

/* Cores de Rank */
.tier-gray   { --rk-c: #94a3b8; --rk-bg: #1e293b; background: #94a3b8; color: #000; }
.tier-green  { --rk-c: #10b981; --rk-bg: #064e3b; background: #10b981; color: #000; }
.tier-blue   { --rk-c: #00f0ff; --rk-bg: #1e3a8a; background: #38bdf8; color: #000; }
.tier-purple { --rk-c: #d946ef; --rk-bg: #581c87; background: #c084fc; color: #000; }
.tier-gold   { --rk-c: #ffd700; --rk-bg: #713f12; background: #facc15; color: #000; }
.tier-red    { --rk-c: #ff003c; --rk-bg: #7f1d1d; background: #f43f5e; color: #fff; }

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

.help-btn {
  background: transparent; border: 1px solid #475569; color: #94a3b8;
  width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-weight: bold;
}
.help-btn:hover { border-color: #38bdf8; color: #38bdf8; }

/* =========================================
   3. ADMIN PANEL (PONTILHADO)
   ========================================= */
.admin-panel { display: flex; flex-direction: column; gap: 8px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 0 5px; border-bottom: 1px solid #334155; padding-bottom: 5px; }
.ph-title { font-size: 11px; color: #94a3b8; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }

.header-action-btn {
  background: #0f172a; border: 1px solid #334155; color: #94a3b8;
  padding: 4px 12px; font-size: 10px; cursor: pointer; text-transform: uppercase;
  font-weight: 700; transition: 0.2s; border-radius: 4px;
}
.header-action-btn:hover { border-color: #ef4444; color: #ef4444; }

.admin-card {
  background-color: #1e293b;
  /* GRID PONTILHADO RESTAURADO */
  background-image: radial-gradient(#64748b 1.5px, transparent 1.5px);
  background-size: 12px 12px;
  
  border: 1px solid #475569;
  padding: 15px;
  display: flex; gap: 20px; align-items: center;
  position: relative;
  box-shadow: inset 0 0 50px rgba(0,0,0,0.5); 
}
.admin-card::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(30,41,59,0.95) 20%, rgba(30,41,59,0.6) 100%);
  pointer-events: none;
}
/* INICIO CSS -> SEM ADMINISTRADOR */
.admin-card.empty-slot {
  background: #0f172a; /* Fundo mais escuro que o painel */
  border: 1px solid #475569;
  justify-content: flex-start;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

/* Efeito de brilho passando (opcional) */
.admin-card.empty-slot::before {
  content: '';
  position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  animation: shine 3s infinite;
}

.slot-frame {
  width: 70px;
  height: 70px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 1;
}

.slot-icon {
  width: 32px;
  height: 32px;
  opacity: 0.3;
  filter: grayscale(1) brightness(2); /* Deixa o ícone esbranquiçado */
}

.slot-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 1;
}

.s-title {
  color: #fff; /* Branco puro */
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  border-bottom: 1px solid #334155;
  padding-bottom: 2px;
  width: fit-content;
}

.s-desc {
  color: #cbd5e1; /* Cinza bem claro */
  font-size: 11px;
}
/* FIM CSS -> SEM ADMINISTRADOR */

.hud-left, .hud-right { position: relative; z-index: 2; }

.h-frame {
  width: 70px; height: 70px;
  background: #000;
  border: 2px solid var(--rk-c, #64748b);
  border-radius: 8px;
  padding: 2px;
  box-shadow: 0 0 15px rgba(0,0,0,0.5);
}
.h-frame img { width: 100%; height: 100%; object-fit: cover; border-radius: 5px; }

.h-tier-label {
  background: var(--rk-c); color: #0f172a;
  font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 4px;
  margin-top: -10px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);
  width: fit-content; margin-left: auto; margin-right: auto; position: relative;
}

.hud-right { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.h-title-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.h-name { font-size: 18px; color: #fff; margin: 0; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
.admin-race-tag { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700; }
.h-metrics { display: flex; gap: 25px; }
.metric { display: flex; flex-direction: column; border-left: 2px solid rgba(255,255,255,0.1); padding-left: 10px; }
.m-val { font-size: 15px; font-weight: 700; color: #fff; }
.m-lbl { font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }

/* =========================================
   4. BOTÕES DE CONTRATAR (TÁTICO)
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

.rp-compact-header {
  display: flex; justify-content: space-between; align-items: center;
  background: #0f172a; padding: 8px 12px; border: 1px solid #334155; border-radius: 4px;
}
.rp-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
.rp-price { font-size: 10px; color: #64748b; font-weight: 700; }
.val-gold { color: #facc15; font-size: 12px; margin-left: 5px; }

.slots-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }

.slot-btn {
  width: 125px; height: 50px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  background: #0f172a; border: 1px solid #334155; cursor: pointer; position: relative;
  transition: all 0.2s ease; padding: 4px;
}
.slot-btn:hover { background: #1e293b; border-color: #38bdf8; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(56, 189, 248, 0.15); }
.slot-icon-frame { width: 22px; height: 22px; opacity: 0.8; transition: 0.2s; }
.s-icon { width: 100%; height: 100%; object-fit: contain; }
.slot-name { font-size: 10px; line-height: 1; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
.slot-btn:hover .slot-name { color: #fff; }

.corner-mark { position: absolute; width: 4px; height: 4px; border-color: #475569; transition: 0.2s; }
.corner-mark.top-right { top: 2px; right: 2px; border-top: 1px solid; border-right: 1px solid; border-color: #64748b; }
.corner-mark.bottom-left { bottom: 2px; left: 2px; border-bottom: 1px solid; border-left: 1px solid; border-color: #64748b; }
.slot-btn:hover .corner-mark { border-color: #38bdf8; }

/* =========================================
   5. LISTA DE FUNCIONÁRIOS
   ========================================= */
.candidates-list { margin-top: 25px; }
.list-header { 
  display: flex; justify-content: space-between; align-items: center; 
  margin-bottom: 15px; border-bottom: 1px solid #334155; padding-bottom: 8px;
}
.lh-title { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-left: 8px; }

.tactical-select {
  background-color: #0f172a; color: #94a3b8; border: 1px solid #334155;
  padding: 4px 8px; font-family: 'Chakra Petch', sans-serif; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px; border-radius: 4px; outline: none; cursor: pointer;
}

.grid-workers { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; }
.empty-filter-msg { grid-column: 1 / -1; text-align: center; padding: 40px; border: 1px dashed #334155; color: #64748b; font-size: 12px; text-transform: uppercase; }

.worker-card {
  background: #1e293b; border: 1px solid #475569; border-radius: 8px; overflow: hidden;
  transition: 0.3s; position: relative; display: flex; flex-direction: column;
}
.worker-card:hover { transform: translateY(-5px); border-color: var(--rk-c); box-shadow: 0 5px 20px rgba(0,0,0,0.4); }

.card-visual { height: 140px; position: relative; background: #000; }
.card-visual img { width: 100%; height: 100%; object-fit: cover; transition: 0.3s; }
.worker-card:hover .card-visual img { transform: scale(1.05); opacity: 0.8; }

.card-rank-badge {
  position: absolute; top: 8px; right: 8px; z-index: 2;
  background: var(--rk-c); color: #000; font-size: 10px; font-weight: 900;
  padding: 2px 6px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.5);
}
.card-gradient-overlay {
  position: absolute; bottom: 0; left: 0; width: 100%; height: 60%;
  background: linear-gradient(to top, #1e293b 10%, transparent); pointer-events: none;
}
.card-floating-name {
  position: absolute; bottom: 10px; left: 10px; right: 10px; z-index: 2; display: flex; flex-direction: column;
}
.c-name { font-size: 14px; font-weight: 700; color: #fff; text-shadow: 0 2px 4px #000; }
.c-job { font-size: 10px; color: #38bdf8; text-transform: uppercase; font-weight: 700; text-shadow: 0 2px 4px #000; }

.card-body { padding: 10px 12px; background: #1e293b; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.stat-line { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; }
.s-label { font-size: 9px; color: #94a3b8; font-weight: 700; }
.s-value { font-size: 11px; color: #e2e8f0; font-weight: 600; }

/* Ações (Botões Novos com Estilo Tático) */
.card-actions { display: flex; gap: 5px; margin-top: auto; padding-top: 10px; }
.btn-action { flex: 1; border: none; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 700; padding: 6px; font-family: 'Chakra Petch', sans-serif; transition: 0.2s; }

.btn-action.admin-toggle { background: #0f172a; border: 1px solid #38bdf8; color: #38bdf8; }
.btn-action.admin-toggle:hover { background: #38bdf8; color: #000; }
.btn-action.admin-toggle.is-active { background: #facc15; border-color: #facc15; color: #000; }

.btn-action.fire { background: #0f172a; border: 1px solid #ef4444; color: #ef4444; max-width: 60px; }
.btn-action.fire:hover { background: #ef4444; color: #fff; }

/* =========================================
   6. MODAL CARTA (TCG)
   ========================================= */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.9);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.new-hire-card {
  width: 320px; background: #1e293b; border: 2px solid var(--rk-c); border-radius: 12px;
  box-shadow: 0 0 50px rgba(0,0,0,0.8); display: flex; flex-direction: column; overflow: hidden;
  animation: cardFlip 0.4s ease-out;
}
@keyframes cardFlip { from { transform: rotateY(90deg); opacity: 0; } to { transform: rotateY(0); opacity: 1; } }

.tcg-header { background: var(--rk-c); padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; }
.p-rank { font-weight: 900; color: #000; font-size: 16px; letter-spacing: 1px; }
.p-close { background: none; border: none; color: #000; font-weight: bold; font-size: 16px; cursor: pointer; }

.tcg-visual-container { height: 180px; width: 100%; position: relative; background: #000; }
.tcg-img { width: 100%; height: 100%; object-fit: cover; }
.tcg-shine { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%); pointer-events: none; }

.tcg-info { padding: 15px; text-align: center; background: #162032; border-bottom: 1px solid #334155; }
.tcg-name { font-size: 20px; color: #fff; margin: 0; font-weight: 700; }
.tcg-job { font-size: 11px; color: #38bdf8; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; }

.tcg-stats-box { padding: 15px; display: flex; flex-direction: column; gap: 8px; }
.ts-row { display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 8px 12px; border-radius: 4px; border: 1px solid #334155; }
.highlight-row { border-color: rgba(255, 215, 0, 0.3); }

.ts-row .lbl { font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; }
.ts-row .val { font-size: 12px; font-weight: 700; color: #fff; }

.game-btn.portal-btn {
  width: 100%; padding: 15px; border: none; background: var(--rk-c); color: #000;
  font-weight: 800; font-size: 14px; text-transform: uppercase; cursor: pointer; transition: 0.2s;
}
.game-btn.portal-btn:hover { filter: brightness(1.1); }

/* =========================================
   7. MODAL PROBABILIDADE (TACTICAL CARD)
   ========================================= */
.tactical-card {
  width: 600px; background: #1e293b; border: 1px solid #334155;
  box-shadow: 0 0 40px rgba(0,0,0,0.8); border-radius: 6px;
  display: flex; flex-direction: column; overflow: hidden; font-family: 'Chakra Petch', sans-serif;
}
.tc-header { background: #0f172a; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
.tc-title { font-size: 12px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; }
.tc-close { background: none; border: none; color: #64748b; font-weight: bold; cursor: pointer; }

.tc-admin-bar { background: #1e293b; padding: 10px 15px; display: flex; gap: 20px; border-bottom: 1px solid #334155; }
.ab-info, .ab-stat { display: flex; gap: 5px; align-items: center; font-size: 11px; }
.ab-lbl { color: #64748b; font-weight: 700; }
.ab-val { color: #e2e8f0; font-weight: 700; }
.ab-val.blue { color: #38bdf8; }

.tc-grid { display: flex; flex-direction: column; background: #0f172a; }
.grid-row { display: grid; grid-template-columns: 50px 70px 70px 70px 1fr; align-items: center; padding: 6px 15px; border-bottom: 1px solid #1e293b; }
.header-row { background: rgba(30, 41, 59, 0.5); font-size: 9px; color: #64748b; font-weight: 700; letter-spacing: 1px; }
.data-row { transition: 0.2s; font-size: 11px; font-family: monospace; }
.data-row:hover { background: #1e293b; }

.col-rank { display: flex; align-items: center; }
.col-base { color: #64748b; text-align: right; padding-right: 15px; }
.col-mod { text-align: right; padding-right: 15px; font-weight: 700; }
.col-final { text-align: right; padding-right: 15px; color: #fff; font-weight: 700; font-size: 12px; }
.col-vis { padding-left: 10px; }

.tc-badge {
  width: 24px; height: 20px; font-size: 10px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  border-radius: 3px; font-family: sans-serif;
}

.text-buff { color: #38bdf8; }
.text-nerf { color: #ef4444; }
.text-neut { color: #475569; }

.vis-track { width: 100%; height: 6px; background: #020617; border-radius: 3px; position: relative; border: 1px solid #334155; }
.vis-fill { height: 100%; position: absolute; top: 0; left: 0; transition: width 0.3s; }
.fill-buff { background: #38bdf8; box-shadow: 0 0 5px rgba(56, 189, 248, 0.5); }
.fill-nerf { background: #ef4444; opacity: 0.6; }
.vis-marker { position: absolute; top: -1px; bottom: -1px; width: 1px; background: #fff; opacity: 0.3; z-index: 5; }

.tc-footer { padding: 10px 15px; background: #0f172a; color: #475569; font-size: 9px; border-top: 1px solid #334155; text-align: center; }

@media (max-width: 600px) {
  .slot-btn { width: 100px; height: 45px; } 
  .slot-name { font-size: 8px; }
  .grid-workers { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  .building-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .bh-right { width: 100%; }
}
/* Ajuste do Slot Vazio para caber o botão */
.slot-content-wrapper { display: flex; justify-content: space-between; align-items: center; flex: 1; z-index: 2; }
.btn-designar { 
  background: #38bdf8; color: #0f172a; border: none; font-weight: 800; 
  padding: 8px 16px; border-radius: 4px; cursor: pointer; 
  font-family: 'Chakra Petch', sans-serif; transition: 0.2s; 
}
.btn-designar:hover { filter: brightness(1.1); transform: translateY(-1px); }

/* Estilos do Modal de Seleção */
.select-modal { width: 400px; }
.select-list { max-height: 400px; overflow-y: auto; background: #0f172a; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.empty-list { text-align: center; color: #64748b; font-size: 11px; padding: 30px; border: 1px dashed #334155; }
.select-item { display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 10px; border: 1px solid #334155; border-radius: 4px; cursor: pointer; transition: 0.2s; }
.select-item:hover { border-color: #38bdf8; background: #252f42; }
.si-left { display: flex; gap: 10px; align-items: center; }
.si-avatar { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; border: 1px solid #475569; }
.si-info { display: flex; flex-direction: column; }
.si-name { color: #fff; font-weight: 700; font-size: 12px; }
.si-rank { font-size: 9px; font-weight: 800; }
.si-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
.si-eff { font-size: 10px; color: #38bdf8; }
.btn-pick { background: #38bdf8; color: #000; border: none; font-size: 9px; font-weight: 800; padding: 4px 8px; border-radius: 2px; cursor: pointer; }

/* Cores de texto úteis */
.text-gold { color: #facc15; }
.text-purple { color: #c084fc; }
.text-blue { color: #38bdf8; }
.text-green { color: #10b981; }
.text-gray { color: #94a3b8; }
.text-red { color: #f43f5e; }
.teal { color: #2dd4bf; text-shadow: 0 0 2px #000; font-weight: 700; }
</style>