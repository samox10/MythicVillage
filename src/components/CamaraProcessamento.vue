<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { jogo, mostrarAviso, obterBuffRaca, salvarNaNuvem } from '../jogo.js';
import { tabelaCarcacas, nomeProfissao } from '../dados.js';
import { corTier } from '../funcionarios.js';

const abaAtual = ref('destrinchar');
const mostrarBotaoTopo = ref(false);

const verificarScroll = () => {
    mostrarBotaoTopo.value = window.scrollY > 300;
};

const voltarAoTopo = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const isMobile = ref(window.innerWidth < 768); // Verifica se é mobile inicialmente
// --- 1. LÓGICA DO FUNCIONÁRIO ---
const esfoladorAtivo = computed(() => {
    return jogo.funcionarios.find(f => f.profissao === 'esfolador' && f.diasEmGreve === 0);
});

const statsEsfolador = computed(() => {
    // Se não tiver ninguém, retorna o padrão
    if (!esfoladorAtivo.value) {
        return { 
            poderReal: 1, 
            poderFormatado: '1.00', 
            bonusTempo: 0 
        };
    }
    
    const prof = esfoladorAtivo.value;
    
    // Calcula Buff Racial
    const buffPct = obterBuffRaca(prof);
    
    // Calcula Poder Final (Base * Buff)
    const poderCalc = (prof.bonus * (1 + (buffPct / 100)));

    return {
        poderReal: poderCalc,
        poderFormatado: poderCalc.toFixed(2),
        // Exemplo: Se quiser mostrar quantos % ele está acelerando
        bonusTempo: Math.floor((poderCalc - 1) * 100) 
    };
});
// Função auxiliar para pegar a imagem da carcaça pelo ID
const getImagemCarcaca = (id) => {
    if (!id) return '';
    const c = tabelaCarcacas.find(x => x.id === id);
    return c ? c.img : '';
};
// Função auxiliar para pegar a imagem do CORPO (para a mesa)
const getImagemCorpo = (id) => {
    if (!id) return '';
    const c = tabelaCarcacas.find(x => x.id === id);
    // Retorna a imagem do corpo se existir, senão usa o ícone como reserva
    return c ? (c.imgCorpo || c.img) : '';
};
// Função para pegar o tamanho personalizado (ou usar 220 como padrão)
const getTamanhoMonstro = (id) => {
    if (!id) return 220;
    const c = tabelaCarcacas.find(x => x.id === id);
    if (!c) return 220;

    // LÓGICA NOVA: Se for mobile E o monstro tiver configuração mobile, usa ela
    if (isMobile.value && c.tamanhoMobile) {
        return c.tamanhoMobile;
    }
    // Senão, usa o tamanho de Desktop (ou 220 padrão)
    return c.tamanhoVisual ? c.tamanhoVisual : 220;
};
// 1. Função para pegar a ROTAÇÃO (PC ou Mobile)
const getRotacaoMonstro = (id) => {
    // Se não tiver monstro, retorna a rotação padrão (-20 graus)
    if (!id) return -20;
    
    const c = tabelaCarcacas.find(x => x.id === id);
    if (!c) return -20;

    // Se for Mobile E tiver configuração mobile, usa ela
    if (isMobile.value && c.rotacaoMobile !== undefined) {
        return c.rotacaoMobile;
    }
    // Se for PC E tiver configuração PC, usa ela
    if (!isMobile.value && c.rotacaoVisual !== undefined) {
        return c.rotacaoVisual;
    }

    // Se não tiver nada configurado, usa o padrão antigo (-20)
    return -20;
};

// 2. Função para pegar o PADDING/ALTURA DA MESA (PC ou Mobile)
const getPaddingMesa = (id) => {
    // Valores padrão atuais do seu CSS (165px PC / 92px Mobile)
    const padraoPC = 165;
    const padraoMobile = 92;

    if (!id) return isMobile.value ? padraoMobile : padraoPC;

    const c = tabelaCarcacas.find(x => x.id === id);
    if (!c) return isMobile.value ? padraoMobile : padraoPC;

    if (isMobile.value && c.paddingMobile !== undefined) {
        return c.paddingMobile;
    }
    if (!isMobile.value && c.paddingVisual !== undefined) {
        return c.paddingVisual;
    }

    return isMobile.value ? padraoMobile : padraoPC;
};

