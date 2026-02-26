<script setup>
import { ref, computed } from 'vue'
import BuildingLayout from './BuildingLayout.vue'
import WorkerSelectModal from './WorkerSelectModal.vue'
import { useGameStore } from '../stores/gameStore'
import { useForgeStore } from '../stores/forgeStore'
import { PROJETOS_FORJA } from '../data/equipments'

const gameStore = useGameStore()
const forgeStore = useForgeStore()

const showWorkerSelect = ref(false)
const abaAtual = ref('craft')

// ==========================================
// MODAL DE FILTROS FLUTUANTE (MANTIDO)
// ==========================================
const showFilterModal = ref(false)
const filtroNome = ref('')
const categoriasSelecionadas = ref([])
const statusFiltros = ref([])

const opcoesCategoria = ['Arma', 'Armadura', 'Escudo']
const opcoesStatus = [
  'Ataque Físico', 'Ataque Mágico', 'Defesa Física', 'Defesa Mágica', 
  'Evasão', 'Bloqueio', 'Mana', 'Vida', 'Energia', 'Chance Crítico', 
  'Dano Crítico', 'Precisão', 'Penetração Física', 'Penetração Mágica', 
  'Defesa Elemental', 'Dano Elemental'
]

const novoFiltroStat = ref('Ataque Físico')
const novoFiltroVal = ref(10)

const adicionarFiltroStatus = () => {
  if (novoFiltroVal.value < 0) return
  statusFiltros.value.push({ id: Date.now(), stat: novoFiltroStat.value, minVal: novoFiltroVal.value })
}
const removerFiltroStatus = (id) => { statusFiltros.value = statusFiltros.value.filter(f => f.id !== id) }
const toggleCategoria = (cat) => {
  const index = categoriasSelecionadas.value.indexOf(cat)
  if (index > -1) categoriasSelecionadas.value.splice(index, 1)
  else categoriasSelecionadas.value.push(cat)
}
const limparFiltros = () => { filtroNome.value = ''; categoriasSelecionadas.value = []; statusFiltros.value = [] }

const projetosFiltrados = computed(() => {
  return PROJETOS_FORJA.filter(proj => {
    if (filtroNome.value && !proj.nome.toLowerCase().includes(filtroNome.value.toLowerCase())) return false
    if (categoriasSelecionadas.value.length > 0 && !categoriasSelecionadas.value.includes(proj.tipo)) return false
    for (const filtro of statusFiltros.value) {
      const statNoItem = proj.stats.find(s => s.nome === filtro.stat)
      if (!statNoItem || statNoItem.max < filtro.minVal) return false 
    }
    return true
  })
})

// ==========================================
// LÓGICA DA FORJA
// ==========================================
const availableBlacksmiths = computed(() => {
  return gameStore.workers.filter(w => w.jobKey === 'ferreiro' && (w.strikeDays || 0) === 0 && !w.injury && w.id !== forgeStore.workerId)
})
const selectWorker = (id) => { forgeStore.assignWorker(id); showWorkerSelect.value = false }

const equipamentoSelecionado = ref(PROJETOS_FORJA[0] || null)
const selecionarProjeto = (projeto) => { equipamentoSelecionado.value = projeto }

const podeForjar = computed(() => {
  if (!equipamentoSelecionado.value || !forgeStore.workerId || forgeStore.activeCraft.projeto || forgeStore.readyItem) return false 
  for (const mat of equipamentoSelecionado.value.custo) {
    if (mat.tipo === 'recurso' && gameStore.resources[mat.id] < mat.qtd) return false
    if (mat.tipo === 'inventario' && (gameStore.inventory[mat.id] || 0) < mat.qtd) return false
  }
  return true
})

const iniciarProcesso = () => {
  const result = forgeStore.startCraft(equipamentoSelecionado.value)
  if (!result.success) alert(result.msg)
}

const getProgressPct = computed(() => {
  if (!forgeStore.activeCraft.projeto || forgeStore.activeCraft.totalTime === 0) return '0%'
  const pct = (forgeStore.activeCraft.progress / forgeStore.activeCraft.totalTime) * 100
  return `${Math.min(100, pct)}%`
})

const handleImageError = (event) => { event.target.style.opacity = '0.1' }
</script>

