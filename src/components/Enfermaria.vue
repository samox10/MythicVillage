<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { jogo, mostrarAviso, obterBuffRaca, salvarNaNuvem } from '../jogo.js';
import { corTier } from '../funcionarios.js';
import { catalogoMedicamentos, tiposFerimentos, infoCategorias, nomeProfissao } from '../dados.js';

const abaAtual = ref('tratamento');
const mostrarBotaoTopo = ref(false);
// Controle do Modal de Troca (Menu de Seleção)
const modalTrocaAberto = ref(false);
const categoriaParaTrocar = ref(null);
// Computada para facilitar o loop no HTML
const slotsVisiveis = computed(() => {
    // Transforma o objeto infoCategorias em uma lista para o v-for
    return Object.keys(infoCategorias).map(catKey => {
        const idItemAtual = loadout[catKey];
        // Busca os dados completos do item que está equipado
        const itemDados = catalogoMedicamentos.find(i => i.id === idItemAtual);
        
        return {
            key: catKey,
            info: infoCategorias[catKey], // Nome da Categoria, Icone da Categoria
            itemAtual: itemDados || {}    // Dados do item selecionado (Bandagem Premium, etc)
        };
    });
});
// 1. Abre Info da Categoria (Botão do Ícone Grande)
const verInfoCategoria = (slot) => {
    mostrarAviso(
        `Categoria: ${slot.info.nome}`, 
        `${slot.info.desc}\n\nItem Equipado Atual:\n${slot.itemAtual.nome} (Fator: ${slot.itemAtual.fatorCura}x)`,
        'confirmacao'
    );
};

// 2. Abre Menu de Troca (Botão Pequeno)
const abrirTroca = (catKey) => {
    categoriaParaTrocar.value = catKey;
    modalTrocaAberto.value = true;
};

// 3. Efetua a Troca (Ao clicar num item da lista)
const selecionarItem = (item) => {
    loadout[item.categoria] = item.id; // Salva a escolha
    salvarNaNuvem();
    modalTrocaAberto.value = false;    // Fecha o menu
    categoriaParaTrocar.value = null;
};

// 4. Lista de Opções (Filtra itens para o menu de troca)
const opcoesParaTroca = computed(() => {
    if (!categoriaParaTrocar.value) return [];
    return catalogoMedicamentos.filter(i => i.categoria === categoriaParaTrocar.value);
});

const verificarScroll = () => {
    mostrarBotaoTopo.value = window.scrollY > 300;
};

const voltarAoTopo = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(() => {
    window.addEventListener('scroll', verificarScroll);
});

onUnmounted(() => {
    window.removeEventListener('scroll', verificarScroll);
});
// --- 1. LÓGICA DO FUNCIONÁRIO ---
const enfermeiroAtivo = computed(() => {
    return jogo.funcionarios.find(f => f.profissao === 'enfermeiro' && f.diasEmGreve === 0);
});

const statsEnfermeiro = computed(() => {
    if (!enfermeiroAtivo.value) {
        return { 
            reducaoReal: 0, 
            textoDisplay: '0%', 
            fatorMultiplicador: 1 // Tempo x 1 (Normal)
        };
    }
    
    const prof = enfermeiroAtivo.value;
    
    // Calcula Buff Racial
    const buffPct = obterBuffRaca(prof);
    const fatorRaca = 1 + (buffPct / 100);
    
    // Pega a MEDICINA (poderEspecial) em vez do Bonus
    const medicinaBase = prof.poderEspecial || 0;
    
    // Calcula redução final (Ex: 30 * 1.1 = 33%)
    const reducaoFinal = Math.min(90, medicinaBase * fatorRaca);

    return {
        reducaoReal: reducaoFinal,
        textoDisplay: parseFloat(reducaoFinal.toFixed(1)) + '%',
        // Fator para multiplicar o tempo (Ex: 100% - 33% = 0.67)
        fatorMultiplicador: (1 - (reducaoFinal / 100))
    };
});
const formatarNumero = (num) => {
    return num ? num.toLocaleString('pt-BR') : '0';
};
// Função nova para transformar segundos em 1h 30m 10s
const formatarTempo = (segundos) => {
    if (segundos < 0) segundos = 0;
    
    const sTotal = Math.floor(segundos);
    const h = Math.floor(sTotal / 3600);
    const m = Math.floor((sTotal % 3600) / 60);
    const s = sTotal % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};
