<script setup>
import { ref, computed } from 'vue'
import BuildingLayout from './BuildingLayout.vue'
import WorkerSelectModal from './WorkerSelectModal.vue'
import { useGameStore } from '../stores/gameStore'
import { useForgeStore } from '../stores/forgeStore'

const gameStore = useGameStore()
const forgeStore = useForgeStore()

const showWorkerSelect = ref(false)

const availableBlacksmiths = computed(() => {
  return gameStore.workers.filter(w =>
    w.jobKey === 'ferreiro' && 
    (w.strikeDays || 0) === 0 && 
    !w.injury && 
    w.id !== forgeStore.workerId
  )
})

const selectWorker = (id) => {
  forgeStore.assignWorker(id)
  showWorkerSelect.value = false
}

const abaAtual = ref('craft')
const mostrarBusca = ref(false)
const filtroTipo = ref('Todos')
const filtroStatus = ref('Todos')

// ==========================================
// BANCO DE DADOS (Agora com ID e TIPO nos custos)
// ==========================================
const projetosDisponiveis = ref([
  {
    id: 'armadura_ferro',
    nome: 'Armadura de Ferro Fundido',
    tipo: 'Armadura',
    level: 15,
    img: '/assets/itens/armadura_ferro.png',
    stats: [
      { id: 'def_fisica', nome: 'Defesa Física', min: 50, max: 70, icone: '/assets/icons/stat_def_fisica.png' },
      { id: 'vida', nome: 'Vida Máxima', min: 100, max: 150, icone: '/assets/icons/stat_vida.png' }
    ],
    custo: [
      // Agora o sistema sabe que deve tirar de gameStore.inventory['min_ferro']
      { id: 'min_ferro', tipo: 'inventario', nome: 'Ferro', qtd: 50, img: '/assets/recursos/min_ferro.png' },
      // E sabe que deve tirar de gameStore.resources['goldCoin']
      { id: 'goldCoin', tipo: 'recurso', nome: 'Ouro', qtd: 500, img: '/assets/ui/i_tesoureiro.png' }
    ]
  },
  {
    id: 'espada_divina',
    nome: 'Espada Longa',
    tipo: 'Arma',
    level: 25,
    img: '/assets/itens/espada_longa.png',
    stats: [
      { id: 'atk_min', nome: 'Dano Físico Min', min: 10, max: 15, icone: '/assets/icons/stat_atk.png' },
      { id: 'atk_max', nome: 'Dano Físico Max', min: 20, max: 28, icone: '/assets/icons/stat_atk.png' },
      { id: 'atk_mag_min', nome: 'Dano Mágico Min', min: 5, max: 8, icone: '/assets/icons/stat_atk_magico.png' },
      { id: 'atk_mag_max', nome: 'Dano Mágico Max', min: 10, max: 18, icone: '/assets/icons/stat_atk_magico.png' },
      { id: 'crit_chance', nome: 'Chance Crítico', min: 2, max: 5, icone: '/assets/icons/stat_crit.png' },
      { id: 'dano_crit', nome: 'Dano Crítico', min: 10, max: 25, icone: '/assets/icons/stat_crit_dmg.png' },
      { id: 'precisao', nome: 'Precisão', min: 5, max: 15, icone: '/assets/icons/stat_precisao.png' },
      { id: 'dano_fogo', nome: 'Dano de Fogo', min: 1, max: 10, icone: '/assets/icons/stat_fogo.png' }
    ],
    custo: [
      { id: 'min_aco', tipo: 'inventario', nome: 'Aço', qtd: 30, img: '/assets/recursos/min_aco.png' },
      { id: 'goldCoin', tipo: 'recurso', nome: 'Ouro', qtd: 1200, img: '/assets/ui/i_tesoureiro.png' }
    ]
  },
  {
    id: 'escudo_madeira',
    nome: 'Escudo de Carvalho',
    tipo: 'Escudo',
    level: 5,
    img: '/assets/itens/escudo_madeira.png',
    stats: [
      { id: 'def_fisica', nome: 'Defesa Física', min: 15, max: 25, icone: '/assets/icons/stat_def_fisica.png' },
      { id: 'bloqueio', nome: 'Chance Bloqueio', min: 5, max: 12, icone: '/assets/icons/stat_block.png' }
    ],
    custo: [
      { id: 'madeira', tipo: 'inventario', nome: 'Madeira', qtd: 20, img: '/assets/recursos/madeira.png' },
      { id: 'goldCoin', tipo: 'recurso', nome: 'Ouro', qtd: 100, img: '/assets/ui/i_tesoureiro.png' }
    ]
  }
])

