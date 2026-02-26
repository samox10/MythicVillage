import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useGameStore } from './gameStore'

export const useForgeStore = defineStore('forge', () => {
  const gameStore = useGameStore()
  
  const workerId = ref(null)
  
  // A Memória do item que está sendo forjado no momento
  const activeCraft = ref({
    projeto: null,
    progress: 0,
    totalTime: 0
  })

  // A Bandeja de itens prontos esperando você coletar
  const readyItem = ref(null)

  const currentWorker = computed(() => {
    if (!workerId.value) return null
    return gameStore.workers.find(w => w.id === workerId.value) || null
  })

  const currentEfficiency = computed(() => {
    const worker = currentWorker.value
    if (!worker) return 0
    const stats = gameStore.getWorkerStats(worker)
    return stats.efficiency || 0
  })

  function assignWorker(id) {
    if (workerId.value) {
      const oldW = gameStore.workers.find(w => w.id === workerId.value)
      if (oldW) oldW.assignment = null
    }
    if (workerId.value === id) { 
      workerId.value = null 
    } else {
      workerId.value = id
      const newW = gameStore.workers.find(w => w.id === id)
      if (newW) newW.assignment = 'Ferreiro'
    }
  }

  function rolarDadoViciado(min, max, eficiencia) {
    if (min === max) return min
    const pesoDaCurva = 1 + (eficiencia / 150)
    const rolagemPura = Math.random()
    const rolagemViciada = Math.pow(rolagemPura, 1 / pesoDaCurva)
    return Math.floor(min + (rolagemViciada * (max - min + 1)))
  }

  // NOVA FUNÇÃO: Apenas cobra os itens e coloca na fila de tempo
  function startCraft(projeto) {
    if (!workerId.value) return { success: false, msg: "Falta Ferreiro." }
    if (activeCraft.value.projeto) return { success: false, msg: "A bigorna já está em uso." }
    if (readyItem.value) return { success: false, msg: "Colete o item pronto primeiro." }

    // Cobrar os custos
    for (const mat of projeto.custo) {
      if (mat.tipo === 'recurso') {
         if (gameStore.resources[mat.id] < mat.qtd) return { success: false, msg: `Falta ${mat.nome}.` }
      } else if (mat.tipo === 'inventario') {
         if ((gameStore.inventory[mat.id] || 0) < mat.qtd) return { success: false, msg: `Falta ${mat.nome}.` }
      }
    }

    for (const mat of projeto.custo) {
      if (mat.tipo === 'recurso') gameStore.resources[mat.id] -= mat.qtd
      else gameStore.inventory[mat.id] -= mat.qtd
    }

    // Coloca na bigorna
    activeCraft.value = {
      projeto: projeto,
      progress: 0,
      totalTime: projeto.tempoBase
    }

    return { success: true }
  }

  // NOVA FUNÇÃO: O Motor que o jogo vai chamar todo segundo
  function forgeTick() {
    // Se não tem projeto na bigorna, ou não tem ferreiro (ou ele ta de greve/doente), para.
    if (!activeCraft.value.projeto) return
    if (!currentWorker.value || (currentWorker.value.strikeDays || 0) > 0 || currentWorker.value.injury) return

    // Velocidade baseada na eficiência (100 de ef = 1x de velocidade)
    const speedMultiplier = Math.max(0.1, currentEfficiency.value / 100)
    
    activeCraft.value.progress += (1 * speedMultiplier)

    // Terminou de forjar?
    if (activeCraft.value.progress >= activeCraft.value.totalTime) {
      finalizarItem()
    }
  }

  // Função interna que rola os dados e joga o item pra bandeja
  function finalizarItem() {
    const projeto = activeCraft.value.projeto
    const statsRolados = []
    
    for (const statBase of projeto.stats) {
      const valorFinal = rolarDadoViciado(statBase.min, statBase.max, currentEfficiency.value)
      statsRolados.push({ id: statBase.id, nome: statBase.nome, icone: statBase.icone, valor: valorFinal })
    }

    readyItem.value = {
      idUnico: 'eqp_' + Date.now(),
      idProjeto: projeto.id,
      nome: projeto.nome,
      tipo: projeto.tipo,
      level: projeto.level,
      img: projeto.img,
      stats: statsRolados,
      criador: currentWorker.value.name
    }

    // Limpa a bigorna
    activeCraft.value = { projeto: null, progress: 0, totalTime: 0 }
  }

  // NOVA FUNÇÃO: O jogador clica no botão para pegar o item e jogar no baú
  function collectItem() {
    if (!readyItem.value) return
    if (!gameStore.equipments) gameStore.equipments = []
    
    gameStore.equipments.unshift(readyItem.value)
    readyItem.value = null // Limpa a bandeja
  }

  function loadForge() {
    const saved = localStorage.getItem('mythic_forge_save_v2')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.workerId) {
        workerId.value = data.workerId
        const w = gameStore.workers.find(x => x.id === workerId.value)
        if (w) w.assignment = 'Ferreiro'
      }
      if (data.activeCraft) activeCraft.value = data.activeCraft
      if (data.readyItem) readyItem.value = data.readyItem
    }
  }

  watch(() => ({ workerId: workerId.value, activeCraft: activeCraft.value, readyItem: readyItem.value }), (newState) => {
    localStorage.setItem('mythic_forge_save_v2', JSON.stringify(newState))
  }, { deep: true })

  return { workerId, currentWorker, currentEfficiency, activeCraft, readyItem, assignWorker, startCraft, forgeTick, collectItem, loadForge }
})