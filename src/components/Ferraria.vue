<script setup>
import { ref, computed, reactive } from 'vue';
import { jogo, acoes, dadosItens, obterBuffRaca } from '../jogo.js';

// --- ESTADO LOCAL ---
const filtroTipo = ref('todos');
const filtroStat = ref('todos');
const filtroNivel = ref('todos'); // Apenas visual por enquanto
// --- Adicione isso logo abaixo das outras variáveis 'ref' ou 'const' ---
const itemSelecionado = ref(null); // Guarda qual item estamos vendo no modal
const formatarNumero = (n) => n ? Number(n).toLocaleString('pt-BR') : '0';
const qtdModal = ref(1); // Variável simples para controlar o input

const abrirForja = (item) => {
    itemSelecionado.value = item;
    qtdModal.value = 1; // Sempre reseta para 1 ao abrir
};

const fecharForja = () => {
    itemSelecionado.value = null; // Fecha o modal
};
// Mapeia a chave do 'dados.js' para o arquivo de imagem e o nome legível
const mapaAtributos = {
    ataque: { nome: "Ataque", img: "icone_ataque.png" },
    defesa: { nome: "Defesa", img: "icone_defesafisica.png" },
    vida: { nome: "Vida", img: "icone_vida.png" },
    precisao: { nome: "Precisão", img: "icone_precisao.png" },
    evasao: { nome: "Evasão", img: "icone_evasao.png" },
    critico: { nome: "Chance Crítica", img: "icone_chancecritico.png" },
    danoCritico: { nome: "Danos Crít.", img: "icone_danocritico.png" },
    magia: { nome: "Magia", img: "icone_danomagico.png" },
    defesaMagica: { nome: "Def. Mágica", img: "icone_defesamagica.png" },
    penetracao: { nome: "Penetração", img: "icone_penetracao.png" }
};
// --- CONTROLE DO TOOLTIP ---
const tooltipData = reactive({
    visivel: false,
    texto: '',
    x: 0,
    y: 0
});

// Função chamada ao clicar no ícone
const abrirTooltip = (event, nomeAtributo) => {
    // Se clicar no mesmo que já está aberto, fecha
    if (tooltipData.visivel && tooltipData.texto === nomeAtributo) {
        fecharTooltip();
        return;
    }
    
    tooltipData.texto = nomeAtributo;
    tooltipData.visivel = true;

    // Calcula posição baseada onde o mouse clicou
    // Adiciona um pequeno offset (10px) para não ficar embaixo do mouse
    tooltipData.x = event.clientX + 10;
    tooltipData.y = event.clientY + 10;

    // Adiciona um ouvinte global para fechar se clicar fora
    setTimeout(() => { // Timeout pequeno para não detectar o próprio clique atual
        window.addEventListener('click', fecharTooltipFora);
    }, 50);
};

const fecharTooltip = () => {
    tooltipData.visivel = false;
    window.removeEventListener('click', fecharTooltipFora);
};

// Fecha se clicar em qualquer lugar que não seja o tooltip
const fecharTooltipFora = (e) => {
    const tooltipEl = document.getElementById('tooltip-flutuante');
    if (tooltipEl && !tooltipEl.contains(e.target)) {
        fecharTooltip();
    }
};
// --- LÓGICA DE FILTRO E ORDENAÇÃO ---
const itensFiltrados = computed(() => {
    // 1. Primeiro filtramos (mantém a lógica original)
    const listaFiltrada = dadosItens.filter(item => {
        // Filtro de Tipo
        if (filtroTipo.value !== 'todos' && item.tipo !== filtroTipo.value) return false;
        
        // Filtro de Atributo (Stat)
        if (filtroStat.value !== 'todos') {
            if (!item.stats || !item.stats[filtroStat.value]) return false;
        }
        return true;
    });

    // 2. Agora ordenamos: Nível maior fica em cima (decrescente)
    return listaFiltrada.sort((a, b) => {
        // Mudamos de 'reqNivel' para 'nivelItem'
        const nivelA = a.nivelItem || 0; 
        const nivelB = b.nivelItem || 0;
        
        // Ordenação decrescente (Maior -> Menor)
        return nivelB - nivelA;
    });
});

// --- COMPUTEDS DE FERREIRO E BUFFS ---
const ferreiroAtivo = computed(() => {
    return jogo.funcionarios.find(f => f.profissao === 'ferreiro' && f.diasEmGreve === 0);
});

// Calcula os buffs visuais baseado no ferreiro atual
const statsFerreiro = computed(() => {
    if (!ferreiroAtivo.value) return { tempo: 0, falha: 0, poderReal: 0 };

    const base = ferreiroAtivo.value.poderEspecial || 0;
    const buffRaca = obterBuffRaca(ferreiroAtivo.value); // % extra vinda do Lorde
    const poderReal = base * (1 + (buffRaca / 100));

    return {
        poderReal: Math.floor(poderReal), 
        tempo: Math.min(90, Math.floor(poderReal)), // % Redução Tempo (Max 90%)
        falha: Math.min(100, Math.floor(poderReal)) // % Redução Falha
    };
});

// --- LÓGICA DE CRAFT ---

// Calcula o máximo que dá pra fazer com os recursos atuais
const getMaxCraft = (item) => {
    let max = 9999;
    for (const [recurso, qtd] of Object.entries(item.custo)) {
        const estoque = jogo.minerios[recurso] !== undefined ? jogo.minerios[recurso] : (jogo[recurso] || 0);
        const possivel = Math.floor(estoque / qtd);
        if (possivel < max) max = possivel;
    }
    return max;
};

