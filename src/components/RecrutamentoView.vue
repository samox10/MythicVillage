<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useRecruitmentStore } from '../stores/recruitmentStore'
import { useMiningStore } from '../stores/miningStore'
import { PROFISSOES, TIER_CONFIG, TIER_ORDER } from '../data/balancing'
import BuildingLayout from './BuildingLayout.vue'
import WorkerSelectModal from './WorkerSelectModal.vue'

const store = useGameStore()
const recruitmentStore = useRecruitmentStore()
const miningStore = useMiningStore()

// === ESTADO VISUAL ===
const filterJob = ref('')
const showModal = ref(false)
const showProbModal = ref(false)
const showAdminSelect = ref(false)
const showErrorModal = ref(false)
const showFireModal = ref(false)
const workerToFire = ref(null)

// === ESPELHAMENTO DO STORE ===
const newHire = computed(() => recruitmentStore.newHire)
const dropRateTable = computed(() => recruitmentStore.dropRateTable)
const errorMessage = computed({
  get: () => recruitmentStore.errorMessage,
  set: (val) => recruitmentStore.errorMessage = val
})

// === FILTROS ===
const filteredWorkers = computed(() => {
  let lista = store.workers
  if (filterJob.value) {
    lista = lista.filter(w => w.jobKey === filterJob.value)
  }
  return [...lista].sort((a, b) => {
    const pesoA = TIER_ORDER.indexOf(a.tier)
    const pesoB = TIER_ORDER.indexOf(b.tier)
    return pesoB - pesoA
  })
})

const availableAdmins = computed(() => {
  // 1. Filtra quem é administrador e não está no cargo
  const admins = store.workers.filter(w => w.jobKey === 'administrador' && w.id !== store.adminId)

  // 2. Organiza do maior Tier para o menor
  return admins.sort((a, b) => {
    const pesoA = TIER_ORDER.indexOf(a.tier)
    const pesoB = TIER_ORDER.indexOf(b.tier)
    return pesoB - pesoA
  })
})

// === AÇÕES ===
const tryHire = (jobKey) => {
  if (store.dailyHires >= 10) {
    errorMessage.value = "Limite diário atingido!"
    showErrorModal.value = true
    return
  }
  const success = recruitmentStore.recruitWorker(jobKey)
  if (success) showModal.value = true
  else showErrorModal.value = true
}

const closeModal = () => {
  showModal.value = false
  recruitmentStore.clearNewHire()
}

const requestFire = (worker) => {
  // SISTEMA UNIFICADO DE PROTEÇÃO
  // Verifica se o funcionário tem QUALQUER atribuição (Mina, Admin, etc.)
  if (worker.assignment) {
    recruitmentStore.errorMessage = `Este funcionário está ocupado como ${worker.assignment}. Remova-o da função antes de demitir.`
    showErrorModal.value = true
    return
  }

  // Se não tem atribuição (assignment é null), libera a demissão
  workerToFire.value = worker
  showFireModal.value = true
}

const confirmFire = () => {
  if (workerToFire.value) {
    const result = store.fireWorker(workerToFire.value.id)
    if (result.success) {
      showFireModal.value = false
      workerToFire.value = null
    } else {
      showFireModal.value = false
      recruitmentStore.errorMessage = result.msg
      showErrorModal.value = true
    }
  }
}

const selectAdmin = (id) => {
  store.setAdmin(id)
  showAdminSelect.value = false
}

const tryPaySalary = (worker) => {
  const result = store.manualPay(worker.id)
  if (!result.success) {
    recruitmentStore.errorMessage = result.msg
    showErrorModal.value = true
  }
}

// Helpers
const getTierClass = (tier) => `tier-${tier}`
const formatNum = (n) => new Intl.NumberFormat('pt-BR').format(n)
const getStats = (worker) => store.getWorkerStats(worker)
const getDebtCost = (worker) => {
  const days = worker.strikeDays > 0 ? Math.min(worker.strikeDays, 5) : 1
  return worker.salary * days
}
</script>

