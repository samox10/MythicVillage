import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { TIER_CONFIG, TIER_ORDER } from '../data/balancing'

export const useGameStore = defineStore('game', () => {
  
  // === ESTADO (Dados do Jogo) ===
  const resources = ref({ mythicCoin: 100, goldCoin: 10000000 })
  const dailyHires = ref(0)

  const inventory = ref({
    pedra: 0, ferro: 0, cobre: 0, ouro_min: 0, cristal: 0, obsidiana: 0,
    rubi: 0, safira: 0, esmeralda: 0, mithril: 0, adamantium: 0, oricalco: 0
  })
  const workers = ref([]) 
  const buildings = ref([
    { id: 1, key: 'castelo', level: 1 },
    { id: 2, key: 'armazem', level: 1 },
    { id: 3, key: 'hospedagem', level: 1 },
    { id: 4, key: 'centrorecrutamento', level: 1 },
    { id: 5, key: 'mina', level: 1 }
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

  const maxPopulation = computed(() => {
    // Procura o prédio 'hospedagem' (ID 3 ou key 'hospedagem')
    const b = buildings.value.find(x => x.key === 'hospedagem')
    const lvl = b ? b.level : 1
    // Fórmula: 10 base + 2 por nível (Mesma regra visual do VilaView)
    return 10 + (lvl * 2)
  })
  const maxStorage = computed(() => {
    const b = buildings.value.find(x => x.key === 'armazem')
    const lvl = b ? b.level : 1
    return 1000 + (lvl * 500) // Fórmula do Armazém (Base 1000 + 500 por nível)
  })
  const miningLevel = computed(() => {
    const b = buildings.value.find(x => x.key === 'mina')
    return b ? b.level : 1
  })

  // === HELPER: Cálculo de Eficiência Dinâmica ===
  function getWorkerStats(worker) {
    // Tabela de Penalidade por Dias de Greve (0 a 5+)
    // Dia 0: 0%, Dia 1: 10%, Dia 2: 20%, Dia 3: 35%, Dia 4: 50%, Dia 5: 100%
    const strikePenalties = [0, 0.10, 0.20, 0.35, 0.50, 1.00]
    
    const days = worker.strikeDays || 0
    const penaltyIndex = Math.min(days, 5) // Trava no dia 5
    const penaltyPct = strikePenalties[penaltyIndex]

    // 1. Base (Valor original salvo no boneco)
    let currentEff = worker.efficiency

    // 2. Buff de Raça (Exemplo: Automato +5%)
    // Só aplica se NÃO estiver em greve (days === 0)
    let racialBonus = 0
    if (days === 0 && worker.race === 'automato') {
      racialBonus = 5 // Valor fixo ou percentual, ajustável
      // Nota: No seu código atual o bônus já foi somado na criação. 
      // Para este sistema funcionar perfeitamente, o ideal seria salvar 'baseEfficiency' separadamente.
      // Vou assumir que o valor salvo JÁ É com bônus, então na greve vamos penalizar esse total.
    }

    // 3. Aplica a Penalidade da Greve
    const loss = Math.floor(currentEff * penaltyPct)
    const finalEff = Math.max(0, currentEff - loss)

    return {
      finalEff,
      loss,
      penaltyPct: (penaltyPct * 100).toFixed(0),
      isStriking: days > 0
    }
  }

  // === ACTIONS (Ações) ===

  // 1. Contratar
  function hireWorker(worker) {
    if (resources.value.goldCoin < 500) return false
    resources.value.goldCoin -= 500
    workers.value.unshift(worker)
    dailyHires.value++
    return true
  }

  // 2. Demitir (Com Verificação de Segurança)
  function fireWorker(id) {
    // REGRA 1: Verificar se é Administrador
    if (adminId.value === id) {
      return { success: false, msg: "Este funcionário é o Administrador! Remova-o do cargo antes de demitir." }
    }

    // REGRA 2 (Futuro): Aqui você poderá adicionar verificações se ele está trabalhando em prédio, em missão, etc.
    // Exemplo: if (isWorkingInBuilding(id)) return { success: false, msg: "Trabalhando..." }

    // Se passou pelas regras, executa a demissão
    workers.value = workers.value.filter(w => w.id !== id)
    return { success: true, msg: "Funcionário demitido." }
  }
  function setAdmin(id) {
    // 1. Se já existe alguém no cargo, tira o crachá dele primeiro
    if (adminId.value) {
      const currentAdmin = workers.value.find(w => w.id === adminId.value)
      if (currentAdmin) currentAdmin.assignment = null
    }

    // 2. Lógica de Troca
    if (adminId.value === id) {
      // Se clicou no mesmo cara, está demitindo (já tiramos o crachá acima)
      adminId.value = null
    } else {
      // Se é um novo, define o ID e entrega o crachá
      adminId.value = id
      const newAdmin = workers.value.find(w => w.id === id)
      if (newAdmin) newAdmin.assignment = 'Administrador'
    }
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

  // 4. Salário (Sistema Inteligente com Greve)
  // 4. Salário (Atualizado com Acúmulo de Dívida - Teto 5 Dias)
  function paySalaries() {
    dailyHires.value = 0
    let budget = resources.value.goldCoin
    let totalPaid = 0

    // Ordenação: Tier Maior > Eficiência Maior
    const payQueue = [...workers.value].sort((a, b) => {
      const pesoA = TIER_ORDER.indexOf(a.tier)
      const pesoB = TIER_ORDER.indexOf(b.tier)
      if (pesoA !== pesoB) return pesoB - pesoA 
      return b.efficiency - a.efficiency 
    })

    payQueue.forEach(worker => {
      const realWorker = workers.value.find(w => w.id === worker.id)
      if (!realWorker) return

      // CÁLCULO DO CUSTO:
      // Se dias de greve > 0, paga o acumulado (limitado a 5). Se 0, paga 1 salário normal.
      const daysOwed = realWorker.strikeDays > 0 ? Math.min(realWorker.strikeDays, 5) : 1
      const cost = realWorker.salary * daysOwed

      if (budget >= cost) {
        // PAGOU
        budget -= cost
        totalPaid += cost
        realWorker.strikeDays = 0 
        realWorker.paidThisTurn = true 
      } else {
        // NÃO PAGOU
        realWorker.strikeDays = (realWorker.strikeDays || 0) + 1
        realWorker.paidThisTurn = false
        console.log(`${realWorker.name} greve dia ${realWorker.strikeDays} (Devendo: ${cost}G)`)
      }
    })

    resources.value.goldCoin = budget
    if (totalPaid > 0) console.log(`Salários pagos: -${totalPaid} G`)
  }

  // Ação: Pagamento Manual (Com Teto de 5 Dias)
  function manualPay(id) {
    const w = workers.value.find(x => x.id === id)
    if (!w) return { success: false, msg: "Trabalhador não encontrado." }

    // CÁLCULO DO CUSTO:
    // Pega o menor valor entre: Dias de Greve OU 5.
    // Ex: Se greve for 10 dias, cobra 5. Se for 2 dias, cobra 2.
    const daysOwed = w.strikeDays > 0 ? Math.min(w.strikeDays, 5) : 1
    const totalCost = w.salary * daysOwed

    if (resources.value.goldCoin >= totalCost) {
      resources.value.goldCoin -= totalCost
      w.strikeDays = 0 // Limpa a greve
      return { success: true, msg: `Dívida quitada! Pago ${totalCost} G para ${w.name}.` }
    } else {
      return { success: false, msg: `Ouro insuficiente.\n Necessário: ${totalCost} G para quitar os dias de salários atrasados.` }
    }
  }

  // Atualização da Demissão (Proteção de Greve)
  function fireWorker(id) {
    const w = workers.value.find(x => x.id === id)
    
    // REGRA 1: Admin
    if (adminId.value === id) {
      return { success: false, msg: "Este funcionário é o Administrador! Remova-o do cargo antes de demitir." }
    }

    // REGRA 2: Greve (NOVO)
    if (w && w.strikeDays > 0) {
      return { success: false, msg: "GREVE ATIVA: As leis trabalhistas da vila proíbem demitir funcionários em greve. Pague os salários atrasados primeiro." }
    }

    workers.value = workers.value.filter(w => w.id !== id)
    return { success: true, msg: "Funcionário demitido." }
  }

  // === SAVE SYSTEM ===
  function loadGame() {
    const saved = localStorage.getItem('mythic_save_v2')
    if (saved) {
      const data = JSON.parse(saved)
      
      // Carrega recursos e inventário normalmente
      resources.value = data.resources
      inventory.value = data.inventory || { pedra: 0, ferro: 0, cobre: 0, ouro_min: 0, cristal: 0, obsidiana: 0, rubi: 0, safira: 0, esmeralda: 0, mithril: 0, adamantium: 0, oricalco: 0 }
      workers.value = data.workers
      adminId.value = data.adminId
      if (adminId.value) {
        const adminWorker = workers.value.find(w => w.id === adminId.value)
        if (adminWorker) adminWorker.assignment = 'Administrador'
      }
      dailyHires.value = data.dailyHires || 0

      // === CORREÇÃO DO BUG DA MINA AQUI ===
      // Em vez de 'buildings.value = data.buildings', fazemos um merge:
      if (data.buildings) {
        data.buildings.forEach(savedBuilding => {
          // Procura o prédio na lista ATUAL do código
          const existingBuilding = buildings.value.find(b => b.id === savedBuilding.id)
          
          // Se ele existir, atualiza o nível
          if (existingBuilding) {
            existingBuilding.level = savedBuilding.level
          }
        })
        // Prédios novos (como a Mina ID 5) não serão apagados,
        // eles manterão o nível 1 definido no início do arquivo.
      }
    }
  }

  watch([resources, workers, buildings, adminId, dailyHires, inventory], () => {
    localStorage.setItem('mythic_save_v2', JSON.stringify({
      resources: resources.value,
      workers: workers.value,
      buildings: buildings.value,
      adminId: adminId.value,
      inventory: inventory.value,
      dailyHires: dailyHires.value
    }))
  }, { deep: true })

  return {
    resources, inventory, workers, buildings, adminId, dailyHires, miningLevel,
    currentAdmin, recruitmentLevel, maxPopulation, maxStorage,
    hireWorker, fireWorker, setAdmin, paySalaries, manualPay,
    spendResources, upgradeBuilding, loadGame, getWorkerStats
  }
})