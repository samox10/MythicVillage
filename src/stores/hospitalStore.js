import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useGameStore } from './gameStore'
import { useMiningStore } from './miningStore'
import { MEDICAMENTOS, MULTIPLICADOR_TIER_MEDICO } from '../data/balancing'

export const useHospitalStore = defineStore('hospital', () => {
  const gameStore = useGameStore()

  // === ESTADO (A memória do Hospital) ===
  
  // O Médico Chefe responsável pelo hospital (ID do trabalhador)
  const medicId = ref(null)

  // Os 4 leitos (Câmaras de Cura)
  const beds = ref([
    { id: 1, patientId: null, medicament: null, tier: null, progress: 0, totalTime: 0 },
    { id: 2, patientId: null, medicament: null, tier: null, progress: 0, totalTime: 0 },
    { id: 3, patientId: null, medicament: null, tier: null, progress: 0, totalTime: 0 },
    { id: 4, patientId: null, medicament: null, tier: null, progress: 0, totalTime: 0 }
  ])

  // Fila de Triagem (Pacientes esperando)
  // Formato: { workerId, medicamentRequired, baseTime, reason }
  const triageQueue = ref([])

  // === GETTERS (Cálculos e Buscas) ===
  
  // Pega os dados completos do Médico Chefe atual
  const currentMedic = computed(() => {
    if (!medicId.value) return null
    return gameStore.workers.find(w => w.id === medicId.value) || null
  })

  // === ACTIONS (Ações e Regras) ===

  // 1. Dar entrada num paciente (Gera a doença/ferimento)
  function admitPatient(workerId, medicamentRequired, baseTime, reason) {
    const worker = gameStore.workers.find(w => w.id === workerId)
    if (!worker) return

    // Marca o trabalhador como doente para ele não poder trabalhar nem ser demitido
    worker.injury = reason
    worker.assignment = null // Tira ele de onde quer que estivesse trabalhando
    // === REMOVE DA MINA E SALVA A VAGA ===
    const miningStore = useMiningStore()
    miningStore.mines.forEach(mine => {
      mine.slots.forEach((slotWorkerId, index) => {
        if (slotWorkerId === workerId) {
          worker.savedMineId = mine.id       // Salva a identificação da mina
          worker.savedSlotIndex = index      // Salva o número do slot
          mine.slots[index] = null           // Libera o espaço na mina fisicamente
        }
      })
    })
    // ==========================================

    // Coloca na triagem
    triageQueue.value.push({ workerId, medicamentRequired, baseTime, reason })
    
    // Tenta alocar imediatamente se tiver vaga
    processQueue()
  }

// 2. Processar a Triagem (Passar da fila para o leito)
  function processQueue() {
    const hospitalLevel = gameStore.buildings.find(b => b.key === 'hospital')?.level || 0
    if (hospitalLevel === 0) return

    if (!currentMedic.value || (currentMedic.value.strikeDays || 0) > 0 || currentMedic.value.injury) return

    
    const activeBedsCount = Math.min(hospitalLevel, 4) // Nível 1=1, 2=2, 3=3, 4+=4.

    for (let i = 0; i < triageQueue.value.length; i++) {
      const patient = triageQueue.value[i]
      
      // Procura cama vazia APENAS DENTRO DAS CAMAS QUE JÁ FORAM CONSTRUÍDAS
      const emptyBed = beds.value.slice(0, activeBedsCount).find(b => b.patientId === null)
      
      if (!emptyBed) break // Se não tem cama construída/livre, para de olhar a fila

      let selectedTier = null
      
      // Se nível <= 4, o máximo é Tier 1. Se nível 5, Tier 2. Nível 6, Tier 3. Nível 7, Tier 4.
      const maxTierAllowed = hospitalLevel <= 4 ? 1 : Math.min(hospitalLevel - 3, 4)
      
      for (let t = maxTierAllowed - 1; t >= 0; t--) {
        if (gameStore.medicalInventory[patient.medicamentRequired][t] > 0) {  
          selectedTier = t + 1 
          gameStore.medicalInventory[patient.medicamentRequired][t]--
          break
        }
      }

      if (selectedTier !== null) {
        emptyBed.patientId = patient.workerId
        emptyBed.medicament = patient.medicamentRequired
        emptyBed.tier = selectedTier
        emptyBed.progress = 0
        emptyBed.totalTime = patient.baseTime
        
        triageQueue.value.splice(i, 1)
        i-- // Recua o contador pois a fila andou
      }
    }
  }

  // 3. O Loop do Hospital (Cura contínua) - Vai rodar a cada 1 segundo
  function hospitalTick() {
    const hospitalLevel = gameStore.buildings.find(b => b.key === 'hospital')?.level || 0
    if (hospitalLevel === 0) return

    // === REGRA DE PARALISAÇÃO (SEM MÉDICO = FECHADO) ===
    let medicPower = 1 
    if (currentMedic.value && (currentMedic.value.strikeDays || 0) === 0 && !currentMedic.value.injury) {
      medicPower = 1 + (currentMedic.value.efficiency / 100)
    }

    // Passa em cada cama curando os pacientes
    beds.value.forEach(bed => {
      if (bed.patientId) {
        const tierMultiplier = MULTIPLICADOR_TIER_MEDICO[bed.tier] || 1
        
        // Avança o progresso da cura
        bed.progress += (1 * medicPower * tierMultiplier)

        // Se curou totalmente:
        if (bed.progress >= bed.totalTime) {
          const worker = gameStore.workers.find(w => w.id === bed.patientId)
          
          if (worker) {
            worker.injury = null // Tira o atestado
            
            // Tenta devolver para a Mina se ele era de lá
            if (worker.savedMineId) {
              const miningStore = useMiningStore()
              const mine = miningStore.mines.find(m => m.id === worker.savedMineId)
              if (mine && mine.slots[worker.savedSlotIndex] === null) {
                mine.slots[worker.savedSlotIndex] = worker.id 
                worker.assignment = 'Minerador' 
              }
              delete worker.savedMineId
              delete worker.savedSlotIndex
            }
          }
          
          // Limpa a cama
          bed.patientId = null
          bed.medicament = null
          bed.tier = null
          bed.progress = 0
          bed.totalTime = 0
          
          // Chama o próximo da fila
          processQueue()
        }
      }
    })
  }

  // 4. Designar Médico
  function assignMedic(workerId) {
    if (medicId.value) {
      const oldMedic = gameStore.workers.find(w => w.id === medicId.value)
      if (oldMedic) oldMedic.assignment = null
    }
    
    if (medicId.value === workerId) {
      medicId.value = null // Clicou no mesmo, remove
    } else {
      medicId.value = workerId
      const newMedic = gameStore.workers.find(w => w.id === workerId)
      if (newMedic) newMedic.assignment = 'Médico Chefe'
    }
    processQueue()
  }
  

  // === SISTEMA DE SAVE ===
  function loadHospital() {
    const saved = localStorage.getItem('mythic_hospital_save')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.beds) beds.value = data.beds
      if (data.triageQueue) triageQueue.value = data.triageQueue
      if (data.medicId) {
        medicId.value = data.medicId
        const medic = gameStore.workers.find(w => w.id === medicId.value)
        if (medic) medic.assignment = 'Médico Chefe'
      }
    }
  }

  watch(() => ({ beds: beds.value, triageQueue: triageQueue.value, medicId: medicId.value }), (newState) => {
    localStorage.setItem('mythic_hospital_save', JSON.stringify(newState))
  }, { deep: true })

  return {
    medicId, beds, triageQueue, currentMedic,
    admitPatient, processQueue, hospitalTick, assignMedic, loadHospital
  }
})