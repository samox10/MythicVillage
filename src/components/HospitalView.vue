<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useHospitalStore } from '../stores/hospitalStore'
import BuildingLayout from './BuildingLayout.vue'
import WorkerSelectModal from './WorkerSelectModal.vue'
import { MEDICAMENTOS, TIER_ORDER } from '../data/balancing'

const store = useGameStore()
const hospitalStore = useHospitalStore()

const showMedicSelect = ref(false)
const showHelpModal = ref(false)

const hospitalLevel = computed(() => {
  const b = store.buildings.find(x => x.key === 'hospital')
  return b ? b.level : 0
})

const maxTierUnlocked = computed(() => {
  if (hospitalLevel.value === 0) return 0
  if (hospitalLevel.value <= 4) return 1
  return Math.min(hospitalLevel.value - 3, 4) 
})

const activeBeds = computed(() => {
  const count = Math.min(hospitalLevel.value, 4)
  return hospitalStore.beds.slice(0, count)
})

const availableMedics = computed(() => {
  return store.workers.filter(w =>
    w.jobKey === 'medico' && 
    (w.strikeDays || 0) === 0 && 
    !w.injury && 
    w.id !== hospitalStore.medicId
  ).sort((a, b) => TIER_ORDER.indexOf(b.tier) - TIER_ORDER.indexOf(a.tier))
})

const selectMedic = (id) => {
  hospitalStore.assignMedic(id)
  showMedicSelect.value = false
}

const getPatient = (id) => store.workers.find(w => w.id === id)

