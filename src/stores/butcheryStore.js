import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useGameStore } from './gameStore'
import { CARCACAS_INFO } from '../data/balancing'

export const useButcheryStore = defineStore('butchery', () => {
  const gameStore = useGameStore()

  const workerId = ref(null)
  const activeSlot = ref({ carcacaId: null, progress: 0, totalTime: 0 })
  const queue = ref([])
  
  // O Inventário invisível (Guarda os valores quebrados ex: 0.5 Carne)
  const partialLoot = ref({}) 
  // O Gatilho visual (Avisa a tela para subir o textinho "+1 Carne")
  const recentDrops = ref([])

  const currentWorker = computed(() => {
    if (!workerId.value) return null
    return gameStore.workers.find(w => w.id === workerId.value) || null
  })

  const totalCarcassesInStorage = computed(() => {
    let total = 0
    for (const key of Object.keys(CARCACAS_INFO)) { total += (gameStore.inventory[key] || 0) }
    return total
  })

  function addToQueue(carcacaId) {
    if (queue.value.length >= 10) return
    if ((gameStore.inventory[carcacaId] || 0) <= 0) return
    gameStore.inventory[carcacaId]--
    queue.value.push(carcacaId)
  }

  function removeFromQueue(index) {
    const id = queue.value[index]
    if (id) {
      gameStore.inventory[id]++
      queue.value.splice(index, 1)
    }
  }

  function discardCarcass(carcacaId, amount) {
    const currentQty = gameStore.inventory[carcacaId] || 0
    if (currentQty > 0) {
      const toDiscard = Math.min(currentQty, amount)
      gameStore.inventory[carcacaId] -= toDiscard
    }
  }

  // === O MOTOR MATEMÁTICO ===
  function butcheryTick() {
    const bLevel = gameStore.buildings.find(b => b.key === 'destrinchador')?.level || 0
    if (bLevel === 0) return
    if (!currentWorker.value || (currentWorker.value.strikeDays || 0) > 0 || currentWorker.value.injury) return

    if (!activeSlot.value.carcacaId && queue.value.length > 0) {
      const nextId = queue.value.shift()
      activeSlot.value.carcacaId = nextId
      activeSlot.value.progress = 0
      activeSlot.value.totalTime = CARCACAS_INFO[nextId].tempoBase
    }

    if (activeSlot.value.carcacaId) {
      const efficiency = currentWorker.value.efficiency
      const dureza = CARCACAS_INFO[activeSlot.value.carcacaId].dureza
      
      // CÁLCULO DE VELOCIDADE: Eficiência vs Dureza. (Se ef=100 e dureza=1, speed é 1.0x)
      // Se ef=200 e dureza=1, speed é 2.0x. Se ef=100 e dureza=5, speed é 0.2x.
      const speedMultiplier = Math.max(0.1, efficiency / (dureza * 100))
      
      activeSlot.value.progress += (1 * speedMultiplier)

      if (activeSlot.value.progress >= activeSlot.value.totalTime) {
        processLoot(activeSlot.value.carcacaId, efficiency, dureza)
        activeSlot.value.carcacaId = null
        activeSlot.value.progress = 0
        activeSlot.value.totalTime = 0
      }
    }
  }

  function processLoot(carcacaId, efficiency, dureza) {
    // CÁLCULO DE SUCESSO: (Eficiência / Dureza) / 100. Limite MÁXIMO de 100% (1.0).
    const successRatio = Math.min((efficiency / dureza) / 100, 1) 
    const drops = CARCACAS_INFO[carcacaId].drops
    const earnedLoot = [] // Lista do que o jogador ganhou "inteiro" nesta rodada

    for (const [item, baseQtd] of Object.entries(drops)) {
      // Valor exato ganho (ex: 3 Carnes * 0.4 de sucesso = 1.2 Carnes ganhas)
      const fractionEarned = baseQtd * successRatio
      
      // Joga no inventário invisível
      partialLoot.value[item] = (partialLoot.value[item] || 0) + fractionEarned
      
      // Verifica se formou um número inteiro (ex: acumulou 1.2 -> pega 1)
      const wholeItems = Math.floor(partialLoot.value[item])
      if (wholeItems > 0) {
        gameStore.inventory[item] = (gameStore.inventory[item] || 0) + wholeItems
        partialLoot.value[item] -= wholeItems // Subtrai o 1, sobra 0.2 no invisível
        earnedLoot.push({ item, qtd: wholeItems })
      }
    }

    // Se ele ganhou itens inteiros, avisa a tela para fazer a animação
    if (earnedLoot.length > 0) {
      recentDrops.value = [...earnedLoot]
    }
  }

  function assignWorker(id) {
    if (workerId.value) {
      const oldW = gameStore.workers.find(w => w.id === workerId.value)
      if (oldW) oldW.assignment = null
    }
    if (workerId.value === id) { workerId.value = null } 
    else {
      workerId.value = id
      const newW = gameStore.workers.find(w => w.id === id)
      if (newW) newW.assignment = 'Destrinchador'
    }
  }

  function loadButchery() {
    const saved = localStorage.getItem('mythic_butchery_save')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.workerId) {
        workerId.value = data.workerId
        const w = gameStore.workers.find(x => x.id === workerId.value)
        if (w) w.assignment = 'Destrinchador'
      }
      if (data.queue) queue.value = data.queue
      if (data.activeSlot) activeSlot.value = data.activeSlot
      if (data.partialLoot) partialLoot.value = data.partialLoot // Carrega frações
    }
  }

  watch(() => ({ workerId: workerId.value, queue: queue.value, activeSlot: activeSlot.value, partialLoot: partialLoot.value }), (newState) => {
    localStorage.setItem('mythic_butchery_save', JSON.stringify(newState))
  }, { deep: true })

  return { workerId, activeSlot, queue, currentWorker, totalCarcassesInStorage, partialLoot, recentDrops, addToQueue, removeFromQueue, discardCarcass, butcheryTick, assignWorker, loadButchery }
})