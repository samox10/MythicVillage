<script setup>
  import { jogo, acoes, limites } from '../jogo.js';
  
  const formatarTempo = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };
</script>

<template>
  <div class="cidade">
    <h3>Gestão da Vila</h3>

    <div class="construcao-card destaque">
      <h4>🏰 Castelo (Nv {{ jogo.prefeitura }})</h4>
      <p>Limite de Prédios: {{ limites.casas }}</p>
      <button class="btn-upgrade" @click="acoes.evoluir('prefeitura')" 
        :disabled="jogo.construindo.tipo">
        <span v-if="jogo.construindo.tipo === 'prefeitura'">🔨 Construindo... ({{ formatarTempo(jogo.construindo.tempoRestante) }})</span>
        <span v-else>Evoluir (🌲{{ jogo.custoPrefeitura.madeira }} 🪨{{ jogo.custoPrefeitura.pedra }} 🍖{{ jogo.custoPrefeitura.comida }})</span>
      </button>
    </div>

    <div class="grid-predios">
        <div class="construcao-card">
        <h4>🏠 Alojamentos ({{ jogo.casas }})</h4>
        <button @click="acoes.construir('casa')" 
            :disabled="jogo.construindo.tipo || (jogo.casas + jogo.armazens) >= limites.casas">
            <span v-if="jogo.construindo.tipo === 'casa'">🔨...</span>
            <span v-else>Construir (🌲{{ jogo.custoCasa.madeira }} 🪨{{ jogo.custoCasa.pedra }})</span>
        </button>
        </div>

        <div class="construcao-card">
        <h4>📦 Depósito ({{ jogo.armazens }})</h4>
        <button @click="acoes.construir('armazem')" 
            :disabled="jogo.construindo.tipo || (jogo.casas + jogo.armazens) >= limites.casas">
            <span v-if="jogo.construindo.tipo === 'armazem'">🔨...</span>
            <span v-else>Construir (🌲{{ jogo.custoArmazem.madeira }} 🪨{{ jogo.custoArmazem.pedra }})</span>
        </button>
        </div>

        <div class="construcao-card">
            <h4>⛏️ Mina (Nv {{ jogo.mina }})</h4>
            <div v-if="jogo.mina === 0">
                <button @click="acoes.construir('mina')" :disabled="jogo.construindo.tipo">
                    Construir (🌲{{ jogo.custoMina.madeira }} 🍖{{ jogo.custoMina.comida }})
                </button>
            </div>
            <div v-else>
                <button @click="acoes.evoluir('mina')" :disabled="jogo.construindo.tipo">
                     Evoluir (🌲{{ jogo.custoMina.madeira }} 🍖{{ jogo.custoMina.comida }})
                </button>
            </div>
        </div>

        <div class="construcao-card">
            <h4>⚔️ Ferraria (Nv {{ jogo.ferraria }})</h4>
            <div v-if="jogo.ferraria === 0">
                <button @click="acoes.construir('ferraria')" :disabled="jogo.construindo.tipo">
                    Construir (🌲{{ jogo.custoFerraria.madeira }} 🪨{{ jogo.custoFerraria.pedra }})
                </button>
            </div>
            <div v-else>
                <button @click="acoes.evoluir('ferraria')" :disabled="jogo.construindo.tipo">
                     Evoluir
                </button>
            </div>
        </div>

        <div class="construcao-card">
            <h4>📘 Biblioteca (Nv {{ jogo.biblioteca }})</h4>
            <div v-if="jogo.biblioteca === 0">
                <button @click="acoes.construir('biblioteca')" :disabled="jogo.construindo.tipo">
                    Construir (🌲{{ jogo.custoBiblioteca.madeira }} 🪨{{ jogo.custoBiblioteca.pedra }} <img src="/assets/ui/icone_goldC.png" class="icon-moeda-topo" alt="Ouro">{{ jogo.custoBiblioteca.ouro }})
                </button>
            </div>
            <div v-else>
                <button @click="acoes.evoluir('biblioteca')" :disabled="jogo.construindo.tipo">
                     Evoluir
                </button>
            </div>
        </div>
        <div class="construcao-card">
            <h4>📜 Guilda dos Trabalhadores (Nv {{ jogo.taverna }})</h4>
            
            <div v-if="jogo.taverna === 0">
                <p class="desc-predio">Libera recrutamento de funcionários.</p>
                <button @click="acoes.construir('taverna')" :disabled="jogo.construindo.tipo">
                    Construir (🌲{{ jogo.custoTaverna.madeira }} 🪨{{ jogo.custoTaverna.pedra }})
                </button>
            </div>
            
            <div v-else>
                <p class="desc-predio">Nível máx: 10. <br> Nível atual libera Tiers melhores.</p>
                <button 
                    @click="acoes.evoluir('taverna')" 
                    :disabled="jogo.construindo.tipo || jogo.taverna >= 10"
                >
                     <span v-if="jogo.taverna >= 10">Nível Máximo</span>
                     <span v-else>Evoluir (🌲{{ jogo.custoTaverna.madeira }} 🪨{{ jogo.custoTaverna.pedra }})</span>
                </button>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.grid-predios { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
.construcao-card { background: white; padding: 10px; border-radius: 5px; border: 1px solid #ccc; }
.destaque { border: 2px solid #2980b9; background: #eaf2f8; grid-column: 1 / -1; }
button { width: 100%; margin-top: 5px; cursor: pointer; padding: 8px; }
button:disabled { background: #ccc; cursor: not-allowed; }
.icon-moeda-topo {
  /* Usamos 'em' para que o tamanho seja relativo ao tamanho da fonte do texto ao lado (1.1em) */
  width: 1.2em;
  height: 1.2em;
  object-fit: contain;
  /* Alinha a base da imagem com a base do texto, similar a um emoji */
  vertical-align: text-bottom;
  /* Um pequeno espaçamento entre o ícone e o número */
  margin-right: 4px;
}
</style>