const equipamentoSelecionado = ref(projetosDisponiveis.value[0])

const selecionarProjeto = (projeto) => {
  equipamentoSelecionado.value = projeto
}

const todosOsStatsPossiveis = [
  'Ataque Físico', 'Ataque Mágico', 'Defesa Física', 'Defesa Mágica', 
  'Evasão', 'Bloqueio', 'Mana', 'Vida', 'Energia', 'Chance Crítico', 
  'Dano Crítico', 'Precisão', 'Penetração Física', 'Penetração Mágica', 
  'Defesa Elemental', 'Dano Elemental'
]

// ==========================================
// O BOTÃO DE AÇÃO
// ==========================================
const iniciarForja = () => {
  // Envia a ordem de craft para o forgeStore
  const resultado = forgeStore.craftItem(equipamentoSelecionado.value)
  
  if (resultado.success) {
    // Se deu certo, ele rola os dados, gasta material e devolve o item
    console.log("NOVO EQUIPAMENTO CRIADO:", resultado.item) // Pressione F12 no jogo para ver os status reais gerados!
    
    // Alerta visual básico (no futuro você pode criar um modal bonito de sucesso)
    alert(`⚡ FORJA CONCLUÍDA! ⚡\nVocê criou: ${resultado.item.nome}\nEle foi guardado no baú de equipamentos!`)
  } else {
    // Se não tiver ouro, recurso ou ferreiro, o forgeStore avisa aqui
    alert(`⚠️ OPERAÇÃO NEGADA: ${resultado.msg}`)
  }
}

const handleImageError = (event) => {
  event.target.style.opacity = '0.1'
}
</script>

