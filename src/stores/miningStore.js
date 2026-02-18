import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGameStore } from './gameStore'
import { RECURSOS_MINERACAO, MINING_CONFIG } from '../data/balancing'

export const useMiningStore = defineStore('mining', () => {
  const gameStore = useGameStore()

  // === ESTADO ===
  // Gera a lista de minas baseado no balancing.js
  const mines = ref(Object.keys(RECURSOS_MINERACAO).map(key => ({
    id: key,
    name: RECURSOS_MINERACAO[key].nome,
    color: RECURSOS_MINERACAO[key].cor,
    slots: [null, null], // ID dos trabalhadores (null se vazio)
    
    // Estado do Carrinho
    cartLoad: 0,
    cartMax: MINING_CONFIG.baseCartCapacity,
    cartStatus: 'MINING', // Estados: MINING, FULL, TO_VILLAGE, READY, TO_MINE
    travelTimer: 0 // Tempo restante de viagem
  })))
  // Retorna uma lista de IDs de todos que já estão nas minas
  const assignedWorkerIds = computed(() => {
    const ids = []
    mines.value.forEach(m => {
      m.slots.forEach(slot => {
        if (slot) ids.push(slot)
      })
    })
    return ids
  })

  // === ACTIONS ===

  // 1. Alocar Trabalhador (Só aceita profissão 'minerador')
  function assignWorker(mineId, slotIndex, workerId) {
    const mine = mines.value.find(m => m.id === mineId)
    if (!mine) return

    // Verifica se o trabalhador existe e é minerador
    const worker = gameStore.workers.find(w => w.id === workerId)
    if (!worker) return
    if (worker.jobKey !== 'minerador') {
      throw new Error("Apenas Mineradores podem trabalhar aqui.")
    }

    // Remove de outras minas se já estiver alocado
    mines.value.forEach(m => {
      if (m.slots.includes(workerId)) {
        const idx = m.slots.indexOf(workerId)
        m.slots[idx] = null
      }
    })

    // Tira o crachá do trabalhador antigo (se a gente estiver substituindo alguém no slot)
    const oldWorkerId = mine.slots[slotIndex]
    if (oldWorkerId) {
      const oldWorker = gameStore.workers.find(w => w.id === oldWorkerId)
      if (oldWorker) oldWorker.assignment = null
    }

    // Coloca o trabalhador novo no slot e anota o crachá dele
    mine.slots[slotIndex] = workerId
    worker.assignment = 'Minerador' // <--- DEU O CRACHÁ
  }

  // 2. Remover Trabalhador
  function removeWorker(mineId, slotIndex) {
    const mine = mines.value.find(m => m.id === mineId)
    if (mine) {
      // Limpa o crachá do trabalhador antes de tirar ele do slot
      const oldWorkerId = mine.slots[slotIndex]
      if (oldWorkerId) {
        const oldWorker = gameStore.workers.find(w => w.id === oldWorkerId)
        if (oldWorker) oldWorker.assignment = null // <--- TIROU O CRACHÁ
      }
      mine.slots[slotIndex] = null
    }
  }

  // 3. Controle do Carrinho (Jogador clica para enviar/receber)
  function sendCartToVillage(mineId) {
    const mine = mines.value.find(m => m.id === mineId)
    // Só pode enviar se estiver minerando ou cheio
    if (mine.cartStatus === 'MINING' || mine.cartStatus === 'FULL') {
      mine.cartStatus = 'TO_VILLAGE'
      mine.travelTimer = MINING_CONFIG.travelTime
    }
  }

  function collectAndReturnCart(mineId) {
    const mine = mines.value.find(m => m.id === mineId)
    if (mine.cartStatus === 'READY') {
      
      // Lógica de Limite do Armazém
      const resourceKey = mine.id
      const currentStock = gameStore.inventory[resourceKey] || 0
      const maxStorage = gameStore.maxStorage
      
      // Quanto cabe no armazém?
      const spaceLeft = maxStorage - currentStock
      
      if (spaceLeft <= 0) {
        throw new Error("Armazém lotado! Evolua o Armazém ou gaste recursos.")
      }

      // Calcula quanto realmente vai ser coletado
      const amountToCollect = Math.min(mine.cartLoad, spaceLeft)
      
      // Adiciona ao inventário global
      gameStore.inventory[resourceKey] += amountToCollect
      
      // Esvazia o carrinho (ou deixa o resto se não coube tudo)
      mine.cartLoad -= amountToCollect

      if (mine.cartLoad > 0) {
        // Se sobrou item, avisa que não deu pra levar tudo
        throw new Error(`Armazém cheio! Coletado: ${amountToCollect}. Restante no carrinho: ${mine.cartLoad}`)
      } else {
        // Se esvaziou tudo, manda de volta
        mine.cartStatus = 'TO_MINE'
        mine.travelTimer = MINING_CONFIG.travelTime
      }
    }
  }

  // === O LOOP PRINCIPAL (TICK) ===
  // Esta função deve ser chamada a cada 1 segundo pelo App.vue
  function miningTick() {
    mines.value.forEach(mine => {
      
      // A) Lógica de Viagem
      if (mine.cartStatus === 'TO_VILLAGE') {
        mine.travelTimer--
        if (mine.travelTimer <= 0) mine.cartStatus = 'READY'
        return // Se está viajando, não minera
      }
      if (mine.cartStatus === 'TO_MINE') {
        mine.travelTimer--
        if (mine.travelTimer <= 0) mine.cartStatus = 'MINING'
        return
      }
      if (mine.cartStatus === 'READY') return // Esperando jogador coletar

      // B) Lógica de Mineração (Só se estiver na mina e não estiver cheio)
      if (mine.cartStatus === 'MINING') {
        // Verifica se encheu
        if (mine.cartLoad >= mine.cartMax) {
          mine.cartLoad = mine.cartMax
          mine.cartStatus = 'FULL'
          return
        }

        // Calcula produção dos trabalhadores
        let production = 0
        const resourceInfo = RECURSOS_MINERACAO[mine.id] // Pega dados do balancing
        const hardness = resourceInfo ? resourceInfo.dureza : 1

        mine.slots.forEach((workerId, index) => {
          if (!workerId) return
          
          // VERIFICA SE O SLOT ESTÁ DESBLOQUEADO PELO NÍVEL
          // Slot 0 = unlockLvl, Slot 1 = fullUnlockLvl
          const requiredLvl = index === 0 ? resourceInfo.unlockLvl : resourceInfo.fullUnlockLvl
          if (gameStore.miningLevel < requiredLvl) return // Slot bloqueado não produz

          const worker = gameStore.workers.find(w => w.id === workerId)
          if (worker && worker.strikeDays === 0) {
             // FÓRMULA: (Eficiência / 10) dividido pela Dureza
             // Ex: Worker 100% em Pedra (Dureza 1) = 10 unid/seg
             // Ex: Worker 100% em Oricalco (Dureza 50) = 0.2 unid/seg
             production += (worker.efficiency / 10) / hardness
          }
        })

        mine.cartLoad += production
        if (mine.cartLoad >= mine.cartMax) {
          mine.cartLoad = mine.cartMax
          mine.cartStatus = 'FULL'
        }
      }
    })
  }

  return {
    mines,
    assignedWorkerIds,
    assignWorker,
    removeWorker,
    sendCartToVillage,
    collectAndReturnCart,
    miningTick
  }
})