// Função para adicionar carcaça na fila (clique no botão)
// Função BLINDADA para adicionar carcaça na fila
const adicionarFila = (carcaca) => {
    if (jogo.processamento.length < 8) {
        while (jogo.processamento.length < 8) {
             jogo.processamento.push({ item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 });
        }
    }
    // 1. Verifica Nível da Câmara
    if (carcaca.nivelRequerido > jogo.camaraProcessamento) {
        return mostrarAviso(
            "Câmara Insuficiente", 
            `Nível necessário: ${carcaca.nivelRequerido} (Você tem: ${jogo.camaraProcessamento})`
        );
    }
    
    // 2. Verifica Estoque
    const qtdTenho = jogo.itens[carcaca.id] || 0;
    if (qtdTenho <= 0) return mostrarAviso("Estoque Vazio", `Você não tem ${carcaca.nome}.`);

    // 3. Procura slot vazio (IGNORANDO FANTASMAS)
    let slotVazio = -1;
    
    // Começa do 1 (porque 0 é a mesa)
    for (let i = 1; i < jogo.processamento.length; i++) {
        const slot = jogo.processamento[i];
        
        // Verifica se o slot está REALMENTE ocupado
        // Critério: Tem ID E esse ID existe na tabela de carcaças oficial
        const slotOcupado = slot.item && tabelaCarcacas.some(c => c.id === slot.item);

        if (!slotOcupado) {
            slotVazio = i;
            // Se tinha algum lixo ali (fantasma), a gente limpa agora
            if (slot.item) console.log(`[FIX] Sobrescrevendo fantasma no slot ${i}:`, slot.item);
            break;
        }
    }

    if (slotVazio === -1) return mostrarAviso("Fila Cheia", "A fila de processamento está cheia (10/10).");

    // 4. Adiciona na fila e salva
    jogo.itens[carcaca.id]--; 
    
    // Limpa o slot completamente antes de usar
    jogo.processamento[slotVazio] = {
        item: carcaca.id,
        progresso: 0,
        tempoTotal: 0, // Será calculado no loop do jogo ou abaixo
        tempoRestante: 0
    };

    // Recalcula o tempo com o funcionário atual
    let velocidade = esfoladorAtivo.value ? Number(esfoladorAtivo.value.poder) : 1.0;
    // Proteção contra valor zero/bugado
    if (!velocidade || velocidade <= 0) velocidade = 1.0; 

    const tempoReal = carcaca.tempo / velocidade;
    
    jogo.processamento[slotVazio].tempoTotal = tempoReal;
    jogo.processamento[slotVazio].tempoRestante = tempoReal;
    salvarNaNuvem();
};

// Função para cancelar e fazer a fila andar
const cancelarFila = (index) => {
    const slot = jogo.processamento[index];
    
    // Segurança: se não tiver nada ali, não faz nada
    if (!slot || !slot.item) return;

    // 1. Devolve o item pro inventário
    jogo.itens[slot.item] = (jogo.itens[slot.item] || 0) + 1;
    
    // 2. Remove o slot daquele lugar específico (O "pulo" da fila acontece aqui)
    jogo.processamento.splice(index, 1);

    // 3. Adiciona um slot vazio novinho no final da lista
    // Isso garante que a fila sempre tenha 11 posições (1 mesa + 10 fila)
    jogo.processamento.push({ item: null, tempoTotal: 0, tempoRestante: 0, progresso: 0 });
    salvarNaNuvem();
};
// Função para abrir detalhes da carcaça
const verDetalhesCarcaca = (carcaca) => {
    const texto = `
        🌍 <b>Ambiente:</b> ${carcaca.ambiente || 'Desconhecido'}
        <br><br>
        ⏱️ <b>Tempo de Corte:</b> ${carcaca.tempo} segundos
        <br>
        🍖 <b>Gera:</b> ${carcaca.recursos.carne} Carne
        🛡️ <b>Gera:</b> ${carcaca.recursos.couro} Couro
        <br><br>
        <i>"${carcaca.desc}"</i>
    `;
    
    // Usa o sistema de modal global do jogo
    mostrarAviso(carcaca.nome, texto, 'info'); 
    // Nota: 'info' é um tipo genérico, se quiser ícone específico teríamos que mexer no Modal.vue, mas por enquanto isso funciona.
};

// --- 2. HELPERS VISUAIS ---
const formatarNumero = (num) => {
    return num ? num.toLocaleString('pt-BR') : '0';
};
// --- LÓGICA DE PAGINAÇÃO DO CATÁLOGO ---
// --- LÓGICA DE PAGINAÇÃO RESPONSIVA ---
const paginaAtual = ref(1);
// Começa com 12, mas vamos ajustar logo em seguida
const itensPorPagina = ref(12); 

// Função que decide quantos itens mostrar
const atualizarItensPorPagina = () => {
    // 2. Atualiza a variável sempre que a tela mudar
    isMobile.value = window.innerWidth < 768;

    if (window.innerWidth < 768) {
        itensPorPagina.value = 10;
    } else {
        itensPorPagina.value = 16;
    }
};