// Função para abrir o Modal com os detalhes
const verDetalhesItem = (item) => {
    const qtdAtual = jogo.itens[item.id] || 0;
    
    // Adicionei a linha do Nível Necessário
    const textoDetalhes = `
    📦 Em Estoque: ${qtdAtual}
    🔒 Nível Necessário: ${item.nivelReq}
    
    ✨ Função: ${item.funcao}
    ⚡ Poder: ${item.poder}
    
    📍 Onde conseguir:
    ${item.onde}
    
    📖 Descrição:
    "${item.desc}"
    `;

    mostrarAviso(item.nome, textoDetalhes, 'confirmacao');
};




// --- PROTÓTIPOS --- //


// Função auxiliar para calcular a cor da barra de estoque
const corEstoque = (qtd, max) => {
    const porcentagem = qtd / max;
    if (porcentagem === 0) return '#e74c3c'; // Vermelho (Vazio)
    if (porcentagem < 0.3) return '#f39c12'; // Laranja (Baixo)
    return '#2ecc71'; // Verde (Ok)
};
// --- SISTEMA DE LEITOS (PROTÓTIPO) ---

// 1. Configuração dos Leitos (Começam vazios)
const quantidadeLeitos = 3;
const loadout = jogo.loadoutEnfermaria;

// Usa fila e leitos globais
const leitos = computed(() => jogo.leitos);
const filaDeEspera = computed(() => jogo.filaDeEspera);

// Função de Alocação MANUAL (Clique do Usuário)
const alocarPaciente = (paciente, indexLeito) => {
    // Se o modo automático estiver ligado, avisa pra desligar antes de mexer
    if (jogo.modoAutomaticoEnfermaria) {
        return mostrarAviso("Modo Automático", "Desligue a automação para gerenciar manualmente.");
    }

    if (leitos.value[indexLeito].ocupado) return;

    const tipoDoencaID = paciente.doenca || 'corte_pergaminho'; 
    const dadosDoenca = tiposFerimentos[tipoDoencaID];
    const categoriaNecessaria = dadosDoenca.reqCategoria;
    
    // Pega do global
    const idItemConfigurado = jogo.loadoutEnfermaria[categoriaNecessaria]; 
    const itemUsado = catalogoMedicamentos.find(i => i.id === idItemConfigurado);

    if (!itemUsado) return mostrarAviso('Erro', 'Item configurado não existe.');

    const qtdNoInventario = jogo.itens[itemUsado.id] || 0;

    if (qtdNoInventario <= 0) {
        return mostrarAviso('Sem Estoque!', `Você precisa de ${itemUsado.nome}.`);
    }

    // Consome
    jogo.itens[itemUsado.id]--;

    // Calcula Tempo (SEM PENALIDADE MANUAL)
    let tempoFinal = dadosDoenca.tempoBase / itemUsado.fatorCura;
    
    // Aplica a redução da Medicina (Multiplica pelo fator, ex: * 0.7)
    if (statsEnfermeiro.value) {
        tempoFinal = tempoFinal * statsEnfermeiro.value.fatorMultiplicador;
    }

    const pacienteNoLeito = { ...paciente };
    pacienteNoLeito.tempoTotal = tempoFinal;
    pacienteNoLeito.tempoAtual = 0;
    
    // Atualiza direto no estado global
    jogo.leitos[indexLeito].ocupado = pacienteNoLeito;
    
    // Remove da fila global (precisa achar o index correto pelo ID)
    const idx = jogo.filaDeEspera.findIndex(p => p.id === paciente.id);
    if (idx !== -1) jogo.filaDeEspera.splice(idx, 1);
};

// Alternar Modo
const toggleAutomatico = () => {
    jogo.modoAutomaticoEnfermaria = !jogo.modoAutomaticoEnfermaria;
};

// Helper para cor da barra
const corBarra = (p) => {
    if (p.tipo === 'especial') return '#f1c40f'; // Amarelo (VIP)
    return '#e74c3c'; // Vermelho (Tropa)
};
</script>

