<script setup>
import { computed } from 'vue'

// Definição do que este Layout aceita receber de fora
const props = defineProps({
  // Dados do Cabeçalho
  title: { type: String, default: 'Nome do Prédio' },
  level: { type: Number, default: 1 },
  maxLevel: { type: Number, default: 10 },
  icon: { type: String, default: '🏢' },
  
  // Dados do Líder (Admin/Chefe)
  leader: { type: Object, default: null }, // O boneco em si
  leaderLabel: { type: String, default: 'LÍDER' }, // Nome do cargo (ex: Administrador)
  leaderStatLabel: { type: String, default: 'EFICIÊNCIA' }, // Nome do status (ex: Cura/Dano)
  
  // Textos do Slot Vazio
  emptyTitle: { type: String, default: 'SEM COMANDO' },
  emptyDesc: { type: String, default: 'Setor operando sem supervisão.\nBônus de eficiência inativos.' },
  hideAdminPanel: { type: Boolean, default: false },
  hideHelp: { type: Boolean, default: false }
})

// Eventos que esse componente manda de volta para o pai
const emit = defineEmits(['open-help', 'remove-leader', 'assign-leader'])

// Helpers visuais
const getTierClass = (tier) => `tier-${tier}`
const formatNum = (n) => new Intl.NumberFormat('pt-BR').format(n)
</script>

<template>
  <div class="building-layout">
    
    <div class="building-header">
      <div class="bh-left">
        <div class="bh-icon">{{ icon }}</div>
        <div class="bh-data">
          <h2>{{ title }}</h2>
          <span class="bh-lvl">NÍVEL {{ level }} / {{ maxLevel }}</span>
        </div>
      </div>
      <div class="bh-right">
         <button class="help-btn" @click="emit('open-help')" v-if="!hideHelp">?</button>
      </div>
    </div>

    <div class="admin-panel" v-if="!hideAdminPanel">
      <div class="panel-header">
        <span class="ph-title">GESTÃO DE {{ leaderLabel.toUpperCase() }}</span>
        <div class="ph-line"></div>
      </div>
      
      <div class="admin-card hud-style" v-if="leader">
        <div class="hud-left">
          <div class="h-frame" :class="getTierClass(leader.tier)">
            <img :src="leader.avatarUrl">
          </div>
          <div class="h-tier-label" :class="getTierClass(leader.tier)">TIER {{ leader.tier }}</div>
        </div>
        
        <div class="hud-right">
          <div class="h-title-row">
            <h3 class="h-name">{{ leader.name }}</h3>
             <button class="header-action-btn remove" title="Remover" @click="emit('remove-leader')">
                REMOVER
             </button>
          </div>
          <div class="admin-race-tag tactical-plate">{{ leader.race }}</div>
          
          <div class="h-metrics">
            <div class="metric">
                <span class="m-val blue">{{ leader.efficiency }}%</span>
                <span class="m-lbl">{{ leaderStatLabel }}</span>
            </div>
            <div class="metric">
                <span class="m-val gold">{{ formatNum(leader.salary) }}</span>
                <span class="m-lbl">SALÁRIO (G)</span>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-card empty-slot" v-else>
        <button class="slot-frame btn-add-slot" @click="emit('assign-leader')">
          <span class="plus-icon">✚</span>
        </button>
        
        <div class="slot-content-wrapper">
          <div class="slot-info">
            <span class="s-title">{{ emptyTitle }}</span>
            <span class="s-desc">{{ emptyDesc }}</span>
          </div>
          </div>
      </div>
    </div>

    <div class="building-content">
        <slot></slot>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&display=swap');

.building-layout {
  font-family: 'Chakra Petch', sans-serif;
  color: #e2e8f0;
  display: flex; flex-direction: column; gap: 20px;
  width: 100%;
}

/* === CSS DO HEADER === */
.building-header {
  background: #1e293b; border-bottom: 1px solid #334155; border-left: 4px solid #38bdf8;
  padding: 12px 20px; display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}