// --- (Importante) Adicionar Listeners de Tela ---
// Precisamos atualizar isso quando o site carregar E quando redimensionar a tela
onMounted(() => {
    // --- [NOVO] FAXINA AUTOMÁTICA DE ITENS FANTASMAS ---
    if (jogo.processamento) {
        jogo.processamento.forEach(slot => {
            // Se tem um item no slot, MAS esse item não existe na lista oficial...
            if (slot.item && !tabelaCarcacas.some(c => c.id === slot.item)) {
                console.log("👻 Fantasma removido da fila:", slot.item);
                slot.item = null;
                slot.progresso = 0;
                slot.tempoTotal = 0;
                slot.tempoRestante = 0;
            }
        });
    }
    // ----------------------------------------------------

    atualizarItensPorPagina(); // Executa ao abrir
    window.addEventListener('resize', atualizarItensPorPagina); // Executa ao mudar tamanho
    
    // (Mantém seu listener de scroll antigo aqui também se quiser, ou deixe separado)
    window.addEventListener('scroll', verificarScroll);
});

onUnmounted(() => {
    window.removeEventListener('resize', atualizarItensPorPagina);
    window.removeEventListener('scroll', verificarScroll);
});

// Calcula quantas páginas existem (Agora usa itensPorPagina.value)
const totalPaginas = computed(() => Math.ceil(tabelaCarcacas.length / itensPorPagina.value));

// Funções de Navegação
const proximaPagina = () => {
    if (paginaAtual.value < totalPaginas.value) paginaAtual.value++;
};
const paginaAnterior = () => {
    if (paginaAtual.value > 1) paginaAtual.value--;
};
// Corta a lista para mostrar apenas os da página atual
const carcacasVisiveis = computed(() => {
    const inicio = (paginaAtual.value - 1) * itensPorPagina.value;
    return tabelaCarcacas.slice(inicio, inicio + itensPorPagina.value);
});
// Ordenaçao das carcaças
const carcacasOrdenadas = computed(() => {
    const nivelAtual = jogo.camaraProcessamento;

    // --- PASSO 1: Descobrir qual é o "Próximo Nível" existente ---
    // Cria uma lista apenas com os níveis que são maiores que o meu
    const niveisFuturos = tabelaCarcacas
        .map(c => c.nivelRequerido)
        .filter(n => n > nivelAtual);

    // Pega o menor valor dessa lista (o nível mais próximo). 
    // Se a lista estiver vazia (já desbloqueou tudo), definimos como null.
    const proximoNivelVisivel = niveisFuturos.length > 0 ? Math.min(...niveisFuturos) : null;

    // --- PASSO 2: Filtrar a tabela ---
    const listaFiltrada = tabelaCarcacas.filter(c => {
        // Regra 1: Mostra tudo que já está desbloqueado (Menor ou igual ao meu nível)
        if (c.nivelRequerido <= nivelAtual) return true;

        // Regra 2: Mostra SOMENTE o que for do próximo nível imediato (O "Spoiler")
        if (proximoNivelVisivel !== null && c.nivelRequerido === proximoNivelVisivel) return true;

        // Regra 3: Se o jogador TIVER o item no inventário (via bug ou evento), 
        // geralmente é boa prática mostrar para o item não "sumir", 
        // mas como você pediu para limpar, pode remover esta linha abaixo se quiser rigidez total.
        if ((jogo.itens[c.id] || 0) > 0) return true; 

        // O resto (Níveis muito altos) é escondido
        return false;
    });

    // --- PASSO 3: Ordenar (Sua lógica de estoque e prioridade) ---
    return listaFiltrada.sort((a, b) => {
        const qtdA = jogo.itens[a.id] || 0;
        const qtdB = jogo.itens[b.id] || 0;
        const temA = qtdA > 0;
        const temB = qtdB > 0;

        // Prioridade 1: Quem tem estoque aparece primeiro
        if (temA && !temB) return -1;
        if (!temA && temB) return 1;

        // Prioridade 2: Entre os que tem estoque (ou os dois sem), quem já está desbloqueado vem antes
        const desbloqA = a.nivelRequerido <= nivelAtual;
        const desbloqB = b.nivelRequerido <= nivelAtual;
        
        if (desbloqA && !desbloqB) return -1;
        if (!desbloqA && desbloqB) return 1;

        // Prioridade 3: Ordem Alfabética
        return a.nome.localeCompare(b.nome);
    });
});
</script>