<template>
    <div class="mythic-container">
        
        <div class="header-titulo-aba">
            <div class="titulo-nivel">
                <h2>🔪 Enfermaria</h2>
            </div>
            <div class="info-nivel">
                <span class="badge-nivel">Nível {{ jogo.enfermaria }}</span>
            </div>
        </div>
        
        <div class="abas-taverna">
            <button :class="{ ativo: abaAtual === 'tratamento' }" @click="abaAtual = 'tratamento'">Tratamento</button>
            
            <button 
                :class="{ 'ativo': abaAtual === 'bercario', 'bloqueado': !enfermeiroAtivo }" 
                @click="abaAtual = 'bercario'"
                :disabled="!enfermeiroAtivo"
                :title="!enfermeiroAtivo ? 'Requer um Enfermeiro contratado (O Ajudante não sabe aprimorar itens)' : ''">
                BERÇARIO <span v-if="!enfermeiroAtivo" style="margin-left:5px; font-size: 0.9em;">🔒</span>
            </button>
        </div>

        <div v-if="abaAtual === 'tratamento'">
            <div class="painel-auto-switch">
                <div class="info-switch">
                    <span class="titulo-auto">Modo Automático</span>
                    <span class="sub-auto" v-if="jogo.modoAutomaticoEnfermaria">Penalidade: +50% tempo de cura</span>
                    <span class="sub-auto" v-else>Inativo (Ativa após 30min ocioso)</span>
                </div>
                
                <button 
                    class="btn-toggle-auto" 
                    :class="{ 'ligado': jogo.modoAutomaticoEnfermaria }"
                    @click="toggleAutomatico">
                    {{ jogo.modoAutomaticoEnfermaria ? 'ON' : 'OFF' }}
                </button>
            </div>
            <div class="painel-controle-global">