<template>
  <BuildingLayout
    title="Forja Vulcânica"
    :level="1"
    :maxLevel="10"
    icon="⚒️"
    :leader="forgeStore.currentWorker"
    leader-label="FERREIRO"
    leader-stat-label="EFICIÊNCIA"
    empty-title="FORJA APAGADA"
    empty-desc="Nenhum ferreiro designado. As bigornas estão frias."
    :hide-help="true"
    @remove-leader="forgeStore.assignWorker(null)"
    @assign-leader="showWorkerSelect = true"
  >
    <div class="forja-complex">
      
      <div class="forja-nav">
        <button class="nav-tab" :class="{ 'active': abaAtual === 'craft' }" @click="abaAtual = 'craft'">
          OPERAÇÃO: CRAFT
        </button>
        <button class="nav-tab" :class="{ 'active': abaAtual === 'aprimoramento' }" @click="abaAtual = 'aprimoramento'">
          OPERAÇÃO: APRIMORAMENTO
        </button>
      </div>

      <div v-if="abaAtual === 'craft'" class="craft-module">
        
        <div class="advanced-search-panel">
          <button class="btn-toggle-search" @click="mostrarBusca = !mostrarBusca" :class="{ 'is-open': mostrarBusca }">
            <span class="search-icon">⚙️</span>
            <span>FILTROS DO CATÁLOGO DE PROJETOS</span>
            <span class="chevron">{{ mostrarBusca ? '▲' : '▼' }}</span>
          </button>
          
          <div v-if="mostrarBusca" class="search-options">
             <div class="filter-col">
               <label>TIPO DE EQUIPAMENTO</label>
               <select v-model="filtroTipo" class="tactical-select">
                 <option>Todos</option>
                 <option>Armas</option>
                 <option>Armaduras</option>
                 <option>Escudos</option>
               </select>
             </div>
             
             <div class="filter-col">
               <label>STATUS DESEJADO</label>
               <select v-model="filtroStatus" class="tactical-select">
                 <option>Todos</option>
                 <option v-for="stat in todosOsStatsPossiveis" :key="stat">{{ stat }}</option>
               </select>
             </div>

             <div class="filter-col">
               <label>NÍVEL MÁXIMO</label>
               <input type="number" value="20" class="tactical-input" style="width: 80px;">
             </div>
          </div>
        </div>

        <div class="workspace-grid">
          
          <div class="blueprints-column">
             <div class="column-header">DIAGRAMAS DISPONÍVEIS</div>
             <div class="blueprint-list">
                
                <div v-for="(proj, idx) in projetosDisponiveis" :key="idx" 
                     class="bp-item" 
                     :class="{ 'active': equipamentoSelecionado.id === proj.id }"
                     @click="selecionarProjeto(proj)">
                   <div class="bp-img-frame">
                      <img :src="proj.img" @error="handleImageError">
                   </div>
                   <div class="bp-info">
                      <span class="bp-name">{{ proj.nome }}</span>
                      <span class="bp-type">{{ proj.tipo }}</span>
                   </div>
                </div>

             </div>
          </div>

          <div class="details-column">
             
             <div class="item-header">
                <div class="item-big-frame">
                   <img :src="equipamentoSelecionado.img" @error="handleImageError">
                </div>
                <div class="item-titles">
                   <h2>{{ equipamentoSelecionado.nome }}</h2>
                   <div class="item-tags">
                      <span class="tag-type">{{ equipamentoSelecionado.tipo }}</span>
                      <span class="tag-lvl">NÍVEL {{ equipamentoSelecionado.level }}</span>
                   </div>
                </div>
             </div>

             <div class="section-divider"><span>ANÁLISE DE POTENCIAL (RNG)</span></div>
             
             <div class="stats-matrix">
                <div v-for="n in 8" :key="n" class="stat-module" :class="{ 'is-empty': !equipamentoSelecionado.stats[n-1] }">
                   
                   <template v-if="equipamentoSelecionado.stats[n-1]">
                     <div class="sm-left">
                       <img :src="equipamentoSelecionado.stats[n-1].icone" class="sm-icon" @error="handleImageError">
                       <span class="sm-name">{{ equipamentoSelecionado.stats[n-1].nome }}</span>
                     </div>
                     <div class="sm-right">
                       <span class="sm-range">{{ equipamentoSelecionado.stats[n-1].min }} ~ {{ equipamentoSelecionado.stats[n-1].max }}</span>
                     </div>
                   </template>

                   <template v-else>
                     </template>

                </div>
             </div>

             <div class="section-divider"><span>CUSTO DE MATERIAL</span></div>
             
             <div class="cost-and-action">
                <div class="materials-row">
                   <div v-for="(mat, idx) in equipamentoSelecionado.custo" :key="idx" class="mat-badge">
                      <img :src="mat.img" class="mat-icon" @error="handleImageError">
                      <span class="mat-qty">{{ mat.qtd }}</span>
                      <span class="mat-name">{{ mat.nome }}</span>
                   </div>
                </div>
                
                <button class="btn-forge" @click="iniciarForja">
                   INICIAR FORJA DO EQUIPAMENTO
                </button>
             </div>

          </div>
        </div>

      </div>

      <div v-if="abaAtual === 'aprimoramento'" class="locked-module">
        <span class="locked-icon">🔒</span>
        <h3>SISTEMA DE APRIMORAMENTO OFFLINE</h3>
        <p>A bigorna secundária aguarda calibração. Retorne mais tarde.</p>
      </div>

    </div>

    <WorkerSelectModal 
      v-if="showWorkerSelect" 
      title="ESCOLHER FERREIRO" 
      :workers="availableBlacksmiths" 
      @close="showWorkerSelect = false" 
      @select="selectWorker" 
    />

  </BuildingLayout>
