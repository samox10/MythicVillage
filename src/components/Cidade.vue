<script setup>
  import { jogo, acoes, limites } from '../jogo.js';
  
  // Função auxiliar para formatar tempo (ex: 65s -> 1:05)
  const formatarTempo = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Helper para verificar se tem recursos (para deixar o botão cinza ou colorido)
  const podePagar = (custoObj) => {
      if (!custoObj) return false;
      const chaves = Object.keys(custoObj);
      for (let k of chaves) {
          const tenho = (jogo.minerios && jogo.minerios[k] !== undefined) ? jogo.minerios[k] : jogo[k];
          if (tenho < custoObj[k]) return false;
      }
      return true;
  };
</script>

<template>
  <div class="cidade-container">
    
    <div class="area-destaque">
        <div class="card-predio castelo">
            <div class="info-predio">
                <div class="titulo-predio">🏰 Castelo da Vila</div>
                <div class="nivel-badge">Nível {{ jogo.prefeitura }}</div>
                <p class="desc-predio">
                    Aumenta o limite de construções (Atual: {{ limites.casas }} prédios).
                </p>
            </div>
            
            <div class="acao-predio">
                <button 
                    class="btn-acao azul"
                    :class="{ 'ocupado': jogo.construindo.tipo === 'prefeitura', 'sem-recurso': !podePagar(jogo.custoPrefeitura) && !jogo.construindo.tipo }"
                    @click="acoes.evoluir('prefeitura')" 
                    :disabled="jogo.construindo.tipo"
                >
                    <div v-if="jogo.construindo.tipo === 'prefeitura'" class="conteudo-btn">
                        <span>⏳ Construindo...</span>
                        <small>{{ formatarTempo(jogo.construindo.tempoRestante) }}</small>
                    </div>
                    <div v-else class="conteudo-btn">
                        <span>Evoluir Castelo</span>
                        <div class="custo-btn">
                            <span v-if="jogo.custoPrefeitura.madeira">🌲{{ jogo.custoPrefeitura.madeira }}</span>
                            <span v-if="jogo.custoPrefeitura.pedra">🪨{{ jogo.custoPrefeitura.pedra }}</span>
                            <span v-if="jogo.custoPrefeitura.comida">🍖{{ jogo.custoPrefeitura.comida }}</span>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    </div>

    <div class="divisor-secao">Prédios da Vila</div>

    <div class="grid-predios">
        
        <div class="card-predio">
            <div class="cabecalho-card">
                <span class="icone-card">🏠</span>
                <span class="nome-card">Alojamentos</span>
                <span class="nivel-card">Qtd: {{ jogo.casas }}</span>
            </div>
            <div class="corpo-card">
                <p>Aumenta a população máxima (+2 por casa).</p>
                <button class="btn-acao verde" 
                    :class="{ 'sem-recurso': !podePagar(jogo.custoCasa) }"
                    @click="acoes.construir('casa')" :disabled="jogo.construindo.tipo">
                    <span class="texto-principal">Construir Casa</span>
                    <small class="texto-custo">🌲{{ jogo.custoCasa.madeira }} 🪨{{ jogo.custoCasa.pedra }}</small>
                </button>
            </div>
        </div>

        <div class="card-predio">
            <div class="cabecalho-card">
                <span class="icone-card">📦</span>
                <span class="nome-card">Armazém</span>
                <span class="nivel-card">Qtd: {{ jogo.armazens }}</span>
            </div>
            <div class="corpo-card">
                <p>Aumenta capacidade de recursos (+500 cada).</p>
                <button class="btn-acao verde" 
                    :class="{ 'sem-recurso': !podePagar(jogo.custoArmazem) }"
                    @click="acoes.construir('armazem')" :disabled="jogo.construindo.tipo">
                    <span class="texto-principal">Construir Silo</span>
                    <small class="texto-custo">🌲{{ jogo.custoArmazem.madeira }} 🪨{{ jogo.custoArmazem.pedra }}</small>
                </button>
            </div>
        </div>

        <div class="card-predio">
            <div class="cabecalho-card">
                <span class="icone-card">🍺</span>
                <span class="nome-card">Guilda</span>
                <span class="nivel-card">Nv {{ jogo.taverna }}</span>
            </div>
            <div class="corpo-card">
                <p>Melhora a qualidade dos trabalhadores contratados.</p>
                
                <button v-if="jogo.taverna < 10" class="btn-acao verde" 
                    :class="{ 'sem-recurso': !podePagar(jogo.custoTaverna) }"
                    @click="acoes.evoluir('taverna')" :disabled="jogo.construindo.tipo">
                    <span class="texto-principal">Expandir Guilda</span>
                    <small class="texto-custo">🌲{{ jogo.custoTaverna.madeira }} 🪨{{ jogo.custoTaverna.pedra }}</small>
                </button>
                <div v-else class="btn-maximo">Nível Máximo</div>
            </div>
        </div>

        <div class="card-predio">
            <div class="cabecalho-card">
                <span class="icone-card">📘</span>
                <span class="nome-card">Biblioteca</span>
                <span class="nivel-card">Nv {{ jogo.biblioteca || 0 }}</span>
            </div>
            <div class="corpo-card">
                <p>Desbloqueia pesquisas e saberes arcanos.</p>
                
                <button class="btn-acao verde" 
                    :class="{ 'sem-recurso': !podePagar(jogo.custoBiblioteca) }"
                    @click="acoes.construir('biblioteca')" :disabled="jogo.construindo.tipo">
                    
                    <span class="texto-principal" v-if="!jogo.biblioteca">Construir Biblioteca</span>
                    <span class="texto-principal" v-else>Expandir Acervo</span>
                    
                    <small class="texto-custo">
                        🌲{{ jogo.custoBiblioteca.madeira }} 
                        🪨{{ jogo.custoBiblioteca.pedra }}
                        🟡{{ jogo.custoBiblioteca.ouro }}
                    </small>
                </button>
            </div>
        </div>

    </div>
  </div>
