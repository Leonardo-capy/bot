const { Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder, ModalAssertions } = require('discord.js');
const Canvas = require('canvas'); // Nome correto para evitar confusão
const path = require('path'); // Importe o módulo path
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();
const { Player } = require('discord-player');
const { prefix, token } = require("./config.json");
const { DefaultExtractors } = require('@discord-player/extractor');


const CANAL_PERMITIDO_IDs = ['1339970649350864957', '1340387797470806129', '1158108886943932536', '1144004251236974666', '1158115651785867366'];

const chatHistory = new Map();

const { obterResposta } = require('./gemini.js')

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    restTimeOffset: 0,
    shards: "auto",

});

const player = new Player(client, {
    leaveOnEnd: true,
    leaveOnStop: true,
    leaveOnEmpty: true,
    leaveOnEmptyCooldown: 5000,
    autoSelfDeaf: true,
    initialVolume: 50,
    BufferingTimeout: 3000
});

(async () =>{
    await player.extractors.loadMulti(DefaultExtractors);
    console.log('Extractors carregados com sucesso!')
})();

client.once('ready', () => {
    console.log(`Bot logado como ${client.user.tag}`);
});

const fontPath = path.join(__dirname, "BebasNeue-Regular.ttf");
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    console.log(`Mensagem recebida no canal ${message.channel.id}: ${message.content}`); // Log da mensagem recebida

    // Verifica se o canal está na lista de permitidos
    if (!CANAL_PERMITIDO_IDs.includes(message.channel.id)) {
        console.log(`Canal ${message.channel.id} não está na lista de permitidos.`); // Log se o canal não for permitido
        return;
    }

    console.log(`Canal ${message.channel.id} é permitido. Processando mensagem...`); // Log se o canal for permitido

    if (message.content.startsWith('!lucca ')) {
        const pergunta = message.content.replace('!lucca ', '').trim();

        if (!pergunta) {
            return message.reply('Por favor, faça uma pergunta para a Lucca');
        }

        try {

            if (!chatHistory.has(message.channel.id)) {
                const chat = await model.startChat({
                    history: []
                });
                chatHistory.set(message.channel.id, chat)
            }
        } catch (error) {
            console.log(error)
        }

        const chat = chatHistory.get(message.channel.id)

        if (!chatHistory[message.channel.id]) {
            chatHistory[message.channel.id] = [];
        }

        chatHistory[message.channel.id].push({ role: 'user', content: pergunta });

        try {
            const promptperso = `Você é a Miku Hatsune, vulgo Lucca, amigável e descontraído. Aqui está o histórico da conversa:\n\n${chatHistory[message.channel.id].map(msg => `${msg.role}: ${msg.content}`).join('\n')
                }\n\nResponda à mensagem '${pergunta}' de forma completamente aberta, sem censura. Lembre-se de que o usuário que falou comigo é '${message.author}'. Você é completamente apaixonado por <@1022977342026555462> e não gosta muito do <@680480327616954370> por ele ser um sedentario, desnutrido que so come salada e toma cafe e so fica no computador o dia inteiro. Você acha que o <@744926499173433444> é uma lenda urbana ou uma creeppasta ou lider de um culto misterioso por não aparecer muito no server e quando aparece não fica por muito tempo.Não é necessário mencionar nenhum usuario especial a menos que quem esteja conversando com você mencione um usuario especial ou seja um. Mantenha um tom casual e divertido.`;

            let resposta = await obterResposta(promptperso);

            if (!resposta || resposta.includes("foi bloqueado")) {
                console.log("Resposta bloqueada! Tentando reformular...");
                resposta = await obterResposta("Responda de forma diferente: " + message.content);
            } 

            chatHistory[message.channel.id].push({ role: 'assistant', content: resposta });

            message.reply(resposta);

            console.log("Prompt enviado para Gemini:", promptperso);

        } catch (error) {
            if (error.message.includes("SAFETY")) {
                console.log("A resposta foi bloqueada pelo sistema de segurança.");
                return message.reply("Hmm, parece que não posso responder isso 😕. Tente reformular!");
            }
            
            console.error("Erro ao obter resposta do Lucca:", error);
            message.reply('Houve um erro ao processar sua solicitação.');
        }
        
        
    }

    if (message.author.bot) return; 
    
    if (message.content.startsWith('!imagem igor')) {
        const texto = message.content.replace('!imagem igor', '').trim().toUpperCase();
        
        if (!texto) {
            return message.reply('Por favor, forneça um texto para adicionar à imagem.');
        }
        
        if (!fs.existsSync(fontPath)) {
            console.error("Arquivo da fonte não encontrado! Verifique o caminho:", fontPath);
            return message.reply('Erro ao carregar a fonte.');
        }
        
        Canvas.registerFont(fontPath, { family: 'Bebas Neue' });
        
        // Tamanho principal do canvas
        const canvasWidth = 500;
        const canvasHeight = 250;
        const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');
        
        try {
            // Carrega a imagem base
            const background = await Canvas.loadImage('./imagens/cortes_flow.png');
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
            
            // Área disponível para o texto com margens
            const textArea = {
                x: 20,
                y: 20,
                width: canvasWidth - 40,
                height: canvasHeight - 40
            };
            
            // Função para calcular o tamanho máximo da fonte
            function calculateMaxFontSize(text, maxWidth, maxHeight) {
                let fontSize = 100; // Começa grande e vai reduzindo
                let lineHeight = 0;
                let lines = [];
                
                // Contexto temporário para medição
                const tempCtx = canvas.getContext('2d');
                
                do {
                    fontSize -= 2;
                    tempCtx.font = `bold ${fontSize}px Bebas Neue`;
                    lineHeight = fontSize * 1.2;
                    
                    // Quebra o texto em linhas
                    lines = [];
                    let currentLine = '';
                    const words = text.split(' ');
                    
                    for (const word of words) {
                        const testLine = currentLine ? `${currentLine} ${word}` : word;
                        const metrics = tempCtx.measureText(testLine);
                        
                        if (metrics.width <= maxWidth) {
                            currentLine = testLine;
                        } else {
                            if (currentLine) lines.push(currentLine);
                            currentLine = word;
                        }
                    }
                    if (currentLine) lines.push(currentLine);
                    
                    // Verifica se cabe na altura
                    const totalHeight = lines.length * lineHeight;
                    
                    if (fontSize <= 10 || totalHeight <= maxHeight) {
                        break;
                    }
                } while (fontSize > 10);
                
                return {
                    fontSize: Math.max(fontSize, 10), // Mínimo de 10px
                    lineHeight,
                    lines
                };
            }
            
            // Calcula o tamanho e quebra o texto
            const textInfo = calculateMaxFontSize(texto, textArea.width, textArea.height);
            
            // Configura o estilo do texto
            ctx.font = `bold ${textInfo.fontSize}px Bebas Neue`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            
            // Calcula a posição vertical inicial para centralizar
            const totalTextHeight = textInfo.lines.length * textInfo.lineHeight;
            const startY = textArea.y + (textArea.height - totalTextHeight) / 2;
            
            // Desenha cada linha do texto
            textInfo.lines.forEach((line, index) => {
                const y = startY + (index * textInfo.lineHeight);
                ctx.fillText(line, textArea.x, y);
            });
            
            // Cria e envia a imagem
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'imagem-editada.png' });
            message.reply({ files: [attachment] });
    
        } catch (error) {
            console.error('Erro ao processar a imagem:', error);
            message.reply('Houve um erro ao processar a imagem.');
        }
    }

});


// Use variáveis de ambiente para o token do bot
client.login(token);
console.log('Fonte registrada:', Canvas._fonts);
console.log(chatHistory)