<template>
  <BuildingLayout
    title="Centro de Recrutamento"
    :level="store.recruitmentLevel"
    icon="🤝"
    :leader="store.currentAdmin"
    leader-label="Administrador"
    leader-stat-label="EFICIÊNCIA"
    empty-title="SEM COMANDO"
    :empty-desc="'Setor operando sem supervisão.\nBônus de eficiência inativos.'"
    @open-help="showProbModal = true"
    @remove-leader="store.setAdmin(store.currentAdmin.id)"
    @assign-leader="showAdminSelect = true"
  >
  
    <div class="recruit-panel tactical-style">
      <div class="rp-compact-header">
        <div class="rp-label">
          <span class="rp-ico">💠</span>
          <span>CONTRATAR</span>
        </div>
        
        <div class="rp-info-group">
           <div class="rp-limit" :class="{ 'text-red': store.dailyHires >= 10 }">
              HOJE: {{ store.dailyHires }}/10
           </div>
           <div class="rp-sep">|</div>
           <div class="rp-price">
             CUSTO: <span class="val-gold">500 G</span>
           </div>
        </div>
      </div>

      <div class="slots-container">
        <button 
          v-for="(labels, key) in PROFISSOES" 
          :key="key"
          class="slot-btn"
          @click="tryHire(key)"
          :title="labels.m"
          :disabled="store.dailyHires >= 10" 
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

    <div class="list-header">
      <div class="lh-left">
        <div class="lh-icon">💠</div>
        <span class="lh-title desktop-lbl">FUNCIONÁRIOS ({{ store.workers.length }})</span>
        <span class="lh-title mobile-lbl">FUNC. ({{ store.workers.length }})</span>
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
        <div v-for="worker in filteredWorkers" :key="worker.id" class="worker-card" :class="[getTierClass(worker.tier), { 'is-striking': worker.strikeDays > 0 }]">
           <div class="card-visual">
             <img :src="worker.avatarUrl">
             <div v-if="worker.strikeDays > 0" class="strike-badge">GREVE ({{ worker.strikeDays }}D)</div>
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
                <div class="stat-tooltip-container">
                    <span class="s-value" :class="worker.strikeDays > 0 ? 'strike-text' : 'blue'">
                      {{ getStats(worker).finalEff }}%
                    </span>
                    <div class="stat-tooltip-box">
                       <div v-if="worker.strikeDays > 0">
                         <span class="strike-text">Em Greve (Dia {{ worker.strikeDays }})</span>
                         <span class="strike-detail">PENALIDADE: -{{ getStats(worker).loss }}%</span>
                       </div>
                       <div v-else>
                         STATUS: NORMAL<br>
                         <span v-if="worker.race === 'automato'" class="text-blue">BÔNUS RACIAL ATIVO</span>
                       </div>
                    </div>
                </div>
              </div>
             <div class="stat-line">
                <span class="s-label">SALÁRIO</span>
                <span class="s-value gold">{{ formatNum(worker.salary) }} G</span>
             </div>

             <div class="card-actions">
              <button v-if="worker.strikeDays > 0" class="btn-action admin-toggle" @click="tryPaySalary(worker)">
                  PAGAR ({{ formatNum(getDebtCost(worker)) }} G)
              </button>
              <button v-else class="btn-action fire" @click="requestFire(worker)">
                  DEMITIR
              </button>
            </div>
          </div>
        </div>
        <div v-if="filteredWorkers.length === 0" class="empty-filter-msg">
          NENHUM HABITANTE ENCONTRADO COM ESTA PROFISSÃO.
        </div>
    </div>

    <div class="modal-overlay" v-if="showModal && newHire" @click.self="closeModal">
      <div class="bio-card" :class="getTierClass(newHire.tier)">
         <div class="bio-data-panel">
            <div class="bio-header">
               <span class="bio-rank">TIER {{ newHire.tier }}</span>
               <h2 class="bio-name">{{ newHire.name }}</h2>
               <span class="bio-job">{{ newHire.jobTitle }}</span>
            </div>
            <div class="bio-grid">
               <div class="bg-item"><span class="l">RAÇA</span><span class="v capitalize">{{ newHire.race }}</span></div>
               <div class="bg-item"><span class="l">HUMOR</span><span class="v teal">{{ newHire.happiness || 100 }}%</span></div>
               <div class="bg-item"><span class="l">EFICIÊNCIA</span><span class="v highlight">{{ newHire.efficiency }}%</span></div>
               <div class="bg-item"><span class="l">SALÁRIO</span><span class="v gold">{{ formatNum(newHire.salary) }} G</span></div>
            </div>
            <button class="bio-btn" @click="closeModal">:: REGISTRAR NO SISTEMA ::</button>
         </div>
         <div class="bio-visual-panel">
            <img :src="newHire.avatarUrl" class="bio-img">
            <div class="bio-overlay"></div>
            <div class="bio-tech-lines"></div>
         </div>
      </div>
    </div>
    <WorkerSelectModal 
      v-if="showAdminSelect"
      title="SELECIONAR ADMINISTRADOR"
      :workers="availableAdmins"
      emptyMessage1="NENHUM ADMINISTRADOR DISPONÍVEL NA VILA."
      emptyMessage2="Contrate um funcionário da classe 'Administrador' primeiro."
      @close="showAdminSelect = false"
      @select="selectAdmin"
    />
    <div class="modal-overlay" v-if="showProbModal" @click.self="showProbModal = false">
      <div class="tactical-card">
        <div class="tc-header"><span class="tc-title">LOG DE PROBABILIDADE DO SISTEMA</span><button class="tc-close" @click="showProbModal = false">✕</button></div>
        <div class="tc-admin-bar">
          <div class="ab-info"><span class="ab-lbl">FONTE:</span><span class="ab-val">{{ store.currentAdmin ? store.currentAdmin.name : 'SEM ADMIN' }}</span></div>
          <div class="ab-stat"><span class="ab-lbl">EFICIÊNCIA:</span><span class="ab-val blue">+{{ store.currentAdmin ? store.currentAdmin.efficiency : 0 }}%</span></div>
        </div>
        <div class="tc-grid">
          <div class="grid-row header-row">
            <div class="col-rank">RANK</div><div class="col-base">BASE</div><div class="col-mod">MOD</div><div class="col-final">FINAL</div><div class="col-vis">VISUALIZAÇÃO</div>
          </div>
          <div v-for="rate in dropRateTable" :key="rate.tier" class="grid-row data-row">
            <div class="col-rank"><div class="tc-badge" :class="`tier-${rate.color}`">{{ rate.tier }}</div></div>
            <div class="col-base muted">{{ rate.base }}%</div>
            <div class="col-mod" :class="{ 'text-buff': rate.isBuffed, 'text-nerf': rate.isNerfed, 'text-neut': !rate.isBuffed && !rate.isNerfed }">{{ rate.diffSign }}{{ rate.diff }}%</div>
            <div class="col-final strong">{{ rate.real }}%</div>
            <div class="col-vis">
              <div class="vis-track"><div class="vis-marker" :style="{ left: rate.base + '%' }"></div><div class="vis-fill" :style="{ width: rate.real + '%' }" :class="rate.isBuffed ? 'fill-buff' : 'fill-nerf'"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showFireModal && workerToFire" @click.self="showFireModal = false">
      <div class="bio-card danger-mode">
         <div class="bio-data-panel">
            <div class="bio-header"><h2 class="bio-name">{{ workerToFire.name }}</h2><span class="bio-job">{{ workerToFire.jobTitle }}</span></div>
            <div class="warning-box"><span class="warn-icon">⚠️</span><p>Ação irreversível. O funcionário será removido permanentemente da equipe.</p></div>
            <div class="bio-grid">
               <div class="bg-item"><span class="l">TIER</span><span class="v">{{ workerToFire.tier }}</span></div>
               <div class="bg-item"><span class="l">EFICIÊNCIA</span><span class="v">{{ workerToFire.efficiency }}%</span></div>
            </div>
            <div class="danger-actions">
               <button class="t-btn btn-cancel" @click="showFireModal = false">CANCELAR</button>
               <button class="t-btn btn-confirm" @click="confirmFire">CONFIRMAR</button>
            </div>
         </div>
         <div class="bio-visual-panel"><img :src="workerToFire.avatarUrl" class="bio-img grayscale-effect"><div class="bio-overlay red-overlay"></div></div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showErrorModal" @click.self="showErrorModal = false">
      <div class="tactical-card error-card">
        <div class="tc-header error-header"><span class="tc-title">⛔ AVISO</span></div>
        <div class="error-body"><p>{{ errorMessage }}</p></div>
        <div class="error-footer"><button class="t-btn btn-ok" @click="showErrorModal = false">ENTENDIDO</button></div>
      </div>
    </div>

  </BuildingLayout>
