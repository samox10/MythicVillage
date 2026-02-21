import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useGameStore } from './gameStore'
import { RECURSOS_MINERACAO } from '../data/balancing'

export const useMiningStore = defineStore('mining', () => {
  const gameStore = useGameStore()

  // === ESTADO (MINAS E SILOS LOCAIS) ===
  const mines = ref(Object.keys(RECURSOS_MINERACAO).map((key, index) => ({
    id: key,
    name: RECURSOS_MINERACAO[key].nome,
    color: RECURSOS_MINERACAO[key].cor,
    slots: [null, null], 
    depthIndex: index, 
    reservoirLoad: 0,
    reservoirMax: 200
  })))

  // === ESTADO (FROTA DE ELEVADORES/CARRINHOS INDEPENDENTES) ===
  const elevators = ref([
    { id: 1, status: 'IDLE', targetMineId: null, currentLoad: 0, cartCapacity: 200, resourceId: null, travelTimer: 0, totalTravelTime: 0 },
    { id: 2, status: 'IDLE', targetMineId: null, currentLoad: 0, cartCapacity: 200, resourceId: null, travelTimer: 0, totalTravelTime: 0 }
  ])

  const assignedWorkerIds = computed(() => {
    const ids = []
    mines.value.forEach(m => { m.slots.forEach(slot => { if (slot) ids.push(slot) }) })
    return ids
  })

  // === ACTIONS: TRABALHADORES ===
  function assignWorker(mineId, slotIndex, workerId) {
    const mine = mines.value.find(m => m.id === mineId)
    if (!mine) return
    const worker = gameStore.workers.find(w => w.id === workerId)
    if (!worker || worker.jobKey !== 'minerador') return

    mines.value.forEach(m => {
      if (m.slots.includes(workerId)) {
        const idx = m.slots.indexOf(workerId)
        m.slots[idx] = null
      }
    })

    const oldWorkerId = mine.slots[slotIndex]
    if (oldWorkerId) {
      const oldWorker = gameStore.workers.find(w => w.id === oldWorkerId)
      if (oldWorker) oldWorker.assignment = null
    }

    mine.slots[slotIndex] = workerId
    worker.assignment = 'Minerador'
  }

  function removeWorker(mineId, slotIndex) {
    const mine = mines.value.find(m => m.id === mineId)
    if (mine) {
      const oldWorkerId = mine.slots[slotIndex]
      if (oldWorkerId) {
        const oldWorker = gameStore.workers.find(w => w.id === oldWorkerId)
        if (oldWorker) oldWorker.assignment = null
      }
      mine.slots[slotIndex] = null
    }
  }

  // === ACTIONS: DESPACHO DOS CARRINHOS ===
  function dispatchElevator(mineId) {
    const mine = mines.value.find(m => m.id === mineId)
    if (!mine || mine.reservoirLoad < 1) return

    const currentStock = gameStore.inventory[mineId] || 0
    if (currentStock >= gameStore.maxStorage) return

    // Verifica se JÁ EXISTE algum carrinho com destino a esta mina
    const isAlreadyOnWay = elevators.value.some(e => e.targetMineId === mineId)
    if (isAlreadyOnWay) return // Se já tem um indo, carregando ou voltando de lá, cancela!

    const freeElevator = elevators.value.find(e => e.status === 'IDLE')
    if (!freeElevator) return 

    freeElevator.targetMineId = mineId
    freeElevator.status = 'MOVING_DOWN'
    const travelTime = (mine.depthIndex + 1) * 10 
    freeElevator.travelTimer = travelTime
    freeElevator.totalTravelTime = travelTime
  }

  function collectElevators() {
    elevators.value.forEach(el => {
      if (el.status === 'READY') {
        const resourceKey = el.resourceId
        const currentStock = gameStore.inventory[resourceKey] || 0
        const spaceLeft = Math.max(0, gameStore.maxStorage - currentStock)
        
        // Coleta apenas o que cabe na vila
        const amountToCollect = Math.min(el.currentLoad, spaceLeft)
        gameStore.inventory[resourceKey] += amountToCollect
        
        // SEGURANÇA 3: Reseta a carga do carrinho SEMPRE, descartando qualquer excesso
        el.currentLoad = 0
        el.status = 'IDLE'
        el.targetMineId = null
        el.resourceId = null
      }
    })
  }

  // === O LOOP PRINCIPAL (TICK) ===
  function miningTick() {
    mines.value.forEach(mine => {
      // SEGURANÇA: Desbuga saves antigos caso a produção tenha ficado 'NaN' ou nula
      if (isNaN(mine.reservoirLoad) || mine.reservoirLoad === null) {
        mine.reservoirLoad = 0;
      }

      // Se o silo da mina já está cheio, ignora o cálculo
      if (mine.reservoirLoad >= mine.reservoirMax) return

      let production = 0
      const resourceInfo = RECURSOS_MINERACAO[mine.id]
      const hardness = resourceInfo ? resourceInfo.dureza : 1

      mine.slots.forEach((workerId, index) => {
        if (!workerId) return
        
        const requiredLvl = index === 0 ? resourceInfo.unlockLvl : resourceInfo.fullUnlockLvl
        if (gameStore.miningLevel < requiredLvl) return

        const worker = gameStore.workers.find(w => w.id === workerId)
        
        if (worker) {
          // AÇÃO CONTRA GREVE: Se estiver de greve, tira ele do slot da mina!
          if (worker.strikeDays > 0) {
            mine.slots[index] = null
            worker.assignment = null // Tira o crachá de trabalhador
            return
          }
          // AÇÃO CONTRA GREVE OU ACIDENTE: Se estiver de greve ou no hospital, tira ele do slot da mina!
          if (worker.strikeDays > 0 || worker.injury) {
            mine.slots[index] = null
            worker.assignment = null // Tira o crachá de trabalhador
            return
          }          
          // SE ESTÁ TUDO BEM: Calcula a produção normalmente
          production += (worker.efficiency / 10) / hardness
        }
      })

      // Adiciona o que foi produzido ao silo e trava no máximo
      mine.reservoirLoad += production
      if (mine.reservoirLoad > mine.reservoirMax) mine.reservoirLoad = mine.reservoirMax
    })

    // LÓGICA DE MOVIMENTAÇÃO DOS ELEVADORES
    elevators.value.forEach(el => {
      if (el.status === 'MOVING_DOWN') {
        el.travelTimer--
        if (el.travelTimer <= 0) el.status = 'LOADING'
      } 
      else if (el.status === 'LOADING') {
        const mine = mines.value.find(m => m.id === el.targetMineId)
        if (mine) {
           const currentStock = gameStore.inventory[mine.id] || 0
           const spaceLeftInVillage = Math.max(0, gameStore.maxStorage - currentStock)
           
           const spaceInElevator = el.cartCapacity - el.currentLoad
           const effectiveSpaceForThisCart = Math.max(0, spaceLeftInVillage - el.currentLoad)

           // SEGURANÇA 2: O carrinho só pega o mínimo entre: 
           // 10 (velocidade), o que tem no silo, o que cabe no carrinho E o que cabe na VILA!
           const amountToTake = Math.min(10, mine.reservoirLoad, spaceInElevator, effectiveSpaceForThisCart)
           
           mine.reservoirLoad -= amountToTake
           el.currentLoad += amountToTake
           el.resourceId = mine.id
           
           // Sobe se o carrinho encher, o silo secar, ou a capacidade da vila atingir o limite
           if (el.currentLoad >= el.cartCapacity || mine.reservoirLoad <= 0 || el.currentLoad >= spaceLeftInVillage) {
              el.status = 'MOVING_UP'
              el.travelTimer = el.totalTravelTime
           }
        } else {
           el.status = 'MOVING_UP'
           el.travelTimer = el.totalTravelTime
        }
      }
      else if (el.status === 'MOVING_UP') {
        el.travelTimer--
        if (el.travelTimer <= 0) el.status = 'READY'
      }
    })
  }

  function loadMining() {
    const saved = localStorage.getItem('mythic_mining_save')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.mines) {
        data.mines.forEach(savedMine => {
          const mine = mines.value.find(m => m.id === savedMine.id)
          if (mine) {
            mine.slots = savedMine.slots
            mine.reservoirLoad = savedMine.reservoirLoad || 0
          }
        })
      }
      if (data.elevators) elevators.value = data.elevators
    } else {
      gameStore.workers.forEach(w => { if (w.assignment === 'Minerador') w.assignment = null })
    }
  }

  watch(() => ({ mines: mines.value, elevators: elevators.value }), (newState) => {
    localStorage.setItem('mythic_mining_save', JSON.stringify(newState))
  }, { deep: true })

  return {
    mines, elevators, assignedWorkerIds,
    assignWorker, removeWorker, dispatchElevator, collectElevators, miningTick, loadMining
  }
})