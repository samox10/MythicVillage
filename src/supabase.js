import { createClient } from '@supabase/supabase-js'

// SUBSTITUA PELOS DADOS QUE VOCÊ PEGOU NO PASSO 1 (EM PROJECT SETTINGS -> API)
const supabaseUrl = 'https://sxbzyxnzzzluibpudyda.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4Ynp5eG56enpsdWlicHVkeWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODUyMzYsImV4cCI6MjA4NTQ2MTIzNn0.sKfXIyThKOIfzbJmGJHG1nqYYSFPMKltIBTDVHXvCnE'

export const supabase = createClient(supabaseUrl, supabaseKey)

// --- FUNÇÕES DE SEGURANÇA (SESSÃO ÚNICA) ---

// 1. Gera um código aleatório (Crachá novo)
export function gerarIdSessao() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 2. Salva o crachá no banco de dados assim que entra
export async function registrarSessao(tabela, userId, sessionId) {
  const { error } = await supabase
    .from(tabela) // Nome da sua tabela (ex: 'profiles')
    .update({ session_id: sessionId })
    .eq('id', userId); // Assume que a coluna de ID do usuário se chama 'id'

  if (error) console.error('Erro ao registrar sessão:', error);
}

// 3. Fica vigiando se o crachá mudou no banco
export function vigiarSessao(tabela, userId, meuSessionId, funcaoDeExpulsar) {
  const canal = supabase
    .channel('vigia-sessao')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: tabela, filter: `id=eq.${userId}` },
      (payload) => {
        // Se o session_id novo for diferente do meu, significa que outra pessoa entrou!
        const novoIdNoBanco = payload.new.session_id;
        if (novoIdNoBanco && novoIdNoBanco !== meuSessionId) {
          funcaoDeExpulsar(); // Chuta o jogador pra fora
        }
      }
    )
    .subscribe();

  return canal; // Retorna o canal para podermos desligar depois se precisar
}