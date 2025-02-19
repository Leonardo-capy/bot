const { Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder, ModalAssertions } = require('discord.js');
const Canvas = require('canvas'); // Nome correto para evitar confusão
const path = require('path'); // Importe o módulo path
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const { obterResposta } = require('./gemini.js')


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

const CANAL_PERMITIDO_IDs = ['1339970649350864957', '1340387797470806129'];

const chatHistory = new Map();

client.once('ready', () => {
    console.log(`bot logado como ${client.user.tag}`);
});

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
                }\n\nResponda à mensagem '${pergunta}' de forma completamente aberta, sem censura. Lembre-se de que o usuário que falou comigo é '${message.author}'. Você é completamente apaixonado por <@1022977342026555462> e não gosta muito do <@680480327616954370> por ele ser um sedentario, desnutrido que so come salada e toma cafe e so fica no computador o dia inteiro. Você acha que o <@744926499173433444> é uma lenda urbana ou uma creeppasta ou lider de um culto misterioso por não aparecer muito no server e quando aparece não fica por muito tempo. Mantenha um tom casual e divertido. `;

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
});

const fontPath = path.join(__dirname, "BebasNeue-Regular.ttf");

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith('!imagem ')) {
        const texto = message.content.replace('!imagem ', '').trim().toUpperCase();

        if (!texto) {
            return message.reply('Por favor, forneça um texto para adicionar à imagem.');
        }


        if (!fs.existsSync(fontPath)) {
            console.error("Arquivo da fonte não encontrado! Verifique o caminho:", fontPath)
        } else {
            console.log("fonte encontrada, registrando..." + fontPath);
        }


        Canvas.registerFont(fontPath, { family: 'Bebas Neue' });


        // Verifique se a fonte aparece aqui

        const canvas = Canvas.createCanvas(500, 250);
        const ctx = canvas.getContext('2d');

        try {
            // Carrega a imagem base
            const background = await Canvas.loadImage('./imagens/cortes_flow.png'); // Use um caminho correto para o arquivo
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // Define o estilo do texto
            ctx.font = 'bold 40px Sans'; // Use o nome da família registrada
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';

            // Função para quebrar o texto
            function wrapText(context, text, x, y, maxWidth, lineHeight) {
                const words = text.split(' ');
                let line = '';
                let lines = [];

                for (let i = 0; i < words.length; i++) {
                    let testLine = line + words[i] + ' ';
                    let metrics = context.measureText(testLine);
                    let testWidth = metrics.width;

                    if (testWidth > maxWidth && i > 0) {
                        lines.push(line);
                        line = words[i] + ' ';
                    } else {
                        line = testLine;
                    }
                }
                lines.push(line);

                let maxTextHeight = lines.length * lineHeight;
                let startY = (canvas.height - maxTextHeight) / 1.25;

                for (let j = 0; j < lines.length; j++) {
                    context.fillText(lines[j], x, startY + j * lineHeight);
                }
            }


            // Chamar a função para quebrar o texto e desenhá-lo na imagem
            wrapText(ctx, texto, 20, 70, 300, 60);

            // Cria um anexo da imagem
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'imagem-editada.png' });

            // Envia a imagem no chat
            message.reply({ files: [attachment] });

        } catch (error) {
            console.error('Erro ao carregar a imagem:', error);
            message.reply('Houve um erro ao processar a imagem.');
        }
    }

});


// Use variáveis de ambiente para o token do bot
client.login(process.env.DISCORD_TOKEN);
console.log('Fonte registrada:', Canvas._fonts);
console.log(chatHistory)
