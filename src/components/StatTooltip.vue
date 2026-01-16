<script setup>
import { ref, computed } from 'vue';
import { obterBuffRaca } from '../jogo.js'; // Importando do arquivo na raiz
import StatTooltip from './StatTooltip.vue';   // Importa o componente para uso interno, se necessário

const props = defineProps({
  func: { type: Object, required: true },
  tipo: { type: String, default: 'auto' }, // 'auto', 'producao', 'ataque', 'defesa', etc.
  valorBase: { type: Number, default: null } // Opcional, para casos como Comandante que tem vários stats
});

const tooltipAberto = ref(false);

// Alterna o tooltip (comportamento de clique para mobile/desktop)
const toggle = () => {
  tooltipAberto.value = !tooltipAberto.value;
};

// Calcula a porcentagem do buff racial (ex: 10 para 10%)
const buffPct = computed(() => obterBuffRaca(props.func));

// Lógica central de cálculo
const stats = computed(() => {
  let original = 0;
  let final = 0;
  let isPorcentagem = false;

  // CASO 1: Produção (Minérios/Madeira)
  if (props.tipo === 'producao') {
    original = Math.floor((props.func.bonus - 1) * 100);
    final = Math.floor(((props.func.bonus * (1 + (buffPct.value / 100))) - 1) * 100);
    isPorcentagem = true;
  } 
  // CASO 2: Atributos Específicos (Comandante: Ataque, Defesa...)
  else if (props.valorBase !== null) {
    original = props.valorBase;
    final = Math.floor(original * (1 + (buffPct.value / 100)));
    isPorcentagem = false;
  }
  // CASO 3: Poder Especial (Gerente, Médico, Prefeito...)
  else {
    original = props.func.poderEspecial || props.func.poderGerencia || 0;
    // Opcional: Se quiser tratar Bancário que usa float, adicionar lógica aqui
    const calc = original * (1 + (buffPct.value / 100));
    final = Number.isInteger(original) ? Math.floor(calc) : parseFloat(calc.toFixed(2));
    isPorcentagem = (props.func.profissao !== 'gerente');
  }

  let ganho = final - original;
  if (!Number.isInteger(ganho)) ganho = parseFloat(ganho.toFixed(2));

  return { original, final, ganho, isPorcentagem };
});
</script>

<template>
  <span class="stat-container" @click.stop="toggle" @mouseleave="tooltipAberto = false">
    
    <span :class="{ 'buffado': buffPct > 0 }">
      <slot name="icon"></slot> {{ stats.final }}{{ stats.isPorcentagem ? '%' : '' }}
    </span>

    <div v-if="tooltipAberto && buffPct > 0" class="balao-flutuante">
      Base: {{ stats.original }}{{ stats.isPorcentagem ? '%' : '' }}<br>
      <span class="verde">Bônus: +{{ stats.ganho }}{{ stats.isPorcentagem ? '%' : '' }}</span>
    </div>

  </span>
</template>

<style scoped>
.stat-container {
  position: relative;
  display: inline-block;
  cursor: help;
}

.buffado {
  color: #2ecc71;
  font-weight: bold;
  border-bottom: 1px dotted #2ecc71;
}

.balao-flutuante {
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background: #2c3e50;
  color: #fff;
  padding: 8px;
  border-radius: 5px;
  font-size: 0.85em;
  white-space: nowrap;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  z-index: 100;
  border: 1px solid #f1c40f;
  text-align: center;
  line-height: 1.4;
  min-width: 80px;
}

.balao-flutuante::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #2c3e50 transparent transparent transparent;
}

.verde { color: #2ecc71; font-weight: bold; }
</style>