</template>

<style scoped>
/* Layout Base */
.forja-complex { display: flex; flex-direction: column; gap: 15px; font-family: 'Chakra Petch', sans-serif; }

/* Navegação */
.forja-nav { display: flex; gap: 4px; border-bottom: 2px solid #334155; background: #0f172a; padding: 10px 10px 0 10px; border-radius: 8px 8px 0 0; }
.nav-tab { background: #1e293b; border: 1px solid #334155; border-bottom: none; color: #64748b; padding: 10px 20px; font-weight: 800; font-size: 11px; cursor: pointer; border-radius: 6px 6px 0 0; letter-spacing: 1px; transition: 0.2s; }
.nav-tab.active { background: #252f42; color: #f8fafc; border-color: #475569; border-top: 3px solid #f97316; }

/* Módulos Gerais */
.craft-module { display: flex; flex-direction: column; gap: 15px; }
.locked-module { background: #0f172a; border: 1px dashed #475569; border-radius: 8px; height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; text-align: center; }
.locked-icon { font-size: 40px; margin-bottom: 10px; opacity: 0.5; }

/* Busca Avançada */
.advanced-search-panel { background: #0f172a; border: 1px solid #334155; border-radius: 6px; overflow: hidden; }
.btn-toggle-search { width: 100%; display: flex; align-items: center; gap: 10px; background: #1e293b; color: #94a3b8; border: none; padding: 10px 15px; font-family: 'Chakra Petch', sans-serif; font-weight: 800; font-size: 11px; cursor: pointer; transition: 0.2s; }
.btn-toggle-search:hover { background: #252f42; color: #cbd5e1; }
.btn-toggle-search.is-open { border-bottom: 1px solid #334155; color: #f8fafc; }
.chevron { margin-left: auto; font-size: 10px; }
.search-options { padding: 15px; display: flex; gap: 20px; background: #0b1120; }
.filter-col { display: flex; flex-direction: column; gap: 6px; }
.filter-col label { font-size: 9px; color: #64748b; font-weight: 800; }
.tactical-select, .tactical-input { background: #020617; border: 1px solid #475569; color: #fff; padding: 8px; border-radius: 4px; font-family: 'Chakra Petch', sans-serif; font-size: 11px; outline: none; transition: 0.2s; }
.tactical-select:focus, .tactical-input:focus { border-color: #f97316; }

/* Work Space */
.workspace-grid { display: flex; gap: 15px; align-items: stretch; height: 520px; }

/* Coluna Esquerda */
.blueprints-column { width: 240px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0; }
.column-header { background: #1e293b; padding: 10px; font-size: 10px; color: #94a3b8; font-weight: 800; text-align: center; border-bottom: 1px solid #334155; letter-spacing: 1px; }
.blueprint-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
.bp-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #1e293b; cursor: pointer; transition: 0.2s; }
.bp-item:hover { background: #162032; }
.bp-item.active { background: #1f140d; border-left: 4px solid #f97316; }
.bp-img-frame { width: 36px; height: 36px; background: #020617; border: 1px solid #334155; border-radius: 4px; display: flex; align-items: center; justify-content: center; padding: 4px; }
.bp-img-frame img { width: 100%; height: 100%; object-fit: contain; }
.bp-info { display: flex; flex-direction: column; }
.bp-name { font-size: 11px; color: #cbd5e1; font-weight: 800; text-transform: uppercase; }
.bp-type { font-size: 9px; color: #64748b; font-weight: 700; }
.bp-item.active .bp-name { color: #f97316; }

/* Coluna Direita */
.details-column { flex: 1; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; display: flex; flex-direction: column; box-shadow: inset 0 0 30px rgba(0,0,0,0.5); }
.item-header { display: flex; align-items: center; gap: 20px; margin-bottom: 15px; }
.item-big-frame { width: 80px; height: 80px; background: #020617; border: 2px solid #475569; border-radius: 8px; padding: 8px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 15px rgba(0,0,0,0.8); }
.item-big-frame img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 4px 5px rgba(0,0,0,0.8)); }
.item-titles { display: flex; flex-direction: column; gap: 6px; }
.item-titles h2 { margin: 0; font-size: 20px; color: #f8fafc; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
.item-tags { display: flex; gap: 8px; }
.tag-type, .tag-lvl { background: #0f172a; border: 1px solid #334155; padding: 4px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 1px; }
.tag-type { color: #f97316; border-color: #9a3412; background: #431407; }
.tag-lvl { color: #38bdf8; }
.section-divider { display: flex; align-items: center; text-align: center; margin: 15px 0; }
.section-divider::before, .section-divider::after { content: ''; flex: 1; border-bottom: 1px dashed #475569; }
.section-divider span { padding: 0 10px; color: #64748b; font-size: 9px; font-weight: 800; letter-spacing: 2px; }

/* =========================================
   A GRADE DE 8 SLOTS (Magia do 4-4)
========================================== */
.stats-matrix {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(4, 42px);
  /* A linha abaixo é o que força os itens 1 a 4 na esquerda, e 5 a 8 na direita */
  grid-auto-flow: column; 
  gap: 10px;
}

.stat-module {
  background: #0f172a; border: 1px solid #334155; border-radius: 6px;
  display: flex; justify-content: space-between; align-items: center; padding: 0 12px;
}
/* Magia da Invisibilidade para evitar Layout Shift */
.stat-module.is-empty {
  background: transparent; border: none; padding: 0; pointer-events: none;
}

.sm-left { display: flex; align-items: center; gap: 8px; }
.sm-icon { width: 18px; height: 18px; object-fit: contain; }
.sm-name { font-size: 11px; color: #cbd5e1; font-weight: 800; text-transform: uppercase; }
.sm-right { display: flex; align-items: center; }
.sm-range { font-size: 12px; color: #10b981; font-weight: 900; font-family: monospace; letter-spacing: 1px; }

/* Custo e Botão */
.cost-and-action { display: flex; flex-direction: column; gap: 20px; margin-top: auto; }
.materials-row { display: flex; flex-wrap: wrap; gap: 10px; }
.mat-badge { display: flex; align-items: center; gap: 6px; background: #020617; border: 1px solid #475569; padding: 6px 12px; border-radius: 4px; }
.mat-icon { width: 16px; height: 16px; object-fit: contain; }
.mat-qty { font-size: 12px; color: #f8fafc; font-weight: 900; }
.mat-name { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }

.btn-forge { width: 100%; padding: 18px; background: linear-gradient(to bottom, #f97316, #c2410c); color: #fff; font-family: 'Chakra Petch', sans-serif; font-weight: 900; font-size: 14px; border: 1px solid #ea580c; border-radius: 6px; cursor: pointer; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4); transition: 0.2s; }
.btn-forge:hover { filter: brightness(1.2); box-shadow: 0 6px 20px rgba(249, 115, 22, 0.6); }
.btn-forge:active { transform: translateY(2px); box-shadow: 0 2px 10px rgba(249, 115, 22, 0.4); }

@media (max-width: 800px) {
  .workspace-grid { flex-direction: column; height: auto; }
  .blueprints-column { width: 100%; height: 250px; }
  .stats-matrix { grid-template-columns: 1fr; grid-template-rows: repeat(8, 40px); grid-auto-flow: row; }
}
</style>