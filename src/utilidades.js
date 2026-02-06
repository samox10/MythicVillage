// 1. O Mestre do Tempo (Transforma segundos em texto legível)
// Serve para: Enfermaria, Construções da Cidade, Forja, etc.
export const formatarTempo = (segundos) => {
    if (!segundos) return '0s';
    
    const s = Math.ceil(segundos); // Arredonda para não ficar 0.5s
    
    // Se for rapidinho (menos de 1 minuto)
    if (s < 60) return `${s}s`;

    // Se for médio (menos de 1 hora)
    if (s < 3600) {
        const m = Math.floor(s / 60);
        const rest = s % 60;
        return `${m}:${rest.toString().padStart(2, '0')}`; // Ex: 5:04
    }

    // Se for demorado (horas)
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m.toString().padStart(2, '0')}m`; // Ex: 1h 05m
};

// 2. O Contador de Dinheiro (Coloca os pontinhos: 1.000, 1.000.000)
// Serve para: Ouro, Preços, Quantidades no Inventário.
export const formatarNumero = (valor) => {
    if (!valor) return '0';
    return Number(valor).toLocaleString('pt-BR');
};

// 3. O Pintor de Recursos (Encontra a imagem certa do minério)
// Serve para: Mina, App.vue (sidebar), Ferraria.
export const getImagemMinerio = (id) => {
    if (!id) return '';
    // Remove o sufixo "_min" se existir, para evitar erro de nome duplo
    const nomeLimpo = id.replace('_min', '');
    return `/assets/recursos/min_${nomeLimpo}.png`;
};