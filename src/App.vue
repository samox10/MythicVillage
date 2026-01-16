<style>
body {
  /* Substitua pelo caminho da sua imagem de fantasia/mapa */
  background-image: url('/assets/ui/fundo-mapa.png');
  
  /* Faz a imagem cobrir todo o espaço disponível */
  background-size: cover;
  
  /* Centraliza a imagem */
  background-position: center center;
  
  /* (Opcional) Deixa o fundo fixo quando você rola a página (efeito bonito) */
  background-attachment: fixed;
  
  /* Remove repetições */
  background-repeat: no-repeat;
  
  /* Cor de fundo caso a imagem demore a carregar (use um tom escuro) */
  background-color: #1a1a1a;
  
  /* Remove margens padrão do navegador */
  margin: 0;
}
</style>
<script setup>
  import { ref, onMounted } from 'vue';
  import { jogo, limites, populacaoTotal, acoes, iniciarLoop, iniciarSave, resetar, dadosMinerais } from './jogo.js';
  
  // Componentes
  import Cidade from './components/Cidade.vue';
  import Taverna from './components/Taverna.vue';
  import Laboratorio from './components/Laboratorio.vue';
  import Mina from './components/Mina.vue';
  import Ferraria from './components/Ferraria.vue';
  import Inventario from './components/Inventario.vue';
  import Modal from './components/Modal.vue';
  import Layout from './components/layout.vue';

  // --- ESTADO DA NAVEGAÇÃO ---
  const categoriaAtual = ref('cidade'); 
  const abaAtual = ref('visao_geral');
  
  // Novo estado para controlar qual menu "dropdown" está aberto
  const menuAberto = ref(null); 

  // 1. Função para botões SIMPLES (sem sub-menu, ex: Cidade)
  const navegarDireto = (cat, aba) => {
    categoriaAtual.value = cat;
    abaAtual.value = aba;
    menuAberto.value = null; // Fecha qualquer menu aberto
  };

  // 2. Função para botões COM MENU (ex: Produção)
  const alternarMenu = (cat) => {
    // Se já estiver aberto, fecha. Se não, abre este e fecha os outros.
    if (menuAberto.value === cat) {
      menuAberto.value = null;
    } else {
      menuAberto.value = cat;
    }
    // OBS: NÃO mudamos a 'categoriaAtual' aqui. A tela continua onde estava.
  };

  // 3. Função para clicar na SUB-OPÇÃO (ex: Mina)
  const selecionarOpcao = (cat, aba) => {
    categoriaAtual.value = cat;
    abaAtual.value = aba;
    menuAberto.value = null; // Fecha o menu após selecionar (opcional, fica mais limpo)
  };

  // --- FUNÇÕES VISUAIS (Mantive igual) ---
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

  const formatarNomeTooltip = (id) => {
    const item = dadosMinerais.find(m => m.id === id);
    return item ? item.nome : id.replace('_min', '').toUpperCase();
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
       <div v-if="jogo.construindo.tipo" class="barra-construcao-global">
          <div class="info-construcao">
            <span>🔨 Construindo: <strong>{{ jogo.construindo.tipo.toUpperCase() }}</strong></span>
            <small>{{ formatarTempo(jogo.construindo.tempoRestante) }} restante</small>
          </div>
          <div class="progresso-fundo-global">
            <div class="progresso-enchimento-global" 
                 :style="{ width: ((jogo.construindo.tempoTotal - jogo.construindo.tempoRestante) / jogo.construindo.tempoTotal * 100) + '%' }">
            </div>
          </div>
       </div>
    </div>

    <div class="recursos-container">
      <div class="recursos-row">
        <div class="res-item"><img src="/assets/ui/icone_couro.png" class="icon-moeda-topo" alt="Couro"> {{ Math.floor(jogo.couro) }}</div>
        <div class="res-item"><img src="/assets/ui/icone_madeira.png" class="icon-moeda-topo" alt="Madeira"> {{ Math.floor(jogo.madeira).toLocaleString('pt-BR') }}</div>
        <div class="res-item"><img src="/assets/ui/icone_comida.png" class="icon-moeda-topo" alt="Comida"> {{ Math.floor(jogo.comida).toLocaleString('pt-BR') }}</div>
        <div class="res-item"><img src="/assets/ui/icone_goldC.png" class="icon-moeda-topo" alt="Ouro"> {{ Math.floor(jogo.ouro).toLocaleString('pt-BR') }}</div>
      </div>
      <div class="recursos-minerais">
        <template v-for="(quantidade, nome) in jogo.minerios" :key="nome">
          <span v-if="quantidade > 0" class="minerio-tag">
            <img :src="getImagemMinerio(nome)" class="icon-minerio">
            &nbsp;{{ Math.floor(quantidade).toLocaleString('pt-BR') }}
          </span>
        </template>
      </div>
      <div class="recursos-row info-extra">
        <span class="info-item-alinhado">
          <img src="/assets/ui/icone_morador.png" class="icon-minerio">
          <strong>{{ populacaoTotal }} / {{ jogo.populacaoMax }}</strong>
        </span>
        <span class="info-item-alinhado">🏛️ {{ jogo.funcionarios.filter(f => f.isEspecial).length }} / {{ limites.vagasEspeciais }}</span>
        <span class="info-item-alinhado">📦 Cap: {{ limites.recursos.toLocaleString('pt-BR') }}</span>
      </div>
    </div>

    <div class="nav-bar">
      
      <div class="nav-item">
        <button 
          class="nav-btn" 
          :class="{ ativo: categoriaAtual === 'cidade' }" 
          @click="navegarDireto('cidade', 'visao_geral')"
          title="Cidade">
          🏛️
        </button>
      </div>

      <div class="nav-item">
        <button 
          class="nav-btn" 
          :class="{ 'menu-aberto': menuAberto === 'producao', ativo: categoriaAtual === 'producao' }" 
          @click="alternarMenu('producao')"
          title="Produção">
          ⚙️
          <span class="seta-menu">▼</span>
        </button>

        <Transition name="fade-slide">
          <div v-if="menuAberto === 'producao'" class="dropdown-menu">
            <button @click="selecionarOpcao('producao', 'mina')">⛏️ Mina</button>
            <button @click="selecionarOpcao('producao', 'ferraria')">⚔️ Ferraria</button>
            <button @click="selecionarOpcao('producao', 'laboratorio')">⚗️ Lab</button>
          </div>
        </Transition>
      </div>

      <div class="nav-item">
        <button 
          class="nav-btn" 
          :class="{ ativo: categoriaAtual === 'inventario' }" 
          @click="navegarDireto('inventario', 'itens')"
          title="Inventário">
          🌎
        </button>
      </div>

      <div class="nav-item">
        <button 
          class="nav-btn" 
          :class="{ ativo: categoriaAtual === 'taverna' }" 
          @click="navegarDireto('taverna', 'geral')"
          title="Sindicato">
          📜
        </button>
      </div>

      <div class="nav-item">
        <button 
          class="nav-btn" 
          :class="{ ativo: categoriaAtual === 'layout' }" 
          @click="navegarDireto('layout', 'inicio')"
          title="Layout">
          🧭
        </button>
      </div>

      <div class="nav-item">
        <button 
          class="nav-btn" 
          :class="{ ativo: categoriaAtual === 'teste3' }" 
          @click="navegarDireto('teste3', 'geral')"
          title="Sindicato">
          🗺️
        </button>
      </div>

    </div>

    <div class="conteudo-aba">
      <Cidade v-if="abaAtual === 'visao_geral' && categoriaAtual === 'cidade'" />
      
      <Mina v-if="abaAtual === 'mina' && categoriaAtual === 'producao'" />
      <Ferraria v-if="abaAtual === 'ferraria' && categoriaAtual === 'producao'" />
      <Laboratorio v-if="abaAtual === 'laboratorio' && categoriaAtual === 'producao'" />
      
      <Taverna v-if="abaAtual === 'geral' && categoriaAtual === 'taverna'" />
      <Inventario v-if="abaAtual === 'itens' && categoriaAtual === 'inventario'" />
      <Teste v-if="categoriaAtual === 'teste'" />
    </div>

    <Modal />

    <div class="rodape">
      <button class="btn-hack" @click="acoes.hack">🔧 HACK</button>
      <button class="btn-hack" @click="acoes.hackConstrucoes" style="background: #8e44ad;">🏗️ HACK PRÉDIOS</button>
      <button class="btn-aviso" @click="acoes.resetarRecursos">🗑️ Limpar Recursos</button>
      <button class="btn-perigo" @click="resetar">⚠️ Resetar Save</button>
    </div>

  </div>
</template>

<style scoped>
/* --- ESTILOS GERAIS DA PÁGINA --- */
.jogo {
  max-width: 800px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  text-align: center;
  padding-bottom: 50px;

  /* --- ADICIONE ISSO --- */
  /* Um fundo escuro levemente transparente para dar contraste */
  
  /* Uma sombra para o jogo "flutuar" sobre a imagem de fundo */
  box-shadow: 0 0 50px rgba(0,0,0,0.8);
  
  /* Garante que o container tenha altura mínima para preencher bem a tela */
  min-height: 100vh; 
}

h1 { margin: 8px 0; color: #2c3e50; }

/* --- HUD DE RECURSOS (O que estava faltando!) --- */
.recursos-container {
  background-color: #2c3e50; /* Azul escuro */
  color: #ecf0f1; /* Branco */
  padding: 10px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  margin-bottom: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.recursos-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 8px;
  font-weight: bold;
}

.res-item { font-size: 1.1em; }
.icon-moeda-topo {
  /* Usamos 'em' para que o tamanho seja relativo ao tamanho da fonte do texto ao lado (1.1em) */
  width: 1.1em;
  height: 1.1em;
  object-fit: contain;
  /* Alinha a base da imagem com a base do texto, similar a um emoji */
  vertical-align: text-bottom;
  /* Um pequeno espaçamento entre o ícone e o número */
  margin-right: 4px;
}

.recursos-minerais {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  background: rgba(0,0,0,0.2);
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.minerio-tag {
  background: rgba(255,255,255,0.1);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  display: flex;
  align-items: center;
}

.info-extra {
  font-size: 0.9em;
  color: #bdc3c7;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 5px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.info-item-alinhado {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-minerio {
  width: 15px;
  height: 15px;
  object-fit: contain;
}

/* --- BARRA DE CONSTRUÇÃO GLOBAL --- */
.barra-construcao-global {
  background: #34495e;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  margin: 10px auto;
  width: 95%;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  text-align: left;
}
.info-construcao { display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 4px; }
.progresso-fundo-global { width: 100%; height: 6px; background: #2c3e50; border-radius: 3px; overflow: hidden; }
.progresso-enchimento-global { height: 100%; background: #f1c40f; transition: width 1s linear; }

/* --- MENUS DE NAVEGAÇÃO --- */
.menu-categorias { 
  display: flex; 
  gap: 6px; 
  padding: 0 5px;
  margin-bottom: 0; /* Remove margem inferior para colar no submenu */
  position: relative;
  z-index: 10; /* Garante que fique acima do submenu se precisar */
}

.menu-categorias button { 
  flex: 1; 
  padding: 12px 0; /* Padding vertical maior, horizontal zero */
  background: #e0e0e0;
  color: #555; 
  border: 1px solid #bdc3c7; 
  border-bottom: none; /* Remove borda de baixo para integrar visualmente */
  cursor: pointer; 
  font-size: 1.4em; /* Ícones maiores */
  border-radius: 8px 8px 0 0; /* Arredonda só em cima */
  transition: all 0.2s;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.05);
}

.menu-categorias button:hover { 
  background: #d5d5d5; 
  transform: translateY(-2px);
}

.menu-categorias button.ativo { 
  background: #2c3e50; 
  color: white; 
  border-color: #2c3e50;
  z-index: 12;
  /* Cria o efeito de "aba selecionada" conectada ao submenu */
  box-shadow: 0 -3px 5px rgba(0,0,0,0.2); 
}
.submenu-container {
  background: #2c3e50; /* Mesma cor do botão ativo */
  padding: 10px;
  border-radius: 0 0 10px 10px; /* Arredonda só embaixo */
  margin: 0 5px 15px 5px; /* Margem lateral alinhada e margem inferior para o conteúdo */
  display: flex;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  overflow: hidden; /* Importante para animação */
  flex-wrap: wrap;
}

.submenu-container button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #bdc3c7;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9em;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.submenu-container button:hover {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  transform: scale(1.05);
}

.submenu-container button.ativo {
  background: #f1c40f; /* Amarelo destaque */
  color: #2c3e50; 
  border-color: #f1c40f;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

/* --- ANIMAÇÃO DE SLIDE (Vue Transition) --- */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease-out;
  max-height: 100px; /* Altura máxima aproximada do submenu */
  opacity: 1;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 0;
}
.painel-producao {
  background: #2c3e50; /* O mesmo fundo do header da mina */
  color: white;
  padding: 10px;
  border-radius: 10px; /* Bordas arredondadas */
  margin: 0 auto 4px auto; /* Centralizado e com margem embaixo */
  display: flex; /* Ocupa apenas o espaço necessário, não a tela toda */
  gap: 14px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  border: 2px solid #34495e;
  width: 93%;
  justify-content: center;

}

.painel-producao button {
  background: rgba(255, 255, 255, 0.1); /* Fundo sutil */
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #f2f2f2;
  padding: 6px 14px;
  border-radius: 15px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9em;
  transition: all 0.5s;
}

.painel-producao button:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.painel-producao button.ativo {
  background: #f1c40f; /* Amarelo destaque (igual badges de nível) */
  color: #2c3e50; /* Texto escuro para contraste */
  border-color: #f1c40f;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Responsividade para o painel não quebrar em telas muito pequenas */
@media (max-width: 400px) {
  .painel-producao {
    display: flex;
    width: 92%;
    justify-content: center;
  }
}
/* */

.menu-subabas { 
  display: flex; 
  gap: 8px; 
  margin-bottom: 15px; 
  background: #34495e; 
  padding: 10px; 
  border-radius: 0 0 8px 8px; 
  justify-content: center;
}
.menu-subabas button { 
  padding: 6px 15px; 
  background: rgba(255,255,255,0.1); 
  border: 1px solid rgba(255,255,255,0.2); 
  color: #bdc3c7;
  cursor: pointer; 
  border-radius: 20px; 
  font-size: 0.9em;
  transition: all 0.2s;
}
.menu-subabas button:hover { background: rgba(255,255,255,0.2); color: white; }
.menu-subabas button.ativo { 
  background: #f1c40f; 
  color: #2c3e50; 
  border-color: #f1c40f; 
  font-weight: bold;
}

/* --- RODAPÉ --- */
.rodape { margin-top: 30px; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
.rodape button { padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; color: white; font-weight: bold; }
.btn-hack { background: #9b59b6; }
.btn-aviso { background: #e67e22; }
.btn-perigo { background: #c0392b; }


.nav-bar {
  display: flex;
  gap: 12px; /* Aumentei de 8px para 12px */
  padding: 0 10px; /* Um pouco mais de margem lateral */
  margin-bottom: 20px;
  justify-content: center; /* Centraliza se sobrar espaço */
  position: relative;
  z-index: 100;
}

/* Container de cada botão (para alinhar o menu relativo a ele) */
.nav-item {
  position: relative; 
  flex: 1;
}

/* O Botão Principal */
/* --- Estilo Neon Mágico (Azul Cristal) --- */

.nav-btn {
  width: 100%;
  padding: 12px 0;
  background: #1a252f; 
  /* Cor do ícone inativo (cinza mais escuro para não brigar) */
  color: #7f8c8d; 
  border: 1px solid #34495e;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.4em;
  transition: all 0.3s ease-in-out;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
}

/* Hover: Fica levemente mais claro, cor de céu */
.nav-btn:hover {
  color: #85c1e9; /* Azul bem clarinho */
  border-color: #5dade2;
  box-shadow: 0 0 10px rgba(93, 173, 226, 0.3);
}

/* Estado ATIVO */
.nav-btn.ativo {
  background: #1a252f;
  
  /* NOVA COR: Azul Cristal (#3498db) */
  color: #3498db; 
  border: 1px solid #3498db;
  
  /* GLOW ajustado para o novo azul (menos intenso que o anterior) */
  box-shadow: 
    0 0 15px rgba(52, 152, 219, 0.4), /* Brilho externo mais suave */
    inset 0 0 10px rgba(52, 152, 219, 0.2); /* Brilho interno */
    transform: translateY(-1px);
}

/* Barrinha de luz inferior */
.nav-btn.ativo::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  width: 60%;
  height: 3px;
  
  /* Cor da barra combinando */
  background: #3498db; 
  box-shadow: 0 0 12px #3498db, 0 0 4px #85c1e9;
  
  border-radius: 2px 2px 0 0;
  animation: pulsarLuz 2s infinite alternate;
}

/* Ajuste do menu dropdown */
.nav-btn.menu-aberto {
  border-bottom-color: transparent;
  box-shadow: none;
  background: #34495e;
  color: #3498db; /* Mantém o texto azul */
}

/* Setinha indicadora */
.seta-menu {
  font-size: 0.4em;
  position: absolute;
  bottom: 2px;
  right: 4px;
  opacity: 0.7;
}

/* --- MENU DROPDOWN (FLUTUANTE) --- */
.dropdown-menu {
  position: absolute;
  top: 100%; /* Exatamente abaixo do botão */
  left: 0;
  width: 180px; /* Largura fixa ou min-width: 100% */
  background: #34495e;
  border-radius: 0 8px 8px 8px; /* Canto reto na esquerda superior para colar no botão */
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  z-index: 200;
}

/* Se o botão for o último da direita, alinha o menu para a esquerda para não sair da tela */
.nav-item:last-child .dropdown-menu {
  left: auto;
  right: 0;
  border-radius: 8px 0 8px 8px;
}

.dropdown-menu button {
  background: rgba(255,255,255,0.1);
  border: none;
  color: #ecf0f1;
  padding: 10px;
  text-align: left;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9em;
  transition: background 0.2s;
}

.dropdown-menu button:hover {
  background: rgba(255,255,255,0.2);
  padding-left: 15px; /* Efeito de movimento */
}

/* --- ANIMAÇÃO SUAVE --- */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Conteúdo */
.conteudo-aba {
  min-height: 400px; /* Altura mínima para evitar pulos */
}
.header-bg {
  width: 100%;
  height: 210px;              /* altura máxima */
  max-height: 210px;

  background-image: url('/assets/ui/header-mythic-village.png');
  background-repeat: no-repeat;
  background-size: cover;    /* cobre toda a largura */
  background-position: center;
}
@media (max-width: 400px) {
  .header-bg {
  height: 80px;              /* altura máxima */
  max-height: 80px;
}
}
</style>