<template>
    <div class="mythic-container">
        
        <div class="header-titulo-aba">
            <div class="titulo-nivel">
                <h2>🔪 Câmara de Processamento</h2>
            </div>
            <div class="info-nivel">
                <span class="badge-nivel">Nível {{ jogo.camaraProcessamento }}</span>
            </div>
        </div>        
        <!-- ABAS DE PROCESSAMENTO ( DESTRINCHAR / PROCESSAR ) 
        <div class="abas-taverna">
            <button :class="{ ativo: abaAtual === 'destrinchar' }" @click="abaAtual = 'destrinchar'">DESTRINCHAR</button>
            
            <button 
                :class="{ 'ativo': abaAtual === 'processamento', 'bloqueado': !esfoladorAtivo }" 
                @click="abaAtual = 'processamento'"
                :disabled="!esfoladorAtivo"
                :title="!esfoladorAtivo ? 'Requer um Esfolador contratado (O Ajudante não sabe aprimorar itens)' : ''">
                PROCESSAR <span v-if="!esfoladorAtivo" style="margin-left:5px; font-size: 0.9em;">🔒</span>
            </button>
        </div>
        -->
        <div v-if="abaAtual === 'destrinchar'">
            <div class="painel-controle-global">
                
<!-- INICIO DO CARD FUNCIONARIO CONTRATADO-->
            <div v-if="esfoladorAtivo" class="card-funcionario funcionario-ativo" :style="{ borderColor: corTier(esfoladorAtivo.tier) }">
                
                <div class="card-topo" :style="{ backgroundColor: corTier(esfoladorAtivo.tier) }">
                    <div class="topo-esquerda">
                        <span class="tier-badge">{{ esfoladorAtivo.tier }}</span>
                        <span class="card-nome">{{ esfoladorAtivo.nome }}</span>
                    </div>
                    
                    <div class="molde-icone-prof">
                        <img src="/assets/ui/i_esfolador.png" class="img-prof-inner" title="Esfolador">
                    </div>
                </div>

                <div class="card-mid">
                    <div class="avatar-box">
                         <img :src="`/assets/faces/${esfoladorAtivo.raca}/${esfoladorAtivo.imagem}.png`" class="avatar-func">
                    </div>

                    <div class="tabela-dados-func">
                        <div class="linha-dado">
                            <span class="dado-label">Profissão:</span>
                            <span class="dado-valor">{{ nomeProfissao(esfoladorAtivo) }}</span>
                        </div>
                        <div class="linha-dado">
                            <span class="dado-label">Raça:</span>
                            <span class="dado-valor capitalize">{{ esfoladorAtivo.raca }}</span>
                        </div>
                        <div class="linha-dado">
                            <span class="dado-label">Sexo:</span>
                            <span class="dado-valor">{{ esfoladorAtivo.sexo === 'masculino' ? 'Masculino' : 'Feminino' }}</span>
                        </div>
                        <div class="linha-dado">
                            <span class="dado-label">Salário:</span>
                            <span class="dado-valor">
                                {{ formatarNumero(esfoladorAtivo.salario) }} 
                                <img src="/assets/ui/icone_goldC.png" class="tiny-coin">
                            </span>
                        </div>
                    </div>
                </div>

                <div class="rodape-card">
                    <div class="info-produtividade">
                        Maestria da cura +<span class="verde">{{ statsEsfolador.poderFormatado }}%</span>
                    </div>
                    <div class="frase-efeito">
                        "{{ esfoladorAtivo.frase || 'Curarei os Feridos!' }}"
                    </div>
                </div>
            </div>
<!-- FIM DO CARD FUNCIONARIO CONTRATADO-->
<!-- INICIO DO CARD FUNCIONARIO AJUDANTE-->
            <div v-else class="card-funcionario funcionario-ativo" style="border-color: #95a5a6; opacity: 0.9;">
                
                <div class="card-topo" style="background-color: #95a5a6;">
                    <div class="topo-esquerda">
                        <span class="tier-badge" style="background: rgba(0,0,0,0.2)">-</span>
                        <span class="card-nome">Aprendiz da Vila</span>
                    </div>
                    
                    <div class="molde-icone-prof">
                        <img src="/assets/ui/i_esfolador.png" class="img-prof-inner" title="Esfolador Interino" style="filter: grayscale(1);">
                    </div>
                </div>

                <div class="card-mid">
                    <div class="avatar-box">
                         <img src="/assets/faces/humano/esfolador_m.png" class="avatar-func" style="filter: sepia(0.4);">
                    </div>

                    <div class="tabela-dados-func" style="justify-content: flex-start; align-self: flex-start; margin-top: 5px;">
                        <div class="linha-dado">
                            <span class="dado-label">Profissão:</span>
                            <span class="dado-valor">Ajudante</span>
                        </div>
                        </div>
                </div>

                <div class="rodape-card">
                    <div class="frase-efeito">
                        "Segurando as pontas até o mestre chegar..."
                    </div>
                </div>
            </div>