<template>
  <BuildingLayout
    title="Forja Vulcânica" :level="1" :maxLevel="10" icon="⚒️"
    :leader="forgeStore.currentWorker" leader-label="FERREIRO" leader-stat-label="EFICIÊNCIA"
    empty-title="FORJA APAGADA" empty-desc="Ferreiro Ausente." :hide-help="true"
    @remove-leader="forgeStore.assignWorker(null)" @assign-leader="showWorkerSelect = true"
  >
    <div v-if="showFilterModal" class="modal-overlay" @click.self="showFilterModal = false">
      <div class="modal-box">
        <div class="modal-header">
           <span>Filtros de Busca</span>
           <button class="btn-close" @click="showFilterModal = false">X</button>
        </div>
        <div class="modal-body">
           <div class="filter-group">
             <label>Categorias Permitidas</label>
             <div class="chip-container">
               <button v-for="cat in opcoesCategoria" :key="cat" class="chip" :class="{'active': categoriasSelecionadas.includes(cat)}" @click="toggleCategoria(cat)">
                 {{ cat }}
               </button>
             </div>
           </div>
           <div class="filter-group">
             <label>Exigir Atributos Mínimos</label>
             <div class="stat-adder">
                <select v-model="novoFiltroStat" class="input-select">
                  <option v-for="op in opcoesStatus" :key="op" :value="op">{{ op }}</option>
                </select>
                <span class="symbol-ge">&ge;</span>
                <input type="number" v-model="novoFiltroVal" class="input-number" min="0">
                <button class="btn-add" @click="adicionarFiltroStatus">+</button>
             </div>
           </div>
           <div class="filter-group">
             <label>Regras Ativas</label>
             <div class="active-tags-box">
                <div v-if="statusFiltros.length === 0" class="empty-tags">Sem restrições aplicadas.</div>
                <div v-for="filtro in statusFiltros" :key="filtro.id" class="stat-tag">
                   {{ filtro.stat }} &ge; {{ filtro.minVal }}
                   <button @click="removerFiltroStatus(filtro.id)">X</button>
                </div>
             </div>
           </div>
        </div>
        <div class="modal-footer">
           <button class="btn-clear" @click="limparFiltros">Limpar</button>
           <button class="btn-apply" @click="showFilterModal = false">Aplicar Filtros</button>
        </div>
      </div>
    </div>

    <div class="seamless-forge-container">
      
      <nav class="flat-nav">
         <span class="nav-item" :class="{ 'active': abaAtual === 'craft' }" @click="abaAtual = 'craft'">Projetos</span>
         <span class="nav-sep">/</span>
         <span class="nav-item" :class="{ 'active': abaAtual === 'aprimoramento' }" @click="abaAtual = 'aprimoramento'">Aprimoramento Místico</span>
      </nav>

      <div v-if="abaAtual === 'craft'" class="flat-workspace">
        
        <div class="flat-sidebar">
           
           <div class="flat-search-area">
              <input type="text" v-model="filtroNome" placeholder="Pesquisar..." class="flat-input">
              <button class="flat-filter-btn" @click="showFilterModal = true" :class="{'has-filter': categoriasSelecionadas.length > 0 || statusFiltros.length > 0}">
                 Filtros <span v-if="categoriasSelecionadas.length > 0 || statusFiltros.length > 0">•</span>
              </button>
           </div>
           
           <div class="flat-list scroll-lock">
              <div v-for="proj in projetosFiltrados" :key="proj.id" 
                   class="flat-list-item" 
                   :class="{ 'selected': equipamentoSelecionado && equipamentoSelecionado.id === proj.id }"
                   @click="selecionarProjeto(proj)">
                 <img :src="proj.img" @error="handleImageError" class="list-item-icon">
                 <div class="list-item-texts">
                    <span class="list-item-name">{{ proj.nome }}</span>
                    <span class="list-item-sub">{{ proj.tipo }}</span>
                 </div>
              </div>
              <div v-if="projetosFiltrados.length === 0" class="flat-empty">Nenhum item encontrado.</div>
           </div>
        </div>

        <div class="flat-main" v-if="equipamentoSelecionado">
           
           <div class="blueprint-header">
              <div class="bp-titles">
                 <h2 class="bp-name">{{ equipamentoSelecionado.nome }}</h2>
                 <span class="bp-meta">{{ equipamentoSelecionado.tipo }} · Nível {{ equipamentoSelecionado.level }} · {{ equipamentoSelecionado.tempoBase }}s</span>
              </div>
           </div>

           <div class="blueprint-body">
              
              <div class="bp-image-area">
                 <img :src="equipamentoSelecionado.img" @error="handleImageError" class="bp-main-img">
              </div>

              <div class="bp-stats-area">
                 <h3 class="bp-section-title">Estatísticas</h3>
                 <div class="bp-stats-list">
                    <div v-for="n in 8" :key="n" class="bp-stat-line" :class="{ 'ghost-line': !equipamentoSelecionado.stats[n-1] }">
                       <template v-if="equipamentoSelecionado.stats[n-1]">
                          <div class="sl-label">
                             <img :src="equipamentoSelecionado.stats[n-1].icone" @error="handleImageError">
                             {{ equipamentoSelecionado.stats[n-1].nome }}
                          </div>
                          <div class="sl-dots"></div>
                          <div class="sl-value">{{ equipamentoSelecionado.stats[n-1].min }} ~ {{ equipamentoSelecionado.stats[n-1].max }}</div>
                       </template>
                    </div>
                 </div>
              </div>
           </div>

           <div class="blueprint-footer">
              
              <div class="bp-micro-mats">
                 <span class="mats-label">Custo:</span>
                 <div v-for="(mat, idx) in equipamentoSelecionado.custo" :key="idx" class="micro-mat">
                    <img :src="mat.img" @error="handleImageError">
                    <span :class="{'err-mat': (mat.tipo === 'recurso' ? gameStore.resources[mat.id] : (gameStore.inventory[mat.id] || 0)) < mat.qtd }">
                       {{ mat.qtd }}
                    </span>
                 </div>
              </div>

              <div class="bp-action-zone">
                 
                 <div v-if="!forgeStore.activeCraft.projeto && !forgeStore.readyItem" class="zone-idle">
                    <button class="btn-flat-action" @click="iniciarProcesso" :disabled="!podeForjar">
                       INICIAR FORJA
                    </button>
                    <div v-if="!podeForjar" class="zone-warning">Recursos insuficientes ou forja ociosa.</div>
                 </div>

                 <div v-else-if="forgeStore.activeCraft.projeto" class="zone-working">
                    <div class="w-texts">
                       <span class="w-lbl">Forjando {{ forgeStore.activeCraft.projeto.nome }}...</span>
                       <span class="w-pct">{{ parseInt(getProgressPct) }}%</span>
                    </div>
                    <div class="w-bar"><div class="w-fill" :style="{ width: getProgressPct }"></div></div>
                 </div>

                 <div v-else-if="forgeStore.readyItem" class="zone-done">
                    <div class="d-info">
                       <img :src="forgeStore.readyItem.img" class="d-icon" @error="handleImageError">
                       <span>{{ forgeStore.readyItem.nome }} Concluído!</span>
                    </div>
                    <button class="btn-flat-claim" @click="forgeStore.collectItem()">COLETAR ITEM</button>
                 </div>

              </div>
           </div>

        </div>

      </div>

      <div v-if="abaAtual === 'aprimoramento'" class="flat-offline">
        Em desenvolvimento.
      </div>

    </div>

    <WorkerSelectModal v-if="showWorkerSelect" title="ESCOLHER FERREIRO" :workers="availableBlacksmiths" @close="showWorkerSelect = false" @select="selectWorker" />
  </BuildingLayout>
