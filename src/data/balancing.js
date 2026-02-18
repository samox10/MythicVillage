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
  'F': { minEff: 5,   maxEff: 20,  salary: 50,   hex: '#64748b' }, // Cinza Pedra
  'E': { minEff: 15,  maxEff: 40,  salary: 80,   hex: '#b45309' }, // Bronze
  'D': { minEff: 35,  maxEff: 75,  salary: 120,  hex: '#10b981' }, // Verde
  'C': { minEff: 70,  maxEff: 110, salary: 180,  hex: '#06b6d4' }, // Ciano
  'B': { minEff: 105, maxEff: 160, salary: 250,  hex: '#3b82f6' }, // Azul Real
  'A': { minEff: 155, maxEff: 210, salary: 400,  hex: '#a855f7' }, // Roxo
  'S': { minEff: 205, maxEff: 310, salary: 700,  hex: '#eab308' }, // Dourado
  'SS':{ minEff: 305, maxEff: 400, salary: 1200, hex: '#ef4444' }  // Vermelho Sangue
}

// 3. Probabilidades por Nível (A CURVA DESLIZANTE)
// Aqui definimos manualmente a chance de cada nível.
export const PROBABILIDADE_POR_NIVEL = {
  1:  { 'SS': 0,    'S': 0,    'A': 0,    'B': 0,    'C': 0,    'D': 0,    'E': 0,    'F': 100.0 },
  2:  { 'SS': 0,    'S': 0,    'A': 0,    'B': 0,    'C': 0,    'D': 0,    'E': 30.0, 'F': 70.0 },
  3:  { 'SS': 0,    'S': 0,    'A': 0,    'B': 0,    'C': 0,    'D': 15.0, 'E': 35.0, 'F': 50.0 },
  4:  { 'SS': 0,    'S': 0,    'A': 0,    'B': 3.0,  'C': 12.0, 'D': 25.0, 'E': 30.0, 'F': 30.0 },
  5:  { 'SS': 0,    'S': 1.0,  'A': 4.0,  'B': 10.0, 'C': 20.0, 'D': 25.0, 'E': 20.0, 'F': 20.0 },
  6:  { 'SS': 0.2,  'S': 1.8,  'A': 10.0, 'B': 18.0, 'C': 25.0, 'D': 20.0, 'E': 15.0, 'F': 10.0 },
  7:  { 'SS': 0.5,  'S': 2.5,  'A': 12.0, 'B': 22.0, 'C': 28.0, 'D': 20.0, 'E': 10.0, 'F': 5.0  },
  8:  { 'SS': 0.8,  'S': 3.2,  'A': 13.0, 'B': 25.0, 'C': 30.0, 'D': 18.0, 'E': 10.0, 'F': 0    },
  9:  { 'SS': 1.2,  'S': 4.0,  'A': 15.0, 'B': 29.0, 'C': 30.0, 'D': 15.0, 'E': 5.8,  'F': 0    },
  10: { 'SS': 1.5,  'S': 4.5,  'A': 15.0, 'B': 30.0, 'C': 30.0, 'D': 15.0, 'E': 4.0,  'F': 0    }
}

// 4. Configuração do Buff de Administrador
export const DROP_RATE_META = {
  shiftPerAdmin: 15.0, 
  // Preferência de quem ganha o bônus (Se estiver liberado)
  bonusTargetPreference: ['SS', 'S', 'A', 'B', 'C']
}

// 5. Ordem dos Tiers (Para loops)
export const TIER_ORDER = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS']

// 6. Gerador de Nomes (RPG)
export const NOMES_M = [
  'Aldous', 'Balgor', 'Caelum', 'Dorian', 'Eldrin', 'Fargus', 'Garrick', 'Halt', 
  'Ignis', 'Jorund', 'Kael', 'Lorcan', 'Marek', 'Norius', 'Orion', 'Phaelan', 
  'Quintus', 'Ragnar', 'Silas', 'Thorne', 'Ulric', 'Valerius', 'Wulf', 'Xandar', 'Zephyr'
]