<!-- INICIO DO CARD FUNCIONARIO CONTRATADO-->
            <div v-if="enfermeiroAtivo" class="card-funcionario funcionario-ativo" :style="{ borderColor: corTier(enfermeiroAtivo.tier) }">
                
                <div class="card-topo" :style="{ backgroundColor: corTier(enfermeiroAtivo.tier) }">
                    <div class="topo-esquerda">
                        <span class="tier-badge">{{ enfermeiroAtivo.tier }}</span>
                        <span class="card-nome">{{ enfermeiroAtivo.nome }}</span>
                    </div>
                    
                    <div class="molde-icone-prof">
                        <img src="/assets/ui/i_enfermeiro.png" class="img-prof-inner" title="Enfermeiro">
                    </div>
                </div>

                <div class="card-mid">
                    <div class="avatar-box">
                         <img :src="`/assets/faces/${enfermeiroAtivo.raca}/${enfermeiroAtivo.imagem}.png`" class="avatar-func">
                    </div>

                    <div class="tabela-dados-func">
                        <div class="linha-dado">
                            <span class="dado-label">Profissão:</span>
                            <span class="dado-valor">{{ nomeProfissao(enfermeiroAtivo) }}</span>
                        </div>
                        <div class="linha-dado">
                            <span class="dado-label">Raça:</span>
                            <span class="dado-valor capitalize">{{ enfermeiroAtivo.raca }}</span>
                        </div>
                        <div class="linha-dado">
                            <span class="dado-label">Sexo:</span>
                            <span class="dado-valor">{{ enfermeiroAtivo.sexo === 'masculino' ? 'Masculino' : 'Feminino' }}</span>
                        </div>
                        <div class="linha-dado">
                            <span class="dado-label">Salário:</span>
                            <span class="dado-valor">
                                {{ formatarNumero(enfermeiroAtivo.salario) }} 
                                <img src="/assets/ui/icone_goldC.png" class="tiny-coin">
                            </span>
                        </div>
                    </div>
                </div>

                <div class="rodape-card">
                    <div class="info-produtividade">
                        Redução de Tempo: <span class="verde">{{ statsEnfermeiro.textoDisplay }}</span>
                    </div>
                    <div class="frase-efeito">
                        "{{ enfermeiroAtivo.frase || 'Curarei os Feridos!' }}"
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
                        <img src="/assets/ui/i_enfermeiro.png" class="img-prof-inner" title="Enfermeiro Interino" style="filter: grayscale(1);">
                    </div>
                </div>

                <div class="card-mid">
                    <div class="avatar-box">
                         <img src="/assets/faces/humano/enfermeiro_m.png" class="avatar-func" style="filter: sepia(0.4);">
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
                    <div class="titulo-info-cura">
                    </div>

                    <div class="grid-loadout-compacto">
                        <div v-for="slot in slotsVisiveis" :key="slot.key" class="slot-medico-mini">
                            
                            <span class="nome-cat-mini">{{ slot.info.nome }}</span>

                            <div class="wrapper-botoes">
                                
                                <button class="btn-icone-mini" @click="verInfoCategoria(slot)" :title="slot.itemAtual.nome">
                                    <div class="emoji-mini">{{ slot.itemAtual.icon }}</div>
                                    
                                    <div class="barra-qtd" :class="{'zerado': (jogo.itens[slot.itemAtual.id] || 0) === 0}">
                                        {{ jogo.itens[slot.itemAtual.id] || 0 }}
                                    </div>
                                </button>

                                <button class="btn-gear-lateral" @click="abrirTroca(slot.key)" title="Trocar Item">
                                    ⚙️
                                </button>
                            </div>

                        </div>
                    </div>

                    <div v-if="modalTrocaAberto" class="overlay-selecao" @click.self="modalTrocaAberto = false">
                        <div class="box-selecao">
                            <h4>Escolher Equipamento</h4>
                            <div class="lista-opcoes">
                                <button 
                                    v-for="opcao in opcoesParaTroca" 
                                    :key="opcao.id" 
                                    class="btn-opcao-item"
                                    :class="{'ativo': loadout[opcao.categoria] === opcao.id}"
                                    @click="selecionarItem(opcao)">
                                    
                                    <span class="icon-opt">{{ opcao.icon }}</span>
                                    <div class="dados-opt">
                                        <span class="nome-opt">{{ opcao.nome }}</span>
                                        <small class="desc-opt">Velocidade: {{ opcao.fatorCura }}x | Estoque: {{ jogo.itens[opcao.id] || 0 }}</small>
                                    </div>
                                    
                                    <span v-if="loadout[opcao.categoria] === opcao.id" class="check">✅</span>
                                </button>
                            </div>
                            <button class="btn-fechar-sel" @click="modalTrocaAberto = false">Fechar</button>
                        </div>
                    </div>
                </div>

            </div>
            <div class="area-leitos">
            <h3>🏥 Leitos de Recuperação ({{ leitos.filter(l => l.ocupado).length }} / 3)</h3>
            
            <div class="grid-leitos">
                <div v-for="(leito, index) in leitos" :key="index" class="box-leito">
                    
                    <div class="leito-numero">#{{ index + 1 }}</div>

                    <div v-if="leito.ocupado" class="modo-cura-magica">
                        
                        <div class="runa-rotativa"></div>

                        <div class="avatar-wrapper">
                             <img :src="leito.ocupado.icone" class="img-avatar-padrao">
                        </div>

                        <div class="aura-cura"></div>

                        <div class="ui-cura">
                            <span class="badge-qtd" v-if="leito.ocupado.qtd > 1">x{{ leito.ocupado.qtd }}</span>
                            
                            <div class="barra-vida-magic">
                                <div class="fill-magic" 
                                     :style="{ width: (leito.ocupado.tempoAtual / leito.ocupado.tempoTotal * 100) + '%' }">
                                </div>
                            </div>
                            <span class="timer-texto">{{ formatarTempo(leito.ocupado.tempoTotal - leito.ocupado.tempoAtual) }}</span>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        <div class="area-fila">
            <h3>📋 Triagem (Clique para internar)</h3>
            
            <div class="lista-cards-fila">
                <div v-for="paciente in filaDeEspera" :key="paciente.id" 
                     class="card-fila" 
                     @click="alocarPaciente(paciente, leitos.findIndex(l => !l.ocupado))">
                    
                    <div class="card-fila-esquerda">
                        <img :src="paciente.icone" class="img-fila-icone">
                        
                        <div class="dados-fila">
                            <span class="nome-fila">{{ paciente.nome }}</span>
                            <span class="badge-qtd" :class="paciente.tipo">x{{ paciente.qtd }}</span>
                        </div>
                    </div>
                    
                    <div class="card-fila-direita">
                        <span class="tempo-estimado">⏱️ {{ formatarTempo(paciente.tempoTotal) }}</span>
                        <small>Toque para curar</small>
                    </div>
                </div>

                <div v-if="filaDeEspera.length === 0" class="aviso-sem-feridos">
                    Nenhum ferido na fila. Bom trabalho!
                </div>
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

