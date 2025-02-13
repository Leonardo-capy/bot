const { Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const Canvas = require('canvas'); // Nome correto para evitar confusão
const path = require('path'); // Importe o módulo path
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

client.once('ready', () => {
    console.log(`bot logado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith('!imagem ')) {
        const texto = message.content.replace('!imagem ', '').trim().toUpperCase();

        if (!texto) {
            return message.reply('Por favor, forneça um texto para adicionar à imagem.');
        }

        // Caminho absoluto para a fonte
        const fontPath = path.join(__dirname, 'BebasNeue-Regular.ttf'); // Use dirname para o caminho absoluto
        Canvas.registerFont(fontPath, { family: 'Bebas' }); // Registre a fonte antes de criar o canvas

 // Verifique se a fonte aparece aqui

        const canvas = Canvas.createCanvas(500, 250);
        const ctx = canvas.getContext('2d');

        try {
            // Carrega a imagem base
            const background = await Canvas.loadImage('./imagens/cortes_flow.png'); // Use um caminho correto para o arquivo
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // Define o estilo do texto
            ctx.font = '60px Bebas'; // Use o nome da família registrada
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

client.on('messageCreate', async (message) =>{
    if (message.author.bot) return;

    if (message.content.startsWith('!lucca ')) {
        const pergunta = message.content.replace('!lucca ', '').trim();

        if (!pergunta) {
            return message.reply('Por favor, faça uma pergunta para o Lucca.');
        }

        try {
            let resposta = await obterResposta(promptperso); // Pegando resposta da Gemini
            message.reply(resposta);

            const promptperso = `Responda à mensagem '${message.clearContent}' com tom casual, Lembresse o Usuário que falou comigo é '${client.user.tag}', como se fosse o Lucca`

            

        } catch (error) {
            console.error("Erro ao obter resposta do Lucca:", error);
            message.reply('Houve um erro a buscar uma resposta.');
        }
    }
});

// Use variáveis de ambiente para o token do bot
client.login(process.env.DISCORD_TOKEN);
console.log('Fonte registrada:', Canvas._fonts);