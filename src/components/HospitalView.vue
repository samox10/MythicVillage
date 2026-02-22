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

// Lógica de Nome: Nome + Inicial do Sobrenome (Ex: João S.)
const formatPatientName = (fullName) => {
  if (!fullName) return ''
  const parts = fullName.split(' ')
  if (parts.length === 1) return parts[0]
  // Pega o Primeiro Nome (parts[0]) + A primeira letra do Último Nome
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

const getLiquidHeight = (bed) => {
  if (!bed.patientId || bed.totalTime <= 0) return '0%'
  const pct = 100 - ((bed.progress / bed.totalTime) * 100)
  return `${Math.max(0, pct)}%`
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

const setDefaultTier = (medKey, tierNum) => {
  // Só permite selecionar se o nível do hospital já liberou aquele Tier
  if (tierNum <= maxTierUnlocked.value) {
    hospitalStore.defaultTiers[medKey] = tierNum
  }
}

onMounted(() => {
  window.causarAcidente = testInjury
})

onUnmounted(() => {
  delete window.causarAcidente
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
      <button @click="testInjury" class="debug-btn-mobile">
        🚨 CAUSAR ACIDENTE (TESTE)
      </button>
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
                  <div class="cyl-liquid" :style="{ height: getLiquidHeight(bed), background: `linear-gradient(to top, ${liquidColors[bed.medicament]}40, ${liquidColors[bed.medicament]}90)` }">
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
                    <span class="ps-injury" :style="{ color: liquidColors[bed.medicament], textShadow: `0 0 8px ${liquidColors[bed.medicament]}` }">
                      {{ getPatient(bed.patientId)?.injury }}
                    </span>
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
          
          <div class="sys-terminal">
            <div class="st-header">
              <span class="st-title">LOG DE TRIAGEM</span>
              <span class="st-count">{{ hospitalStore.triageQueue.length }} na fila</span>
            </div>
            <div class="st-body">
              <div v-if="hospitalStore.triageQueue.length === 0" class="st-empty">NENHUM PACIENTE NA FILA</div>
              <div v-for="(p, idx) in hospitalStore.triageQueue" :key="idx" class="triage-row">
                <div class="tr-indicator" :style="{ background: liquidColors[p.medicamentRequired], boxShadow: `0 0 5px ${liquidColors[p.medicamentRequired]}` }"></div>
                <div class="tr-info">
                  <span class="tr-name">{{ getPatient(p.workerId)?.name }}</span>
                  <span class="tr-reason">{{ p.reason }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="sys-terminal">
            <div class="st-header">
              <span class="st-title">ESTOQUE CLÍNICO</span>
              <div class="st-tiers"><span>T1</span><span>T2</span><span>T3</span><span>T4</span></div>
            </div>
            <div class="st-body dense-grid">
              <div v-for="(data, key) in MEDICAMENTOS" :key="key" class="med-row">
                <div class="med-name-col">
                  <span class="med-dot" :style="{ background: liquidColors[key] }"></span>
                  <span class="med-name">{{ data.nome }}</span>
                </div>
                <div class="med-slots-col">
                  <div v-for="t in 4" :key="t" 
                       class="med-slot" 
                       :class="{
                         'has-qty': store.medicalInventory[key][t-1] > 0, 
                         'locked': maxTierUnlocked < t,
                         'is-default': hospitalStore.defaultTiers[key] === t 
                       }"
                       @click="setDefaultTier(key, t)"
                       :title="`Definir T${t} como prioridade de uso`"
                  >
                    <template v-if="maxTierUnlocked >= t">
                      <span class="ms-val">{{ store.medicalInventory[key][t-1] }}</span>
                      </template>
                    <span v-else class="ms-lock"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>

    <WorkerSelectModal 
      v-if="showMedicSelect" 
      title="SELECIONAR MÉDICO CHEFE"
      :workers="availableMedics" 
      emptyMessage1="NENHUM MÉDICO DISPONÍVEL."
      emptyMessage2="Contrate um funcionário da classe 'Médico' no Recrutamento."
      @close="showMedicSelect = false" 
      @select="selectMedic" 
    />
  </BuildingLayout>
</template>

<style scoped>
.hospital-complex { display: flex; flex-direction: column; font-family: 'Chakra Petch', sans-serif; padding-bottom: 20px; }
.apex-layout { display: flex; flex-direction: column; gap: 40px; }
.apex-stage { display: flex; flex-wrap: wrap; justify-content: center; gap: 35px; padding: 10px 0; }

/* === O MONOBLOCO (Leito) === */
.monoblock-pod { display: flex; flex-direction: column; align-items: center; width: 140px; position: relative; }
.monoblock-pod.is-offline { filter: grayscale(0.8) brightness(0.6); }

/* TOPO: Cabeçote Acetinado e Encaixado */
.pod-top-socket {
  width: 120px; height: 42px;
  background: linear-gradient(180deg, #334155 0%, #1e293b 80%, #0f172a 100%);
  border: 1px solid #020617; 
  border-radius: 8px 8px 0 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  position: relative; 
  z-index: 5; /* Fica por cima do vidro */
  box-shadow: 0 8px 15px -5px rgba(0,0,0,0.8), inset 0 2px 5px rgba(255,255,255,0.1);
  margin-bottom: -6px; /* Puxa o vidro para dentro do metal (Encaixe real) */
}

/* O Visor do Nome (Adeus Fita Preta) - Agora parece uma tela embutida no metal */
.visor-screen {
  width: 80%; height: 20px; 
  background: #020617; 
  border: 2px solid #1e293b; 
  border-top-color: #0f172a; border-bottom-color: #334155; /* Efeito 3D afundado */
  border-radius: 4px; 
  display: flex; align-items: center; justify-content: center;
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.1);
}
.vs-name { font-size: 11px; color: #f8fafc; font-weight: 800; letter-spacing: 0.5px; text-shadow: 0 0 5px rgba(255,255,255,0.4); text-transform: uppercase; }
.vs-empty { font-size: 9px; color: #475569; font-weight: 900; }
.top-vent { width: 40px; height: 3px; background: #020617; margin-top: 4px; border-radius: 2px; box-shadow: inset 0 1px 2px #000, 0 1px 0 rgba(255,255,255,0.1); }

/* CORPO: Vidro com Chassi */
.pod-center-frame { display: flex; position: relative; z-index: 2; justify-content: center; width: 100%; }
.support-pillar {
  width: 10px; background: linear-gradient(90deg, #0f172a, #334155 30%, #1e293b 70%, #020617);
  border-left: 1px solid #000; border-right: 1px solid #000; z-index: 3;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
}
.pod-cylinder { 
  width: 90px; height: 145px; background: rgba(10, 15, 30, 0.6); 
  position: relative; overflow: hidden; 
  border-left: 2px solid rgba(255,255,255,0.1); border-right: 2px solid rgba(255,255,255,0.05);
  box-shadow: inset 0 0 20px rgba(0,0,0,0.9);
}
.cyl-glass-internal-shadow {
  position: absolute; inset: 0; pointer-events: none; z-index: 4;
  /* Cria a sombra curva dentro do vidro */
  box-shadow: inset 0 25px 20px -15px #000, inset 0 -25px 20px -15px #000;
}
.glass-reflection {
  position: absolute; inset: 0; pointer-events: none; z-index: 5;
  background: linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.15) 15%, transparent 35%, transparent 80%, rgba(255,255,255,0.08) 95%);
}

/* BASE: Pedestal Robusto e Encaixado */
.pod-bottom-socket { 
  width: 140px; position: relative; z-index: 5; /* Fica por cima do vidro */
  margin-top: -8px; /* Puxa o vidro para dentro da base (Encaixe real) */
  filter: drop-shadow(0 15px 15px rgba(0,0,0,0.6)); 
}
.module-rim {
  height: 28px; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); 
  border: 1px solid #000; border-top: 2px solid #64748b;
  display: flex; align-items: center; justify-content: space-between; padding: 0 12px;
  border-radius: 4px 4px 0 0;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.1);
}
.rim-id { font-size: 10px; color: #94a3b8; font-weight: 900; letter-spacing: 1px; }
.rim-led { width: 16px; height: 4px; border-radius: 2px; transition: all 0.5s; box-shadow: inset 0 1px 2px rgba(0,0,0,0.5); }

.pod-pedestal {
  height: 75px; background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
  border: 1px solid #000; border-top: none; border-radius: 0 0 12px 12px;
  display: flex; align-items: center; justify-content: center;
}
/* A nova tela de ferimento (Limpa e moderna) */
.pedestal-screen {
  width: 85%; height: 50px; background: #020617; border-radius: 6px;
  box-shadow: inset 0 4px 15px #000, 0 1px 0 rgba(255,255,255,0.05); 
  display: flex; flex-direction: column; align-items: center; justify-content: center; 
  padding: 8px; border: 2px solid #1e293b; border-bottom-color: #334155;
}
.ps-injury { font-size: 11px; font-weight: 900; text-transform: uppercase; text-align: center; line-height: 1.2; }
.ps-standby { font-size: 10px; color: #334155; font-weight: 900; letter-spacing: 2px; text-shadow: 0 1px 2px #000; }
.standby-bar { width: 50px; height: 3px; background: #1e293b; margin-top: 6px; border-radius: 2px; }

/* === TERMINAIS (Novo Visual Compacto e Tecnológico) === */
.apex-terminals { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 0 20px; }

.sys-terminal { 
  background: #0b1120; /* Fundo mais escuro e sólido, cara de painel */
  border: 1px solid #1e293b; border-radius: 6px;
  display: flex; flex-direction: column; height: 300px; /* Reduzimos a altura */
  box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 10px 20px rgba(0,0,0,0.4);
  position: relative; overflow: hidden;
}
/* Linha decorativa iluminada no topo do terminal */
.sys-terminal::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, #0ea5e9, transparent); }

.st-header { 
  background: #0f172a; padding: 8px 12px; border-bottom: 1px solid #1e293b; 
  display: flex; justify-content: space-between; align-items: center; 
}
.st-title { font-size: 10px; color: #38bdf8; font-weight: 900; letter-spacing: 1px; }
.st-count { font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
.st-tiers { display: flex; gap: 4px; font-size: 9px; color: #64748b; font-weight: 900; width: 100px; justify-content: space-between; padding-right: 2px; }

.st-body { padding: 10px; flex: 1; overflow-y: auto; scrollbar-width: thin; display: flex; flex-direction: column; gap: 4px; }
.st-empty { font-size: 10px; color: #475569; text-align: center; margin-top: 20px; letter-spacing: 1px; font-weight: 700; }

/* Estilo das Linhas de Triagem */
.triage-row { 
  display: flex; align-items: center; gap: 10px; background: #0f172a; 
  padding: 6px 10px; border-radius: 4px; border-left: 2px solid #334155; 
}
.triage-row:hover { background: #1e293b; border-color: #0ea5e9; }
.tr-indicator { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.tr-info { display: flex; flex-direction: column; }
.tr-name { font-size: 11px; color: #e2e8f0; font-weight: 800; text-transform: uppercase; }
.tr-reason { font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }

/* Estilo das Linhas de Estoque */
.dense-grid { gap: 2px; padding: 8px 10px; }
.med-row { 
  display: flex; justify-content: space-between; align-items: center; 
  background: transparent; padding: 4px 0; border-bottom: 1px dashed #1e293b;
}
.med-row:last-child { border-bottom: none; }
.med-name-col { display: flex; align-items: center; gap: 6px; }
.med-dot { width: 4px; height: 4px; border-radius: 1px; opacity: 0.8; }
.med-name { font-size: 9px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }

.med-slots-col { display: flex; gap: 4px; }
.med-slot { 
  width: 22px; height: 18px; background: #020617; border: 1px solid #1e293b; 
  border-radius: 2px; display: flex; align-items: center; justify-content: center; 
  position: relative; cursor: pointer; transition: 0.2s; 
}
/* Interação de clique na caixinha */
.med-slot:hover:not(.locked) { border-color: #38bdf8; }

/* O Destaque do Tier Definido como Padrão/Prioridade */
.med-slot.is-default {
  border-color: #facc15; /* Borda Amarelo Dourado */
  background: rgba(250, 204, 21, 0.1); /* Fundo amarelado suave */
}
.med-slot.is-default .ms-val {
  color: #facc15; 
  text-shadow: 0 0 8px rgba(250, 204, 21, 0.6);
}

.med-slot.has-qty { border-color: #0ea5e9; background: rgba(14, 165, 233, 0.1); }
.med-slot.locked { background: #020617; border-color: #0f172a; opacity: 0.5; }

.ms-val { font-size: 10px; color: #475569; font-weight: 900; }
.has-qty .ms-val { color: #38bdf8; text-shadow: 0 0 5px rgba(56, 189, 248, 0.5); }

/* Cadeado minimalista via CSS para slots bloqueados (evita poluição visual) */
.ms-lock { width: 4px; height: 4px; border: 1px solid #334155; border-radius: 50%; position: relative; }
.ms-lock::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); width: 6px; height: 4px; background: #334155; border-radius: 1px; }

.ms-add { position: absolute; inset: 0; opacity: 0; cursor: pointer; border: none; background: transparent; }
.med-slot:hover .ms-add { opacity: 1; background: rgba(14, 165, 233, 0.2); }




/* MOBILE */
@media (max-width: 700px) {
  .apex-stage { display: grid; grid-template-columns: repeat(2, 1fr); justify-items: center; }
  .apex-terminals { grid-template-columns: 1fr; }
}
@media (max-width: 380px) {
  .monoblock-pod { transform: scale(0.82); margin-bottom: -35px; }
}

/* ANIMAÇÕES E ÍCONE DO PACIENTE */
.cyl-entity {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 3; padding-bottom: 10px; /* Sobe um pouco o ícone para não colar no fundo */
}
.soul-icon { 
  width: 32px; height: 32px; /* Tamanho fixo e menor */
  object-fit: contain; /* Garante que a imagem nunca distorça */
  animation: float 4s infinite ease-in-out;  
}
/* O Líquido principal */
.cyl-liquid { 
  position: absolute; 
  bottom: 0; /* FUNDAMENTAL: Gruda o líquido no chão do tubo */
  left: 0; 
  width: 100%; 
  transition: height 1s linear; 
}

/* A linha brilhante na superfície da água */
.liquid-top {
  position: absolute;
  top: 0; /* FUNDAMENTAL: Fica sempre boiando no topo do líquido */
  left: 0;
  width: 100%;
  height: 4px;
  opacity: 0.9;
}

/* Animação das bolhas e fluido (opcional, caso não tenha) */
.bubbles { 
  position: absolute; inset: 0; 
  background: radial-gradient(circle, rgba(255,255,255,0.4) 10%, transparent 20%); 
  background-size: 15px 15px; 
  animation: flowDown 3s infinite linear; 
  opacity: 0.2; 
}
@keyframes flowDown { 
  0% { background-position: 0 -140px; } 
  100% { background-position: 0 140px; } 
}

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } } 
</style>