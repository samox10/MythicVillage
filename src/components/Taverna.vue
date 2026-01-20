<script setup>
  import { ref, computed } from 'vue';
  import { jogo, acoes, ui, populacaoTotal, custoContratacao, bonusSorteTotal, limites, obterBuffRaca } from '../jogo.js';
  import { ORDEM_TIERS, DESBLOQUEIO_POR_NIVEL, obterProbabilidades } from '../funcionarios.js';
    
  // Função visual para mostrar o stat buffado no card
  const getStatReal = (func) => {
      const base = func.poderEspecial || func.poderGerencia || 0;
      const buff = obterBuffRaca(func); // Pega a % (ex: 10)
      
      if (buff <= 0) return base; // Se não tem buff, retorna normal
      
      // Aplica o aumento (ex: 8% * 1.10 = 8.8%)
      const final = base * (1 + (buff / 100));
      
      // Formatação bonita: se for inteiro, sem casas. Se for quebrado (bancário), 2 casas.
      return Number.isInteger(base) ? Math.floor(final) : parseFloat(final.toFixed(2));
  };
  const tooltipAberto = ref(null); // Guarda o ID de qual balão está visível agora
  // --- FUNÇÃO PARA MOSTRAR DETALHES AO CLICAR ---
  // Alterna: se clicar no mesmo, fecha. Se for outro, abre.
  const toggleTooltip = (idUnico) => {
      if (tooltipAberto.value === idUnico) {
          tooltipAberto.value = null; // Fecha
      } else {
          tooltipAberto.value = idUnico; // Abre este
      }
  };
  // --- CONTROLE DE VISIBILIDADE DAS SEÇÕES ---
  const secoesAbertas = ref({
      elite: true,       // Começa aberto
      aventureiros: true, // Começa aberto
      comuns: true       // Começa aberto
  });

  const alternarSecao = (chave) => {
      secoesAbertas.value[chave] = !secoesAbertas.value[chave];
  };

  // Calcula os números apenas para mostrar no texto (Sem abrir modal)
  const getInfoTooltip = (func, tipo = 'padrao', chaveCmd = null, valorCmd = null) => {
      const buffPct = obterBuffRaca(func);
      if (buffPct <= 0) return null; // Sem buff, não tem detalhe

      let original = 0;
      let final = 0;

      if (tipo === 'comandante') {
          original = valorCmd;
          final = Math.floor(original * (1 + (buffPct / 100)));
      } else if (tipo === 'producao') {
          // O bônus salvo é 1.10, mas mostramos 10.
          original = Math.floor((func.bonus - 1) * 100);
          final = Math.floor(((func.bonus * (1 + (buffPct / 100))) - 1) * 100);
      } else {
          // Especiais
          original = func.poderEspecial || func.poderGerencia || 0;
          final = getStatReal(func);
      }

      let ganho = final - original;
      // Arredonda para ficar bonito (evita 0.80000004)
      if (!Number.isInteger(ganho)) ganho = parseFloat(ganho.toFixed(2));
      
      return { original, ganho };
  };
  const idiomaAtual = 'pt-BR'; // Se mudar para 'en-US', os pontos viram vírgulas
  const formatarNumero = (valor) => {
      if (!valor) return '0';
      // Agora ele usa a variável em vez do texto fixo
      return valor.toLocaleString(idiomaAtual);
  };
  const dadosFusaoPreview = ref(null);
  const abaAtual = ref('contratar'); 
  const ordemAtual = ref('tier'); // Pode ser: 'tier', 'raca', 'profissao'
  const idsSelecionados = ref([]);
  const modalFusao = ref({ aberto: false, funcionario: null, status: '' });
  const modalHelp = ref(false);
  const conflitoGerente = ref(null);
  const novoFuncionarioModal = ref(null);
  const funcionarioParaDemitir = ref(null);
  const modalTrocaLista = ref(null); // Controla o modal de "1 vs Vários"

  const confirmarDemissao = () => {
      if (funcionarioParaDemitir.value) {
          acoes.demitirFuncionario(funcionarioParaDemitir.value.id);
          funcionarioParaDemitir.value = null;
      }
  };

  const chamarContratacao = (prof, isPremium) => {
      acoes.recrutar(
          prof, 
          isPremium, 
          (funcionarioGerado) => {
              novoFuncionarioModal.value = funcionarioGerado;
          },
          (novo, antigo, callbackConfirmar) => {
              // Caso 1: Duelo direto (mesma profissão)
              conflitoGerente.value = { novo, antigo, confirmarTroca: callbackConfirmar };
          },
          (novo, listaAtuais, callbackConfirmar) => {
              // Caso 2: Prefeitura Cheia (escolher quem sai)
              modalTrocaLista.value = { novo, lista: listaAtuais, confirmar: callbackConfirmar };
          }
      );
  };

  const tierAtivoNaFusao = computed(() => {
      if (idsSelecionados.value.length === 0) return null;
      const primeiro = jogo.funcionarios.find(f => f.id === idsSelecionados.value[0]);
      return primeiro ? primeiro.tier : null;
  });

  const resolverConflito = (escolha) => {
      if (escolha === 'novo') {
          if (conflitoGerente.value && conflitoGerente.value.confirmarTroca) {
              conflitoGerente.value.confirmarTroca();
          }
      }
      conflitoGerente.value = null;
  };
  const realizarTrocaLista = (funcionarioEscolhidoParaSair) => {
      if (modalTrocaLista.value && modalTrocaLista.value.confirmar) {
          modalTrocaLista.value.confirmar(funcionarioEscolhidoParaSair);
      }
      modalTrocaLista.value = null; // Fecha o modal
  };
  
  const fecharModalGlobal = () => { ui.modal.aberto = false; };

  const confirmarAcao = () => {
      const acaoConfirmada = ui.modal.onConfirm;
      ui.modal.aberto = false;
      ui.modal.onConfirm = null;
      if (acaoConfirmada) acaoConfirmada();
  };

  const probsAtuais = computed(() => {
      return {
          base: obterProbabilidades(jogo.taverna || 1, 0),
          comBonus: obterProbabilidades(jogo.taverna || 1, bonusSorteTotal.value)
      };
  });

  const tiersInvertidos = [...ORDEM_TIERS].reverse();

  const formatarSexo = (sexo) => {
      if (!sexo) return 'Desconhecida';
      return sexo.charAt(0).toUpperCase() + sexo.slice(1);
  };
  const formatarRaca = (raca) => {
      if (!raca) return 'Desconhecida';
      return raca.charAt(0).toUpperCase() + raca.slice(1);
  };

  const nomeProfissao = (func) => {
      const mapa = {
            // Mantidos (Sem alteração solicitada)
            'minerador': { m: 'Minerador', f: 'Mineradora' },
            'lenhador':  { m: 'Lenhador',  f: 'Lenhadora' },
            'cacador':   { m: 'Caçador',   f: 'Caçadora' },
            'ferreiro':  { m: 'Ferreiro',  f: 'Ferreira' },
            'comandante':{ m: 'Comandante', f: 'Comandante' },
            'saqueador': { m: 'Saqueador',  f: 'Saqueadora' },
            'batedor':   { m: 'Batedor',    f: 'Batedora' },
            'aventureiro': { m: 'Aventureiro', f: 'Aventureira' },
            'academico':     { m: 'Acadêmico',   f: 'Acadêmica' },
            'administrador': { m: 'Administrador', f: 'Administradora' },
            'curandeiro':    { m: 'Curandeiro',  f: 'Curandeira' },
            'lorde':         { m: 'Lorde',       f: 'Lady' },
            'tesoureiro':    { m: 'Tesoureiro',  f: 'Tesoureira' }
        };
      const p = func.profissao.toLowerCase();
      if (!mapa[p]) return p.charAt(0).toUpperCase() + p.slice(1);
      return func.sexo === 'feminino' ? mapa[p].f : mapa[p].m;
  };
  const getNomeImagem = (idOriginal) => {
    const mapa = {
        'gerente': 'administrador',
        'prefeito': 'lorde',
        'bancario': 'tesoureiro',
        'medico': 'curandeiro',
        'cientista': 'academico'
    };
    // Se estiver no mapa, retorna o novo nome. Se não, usa o ID original (ex: minerador)
    return mapa[idOriginal] || idOriginal;
};

  const iconesAtributos = {
      ataque: '⚔️', defesa: '🛡️', velocidade: '👟', xp: '📚', sorte: '🍀'
  };

  // --- FUNÇÃO AJUDANTE DE ORDENAÇÃO ---
  const ordenarLista = (lista) => {
      return [...lista].sort((a, b) => {
          if (ordemAtual.value === 'tier') {
              // Ordem de Tiers (SS > S > A...)
              return ORDEM_TIERS.indexOf(b.tier) - ORDEM_TIERS.indexOf(a.tier);
          }
          if (ordemAtual.value === 'raca') {
              // Proteção: Se não tiver raça, usa texto vazio para não travar
              const racaA = a.raca || '';
              const racaB = b.raca || '';
              return racaA.localeCompare(racaB);
          }
          if (ordemAtual.value === 'profissao') {
              return a.profissao.localeCompare(b.profissao);
          }
          return 0;
      });
  };

  // --- LISTAS SEPARADAS E ORDENADAS ---
  const listaElite = computed(() => {
      const elite = jogo.funcionarios.filter(f => f.isEspecial);
      return ordenarLista(elite);
  });

  // --- LISTA DE AVENTUREIROS (NOVA) ---
  const listaAventureiros = computed(() => {
      const avents = jogo.funcionarios.filter(f => f.profissao === 'aventureiro');
      return ordenarLista(avents);
  });

  // --- LISTA DE COMUNS (ALTERADA: Remove aventureiros daqui) ---
  const listaComuns = computed(() => {
      // Pega quem NÃO é especial E TAMBÉM NÃO é aventureiro
      const comuns = jogo.funcionarios.filter(f => !f.isEspecial && f.profissao !== 'aventureiro');
      return ordenarLista(comuns);
  });

  const funcionariosElegiveis = computed(() => {
      const idxMax = DESBLOQUEIO_POR_NIVEL[Math.min(jogo.taverna, 10)];
      const proibidos = ['gerente', 'prefeito', 'bancario', 'medico', 'ferreiro'];
      
      const lista = jogo.funcionarios.filter(f => {
          const idxFunc = ORDEM_TIERS.indexOf(f.tier);
          if (proibidos.includes(f.profissao)) return false;
          return idxFunc < idxMax;
      });
      return ordenarLista(lista);
  });

  const toggleSelecao = (id, tier) => {
      if (idsSelecionados.value.includes(id)) {
          idsSelecionados.value = idsSelecionados.value.filter(x => x !== id);
          return;
      }      
      if (idsSelecionados.value.length > 0) {
          const primeiroObj = jogo.funcionarios.find(f => f.id === idsSelecionados.value[0]);          
          if (primeiroObj && primeiroObj.tier !== tier) return; 
      }
      if (idsSelecionados.value.length < 3) {
          idsSelecionados.value.push(id);
      }
  };

  const executarFusao = () => {
      acoes.fundirFuncionarios(
          idsSelecionados.value, 
          (novoFuncionario, tierAntigo) => {
              idsSelecionados.value = [];
              dadosFusaoPreview.value = null;
              
              const idxNovo = ORDEM_TIERS.indexOf(novoFuncionario.tier);
              const idxAntigo = ORDEM_TIERS.indexOf(tierAntigo);
              let st = "Manteve";
              if (idxNovo > idxAntigo) st = "Upgrade";
              else if (idxNovo < idxAntigo) st = "Downgrade";
              
              modalFusao.value = { aberto: true, funcionario: novoFuncionario, status: st };
          },
          (chances, tierBase, callbackConfirmar) => {
              dadosFusaoPreview.value = { chances, tier: tierBase, confirmar: callbackConfirmar };
          }
      );
  };

  // Controle do Modal de Detalhes
  const modalDetalheProf = ref(null);

  // Catálogo completo com descrições e requisitos
  const catalogoProfissoes = [
      // --- COMUNS (Nível 1) ---
      { id: 'minerador', nome: 'Minerador', req: 1, desc: 'Trabalha na Mina extraindo recursos.', stat: 'Bônus de Produção (Minérios).' },
      { id: 'lenhador', nome: 'Lenhador', req: 1, desc: 'Trabalha na Floresta cortando madeira.', stat: 'Bônus de Produção (Madeira).' },
      { id: 'cacador', nome: 'Caçador', req: 1, desc: 'Obtém comida e couro na Floresta.', stat: 'Bônus de Produção (Comida/Couro).' },
      { id: 'cientista', nome: 'Acadêmico', req: 1, desc: 'Gera pontos de estudo na Academia.', stat: 'Bônus de Produção (Estudo).' },
      { id: 'comandante', nome: 'Comandante', req: 1, desc: 'Lidera exércitos (Futuro). Possui atributos de combate.', stat: 'Atributos de Batalha (Ataque/Defesa).' },
      { id: 'batedor', nome: 'Batedor', req: 1, desc: 'Explorador ágil.', stat: 'Percepção: Aumenta chance de encontrar itens raros em explorações.' },
      { id: 'saqueador', nome: 'Saqueador', req: 1, desc: 'Especialista em pilhagem.', stat: 'Pilhagem: Aumenta a quantidade de recursos roubados.' },
      
      // --- ELITE (Níveis Variados) ---
      
      { id: 'bancario', nome: 'Tesoureiro', req: 2, desc: 'Gera juros sobre o seu ouro total.', stat: 'Finanças: % de ouro gerado por hora.' },
      { id: 'ferreiro', nome: 'Ferreiro', req: 3, desc: 'Reduz o tempo de fabricação de itens.', stat: 'Produtividade: % de redução no tempo de craft.' },
      { id: 'prefeito', nome: 'Lorde', req: 4, desc: 'Reduz custos de construções e buffa a própria raça.', stat: 'Gestão: % de desconto em construções + Buff Racial.' },
      { id: 'medico', nome: 'Curandeiro', req: 5, desc: 'Cura feridos mais rápido.', stat: 'Medicina: % de velocidade na recuperação.' },
      { id: 'gerente', nome: 'Administrador', req: 6, desc: 'Influencia a Guilda dos Trabalhadores para atrair melhores candidatos.', stat: 'Influência: Aumenta a sorte no recrutamento e fusão.' }    
  ];
  // --- CONTROLE DO CATÁLOGO ---
  const abaCatalogo = ref('profissoes'); // Começa mostrando profissões

  // Lista com as descrições das Classes de Aventureiro
  const catalogoAventureiros = [
      { id: 'cavaleiro', nome: 'Cavaleiro', req: 1, desc: 'Guerreiro de armadura pesada.', stat: 'Foco em Defesa e Vida.' },
      { id: 'berserker', nome: 'Berserker', req: 1, desc: 'Lutador furioso.', stat: 'Muito Dano, pouca Defesa.' },
      { id: 'ladino', nome: 'Ladino', req: 1, desc: 'Mestre da furtividade.', stat: 'Alta chance de Crítico.' },
      { id: 'arqueiro', nome: 'Arqueiro', req: 1, desc: 'Ataca de longe.', stat: 'Alta Precisão.' },
      { id: 'arquimago', nome: 'Arquimago', req: 1, desc: 'Mestre das arcanas.', stat: 'Dano Mágico em Área.' },
      { id: 'necromante', nome: 'Necromante', req: 1, desc: 'Invoca mortos.', stat: 'Invoca servos para lutar.' },
      { id: 'templario', nome: 'Templário', req: 1, desc: 'Guerreiro santo.', stat: 'Defesa e Cura leve.' },
      { id: 'assassino', nome: 'Assassino', req: 1, desc: 'Elimina alvos únicos.', stat: 'Dano massivo em alvo único.' },
      { id: 'demonologista', nome: 'Demonologista', req: 1, desc: 'Pactos sombrios.', stat: 'Dano alto com custo de Vida.' }
  ];

  // Computada que decide qual lista mostrar na tela
  const listaCatalogoAtual = computed(() => {
      return abaCatalogo.value === 'profissoes' ? catalogoProfissoes : catalogoAventureiros;
  });

  // Função para abrir o modal
  const abrirDetalhesProfissao = (prof) => {
      modalDetalheProf.value = prof;
  };

  // Dicionário para traduzir a profissão no nome do Stat
  const labelsEspeciais = {
      administrador: 'Influência', // Alterado de 'gerente'
      batedor: 'Percepção',
      curandeiro: 'Medicina',      // Alterado de 'medico'
      ferreiro: 'Produtividade',
      lorde: 'Gestão',             // Alterado de 'prefeito'
      tesoureiro: 'Finanças',      // Alterado de 'bancario'
      saqueador: 'Pilhagem'
  };

  const corTier = (t) => ({'F':'#8A8A8A','E':'#659665','D':'#71c404','C':'#475fad','B':'#0233d1','A':'#8e44ad','S':'#f1c40f','SS':'#0fbdd1'}[t] || '#000');
  
  const getCorSelecao = (tierAtual) => {
      const idx = ORDEM_TIERS.indexOf(tierAtual);
      if (idx !== -1 && idx < ORDEM_TIERS.length - 1) {
          return corTier(ORDEM_TIERS[idx + 1]);
      }
      return corTier(tierAtual);
  };
