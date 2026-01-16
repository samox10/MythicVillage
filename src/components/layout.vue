<script setup>
import { ref } from 'vue';
import { jogo } from '../jogo.js'
// Importe aqui a lógica global do jogo se precisar
// import { jogo } from '../jogo.js';
// Funções de Interface
</script>

<template>
<div class="pagina-container">
    
    <div class="header-secao">
        <div class="titulo-nivel">
            <h2>🌲 Título da Seção</h2> 
        </div>
        
        <div class="info-secao">
            <span class="badge-nivel">Nível 1</span>
            </div>
    </div>

    <div>
        teste
    </div>
</div>
</template>

<style scoped>
/* --- ESTRUTURA PRINCIPAL --- */
.pagina-container { padding: 10px; max-width: 800px; margin: 0 auto; }

/* Cabeçalho */
.header-secao { 
    background: #2c3e50; color: white; padding: 15px; 
    border-radius: 8px; margin-bottom: 20px; 
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 10px;
}
.titulo-nivel h2 { margin: 0; font-size: 1.4em; }
.badge-nivel { background: #f39c12; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }

</style>
