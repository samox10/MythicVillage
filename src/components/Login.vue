<template>
  <div class="login-container">
    <div class="box-login">
      <h2>🏰 Portões de Mythic Village</h2>
      <p>Identifique-se para acessar suas terras.</p>
      
      <div class="campo">
        <label>E-mail</label>
        <input type="email" v-model="email" placeholder="lorde@exemplo.com">
      </div>

      <div class="campo">
        <label>Senha</label>
        <input type="password" v-model="senha" placeholder="******">
      </div>

      <div class="botoes">
        <button @click="entrar" class="btn-entrar">Entrar (Carregar)</button>
        <button @click="criarConta" class="btn-criar">Criar Nova Conta</button>
      </div>

      <p v-if="erro" class="msg-erro">{{ erro }}</p>
      <p v-if="msg" class="msg-sucesso">{{ msg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '../supabase'; // Importamos nosso carteiro

const email = ref('');
const senha = ref('');
const erro = ref('');
const msg = ref('');

// Definimos um "aviso" para o App.vue saber quando logamos
const emit = defineEmits(['aoLogar']);

async function criarConta() {
  erro.value = ''; msg.value = '';
  // Pede ao Supabase para criar usuário
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: senha.value,
  });

  if (error) {
    erro.value = "Erro ao criar: " + error.message;
  } else {
    msg.value = "Conta criada! Agora clique em Entrar.";
  }
}

async function entrar() {
  erro.value = ''; msg.value = '';
  // Pede ao Supabase para logar
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: senha.value,
  });

  if (error) {
    erro.value = "Erro: " + error.message;
  } else {
    // SUCESSO! O data.user contém o ID único desse jogador
    // Avisamos o componente pai (App.vue) que deu certo
    emit('aoLogar', data.user.id);
  }
}
</script>

<style scoped>
.login-container {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: #1a1a1a; display: flex; justify-content: center; align-items: center; z-index: 9999;
}
.box-login {
  background: #2c3e50; padding: 2rem; border-radius: 10px; border: 2px solid #f1c40f;
  text-align: center; color: white; width: 300px;
}
.campo { margin-bottom: 1rem; text-align: left; }
.campo label { display: block; margin-bottom: 0.5rem; color: #ccc; }
.campo input { width: 100%; padding: 0.5rem; border-radius: 5px; border: none; }
.botoes { display: flex; gap: 10px; flex-direction: column; }
button { padding: 10px; cursor: pointer; font-weight: bold; border: none; border-radius: 5px; }
.btn-entrar { background: #27ae60; color: white; }
.btn-criar { background: #e67e22; color: white; }
.msg-erro { color: #e74c3c; margin-top: 10px; }
.msg-sucesso { color: #2ecc71; margin-top: 10px; }
</style>