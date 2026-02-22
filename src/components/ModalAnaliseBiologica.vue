<script setup>
import { RECURSOS_ANIMAIS } from '../data/balancing'

// "Props" são as informações que este ficheiro vai receber do ficheiro principal
defineProps({
  carcass: { type: Object, required: true }
})

// "Emits" são os avisos que este ficheiro manda para o ficheiro principal (ex: fechar)
defineEmits(['close'])
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="tactical-card monster-detail-card">
      
      <div class="md-header">
         <span class="md-title">ANÁLISE BIOLÓGICA</span>
         <button class="tc-close" @click="$emit('close')">✕</button>
      </div>

      <div class="md-body">
         <div class="md-visual">
            <img :src="`/assets/monstros/${carcass.img}`" class="md-big-img">
         </div>
         
         <div class="md-info">
            <h2 class="md-monster-name">{{ carcass.nome }}</h2>
            <div class="md-habitat">📍 <strong>Habitat:</strong> {{ carcass.habitat }}</div>
            <div class="md-time">⏱️ <strong>Tempo Base de Corte:</strong> {{ carcass.tempoBase }} Segundos</div>
            <div class="md-time">🛡️ <strong>Dureza Estrutural:</strong> Nível {{ carcass.dureza }}</div>
            
            <div class="md-loot-section">
               <div class="md-loot-title">MATERIAIS EXTRAÍDOS</div>
               <div class="md-loot-grid">
                  <div v-for="(qtd, itemKey) in carcass.drops" :key="itemKey" class="md-loot-item">
                     <div class="loot-color-bar" :style="{ backgroundColor: RECURSOS_ANIMAIS[itemKey].cor }"></div>
                     <span class="loot-q">{{ qtd }}x</span>
                     <span class="loot-n">{{ RECURSOS_ANIMAIS[itemKey].nome }}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Apenas o CSS responsável por esta janela */
.monster-detail-card { max-width: 550px; background: #0f172a; border-top: 4px solid #38bdf8; }
.md-header { background: #1e293b; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
.md-title { font-size: 11px; font-weight: 900; color: #38bdf8; letter-spacing: 2px; }
.md-body { display: flex; gap: 20px; padding: 20px; }
.md-visual { width: 150px; height: 150px; background: #020617; border: 1px solid #334155; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 10px; box-shadow: inset 0 0 30px rgba(0,0,0,0.8); flex-shrink: 0; }
.md-big-img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.8)); }
.md-info { flex: 1; display: flex; flex-direction: column; gap: 10px; }
.md-monster-name { margin: 0; font-size: 18px; color: #fff; text-transform: uppercase; font-weight: 800; border-bottom: 1px solid #1e293b; padding-bottom: 5px; }
.md-habitat, .md-time { font-size: 11px; color: #cbd5e1; background: #1e293b; padding: 6px 10px; border-radius: 4px; border-left: 2px solid #475569; }
.md-loot-section { margin-top: auto; }
.md-loot-title { font-size: 10px; color: #94a3b8; font-weight: 900; letter-spacing: 1px; margin-bottom: 8px; }
.md-loot-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.md-loot-item { display: flex; align-items: center; background: #1e293b; padding: 4px 8px; border-radius: 4px; gap: 6px; border: 1px solid #334155; }
.loot-color-bar { width: 4px; height: 12px; border-radius: 2px; }
.loot-q { font-size: 11px; font-weight: 900; color: #fff; }
.loot-n { font-size: 9px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; }

@media (max-width: 550px) {
  .md-body { flex-direction: column; align-items: center; text-align: center; }
  .md-habitat, .md-time { text-align: left; }
  .md-loot-grid { justify-content: center; }
}
</style>