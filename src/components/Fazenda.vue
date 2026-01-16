<script setup>
  // Importamos o cérebro
  import { jogo, acoes } from '../jogo.js';
</script>

<template>
  <div class="fazenda-container">
    <div class="animal-card">
      <div class="animal-header">
        <span>🐔 Galinhas: {{ jogo.galinhas }}</span>
        <small> Ovos (5s)</small>
      </div>
      <button 
        @click="acoes.comprarAnimal('galinha')" 
        :disabled="jogo.ouro < jogo.custoGalinha"
      >
        Comprar (💰 {{ jogo.custoGalinha }})
      </button>
    </div>

    <div class="animal-card">
      <div class="animal-header">
        <span>🐑 Ovelhas: {{ jogo.ovelhas }}</span>
        <small> Lã (15s)</small>
      </div>
      <button 
        @click="acoes.comprarAnimal('ovelha')" 
        :disabled="jogo.ouro < jogo.custoOvelha"
      >
        Comprar (💰 {{ jogo.custoOvelha }})
      </button>
    </div>

    <div class="animal-card">
      <div class="animal-header">
        <span>🐄 Vacas: {{ jogo.vacas }}</span>
        <small> Leite (30s)</small>
      </div>
      <button 
        @click="acoes.comprarAnimal('vaca')" 
        :disabled="jogo.ouro < jogo.custoVaca"
      >
        Comprar (💰 {{ jogo.custoVaca }})
      </button>
    </div>
  </div>
</template>