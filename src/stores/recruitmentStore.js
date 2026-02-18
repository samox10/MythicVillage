import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGameStore } from './gameStore'
import { 
  PROFISSOES, RACAS, TIER_CONFIG, PROBABILIDADE_POR_NIVEL, 
  DROP_RATE_META, TIER_ORDER, NOMES_M, NOMES_F, SOBRENOMES 
} from '../data/balancing'

export const useRecruitmentStore = defineStore('recruitment', () => {
  
  // 1. CONEXÃO COM A DIRETORIA (GameStore)
  // Precisamos acessar o dinheiro e a população da vila
  const gameStore = useGameStore()

  // 2. ESTADO LOCAL (Memória do RH)
  const newHire = ref(null)      // Guarda o último contratado para mostrar no modal
  const errorMessage = ref('')   // Guarda mensagens de erro (sem dinheiro, lotado)

  // === HELPER FUNCTIONS (Ferramentas Internas) ===
  // Eram locais no arquivo antigo, agora ficam aqui
  const sanitize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]

  // 3. GETTERS (Cálculos Matemáticos)
  
  // A famosa tabela de Drop Rate (Copiada e adaptada)
  const dropRateTable = computed(() => {
    const adminEff = gameStore.currentAdmin ? gameStore.currentAdmin.efficiency : 0
    
    let lvl = gameStore.recruitmentLevel || 1
    if (lvl > 10) lvl = 10
    if (lvl < 1) lvl = 1
    
    // Pega a probabilidade base
    let currentRates = { ...PROBABILIDADE_POR_NIVEL[lvl] }

    // Aplica o Bônus do Administrador
    const totalShift = (adminEff / 100) * DROP_RATE_META.shiftPerAdmin
    
    if (totalShift > 0) {
      const unlockedTiers = TIER_ORDER.filter(t => currentRates[t] > 0)
      let validGainers = DROP_RATE_META.bonusTargetPreference.filter(t => unlockedTiers.includes(t))

      if (validGainers.length === 0) {
        const highestUnlocked = unlockedTiers[unlockedTiers.length - 1]
        if (highestUnlocked && highestUnlocked !== 'F') {
           validGainers = [highestUnlocked]
        }
      }

      let validLosers = unlockedTiers.filter(t => !validGainers.includes(t))

      if (validGainers.length > 0 && validLosers.length > 0) {
        const lossPerTier = totalShift / validLosers.length 
        let lossPot = 0
        
        validLosers.forEach(tier => {
          const actualLoss = Math.min(currentRates[tier], lossPerTier)
          currentRates[tier] -= actualLoss
          lossPot += actualLoss
        })

        const gainPerTier = lossPot / validGainers.length
        validGainers.forEach(tier => {
          currentRates[tier] += gainPerTier
        })
      }
    }

    // Retorna a lista formatada para o visual
    return TIER_ORDER.slice().reverse().map(tier => {
      const baseVal = PROBABILIDADE_POR_NIVEL[lvl][tier]
      const realVal = currentRates[tier]
      const diff = realVal - baseVal
      const isLocked = baseVal === 0 && realVal === 0

      return {
        tier,
        base: baseVal.toFixed(2),
        real: realVal.toFixed(2),
        diff: diff.toFixed(2),
        diffSign: diff > 0 ? '+' : '',
        isBuffed: diff > 0.05,
        isNerfed: diff < -0.05,
        isLocked: isLocked,
        // Adicionei a cor aqui para facilitar o uso no frontend depois
        color: tier
      }
    })
  })

  // 4. ACTIONS (Ações de Recrutamento)

  // Função interna que gera os dados do boneco (Privada ao Store)
  const _generateRecruitData = (forcedJob = null) => {
    // Validação de População
    if (gameStore.workers.length >= gameStore.maxPopulation) {
      throw new Error(`População Máxima Atingida (${gameStore.maxPopulation}) - Construa mais Estalagens`)
    }

    // Validação de Ouro
    if (gameStore.resources.goldCoin < 500) {
      throw new Error("Recursos Insuficientes: A contratação requer 500 G.")
    }

    // Gerar Nome RPG
    const race = randomItem(RACAS)
    const sex = randomItem(['m', 'f'])
    const firstName = sex === 'm' ? randomItem(NOMES_M) : randomItem(NOMES_F)
    const lastName = randomItem(SOBRENOMES)
    const fullName = `${firstName} ${lastName}`

    const jobKey = forcedJob || randomItem(Object.keys(PROFISSOES))
    const jobTitle = PROFISSOES[jobKey][sex] 
    
    // Roleta de Tiers
    const rates = dropRateTable.value // Usa o getter calculado acima
    const totalWeight = rates.reduce((sum, r) => sum + parseFloat(r.real), 0)
    let randomNum = Math.random() * totalWeight
    
    let selectedTier = 'F' 
    for (const rate of rates) {
      randomNum -= parseFloat(rate.real)
      if (randomNum <= 0) {
        selectedTier = rate.tier
        break
      }
    }
    
    const config = TIER_CONFIG[selectedTier]
    let efficiency = randomRange(config.minEff, config.maxEff)
    if (race === 'automato') efficiency += 5 
    
    const avatarUrl = `/assets/faces/${sanitize(race)}/${jobKey}_${sex}.png`

    return { 
      id: Date.now() + Math.random(), 
      name: fullName,
      race,
      sex: sex === 'm' ? 'Masculino' : 'Feminino', 
      jobKey, jobTitle, tier: selectedTier, efficiency, 
      happiness: 100,
      strikeDays: 0,
      assignment: null,
      salary: config.salary, 
      avatarUrl
    }
  }

  // Ação Pública: Tentar Contratar
  function recruitWorker(jobKey) {
    errorMessage.value = '' // Limpa erros antigos
    
    try {
      // 1. Gera os dados (pode dar erro se faltar dinheiro/pop)
      const worker = _generateRecruitData(jobKey)
      
      // 2. Chama a Diretoria (GameStore) para efetivar a contratação
      // O gameStore desconta o dinheiro e adiciona na lista oficial
      const success = gameStore.hireWorker(worker)
      
      if (success) {
        newHire.value = worker // Salva no estado local para mostrar o modal
        return true
      } else {
        // Caso raro onde o GameStore recusa por outro motivo
        errorMessage.value = "Erro desconhecido ao processar contratação."
        return false
      }

    } catch (error) {
      // Pega o erro (ex: "Sem dinheiro") e salva para a tela ver
      errorMessage.value = error.message
      return false
    }
  }

  function clearNewHire() {
    newHire.value = null
  }

  function clearError() {
    errorMessage.value = ''
  }

  return {
    // State
    newHire,
    errorMessage,
    // Getters
    dropRateTable,
    // Actions
    recruitWorker,
    clearNewHire,
    clearError
  }
})