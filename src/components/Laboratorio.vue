<script setup>
  import { jogo, acoes } from '../jogo.js';
</script>

<template>
  <div class="laboratorio-container">
    
    <div v-if="jogo.laboratorio === 0" class="construcao-card destaque-lab">
      <h4>⚗️ Construir Laboratório</h4>
      <p>Permite gerar Ciência e criar Tecnologias.</p>
      
      <button 
        class="btn-upgrade lab-btn" 
        @click="acoes.construir('laboratorio')"
        :disabled="jogo.madeira < jogo.custoLaboratorio.madeira || jogo.pedra < jogo.custoLaboratorio.pedra || jogo.ouro < jogo.custoLaboratorio.ouro"
      >
        Construir (🌲{{ jogo.custoLaboratorio.madeira }} 🪨{{ jogo.custoLaboratorio.pedra }} 💰{{ jogo.custoLaboratorio.ouro }})
      </button>
    </div>

    <div v-else>
      <div class="aviso-lab">
        <p>🧪 Ciência: <strong>{{ Math.floor(jogo.ciencia) }}</strong></p>
        <small>Contrate cientistas na aba "Povo" para gerar pontos.</small>
      </div>

      <div v-for="tech in jogo.listaTechs" :key="tech.id" class="tech-card" :class="{'tech-feita': tech.feito}">
        <div class="tech-info">
          <span class="tech-nome">{{ tech.nome }}</span>
          <span class="tech-desc">{{ tech.desc }}</span>
        </div>
        
        <button 
          v-if="!tech.feito"
          class="btn-pesquisar"
          @click="acoes.pesquisar(tech)"
          :disabled="jogo.ciencia < (tech.custo.ciencia || 0) || jogo.madeira < (tech.custo.madeira || 0) || jogo.comida < (tech.custo.comida || 0) || jogo.ouro < (tech.custo.ouro || 0)"
        >
          Pesquisar <br>
          <small>
            <span v-if="tech.custo.ciencia">🧪{{ tech.custo.ciencia }} </span>
            <span v-if="tech.custo.madeira">🌲{{ tech.custo.madeira }} </span>
            <span v-if="tech.custo.ouro">💰{{ tech.custo.ouro }}</span>
          </small>
        </button>
        
        <div v-else class="tech-check">✅ Pesquisado</div>
      </div>
    </div>

  </div>
</template>