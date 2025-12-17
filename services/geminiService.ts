import { GoogleGenAI } from "@google/genai";

// Fix for TS2580: Declare process for TypeScript since it's replaced by Vite at build time
declare const process: {
  env: {
    API_KEY: string;
  }
};

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const askAIPharmacist = async (question: string, contextMeds: string): Promise<string> => {
  if (!apiKey) return "Error: API Key no configurada.";

  try {
    const systemInstruction = `
      Ets un assistent farmacèutic útil i amable anomenat "MediBot".
      L'usuari et farà preguntes sobre medicaments o salut.
      Respon sempre en Català.
      Sigues concís, clar i professional.
      Si la pregunta és sobre interaccions, utilitza la llista de medicaments actuals de l'usuari com a context.
      
      Important: Afegeix sempre un descàrrec de responsabilitat breu dient que això no és consell mèdic professional.
      
      Llista de medicaments de l'usuari: ${contextMeds}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: question,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 } // Optimize for speed
      }
    });

    return response.text || "No he pogut generar una resposta.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ho sento, hi ha hagut un error en connectar amb el servei d'IA.";
  }
};