.bh-left { display: flex; align-items: center; gap: 12px; }
.bh-icon { font-size: 20px; filter: drop-shadow(0 0 2px #fff); }
.bh-data h2 { margin: 0; font-size: 14px; text-transform: uppercase; color: #fff; letter-spacing: 1px; font-weight: 700; }
.bh-lvl { font-size: 10px; color: #94a3b8; background: #0f172a; padding: 2px 8px; border-radius: 10px; border: 1px solid #334155; }
.help-btn {
  background: transparent; border: 1px solid #475569; color: #94a3b8;
  width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-weight: bold;
}
.help-btn:hover { border-color: #38bdf8; color: #38bdf8; }

/* === CSS DO ADMIN PANEL === */
.admin-panel { display: flex; flex-direction: column; gap: 8px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 0 5px; border-bottom: 1px solid #334155; padding-bottom: 5px; }
.ph-title { font-size: 11px; color: #94a3b8; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }

.header-action-btn {
  background: #0f172a; border: 1px solid #334155; color: #94a3b8;
  padding: 4px 12px; font-size: 10px; cursor: pointer; text-transform: uppercase;
  font-weight: 700; transition: 0.2s; border-radius: 4px;
}
.header-action-btn:hover { border-color: #ef4444; color: #ef4444; }

.admin-card {
  background-color: #1e293b;
  background-image: radial-gradient(#64748b 1.5px, transparent 1.5px);
  background-size: 12px 12px;
  border: 1px solid #475569; padding: 15px; display: flex; gap: 20px; align-items: center;
  position: relative; box-shadow: inset 0 0 50px rgba(0,0,0,0.5); 
}
.admin-card::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(30,41,59,0.95) 20%, rgba(30,41,59,0.6) 100%);
  pointer-events: none;
}

/* === ESTILOS DO SLOT VAZIO (Corrigidos) === */
.admin-card.empty-slot {
  background-color: #0f172a; /* Fundo escuro */
  background-image: radial-gradient(#64748b 1.5px, transparent 1.5px);
  background-size: 12px 12px;
  
  border: 1px solid #475569;
  justify-content: flex-start;
  gap: 20px;
  position: relative;
  overflow: hidden;
  display: flex; align-items: center;
}
.admin-card.empty-slot::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  animation: shine 3s infinite;
}
.slot-frame {
  width: 70px; height: 70px; background: #1e293b; border: 1px solid #334155;
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; z-index: 1;
}
.slot-icon { width: 32px; height: 32px; opacity: 0.3; filter: grayscale(1) brightness(2); }

/* WRAPPER E BOTÃO (Estavam faltando no global) */
.slot-content-wrapper { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  flex: 1; 
  z-index: 2; 
}
.slot-info { display: flex; flex-direction: column; gap: 6px; z-index: 1; }
.s-title { color: #fff; font-size: 12px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #334155; padding-bottom: 2px; width: fit-content; }
.s-desc { color: #cbd5e1; font-size: 11px; white-space: pre-line; }

/* O BOTÃO PERDIDO */
.btn-designar { 
  background: #38bdf8; color: #0f172a; border: none; font-weight: 800; 
  padding: 8px 16px; border-radius: 4px; cursor: pointer; 
  font-family: 'Chakra Petch', sans-serif; transition: 0.2s; 
  /* Sombra para destaque */
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}
.btn-designar:hover { 
  filter: brightness(1.1); 
  transform: translateY(-1px);
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.5);
}

/* === HUD DO ADMIN (PREENCHIDO) === */
.hud-left, .hud-right { position: relative; z-index: 2; }
.h-frame {
  width: 70px; height: 70px; background: #000;
  border: 2px solid var(--rk-c, #64748b); border-radius: 8px; padding: 2px;
  box-shadow: 0 0 15px rgba(0,0,0,0.5);
}
.h-frame img { width: 100%; height: 100%; object-fit: cover; border-radius: 5px; }
.h-tier-label {
  background: var(--rk-c); color: #0f172a; font-size: 9px; font-weight: 800; padding: 2px 8px;
  border-radius: 4px; margin-top: -10px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);
  width: fit-content; margin-left: auto; margin-right: auto; position: relative;
}
.hud-right { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.h-title-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.h-name { font-size: 18px; color: #fff; margin: 0; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
.admin-race-tag { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700; }
.h-metrics { display: flex; gap: 25px; }
.metric { display: flex; flex-direction: column; border-left: 2px solid rgba(255,255,255,0.1); padding-left: 10px;}
.m-val { font-size: 15px; font-weight: 700; color: #fff; }
.gold { color: #ffd700; text-shadow: 0 0 2px #000; }
.blue { color: #38bdf8; text-shadow: 0 0 2px #000; }
.m-lbl { font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
.btn-add-slot {
  /* Reseta estilos padrão de botão do navegador */
  cursor: pointer;
  padding: 0;
  color: #64748b; /* Cor escura padrão */
  transition: all 0.2s ease;
}
/* O sinal de Mais (+) */
.plus-icon {
  font-size: 24px;
  font-weight: 900;
  line-height: 1; /* Garante alinhamento vertical perfeito */
}
/* Efeito Hover (Ao passar o mouse) */
.btn-add-slot:hover {
  border-color: #38bdf8;      /* Borda Azul */
  color: #38bdf8;             /* Ícone Azul */
  background: #252f42;        /* Fundo levemente mais claro */
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.3); /* Brilho Neon */
  transform: translateY(-1px);
}

/* === MOBILE ADAPTATION === */
@media (max-width: 600px) {
  .building-header { flex-wrap: nowrap !important; align-items: center; justify-content: space-between; padding: 10px; gap: 10px; }
  .bh-left { flex: 1; min-width: 0; overflow: hidden; }
  .bh-data { min-width: 0; overflow: hidden; }
  .bh-data h2 { font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bh-lvl { width: fit-content; white-space: nowrap; margin-top: 2px; font-size: 9px; }
  .bh-right { flex-shrink: 0; }
  .help-btn { width: 24px; height: 24px; font-size: 12px; }

  .admin-card.hud-style { padding: 8px 6px; gap: 8px; }
  .h-frame { width: 42px; height: 42px; }
  .h-tier-label { font-size: 7px; padding: 1px 3px; margin-top: -5px; }
  .h-name { font-size: 13px; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .admin-race-tag { font-size: 8px; margin-bottom: 2px; }
  .header-action-btn.remove { top: 4px; right: 4px; padding: 3px 6px; font-size: 8px; letter-spacing: 0; border-radius: 2px; }
  .h-metrics { gap: 8px; }
  .metric { padding-left: 5px; }
  .m-val { font-size: 11px; }
  .m-lbl { font-size: 7px; }
}

@media (max-width: 500px) {
  .admin-card.empty-slot { padding: 7px; gap: 7px; align-items: center; }
  .slot-frame { width: 45px; height: 45px; }
  .slot-icon { width: 20px; height: 20px; }
  .slot-content-wrapper { display: flex; flex-direction: row; align-items: center; justify-content: space-between; width: 100%; gap: 8px; }
  .s-title { font-size: 10px; margin-bottom: 2px; }
  .s-desc { font-size: 9px; line-height: 1.1; color: #64748b; max-width: 150px; }
  .plus-icon { font-size: 18px; }
}
</style>