// Função inteligente que valida o que você digita
const validarInputModal = (event, item) => {
    let valor = parseInt(event.target.value);
    const maximo = getMaxCraft(item);

    // Validações básicas
    if (isNaN(valor) || valor < 1) valor = 1;
    // Se quiser limitar ao máximo de recursos, descomente a linha abaixo:
    // if (maximo > 0 && valor > maximo) valor = maximo;

    // ATUALIZA A VARIÁVEL REATIVA (Isso faz o custo mudar na tela)
    qtdModal.value = valor;

    // Força o input a mostrar o número corrigido se necessário
    if (event.target.value != valor) {
        event.target.value = valor;
    }
};

const fabricarItemDaLista = (item) => {
    // Usa a variável qtdModal para saber quantos fazer
    const quantidade = qtdModal.value;
    
    if (quantidade > 0) {
        if (typeof acoes !== 'undefined' && acoes.fabricarItem) {
            acoes.fabricarItem(item, quantidade);
        }
    }
};

// --- FORMATAÇÃO VISUAL ---

// Tempo formatado com redução aplicada
const getTempoCraft = (item, qtd) => {
    const tempoBase = item.tempo * qtd;
    const redutor = statsFerreiro.value ? (statsFerreiro.value.tempo / 100) : 0;
    const final = Math.ceil(tempoBase * (1 - redutor));
    
    // Se for menos de 1 minuto, mostra segundos (ex: 45s)
    if (final < 60) return `${final}s`;

    // Se for menos de 1 hora, mostra minutos e segundos (ex: 59m 30s)
    if (final < 3600) return `${Math.floor(final/60)}m ${final%60}s`;

    // Se for 1 hora ou mais, mostra horas e minutos (ex: 1h03min)
    const h = Math.floor(final / 3600);
    const m = Math.floor((final % 3600) / 60);
    // O 'padStart' garante que o 3 vire '03' para ficar bonito
    return `${h}h${String(m).padStart(2, '0')}min`;
};

// Chance de sucesso (para exibir na lista)
const getChanceSucesso = () => {
    const baseFalha = 15; // 15% Base fixa do jogo
    const redutor = statsFerreiro.value ? statsFerreiro.value.falha : 0;
    const falhaFinal = baseFalha * (1 - (redutor / 100));
    return (100 - falhaFinal).toFixed(1);
};

// Formatação mm:ss (e agora hh:mm) para a fila
const formatarTempoFila = (s) => {
    // Arredonda para cima para não mostrar "0s" quando ainda falta 0.5s
    const final = Math.ceil(s);

    if (final < 60) return `${final}s`;
    
    // Se for menos de 1 hora
    if (final < 3600) {
        const m = Math.floor(final / 60);
        const rest = final % 60;
        return `${m}m ${rest}s`;
    }

    // Se for 1 hora ou mais
    const h = Math.floor(final / 3600);
    const m = Math.floor((final % 3600) / 60);
    return `${h}h${String(m).padStart(2, '0')}min`;
};

// Cores de Tier (mesma da Taverna)
const corTier = (t) => ({'F':'#8A8A8A','E':'#659665','D':'#71c404','C':'#475fad','B':'#0233d1','A':'#8e44ad','S':'#f1c40f','SS':'#0fbdd1'}[t] || '#000');
</script>

<template>
  <div class="ferraria-container">
    
    <div class="header-taverna">
        <div class="titulo-nivel">
            <h2>⚒️ Ferraria</h2>
        </div>
        <div class="info-nivel">
            <span class="badge-nivel">Nível {{ jogo.ferraria }}</span>
        </div>
    </div>

    <div class="painel-controle-ferraria">
        
        <div v-if="ferreiroAtivo" class="card-funcionario ferreiro-ativo" :style="{ borderColor: corTier(ferreiroAtivo.tier) }">
                
                <div class="card-topo" :style="{ backgroundColor: corTier(ferreiroAtivo.tier) }">
                    <div class="topo-esquerda">
                        <span class="tier-badge">{{ ferreiroAtivo.tier }}</span>
                        <span class="card-nome">{{ ferreiroAtivo.nome }}</span>
                    </div>
                    
                    <div class="molde-icone-prof">
                        <img src="/assets/ui/i_ferreiro.png" class="img-prof-inner" title="Ferreiro">
                    </div>
                </div>

                <div class="card-mid">
                    <div class="avatar-box">
                         <img :src="`/assets/faces/${ferreiroAtivo.raca}/${ferreiroAtivo.imagem}.png`" class="avatar-func">
                    </div>

                    <div class="tabela-dados-func">
                        <div class="linha-dado">
                            <span class="dado-label">Profissão:</span>
                            <span class="dado-valor">Ferreiro</span>
                        </div>
                        <div class="linha-dado">
                            <span class="dado-label">Raça:</span>
                            <span class="dado-valor capitalize">{{ ferreiroAtivo.raca }}</span>
                        </div>
                        <div class="linha-dado">
                            <span class="dado-label">Sexo:</span>
                            <span class="dado-valor">{{ ferreiroAtivo.sexo === 'masculino' ? 'Masculino' : 'Feminino' }}</span>