<!-- FIM DO CARD FUNCIONARIO AJUDANTE-->

                <div class="linha-divisoria"></div>

                <div class="lado-direito-filtros">
                    <div class="header-catalogo">
                        <div class="titulo-info-extra">📘 Catálogo</div>
                        
                        <div v-if="totalPaginas > 1" class="controles-paginacao">
                            <button 
                                class="btn-pag" 
                                @click="paginaAnterior" 
                                :disabled="paginaAtual === 1"
                                title="Página Anterior">
                                ◄
                            </button>
                            
                            <span class="indicador-pag">{{ paginaAtual }}/{{ totalPaginas }}</span>
                            
                            <button 
                                class="btn-pag" 
                                @click="proximaPagina" 
                                :disabled="paginaAtual === totalPaginas"
                                title="Próxima Página">
                                ►
                            </button>
                        </div>
                    </div>
                    
                    <div class="botoes-explicativos-carcacas">
                        <button 
                            v-for="c in carcacasVisiveis" 
                            :key="c.id" 
                            
                            :class="['btn-info-monster', { 'bloqueado': c.nivelRequerido > jogo.camaraProcessamento }]"
                            
                            @click="c.nivelRequerido > jogo.camaraProcessamento ? null : verDetalhesCarcaca(c)"
                            
                            :title="c.nivelRequerido > jogo.camaraProcessamento ? `Bloqueado: Requer Câmara Nível ${c.nivelRequerido}` : c.nome"
                            
                            :disabled="c.nivelRequerido > jogo.camaraProcessamento"
                        >
                            <img :src="c.img" class="img-info-monster">
                            
                            <div v-if="c.nivelRequerido > jogo.camaraProcessamento" class="overlay-lock">
                                <span class="lock-label">NÍVEL</span>
                                <span class="lock-value">{{ c.nivelRequerido }}</span>
                            </div>
                        </button>
                        
                        <div v-for="n in (itensPorPagina - carcacasVisiveis.length)" :key="'vazio-'+n" class="slot-falso"></div>
                    </div>
                </div>
            </div>
            <div class="mesa-processamento" 
                 :style="{ paddingBottom: getPaddingMesa(jogo.processamento[0]?.item) + 'px' }">        

                <div v-if="jogo.processamento[0] && jogo.processamento[0].item" class="monstro-na-mesa">
                    <img 
                        :src="getImagemCorpo(jogo.processamento[0].item)" 
                        class="img-monstro-mesa" 
                        :style="{ 
                            width: getTamanhoMonstro(jogo.processamento[0].item) + 'px',
                            transform: `rotate(${getRotacaoMonstro(jogo.processamento[0].item)}deg) scale(1.1)`
                        }"
                    >
                </div>

                <div v-if="jogo.processamento[0] && jogo.processamento[0].item" class="barra-progresso-container">
                    <div class="barra-progresso-fill" :style="{ width: jogo.processamento[0].progresso + '%' }"></div>
                    <span class="texto-progresso">{{ Math.floor(jogo.processamento[0].tempoRestante) }}s</span>
                </div>

                <div v-else class="aviso-mesa-vazia">
                    <span style="font-size: 4em;">🔪</span>
                    <p>Aguardando carcaça...</p>
                </div>
            </div>
            <div class="fila-processamento">
                <div v-for="i in 7" :key="i" class="slot-fila">
                    
                    <div v-if="jogo.processamento[i] && jogo.processamento[i].item" class="item-fila-conteudo">
                        <img :src="getImagemCarcaca(jogo.processamento[i].item)" class="img-slot-fila">
                        <button class="btn-fechar-fila" @click="cancelarFila(i)">x</button>
                    </div>

                    <div v-else class="slot-vazio"></div>
                </div>
            </div>
            <div class="painel-selecao-carcacas">
                <h3>🥩 Estoque do Galpão</h3>
                <div class="grid-botoes-carcacas">
                    <button 
                        v-for="carcaca in carcacasOrdenadas" 
                        :key="carcaca.id"
                        class="card-selecao-carcaca"
                        :class="{ 'nivel-insuficiente': carcaca.nivelRequerido > jogo.camaraProcessamento }"
                        @click="adicionarFila(carcaca)"
                        :disabled="(jogo.itens[carcaca.id] || 0) <= 0"
                    >
                        
                        <div class="wrapper-icone">
                            <img :src="carcaca.img" class="icon-carcaca-btn">
                        </div>

                        <div class="info-carcaca-btn">
                            <span class="nome-carcaca">{{ carcaca.nome }}</span>
                            <span class="estoque-carcaca">Em estoque: {{ jogo.itens[carcaca.id] || 0 }}</span>
                        </div>

                        <div v-if="carcaca.nivelRequerido > jogo.camaraProcessamento" class="badge-requisito">
                            Nvl {{ carcaca.nivelRequerido }}
                        </div>
                        <span v-else class="btn-add-icone">+</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="conteudo-pagina">
            <slot></slot>
        </div>

        <button v-if="mostrarBotaoTopo" 
                class="btn-scroll-topo" 
                @click="voltarAoTopo" 
                title="Voltar ao Topo">
            ▲
        </button>
    </div>
