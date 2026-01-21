<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Definição das Props para tornar o Layout dinâmico
const props = defineProps({
    titulo: {
        type: String,
        default: '📘 Biblioteca Arcana'
    },
    nivel: {
        type: Number,
        default: 0
    },
    // Array de objetos para abas: [{ key: 'geral', label: 'Geral' }, ...]
    abas: {
        type: Array,
        default: () => []
    },
    // Aba atualmente selecionada (para o v-model)
    abaAtual: {
        type: String,
        default: ''
    }
});

// Emits para atualizar a aba selecionada no pai
const emit = defineEmits(['update:abaAtual']);

// --- LÓGICA DE SCROLL (Do seu arquivo original) ---
const mostrarBotaoTopo = ref(false);

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
</script>

<template>
    <div class="mythic-container">
        
        <div class="header-titulo-aba">
            <div class="titulo-nivel">
                <h2><slot name="icone"></slot> {{ titulo }}</h2>
            </div>
            <div class="info-nivel" v-if="nivel > 0">
                <span class="badge-nivel">Nível {{ nivel }}</span>
            </div>
        </div>

        <div class="abas-taverna" v-if="abas && abas.length > 0">
            <button 
                v-for="aba in abas" 
                :key="aba.key"
                :class="{ ativo: abaAtual === aba.key }" 
                @click="emit('update:abaAtual', aba.key)"
            >
                {{ aba.label }}
            </button>
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


        <slot name="modais"></slot>
    </div>
</template>

<style scoped>
    /* Importa apenas os estilos estruturais globais */
    @import '../css/importantes.css';

    /* Pequeno ajuste apenas para garantir que o slot ocupe espaço */
</style>