// Lógica de Nome: Sobrenome + Inicial do Nome (Ex: Silva J.)
const formatPatientName = (fullName) => {
  if (!fullName) return ''
  const parts = fullName.split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[parts.length - 1]} ${parts[0].charAt(0)}.`
}

const getLiquidHeight = (bed) => {
  if (!bed.patientId || bed.totalTime <= 0) return '0%'
  const pct = Math.max(0, 100 - ((bed.progress / bed.totalTime) * 100))
  return `${pct}%`
}

const liquidColors = {
  plasma: '#f43f5e', 
  soro_reg: '#10b981', 
  solucao: '#0ea5e9', 
  resina: '#e4e4e7', 
  derme: '#f97316', 
  neutralizador: '#8b5cf6', 
  estimulante: '#facc15', 
  soro_psi: '#f472b6' 
}

const testInjury = () => {
  const healthyWorkers = store.workers.filter(w => !w.injury && w.jobKey !== 'medico')
  if (healthyWorkers.length === 0) return
  const randomWorker = healthyWorkers[Math.floor(Math.random() * healthyWorkers.length)]
  const medKeys = Object.keys(MEDICAMENTOS)
  const randomMed = medKeys[Math.floor(Math.random() * medKeys.length)]
  const time = 20 + Math.floor(Math.random() * 20) 
  hospitalStore.admitPatient(randomWorker.id, randomMed, time, `Trauma de Campo`)
}

const addTestMed = (medKey, tierIndex) => {
  store.medicalInventory[medKey][tierIndex]++
  hospitalStore.processQueue() 
}

onMounted(() => {
  window.causarAcidente = testInjury
  window.addRemedio = addTestMed
})

onUnmounted(() => {
  delete window.causarAcidente
  delete window.addRemedio
})
</script>

<template>
  <BuildingLayout
    title="Complexo Médico Apex"
    :level="hospitalLevel"
    :maxLevel="7"
    icon="🏥"
    :leader="hospitalStore.currentMedic"
    leader-label="MÉDICO CHEFE"
    leader-stat-label="CURA"
    empty-title="SISTEMA OFFLINE"
    empty-desc="O hospital exige supervisão médica para operar os cilindros de estase."
    @open-help="showHelpModal = true"
    @remove-leader="hospitalStore.assignMedic(null)"
    @assign-leader="showMedicSelect = true"
  >
    
    <div v-if="hospitalLevel > 0" class="hospital-complex">
      
      <div class="apex-layout">
        
        <div class="apex-stage">
          <div v-for="bed in activeBeds" :key="bed.id" class="monoblock-pod" :class="{'is-offline': !bed.patientId}">
            
            <div class="pod-top-socket">
              <div class="visor-screen">
                <span v-if="bed.patientId" class="vs-name">
                  {{ formatPatientName(getPatient(bed.patientId)?.name) }}
                </span>
                <span v-else class="vs-empty">CÉLULA VAZIA</span>
              </div>
              <div class="top-vent"></div>
            </div>
            
            <div class="pod-center-frame">
              <div class="support-pillar left"></div>
              
              <div class="pod-cylinder">
                <template v-if="bed.patientId">
                  <div class="cyl-entity">
                    <img v-if="getPatient(bed.patientId)?.jobKey" 
                         :src="`/assets/ui/i_${getPatient(bed.patientId).jobKey}.png`" 
                         class="soul-icon"
                         :style="{ filter: `drop-shadow(0 0 15px ${liquidColors[bed.medicament]}) brightness(1.2)` }">
                  </div>
                  <div class="cyl-liquid" :style="{ height: getLiquidHeight(bed), background: `linear-gradient(to top, transparent, ${liquidColors[bed.medicament]}80)` }">
                    <div class="liquid-top" :style="{ background: liquidColors[bed.medicament], boxShadow: `0 0 15px ${liquidColors[bed.medicament]}` }"></div>
                    <div class="bubbles"></div>
                  </div>
                </template>
                <div class="cyl-glass-internal-shadow"></div>
                <div class="glass-reflection"></div>
              </div>
              
              <div class="support-pillar right"></div>
            </div>
            
            <div class="pod-bottom-socket">
              <div class="module-rim">
                <span class="rim-id">#0{{ bed.id }}</span>
                <div class="rim-led" :style="{ background: bed.patientId ? liquidColors[bed.medicament] : '#334155', boxShadow: bed.patientId ? `0 0 12px ${liquidColors[bed.medicament]}` : 'none' }"></div>
              </div>
              
              <div class="pod-pedestal">
                <div class="pedestal-screen">
                  <template v-if="bed.patientId">
                    <span class="ps-injury">{{ getPatient(bed.patientId)?.injury }}</span>
                    <div class="ps-med-box" :style="{ borderLeftColor: liquidColors[bed.medicament] }">
                      <span class="ps-tier">T{{ bed.tier }}</span>
                      <span class="ps-med-name">{{ MEDICAMENTOS[bed.medicament]?.nome }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <span class="ps-standby">SISTEMA EM IDLE</span>
                    <div class="standby-bar"></div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="apex-terminals">
          
          <div class="terminal">
            <div class="term-header">
              <span class="th-title">LOG DE TRIAGEM</span>
              <span class="th-badge">{{ hospitalStore.triageQueue.length }}</span>
            </div>
            <div class="term-body">
              <div v-if="hospitalStore.triageQueue.length === 0" class="empty-state">SEM PACIENTES AGUARDANDO</div>
              <div v-for="(p, idx) in hospitalStore.triageQueue" :key="idx" class="data-row">
                <div class="dr-main">
                  <span class="dr-name">{{ getPatient(p.workerId)?.name }}</span>
                  <span class="dr-reason">{{ p.reason }}</span>
                </div>
                <div class="status-crystal" :style="{ background: liquidColors[p.medicamentRequired], boxShadow: `0 0 10px ${liquidColors[p.medicamentRequired]}` }"></div>
              </div>
            </div>
          </div>

          <div class="terminal">
            <div class="term-header">
              <span class="th-title">DEPÓSITO DE COMPOSTOS</span>
              <div class="tier-heads"><span>T1</span><span>T2</span><span>T3</span><span>T4</span></div>
            </div>
            <div class="term-body">
              <div v-for="(data, key) in MEDICAMENTOS" :key="key" class="data-row clinical-row">
                <span class="muted-label">{{ data.nome }}</span>
                <div class="slot-grid">
                  <div v-for="t in 4" :key="t" class="c-slot" :class="{'has-stock': store.medicalInventory[key][t-1] > 0, 'is-locked': maxTierUnlocked < t}">
                    <template v-if="maxTierUnlocked >= t">
                      <span class="cs-qty">{{ store.medicalInventory[key][t-1] }}</span>
                      <button class="cs-add" @click="addTestMed(key, t-1)">+</button>
                    </template>
                    <span v-else class="cs-lock">×</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>

    <WorkerSelectModal v-if="showMedicSelect" :workers="availableMedics" @close="showMedicSelect = false" @select="selectMedic" />
  </BuildingLayout>
</template>

<style scoped>
.hospital-complex { display: flex; flex-direction: column; font-family: 'Chakra Petch', sans-serif; padding-bottom: 20px; }
.apex-layout { display: flex; flex-direction: column; gap: 40px; }
.apex-stage { display: flex; flex-wrap: wrap; justify-content: center; gap: 35px; padding: 10px 0; }

/* === O MONOBLOCO (Leito) === */
.monoblock-pod { display: flex; flex-direction: column; align-items: center; width: 135px; }
.monoblock-pod.is-offline { filter: grayscale(0.8) brightness(0.5); }

/* TOPO: Cabeçote Acetinado */
.pod-top-socket {
  width: 110px; height: 38px;
  background: linear-gradient(180deg, #334155 0%, #1e293b 100%);
  border: 1px solid #000; border-bottom: 4px solid #0f172a;
  border-radius: 8px 8px 0 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  position: relative; z-index: 4; box-shadow: 0 5px 15px rgba(0,0,0,0.5);
}
.visor-screen {
  width: 85%; height: 22px; background: #020617; 
  border: 1px solid #334155; border-radius: 3px; 
  display: flex; align-items: center; justify-content: center;
  box-shadow: inset 0 0 8px #000;
}
.vs-name { font-size: 10px; color: #f8fafc; font-weight: bold; letter-spacing: 0.5px; text-shadow: 0 0 5px rgba(255,255,255,0.3); }
.vs-empty { font-size: 8px; color: #475569; font-weight: 900; }
.top-vent { width: 30px; height: 2px; background: #0f172a; margin-top: 2px; border-radius: 1px; }

/* CORPO: Vidro com Chassi */
.pod-center-frame { display: flex; margin: -2px 0; position: relative; z-index: 2; }
.support-pillar {
  width: 8px; background: linear-gradient(to right, #1e293b, #334155, #0f172a);
  border-left: 1px solid #000; border-right: 1px solid #000; z-index: 3;
}
.pod-cylinder { 
  width: 90px; height: 140px; background: rgba(10, 15, 30, 0.4); 
  position: relative; overflow: hidden; border-left: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05);
}
.cyl-glass-internal-shadow {
  position: absolute; inset: 0; pointer-events: none; z-index: 4;
  box-shadow: inset 0 20px 20px -10px #000, inset 0 -20px 20px -10px #000;
}
.glass-reflection {
  position: absolute; inset: 0; pointer-events: none; z-index: 5;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 15%, transparent 30%, transparent 80%, rgba(255,255,255,0.05) 100%);
}

/* BASE: Pedestal Robusto */
.pod-bottom-socket { width: 135px; position: relative; z-index: 4; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.5)); }
.module-rim {
  height: 24px; background: linear-gradient(180deg, #334155 0%, #1e293b 100%); 
  border: 1px solid #000; border-top: 2px solid #475569;
  display: flex; align-items: center; justify-content: space-between; padding: 0 10px;
}
.rim-id { font-size: 9px; color: #94a3b8; font-weight: 900; }
.rim-led { width: 14px; height: 4px; border-radius: 1px; transition: all 0.5s; }

.pod-pedestal {
  height: 80px; background: linear-gradient(180deg, #1e293b 0%, #020617 100%);
  border: 1px solid #000; border-top: none; border-radius: 0 0 10px 10px;
  display: flex; align-items: center; justify-content: center;
}
.pedestal-screen {
  width: 90%; height: 60px; background: #020617; border-radius: 4px;
  box-shadow: inset 0 4px 10px #000; display: flex; flex-direction: column; 
  align-items: center; justify-content: center; padding: 6px; border: 1px solid #1e293b;
}
.ps-injury { font-size: 10px; color: #ef4444; font-weight: 900; margin-bottom: 4px; text-transform: uppercase; }
.ps-med-box { border-left: 3px solid; padding-left: 8px; width: 100%; text-align: left; background: rgba(255,255,255,0.02); padding: 4px 8px; }
.ps-tier { font-size: 9px; color: #fff; font-weight: bold; opacity: 0.6; margin-right: 5px; }
.ps-med-name { font-size: 9px; color: #fff; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px; }
.ps-standby { font-size: 9px; color: #334155; font-weight: 900; letter-spacing: 2px; }
.standby-bar { width: 40px; height: 2px; background: #1e293b; margin-top: 4px; }

/* === TERMINAIS (Containers de Baixo) === */
.apex-terminals { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; padding: 0 20px; }
.terminal { 
  background: rgba(10, 15, 30, 0.7); backdrop-filter: blur(10px);
  height: 300px; border-radius: 8px; border: 1px solid #1e293b; border-top: 3px solid #0ea5e9;
  display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);
}
.term-header { background: rgba(2, 6, 23, 0.9); padding: 12px 15px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
.th-title { font-size: 11px; color: #0ea5e9; font-weight: 900; letter-spacing: 1px; }
.th-badge { font-size: 10px; color: #f8fafc; background: #1e293b; padding: 2px 8px; border-radius: 3px; font-weight: bold; border: 1px solid #334155; }
.term-body { padding: 12px; flex: 1; overflow-y: auto; scrollbar-gutter: stable; display: flex; flex-direction: column; gap: 6px; }

.data-row { background: rgba(30, 41, 59, 0.3); padding: 10px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; border-left: 3px solid #334155; }
.dr-name { font-size: 12px; color: #fff; font-weight: bold; display: block; text-transform: uppercase; }
.dr-reason { font-size: 10px; color: #ef4444; font-weight: bold; }
.status-crystal { width: 10px; height: 10px; transform: rotate(45deg); border: 1px solid rgba(255,255,255,0.4); }

.muted-label { font-size: 10px; color: #94a3b8; font-weight: 900; text-transform: uppercase; }
.slot-grid { display: flex; gap: 6px; }
.c-slot { width: 28px; height: 24px; background: #020617; border: 1px solid #1e293b; border-radius: 3px; display: flex; align-items: center; justify-content: center; position: relative; }
.c-slot.has-stock { border-color: #0ea5e9; background: rgba(14, 165, 233, 0.1); }
.cs-qty { font-size: 11px; color: #475569; font-weight: 900; }
.has-stock .cs-qty { color: #0ea5e9; text-shadow: 0 0 5px #0ea5e9; }
.cs-lock { font-size: 10px; color: #1e293b; }
.cs-add { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.c-slot:hover .cs-add { opacity: 1; background: rgba(14, 165, 233, 0.2); }

/* MOBILE */
@media (max-width: 700px) {
  .apex-stage { display: grid; grid-template-columns: repeat(2, 1fr); justify-items: center; }
  .apex-terminals { grid-template-columns: 1fr; }
}
@media (max-width: 380px) {
  .monoblock-pod { transform: scale(0.82); margin-bottom: -35px; }
}

/* ANIMAÇÕES */
.soul-icon { width: 45px; height: 45px; animation: float 4s infinite ease-in-out; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
.cyl-liquid { position: absolute; bottom: 0; left: 0; width: 100%; transition: height 1s linear; }
.bubbles { position: absolute; inset: 0; background: radial-gradient(circle, rgba(255,255,255,0.4) 10%, transparent 20%); background-size: 15px 15px; animation: bubbleUp 3s infinite linear; opacity: 0.2; }
@keyframes bubbleUp { 0% { background-position: 0 140px; } 100% { background-position: 0 -140px; } }
</style>