</template>

<style scoped>
@import '../css/importantes.css';
* { box-sizing: border-box; }


.abas-taverna button.bloqueado {
    opacity: 0.6;
    cursor: not-allowed;
    background: #95a5a6;
    color: #ecf0f1;
    border-color: #7f8c8d;
    box-shadow: none;
}
/* --- MESA DE PROCESSAMENTO --- */
.mesa-processamento {
    background: url('/assets/ui/mesa_processamento.png');
    background-size: contain; 
    background-position: center bottom;
    background-repeat: no-repeat;
    
    background-color: transparent; 
    border: none; 
    box-shadow: none;

    height: 350px; 
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    justify-content: flex-end; 
    
    /* MUDANÇA 1: Aumentei de 110px para 145px. 
       Isso vai empurrar o monstro bem mais para o "meio" da mesa.
    padding-bottom: 165px;  */
    
    margin-bottom: 15px;
    margin-top: 15px;
}

.monstro-na-mesa {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    animation: slideIn 0.5s ease;
}

/* Imagem Grande do Monstro */
.img-monstro-mesa {
    height: auto;
    object-fit: contain;
    
    margin: 0; 
    
    /* MUDANÇA 2: Adicionei esta linha.
       rotate(-10deg): Gira levemente para esquerda para acompanhar a mesa.
       scale(1.1): Aumenta um pouquinho o tamanho para preencher melhor a pedra.
    transform: rotate(-20deg) scale(1.1); */

    filter: drop-shadow(0 5px 5px rgba(0,0,0,0.4));
    animation: fadeIn 0.5s ease;
}

.aviso-mesa-vazia {
    color: rgba(255, 255, 255, 0.529);
    text-align: center;
    font-weight: bold;
}

/* --- BARRA DE PROGRESSO --- */
.barra-progresso-container {
    /* Largura da barra */
    width: 40%; 
    height: 20px;
    
    background: #2d3436;
    border: 2px solid #000;
    border-radius: 10px;
    
    /* POSICIONAMENTO FIXO NA MESA */
    position: absolute; /* Permite fixar em um lugar exato */
    bottom: -10px;       /* Cola no fundo da mesa (logo acima da fila) */
    left: 50%;          /* Posiciona o início no meio da tela */
    transform: translateX(-50%); /* Ajusta para ficar perfeitamente centralizado */
    z-index: 10;        /* Garante que fique acima da imagem do monstro se ela for muito grande */
    
    /* Removemos a margem antiga pois não precisamos mais dela */
    margin-bottom: 0; 
    overflow: hidden;
}

