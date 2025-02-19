require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const { HarmBlockThreshold, HarmCategory } = require("@google/generative-ai")

// Configuração do modelo com safetySettings personalizados
const safetySetting = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE
    },
];

// Modelo da  API
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings: safetySetting,
});

async function obterResposta(prompt) {
    try {
        const resposta = await model.generateContent(prompt);
        return resposta.response.text();
    } catch (error) {
        console.error("Erro ao chamar a Gemini AI:", error);
        return "Desculpe, houve um erro ao processar sua solicitação.";
    }
}

module.exports = { obterResposta };