import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { TIER_CONFIG } from '../data/balancing'

export const useGameStore = defineStore('game', () => {
  
  // === ESTADO (Dados do Jogo) ===
  const resources = ref({ mythicCoin: 100, goldCoin: 10000000 })
  const workers = ref([]) 
  const buildings = ref([
    { id: 1, key: 'castelo', level: 1 },
    { id: 2, key: 'armazem', level: 1 },
    { id: 3, key: 'hospedagem', level: 1 },
    { id: 4, key: 'centrorecrutamento', level: 1 }
  ])
  const adminId = ref(null)

  // === GETTERS (Cálculos) ===
  const currentAdmin = computed(() => {
    if (!adminId.value) return null
    return workers.value.find(w => w.id === adminId.value) || null
  })

  const recruitmentLevel = computed(() => {
    const b = buildings.value.find(x => x.key === 'centrorecrutamento')
    return b ? b.level : 0
  })

  // === ACTIONS (Ações) ===

  // 1. Contratar
  function hireWorker(worker) {
    if (resources.value.goldCoin < 500) return false
    resources.value.goldCoin -= 500
    workers.value.unshift(worker)
    return true
  }

  // 2. Demitir / Definir Admin
  function fireWorker(id) {
    if (adminId.value === id) adminId.value = null
    workers.value = workers.value.filter(w => w.id !== id)
  }
  function setAdmin(id) {
    if (adminId.value === id) adminId.value = null
    else adminId.value = id
  }

  // 3. Sistema de Construção (NOVO)
  function spendResources(cost) {
    // Verifica se tem dinheiro
    if (resources.value.goldCoin >= cost.gold && resources.value.mythicCoin >= cost.mythic) {
      resources.value.goldCoin -= cost.gold
      resources.value.mythicCoin -= cost.mythic
      return true
    }
    return false
  }

  function upgradeBuilding(id) {
    const b = buildings.value.find(x => x.id === id)
    if (b) b.level++
  }

  // 4. Salário
  function paySalaries() {
    let totalCost = 0
    workers.value.forEach(w => totalCost += w.salary)
    if (totalCost > 0 && resources.value.goldCoin >= totalCost) {
       resources.value.goldCoin -= totalCost
       console.log(`Salários pagos: -${totalCost} G`)
    }
  }

  // === SAVE SYSTEM ===
  function loadGame() {
    const saved = localStorage.getItem('mythic_save_v2') // Mudei para v2 para limpar dados velhos
    if (saved) {
      const data = JSON.parse(saved)
      resources.value = data.resources
      workers.value = data.workers
      buildings.value = data.buildings
      adminId.value = data.adminId
    }
  }

  watch([resources, workers, buildings, adminId], () => {
    localStorage.setItem('mythic_save_v2', JSON.stringify({
      resources: resources.value,
      workers: workers.value,
      buildings: buildings.value,
      adminId: adminId.value
    }))
  }, { deep: true })

  return {
    resources, workers, buildings, adminId,
    currentAdmin, recruitmentLevel,
    hireWorker, fireWorker, setAdmin, paySalaries,
    spendResources, upgradeBuilding, loadGame
  }
})