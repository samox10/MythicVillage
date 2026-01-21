<style>
body {
  /* Substitua pelo caminho da sua imagem de fantasia/mapa */
  background-image: url('/assets/ui/fundo-mapa.png');
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
  background-repeat: no-repeat;
  
  /* Fallback cinza claro */
  background-color: #dfe6e9; 
  margin: 0;
  
  /* Fonte padrão */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #2c3e50; /* Garante texto escuro no corpo */
}

/* Scrollbar Estilo Light (Cinza Suave) */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #ecf0f1; }
::-webkit-scrollbar-thumb { background: #bdc3c7; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #95a5a6; }
</style>

<script setup>
  import { ref, onMounted } from 'vue';
  import { jogo, limites, populacaoTotal, acoes, iniciarLoop, iniciarSave, resetar, dadosMinerais } from './jogo.js';
  
  // Componentes
  import Cidade from './components/Cidade.vue';
  import Taverna from './components/Taverna.vue';
  import Mina from './components/Mina.vue';
  import Ferraria from './components/Ferraria.vue';
  import Inventario from './components/Inventario.vue';
  import Modal from './components/Modal.vue';
  import Biblioteca from './components/Biblioteca.vue';

  // --- ESTADO DA NAVEGAÇÃO ---
  const categoriaAtual = ref('cidade'); 
  const abaAtual = ref('visao_geral');
  const menuAberto = ref(null); 

  const navegarDireto = (cat, aba) => {
    categoriaAtual.value = cat;
    abaAtual.value = aba;
    menuAberto.value = null;
  };

  const alternarMenu = (cat) => {
    if (menuAberto.value === cat) menuAberto.value = null;
    else menuAberto.value = cat;
  };

  const selecionarOpcao = (cat, aba) => {
    categoriaAtual.value = cat;
    abaAtual.value = aba;
    menuAberto.value = null;
  };

  // --- HELPERS VISUAIS ---
  const getImagemMinerio = (nome) => {
    const imagens = {
        pedra: '/assets/recursos/min_pedra.png', cobre: '/assets/recursos/min_cobre.png',
        estanho: '/assets/recursos/min_estanho.png', ferro: '/assets/recursos/min_ferro.png',
        niquel: '/assets/recursos/min_niquel.png', prata: '/assets/recursos/min_prata.png',
        ouro_min: '/assets/recursos/min_ouro.png', platina: '/assets/recursos/min_platina.png',
        cristal: '/assets/recursos/min_cristal.png', obsidiana: '/assets/recursos/min_obsidiana.png',
        titanio: '/assets/recursos/min_titanio.png', tungstenio: '/assets/recursos/min_tungstenio.png',
        rubi: '/assets/recursos/min_rubi.png', safira: '/assets/recursos/min_safira.png',
        esmeralda: '/assets/recursos/min_esmeralda.png', diamante: '/assets/recursos/min_diamante.png',
        mithril: '/assets/recursos/min_mithril.png', adamantium: '/assets/recursos/min_adamantium.png',
        oricalco: '/assets/recursos/min_oricalco.png', draconita: '/assets/recursos/min_draconita.png',
        aetherium: '/assets/recursos/min_aetherium.png',      
    };
    return imagens[nome] || 'https://img.icons8.com/color/48/box.png';
  };

  const formatarTempo = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m ${sec}s`;
  };

  onMounted(() => {
    iniciarLoop();
    iniciarSave();
  });
</script>

<template>
  <div class="jogo">
    
    <div class="header-geral">
       <div class="header-bg"></div>
    </div>

    <div v-if="jogo.construindo.tipo" class="barra-construcao-clean animacao-entrada">
        <div class="info-construcao">
            <span class="label-construcao">🔨 Construindo: <strong>{{ jogo.construindo.tipo.toUpperCase() }}</strong></span>
            <small class="tempo-construcao">{{ formatarTempo(jogo.construindo.tempoRestante) }}</small>
        </div>
        <div class="progresso-fundo-clean">
            <div class="progresso-enchimento-clean" 
                 :style="{ width: ((jogo.construindo.tempoTotal - jogo.construindo.tempoRestante) / jogo.construindo.tempoTotal * 100) + '%' }">
            </div>
        </div>
    </div>

    <div class="recursos-container-clean">
      
      <div class="recursos-row principal">
        <div class="res-item" title="Couro"><img src="/assets/ui/icone_couro.png" class="icon-moeda-topo"> {{ Math.floor(jogo.couro) }}</div>
        <div class="res-item" title="Madeira"><img src="/assets/ui/icone_madeira.png" class="icon-moeda-topo"> {{ Math.floor(jogo.madeira).toLocaleString('pt-BR') }}</div>
        <div class="res-item" title="Comida"><img src="/assets/ui/icone_comida.png" class="icon-moeda-topo"> {{ Math.floor(jogo.comida).toLocaleString('pt-BR') }}</div>
        <div class="res-item destaque-ouro" title="Ouro"><img src="/assets/ui/icone_goldC.png" class="icon-moeda-topo"> {{ Math.floor(jogo.ouro).toLocaleString('pt-BR') }}</div>
      </div>

      <div class="recursos-minerais">
        <template v-for="(quantidade, nome) in jogo.minerios" :key="nome">
          <span v-if="quantidade > 0" class="minerio-tag-clean" :title="nome.toUpperCase()">
            <img :src="getImagemMinerio(nome)" class="icon-minerio">
            {{ Math.floor(quantidade).toLocaleString('pt-BR') }}
          </span>
        </template>
      </div>

      <div class="recursos-row info-extra-clean">
        <span class="info-item-alinhado" title="População">
          <img src="/assets/ui/icone_morador.png" class="icon-minerio">
          {{ populacaoTotal }} / {{ jogo.populacaoMax }}
        </span>
        <span class="info-item-alinhado" title="Cargos de Elite">
            👑 {{ jogo.funcionarios.filter(f => f.isEspecial).length }} / {{ limites.vagasEspeciais }}
        </span>
        <span class="info-item-alinhado" title="Capacidade de Armazenamento">
            📦 {{ limites.recursos.toLocaleString('pt-BR') }}
        </span>
      </div>
    </div>

    <div class="nav-bar-clean">
      
      <div class="nav-item">
        <button class="nav-btn-clean" :class="{ ativo: categoriaAtual === 'cidade' }" @click="navegarDireto('cidade', 'visao_geral')" title="Castelo & Vila"> 
            🏛️ <span class="nav-label"></span>
        </button>
      </div>

      <div class="nav-item">
        <button class="nav-btn-clean" :class="{ 'menu-aberto': menuAberto === 'producao', ativo: categoriaAtual === 'producao' }" @click="alternarMenu('producao')" title="Área de Produção">
            ⚙️ <span class="nav-label"></span>
        </button>

        <Transition name="fade-slide">
            <div v-if="menuAberto === 'producao'" class="dropdown-menu-clean">
                <button @click="selecionarOpcao('producao', 'mina')">⛏️ Mina</button>
                <button @click="selecionarOpcao('producao', 'ferraria')">⚔️ Ferraria</button>
            </div>
        </Transition>
      </div>

      <div class="nav-item">
        <button class="nav-btn-clean" :class="{ ativo: categoriaAtual === 'inventario' }" @click="navegarDireto('inventario', 'itens')" title="Seu Inventário">
          🎒 <span class="nav-label"></span>
        </button>
      </div>

      <div class="nav-item">
        <button class="nav-btn-clean" :class="{ ativo: categoriaAtual === 'taverna' }" @click="navegarDireto('taverna', 'geral')" title="Guilda dos Trabalhadores"> 
            📜 <span class="nav-label"></span>
        </button>
      </div>

      <div class="nav-item">
        <button class="nav-btn-clean" :class="{ ativo: categoriaAtual === 'biblioteca' }" @click="navegarDireto('biblioteca', 'biblioteca')" title="Biblioteca Arcana"> 
            📘 <span class="nav-label"></span>
        </button>
      </div>

    </div>

    <div class="conteudo-aba">
      <Cidade v-if="abaAtual === 'visao_geral' && categoriaAtual === 'cidade'" />
      
      <Mina v-if="abaAtual === 'mina' && categoriaAtual === 'producao'" />
      <Ferraria v-if="abaAtual === 'ferraria' && categoriaAtual === 'producao'" />
      
      <Taverna v-if="abaAtual === 'geral' && categoriaAtual === 'taverna'" />
      <Inventario v-if="abaAtual === 'itens' && categoriaAtual === 'inventario'" />
      <Biblioteca v-if="abaAtual === 'biblioteca' && categoriaAtual === 'biblioteca'" />
    </div>

    <Modal />

    <div class="rodape-clean">
      <div class="grupo-botoes-debug">
          <button class="btn-debug" @click="acoes.hack" title="Adiciona Recursos">+ Res</button>
          <button class="btn-debug" @click="acoes.hackConstrucoes" title="Acelera Construção">Speed</button>
      </div>
      <div class="grupo-botoes-perigo">
          <button class="btn-reset-soft" @click="acoes.resetarRecursos">Limpar</button>
          <button class="btn-reset-hard" @click="resetar">Reset Save</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* --- CONTAINER PRINCIPAL (WHITE / LIGHT THEME) --- */
.jogo {
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh; 
  padding-bottom: 30px;
  
  /* MUDANÇA: Fundo Branco Levemente Translúcido */
  background: #f1f1f1; 
  
  /* Sombra para destacar do wallpaper */
  
  position: relative;
  
  /* MUDANÇA: Texto Escuro para contraste no fundo branco */
  color: #2c3e50; 
}

/* --- CABEÇALHO --- */
.header-bg {
  width: 100%;
  height: 180px;
  max-height: 180px;
  background-image: url('/assets/ui/header-mythic-village.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  border-bottom: 1px solid #bdc3c7; 
}
@media (max-width: 400px) {
  .header-bg { height: 80px; max-height: 80px; }
}

/* --- BARRA DE CONSTRUÇÃO (CLEAN) --- */
.barra-construcao-clean {
  background: #ffffff;
  color: #2c3e50;
  padding: 10px 15px;
  margin: 10px 10px 0 10px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  box-sizing: border-box;
  border: 1px solid #dfe6e9;
}

.info-construcao { 
    display: flex; 
    justify-content: space-between; 
    align-items: center;
    margin-bottom: 5px; 
}
.label-construcao { font-size: 0.9em; color: #7f8c8d; font-weight: bold; }
.label-construcao strong { color: #d35400; }
.tempo-construcao { font-weight: bold; color: #2c3e50; font-size: 0.85em; }

.progresso-fundo-clean { width: 100%; height: 6px; background: #ecf0f1; border-radius: 3px; overflow: hidden; }
.progresso-enchimento-clean { height: 100%; background: #27ae60; transition: width 1s linear; }


/* --- HUD DE RECURSOS (ESTILO CLEAN) --- */
.recursos-container-clean {
  background: #f8f9fa; /* Cinza muito claro */
  color: #2c3e50;      /* Texto Escuro */
  padding: 15px;
  margin: 10px;
  border-radius: 12px;
  border: 1px solid #dfe6e9;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.recursos-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 12px;
}

.res-item { 
    font-size: 1em; 
    font-weight: 700; 
    color: #576574;
    display: flex; align-items: center; 
}
.res-item.destaque-ouro { color: #f39c12; }

.icon-moeda-topo { width: 18px; height: 18px; object-fit: contain; margin-right: 5px; vertical-align: middle; }

/* Minérios Clean */
.recursos-minerais {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-bottom: 12px;
  padding: 5px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #ecf0f1;
}

.minerio-tag-clean {
  background: #f1f2f6; 
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.8em;
  font-weight: bold;
  color: #7f8c8d;
  display: flex; align-items: center; gap: 4px;
}
.icon-minerio { width: 16px; height: 16px; object-fit: contain; }

/* Info Extra Clean */
.info-extra-clean {
  font-size: 0.85em;
  color: #95a5a6;
  border-top: 1px solid #e0e0e0;
  padding-top: 10px;
  margin-bottom: 0;
  gap: 15px;
}
.info-item-alinhado { display: flex; align-items: center; gap: 5px; font-weight: 600; color: #000; }


/* --- NAV BAR (BOTÕES CLEAN) --- */
.nav-bar-clean {
  display: flex;
  gap: 12px;
  padding: 0 15px;
  margin-bottom: 25px;
  justify-content: center;
  position: relative;
  z-index: 100;
}

.nav-item { flex: 1; position: relative; }

.nav-btn-clean {
  width: 100%;
  padding: 12px 0;
  background: #ffffff; 
  color: #95a5a6;
  border: 1px solid #dfe6e9;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.2em;
  transition: all 0.2s;
  box-shadow: 0 4px 0 #bdc3c7;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
}

.nav-label { 
  font-size: 0.5em; 
  text-transform: uppercase; 
  font-weight: 800; 
  letter-spacing: 0.5px;
  color: #7f8c8d;
}

/* Hover */
.nav-btn-clean:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  color: #2c3e50;
}

/* Ativo */
.nav-btn-clean.ativo {
  background: #ffffff;
  color: #3498db;      
  border-color: #3498db;
  box-shadow: 0 4px 0 #2980b9;
  transform: translateY(-1px);
}
.nav-btn-clean.ativo .nav-label { color: #3498db; }

/* Menu Aberto */
.nav-btn-clean.menu-aberto {
    background: #f1f2f6;
    color: #3498db;
    border-color: #3498db;
}

.seta-menu { font-size: 0.5em; margin-top: -2px; opacity: 0.7; }

/* Dropdown (Branco) */
.dropdown-menu-clean {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  width: 150px;
  background: #ffffff;
  border: 1px solid #dfe6e9;
  border-radius: 8px;
  padding: 6px;
  display: flex; flex-direction: column; gap: 4px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  z-index: 200;
}
.dropdown-menu-clean::before {
    content: ''; position: absolute; top: -6px; left: 50%; margin-left: -6px;
    border-width: 6px; border-style: solid;
    border-color: transparent transparent #ffffff transparent;
}

.dropdown-menu-clean button {
  background: transparent;
  border: 1px solid transparent;
  color: #7f8c8d;
  padding: 10px;
  text-align: center;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em; font-weight: bold;
}
.dropdown-menu-clean button:hover { 
    background: #f1f2f6; 
    color: #2c3e50; 
}

/* --- CONTEÚDO --- */
.conteudo-aba {
  min-height: 400px; 
  padding: 0; 
}

/* --- RODAPÉ CLEAN --- */
.rodape-clean {
    margin-top: 40px;
    padding: 20px;
    background: #ffffff; 
    border-top: 1px solid #dfe6e9;
    border-radius: 12px 12px 0 0;
    margin-left: 10px; margin-right: 10px;
    
    display: flex;
    justify-content: space-between;
    align-items: center;
    opacity: 0.9;
}

.grupo-botoes-debug, .grupo-botoes-perigo { display: flex; gap: 8px; }

.btn-debug {
    background: #f1f2f6; border: 1px solid #bdc3c7; color: #7f8c8d;
    padding: 6px 12px; font-size: 0.75em; border-radius: 6px; cursor: pointer; font-weight: bold;
}
.btn-debug:hover { background: #dfe6e9; color: #2c3e50; }

.btn-reset-soft {
    background: #fff; border: 1px solid #e67e22; color: #e67e22;
    padding: 6px 12px; font-size: 0.75em; border-radius: 6px; cursor: pointer; font-weight: bold;
}
.btn-reset-hard {
    background: #fff; border: 1px solid #c0392b; color: #c0392b;
    padding: 6px 12px; font-size: 0.75em; border-radius: 6px; cursor: pointer; font-weight: bold;
}
.btn-reset-hard:hover { background: #c0392b; color: white; }

/* --- TRANSIÇÕES --- */
.animacao-entrada { animation: fadeIn 0.5s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-5px) translateX(-50%); }

</style>