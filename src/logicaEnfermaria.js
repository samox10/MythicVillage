import { jogo, obterBuffRaca, mostrarAviso, salvarNaNuvem } from './jogo.js';
import { tiposFerimentos, catalogoMedicamentos } from './dados.js';

// Constante de tempo para ativar o automático (30 minutos)
export const TEMPO_AFK_ENFERMARIA = 1800;

// --- 1. LÓGICA ONLINE (Roda enquanto joga) ---
export function processarLogicaEnfermaria(deltaSegundos) {
    // A. Processar Cura nos Leitos (Tic Tac do tempo)
    jogo.leitos.forEach(leito => {
        if (leito.ocupado) {
            leito.ocupado.tempoAtual += deltaSegundos;
            
            // QUANDO O TEMPO ACABA:
            if (leito.ocupado.tempoAtual >= leito.ocupado.tempoTotal) {
                // Alta médica para funcionários
                if (leito.ocupado.funcionarioId) {
                    const funcionario = jogo.funcionarios.find(f => f.id === leito.ocupado.funcionarioId);
                    if (funcionario) {
                        funcionario.status = null; // Limpa o status 'doente'
                    }
                }
                // Libera o leito
                leito.ocupado = null;
                salvarNaNuvem();
            }
        }
    });

    // B. Verificar inatividade para ligar automático
    const leitosLivres = jogo.leitos.filter(l => !l.ocupado);
    
    // Se todos os leitos estão vazios E tem gente na fila
    if (leitosLivres.length === jogo.leitos.length && jogo.filaDeEspera.length > 0) {
        jogo.tempoSemPaciente += deltaSegundos;
        
        if (jogo.tempoSemPaciente >= TEMPO_AFK_ENFERMARIA && !jogo.modoAutomaticoEnfermaria) {
            jogo.modoAutomaticoEnfermaria = true;
            mostrarAviso("Automação Ativada", "A enfermaria ficou ociosa por 30min e ativou o modo automático.", "aviso");
        }
    } else {
        jogo.tempoSemPaciente = 0;
    }

    // C. Regra: Se a fila acabar, desliga o automático (Economia)
    if (jogo.modoAutomaticoEnfermaria && jogo.filaDeEspera.length === 0) {
        jogo.modoAutomaticoEnfermaria = false;
        jogo.tempoSemPaciente = 0; 
        console.log("🏥 Enfermaria: Fila vazia! Modo automático desligado.");
    }

    // D. O Grande Loop do Modo Automático (Cura Automática)
    if (jogo.modoAutomaticoEnfermaria && leitosLivres.length > 0 && jogo.filaDeEspera.length > 0) {
        
        const alquimista = jogo.funcionarios.find(f => f.profissao === 'alquimista' && f.diasEmGreve === 0);
        
        leitosLivres.forEach(leito => {
            if (jogo.filaDeEspera.length === 0) return;

            let pacienteIndex = -1;
            let itemUsado = null;
            let dadosDoenca = null;

            // Procura paciente tratável
            for (let i = 0; i < jogo.filaDeEspera.length; i++) {
                const p = jogo.filaDeEspera[i];
                dadosDoenca = tiposFerimentos[p.doenca || 'corte_leve'];
                
                if (!dadosDoenca) {
                    jogo.filaDeEspera.splice(i, 1); i--; continue;
                }

                const idItemConfig = jogo.loadoutEnfermaria[dadosDoenca.reqCategoria];
                const itemDados = catalogoMedicamentos.find(it => it.id === idItemConfig);
                
                if (itemDados && (jogo.itens[itemDados.id] || 0) > 0) {
                    pacienteIndex = i;
                    itemUsado = itemDados;
                    break;
                }
            }

            // Aplica a cura
            if (pacienteIndex !== -1 && itemUsado) {
                const paciente = jogo.filaDeEspera[pacienteIndex];
                jogo.itens[itemUsado.id]--;

                let tempoFinal = dadosDoenca.tempoBase / itemUsado.fatorCura;
                
                if (alquimista) {
                    const buffPct = obterBuffRaca(alquimista); 
                    const fatorRaca = 1 + (buffPct / 100);
                    const medicinaTotal = (alquimista.poderEspecial || 0) * fatorRaca;
                    const porcentagemReducao = Math.min(90, medicinaTotal);
                    tempoFinal = tempoFinal * (1 - (porcentagemReducao / 100));
                }

                tempoFinal = tempoFinal * 1.10; // Penalidade Auto

                leito.ocupado = { ...paciente, tempoTotal: tempoFinal, tempoAtual: 0 };
                jogo.filaDeEspera.splice(pacienteIndex, 1);
                salvarNaNuvem();
            } else {
                jogo.modoAutomaticoEnfermaria = false;
                jogo.tempoSemPaciente = 0;
                mostrarAviso("Sem Estoque", "Modo Automático pausado: Faltam medicamentos.");
            }
        });
    }
}