</template>

<style scoped>
/* --- LAYOUT GERAL --- */
.cidade-container {
    padding: 10px;
    animation: fadeIn 0.5s ease;
}

.divisor-secao {
    font-size: 0.9em;
    text-transform: uppercase;
    color: #95a5a6;
    font-weight: bold;
    margin: 20px 0 10px 0;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 5px;
}

/* --- ESTILO DOS CARDS --- */
.grid-predios {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Responsivo */
    gap: 15px;
}

.card-predio {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 0 #dfe6e9; /* Sombra sólida para dar volume */
    border: 1px solid #ecf0f1;
    padding: 15px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s;
}
.card-predio:hover {
    transform: translateY(-2px); /* Levanta levemente */
}

/* Header do Card Pequeno */
.cabecalho-card {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    border-bottom: 1px dashed #ecf0f1;
    padding-bottom: 8px;
}
.icone-card { font-size: 1.5em; }
.nome-card { font-weight: 800; color: #2c3e50; font-size: 1.1em; flex: 1; }
.nivel-card { background: #f1f2f6; color: #7f8c8d; font-size: 0.8em; padding: 2px 6px; border-radius: 4px; font-weight: bold;}

.corpo-card p {
    font-size: 0.9em;
    color: #7f8c8d;
    margin: 0 0 15px 0;
    line-height: 1.4;
    min-height: 40px; /* Alinha os botões */
}

/* --- CARD DESTAQUE (CASTELO) --- */
.card-predio.castelo {
    flex-direction: row;
    align-items: center;
    border: 2px solid #3498db;
    background: #ebf5fb; /* Azul bem clarinho */
    box-shadow: 0 6px 0 #d6eaf8;
}
.info-predio { flex: 1; }
.titulo-predio { font-size: 1.4em; font-weight: 900; color: #2980b9; margin-bottom: 5px; }
.nivel-badge { display: inline-block; background: #3498db; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; margin-bottom: 5px; }

@media (max-width: 600px) {
    .card-predio.castelo { flex-direction: column; text-align: center; gap: 15px; }
}

/* --- BOTÕES ESTILIZADOS 3D --- */
.btn-acao {
    width: 100%;
    border: none;
    padding: 10px 15px;
    border-radius: 8px;
    cursor: pointer;
    font-family: inherit;
    position: relative;
    top: 0;
    transition: all 0.1s;
    
    /* Flex para alinhar texto e custo */
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

/* Botão Verde (Padrão) */
.btn-acao.verde {
    background-color: #2ecc71;
    color: white;
    box-shadow: 0 4px 0 #27ae60; /* Sombra escura do verde */
}
.btn-acao.verde:active:not(:disabled) {
    top: 4px; /* Afunda */
    box-shadow: 0 0 0 #27ae60;
}

/* Botão Azul (Castelo) */
.btn-acao.azul {
    background-color: #3498db;
    color: white;
    box-shadow: 0 4px 0 #2980b9;
    min-width: 150px;
}
.btn-acao.azul:active:not(:disabled) {
    top: 4px;
    box-shadow: 0 0 0 #2980b9;
}

/* Estados do Botão */
.texto-principal { font-weight: 800; font-size: 1em; text-transform: uppercase; letter-spacing: 0.5px; }
.texto-custo { font-size: 0.85em; opacity: 0.9; font-weight: 600; }

.custo-btn { display: flex; gap: 8px; font-size: 0.9em; font-weight: bold; }

/* Botão Sem Recurso (Cinza mas clicável visualmente para feedback, ou travado) */
.btn-acao.sem-recurso {
    background-color: #ecf0f1;
    color: #95a5a6;
    box-shadow: 0 4px 0 #bdc3c7;
    cursor: not-allowed;
    opacity: 0.8;
}

.btn-maximo {
    text-align: center;
    padding: 10px;
    background: #dfe6e9;
    color: #7f8c8d;
    border-radius: 8px;
    font-weight: bold;
    font-size: 0.9em;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>