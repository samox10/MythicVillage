// Este arquivo contém apenas as regras matemáticas e definições do jogo.

// 1. Definição das Profissões
export const PROFISSOES = {
  minerador: { m: 'Minerador', f: 'Mineradora' },
  lenhador: { m: 'Lenhador', f: 'Lenhadora' },
  batedor: { m: 'Batedor', f: 'Batedora' },
  medico: { m: 'Médico', f: 'Médica' },
  ferreiro: { m: 'Ferreiro', f: 'Ferreira' },
  dissecador: { m: 'Dissecador', f: 'Dissecadora' },
  tesoureiro: { m: 'Tesoureiro', f: 'Tesoureira' },
  transportador: { m: 'Transportador', f: 'Transportadora' },
  pesquisador: { m: 'Pesquisador', f: 'Pesquisadora' },
  administrador: { m: 'Administrador', f: 'Administradora' },
  alquimista: { m: 'Alquimista', f: 'Alquimista' },
  mestreguilda: { m: 'Mestre da Guilda', f: 'Mestre da Guilda'}
}

export const RACAS = ['automato', 'corvido', 'draconiano', 'elfo', 'espectral', 'humano', 'lobisomem', 'serpentideo', 'sombrineo', 'tiefling']

// 2. Cores e Definições de Tier (Resolve o problema das cores)
export const TIER_CONFIG = {
  'F': { minEff: 2, maxEff: 8, salary: 50, color: 'gray', hex: '#64748b' },
  'E': { minEff: 6, maxEff: 14, salary: 80, color: 'gray', hex: '#94a3b8' },
  'D': { minEff: 12, maxEff: 20, salary: 120, color: 'green', hex: '#10b981' },
  'C': { minEff: 18, maxEff: 28, salary: 180, color: 'blue', hex: '#2dd4bf' },
  'B': { minEff: 25, maxEff: 38, salary: 250, color: 'blue', hex: '#38bdf8' },
  'A': { minEff: 35, maxEff: 50, salary: 400, color: 'purple', hex: '#a855f7' },
  'S': { minEff: 48, maxEff: 70, salary: 700, color: 'gold', hex: '#ffd700' },
  'SS': { minEff: 68, maxEff: 100, salary: 1200, color: 'red', hex: '#ff003c' }
}

// 3. Probabilidades Base (Sem Admin, Nível 1)
export const BASE_DROP_RATES = {
  'SS': 0.1, 'S': 0.5, 'A': 2.0, 'B': 8.0,
  'C': 18.0, 'D': 25.0, 'E': 25.0, 'F': 21.4
}

// 4. Configuração de Balanceamento de Drop (O "META" do Jogo)
export const DROP_RATE_META = {
  // Poder do Shift (Quanto % sai do Tier F/E e vai para cima)
  shiftPerLevel: 2.0, // Reduzi levemente para 2.0% por nível (antes 2.5%)
  shiftPerAdmin: 15.0, // Admin 100% continua movendo 15%
  
  // QUEM SOFRE O NERF? (Pesos de quem perde probabilidade)
  losersWeights: { 
    'F': 0.70, // F perde muito rápido
    'E': 0.30  // E perde o resto
  },

  // QUEM GANHA O BÔNUS? (Distribuição do Shift)
  // Isso impede que o Tier S ganhe 10% de uma vez.
  // Aqui definimos a "fatia do bolo" que cada um recebe.
  bonusDistribution: {
    'D': 15, // Ganha um pouco
    'C': 25, // Ganha bem
    'B': 35, // O GRANDE VENCEDOR (Meta do mid-game)
    'A': 15, // Ganha razoável
    'S': 8,  // Ganha pouco (Dificulta o S)
    'SS': 2  // Ganha migalhas (Mantém o SS lendário)
  }
}

// 5. Regras de Desbloqueio por Nível
export const TIER_ORDER = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS']

export const UNLOCK_THRESHOLDS = {
  1: 'E', // Nível 1 libera até E (F, E)
  2: 'C', // Nível 2 libera até C (F, E, D, C)
  3: 'A', // Nível 3 libera até A
  4: 'S', // Nível 4 libera até S
  5: 'SS' // Nível 5 libera TUDO
}