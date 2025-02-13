require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function obterResposta(prompt){
    try {
        const model = genAI.getGenerativeModel({model: "gemini-pro"});
        const resposta = await model.generateContent(prompt);
        return resposta.response.text();
    } catch (error) {
        console.error("Erro ao chamar a Gemini AI", error);
        return "Desculpe, houve um erro ao processar sua solicitação."
    }
}

module.exports = { obterResposta };