</div>
                        <div class="linha-dado">
                            <span class="dado-label">Salário:</span>
                            <span class="dado-valor">
                                {{ formatarNumero(ferreiroAtivo.salario) }} 
                                <img src="/assets/ui/icone_goldC.png" class="tiny-coin">
                            </span>
                        </div>
                    </div>
                </div>

                <div class="rodape-card">
                    <div class="info-produtividade">
                        Aumento de produtividade em <span class="verde">{{ statsFerreiro.tempo }}%</span>
                    </div>
                    <div class="frase-efeito">
                        "{{ ferreiroAtivo.frase || 'Pronto para forjar!' }}"
                    </div>
                </div>
            </div>
            <div v-else class="card-funcionario vazio-ferreiro-card">
                
                <div class="card-topo vazio-topo">
                    <div class="topo-esquerda">
                        <span class="tier-badge vazio-badge">-</span>
                        <span class="card-nome">Vaga Aberta</span>
                    </div>
                    <img src="/assets/ui/i_ferreiro.png" class="icon-prof-topo grayscale" title="Necessário Ferreiro">
                </div>

                <div class="card-mid">
                    <div class="avatar-box vazio-avatar-box">
                         <img src="/assets/ui/icone_morador.png" class="avatar-vazio">
                    </div>

                    <div class="tabela-dados-func vazio-dados">
                        <div class="texto-central-vazio">
                            <span class="titulo-vazio">Sem Ferreiro</span>
                            <span class="subtitulo-vazio">ESTAMOS CONTRATANDO</span>
                        </div>
                    </div>
                </div>

                <div class="rodape-card vazio-rodape">
                    <div class="frase-efeito">
                        "A forja está fria..."
                    </div>
                </div>
            </div>
            

        <div class="linha-divisoria"></div>

        <div class="lado-direito-filtros">
            <h4 class="titulo-filtros">🔍 Filtros de Produção</h4>
            
            <fieldset class="input-rpg">
                <legend>Tipo de Item</legend>
                <select v-model="filtroTipo">
                    <option value="todos">Todos</option>
                    <option value="arma">⚔️ Armas</option>
                    <option value="armadura">🛡️ Armaduras</option>
                    <option value="municao">🏹 Munição</option>
                </select>
            </fieldset>

            <fieldset class="input-rpg">
                <legend>Atributo Principal</legend>
                <select v-model="filtroStat">
                    <option value="todos">Qualquer</option>
                    <option value="ataque">Ataque</option>
                    <option value="defesa">Defesa</option>
                    <option value="agilidade">Agilidade</option>
                    <option value="precisao">Precisão</option>
                </select>
            </fieldset>

            <fieldset class="input-rpg">
                <legend>Nível do Item</legend>
                <select v-model="filtroNivel">
                    <option value="todos">Todos</option>
                    <option value="5">Nível 5+</option>
                    <option value="10">Nível 10+</option>
                    <option value="15">Nível 15+</option>
                    <option value="20">Nível 20+</option>
                </select>
            </fieldset>
        </div>
    </div>
    <div v-if="jogo.craftando.item" class="fila-producao-compacta">
        
        <div class="lado-info">
            <span class="icone-fogo">🔥</span>
            <div class="texto-info">
                <span class="titulo-fila">Forjando <strong>{{ jogo.craftando.qtdLote }}x</strong> itens</span>
                <span class="tempo-fila">{{ formatarTempoFila(jogo.craftando.tempoRestante) }} restantes</span>
            </div>
        </div>

        <div class="lado-barra">
            <div class="barra-fundo-compacta">
                <div class="barra-fill-compacta" 
                    :style="{ width: (100 - (jogo.craftando.tempoRestante / jogo.craftando.tempoTotal * 100)) + '%' }">
                </div>
            </div>
        </div>
        
        <div class="lado-botoes">
            <button class="btn-mini-acao cancelar" @click="acoes.cancelarCraft" title="Cancelar (Perde 10% dos recursos)">✖</button>
            <button class="btn-mini-acao acelerar" @click="acoes.acelerarCraft" title="Acelerar com Ouro">⚡</button>
        </div>

    </div>
    <div class="lista-receitas-container">
        
        <div class="header-lista"></div>

        <div class="lista-receitas-scroll">
            
            <div v-for="item in itensFiltrados" :key="item.id" class="card-capa-simples">
                
                <div class="capa-header">
                    <h4>{{ item.nome }}</h4>
                    <span class="badge-nivel-lista">{{ item.nivelItem || 1 }}</span>
                    </div>

                <div class="capa-corpo">
                    <div class="capa-img-box">
                        <img :src="item.img" class="capa-icon">
                        
                        <div v-if="jogo.itens[item.id] > 0" class="qtd-overlay">
                            {{ jogo.itens[item.id] }}
                        </div>
                    </div>
                    
                    <div class="capa-stats">
                        <template v-if="item.stats">
                            <template v-for="(valor, nomeStat) in item.stats" :key="nomeStat">
                                <div class="mini-stat-row" v-if="mapaAtributos[nomeStat]">
                                    <img :src="`/assets/ui/${mapaAtributos[nomeStat].img}`">
                                    <span class="nome-stat-lista">{{ mapaAtributos[nomeStat].nome }}:</span>
                                    <span class="valor-stat-lista">{{ valor }}</span>
                                </div>
                            </template>
                        </template>
                        <div v-else class="desc-simples">{{ item.desc }}</div>
                    </div>
                </div>

                <button class="btn-abrir-modal" @click="abrirForja(item)">
                    EXAMINAR & FORJAR
                </button>
            </div>

        </div> 

        <div v-if="itemSelecionado" class="modal-overlay" @click.self="fecharForja">
            <div class="modal-content-forja">
                
                <button class="btn-fechar-modal" @click="fecharForja">✖</button>

                <h3 class="modal-titulo">{{ itemSelecionado.nome }}</h3>

                <div class="modal-img-area">
                    <img :src="itemSelecionado.img" class="modal-icon-big">
                    <span class="modal-badge-tipo">{{ itemSelecionado.tipo || 'Item' }}</span>
                </div>

                <div class="modal-stats-area">
                    <template v-if="itemSelecionado.stats">
                        <template v-for="(valor, nomeStat) in itemSelecionado.stats" :key="nomeStat">
                            <div class="modal-stat-row" v-if="mapaAtributos[nomeStat]">
                                <div class="stat-left">
                                    <img :src="`/assets/ui/${mapaAtributos[nomeStat].img}`">
                                    <span>{{ mapaAtributos[nomeStat].nome }}</span>
                                </div>
                                <span class="stat-right">{{ valor }}</span>
                            </div>
                        </template>
                    </template>
                    <div v-else class="modal-desc-text">
                        {{ itemSelecionado.desc }}
                    </div>
                </div>

                <div class="modal-recursos-box">
                    <div class="label-section">RECURSOS NECESSÁRIOS:</div>
                    <div class="modal-lista-custos">
                        <div v-for="(custoBase, recurso) in itemSelecionado.custo" :key="recurso" 
                            class="modal-pill-custo"
                            :class="{ 'falta': (jogo.minerios[recurso]||jogo[recurso]||0) < (custoBase * qtdModal) }">
                            
                            <img :src="`/assets/recursos/min_${recurso}.png`" 
                                @error="$event.target.src = '/assets/recursos/res_' + recurso + '.png'"
                                class="icon-custo-modal">
                            
                            <div class="custo-texto">
                                <span class="custo-nome">{{ recurso }}</span>
                                <span class="custo-val">
                                    {{ (custoBase * qtdModal).toLocaleString('pt-BR') }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-controles-box">
                    <div class="modal-timer">
                        ⏳ {{ getTempoCraft(itemSelecionado, qtdModal) }}
                    </div>

                    <div class="modal-input-group">
                        <button @click="qtdModal > 1 ? qtdModal-- : null">-</button>
                        
                        <input 
                            type="number" 
                            :value="qtdModal" 
                            @input="(e) => validarInputModal(e, itemSelecionado)"
                            @focus="$event.target.select()" 
                            min="1"
                        >
                        
                        <button @click="qtdModal < getMaxCraft(itemSelecionado) ? qtdModal++ : null">+</button>
                    </div>
                </div>

                <button class="btn-forjar-final"
                        :disabled="!!jogo.craftando.item || qtdModal < 1 || qtdModal > getMaxCraft(itemSelecionado)"
                        @click="fabricarItemDaLista(itemSelecionado); fecharForja()">
                    🔨 FORJAR AGORA
                </button>

            </div>
        </div>
    </div>
    <!-- Tooltip -->
    <div v-if="tooltipData.visivel" 
          id="tooltip-flutuante"
          class="tooltip-custom"
          :style="{ top: tooltipData.y + 'px', left: tooltipData.x + 'px' }">
        {{ tooltipData.texto }}
    </div>

</div> 
</template>

<style scoped>
@import '../css/taverna.css';

/* Container Geral */
.ferraria-container {
    padding: 10px; color: #2c3e50; max-width: 1000px; margin: 0 auto;
}

/* --- PAINEL DE CONTROLE (Topo) --- */
.painel-controle-ferraria {
    display: flex; align-items: center; justify-content: space-between;
    background: #ecf0f1; border: 1px solid #bdc3c7; border-radius: 8px;
    margin: 15px 0; padding: 10px; gap: 15px; height: 180px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.lado-esquerdo-ferreiro { flex: 1; display: flex; justify-content: center; height: 100%; }
.ferreiro-ativo .card-mid { flex: 1; display: flex; align-items: center; padding: 5px 5px 5px 15px; background: #fff; }
.vazio-ferreiro-mini { border: 2px dashed #999; width: 100%; display: flex; align-items: center; justify-content: center; color: #777; font-weight: bold; }
.linha-divisoria { width: 2px; height: 70%; background: #bdc3c7; opacity: 0.6; }
.grupo-select {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    
    height: 30px;
    padding: 0 5px;
    
    /* AQUI: Define o tamanho da caixa branca */
    width: 280px; /* <--- Tamanho fixo (recomendado para ficar igual a imagem) */
    /* ou use width: 85%; se quiser responsivo */
}

/* O PRÓPRIO SELETOR (Dropdown) */
.grupo-select select {
    border:#2f3542;      /* Remove a borda padrão feia */
    border-width: 1px;
    background: transparent; /* Fundo transparente para usar o da caixa */
    text-align: right;
    padding-right: 8px;
    height: 100%;      /* Ocupa toda a altura da caixa pai */
    outline: none;     /* Remove a linha azul ao clicar */
    font-size: 0.9em;  /* Tamanho da letra */
    cursor: pointer;
}

/* Lista Container */
.lista-receitas-container {
    background: #ecf0f1; border: 1px solid #bdc3c7; border-radius: 8px;
    display: flex; flex-direction: column; height: 80%;
}
.header-lista { display: none; }
.lista-receitas-scroll { 
    overflow-y: auto; 
    flex: 1; 
    padding: 10px; 
    background: #e3e6ea;
    
    /* --- MÁGICA DAS 2 COLUNAS --- */
    display: grid;
    grid-template-columns: 1fr 1fr; /* Cria 2 colunas de tamanho igual */
    gap: 15px; /* Espaço entre os itens (lado e baixo) */
    align-content: start; /* Garante que os itens fiquem no topo */
}


/* ==================================================
   1. ESTILO DO CARD SIMPLIFICADO (Na Lista)
   ================================================== */
.card-capa-simples {
    background: #fff;
    border: 1px solid #bdc3c7; 
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    display: flex; 
    flex-direction: column; 
    gap: 10px;
    /* margin-bottom: 15px;  <-- REMOVIDO para não duplicar espaço */
    height: fit-content; /* Garante que o card tenha o tamanho do conteúdo */
}

.capa-header {
    display: flex; 
    justify-content: space-between; /* Empurra um p/ cada ponta */
    align-items: center;
    border-bottom: 1px solid #ecf0f1; 
    padding-bottom: 5px;
    gap: 10px; /* Cria um espaço mínimo de respiro entre o nome e o nível */
}
.capa-header h4 { 
    margin: 0; 
    color: #2c3e50; 
    text-transform: uppercase; 
    font-weight: 800;
    
    /* --- NOVAS LINHAS --- */
    text-align: left; /* Garante que o texto comece na esquerda */
    flex: 1;          /* Ocupa TODO o espaço livre no meio */
    white-space: nowrap; /* (Opcional) Impede que o nome quebre em duas linhas */
    overflow: hidden;    /* (Opcional) Se o nome for gigante, corta o final */
    text-overflow: ellipsis; /* (Opcional) Põe "..." se cortar o nome */
}

.capa-corpo {
    display: flex; align-items: center; gap: 15px;
}
.capa-img-box {
    width: 80px; 
    height: 80px; 
    background: #f8f9fa; 
    border: 1px solid #dee2e6;
    border-radius: 8px; 
    padding: 0; /* REMOVIDO padding para a imagem encostar nas bordas se quiser, ou mantenha se preferir */
    flex-shrink: 0;
    
    /* IMPORTANTE: Necessário para a faixinha ficar presa aqui dentro */
    position: relative; 
    overflow: hidden; /* Garante que a faixa não saia pelas bordas arredondadas */
    
    /* Centraliza a imagem caso tenha removido o padding */
    display: flex;
    align-items: center;
    justify-content: center;
}
.capa-icon { 
    width: 80%; /* Um pouco menor para não colar nas bordas, já que tiramos o padding do pai */
    height: 80%; 
    object-fit: contain; 
}
.qtd-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    
    background: rgba(0, 0, 0, 0.6); /* Fundo preto transparente */
    color: #fff;
    font-size: 0.7em;
    font-weight: bold;
    text-align: center;
    padding: 2px 0;
    line-height: 1;
    z-index: 2;
    backdrop-filter: blur(2px); /* Efeito de vidro opcional */
}

/* AJUSTE AQUI: Mudado para 2 colunas para caber o nome do status */
.capa-stats {
    flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px;
}
.mini-stat-row {
    display: flex; align-items: center; gap: 4px; background: #fdfdfd;
    border: 1px solid #ecf0f1; padding: 3px 6px; border-radius: 6px;
    font-size: 0.80em; color: #555;
    white-space: nowrap; /* Não quebrar linha */
}
.mini-stat-row img { width: 14px; height: 14px; opacity: 0.8; }
.nome-stat-lista { color: #7f8c8d; font-weight: 600; font-size: 0.9em; margin-right: 2px; }
.valor-stat-lista { color: #2c3e50; font-weight: 700; }

.desc-simples { font-size: 0.8em; color: #7f8c8d; font-style: italic; }

.btn-abrir-modal {
    width: 100%; padding: 10px;
    background: #3498db; color: white; border: none; border-radius: 6px;
    font-weight: bold; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;
    transition: background 0.2s;
}
.btn-abrir-modal:hover { background: #2980b9; }


/* ==================================================
   2. ESTILO DO MODAL (Janela Flutuante)
   ================================================== */
.modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 9999;
    display: flex; justify-content: center; align-items: center;
    padding: 20px;
}

.modal-content-forja {
    background: #fff;
    /* Mude width para 95% para deixar uma margem de segurança nas laterais */
    width: 95%; 
    max-width: 400px;
    border-radius: 12px;
    padding: 20px;
    position: relative;
    display: flex; 
    flex-direction: column; 
    gap: 15px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    animation: modalPop 0.3s ease-out;
    max-height: 90vh; 
    overflow-y: auto;
    
    /* IMPORTANTE: Garante que o padding não estoure a largura */
    box-sizing: border-box; 
    margin: auto; /* Centraliza se usar flex no pai */
}
@media(max-width: 480px) {
    /* 1. Remove o padding do fundo escuro no celular para não atrapalhar o cálculo */
    .modal-overlay {
        padding: 0 !important;
    }

    /* 2. Força o modal a ficar centralizado e com tamanho correto */
    .modal-content-forja {
        width: 90% !important;     /* Ocupa 90% da tela (sobra 5% de cada lado) */
        margin: auto !important;   /* A MÁGICA: Centraliza vertical e horizontalmente no Flexbox */
        padding: 15px !important;  /* Espaço interno menor para caber mais coisa */
        box-sizing: border-box !important; /* Garante que o padding não aumente a largura */
        
        /* Reseta posições que podem estar atrapalhando */
        left: auto !important;
        right: auto !important;
        top: auto !important;
        transform: none !important; 
    }

    /* 3. Ajustes internos para o conteúdo caber bem */
    .modal-controles-box {
        flex-direction: column;
        gap: 10px;
        text-align: center;
    }

    .modal-input-group {
        justify-content: center; /* Centraliza o contador de +/- */
    }
}

@keyframes modalPop {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

.btn-fechar-modal {
    position: absolute; top: 10px; right: 10px;
    background: transparent; border: none; font-size: 1.5em; color: #95a5a6; cursor: pointer;
}

.modal-titulo {
    text-align: center; color: #e67e22; text-transform: uppercase; margin: 0;
    border-bottom: 2px solid #ecf0f1; padding-bottom: 10px;
}

.modal-img-area {
    position: relative;
    display: flex; justify-content: center; background: #ecf0f1;
    border-radius: 8px; padding: 15px; border: 1px solid #bdc3c7;
    margin-bottom: 10px;
}
.modal-badge-tipo {
    position: absolute; top: 5px; right: 5px;
    background: rgba(0,0,0,0.1); font-size: 0.7em; padding: 2px 6px; border-radius: 4px;
    color: #7f8c8d; text-transform: uppercase; font-weight: bold;
}
.modal-stats-area {
    background: #fff;
    border: 1px solid #bdc3c7;
    border-radius: 8px;
    padding: 8px;
    margin-bottom: 10px;
    display: flex; flex-direction: column; gap: 4px;
}
.modal-stat-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9em;
}
.modal-stat-row:nth-child(odd) { background: #f8f9fa; }
.stat-left { display: flex; align-items: center; gap: 8px; color: #555; }
.stat-left img { width: 16px; height: 16px; opacity: 0.8; }
.stat-right { font-weight: bold; color: #2c3e50; }

.modal-desc-text {
    font-style: italic; color: #7f8c8d; text-align: center; padding: 10px; font-size: 0.9em;
}
.text-red { color: #e74c3c; }
.modal-icon-big { width: 80px; height: 80px; object-fit: contain; }

.modal-recursos-box {
    background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 10px;
}
.label-section { font-size: 0.75em; font-weight: bold; color: #7f8c8d; margin-bottom: 8px; }

.modal-lista-custos {
    display: flex; flex-direction: column; gap: 8px;
}
.modal-pill-custo {
    display: flex; align-items: center; gap: 10px;
    background: #fff; padding: 8px; border-radius: 6px; border: 1px solid #dee2e6;
}
.modal-pill-custo.falta { border-color: #e74c3c; background: #fadbd8; }

.icon-custo-modal { width: 24px; height: 24px; }
.custo-texto { display: flex; justify-content: space-between; flex: 1; font-size: 0.9em; font-weight: bold; color: #2c3e50; }
.custo-nome { text-transform: capitalize; }

.modal-controles-box {
    display: flex; justify-content: space-between; align-items: center;
    background: #ecf0f1; padding: 10px; border-radius: 8px;
}
.modal-timer { font-weight: bold; color: #7f8c8d; }

.modal-input-group {
    display: flex; background: #fff; border-radius: 6px; border: 1px solid #bdc3c7;
}
.modal-input-group button { width: 35px; height: 35px; border: none; background: transparent; font-weight: bold; cursor: pointer; }
.modal-input-group input {
    width: 70px; /* Aumentei de 50px para caber números maiores (ex: 1000) */
    text-align: center;
    border: none;
    font-weight: bold;
    font-size: 1.1em; /* Texto um pouco maior */
    color: #2c3e50;
    background: #fff; /* Fundo branco para indicar que pode escrever */
    outline: none;
    
    /* Remove as setinhas padrão chatas do input number */
    -moz-appearance: textfield;
}

/* Remove setinhas no Chrome/Safari/Edge */
.modal-input-group input::-webkit-outer-spin-button,
.modal-input-group input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* Efeito de foco para saber que está editando */
.modal-input-group input:focus {
    background: #e8f6f3; /* Um verde bem clarinho */
    color: #2c3e50;
}
.btn-forjar-final {
    width: 100%; padding: 15px;
    background: #27ae60; color: white; border: none; border-radius: 8px;
    font-size: 1.1em; font-weight: bold; letter-spacing: 1px; cursor: pointer;
    box-shadow: 0 4px 0 #219150; transition: transform 0.1s;
}
.btn-forjar-final:active { transform: translateY(4px); box-shadow: none; }
.btn-forjar-final:disabled { background: #bdc3c7; box-shadow: none; cursor: not-allowed; }

/* ==================================================
   RESPONSIVIDADE (MOBILE)
   ================================================== */
@media(max-width: 768px) {
    .painel-controle-ferraria { flex-direction: column; height: auto; }
    
    .capa-corpo { flex-direction: column; align-items: stretch; }
    .capa-img-box { width: 100%; height: 100px; display: flex; justify-content: center; }
    .capa-icon { width: auto; height: 100%; }
    
    .capa-stats { grid-template-columns: repeat(2, 1fr); }
    .lista-receitas-scroll {
        grid-template-columns: 1fr; /* No celular, volta para 1 coluna */
    }
}

/* Classes legadas */
.stats-ferreiro { flex: 1; }
.fila-producao { margin-top: 20px; background: #fff; padding: 10px; border: 1px solid #ccc; border-radius: 8px; }
.barra-progresso-container { height: 20px; background: #eee; border-radius: 10px; position: relative; overflow: hidden; margin: 10px 0; }
.barra-progresso-fill { height: 100%; background: orange; transition: width 1s linear; }
.texto-progresso { position: absolute; width: 100%; text-align: center; font-size: 0.8em; font-weight: bold; top: 2px; }
/* --- ESTILO ATUALIZADO DO CARD DE FUNCIONÁRIO --- */


.topo-detalhe-nome {
    display: flex; align-items: center; gap: 6px;
}
.icon-prof-topo {
    width: 20px; height: 20px;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
}

/* Efeito Zebrado (Opcional, deixa mais legível) */
.linha-dado:nth-child(odd) { background-color: #ffffff; }
/* Frase Rodapé */
.frase-rodape {
    margin-top: auto; /* Empurra para o fundo */
    padding: 4px;
    text-align: center;
    font-style: italic;
    color: #a4b0be;
    font-size: 0.85em;
    border-top: 1px solid #f1f2f6;
    background: #fff;
}
/* Container Principal do Card */
.ferreiro-ativo {
    width: 100%;
    max-width: 220px; /* Largura consideravelmente menor (Carta) */
    margin: 0 auto;   /* Centraliza no espaço disponível */
    background: #ffffff;
    border-width: 2px; border-style: solid;
    border-radius: 8px; overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

/* 1. O cabeçalho precisa ser relative para o ícone se alinhar a ele */
.card-topo {
    position: relative; /* IMPORTANTE: É a âncora do posicionamento */
    display: flex;
    align-items: center;
    padding: 1px 5px;
    padding-right: 35px; /* Garante que o texto do nome não fique embaixo do ícone */
    color: #fff; 
    font-weight: bold;
    height: 32px; /* Altura fixa para o cabeçalho não pular */
}

/* 2. A bolinha branca (Menor e Absoluta) */
.molde-icone-prof {
    position: absolute; /* Solta o elemento para mover livremente */
    top: 2px;           /* Cola no topo (ajuste se quiser mais p/ cima) */
    right: 6px;         /* Cola na direita */
    
    background-color: #ffffff;
    width: 24px;        /* Reduzi de 32px para 24px */
    height: 24px;
    border-radius: 50%;
    
    display: flex;
    align-items: center;
    justify-content: center;
    
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    border: 2px solid rgba(255, 255, 255, 0.5);
    z-index: 10;
}

/* 3. O desenho dentro da bolinha (Ajustado para o novo tamanho) */
.img-prof-inner {
    width: 19px;  /* Reduzi para caber na bolinha menor */
    height: 19px;
    object-fit: contain;
}
.topo-esquerda { display: flex; align-items: center; gap: 6px; }
.tier-badge { background: rgba(0,0,0,0.3); padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
.icon-prof-topo { width: 22px; height: 22px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.5)); }

/* Meio (Avatar + Tabela) */
.card-mid { flex: 1; display: flex; align-items: stretch; background: #fff; }

.avatar-box {
    width: 80px; /* AUMENTADO DE 75px PARA 100px */
    display: flex; align-items: center; justify-content: center;
    background: #f1f2f6; border-right: 1px solid #dfe4ea;
}
.avatar-func { 
    width: 90px;  /* AUMENTADO DE 65px PARA 90px */
    height: 90px; /* AUMENTADO DE 65px PARA 90px */
    border-radius: 4px; border: 1px solid #ced6e0; background: #fff; 
}

.tabela-dados-func { flex: 1; display: flex; flex-direction: column; font-size: 0.75em; }

.linha-dado {
    display: flex; justify-content: space-between; align-items: center;
    padding: 3px 6px; border-bottom: 1px solid #f1f2f6; color: #2f3542;
}
.linha-dado:nth-child(even) { background-color: #f8f9fa; }

.dado-label { color: #747d8c; font-weight: 600; }
.dado-valor { font-weight: bold; color: #2f3542; display: flex; align-items: center; gap: 3px; white-space: nowrap; }
.capitalize { text-transform: capitalize; }
.tiny-coin { width: 11px; height: 11px; }

/* Rodapé Novo */
.rodape-card {
    background: #fff;
    border-top: 1px solid #f1f2f6;
    padding: 6px 4px;
    text-align: center;
    display: flex; flex-direction: column; gap: 2px;
}
.info-produtividade {
    font-size: 0.75em; color: #2c3e50; font-weight: 600;
}
.verde { color: #27ae60; }

.frase-efeito {
    font-size: 0.7em; font-style: italic; color: #a4b0be;
}
/* --- ESTILO DO CARD VAZIO (SLOT) --- */

.vazio-ferreiro-card {
    width: 100%;
    max-width: 220px; /* Mesma largura do card ativo */
    margin: 0 auto;
    background: #f8f9fa; /* Fundo bem claro */
    border: 2px dashed #bdc3c7; /* Borda tracejada (padrão de slot vazio) */
    border-radius: 8px;
    overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: none; /* Sem sombra profunda para parecer "fundo" */
    height: 100%; /* Ocupa a mesma altura */
    min-height: 140px; /* Garante altura mínima visual */
}

/* Topo Desativado */
.vazio-topo {
    background-color: #95a5a6; /* Cinza Concreto */
    color: #ecf0f1;
}
.vazio-badge { background: rgba(0,0,0,0.1); }
.grayscale { filter: grayscale(100%) opacity(0.6); }

/* Avatar Vazio */
.vazio-avatar-box {
    width: 75px; 
    display: flex; align-items: center; justify-content: center;
    background: #ecf0f1;
    border-right: 1px dashed #bdc3c7;
}
.avatar-vazio {
    width: 40px; height: 40px;
    opacity: 0.3; /* Bem transparente */
    filter: grayscale(100%);
}

/* Dados/Mensagem Central */
.vazio-dados {
    display: flex; align-items: center; justify-content: center;
    padding: 10px;
    text-align: center;
}
.texto-central-vazio {
    display: flex; flex-direction: column; gap: 4px;
}
.titulo-vazio {
    font-weight: 800; color: #7f8c8d; text-transform: uppercase; font-size: 0.9em;
}
.subtitulo-vazio {
    font-size: 0.75em; color: #95a5a6;
}

/* Rodapé Vazio */
.vazio-rodape {
    background: #ecf0f1;
    border-top: 1px dashed #bdc3c7;
    color: #95a5a6;
}

/* NOVOS EXEMPLOS AQUI */
/* Container que segura os filtros */
.lado-direito-filtros { 
    flex: 1; 
    display: flex; 
    flex-direction: column; 
    gap: 1px;  /* Espaçamento entre as caixas */
    padding: 5px; 
    justify-content: center; 
    align-items: center; /* CENTRALIZA TUDO HORIZONTALMENTE */
}

/* Título */
.titulo-filtros { 
    color: #d35400; 
    font-weight: bold; 
    border-bottom: 1px solid #ccc; 
    margin-bottom: 5px; 
    width: 90%; 
    text-align: center;
}

/* --- NOVO ESTILO: FIELDSET RPG --- */
.input-rpg {
    width: 220px;      /* Largura fixa para manter o padrão */
    border: 2px solid #bdc3c7;
    border-radius: 8px;
    padding: 0 10px;
    margin: 0;
    background: #fff;
    /* Reset do padding padrão do navegador */
    margin-inline-start: 0;
    margin-inline-end: 0;
    padding-block-start: 0;
    padding-block-end: 0;
    padding-bottom: 2px; /* Leve respiro embaixo */
    
    transition: border-color 0.2s;
}

.input-rpg:hover {
    border-color: #3498db; /* Muda a cor da borda ao passar o mouse */
}

.input-rpg legend {
    font-size: 0.70em;
    font-weight: 800;      /* Texto bem grosso */
    color: #2c3e50;         /* Cor Laranja do tema */
    padding: 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.input-rpg select {
    width: 100%;
    border: none;
    background: transparent;
    font-weight: 500;
    color: #2c3e50;
    padding: 5px 0;
    outline: none;
    cursor: pointer;
    font-size: 0.80em;
}
/* --- FILA DE PRODUÇÃO COMPACTA --- */
.fila-producao-compacta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    
    background: #fff;
    border: 1px solid #e0e0e0;
    border-left: 5px solid #e67e22; /* Detalhe Laranja "Fogo" */
    border-radius: 6px;
    
    padding: 8px 15px;
    margin-bottom: 10px; /* Separa da lista abaixo */
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    height: 50px; /* Altura fixa pequena */
}

/* Lado Esquerdo: Ícone e Texto */
.lado-info {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 160px; /* Garante espaço para o texto não pular */
}

.icone-fogo {
    font-size: 1.4em;
    animation: pulsoFogo 1.5s infinite;
}

.texto-info {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
}

.titulo-fila {
    font-size: 0.85em;
    color: #2c3e50;
}

.tempo-fila {
    font-size: 0.75em;
    font-weight: bold;
    color: #e67e22;
}

/* Meio: Barra de Progresso (Estica para ocupar o espaço) */
.lado-barra {
    flex: 1; /* Ocupa todo o espaço sobrando no meio */
    display: flex;
    align-items: center;
}

.barra-fundo-compacta {
    width: 100%;
    height: 8px; /* Barra bem fininha */
    background: #ecf0f1;
    border-radius: 4px;
    overflow: hidden;
}

.barra-fill-compacta {
    height: 100%;
    background: linear-gradient(90deg, #f39c12, #d35400);
    border-radius: 4px;
    transition: width 1s linear;
}

/* Lado Direito: Botões Pequenos */
.lado-botoes {
    display: flex;
    gap: 8px;
}

.btn-mini-acao {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.1s;
}

.btn-mini-acao:hover { transform: scale(1.1); }

.btn-mini-acao.cancelar { background: #ffebee; color: #c0392b; border: 1px solid #ffcdd2; }
.btn-mini-acao.acelerar { background: #fff8e1; color: #f39c12; border: 1px solid #ffe0b2; }

@keyframes pulsoFogo {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
}

/* Ajuste Mobile para não quebrar */
@media(max-width: 600px) {
    .fila-producao-compacta {
        flex-wrap: wrap; /* Permite quebrar linha se precisar */
        height: auto;    /* Altura automática */
        padding: 10px;
    }
    .lado-barra {
        order: 3; /* Joga a barra para a linha de baixo */
        min-width: 100%;
        margin-top: 5px;
    }
}
.badge-nivel-lista {
    /* --- ESTRUTURA --- */
    min-width: 50px;
    text-align: center;
    flex-shrink: 0;
    
    /* Mantém a linha divisória que criamos antes */
    border-left: 1px solid #ecf0f1; 
    padding-left: 8px;
    
    /* --- VISUAL DA CAIXA --- */
    color: #2b3e4f;             /* Laranja Queimado (Cor de Nível) */
    background-color: #ecf0f1;  /* Fundo Laranja BEM clarinho */
    
    font-size: 0.75em;
    font-weight: bold;
    text-transform: uppercase;
    
    border-radius: 12px;        /* Bem redondo (formato pílula) */
    padding: 4px 8px;           /* Espaçamento interno */
}
</style>