<script setup>
import { jogo, dadosItens } from '../jogo.js';

const getNomeItem = (id) => dadosItens.find(i => i.id === id)?.nome || id;
const getStatsItem = (id) => dadosItens.find(i => i.id === id)?.stats || null;

// --- NOVA FUNÇÃO: PEGAR IMAGEM DO ITEM ---
const getImagemItem = (id) => {
    const item = dadosItens.find(i => i.id === id);
    // Retorna a imagem definida no dados.js ou um fallback genérico
    return item && item.img ? item.img : '/assets/ui/icone_ataque.png';
};

// --- MAPA DE ÍCONES DE STATS ---
const getIconeStat = (stat) => {
    const mapa = {
        ataque: '/assets/ui/icone_ataque.png',
        ataquemagico: '/assets/ui/icone_danomagico.png',
        defesafisica: '/assets/ui/icone_defesafisica.png',
        defesamagica: '/assets/ui/icone_defesamagica.png',
        vida: '/assets/ui/icone_vida.png',
        precisao: '/assets/ui/icone_precisao.png',
        evasao: '/assets/ui/icone_evasao.png',
        danocritico: '/assets/ui/icone_danocritico.png',
        chancecritico: '/assets/ui/icone_chancecritico.png',
        penetracao: '/assets/ui/icone_penetracao.png',
        mana: '/assets/ui/icone_mana.png',
        dano: '/assets/ui/icone_ataque.png' // Fallback para flechas
    };
    return mapa[stat] || null;
};
</script>

<template>
  <div class="inventario-container">
    <div class="cabecalho-inv">
        <h3>🎒 Mochila do Jogador</h3>
        <p>Aqui ficam os equipamentos forjados e itens especiais.</p>
    </div>

    <div class="lista-itens">
        <div v-for="(qtd, id) in jogo.itens" :key="id" class="item-slot" v-show="qtd > 0">
            
            <div class="item-header">
                <div class="info-nome">
                    <div class="img-box">
                        <img :src="getImagemItem(id)" class="icon-item-real" :alt="id">
                    </div>
                    <span class="nome">{{ getNomeItem(id) }}</span>
                </div>
                <span class="qtd">x{{ qtd }}</span>
            </div>
            
            <div class="stats-mini" v-if="getStatsItem(id)">
                <span v-for="(val, key) in getStatsItem(id)" :key="key" 
                      class="stat-pill"
                      :class="val > 0 ? 'stat-bom' : 'stat-ruim'">
                    
                    <img v-if="getIconeStat(key)" :src="getIconeStat(key)" class="icon-stat-mini" :alt="key">
                    <span v-else>{{ key.charAt(0).toUpperCase() }}:</span>
                    
                    {{ val }}
                </span>
            </div>
        </div>

        <div v-if="Object.values(jogo.itens).every(q => q === 0)" class="vazio">
            <p>Sua mochila está vazia.</p>
            <small>Vá até a <strong>Ferraria</strong> na aba de Produção para criar itens.</small>
        </div>
    </div>
  </div>
</template>

<style scoped>
.inventario-container { padding: 10px; }
.cabecalho-inv { background: #2c3e50; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #f1c40f; }
.lista-itens { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }

.item-slot {
    background: white; border: 1px solid #ccc; border-radius: 8px; padding: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 10px;
}

/* Header do Item */
.item-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px; }

.info-nome { display: flex; align-items: center; gap: 10px; }

.img-box { 
    width: 40px; height: 40px; 
    background: #f4f4f4; border: 1px solid #ddd; 
    border-radius: 6px; display: flex; align-items: center; justify-content: center; 
}
.icon-item-real { width: 32px; height: 32px; object-fit: contain; }

.nome { font-weight: bold; color: #2c3e50; font-size: 1em; }

.qtd { background: #333; color: #f1c40f; padding: 2px 8px; border-radius: 12px; font-size: 0.85em; font-weight: bold; }

/* Stats */
.stats-mini { display: flex; flex-wrap: wrap; gap: 5px; font-size: 0.8em; }

.stat-pill { display: flex; align-items: center; gap: 4px; padding: 3px 6px; border-radius: 4px; border: 1px solid transparent; }
.stat-bom { color: #27ae60; background: #eafaf1; border-color: #abebc6; }
.stat-ruim { color: #c0392b; background: #fdedec; border-color: #fadbd8; }

.icon-stat-mini { width: 14px; height: 14px; object-fit: contain; }

.vazio { grid-column: 1 / -1; text-align: center; color: #777; margin-top: 20px; background: #eee; padding: 20px; border-radius: 10px; }
</style>