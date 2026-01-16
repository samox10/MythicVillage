<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Idle RPG</title>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <style>
        body { font-family: sans-serif; background-color: #222; color: #fff; padding: 20px; }
        .game-container { max-width: 600px; margin: 0 auto; border: 1px solid #444; padding: 20px; border-radius: 8px; }
        button { padding: 10px 20px; font-size: 16px; cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 4px; }
        button:hover { background-color: #45a049; }
        .stats { margin-bottom: 20px; }
    </style>
</head>
<body>

<div id="app">
    <div class="game-container">
        <h1>{{ tituloDoJogo }}</h1>
        
        <div class="stats">
            <p>Ouro: {{ ouro }}</p>
            <p>Nível: {{ nivel }}</p>
        </div>

        <button @click="coletarOuro">Explorar (Ganhar Ouro)</button>
        
        <div v-if="ouro >= custoUpgrade" style="margin-top: 10px;">
            <button @click="comprarUpgrade" style="background-color: #008CBA;">
                Melhorar Equipamento (Custo: {{ custoUpgrade }})
            </button>
        </div>
    </div>
</div>

<script>
    const { createApp, ref } = Vue;

    createApp({
        setup() {
            const tituloDoJogo = ref('Aventura Idle');
            const ouro = ref(0);
            const nivel = ref(1);
            const custoUpgrade = ref(10);

            const coletarOuro = () => {
                ouro.value += 1 * nivel.value;
            };

            const comprarUpgrade = () => {
                if (ouro.value >= custoUpgrade.value) {
                    ouro.value -= custoUpgrade.value;
                    nivel.value++;
                    custoUpgrade.value = Math.floor(custoUpgrade.value * 1.5);
                }
            };

            return {
                tituloDoJogo,
                ouro,
                nivel,
                custoUpgrade,
                coletarOuro,
                comprarUpgrade
            }
        }
    }).mount('#app');
</script>

</body>
</html>