</script>

<template>
  <div class="taverna-container">
    
    <div class="header-taverna">
        <div class="titulo-nivel">
            <h2>📜 Guilda dos Trabalhadores</h2>
        </div>
        <div class="info-nivel">
            <span class="badge-nivel">Nível {{ jogo.taverna }}</span>
        </div>
    </div>
    <div class="abas-taverna">
        <button :class="{ ativo: abaAtual === 'contratar' }" @click="abaAtual = 'contratar'">📜 Recrutamento</button>
        <button :class="{ ativo: abaAtual === 'fusao' }" @click="abaAtual = 'fusao'">🌀 Fusão</button>
    </div>

    <div v-if="abaAtual === 'contratar'">
        <div class="painel-unificado">
            
            <div class="coluna-aleatoria">
                <div class="titulo-area-aleatorio">
                    <h4>Contratação</h4>
                    <button class="btn-help-inline" @click="modalHelp = true" title="Ver Probabilidades">?</button>
                </div>
                
                <button 
                    class="btn-aleatorio" 
                    @click="chamarContratacao(null, false)"
                    :disabled="jogo.taverna === 0 || jogo.ouro < custoContratacao || populacaoTotal >= jogo.populacaoMax || jogo.contratacoesHoje >= 500"
                >
                    <div class="icone-grande">🎲 </div> <!-- {{ jogo.contratacoesHoje }} -->
                    <div class="preco">{{ formatarNumero(custoContratacao) }}</div>
                </button>
                <button 
                    v-if="jogo.taverna >= 2"
                    class="btn-aleatorio btn-elite" 
                    @click="chamarContratacao(null, true)"
                    :disabled="jogo.ouro < (custoContratacao * (jogo.taverna * 5)) || populacaoTotal >= jogo.populacaoMax || jogo.contratacoesHoje >= 500 || jogo.contratacoesEliteHoje >= 10000"
                    title="Alta chance de Tiers raros! Pode vir Cargos de Poder!"
                >
                    <div class="icone-grande">👑</div> <!-- {{ jogo.contratacoesEliteHoje }} -->
                    <div class="preco"> {{ formatarNumero(custoContratacao * (jogo.taverna * 5)) }}</div>
                </button>
            </div>
            
            <div class="divisor-vertical"></div>
            <div class="coluna-especifica">
                <div class="botoes-catalogo-mini">
                    <button 
                        :class="{ ativo: abaCatalogo === 'profissoes' }" 
                        @click="abaCatalogo = 'profissoes'">
                        Profissões
                    </button>
                    <button 
                        :class="{ ativo: abaCatalogo === 'aventureiros' }" 
                        @click="abaCatalogo = 'aventureiros'">
                        Aventureiros
                    </button>
                </div>

                <div class="grid-catalogo">
                    <div 
                        v-for="item in listaCatalogoAtual" 
                        :key="item.id" 
                        class="item-catalogo" 
                        :class="{ 'bloqueado': jogo.taverna < item.req }"
                        @click="abrirDetalhesProfissao(item)"
                        :title="jogo.taverna < item.req ? `Desbloqueia no Nível ${item.req}` : 'Clique para ver detalhes'"
                    >
                        <div class="icon-wrapper">
                            <img :src="`/assets/ui/i_${getNomeImagem(item.id)}.png`" class="icone-prof-catalogo" alt="Icone">
                            <div v-if="jogo.taverna < item.req" class="lock-overlay">🔒</div>
                        </div>
                        
                        <div class="prof-nome-catalogo">{{ item.nome }}</div>
                    </div>
                </div>
            </div>
        </div> <div class="barra-ordenacao-acoplada">
            <label for="filtro-recrutamento">Ordenar por: </label>
            <select v-model="ordemAtual" id="filtro-recrutamento">
                <option value="tier">Tier</option>
                <option value="raca">Raça</option>
                <option value="profissao">Profissão</option>
            </select>
        </div>

        <div v-if="listaElite.length > 0">
            <h4 class="titulo-secao elite" 
                @click="alternarSecao('elite')" 
                style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                
                <span>👑 Elite da Vila ({{ listaElite.length }})</span>
                <span>{{ secoesAbertas.elite ? '▼' : '◀' }}</span>
            </h4>

            <div v-show="secoesAbertas.elite" class="lista-funcionarios">
                <div v-for="func in listaElite" :key="func.id" 
                     class="card-funcionario card-ouro"
                     :style="{ borderColor: corTier(func.tier) }">
                    
                    <div class="card-topo" :style="{ backgroundColor: corTier(func.tier) }">
                        <span class="tier-badge">{{ func.tier }}</span>
                        <span class="card-nome">{{ func.nome }}</span>
                        <img :src="`/assets/ui/i_${getNomeImagem(func.profissao)}.png`" class="icone-topo-card">
                        <span v-if="func.diasEmGreve > 0" class="tag-greve">GREVE ({{func.diasEmGreve}}/5)</span>
                    </div>
                    <div class="card-mid">
                        <img v-if="func.imagem" :src="`/assets/faces/${func.raca}/${func.imagem}.png`" class="avatar-func">
                        <div class="card-corpo">
                            <div class="info-linha"><strong>Prof:</strong> {{ nomeProfissao(func) }}</div>
                            <div class="info-linha"><strong>Raça:</strong> {{ formatarRaca(func.raca) }}</div>
                            <div class="info-linha"><strong>Sexo:</strong> {{ formatarSexo(func.sexo) }}</div>
                            <div class="info-linha"><strong>Salário:</strong> <img src="/assets/ui/icone_goldC.png" class="icon-moeda-topo" alt="Ouro">{{ formatarNumero(func.salario) }}</div>
                            
                            <div v-if="labelsEspeciais[func.profissao]" class="info-linha">
                                <strong>{{ labelsEspeciais[func.profissao] }}: </strong> 
                                
                                <span class="stat-container" @click.stop="toggleTooltip(func.id + 'spec')">
                                    
                                    <span :style="{ color: obterBuffRaca(func) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(func) > 0 ? 'bold' : 'normal' }">
                                        {{ getStatReal(func) }}{{ func.profissao === 'gerente' ? '' : '%' }}
                                    </span>

                                    <div v-if="tooltipAberto === (func.id + 'spec') && obterBuffRaca(func) > 0" class="balao-flutuante">
                                        Base: {{ getInfoTooltip(func).original }}<br>
                                        Bônus: +{{ getInfoTooltip(func).ganho }}
                                    </div>
                                </span>
                            </div>
                            <div v-if="func.diasEmGreve > 0" class="info-greve">
                                <button class="btn-pagar" @click="acoes.pagarIndividual(func.id)">Pagar</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-rodape">
                        <button class="btn-demitir" @click="funcionarioParaDemitir = func">Demitir</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="listaAventureiros.length > 0">
            <h4 class="titulo-secao" 
                @click="alternarSecao('aventureiros')"
                style="color: #e67e22; border-bottom: 2px solid #e67e22; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>⚔️ Aventureiros ({{ listaAventureiros.length }})</span>
                <span>{{ secoesAbertas.aventureiros ? '▼' : '◀' }}</span>
            </h4>

            <div v-show="secoesAbertas.aventureiros" class="lista-funcionarios">
                <div v-for="func in listaAventureiros" :key="func.id" 
                     class="card-funcionario"
                     style="background: #fff5e6;"
                     :style="{ borderColor: corTier(func.tier) }">
                    
                    <div class="card-topo" :style="{ backgroundColor: corTier(func.tier) }">
                        <span class="tier-badge">{{ func.tier }}</span>
                        <span class="card-nome">{{ func.nome }}</span>
                        <span class="icone-topo-card">⚔️</span>
                    </div>
                    <div class="card-mid">
                        <img v-if="func.imagem" :src="`/assets/faces/${func.raca}/${func.imagem}.png`" class="avatar-func">
                        
                        <div class="card-corpo">
                            <div class="info-linha"><strong>Prof:</strong> {{ nomeProfissao(func) }}</div>
                            <div class="info-linha"><strong>Raça:</strong> {{ formatarRaca(func.raca) }}</div>
                            <div class="info-linha"><strong>Sexo:</strong> {{ formatarSexo(func.sexo) }}</div>
                            <div class="info-linha">
                                <strong>Salário: </strong><img src="/assets/ui/icone_goldC.png" class="icon-moeda-topo" alt="Ouro">{{ formatarNumero(func.salario) }}
                            </div>
                            
                            <div class="info-linha"><strong>Classe:</strong> 
                                {{ func.classe || 'Classe Desconhecida' }}
                            </div>
                            
                            <div v-if="func.diasEmGreve > 0" class="info-greve">
                                <button class="btn-pagar" @click="acoes.pagarIndividual(func.id)">Pagar</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-rodape">
                        <button class="btn-demitir" @click="funcionarioParaDemitir = func">Demitir</button>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h4 class="titulo-secao comum" 
                @click="alternarSecao('comuns')"
                style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🏠 Trabalhadores ({{ listaComuns.length }})</span>
                <span>{{ secoesAbertas.comuns ? '▼' : '◀' }}</span>
            </h4>
            
            <div v-show="secoesAbertas.comuns">
                <div v-if="listaComuns.length === 0" class="vazio">Nenhum trabalhador comum.</div>
                
                <div class="lista-funcionarios">
                    <div v-for="func in listaComuns" :key="func.id" 
                        class="card-funcionario" 
                        :class="{ emGreve: func.diasEmGreve > 0 }"
                        :style="{ borderColor: func.diasEmGreve > 0 ? '#c0392b' : corTier(func.tier) }">
                        
                        <div class="card-topo" :style="{ backgroundColor: corTier(func.tier) }">
                            <span class="tier-badge">{{ func.tier }}</span>
                            <span class="card-nome">{{ func.nome }}</span>
                            <img :src="`/assets/ui/i_${getNomeImagem(func.profissao)}.png`" class="icone-topo-card">
                            <span v-if="func.diasEmGreve > 0" class="tag-greve">GREVE ({{func.diasEmGreve}}/5)</span>
                        </div>
                        <div class="card-mid">
                            <img v-if="func.imagem" :src="`/assets/faces/${func.raca}/${func.imagem}.png`" class="avatar-func">
                            <div class="card-corpo">
                                <div class="info-linha"><strong>Prof:</strong> {{ nomeProfissao(func) }}</div>                            
                                <div class="info-linha"><strong>Raça:</strong> {{ formatarRaca(func.raca) }}</div>                            
                                <div class="info-linha"><strong>Sexo:</strong> {{ formatarSexo(func.sexo) }}</div>
                                <div class="info-linha"><strong>Salário:</strong> <img src="/assets/ui/icone_goldC.png" class="icon-moeda-topo" alt="Ouro">{{ formatarNumero(func.salario) }}</div>
                                
                                <div v-if="labelsEspeciais[func.profissao]" class="info-linha">
                                    <strong>{{ labelsEspeciais[func.profissao] }}: </strong> 
                                    <span class="stat-container" @click.stop="toggleTooltip(func.id + 'spec')">
                                        <span :style="{ color: obterBuffRaca(func) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(func) > 0 ? 'bold' : 'normal' }">
                                            {{ getStatReal(func) }}%
                                        </span>
                                        <div v-if="tooltipAberto === (func.id + 'spec') && obterBuffRaca(func) > 0" class="balao-flutuante">
                                            Base: {{ getInfoTooltip(func).original }}%<br>
                                            Bônus: +{{ getInfoTooltip(func).ganho }}%
                                        </div>
                                    </span>
                                </div>
                                <div v-else class="info-linha">
                                    <strong>Bônus: </strong> 
                                    <span class="stat-container" @click.stop="toggleTooltip(func.id + 'prod')">
                                        <span :style="{ color: obterBuffRaca(func) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(func) > 0 ? 'bold' : 'normal' }">
                                            ✨ {{ Math.floor(((func.bonus * (1 + (obterBuffRaca(func) / 100))) - 1) * 100) }}%
                                        </span>
                                        <div v-if="tooltipAberto === (func.id + 'prod') && obterBuffRaca(func) > 0" class="balao-flutuante">
                                            Base: {{ getInfoTooltip(func, 'producao').original }}%<br>
                                            Bônus: +{{ getInfoTooltip(func, 'producao').ganho }}%
                                        </div>
                                    </span>
                                </div>
                                
                                <div v-if="func.diasEmGreve > 0" class="info-greve">
                                    <button class="btn-pagar" @click="acoes.pagarIndividual(func.id)">💸 Pagar</button>
                                </div>
                            </div>
                        </div>
                        <div class="card-rodape">
                            <button class="btn-demitir" @click="funcionarioParaDemitir = func">Demitir</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-if="abaAtual === 'fusao'">
        
        <div class="painel-fusao-header compacto">
            <div class="instrucoes-simples">
            </div>

            <div v-if="idsSelecionados.length < 3" class="contador-status">
                Selecionados: <strong>{{ idsSelecionados.length }} / 3</strong>
            </div>

            <button v-else class="btn-fundir-transformado" @click="executarFusao">
                ✨ FUNDIR AGORA ✨
            </button>
        </div>

        <div class="barra-ordenacao-fusao">
            <div class="filtros-container-fusao">
                <label>Ordenar por: </label>
                <select v-model="ordemAtual">
                    <option value="tier">Tier</option>
                    <option value="raca">Raça</option>
                    <option value="profissao">Profissão</option>
                </select>
            </div>
        </div>

        <div class="lista-funcionarios">
            <div v-if="funcionariosElegiveis.length === 0" class="vazio">
                Nenhum funcionário elegível para fusão no momento.
            </div>
            
            <div v-for="func in funcionariosElegiveis" :key="func.id" 
                class="card-funcionario selecionavel"
                :class="{ 
                    'selecionado': idsSelecionados.includes(func.id),
                    'desativado': tierAtivoNaFusao && func.tier !== tierAtivoNaFusao 
                }"
                :style="{ 
                    borderColor: idsSelecionados.includes(func.id) ? getCorSelecao(func.tier) : corTier(func.tier),
                    boxShadow: idsSelecionados.includes(func.id) ? '0 0 15px ' + getCorSelecao(func.tier) : 'none'
                }"
                @click="toggleSelecao(func.id, func.tier)">
                
                <div class="card-topo" 
                    :style="{ backgroundColor: idsSelecionados.includes(func.id) ? getCorSelecao(func.tier) : corTier(func.tier) }">
                    <span class="tier-badge">{{ func.tier }}</span>
                    <span class="card-nome">{{ func.nome }}</span>
                    <span v-if="idsSelecionados.includes(func.id)" class="check">⬆️</span>
                </div>
                
                <div class="card-mid">
                    <img v-if="func.imagem" 
                         :src="`/assets/faces/${func.raca}/${func.imagem}.png`" 
                         class="avatar-func" alt="Face">
                         
                    <div class="card-corpo">
                        <div class="info-linha"><strong>Prof:</strong> {{ nomeProfissao(func) }}</div>
                        <div class="info-linha"><strong>Raça:</strong> {{ formatarRaca(func.raca) }}</div>
                        <div class="info-linha">
                            <strong>Sexo:</strong> {{ func.sexo === 'masculino' ? '♂️' : '♀️' }} {{ formatarSexo(func.sexo) }}
                        </div>
                        <div class="info-linha"><strong>Salário:</strong> <img src="/assets/ui/icone_goldC.png" class="icon-moeda-topo" alt="Ouro">{{ formatarNumero(func.salario) }}</div>
                        <!-- Inicio da Estatística Aba de Fusão -->
                        <div v-if="labelsEspeciais[func.profissao]" class="info-linha" style="margin-bottom: 15px;">
                            <strong>{{ labelsEspeciais[func.profissao] }}: </strong> 
                            
                            <span class="stat-container" @click.stop="toggleTooltip(func.id + 'fusao')">
                                <span :style="{ color: obterBuffRaca(func) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(func) > 0 ? 'bold' : 'normal' }">
                                    {{ getStatReal(func) }}{{ func.profissao === 'gerente' ? '' : '%' }}
                                </span>
                                <div v-if="tooltipAberto === (func.id + 'fusao') && obterBuffRaca(func) > 0" class="balao-flutuante">
                                    Base: {{ getInfoTooltip(func).original }}<br>
                                    Bônus: +{{ getInfoTooltip(func).ganho }}
                                </div>
                            </span>
                        </div>

                        <div v-else-if="func.profissao === 'aventureiro'" class="info-linha" style="margin-bottom: 15px;">
                             <strong>Classe:</strong> {{ func.classe || 'Desconhecida' }}
                        </div>

                        <div v-else class="info-linha" style="margin-bottom: 15px;">
                            <strong>Bônus: </strong> 
                            <span class="stat-container" @click.stop="toggleTooltip(func.id + 'fusao_prod')">
                                <span :style="{ color: obterBuffRaca(func) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(func) > 0 ? 'bold' : 'normal' }">
                                    {{ Math.floor(((func.bonus * (1 + (obterBuffRaca(func) / 100))) - 1) * 100) }}%
                                </span>
                                <div v-if="tooltipAberto === (func.id + 'fusao_prod') && obterBuffRaca(func) > 0" class="balao-flutuante">
                                    Base: {{ getInfoTooltip(func, 'producao').original }}%<br>
                                    Bônus: +{{ getInfoTooltip(func, 'producao').ganho }}%
                                </div>
                            </span>
                        </div>
                        <!-- Fim da Estatística Aba de Fusão -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-if="ui.modal.aberto" class="modal-overlay" style="z-index: 1000;">
        <div class="modal-content-global">
            <h3>{{ ui.modal.titulo }}</h3>
            <p>{{ ui.modal.texto }}</p>
            <div class="modal-actions">
                <button v-if="ui.modal.tipo === 'confirmacao'" class="btn-sim" @click="confirmarAcao">Confirmar</button>
                <button v-if="ui.modal.tipo === 'confirmacao'" class="btn-nao" @click="fecharModalGlobal">Cancelar</button>
                <button v-if="ui.modal.tipo === 'aviso' || ui.modal.tipo === 'sucesso'" class="btn-ok" @click="fecharModalGlobal">OK</button>
            </div>
        </div>
    </div>

    <div v-if="modalHelp" class="modal-overlay" @click.self="modalHelp = false">
        <div class="modal-content-help">
            <h2>📊 Probabilidades</h2>
            <p v-if="bonusSorteTotal > 0" class="aviso-bonus">
                🤝 Bônus de Influência Ativo
            </p>
            <div class="tabela-container">
                <h4>Comum</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Tier</th>
                            <th>Chance Base</th>
                            <th v-if="bonusSorteTotal > 0">Sua Chance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="tier in tiersInvertidos" :key="tier">
                            <td class="tier-col">
                                <span class="tier-box-table" :style="{ backgroundColor: corTier(tier) }">
                                    {{ tier }}
                                </span>
                            </td>
                            <td>{{ probsAtuais.base.padrao[tier] ? probsAtuais.base.padrao[tier] + '%' : '-' }}</td>
                            <td v-if="bonusSorteTotal > 0" class="col-bonus">
                                {{ probsAtuais.comBonus.padrao[tier] ? probsAtuais.comBonus.padrao[tier] + '%' : '-' }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="tabela-container" v-if="probsAtuais.base.elite">
                <h4>Elite</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Tier</th>
                            <th>Chance Base</th>
                            <th v-if="bonusSorteTotal > 0">Sua Chance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="tier in tiersInvertidos" :key="tier">
                            <td class="tier-col">
                                <span class="tier-box-table" :style="{ backgroundColor: corTier(tier) }">
                                    {{ tier }}
                                </span>
                            </td>
                            <td>{{ probsAtuais.base.elite[tier] ? probsAtuais.base.elite[tier] + '%' : '-' }}</td>
                            <td v-if="bonusSorteTotal > 0" class="col-bonus">
                                {{ probsAtuais.comBonus.elite[tier] ? probsAtuais.comBonus.elite[tier] + '%' : '-' }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <button @click="modalHelp = false">Entendi</button>
        </div>
    </div>

    <div v-if="modalFusao.aberto" class="modal-overlay">
        <div class="modal-content" :class="modalFusao.status.toLowerCase()">
            <h2>{{ modalFusao.status === 'Upgrade' ? '✨ FUSÃO BEM SUCEDIDA! ✨' : (modalFusao.status === 'Downgrade' ? '💀 FALHA NA FUSÃO...' : '🔄 FUSÃO ESTÁVEL') }}</h2>
            <div class="card-destaque" :style="{ borderColor: corTier(modalFusao.funcionario.tier) }">
                <div class="card-topo" :style="{ backgroundColor: corTier(modalFusao.funcionario.tier) }">
                    <span class="tier-badge-lg">{{ modalFusao.funcionario.tier }}</span>
                </div>
                
                <img v-if="modalFusao.funcionario.imagem" 
                     :src="`/assets/faces/${modalFusao.funcionario.raca}/${modalFusao.funcionario.imagem}.png`" 
                     class="avatar-destaque" alt="Face">
                
                <h3>{{ modalFusao.funcionario.nome }}</h3>
                
                <p><strong>Profissão:</strong> {{ nomeProfissao(modalFusao.funcionario) }}</p>
                <p><strong>Raça:</strong> {{ formatarRaca(modalFusao.funcionario.raca) }}</p>
                <p><strong>Sexo:</strong> {{ formatarSexo(modalFusao.funcionario.sexo) }}</p>
                <p><strong>Salário:</strong> <img src="/assets/ui/icone_goldC.png" class="icon-moeda-topo" alt="Ouro">{{ formatarNumero(modalFusao.funcionario.salario) }}</p>
                <!-- Inicio da Estatística Modal Fusão -->
                <div v-if="labelsEspeciais[modalFusao.funcionario.profissao]" class="info-linha" style="justify-content:center; display:flex; margin-bottom: 15px;">
                    <strong>{{ labelsEspeciais[modalFusao.funcionario.profissao] }}:</strong>&nbsp;
                    
                    <span class="stat-container" @click.stop="toggleTooltip('resultado_fusao')">
                        <span :style="{ color: obterBuffRaca(modalFusao.funcionario) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(modalFusao.funcionario) > 0 ? 'bold' : 'normal' }">
                            {{ getStatReal(modalFusao.funcionario) }}{{ modalFusao.funcionario.profissao === 'gerente' ? '' : '%' }}
                        </span>
                        <div v-if="tooltipAberto === 'resultado_fusao' && obterBuffRaca(modalFusao.funcionario) > 0" class="balao-flutuante">
                            Base: {{ getInfoTooltip(modalFusao.funcionario).original }}<br>
                            Bônus: +{{ getInfoTooltip(modalFusao.funcionario).ganho }}
                        </div>
                    </span>
                </div>

                <div v-else-if="modalFusao.funcionario.profissao === 'comandante' && modalFusao.funcionario.atributos" 
                    class="info-linha" 
                    style="justify-content:center; display:flex; gap: 4px; flex-wrap: wrap; margin-bottom: 15px;">
                    <strong>Buffs:</strong>
                    <span v-for="(valor, chave) in modalFusao.funcionario.atributos" :key="chave" 
                        class="stat-container"
                        @click.stop="toggleTooltip('resultado_cmd_' + chave)"
                        style="font-size: 0.9em;">
                        
                        <span :style="{ color: obterBuffRaca(modalFusao.funcionario) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(modalFusao.funcionario) > 0 ? 'bold' : 'normal' }">
                            {{ iconesAtributos[chave] }} {{ Math.floor(valor * (1 + (obterBuffRaca(modalFusao.funcionario) / 100))) }}
                        </span>

                        <div v-if="tooltipAberto === ('resultado_cmd_' + chave) && obterBuffRaca(modalFusao.funcionario) > 0" class="balao-flutuante">
                            Base: {{ valor }}<br>
                            Bônus: +{{ getInfoTooltip(modalFusao.funcionario, 'comandante', chave, valor).ganho }}
                        </div>
                    </span>
                </div>

                <p v-else style="display: flex; justify-content: center; gap: 5px;">
                    <strong>Bônus: </strong> 
                    <span class="stat-container" @click.stop="toggleTooltip('resultado_prod')">
                        <span :style="{ color: obterBuffRaca(modalFusao.funcionario) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(modalFusao.funcionario) > 0 ? 'bold' : 'normal' }">
                            {{ Math.floor(((modalFusao.funcionario.bonus * (1 + (obterBuffRaca(modalFusao.funcionario) / 100))) - 1) * 100) }}%
                        </span>
                        <div v-if="tooltipAberto === 'resultado_prod' && obterBuffRaca(modalFusao.funcionario) > 0" class="balao-flutuante">
                            Base: {{ getInfoTooltip(modalFusao.funcionario, 'producao').original }}%<br>
                            Bônus: +{{ getInfoTooltip(modalFusao.funcionario, 'producao').ganho }}%
                        </div>
                    </span>
                </p>
                <!-- Fim da Estatística Modal Fusão -->
            </div>
            <button @click="modalFusao.aberto = false">FECHAR</button>
        </div>
    </div>

  </div>

  <div v-if="novoFuncionarioModal" class="modal-overlay" style="z-index: 2000;">
        <div class="modal-content animacao-entrada">
            <h2>✨ NOVO HABITANTE! ✨</h2>
            
            <div class="card-destaque" :style="{ borderColor: corTier(novoFuncionarioModal.tier) }">
                <div class="card-topo" :style="{ backgroundColor: corTier(novoFuncionarioModal.tier) }">
                    <span class="tier-badge-lg">{{ novoFuncionarioModal.tier }}</span>
                </div>
                
                <img v-if="novoFuncionarioModal.imagem" 
                     :src="`/assets/faces/${novoFuncionarioModal.raca}/${novoFuncionarioModal.imagem}.png`" 
                     class="avatar-destaque" 
                     alt="Face">
                
                <h3>{{ novoFuncionarioModal.nome }}</h3>
                
                <p><strong>Profissão:</strong> {{ nomeProfissao(novoFuncionarioModal) }}</p>
                <p><strong>Raça:</strong> {{ formatarRaca(novoFuncionarioModal.raca) }}</p>
                <p><strong>Sexo:</strong> {{ formatarSexo(novoFuncionarioModal.sexo) }}</p>
                <p><strong>Salário:</strong> <img src="/assets/ui/icone_goldC.png" class="icon-moeda-topo" alt="Ouro">{{ formatarNumero(novoFuncionarioModal.salario) }}</p>
                 <!-- Inicio da Estatística Modal Novo Contratado -->
                <div v-if="labelsEspeciais[novoFuncionarioModal.profissao]" class="info-linha" style="justify-content:center; display:flex; margin-bottom: 15px;">
                    <strong>{{ labelsEspeciais[novoFuncionarioModal.profissao] }}:</strong>&nbsp;
                    
                    <span class="stat-container" @click.stop="toggleTooltip('novo_func_spec')">
                        <span :style="{ color: obterBuffRaca(novoFuncionarioModal) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(novoFuncionarioModal) > 0 ? 'bold' : 'normal' }">
                            {{ getStatReal(novoFuncionarioModal) }}{{ novoFuncionarioModal.profissao === 'gerente' ? '' : '%' }}
                        </span>
                        <div v-if="tooltipAberto === 'novo_func_spec' && obterBuffRaca(novoFuncionarioModal) > 0" class="balao-flutuante">
                            Base: {{ getInfoTooltip(novoFuncionarioModal).original }}<br>
                            Bônus: +{{ getInfoTooltip(novoFuncionarioModal).ganho }}
                        </div>
                    </span>
                </div>

                <div v-else-if="novoFuncionarioModal.profissao === 'comandante' && novoFuncionarioModal.atributos" 
                    class="info-linha" 
                    style="justify-content:center; display:flex; gap: 4px; flex-wrap: wrap; margin-bottom: 15px;">
                    <strong>Buffs:</strong>
                    <span v-for="(valor, chave) in novoFuncionarioModal.atributos" :key="chave" 
                        class="stat-container"
                        @click.stop="toggleTooltip('novo_func_' + chave)"
                        style="font-size: 0.9em;">
                        
                        <span :style="{ color: obterBuffRaca(novoFuncionarioModal) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(novoFuncionarioModal) > 0 ? 'bold' : 'normal' }">
                            {{ iconesAtributos[chave] }} {{ Math.floor(valor * (1 + (obterBuffRaca(novoFuncionarioModal) / 100))) }}
                        </span>
                        <div v-if="tooltipAberto === ('novo_func_' + chave) && obterBuffRaca(novoFuncionarioModal) > 0" class="balao-flutuante">
                            Base: {{ valor }}<br>
                            Bônus: +{{ getInfoTooltip(novoFuncionarioModal, 'comandante', chave, valor).ganho }}
                        </div>
                    </span>
                </div>

                <p v-else style="display: flex; justify-content: center; gap: 5px;">
                    <strong>Bônus: </strong> 
                    <span class="stat-container" @click.stop="toggleTooltip('novo_func_prod')">
                        <span :style="{ color: obterBuffRaca(novoFuncionarioModal) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(novoFuncionarioModal) > 0 ? 'bold' : 'normal' }">
                            {{ Math.floor(((novoFuncionarioModal.bonus * (1 + (obterBuffRaca(novoFuncionarioModal) / 100))) - 1) * 100) }}%
                        </span>
                        <div v-if="tooltipAberto === 'novo_func_prod' && obterBuffRaca(novoFuncionarioModal) > 0" class="balao-flutuante">
                            Base: {{ getInfoTooltip(novoFuncionarioModal, 'producao').original }}%<br>
                            Bônus: +{{ getInfoTooltip(novoFuncionarioModal, 'producao').ganho }}%
                        </div>
                    </span>
                </p>
                <!-- Fim da Estatística Modal Novo Contratado -->

            </div>

            <button class="btn-receber" @click="novoFuncionarioModal = null">RECEBER</button>
        </div>
    </div>

    <div v-if="funcionarioParaDemitir" class="modal-overlay" style="z-index: 2000;">
        <div class="modal-content animacao-entrada demissao-content">
            <h2 style="color: #c0392b;">⚠️ TEM CERTEZA? ⚠️</h2>
            <p>Você vai demitir este funcionário permanentemente.</p>
            
            <div class="card-destaque" :style="{ borderColor: '#c0392b' }">
                <div class="card-topo" :style="{ backgroundColor: corTier(funcionarioParaDemitir.tier) }">
                    <span class="tier-badge-lg">{{ funcionarioParaDemitir.tier }}</span>
                </div>
                
                <img v-if="funcionarioParaDemitir.imagem" 
                     :src="`/assets/faces/${funcionarioParaDemitir.raca}/${funcionarioParaDemitir.imagem}.png`" 
                     class="avatar-destaque" 
                     alt="Face">
                
                <h3>{{ funcionarioParaDemitir.nome }}</h3>

                <p><strong>Profissão:</strong> {{ nomeProfissao(funcionarioParaDemitir) }}</p>
                <p><strong>Raça:</strong> {{ formatarRaca(funcionarioParaDemitir.raca) }}</p>
                <p><strong>Sexo:</strong> {{ formatarSexo(funcionarioParaDemitir.sexo) }}</p>
                <p><strong>Salário:</strong> <img src="/assets/ui/icone_goldC.png" class="icon-moeda-topo" alt="Ouro">{{ formatarNumero(funcionarioParaDemitir.salario) }}</p>
                <!-- Inicio da Estatística Modal Demição -->
                <div v-if="labelsEspeciais[funcionarioParaDemitir.profissao]" class="info-linha">
                    <strong>{{ labelsEspeciais[funcionarioParaDemitir.profissao] }}:</strong> 
                    
                    <span class="stat-container" @click.stop="toggleTooltip('demissao_spec')">
                        <span :style="{ color: obterBuffRaca(funcionarioParaDemitir) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(funcionarioParaDemitir) > 0 ? 'bold' : 'normal' }">
                            {{ getStatReal(funcionarioParaDemitir) }}{{ funcionarioParaDemitir.profissao === 'gerente' ? '' : '%' }}
                        </span>
                        <div v-if="tooltipAberto === 'demissao_spec' && obterBuffRaca(funcionarioParaDemitir) > 0" class="balao-flutuante">
                            Base: {{ getInfoTooltip(funcionarioParaDemitir).original }}<br>
                            Bônus: +{{ getInfoTooltip(funcionarioParaDemitir).ganho }}
                        </div>
                    </span>
                </div>
                <!-- Fim da Estatística Modal Demição -->
                
            </div>

            <div class="botoes-demissao">
                <button class="btn-cancelar-demissao" @click="funcionarioParaDemitir = null">Cancelar</button>
                <button class="btn-confirmar-demissao" @click="confirmarDemissao">Demitir</button>
            </div>
        </div>
    </div>

    <div v-if="conflitoGerente" class="modal-overlay" style="z-index: 2100;">
        <div class="modal-content animacao-entrada modal-largo-vertical">
            <h3 style="color: #e67e22; margin-bottom: 5px;">👔 CONFLITO DE GESTÃO</h3>
            <p style="color: #7f8c8d; margin-bottom: 20px;">Para a entrada do novo, o atual deve sair.</p>
            
            <div class="duelo-vertical-stack">
                
                <div class="opcao-wrapper atual">
                    <div class="label-topo">ATUAL</div>
                    
                    <div class="card-funcionario" :style="{ borderColor: corTier(conflitoGerente.antigo.tier) }">
                         <div class="card-topo" :style="{ backgroundColor: corTier(conflitoGerente.antigo.tier) }">
                            <span class="tier-badge">{{ conflitoGerente.antigo.tier }}</span>
                            <span class="card-nome">{{ conflitoGerente.antigo.nome }}</span>
                            <img :src="`/assets/ui/i_${conflitoGerente.antigo.profissao}.png`" class="icone-topo-card">
                        </div>
                        <div class="card-mid">
                            <img :src="`/assets/faces/${conflitoGerente.antigo.raca}/${conflitoGerente.antigo.imagem}.png`" class="avatar-func">
                            <div class="card-corpo">
                                <div><strong>Prof:</strong> {{ nomeProfissao(conflitoGerente.antigo) }}</div>
                                <div><strong>Raça:</strong> {{ formatarRaca(conflitoGerente.antigo.raca) }}</div>
                                
                                <div><strong>Sexo:</strong> {{ formatarSexo(conflitoGerente.antigo.sexo) }}</div>
                                <div><strong>Salário:</strong> <img src="/assets/ui/icone_goldC.png" class="icon-moeda-topo" alt="Ouro">{{ formatarNumero(conflitoGerente.antigo.salario) }}</div>
                                <!-- Inicio da Estatística do Duelo de Gerente -->
                                <div>
                                    <strong>{{ labelsEspeciais[conflitoGerente.antigo.profissao] }}: </strong> 
                                    <span class="stat-container" @click.stop="toggleTooltip('duelo_antigo')">
                                        <span :style="{ color: obterBuffRaca(conflitoGerente.antigo) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(conflitoGerente.antigo) > 0 ? 'bold' : 'normal' }">
                                            {{ getStatReal(conflitoGerente.antigo) }}
                                        </span>
                                        <div v-if="tooltipAberto === 'duelo_antigo' && obterBuffRaca(conflitoGerente.antigo) > 0" class="balao-flutuante">
                                            Base: {{ getInfoTooltip(conflitoGerente.antigo).original }}<br>
                                            Bônus: +{{ getInfoTooltip(conflitoGerente.antigo).ganho }}
                                        </div>
                                    </span>
                                </div>
                                <!-- Fim da Estatística do Duelo de Gerente -->
                            </div>
                        </div>
                    </div>

                    <button class="btn-selecionar-duelo" @click="resolverConflito('atual')">
                        MANTER ATUAL
                    </button>
                </div>

                <div class="vs-badge-static">VS</div>

                <div class="opcao-wrapper novo">
                    <div class="label-topo novo-cor">NOVO CANDIDATO</div>
                    
                    <div class="card-funcionario" :style="{ borderColor: corTier(conflitoGerente.novo.tier) }">
                         <div class="card-topo" :style="{ backgroundColor: corTier(conflitoGerente.novo.tier) }">
                            <span class="tier-badge">{{ conflitoGerente.novo.tier }}</span>
                            <span class="card-nome">{{ conflitoGerente.novo.nome }}</span>
                            <img :src="`/assets/ui/i_${getNomeImagem(conflitoGerente.novo.profissao)}.png`" class="icone-topo-card">
                        </div>
                        <div class="card-mid">
                            <img v-if="conflitoGerente.novo.imagem" :src="`/assets/faces/${conflitoGerente.novo.raca}/${conflitoGerente.novo.imagem}.png`" class="avatar-func">
                            <div class="card-corpo">
                                <div><strong>Prof:</strong> {{ nomeProfissao(conflitoGerente.novo) }}</div>
                                <div><strong>Raça:</strong> {{ formatarRaca(conflitoGerente.novo.raca) }}</div>

                                <div><strong>Sexo:</strong> {{ formatarSexo(conflitoGerente.novo.sexo) }}</div>
                                <div><strong>Salário:</strong> <img src="/assets/ui/icone_goldC.png" class="icon-moeda-topo" alt="Ouro">{{ formatarNumero(conflitoGerente.novo.salario) }}</div>
                                <!-- Inicio da Estatística do Duelo de Gerente -->
                                <div>
                                    <strong>{{ labelsEspeciais[conflitoGerente.novo.profissao] }}: </strong> 
                                    
                                    <span v-if="conflitoGerente.novo.profissao === 'prefeito'">
                                        {{ conflitoGerente.novo.poderEspecial || conflitoGerente.novo.poderGerencia }}
                                    </span>

                                    <span v-else class="stat-container" @click.stop="toggleTooltip('duelo_novo')">
                                        <span :style="{ color: obterBuffRaca(conflitoGerente.novo) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(conflitoGerente.novo) > 0 ? 'bold' : 'normal' }">
                                            {{ getStatReal(conflitoGerente.novo) }}
                                        </span>
                                        <div v-if="tooltipAberto === 'duelo_novo' && obterBuffRaca(conflitoGerente.novo) > 0" class="balao-flutuante">
                                            Base: {{ getInfoTooltip(conflitoGerente.novo).original }}<br>
                                            Bônus: +{{ getInfoTooltip(conflitoGerente.novo).ganho }}
                                        </div>
                                    </span>
                                </div>
                                <!-- Fim da Estatística do Duelo de Gerente -->
                            </div>
                        </div>
                    </div>

                    <button class="btn-selecionar-duelo novo-btn" @click="resolverConflito('novo')">
                        CONTRATAR NOVO
                    </button>
                </div>

            </div>
        </div>
    </div>

    <div v-if="dadosFusaoPreview" class="modal-overlay" style="z-index: 2200;">
        <div class="modal-content animacao-entrada modal-fusao-confirm">
            <h3>🔮 RITUAL DE FUSÃO</h3>
            
            <div class="info-tier-fusao">
                <p>Fundindo 3 Funcionários</p>
                <div class="badge-tier-gigante" :style="{ backgroundColor: corTier(dadosFusaoPreview.tier) }">
                    Tier {{ dadosFusaoPreview.tier }}
                </div>
            </div>

            <div class="tabela-probabilidades">
                <div class="linha-probabilidade">
                    <div class="label-prob">
                        <span>⬆️ UPGRADE</span>
                        <strong>{{ dadosFusaoPreview.chances.upgrade }}%</strong>
                    </div>
                    <div class="barra-fundo-prob">
                        <div class="barra-fill upgrade" :style="{ width: dadosFusaoPreview.chances.upgrade + '%' }"></div>
                    </div>
                </div>

                <div class="linha-probabilidade">
                    <div class="label-prob">
                        <span>↔️ MANTER</span>
                        <strong>{{ dadosFusaoPreview.chances.manter }}%</strong>
                    </div>
                    <div class="barra-fundo-prob">
                        <div class="barra-fill manter" :style="{ width: dadosFusaoPreview.chances.manter + '%' }"></div>
                    </div>
                </div>

                <div class="linha-probabilidade" v-if="dadosFusaoPreview.chances.downgrade > 0">
                    <div class="label-prob">
                        <span>⬇️ DOWNGRADE</span>
                        <strong>{{ dadosFusaoPreview.chances.downgrade }}%</strong>
                    </div>
                    <div class="barra-fundo-prob">
                        <div class="barra-fill downgrade" :style="{ width: dadosFusaoPreview.chances.downgrade + '%' }"></div>
                    </div>
                </div>
            </div>
            
            <p v-if="dadosFusaoPreview.chances.travado" class="aviso-travado">
                ⚠️ Upgrade bloqueado pelo nível do Sindicato!
            </p>

            <div class="botoes-demissao">
                <button class="btn-cancelar-demissao" @click="dadosFusaoPreview = null">Cancelar</button>
                <button class="btn-confirmar-demissao" style="background: #27ae60; box-shadow: 0 4px 0 #1e8449;" @click="dadosFusaoPreview.confirmar()">
                    CONFIRMAR
                </button>
            </div>
        </div>
    </div>
    <div v-if="modalTrocaLista" class="modal-overlay" style="z-index: 2100;">
        <div class="modal-content animacao-entrada modal-largo" style="max-height: 90vh; overflow-y: auto;">
            <h3 style="color: #e67e22; text-align: center;">🏛️ PREFEITURA LOTADA</h3>
            <p style="text-align: center; margin-bottom: 15px;">Para a entrada do novo, alguém deve sair.</p>

            <div class="novo-candidato-container">
                <div class="card-funcionario" style="width: 245px; border-color: #3498db; box-shadow: 0 0 15px rgba(52, 152, 219, 0.4);">
                     <div class="card-topo" :style="{ backgroundColor: corTier(modalTrocaLista.novo.tier) }">
                        <span class="tier-badge">{{ modalTrocaLista.novo.tier }}</span>
                        <span class="card-nome">{{ modalTrocaLista.novo.nome }}</span>
                        <img :src="`/assets/ui/i_${modalTrocaLista.novo.profissao}.png`" class="icone-topo-card">
                    </div>
                    <div class="card-mid">
                        <img v-if="modalTrocaLista.novo.imagem" :src="`/assets/faces/${modalTrocaLista.novo.raca}/${modalTrocaLista.novo.imagem}.png`" class="avatar-func">
                        <div class="card-corpo">
                            <div><strong>Profissão:</strong> {{ nomeProfissao(modalTrocaLista.novo) }}</div>
                            <div><strong>Raça:</strong> {{ formatarRaca(modalTrocaLista.novo.raca) }}</div>
                            <div v-if="labelsEspeciais[modalTrocaLista.novo.profissao]" class="info-linha">
    <strong>{{ labelsEspeciais[modalTrocaLista.novo.profissao] }}: </strong> 
    <span class="stat-container" @click.stop="toggleTooltip('troca_novo')">
        <span :style="{ color: obterBuffRaca(modalTrocaLista.novo) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(modalTrocaLista.novo) > 0 ? 'bold' : 'normal' }">
            {{ getStatReal(modalTrocaLista.novo) }}{{ modalTrocaLista.novo.profissao === 'gerente' ? '' : '%' }}
        </span>
        <div v-if="tooltipAberto === 'troca_novo' && obterBuffRaca(modalTrocaLista.novo) > 0" class="balao-flutuante">
            Base: {{ getInfoTooltip(modalTrocaLista.novo).original }}<br>
            Bônus: +{{ getInfoTooltip(modalTrocaLista.novo).ganho }}
        </div>
    </span>
</div>
<div v-else class="info-linha">
    <strong>Bônus: </strong> 
    <span class="stat-container" @click.stop="toggleTooltip('troca_novo_prod')">
        <span :style="{ color: obterBuffRaca(modalTrocaLista.novo) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(modalTrocaLista.novo) > 0 ? 'bold' : 'normal' }">
            {{ Math.floor(((modalTrocaLista.novo.bonus * (1 + (obterBuffRaca(modalTrocaLista.novo) / 100))) - 1) * 100) }}%
        </span>
        <div v-if="tooltipAberto === 'troca_novo_prod' && obterBuffRaca(modalTrocaLista.novo) > 0" class="balao-flutuante">
            Base: {{ getInfoTooltip(modalTrocaLista.novo, 'producao').original }}%<br>
            Bônus: +{{ getInfoTooltip(modalTrocaLista.novo, 'producao').ganho }}%
        </div>
    </span>
</div>
                        </div>
                    </div>
                    <button class="btn-cancelar-demissao" 
                            style="border-radius: 0 0 5px 5px; width: 100%; margin: 0; padding: 8px;" 
                            @click="modalTrocaLista = null">
                        DISPENSAR
                    </button>
                </div>
            </div>

            <hr class="divisor-secao">
            <h4 style="text-align: center; margin: 10px 0; color: #7f8c8d;">Selecione quem substituir:</h4>

            <div class="grid-atuais">
                <div v-for="func in modalTrocaLista.lista" :key="func.id" 
                     class="card-funcionario" 
                     style="width: auto; min-height: auto; font-size: 0.9em;"
                     :style="{ borderColor: corTier(func.tier) }">
                    
                    <div class="card-topo" style="padding: 4px;" :style="{ backgroundColor: corTier(func.tier) }">
                        <span class="tier-badge" style="font-size: 0.8em; width: 20px; height: 20px; line-height: 20px;">{{ func.tier }}</span>
                        <span class="card-nome" style="font-size: 0.9em;">{{ func.nome }}</span>
                        <img :src="`/assets/ui/i_${getNomeImagem(func.profissao)}.png`" class="icone-topo-card" style="width: 18px; height: 18px; right: 4px;">
                    </div>
                    
                    <div class="card-mid" style="padding: 5px;">
                        <img :src="`/assets/faces/${func.raca}/${func.imagem}.png`" class="avatar-func" style="width: 50px; height: 70px;">
                        
                        <div class="card-corpo" style="padding: 0 5px;">                            
                            <div class="info-linha"><strong>Profissão:</strong> {{ nomeProfissao(func) }}</div>
                            <div class="info-linha"><strong>Raça:</strong> {{ formatarRaca(func.raca) }}</div>
                            <div v-if="labelsEspeciais[func.profissao]" class="info-linha">
    <strong>{{ labelsEspeciais[func.profissao] }}: </strong> 
    <span class="stat-container" @click.stop="toggleTooltip(func.id + 'troca')">
        <span :style="{ color: obterBuffRaca(func) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(func) > 0 ? 'bold' : 'normal' }">
            {{ getStatReal(func) }}{{ func.profissao === 'gerente' ? '' : '%' }}
        </span>
        <div v-if="tooltipAberto === (func.id + 'troca') && obterBuffRaca(func) > 0" class="balao-flutuante">
            Base: {{ getInfoTooltip(func).original }}<br>
            Bônus: +{{ getInfoTooltip(func).ganho }}
        </div>
    </span>
</div>

<div v-else class="info-linha">
    <strong>Bônus: </strong> 
    <span class="stat-container" @click.stop="toggleTooltip(func.id + 'troca_prod')">
        <span :style="{ color: obterBuffRaca(func) > 0 ? '#2ecc71' : 'inherit', fontWeight: obterBuffRaca(func) > 0 ? 'bold' : 'normal' }">
            {{ Math.floor(((func.bonus * (1 + (obterBuffRaca(func) / 100))) - 1) * 100) }}%
        </span>
        <div v-if="tooltipAberto === (func.id + 'troca_prod') && obterBuffRaca(func) > 0" class="balao-flutuante">
            Base: {{ getInfoTooltip(func, 'producao').original }}%<br>
            Bônus: +{{ getInfoTooltip(func, 'producao').ganho }}%
        </div>
    </span>
</div>
                        </div>
                    </div>

                    <button class="btn-trocar-mini" @click="realizarTrocaLista(func)">
                        Substituir
                    </button>
                </div>
            </div>
            
            </div>
    </div>
    <!-- Modal de detalhes da profissão -->
    <div v-if="modalDetalheProf" class="modal-overlay" style="z-index: 3000;" @click.self="modalDetalheProf = null">
        <div class="modal-content animacao-entrada" :style="{ borderTop: '5px solid ' + (jogo.taverna < modalDetalheProf.req ? '#7f8c8d' : '#3498db') }">
            
            <h3 style="margin-bottom: 5px;">{{ modalDetalheProf.nome }}</h3>
            
            <div style="margin: 15px 0;">
                <img :src="`/assets/ui/i_${getNomeImagem(modalDetalheProf.id)}.png`" style="width: 64px; height: 64px; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3));">
            </div>

            <div v-if="jogo.taverna < modalDetalheProf.req" class="aviso-travado" style="margin-bottom: 15px;">
                🔒 Desbloqueia no Sindicato Nível {{ modalDetalheProf.req }}
            </div>

            <div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 0.9em; color: #2c3e50;">
                <p style="margin-bottom: 10px;"><strong>📜 Função:</strong><br>{{ modalDetalheProf.desc }}</p>
                <p><strong>✨ Atributo Especial:</strong><br>{{ modalDetalheProf.stat }}</p>
            </div>

            <button class="btn-receber" style="margin-top: 15px; background: #34495e;" @click="modalDetalheProf = null">
                Fechar
            </button>
        </div>
    </div>
</template>

<style scoped>
    @import '../css/taverna.css';
    </style>