</template>

<style scoped>
/* =========================================
   FLAT DESIGN - INTEGRADO À PÁGINA
========================================== */
* { box-sizing: border-box; }

/* O Container agora é invisível, apenas agrupa o conteúdo */
.seamless-forge-container { display: flex; flex-direction: column; font-family: 'Chakra Petch', sans-serif; padding: 10px 0; color: #cbd5e1; }

/* Navegação em texto, sem botões ou caixas */
.flat-nav { display: flex; gap: 15px; margin-bottom: 20px; padding-left: 10px; }
.nav-item { font-size: 14px; color: #64748b; font-weight: 600; cursor: pointer; transition: 0.2s; text-transform: uppercase; letter-spacing: 1px; }
.nav-item:hover { color: #cbd5e1; }
.nav-item.active { color: #f97316; font-weight: 800; }
.nav-sep { color: #334155; }

/* Espaço de Trabalho Aberto */
.flat-workspace { display: flex; gap: 40px; height: 500px; }
.scroll-lock { overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; }

/* =========================================
   ESQUERDA: LISTA LIVRE
========================================== */
.flat-sidebar { width: 280px; display: flex; flex-direction: column; gap: 15px; flex-shrink: 0; }

.flat-search-area { display: flex; gap: 10px; }
.flat-input { flex: 1; background: transparent; border: none; border-bottom: 1px solid #475569; color: #f8fafc; padding: 8px 0; font-family: inherit; font-size: 13px; outline: none; transition: 0.2s; }
.flat-input:focus { border-bottom-color: #f97316; }
.flat-filter-btn { background: transparent; border: 1px solid #475569; color: #cbd5e1; padding: 0 12px; border-radius: 20px; font-family: inherit; font-size: 11px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.flat-filter-btn.has-filter { color: #f97316; border-color: #f97316; }

.flat-list { flex: 1; display: flex; flex-direction: column; padding-right: 10px; }
.flat-list-item { display: flex; align-items: center; gap: 15px; padding: 10px 8px; cursor: pointer; border-radius: 8px; transition: 0.2s; border-left: 2px solid transparent; }
.flat-list-item:hover { background: rgba(255, 255, 255, 0.03); }
.flat-list-item.selected { background: rgba(249, 115, 22, 0.05); border-left-color: #f97316; }

.list-item-icon { width: 32px; height: 32px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
.list-item-texts { display: flex; flex-direction: column; }
.list-item-name { font-size: 13px; font-weight: 700; color: #e2e8f0; }
.flat-list-item.selected .list-item-name { color: #f97316; font-weight: 800; }
.list-item-sub { font-size: 11px; color: #64748b; }
.flat-empty { padding: 20px 0; font-size: 12px; color: #64748b; font-style: italic; }

/* =========================================
   DIREITA: O BLUEPRINT (Dados do Item)
========================================== */
.flat-main { flex: 1; display: flex; flex-direction: column; gap: 30px; }

.blueprint-header { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 15px; }
.bp-name { margin: 0; font-size: 28px; color: #f8fafc; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
.bp-meta { font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; display: block; margin-top: 5px; }

.blueprint-body { display: flex; gap: 40px; align-items: flex-start; }

/* Imagem Gigante Flutuante */
.bp-image-area { flex: 0.4; display: flex; justify-content: center; align-items: center; }
.bp-main-img { width: 140px; height: 140px; object-fit: contain; filter: drop-shadow(0 15px 20px rgba(0,0,0,0.6)); }

/* Estatísticas Limpas em Texto */
.bp-stats-area { flex: 0.6; display: flex; flex-direction: column; gap: 15px; }
.bp-section-title { margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 2px; }

.bp-stats-list { display: flex; flex-direction: column; gap: 8px; }
.bp-stat-line { display: flex; align-items: center; height: 24px; }
/* O Segredo: Esconde a linha mas mantém o espaço físico exato */
.ghost-line { visibility: hidden; }

.sl-label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #cbd5e1; }
.sl-label img { width: 14px; height: 14px; opacity: 0.8; }
.sl-dots { flex: 1; border-bottom: 1px dotted rgba(255, 255, 255, 0.2); margin: 0 15px; position: relative; top: 4px; }
.sl-value { font-size: 14px; color: #10b981; font-weight: 800; font-family: monospace; }

/* =========================================
   BASE: AÇÃO E MICRO-MATERIAIS
========================================== */
.blueprint-footer { margin-top: auto; display: flex; flex-direction: column; gap: 20px; }

/* Micro Materiais em uma linha simples */
.bp-micro-mats { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
.mats-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
.micro-mat { display: flex; align-items: center; gap: 6px; }
.micro-mat img { width: 16px; height: 16px; object-fit: contain; }
.micro-mat span { font-size: 13px; font-weight: 800; color: #e2e8f0; font-family: monospace; }
.err-mat { color: #ef4444 !important; }

/* Área de Ação Transparente */
.bp-action-zone { width: 100%; max-width: 400px; }

.zone-idle { display: flex; flex-direction: column; gap: 10px; }
.btn-flat-action { width: 100%; padding: 15px; background: transparent; border: 1px solid #f97316; color: #f97316; border-radius: 4px; font-family: inherit; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; cursor: pointer; transition: 0.2s; }
.btn-flat-action:hover:not(:disabled) { background: #f97316; color: #020617; }
.btn-flat-action:disabled { border-color: #334155; color: #475569; cursor: not-allowed; }
.zone-warning { font-size: 11px; color: #ef4444; }

.zone-working { display: flex; flex-direction: column; gap: 10px; }
.w-texts { display: flex; justify-content: space-between; align-items: flex-end; }
.w-lbl { font-size: 12px; color: #f97316; font-weight: 700; }
.w-pct { font-size: 16px; color: #f97316; font-weight: 900; font-family: monospace; }
.w-bar { height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden; }
.w-fill { height: 100%; background: #f97316; transition: width 0.5s linear; }

.zone-done { display: flex; justify-content: space-between; align-items: center; background: rgba(16, 185, 129, 0.05); border: 1px solid #10b981; padding: 10px 15px; border-radius: 4px; }
.d-info { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #10b981; font-weight: 700; }
.d-icon { width: 24px; height: 24px; object-fit: contain; }
.btn-flat-claim { padding: 8px 20px; background: #10b981; border: none; color: #020617; border-radius: 4px; font-family: inherit; font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; }
.btn-flat-claim:hover { background: #34d399; }

.flat-offline { padding: 20px; color: #64748b; font-size: 13px; font-style: italic; }

/* =========================================
   MOBILE
========================================== */
@media (max-width: 900px) {
  .flat-workspace { flex-direction: column; height: auto; gap: 20px; }
  
  /* A lista lateral vira horizontal */
  .flat-sidebar { width: 100%; }
  .flat-list { flex-direction: row; overflow-x: auto; padding-bottom: 10px; }
  .flat-list-item { flex-direction: column; width: 80px; text-align: center; border-left: none; border-bottom: 2px solid transparent; }
  .flat-list-item.selected { border-bottom-color: #f97316; border-left-color: transparent; background: transparent; }
  .list-item-sub { display: none; }
  
  /* Layout Interno */
  .blueprint-body { flex-direction: column; gap: 20px; }
  .bp-image-area { width: 100%; }
  .bp-stats-area { width: 100%; }
  .bp-action-zone { max-width: 100%; }
  
  .sl-dots { margin: 0 5px; }
}

/* MODAL DE FILTROS (MANTIDO) */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 999; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(2px); }
.modal-box { width: 400px; background: #0f172a; border-radius: 8px; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.modal-header span { color: #f8fafc; font-weight: 700; font-size: 14px; }
.btn-close { background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
.filter-group { display: flex; flex-direction: column; gap: 10px; }
.filter-group label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
.chip-container { display: flex; gap: 8px; flex-wrap: wrap; }
.chip { padding: 6px 12px; background: transparent; border: 1px solid #475569; color: #cbd5e1; border-radius: 20px; font-size: 11px; cursor: pointer; font-family: inherit; transition: 0.2s; }
.chip.active { background: #f97316; border-color: #f97316; color: #fff; }
.stat-adder { display: flex; gap: 10px; align-items: center; }
.input-select { flex: 2; background: rgba(0,0,0,0.2); border: 1px solid #334155; color: #fff; padding: 10px; border-radius: 4px; font-size: 12px; outline: none; font-family: inherit; }
.symbol-ge { color: #64748b; }
.input-number { flex: 1; background: rgba(0,0,0,0.2); border: 1px solid #334155; color: #10b981; padding: 10px; border-radius: 4px; font-size: 14px; text-align: center; outline: none; font-family: monospace; }
.btn-add { background: #f97316; border: none; color: #fff; width: 36px; height: 36px; border-radius: 4px; font-weight: bold; cursor: pointer; }
.active-tags-box { background: rgba(0,0,0,0.2); padding: 15px; border-radius: 4px; min-height: 50px; display: flex; gap: 8px; flex-wrap: wrap; }
.empty-tags { font-size: 11px; color: #64748b; font-style: italic; }
.stat-tag { background: transparent; border: 1px solid #f97316; color: #f97316; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.stat-tag button { background: none; border: none; color: #f97316; cursor: pointer; padding: 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 15px; padding: 20px; border-top: 1px solid rgba(255,255,255,0.05); }
.btn-clear { background: none; border: none; color: #94a3b8; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
.btn-apply { background: #f8fafc; border: none; color: #0f172a; padding: 10px 20px; border-radius: 4px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }
</style>