<script setup>
defineProps({
  player: Object,
  resources: Object,
  village: Object
})
const formatNum = (n) => new Intl.NumberFormat('pt-BR').format(n)
</script>
<template>
  <header class="hud-tactical">    
    <div class="tac-identity">
      <div class="tac-avatar">
        <img :src="player.avatar" class="tac-img">
      </div>
      <div class="tac-txt">
        <div class="tac-name">Lord {{ player.name }}</div>
        <div class="tac-rank">NOME DA GUILD</div>
      </div>
    </div>
    <div class="game-logo-container">
      <h1 class="logo-text">
        MYTHIC <span class="highlight">VILLAGE</span>
      </h1>
      <div class="logo-deco">
        <div class="bar left"></div>
        <div class="dot"></div>
        <div class="bar right"></div>
      </div>
    </div>
    <div class="tac-telemetry">      
      <div class="t-group">
        <div class="t-data">
          <span class="t-label">MYTHIC</span>
          <span class="t-val purple">{{ formatNum(resources.mythicCoin) }}</span>
        </div>
        <div class="t-sep"></div>
        <div class="t-data">
          <span class="t-label">GOLD</span>
          <span class="t-val gold">{{ formatNum(resources.goldCoin) }}</span>
        </div>
      </div>
      <div class="t-sep double desktop-only"></div>
      <div class="t-group">
        <div class="t-data">
          <span class="t-label">POP</span>
          <span class="t-val blue">{{ village.populacao }}<span class="dim">/{{ village.maxPopulacao }}</span></span>
        </div>
        <div class="t-sep"></div>
        <div class="t-data">
          <span class="t-label">STO</span>
          <span class="t-val blue">{{ formatNum(village.maxArmazem) }}</span>
        </div>
      </div>
    </div>
  </header>
</template>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;700;800&display=swap');
.hud-tactical {
  background: #1e293b; /* Slate 800 */
  border-bottom: 2px solid #334155;
  height: 70px;
  display: flex;
  justify-content: space-between; /* Mantém os lados afastados */
  align-items: center;
  padding: 0 20px;
  font-family: 'Chakra Petch', sans-serif;
  color: #f8fafc;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  z-index: 50;
  position: relative; /* Importante para o logo absoluto */
}
/* === LOGO CENTRAL (NOVO) === */
.game-logo-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%); /* Centraliza perfeitamente */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.logo-text {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #e2e8f0;
  text-transform: uppercase;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  line-height: 1;
}
.logo-text .highlight {
  color: #38bdf8; /* Azul Tech */
  font-weight: 400; /* Levemente mais fino para contraste */
}
.logo-deco {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  opacity: 0.8;
}
.logo-deco .dot { width: 4px; height: 4px; background: #38bdf8; transform: rotate(45deg); box-shadow: 0 0 5px #38bdf8; }
.logo-deco .bar { width: 30px; height: 1px; background: linear-gradient(90deg, transparent, #64748b); }
.logo-deco .bar.right { background: linear-gradient(90deg, #64748b, transparent); }
/* === IDENTIDADE (ESQUERDA) === */
.tac-identity { display: flex; align-items: center; gap: 12px; }
.tac-avatar { 
  width: 44px; height: 44px; 
  background: #334155; 
  border: 1px solid #475569;
  transform: skewX(-10deg);
  overflow: hidden;
  display: flex; justify-content: center; align-items: center;
}
.tac-img { width: 100%; height: 100%; object-fit: cover; transform: skewX(10deg) scale(1.2); }
.tac-txt { display: flex; flex-direction: column; line-height: 1; }
.tac-name { font-weight: 700; font-size: 16px; letter-spacing: 0.5px; }
.tac-rank { font-size: 10px; color: #38bdf8; letter-spacing: 2px; font-weight: bold; margin-top: 2px; }
/* === TELEMETRIA (DIREITA) === */
.tac-telemetry { display: flex; align-items: center; gap: 15px; }
.t-group { display: flex; gap: 10px; align-items: center; }
.t-data { display: flex; flex-direction: column; align-items: flex-end; line-height: 1; }
.t-label { font-size: 9px; color: #64748b; font-weight: 700; letter-spacing: 1px; margin-bottom: 3px; }
.t-val { font-size: 16px; font-weight: 700; color: #fff; }
.dim { color: #475569; font-size: 12px; }
/* Cores */
.t-val.purple { color: #c084fc; text-shadow: 0 0 10px rgba(192, 132, 252, 0.3); }
.t-val.gold { color: #facc15; text-shadow: 0 0 10px rgba(250, 204, 21, 0.3); }
.t-val.blue { color: #38bdf8; text-shadow: 0 0 10px rgba(56, 189, 248, 0.3); }
/* Separadores */
.t-sep { width: 1px; height: 25px; background: #334155; transform: skewX(-10deg); }
.t-sep.double { width: 4px; border-left: 1px solid #334155; border-right: 1px solid #334155; background: transparent; margin: 0 5px; }
/* === MOBILE (RESPONSIVO) === */
@media (max-width: 900px) {
  /* No tablet/mobile, o logo central vai atrapalhar os dados */
  /* Vamos escondê-lo para priorizar o jogo, ou movê-lo */
  .game-logo-container { display: none; }
}
@media (max-width: 768px) {
  .hud-tactical { height: auto; padding: 10px 15px; flex-direction: column; gap: 10px; align-items: stretch; }
  .tac-identity { justify-content: flex-start; width: 100%; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 2px; }
  .tac-telemetry { justify-content: space-between; width: 100%; }
  .desktop-only { display: none; }
  .t-label { font-size: 8px; }
  .t-val { font-size: 14px; }
}
</style>