</template>

<style scoped>
/* AQUI FICAM APENAS ESTILOS EXCLUSIVOS DO RECRUTAMENTO QUE NÃO FORAM PARA O LAYOUT */
/* Como Botões de Slot, Lista de Funcionários, etc. */

.recruit-panel.tactical-style {
  background: #1e293b; border: 1px solid #334155; border-left: 4px solid #38bdf8;
  padding: 15px; display: flex; flex-direction: column; gap: 15px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2); margin-top: 10px;
}
/* Ajuste do Header para caber o contador */
.rp-info-group {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  color: #64748b;
  font-weight: 700;
}

.rp-sep { opacity: 0.3; }

.rp-limit {
  color: #38bdf8; /* Azul por padrão */
}

/* Quando estourar o limite fica vermelho (definido no HTML com text-red) */
.text-red { color: #ef4444; }

/* Visual do botão desabilitado */
.slot-btn:disabled {
  opacity: 0.5;
  filter: grayscale(1);
  cursor: not-allowed;
  border-color: #334155;
}
.rp-compact-header {
  display: flex; justify-content: space-between; align-items: center;
  background: #0f172a; padding: 8px 12px; border: 1px solid #334155; border-radius: 4px;
}
.rp-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
.rp-price { font-size: 10px; color: #64748b; font-weight: 700; }
.val-gold { color: #facc15; margin-left: 5px;}
.slots-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.slot-btn {
  width: 125px; height: 50px; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 3px; background: #0f172a; border: 1px solid #334155;
  cursor: pointer; position: relative; transition: all 0.2s ease; padding: 4px;
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

/* Lista de Funcionários */
.list-header { 
  margin-top: 18px;
  display: flex; justify-content: space-between; align-items: center; 
  margin-bottom: 15px; border-bottom: 1px solid #334155; padding-bottom: 8px;
}
.lh-left { display: flex; align-items: center; gap: 6px; }
.lh-icon { font-size: 16px; line-height: 1; }
.lh-title { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-left: 8px; }

/* === AJUSTES DE SELECT E TEXTO (DA ÚLTIMA CORREÇÃO) === */
.mobile-lbl { display: none; }
.desktop-lbl { display: inline; }
.tactical-select {
  background-color: #0f172a; color: #94a3b8; border: 1px solid #334155;
  padding: 0 8px; height: 24px; font-size: 10px; 
  font-family: 'Chakra Petch', sans-serif; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px; border-radius: 4px; outline: none; cursor: pointer;
}
.tactical-select option { background-color: #1e293b; color: #e2e8f0; padding: 10px; }

.grid-workers { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; }
.empty-filter-msg { grid-column: 1 / -1; text-align: center; padding: 40px; border: 1px dashed #334155; color: #64748b; font-size: 12px; text-transform: uppercase; }

.worker-card {
  background: #1e293b; border: 1px solid #475569; border-radius: 8px; 
  transition: 0.3s; position: relative; display: flex; flex-direction: column; z-index: 1;
}
.worker-card:hover { 
  transform: translateY(-5px); border-color: #38bdf8; box-shadow: 0 10px 20px rgba(0,0,0,0.3); z-index: 20; 
}
.card-visual { 
  height: 140px; position: relative; background: #000;
  border-top-left-radius: 8px; border-top-right-radius: 8px; overflow: hidden; 
}
.card-visual img { width: 100%; height: 100%; object-fit: cover; object-position: top; transition: 0.3s; }
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

.card-actions { display: flex; gap: 5px; margin-top: auto; padding-top: 10px; }
.btn-action { flex: 1; border: none; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 700; padding: 6px; font-family: 'Chakra Petch', sans-serif; transition: 0.2s; }
.btn-action.admin-toggle { background: #0f172a; border: 1px solid #38bdf8; color: #38bdf8; }
.btn-action.admin-toggle:hover { background: #38bdf8; color: #000; }
.btn-action.admin-toggle.is-active { background: #facc15; border-color: #facc15; color: #000; }
.btn-action.fire { background: #0f172a; border: 1px solid #ef4444; color: #ef4444; max-width: 60px; }
.btn-action.fire:hover { background: #ef4444; color: #fff; }

/* Tabela de Probabilidades (Estilo Local) */
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
.tc-badge { width: 24px; height: 20px; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; border-radius: 3px; font-family: sans-serif; }
.vis-track { width: 100%; height: 6px; background: #020617; border-radius: 3px; position: relative; border: 1px solid #334155; }
.vis-fill { height: 100%; position: absolute; top: 0; left: 0; transition: width 0.3s; }
.fill-buff { background: #38bdf8; box-shadow: 0 0 5px rgba(56, 189, 248, 0.5); }
.fill-nerf { background: #ef4444; opacity: 0.6; }
.vis-marker { position: absolute; top: -1px; bottom: -1px; width: 1px; background: #fff; opacity: 0.3; z-index: 5; }
.tc-footer { padding: 10px 15px; background: #0f172a; color: #475569; font-size: 9px; border-top: 1px solid #334155; text-align: center; }

/* Tooltip & Greve */
.stat-tooltip-container { position: relative; cursor: help; border-bottom: 1px dashed #475569; }
.stat-tooltip-box { visibility: hidden; width: 180px; background-color: #0f172a; color: #fff; text-align: center; border-radius: 6px; padding: 10px; position: absolute; z-index: 100; bottom: 125%; left: 50%; margin-left: -90px; border: 1px solid #ef4444; box-shadow: 0 4px 15px rgba(0,0,0,0.5); opacity: 0; transition: opacity 0.3s; font-size: 10px; pointer-events: none; }
.stat-tooltip-box::after { content: ""; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #ef4444 transparent transparent transparent; }
.stat-tooltip-container:hover .stat-tooltip-box { visibility: visible; opacity: 1; }
.strike-text { color: #ef4444; font-weight: bold; }
.strike-detail { display: block; margin-top: 4px; font-size: 9px; color: #fca5a5; }
.worker-card.is-striking { border-color: #ef4444; animation: pulse-red 2s infinite; }
@keyframes pulse-red {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
.strike-badge { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-15deg); background: #ef4444; color: #fff; font-weight: 900; font-size: 14px; padding: 5px 15px; border: 2px solid #fff; box-shadow: 0 5px 15px rgba(0,0,0,0.5); z-index: 10; text-transform: uppercase; letter-spacing: 2px; }

/* Mobile Responsividade */
@media (max-width: 600px) {
  .slot-btn { width: 100px; height: 45px; } 
  .slot-name { font-size: 8px; }
  .grid-workers { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  .grid-row.header-row { display: none; }
  .grid-row.data-row { display: flex; flex-wrap: wrap; justify-content: space-around; align-items: flex-end; padding: 12px 5px; gap: 10px; border-bottom: 2px solid #0f172a; }
  .col-rank { width: 100%; justify-content: center; margin-bottom: 5px; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 4px; }
  .col-base, .col-mod, .col-final { width: auto; display: flex; flex-direction: column; align-items: center; font-size: 13px; }
  .col-base::before { content: "BASE"; font-size: 8px; color: #64748b; font-weight: 700; margin-bottom: 2px; }
  .col-mod::before { content: "MOD"; font-size: 8px; color: #64748b; font-weight: 700; margin-bottom: 2px; }
  .col-final::before { content: "CHANCE FINAL"; font-size: 8px; color: #94a3b8; font-weight: 700; margin-bottom: 2px; }
  .col-vis { width: 100%; margin-top: 8px; order: 99; }
  .vis-track { height: 10px; }
}

@media (max-width: 400px) {
  /* 1. Troca os textos (Abreviação) */
  .desktop-lbl { display: none; }
  .mobile-lbl { display: inline; }

  /* 2. Ajuste do Select (Menor e mais compacto) */
  .tactical-select {
    height: 28px;        /* Altura reduzida */
    padding: 0 4px;      /* Menos espaço interno */
    font-size: 9px;      /* Fonte menor */
    width: 130px;        /* Largura fixa para não estourar */
    
    text-overflow: ellipsis; 
    white-space: nowrap;
    overflow: hidden;
  }
  
  /* Ajuste fino no ícone ao lado */
  .lh-icon { font-size: 14px; }
  .lh-title { font-size: 10px; letter-spacing: 0; margin-left: 4px; }
  
}

@media (max-width: 450px) {
  .slots-container { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; width: 100%; }
  .slot-btn { width: 100%; height: 45px; }
  .slot-name { font-size: 9px; }
}
/* === AJUSTES PARA TELAS < 500px (Celulares) === */
@media (max-width: 500px) {
  
  /* 1. HEADER DO RECRUTAMENTO (Versão Empilhada) */
  .rp-compact-header {
    flex-direction: column; /* Muda para Vertical */
    gap: 6px;               /* Espaço entre o Título e os Dados */
    padding: 8px;           /* Respiro interno */
    height: auto;           /* Deixa a altura crescer conforme necessário */
  }

  /* Título "CONTRATAR": Visível e Centralizado */
  .rp-label {
    width: 100%;
    justify-content: center;
    border-bottom: 1px solid rgba(255,255,255,0.05); /* Linha sutil separando */
    padding-bottom: 4px;
  }
  
  /* Grupo de Informações (Custo/Limite): Na linha de baixo */
  .rp-info-group {
    width: 100%;
    justify-content: center; /* Centraliza os dados */
    font-size: 9px;
    gap: 10px;
  }

  /* 2. BOTÕES DE PROFISSÃO (Slots) */
  /* Mantemos o grid de 2 colunas que funcionou bem */
  .slots-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    width: 100%;
  }

  .slot-btn {
    width: 100%;
    height: 45px;
  }
  
  .slot-name { 
    font-size: 9px; 
  }

  /* 3. ESTILOS DO "SLOT VAZIO" */
  .admin-card.empty-slot { 
    padding: 7px; gap: 7px; align-items: center; 
  }
  
  .slot-frame { width: 45px; height: 45px; }
  .plus-icon { font-size: 18px; }
  
  .slot-content-wrapper { 
    display: flex; flex-direction: row; 
    align-items: center; justify-content: space-between; 
    width: 100%; gap: 8px; 
  }
  
  .s-title { font-size: 10px; margin-bottom: 2px; }
  .s-desc { 
    font-size: 9px; 
    line-height: 1.1; 
    color: #64748b; 
    max-width: 150px; 
  }
}
</style>