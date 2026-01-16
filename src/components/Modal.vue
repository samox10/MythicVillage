<script setup>
import { ui } from '../jogo.js';

const fechar = () => {
    ui.modal.aberto = false;
    ui.modal.onConfirm = null;
};

const confirmar = () => {
    if (ui.modal.onConfirm) {
        ui.modal.onConfirm(); 
    }
    fechar();
};
</script>

<template>
    <div v-if="ui.modal.aberto" class="modal-overlay" @click.self="fechar">
        <div class="modal-box">
            <div class="modal-header" :class="ui.modal.tipo">
                <h3>{{ ui.modal.titulo }}</h3>
            </div>
            
            <div class="modal-body">
                <p style="white-space: pre-line;">{{ ui.modal.texto }}</p>
            </div>

            <div class="modal-actions">
                <button 
                    v-if="ui.modal.tipo === 'confirmacao'" 
                    class="btn-cancel" 
                    @click="fechar"
                >
                    ✖ Cancelar
                </button>
                
                <button class="btn-confirm" @click="confirmar">
                    {{ ui.modal.tipo === 'confirmacao' ? '✅ Confirmar' : '👌 Entendi' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; backdrop-filter: blur(2px);
}

.modal-box {
    background: white; width: 90%; max-width: 400px;
    border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    overflow: hidden; animation: popIn 0.2s ease-out;
}

@keyframes popIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

.modal-header { padding: 15px; text-align: center; color: white; }
.modal-header h3 { margin: 0; }

/* Cores do cabeçalho baseadas no tipo */
.modal-header.confirmacao { background: #2c3e50; border-bottom: 3px solid #f1c40f; }
.modal-header.aviso { background: #c0392b; border-bottom: 3px solid #e74c3c; } /* Vermelho para erros/avisos */
.modal-header.sucesso { background: #27ae60; border-bottom: 3px solid #2ecc71; } /* Verde para infos positivas */

.modal-body { padding: 20px; text-align: center; color: #333; font-size: 1.1em; line-height: 1.5; }

.modal-actions {
    padding: 15px; background: #f9f9f9; display: flex; justify-content: center; gap: 15px; border-top: 1px solid #eee;
}

button { padding: 10px 20px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: transform 0.1s; }
button:active { transform: scale(0.95); }

.btn-confirm { background: #27ae60; color: white; box-shadow: 0 3px 0 #219150; }
.btn-cancel { background: #95a5a6; color: white; box-shadow: 0 3px 0 #7f8c8d; }
</style>