// --- 2. LÓGICA OFFLINE (Simulação ao voltar) ---
export function simularEnfermariaOffline(segundosOffline) {
    if (segundosOffline <= 0) return;

    console.log(`[OFFLINE] 🏥 Iniciando simulação da Enfermaria (${segundosOffline.toFixed(1)}s)...`);

    let tempoRestante = segundosOffline;
    let pacientesCurados = 0;
    
    // Recupera o estado
    let modoAuto = jogo.modoAutomaticoEnfermaria;
    let timerInatividade = jogo.tempoSemPaciente || 0; 

    while (tempoRestante > 0) {
        const ocupados = jogo.leitos.filter(l => l.ocupado);
        const temFila = jogo.filaDeEspera.length > 0;
        const temVaga = jogo.leitos.some(l => !l.ocupado);
        const enfermariaTotalmenteVazia = (ocupados.length === 0);

        // Regra: Desliga se acabar fila
        if (modoAuto && !temFila) {
            modoAuto = false;
            timerInatividade = 0; 
        }

        // Lógica do Timer (Inatividade)
        let contandoInatividade = (!modoAuto && enfermariaTotalmenteVazia && temFila);

        if (contandoInatividade) {
            if (timerInatividade >= TEMPO_AFK_ENFERMARIA) {
                modoAuto = true;
                contandoInatividade = false;
            }
        }

        // Lógica de Cura (Auto Ligado)
        if (modoAuto && temVaga && temFila) {
             const leitosVazios = jogo.leitos.filter(l => !l.ocupado);
             const alquimista = jogo.funcionarios.find(f => f.profissao === 'alquimista' && f.diasEmGreve === 0);

             leitosVazios.forEach(leito => {
                if (jogo.filaDeEspera.length === 0) return;

                let pacienteIndex = -1;
                let itemUsado = null;

                for (let i = 0; i < jogo.filaDeEspera.length; i++) {
                    const p = jogo.filaDeEspera[i];
                    const dadosDoenca = tiposFerimentos[p.doenca];
                    if (!dadosDoenca) { jogo.filaDeEspera.splice(i, 1); i--; continue; }

                    const idItem = jogo.loadoutEnfermaria[dadosDoenca.reqCategoria];
                    const itemDados = catalogoMedicamentos.find(it => it.id === idItem);
                    
                    if (itemDados && (jogo.itens[itemDados.id] || 0) > 0) {
                        pacienteIndex = i; itemUsado = itemDados; break;
                    }
                }

                if (pacienteIndex !== -1 && itemUsado) {
                    const paciente = jogo.filaDeEspera[pacienteIndex];
                    const dadosDoenca = tiposFerimentos[paciente.doenca];
                    jogo.itens[itemUsado.id]--;

                    let tempoCura = dadosDoenca.tempoBase / itemUsado.fatorCura;
                    if (alquimista) {
                        const buffPct = obterBuffRaca(alquimista); 
                        const medicinaTotal = (alquimista.poderEspecial || 0) * (1 + buffPct/100);
                        tempoCura = tempoCura * (1 - (Math.min(90, medicinaTotal) / 100));
                    }
                    tempoCura = tempoCura * 1.50; 
                    leito.ocupado = { ...paciente, tempoTotal: tempoCura, tempoAtual: 0 };
                    jogo.filaDeEspera.splice(pacienteIndex, 1);
                } else {
                    modoAuto = false; 
                }
             });
        }

        // Cálculo do Salto
        let proximoEvento = tempoRestante;
        if (ocupados.length > 0) {
            const tempoAteAlta = Math.min(...ocupados.map(l => l.ocupado.tempoTotal - l.ocupado.tempoAtual));
            if (tempoAteAlta < proximoEvento) proximoEvento = tempoAteAlta;
        }
        if (contandoInatividade) {
            const faltaParaAtivar = TEMPO_AFK_ENFERMARIA - timerInatividade;
            if (faltaParaAtivar > 0 && faltaParaAtivar < proximoEvento) {
                proximoEvento = faltaParaAtivar;
            }
        }
        if (proximoEvento <= 0.01) proximoEvento = 0.1;

        // Aplica Salto
        tempoRestante -= proximoEvento;
        
        if (contandoInatividade) timerInatividade += proximoEvento;

        ocupados.forEach(leito => {
            leito.ocupado.tempoAtual += proximoEvento;
            if (leito.ocupado.tempoAtual >= leito.ocupado.tempoTotal - 0.01) {
                if (leito.ocupado.funcionarioId) {
                    const func = jogo.funcionarios.find(f => f.id === leito.ocupado.funcionarioId);
                    if (func) func.status = null;
                }
                leito.ocupado = null;
                pacientesCurados++;
            }
        });

        if (ocupados.length === 0 && !temFila && !contandoInatividade) tempoRestante = 0;
    }

    // Salva Estado Final
    jogo.modoAutomaticoEnfermaria = modoAuto; 
    jogo.tempoSemPaciente = timerInatividade;

    if (pacientesCurados > 0) {
        mostrarAviso("Relatório Médico Offline", `A enfermaria processou ${pacientesCurados} pacientes.`);
        salvarNaNuvem();
    }

}