.barra-progresso-fill {
    height: 100%;
    background: linear-gradient(90deg, #e67e22, #f1c40f);
    width: 0%;
    transition: width 1s linear;
}

.texto-progresso {
    position: absolute;
    top: 0; left: 0; right: 0;
    text-align: center;
    font-size: 0.8em;
    color: #fff;
    text-shadow: 1px 1px 1px #000;
    line-height: 15px;
}

/* --- FILA DE PROCESSAMENTO --- */
.fila-processamento {
    display: flex;
    /* DESKTOP (Padrão): Espaçado e Centralizado */
    gap: 10px; 
    padding: 6px 12px;
    margin: 0 auto 20px auto;
    width: 65%;
    
    background: #e4e7eb;
    border-radius: 50px;
    border: 1px solid #dcdde1;
    box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
    
    /* Desktop não precisa de scroll, pois 7 itens cabem na tela */
    flex-wrap: wrap; 
    justify-content: center;
}

.slot-fila {
    /* DESKTOP (Padrão): Tamanho Grande Anterior */
    width: 50px;
    height: 50px;
    
    background: transparent;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.slot-fila:last-child { border-right: none; }

/* Slot Ocupado (Desktop) */
.slot-fila:has(.item-fila-conteudo) {
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transform: scale(0.9);
}

.slot-vazio {
    width: 10px; height: 10px;
    background: #bdc3c7;
    border-radius: 50%;
    opacity: 0.5;
}

/* --- VERSÃO MOBILE (Tela menor que 768px) --- */
@media (max-width: 768px) {
    /* --- 1. MESA (Volta ao tamanho visual agradável) --- */
    .mesa-processamento {
        /* Altura reduzida para não ocupar muito espaço vertical */
        height: 200px; 
        
        /* 'contain' garante que a imagem da mesa apareça inteira, sem zoom excessivo */
        background-size: contain; 
        background-position: center bottom;
        
        /* AQUI ESTÁ O TRUQUE DO POSICIONAMENTO: */
        /* Reduzimos o "colchão" de baixo. Quanto menor esse número, mais baixo o monstro fica. */
        padding-bottom: 92px; 
        
        /* Pequeno ajuste de margem externa */
        margin-bottom: 10px;
    }
    .img-monstro-mesa {
        max-width: 90%; /* Segurança para não estourar a tela se vc errar o numero no JS */
        max-height: 150px; /* Opcional: Limite de altura */
    }
    .fila-processamento {
        gap: 0; /* Remove espaço no celular */
        padding: 6px 12px;
        
        /* Ativa o Scroll Horizontal Compacto */
        width: max-content;
        max-width: 100%;
        overflow-x: auto;
        flex-wrap: nowrap; /* Impede que quebre linha no celular */
        justify-content: flex-start;
        
        /* Esconde barra de rolagem */
        scrollbar-width: none;
    }
    .fila-processamento::-webkit-scrollbar { display: none; }
    .barra-progresso-container {
        width: 60% !important;
    }
    .texto-progresso {
        line-height: 17px !important;
    }
    .slot-fila {
        /* MOBILE: Tamanho Pequeno (38px) */
        width: 38px;
        height: 38px;
    }

    .slot-vazio {
        width: 6px; height: 6px; /* Bolinha menor no celular */
    }
    
    /* Ajuste fino do botão de fechar no celular */
    .btn-fechar-fila {
        width: 14px; height: 14px;
        font-size: 8px;
        right: -4px; top: -2px;
        
        /* MUDANÇA 3: No celular, sempre visível (ignora o hover) */
        opacity: 1 !important; 
    }
}

/* --- ESTILOS GERAIS (Servem para ambos) --- */
.item-fila-conteudo { width: 100%; height: 100%; position: relative; border-radius: 50%; }

.img-slot-fila {
    width: 100%; height: 100%; 
    object-fit: contain; 
    padding: 6px;
}

.btn-fechar-fila {
    position: absolute;
    top: -5px; right: -5px;
    background: #c0392b; color: white;
    border: 2px solid #fff;
    border-radius: 50%;
    width: 20px; height: 20px;
    font-size: 10px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    z-index: 5;
    
    /* MUDANÇA 1: Começa invisível e tem transição suave */
    opacity: 0; 
    transition: opacity 0.2s ease-in-out;
}
.slot-fila:hover .btn-fechar-fila {
    opacity: 1;
}
/* --- FIM FILA DE PROCESSAMENTO --- */

/* --- SELEÇÃO DE CARCAÇAS --- */
.painel-selecao-carcacas h3 { margin: 0 0 10px 0; font-size: 1em; color: #7f8c8d; border-bottom: 1px solid #ccc; padding-bottom: 5px; }

.grid-botoes-carcacas {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
}

.card-selecao-carcaca {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border: 1px solid #bdc3c7;
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
}
.card-selecao-carcaca:hover:not(:disabled) {
    background: #f1f2f6;
    border-color: #3498db;
    transform: translateY(-2px);
}
.card-selecao-carcaca:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(1);
}
/* --- Opção A: Estilo Clean / Fosco --- */

/* Quando bloqueado por nível */
.card-selecao-carcaca.nivel-insuficiente {
    opacity: 0.6; /* Fica meio apagadinho */
    background: #fdfdfd; /* Fundo levemente diferente */
    cursor: not-allowed;
    border-color: #ecf0f1; /* Borda bem suave */
}

/* Deixa a imagem preto e branco para indicar que não pode usar */
.nivel-insuficiente .icon-carcaca-btn {
    filter: grayscale(100%);
    opacity: 0.7;
}

/* O texto do nome fica cinza */
.nivel-insuficiente .nome-carcaca {
    color: #95a5a6;
}

/* A Etiqueta que substitui o "+" */
.badge-requisito {
    background: #bdc3c7; /* Cinza neutro */
    color: #fff;
    font-size: 0.7em;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    white-space: nowrap;
}

.icon-carcaca-btn { width: 40px; height: 40px; object-fit: contain; }
.info-carcaca-btn { flex: 1; display: flex; flex-direction: column; }
.nome-carcaca { font-weight: bold; font-size: 0.9em; color: #2c3e50; }
.estoque-carcaca { font-size: 0.75em; color: #7f8c8d; }
.btn-add-icone { font-weight: bold; font-size: 1.5em; color: #27ae60; }

@keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
/* Header Flexível para alinhar Título e Botões */
.header-catalogo {
    margin-bottom: 8px;
    border-bottom: 1px solid #ecf0f1;
    padding-bottom: 4px;
}
.titulo-info-extra {
    font-size: 0.8em;
    font-weight: bold;
    color: #7f8c8d;
    text-transform: uppercase;
}
/* Controles de Paginação */
.controles-paginacao {
    display: flex;
    align-items: center;
    gap: 5px;
}
.btn-pag {
    background: transparent;
    border: 1px solid #bdc3c7;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.7em;
    color: #7f8c8d;
    padding: 2px 6px;
    transition: all 0.2s;
}
.btn-pag:hover:not(:disabled) {
    background: #3498db;
    color: white;
    border-color: #3498db;
}
.btn-pag:disabled {
    opacity: 0.3;
    cursor: default;
}

.indicador-pag {
    font-size: 0.7em;
    font-weight: bold;
    color: #95a5a6;
    min-width: 25px;
    text-align: center;
}

/* Container dos Botões (Grid) */
.botoes-explicativos-carcacas {
    display: flex;
    flex-wrap: wrap;
    gap: 8px; /* Espaço entre botões */
    align-content: flex-start;
    
    /* Removemos a rolagem! */
    overflow: hidden; 
    width: 100%;
    
    /* Padding para o zoom (hover) não cortar */
    padding: 5px;
}

/* Scrollbar fina */
.botoes-explicativos-carcacas::-webkit-scrollbar { width: 6px; } /* Um pouco mais larga pra não sumir */
.botoes-explicativos-carcacas::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
.botoes-explicativos-carcacas::-webkit-scrollbar-thumb { background: #bdc3c7; border-radius: 4px; }
/* O Botãozinho Individual */
.btn-info-monster {
    /* Aumentado de 40px para 48px */
    width: 48px;
    height: 48px;
    
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #bdc3c7;
    border-radius: 8px; /* Mais arredondado */
    padding: 4px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex; align-items: center; justify-content: center;
}

.btn-info-monster:hover {
    border-color: #3498db;
    background: #f1f2f6;
    transform: scale(1.1);
    z-index: 2; /* Garante que fique por cima ao dar zoom */
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
/* Quando o botão tem a classe .bloqueado */
.btn-info-monster.bloqueado {
    position: relative; /* Necessário para posicionar o cadeado */
    background: #ecf0f1;
    border-color: #bdc3c7;
    cursor: not-allowed; /* Mostra o cursor de proibido */
    opacity: 0.8;
}

/* Removemos o efeito de zoom/hover se estiver bloqueado */
.btn-info-monster.bloqueado:hover {
    transform: none;
    border-color: #bdc3c7;
    box-shadow: none;
}

/* Deixa a imagem do monstro preto e branco */
.btn-info-monster.bloqueado .img-info-monster {
    filter: grayscale(100%) opacity(0.6);
}

/* O ícone do cadeado */
.overlay-lock {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    
    /* Removemos o quadrado/círculo de fundo */
    width: 100%;
    height: 100%;
    background: transparent; 
    border: none;
    box-shadow: none;
    
    /* Alinha o texto no centro */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    z-index: 10;
    pointer-events: none; /* Garante que o clique não bugue */
}
.lock-label {
    font-size: 0.55em; 
    color: #fff;       /* Texto branco */
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: -2px; /* Gruda no número */
    
    /* Sombra preta forte para ler em cima de qualquer cor */
    text-shadow: 
        -1px -1px 0 #000,  
         1px -1px 0 #000,
        -1px  1px 0 #000,
         1px  1px 0 #000;
}

.lock-value {
    font-size: 1.1em; 
    color: #fff;       /* Texto branco */
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: -2px; /* Gruda no número */
    margin-top: 3px;
    
    
    /* Contorno preto grosso ao redor do número */
    text-shadow: 
        -1px -1px 0 #000,  
         1px -1px 0 #000,
        -1px  1px 0 #000,
         1px  1px 0 #000;
}

.img-info-monster {
    width: 100%; height: 100%; object-fit: contain;
}
.slot-falso {
    width: 48px;
    height: 48px;
}
</style>