/* Estilos da Tabela de Cura */
.titulo-info-cura {
    width: 100%;
    text-align: center;
    font-weight: bold;
    color: #7f8c8d;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 5px;
    margin-bottom: 8px;
    display: flex; flex-direction: column;
}

.tabela-cura { width: 80%; display: flex; flex-direction: column; gap: 4px; margin-left: 15px; }

.linha-cura {
    display: flex; justify-content: space-between;
    background: #fff;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 0.85em;
    border: 1px solid #f1f2f6;
}
.nome-ferimento { font-weight: 600; color: #2c3e50; }
.tempo-ferimento { color: #7f8c8d; }
.abas-taverna button.bloqueado {
    opacity: 0.6;
    cursor: not-allowed;
    background: #95a5a6;
    color: #ecf0f1;
    border-color: #7f8c8d;
    box-shadow: none;
}

.grid-leitos {
    display: grid;
    /* Isso aqui é a mágica: cria colunas automáticas de no mínimo 100px */
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
    padding: 10px;
    background: #bdc3c7; /* Cor do chão da enfermaria */
    border-radius: 8px;
    border: 4px solid #7f8c8d; /* Paredes de pedra */
}

/* O BOX DA CAMA INDIVIDUAL */
.box-leito {
    position: relative;
    background-image: url('/assets/ui/cama_vazia.png');
    background-size: cover;
    background-position: center;
    height: 140px;
    border-radius: 8px;
    border: 2px solid #57606f;
    box-shadow: inset 0 0 15px #000; /* Sombra interna para profundidade */
    overflow: hidden;
}
.leito-numero {
    position: absolute; top: 5px; left: 8px;
    font-size: 0.7em; color: rgba(255,255,255,0.4);
    z-index: 10;
}

/* --- MODO CURA MÁGICA (ESTADO OCUPADO) --- */
.modo-cura-magica {
    width: 100%; height: 100%;
    position: relative;
    display: flex; justify-content: center; align-items: center;
    background: rgba(0, 0, 0, 0.4); /* Escurece o fundo para destacar a magia */
    backdrop-filter: blur(1px); /* Leve desfoque no fundo */
}
/* 1. Runa Rotativa (Círculo Mágico) */
.runa-rotativa {
    position: absolute;
    width: 90px; height: 90px;
    border: 2px dashed rgba(100, 255, 218, 0.4); /* Verde Água Mágico */
    border-radius: 50%;
    animation: girar 8s linear infinite;
    z-index: 1;
}
.runa-rotativa::after {
    content: ''; position: absolute;
    top: 10px; left: 10px; right: 10px; bottom: 10px;
    border: 1px solid rgba(100, 255, 218, 0.6);
    border-radius: 50%;
}

/* 2. Avatar Flutuante */
.avatar-wrapper {
    z-index: 2;
    animation: flutuar 3s ease-in-out infinite;
}
.img-avatar-padrao {
    width: 60px; height: 60px; object-fit: contain;
    filter: drop-shadow(0 0 10px rgba(100, 255, 218, 0.6)); /* Brilho em volta do boneco */
}

/* 3. Aura (Brilho Geral) */
.aura-cura {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(circle, rgba(100,255,218,0.2) 0%, rgba(0,0,0,0) 70%);
    z-index: 2;
    pointer-events: none;
}

/* 4. Interface Unificada */
.ui-cura {
    position: absolute; bottom: 10px; width: 100%;
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    z-index: 5;
}
.badge-qtd {
    background: #2c3e50; color: #fff; font-size: 0.7em;
    padding: 1px 6px; border-radius: 10px; font-weight: bold;
    border: 1px solid #64ffda;
}

.barra-vida-magic {
    width: 60%; height: 4px;
    background: rgba(0,0,0,0.5);
    border-radius: 2px;
    overflow: hidden;
}
.fill-magic {
    height: 100%;
    background: #64ffda; /* Verde Neon Mágico */
    box-shadow: 0 0 5px #64ffda;
    transition: width 0.1s linear;
}

.timer-texto {
    font-size: 0.6em; color: #64ffda; font-weight: bold;
    text-shadow: 0 1px 2px #000;
}

/* Estilo da imagem na lista de espera */
.img-fila-icone {
    width: 40px;
    height: 40px;
    object-fit: contain;
    background: rgba(0,0,0,0.05);
    border-radius: 4px;
    padding: 2px;
}
/* --- ESTANTE DE MEDICAMENTOS --- */
.grid-medicamentos {
    display: flex;
    flex-wrap: wrap; /* Permite quebrar linha se tiver muitos itens */
    gap: 8px;        /* Espaço entre os botões */
    padding: 10px;
    width: 100%;
}

.btn-item-medico {
    position: relative;
    width: 50px;     /* Tamanho fixo pequeno */
    height: 50px;    /* Quadrado perfeito */
    background: #ffffff;
    border: 1px solid #bdc3c7;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 3px rgba(0,0,0,0.1);
}

.btn-item-medico:hover {
    transform: translateY(-2px);
    border-color: #3498db;
    box-shadow: 0 4px 6px rgba(52, 152, 219, 0.3);
}

.btn-item-medico:active {
    transform: scale(0.95);
}
.btn-item-medico.bloqueado {
    opacity: 0.5;
    filter: grayscale(1);
    cursor: not-allowed;
    background: #ecf0f1;
}

.icone-grande {
    font-size: 1.6em; /* Tamanho do emoji/ícone */
    line-height: 1;
}

.nome-mini {
    font-size: 0.65em;
    color: #7f8c8d;
    font-weight: bold;
    text-align: center;
    line-height: 1;
}

/* Badge Flutuante (Contador) */
.badge-qtd-item {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #2c3e50;
    color: #fff;
    font-size: 0.65em;
    font-weight: bold;
    min-width: 18px; /* Garante bolinha redonda mesmo com 1 dígito */
    height: 18px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
    z-index: 2;
}
/* --- LOADOUT MÉDICO --- */
.lista-slots-loadout {
    display: flex;
    flex-direction: column; /* Lista vertical */
    gap: 10px;
    padding: 10px;
    width: 100%;
}

.card-slot-medico {
    background: #fff;
    border: 1px solid #bdc3c7;
    border-radius: 8px;
    padding: 5px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-shadow: 0 2px 3px rgba(0,0,0,0.05);
}

.topo-slot {
    font-size: 0.7em; font-weight: bold; color: #7f8c8d; text-transform: uppercase;
    border-bottom: 1px solid #f1f2f6; margin-bottom: 4px;
}

.miolo-slot {
    display: flex; justify-content: space-between; align-items: center;
}

/* Botão do Ícone Grande */
.btn-icone-ativo {
    background: #f1f2f6; border: 1px solid #dfe6e9; border-radius: 6px;
    width: 45px; height: 45px; position: relative; cursor: pointer;
}
.emoji-ativo { font-size: 1.5em; }
.badge-qtd.zerado { background: #e74c3c; } /* Fica vermelho se tiver 0 */

/* Botão de Troca (Engrenagem) */
.btn-trocar {
    background: #ecf0f1; border: 1px solid #bdc3c7; border-radius: 4px;
    width: 30px; height: 30px; cursor: pointer; font-size: 1.2em;
    display: flex; align-items: center; justify-content: center;
}
.btn-trocar:hover { background: #bdc3c7; }

.nome-item-atual { font-size: 0.7em; color: #2c3e50; font-weight: bold; margin-top: 2px;}

/* --- MENU DE SELEÇÃO (OVERLAY) --- */
.overlay-selecao {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 50;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(2px); border-radius: 8px;
}
.box-selecao {
    background: #fff; width: 90%; max-height: 90%;
    border-radius: 8px; padding: 10px;
    display: flex; flex-direction: column; gap: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3); overflow-y: auto;
}

.box-selecao h4 { margin: 0; text-align: center; color: #2c3e50; font-size: 0.9em;}

.btn-opcao-item {
    display: flex; align-items: center; gap: 10px;
    background: #f8f9fa; border: 1px solid #dfe6e9;
    padding: 8px; border-radius: 6px; cursor: pointer; text-align: left;
}
.btn-opcao-item:hover { background: #ecf0f1; }
.btn-opcao-item.ativo { border: 2px solid #27ae60; background: #eafaf1; }

.icon-opt { font-size: 1.5em; }
.dados-opt { flex: 1; display: flex; flex-direction: column; }
.nome-opt { font-weight: bold; font-size: 0.85em; color: #2c3e50; }
.desc-opt { font-size: 0.7em; color: #7f8c8d; }
.check { font-size: 1.2em; }
.btn-fechar-sel {
    background: #e74c3c; color: white; border: none; padding: 8px;
    border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.8em;
}

/* --- LOADOUT COMPACTO (Grade 4x2) --- */
.grid-loadout-compacto {
    display: grid;
    grid-template-columns: repeat(4, 1fr); 
    gap: 8px 4px; /* Espaçamento entre os itens */
    padding: 5px 0 0 10px;
    width: 100%;
}

.slot-medico-mini {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

/* 1. Nome da Categoria */
.nome-cat-mini {
    font-size: 0.55em;
    color: #7f8c8d;
    font-weight: 800;
    text-transform: uppercase;
    text-align: center;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
}

/* Container para alinhar Ícone e Engrenagem lado a lado */
.wrapper-botoes {
    display: flex;
    align-items: center;
    justify-content: center;
    /* Sombra unificada para parecer uma peça só */
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
}

/* 2. Botão Ícone (Esquerda) */
.btn-icone-mini {
    position: relative;
    width: 38px;
    height: 38px;
    background: #ffffff;
    /* Bordas arredondadas apenas na esquerda */
    border: 1px solid #bdc3c7;
    border-radius: 6px 0 0 6px;
    border-right: none; 
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    z-index: 1;
    overflow: hidden; /* <--- IMPORTANTE: Para cortar a barra nas bordas arredondadas */
}
.btn-icone-mini:hover { background: #fdfdfd; }
.btn-icone-mini:active { transform: scale(0.95); }

.emoji-mini { font-size: 1.4em; line-height: 1; }

/* 3. Botão Engrenagem (Lateral Direita) */
.btn-gear-lateral {
    width: 18px; /* Estreito */
    height: 38px; /* Mesma altura do ícone */
    background: #ecf0f1;
    /* Bordas arredondadas apenas na direita */
    border: 1px solid #bdc3c7;
    border-radius: 0 6px 6px 0;
    cursor: pointer;
    font-size: 0.7em;
    display: flex; align-items: center; justify-content: center;
    color: #95a5a6;
    transition: all 0.2s;
}
.btn-gear-lateral:hover {
    background: #bdc3c7;
    color: #fff;
    width: 22px; /* Efeito visual: cresce um pouquinho no hover */
}

/* Nova Barra de Quantidade Inferior */
.barra-qtd {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    
    /* Fundo escuro semi-transparente */
    background: rgba(0, 0, 0, 0.65); 
    color: #fff;
    
    font-size: 0.6em;
    font-weight: bold;
    text-align: center;
    line-height: 1;
    padding: 3px 0; /* Altura suficiente apenas para o número */
    z-index: 5;
}

/* Se estiver zerado, fundo vermelho semi-transparente para alertar */
.barra-qtd.zerado { 
    background: rgba(231, 76, 60, 0.85); 
}
.painel-auto-switch {
    display: flex; justify-content: space-between; align-items: center;
    background: #2c3e50; color: #ecf0f1;
    padding: 10px 15px; border-radius: 8px;
    margin-bottom: 10px; border: 2px solid #34495e;
}
.info-switch { display: flex; flex-direction: column; }
.titulo-auto { font-weight: bold; font-size: 1em; color: #64ffda; } /* Verde neon */
.sub-auto { font-size: 0.75em; color: #bdc3c7; }

.btn-toggle-auto {
    width: 60px; height: 30px;
    border-radius: 20px; border: none; font-weight: bold;
    background: #e74c3c; color: #fff; cursor: pointer;
    transition: all 0.3s; box-shadow: inset 0 2px 5px rgba(0,0,0,0.2);
}
.btn-toggle-auto.ligado {
    background: #2ecc71; box-shadow: 0 0 10px #2ecc71;
}

/* Ajuste Mobile para ficar 1 coluna se for muito pequeno */
@media(max-width: 400px) {
    .grid-medicamentos { grid-template-columns: 1fr; }
}
/* --- ANIMAÇÕES --- */
@keyframes girar {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes flutuar {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
}
</style>