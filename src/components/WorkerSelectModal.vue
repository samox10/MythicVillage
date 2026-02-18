<script setup>
defineProps({
  title: { type: String, required: true },
  workers: { type: Array, required: true },
  emptyMessage1: { type: String, default: 'Nenhum funcionário disponível.' },
  emptyMessage2: { type: String, default: '' }
})
defineEmits(['close', 'select'])
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="tactical-card select-modal">
      
      <div class="tc-header">
        <span class="tc-title">{{ title }}</span>
        <button class="tc-close" @click="$emit('close')">✕</button>
      </div>
      
      <div class="select-list list-bars">
        
        <div v-if="workers.length === 0" class="empty-list">
          {{ emptyMessage1 }}<br><small>{{ emptyMessage2 }}</small>
        </div>

        <div 
          v-for="w in workers" 
          :key="w.id" 
          :class="['bar-item', 'tier-' + w.tier]" 
          @click="$emit('select', w.id)"
        >
          <div class="bar-left">
            <div class="avatar-frame">
              <img :src="w.avatarUrl" class="si-avatar">
            </div>
            
            <div class="bar-info">
              <span class="si-name">{{ w.name }}</span>
              <div class="bar-badges">
                <span class="si-rank">TIER {{ w.tier }}</span>
                <span class="si-eff">{{ w.efficiency }}% EFIC.</span>
              </div>
            </div>
          </div>

          <button class="btn-pick bar-btn">SELECIONAR</button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.list-bars { display: flex; flex-direction: column; gap: 10px; padding: 15px; }

/* A Barra Principal */
.bar-item {
  display: flex; justify-content: space-between; align-items: center;
  background: #1e293b; border: 1px solid #334155;
  border-left: 6px solid var(--rk-c); /* Cor do Tier na lateral */
  border-radius: 6px;
  min-height: 60px; /* Garante que a barra tenha altura mínima para a foto não cortar */
  padding: 10px 15px;
  cursor: pointer; transition: all 0.2s ease;
  position: relative; overflow: hidden;
}

.bar-item::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 50%;
  background: linear-gradient(90deg, var(--rk-c), transparent);
  opacity: 0.05; transition: 0.2s;
}

.bar-item:hover {
  transform: translateX(5px); border-color: var(--rk-c);
  box-shadow: -4px 0 15px rgba(0,0,0,0.4);
}
.bar-item:hover::before { opacity: 0.15; }

/* Esquerda da barra */
.bar-left { display: flex; gap: 12px; align-items: center; z-index: 1; }

/* Configuração rigorosa para a foto nunca cortar */
.avatar-frame {
  width: 36px; height: 36px; flex-shrink: 0;
  border: 2px solid var(--rk-c); /* Borda na cor do Tier */
  border-radius: 4px; overflow: hidden; background: #000;
}
.si-avatar {
  width: 100%; height: 100%;
  object-fit: cover; 
  object-position: top; /* Foca sempre na cabeça/rosto */
}

/* Textos e Pílulas */
.bar-info { display: flex; flex-direction: column; gap: 4px; }
.si-name { color: #fff; font-weight: 800; font-size: 13px; text-transform: uppercase; }
.bar-badges { display: flex; gap: 6px; align-items: center; }

.si-rank {
  background: var(--rk-c); color: var(--rk-bg);
  font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 3px;
}
.si-eff { font-size: 10px; color: #94a3b8; font-weight: 700; }

/* Botão */
.bar-btn {
  background: transparent; border: 1px solid var(--rk-c); color: var(--rk-c);
  padding: 6px 12px; border-radius: 4px; font-size: 9px; font-weight: 800;
  transition: 0.2s; z-index: 1;
}
.bar-item:hover .bar-btn { background: var(--rk-c); color: var(--rk-bg); }
.empty-list {
  text-align: center;
  color: #64748b;
  font-size: 11px;
  padding: 40px 20px;
  border: 1px dashed #334155;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.5); /* Fundo levemente escurecido */
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-top: 5px;
}

.empty-list small {
  display: block;
  margin-top: 10px;
  font-size: 9px;
  color: #536583;
  font-weight: 400;
}

@media (max-width: 450px) {
  .bar-item { padding: 8px 10px; min-height: 50px; }
  .si-name { font-size: 11px; }
  .bar-btn { padding: 5px 8px; font-size: 8px; }
}
</style>