export const NOMES_F = [
  'Adara', 'Brynn', 'Celeste', 'Dahlia', 'Elara', 'Fae', 'Ginevra', 'Hestia', 
  'Isolde', 'Juno', 'Kaia', 'Lyra', 'Mira', 'Nyssa', 'Ophelia', 'Primrose', 
  'Quinn', 'Rowena', 'Seraphina', 'Talia', 'Una', 'Vesper', 'Willow', 'Xylia', 'Yara'
]

export const SOBRENOMES = [
  'Stormrage', 'Lightfoot', 'Ironheart', 'Nightshade', 'Dawnseeker', 'Frostborn', 
  'Fireforge', 'Moonwhisper', 'Starfall', 'Windrunner', 'Stonefist', 'Bloodraven', 
  'Goldleaf', 'Silverhand', 'Blackwood', 'Whitehawk', 'Deepwalker', 'Skydancer'
]
// === 7. SISTEMA DE MINERAÇÃO ===
export const RECURSOS_MINERACAO = {
  // TIER F & E (Básicos - Liberam rápido com 2 slots)
  pedra:      { nome: 'Pedra',      tier: 'F', valor: 1,   dureza: 1,   cor: '#64748b', unlockLvl: 1,  fullUnlockLvl: 1 },
  ferro:      { nome: 'Ferro',      tier: 'E', valor: 5,   dureza: 2,   cor: '#78716c', unlockLvl: 2,  fullUnlockLvl: 2 },
  cobre:      { nome: 'Cobre',      tier: 'E', valor: 4,   dureza: 2,   cor: '#b45309', unlockLvl: 3,  fullUnlockLvl: 3 },
  
  // TIER D & C (Intermediários - Craft Mágico)
  ouro_min:   { nome: 'Ouro Bruto', tier: 'D', valor: 50,  dureza: 5,   cor: '#eab308', unlockLvl: 5,  fullUnlockLvl: 5 },
  cristal:    { nome: 'Cristal',    tier: 'D', valor: 40,  dureza: 4,   cor: '#06b6d4', unlockLvl: 6,  fullUnlockLvl: 7 }, // Delay de 1 nivel
  obsidiana:  { nome: 'Obsidiana',  tier: 'C', valor: 80,  dureza: 8,   cor: '#312e81', unlockLvl: 8,  fullUnlockLvl: 9 },
  
  // TIER B & A (Jóias e Ligas Fortes)
  rubi:       { nome: 'Rubi',       tier: 'B', valor: 150, dureza: 12,  cor: '#ef4444', unlockLvl: 10, fullUnlockLvl: 11 },
  safira:     { nome: 'Safira',     tier: 'B', valor: 150, dureza: 12,  cor: '#3b82f6', unlockLvl: 12, fullUnlockLvl: 13 },
  esmeralda:  { nome: 'Esmeralda',  tier: 'B', valor: 150, dureza: 12,  cor: '#10b981', unlockLvl: 14, fullUnlockLvl: 15 },
  
  // TIER S & SS (Lendários - Progressão Lenta)
  mithril:    { nome: 'Mithril',    tier: 'S', valor: 300, dureza: 20,  cor: '#94a3b8', unlockLvl: 16, fullUnlockLvl: 17 },
  adamantium: { nome: 'Adamantium', tier: 'S', valor: 400, dureza: 30,  cor: '#0f766e', unlockLvl: 18, fullUnlockLvl: 19 },
  oricalco:   { nome: 'Oricalco',   tier: 'SS',valor: 1000,dureza: 50,  cor: '#f59e0b', unlockLvl: 20, fullUnlockLvl: 20 } // O último libera full no 20
}

export const MINING_CONFIG = {
  baseCartCapacity: 200,
  travelTime: 10,
  tickRate: 1000
}