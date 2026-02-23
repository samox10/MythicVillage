import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useGameStore } from './gameStore'
import { RECEITAS_ALQUIMIA, MULTIPLICADOR_ALQUIMIA, TIER_ORDER } from '../data/balancing'

export const useAlchemyStore = defineStore('alchemy', () => {
  const gameStore = useGameStore()

  // 1. ESTADO
  const workerId = ref(null)
  
  // A síntese que está rodando no momento
  const activeCraft = ref({
    medicamentKey: null,
    tier: 1,
    requestedAmount: 0,
    completedAmount: 0,
    progress: 0,
    timePerUnit: 0,
    unitCost: {} // Guarda quanto custou cada unidade para podermos reembolsar depois
  })

  // A bandeja de resfriamento (Itens prontos esperando o botão "Coletar")
  const tray = ref({
    plasma: [0, 0, 0, 0], soro_reg: [0, 0, 0, 0], solucao: [0, 0, 0, 0], resina: [0, 0, 0, 0],
    derme: [0, 0, 0, 0], neutralizador: [0, 0, 0, 0], estimulante: [0, 0, 0, 0], soro_psi: [0, 0, 0, 0]
  })

  // 2. GETTERS
  const currentWorker = computed(() => {
    if (!workerId.value) return null
    return gameStore.workers.find(w => w.id === workerId.value) || null
  })

  const isTrayEmpty = computed(() => {
    for (const med in tray.value) {
      for (let i = 0; i < 4; i++) {
        if (tray.value[med][i] > 0) return false
      }
    }
    return true
  })

  // Calcula o máximo que dá pra fazer com o que tem no armazém
  function getMaxCraftable(medKey, tier) {
    const recipe = RECEITAS_ALQUIMIA[medKey]
    if (!recipe) return 0
    const costMult = MULTIPLICADOR_ALQUIMIA[tier].cost
    let max = Infinity

    for (const [resource, baseQtd] of Object.entries(recipe.custo)) {
      const requiredPerUnit = Math.floor(baseQtd * costMult)
      const available = gameStore.inventory[resource] || 0
      const possible = Math.floor(available / requiredPerUnit)
      if (possible < max) max = possible
    }
    return max === Infinity ? 0 : max
  }

  // 3. AÇÕES (ORDENS DE SERVIÇO)
  function assignWorker(id) {
    if (workerId.value) {
      const oldW = gameStore.workers.find(w => w.id === workerId.value)
      if (oldW) oldW.assignment = null
    }
    if (workerId.value === id) { workerId.value = null } 
    else {
      workerId.value = id
      const newW = gameStore.workers.find(w => w.id === id)
      if (newW) newW.assignment = 'Alquimista'
    }
  }

  function startBatch(medKey, tier, amount) {
    if (amount <= 0 || activeCraft.value.medicamentKey) return
    const maxPoss = getMaxCraftable(medKey, tier)
    if (amount > maxPoss) return // Prevenção de hack ou bug

    const recipe = RECEITAS_ALQUIMIA[medKey]
    const costMult = MULTIPLICADOR_ALQUIMIA[tier].cost
    const timeMult = MULTIPLICADOR_ALQUIMIA[tier].time

    // Monta o custo unitário e já cobra tudo do armazém
    const finalUnitCost = {}
    for (const [res, baseQtd] of Object.entries(recipe.custo)) {
      const reqUnit = Math.floor(baseQtd * costMult)
      finalUnitCost[res] = reqUnit
      gameStore.inventory[res] -= (reqUnit * amount)
    }

    activeCraft.value = {
      medicamentKey: medKey, tier: tier, requestedAmount: amount, completedAmount: 0,
      progress: 0, timePerUnit: recipe.baseTime * timeMult, unitCost: finalUnitCost
    }
  }

  function abortBatch() {
    if (!activeCraft.value.medicamentKey) return
    
    // Calcula quantos não foram feitos
    const remaining = activeCraft.value.requestedAmount - activeCraft.value.completedAmount
    
    // Devolve os recursos do que não foi feito
    for (const [res, cost] of Object.entries(activeCraft.value.unitCost)) {
      gameStore.inventory[res] += (cost * remaining)
    }

    // Zera a máquina (o que já foi feito já está na bandeja)
    clearActiveCraft()
  }

  function speedUpBatch() {
    if (!activeCraft.value.medicamentKey) return
    const remaining = activeCraft.value.requestedAmount - activeCraft.value.completedAmount
    const mythicCost = Math.ceil(remaining / 10) // 1 Moeda a cada 10 unidades
    
    if (gameStore.resources.mythicCoin >= mythicCost) {
      gameStore.resources.mythicCoin -= mythicCost
      
      // Joga tudo que faltava para a bandeja de uma vez
      const med = activeCraft.value.medicamentKey
      const tIndex = activeCraft.value.tier - 1
      tray.value[med][tIndex] += remaining

      clearActiveCraft()
      return true
    }
    return false
  }

  function clearActiveCraft() {
    activeCraft.value = { medicamentKey: null, tier: 1, requestedAmount: 0, completedAmount: 0, progress: 0, timePerUnit: 0, unitCost: {} }
  }

  function collectTray() {
    for (const med in tray.value) {
      for (let i = 0; i < 4; i++) {
        if (tray.value[med][i] > 0) {
           gameStore.medicalInventory[med][i] += tray.value[med][i]
           tray.value[med][i] = 0 // Esvazia a bandeja silenciosamente
        }
      }
    }
  }

  // 4. MOTOR DO LABORATÓRIO (Roda 1x por segundo)
  function alchemyTick() {
    const bLevel = gameStore.buildings.find(b => b.key === 'laboratorio')?.level || 0
    if (bLevel === 0 || !activeCraft.value.medicamentKey) return
    
    if (!currentWorker.value || (currentWorker.value.strikeDays || 0) > 0 || currentWorker.value.injury) return

    // CÁLCULO DE VELOCIDADE: 100 de ef = 1.0x (normal). 200 de ef = 2.0x (dobro da velocidade)
    const speedMultiplier = Math.max(0.1, currentWorker.value.efficiency / 100)
    
    activeCraft.value.progress += (1 * speedMultiplier)

    // Terminou uma unidade?
    if (activeCraft.value.progress >= activeCraft.value.timePerUnit) {
      activeCraft.value.progress -= activeCraft.value.timePerUnit // Guarda o "troco" de tempo
      activeCraft.value.completedAmount++
      
      // Joga a unidade pronta na bandeja visual
      const med = activeCraft.value.medicamentKey
      const tIndex = activeCraft.value.tier - 1
      tray.value[med][tIndex]++

      // Terminou todo o lote?
      if (activeCraft.value.completedAmount >= activeCraft.value.requestedAmount) {
        clearActiveCraft()
      }
    }
  }

  // 5. SISTEMA DE SAVE
  function loadAlchemy() {
    const saved = localStorage.getItem('mythic_alchemy_save')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.workerId) {
        workerId.value = data.workerId
        const w = gameStore.workers.find(x => x.id === workerId.value)
        if (w) w.assignment = 'Alquimista'
      }
      if (data.activeCraft) activeCraft.value = data.activeCraft
      if (data.tray) tray.value = data.tray
    }
  }

  watch(() => ({ workerId: workerId.value, activeCraft: activeCraft.value, tray: tray.value }), (newState) => {
    localStorage.setItem('mythic_alchemy_save', JSON.stringify(newState))
  }, { deep: true })

  return {
    workerId, activeCraft, tray, currentWorker, isTrayEmpty,
    getMaxCraftable, assignWorker, startBatch, abortBatch, speedUpBatch, collectTray, alchemyTick, loadAlchemy
  }
})