import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useGameStore } from './gameStore'

export const useForgeStore = defineStore('forge', () => {
  const gameStore = useGameStore()
  
  const workerId = ref(null)

  // Descobre quem é o funcionário exato
  const currentWorker = computed(() => {
    if (!workerId.value) return null
    return gameStore.workers.find(w => w.id === workerId.value) || null
  })

  // Calcula a eficiência real do ferreiro usando a calculadora oficial do jogo (que considera greves, buffs, etc)
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

  // ==========================================
  // O MOTOR DE RNG (DADO VICIADO)
  // ==========================================
  function rolarDadoViciado(min, max, eficiencia) {
    if (min === max) return min // Se o valor for fixo, não rola dado
    
    // A curva matemática: quanto mais eficiência, mais ele "puxa" pro valor máximo
    const pesoDaCurva = 1 + (eficiencia / 150)
    const rolagemPura = Math.random()
    const rolagemViciada = Math.pow(rolagemPura, 1 / pesoDaCurva)
    
    return Math.floor(min + (rolagemViciada * (max - min + 1)))
  }

  // ==========================================
  // A FUNÇÃO PRINCIPAL DE CRAFT
  // ==========================================
  function craftItem(projeto) {
    if (!workerId.value) {
      return { success: false, msg: "A forja precisa de um Ferreiro para operar." }
    }

    // PASSO 1: Verificar se o jogador tem o dinheiro e os materiais
    for (const mat of projeto.custo) {
      if (mat.tipo === 'recurso') { // Ouro, Mythic Coins...
         if (gameStore.resources[mat.id] < mat.qtd) {
            return { success: false, msg: `Saldo insuficiente de ${mat.nome}.` }
         }
      } else if (mat.tipo === 'inventario') { // Minérios, Couro, etc...
         const qtdAtual = gameStore.inventory[mat.id] || 0
         if (qtdAtual < mat.qtd) {
            return { success: false, msg: `Material insuficiente: ${mat.nome}.` }
         }
      }
    }

    // PASSO 2: Cobrar os custos (já que confirmamos que ele tem tudo)
    for (const mat of projeto.custo) {
      if (mat.tipo === 'recurso') {
         gameStore.resources[mat.id] -= mat.qtd
      } else if (mat.tipo === 'inventario') {
         gameStore.inventory[mat.id] -= mat.qtd
      }
    }

    // PASSO 3: Rolar os dados e gerar o equipamento único!
    const statsRolados = []
    for (const statBase of projeto.stats) {
      const valorFinal = rolarDadoViciado(statBase.min, statBase.max, currentEfficiency.value)
      statsRolados.push({
        id: statBase.id,
        nome: statBase.nome,
        icone: statBase.icone,
        valor: valorFinal // O item final tem um valor fixo, não mais um "min/max"
      })
    }

    // Cria o documento oficial do novo item
    const equipamentoPronto = {
      idUnico: 'eqp_' + Date.now(), // Uma identidade única para este item (ex: eqp_1708643200)
      idProjeto: projeto.id,
      nome: projeto.nome,
      tipo: projeto.tipo,
      level: projeto.level,
      img: projeto.img,
      stats: statsRolados,
      criador: currentWorker.value.name
    }

    // PASSO 4: Guardar o equipamento no baú do jogador
    if (!gameStore.equipments) {
       gameStore.equipments = [] // Se a gaveta não existir, cria na hora
    }
    gameStore.equipments.unshift(equipamentoPronto)

    return { success: true, item: equipamentoPronto }
  }

  // Carregar dados salvos
  function loadForge() {
    const saved = localStorage.getItem('mythic_forge_save')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.workerId) {
        workerId.value = data.workerId
        const w = gameStore.workers.find(x => x.id === workerId.value)
        if (w) w.assignment = 'Ferreiro'
      }
    }
  }

  watch(() => ({ workerId: workerId.value }), (newState) => {
    localStorage.setItem('mythic_forge_save', JSON.stringify(newState))
  }, { deep: true })

  return { workerId, currentWorker, currentEfficiency, assignWorker, craftItem, loadForge }
})