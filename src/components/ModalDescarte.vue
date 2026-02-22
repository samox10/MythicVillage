<script setup>
import { ref } from 'vue'
import { RECURSOS_ANIMAIS } from '../data/balancing'

const props = defineProps({
  carcass: { type: Object, required: true },
  inventoryCount: { type: Number, required: true } // Quantos o utilizador tem no inventário
})

// Avisamos o ficheiro pai se o utilizador fechar ou confirmar o descarte
const emit = defineEmits(['close', 'confirm'])

// Esta variável controla a quantidade apenas dentro desta janela
const discardAmount = ref(1)

// Quando clicar em CONFIRMAR, envia a quantidade escolhida de volta
const handleConfirm = () => {
  emit('confirm', discardAmount.value)
}
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="tactical-card discard-modal">
      
      <div class="md-header bg-red">
         <span class="md-title text-white">⚠️ ALERTA DE DESCARTE</span>
         <button class="tc-close" @click="$emit('close')">✕</button>
      </div>
      
      <div class="md-body flex-col text-center">
         <p class="warning-text">
            Atenção! O descarte é <strong>PERMANENTE</strong>. A carcaça será incinerada e não gerará recursos para a vila.
         </p>

         <div class="discard-item-info">
            <img :src="`/assets/monstros/${carcass.img}`" class="discard-img" @error="$event.target.style.opacity='0.3'">
            <h2>{{ carcass.nome }}</h2>
            <p>Disponível na Câmara: <strong>{{ inventoryCount }}</strong></p>
         </div>

         <div class="discard-loot-lost">
            <span>Recursos perdidos no processo:</span>
            <div class="lost-items-row">
               <span v-for="(qtd, itemKey) in carcass.drops" :key="itemKey" class="lost-badge" :style="{ color: RECURSOS_ANIMAIS[itemKey].cor }">
                 {{ RECURSOS_ANIMAIS[itemKey].nome }}
               </span>
            </div>
         </div>

         <div class="discard-controls">
            <label>Quantidade a descartar:</label>
            <input type="number" v-model.number="discardAmount" min="1" :max="inventoryCount" class="discard-input">
            <button class="btn-max-discard" @click="discardAmount = inventoryCount">MÁX</button>
         </div>

         <div class="discard-buttons">
            <button class="btn-cancel" @click="$emit('close')">CANCELAR</button>
            <button class="btn-confirm-discard" @click="handleConfirm" :disabled="discardAmount < 1 || discardAmount > inventoryCount">
              CONFIRMAR DESCARTE
            </button>
         </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Apenas o CSS do modal de descarte */
.discard-modal { max-width: 380px; border-top: 4px solid #ef4444; background: #0f172a; }
.md-header { background: #1e293b; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
.md-title { font-size: 11px; font-weight: 900; letter-spacing: 2px; }
.bg-red { background: #7f1d1d; border-bottom: 1px solid #ef4444; }
.text-white { color: #fff; }
.md-body { padding: 20px; }
.flex-col { display: flex; flex-direction: column; }
.text-center { text-align: center; }

.warning-text { color: #fca5a5; font-size: 11px; margin: 0 0 15px 0; background: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 4px; border: 1px dashed #ef4444; line-height: 1.4; }

.discard-item-info { display: flex; flex-direction: column; align-items: center; gap: 5px; margin-bottom: 15px; }
.discard-img { width: 70px; height: 70px; object-fit: contain; filter: drop-shadow(0 5px 10px rgba(0,0,0,0.8)); }
.discard-item-info h2 { font-size: 16px; color: #fff; margin: 0; text-transform: uppercase; font-weight: 900; }
.discard-item-info p { font-size: 11px; color: #94a3b8; margin: 0; }
.discard-item-info strong { color: #38bdf8; }

.discard-loot-lost { background: #020617; border: 1px solid #1e293b; padding: 8px; border-radius: 4px; margin-bottom: 20px; }
.discard-loot-lost > span { font-size: 9px; color: #64748b; font-weight: 800; text-transform: uppercase; display: block; margin-bottom: 6px; }
.lost-items-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
.lost-badge { font-size: 10px; font-weight: 800; background: #0f172a; padding: 2px 6px; border-radius: 4px; border: 1px solid #334155; }

.discard-controls { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 20px; background: #1e293b; padding: 10px; border-radius: 6px; }
.discard-controls label { font-size: 11px; color: #cbd5e1; font-weight: bold; }
.discard-input { width: 60px; background: #020617; border: 1px solid #475569; color: #fff; padding: 6px; text-align: center; border-radius: 4px; font-family: 'Chakra Petch', sans-serif; font-size: 14px; font-weight: bold; }
.discard-input:focus { outline: 1px solid #ef4444; }
.btn-max-discard { background: #0f172a; border: 1px solid #334155; color: #38bdf8; padding: 6px 10px; border-radius: 4px; font-size: 10px; font-weight: 900; cursor: pointer; transition: 0.2s; }
.btn-max-discard:hover { border-color: #38bdf8; background: #0284c7; color: #fff; }

.discard-buttons { display: flex; gap: 10px; width: 100%; }
.btn-cancel, .btn-confirm-discard { flex: 1; padding: 12px; border-radius: 4px; font-family: 'Chakra Petch', sans-serif; font-weight: 900; font-size: 11px; cursor: pointer; transition: 0.2s; }
.btn-cancel { background: #1e293b; border: 1px solid #475569; color: #cbd5e1; }
.btn-cancel:hover { background: #334155; color: #fff; }
.btn-confirm-discard { background: #7f1d1d; border: 1px solid #ef4444; color: #fca5a5; }
.btn-confirm-discard:hover:not(:disabled) { background: #b91c1c; color: #fff; box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
.btn-confirm-discard:disabled { opacity: 0.4; cursor: not-allowed; }

input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
/* Remove as setinhas no Firefox usando o padrão universal e o fallback */
input[type=number] { 
  appearance: textfield; /* Padrão moderno (Tira o warning do VS Code) */
  -moz-appearance: textfield; /* Mantém para Firefox mais antigos */
}
</style>