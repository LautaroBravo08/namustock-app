// Script de prueba para verificar la integración de IA
// Ejecutar con: node test-ai-integration.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'AIzaSyBjOHlQnh9oMs7RV4IrEJSik0AELCQsQTQ';

async function testGeminiConnection() {
  try {
    console.log('🧪 Probando conexión con Gemini...');
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Analiza este texto de prueba y extrae productos:
"Tengo 3 hamburguesas a 5000 pesos cada una y 2 pizzas grandes a 8000"

Responde ÚNICAMENTE en formato JSON:
{
  "products": [
    {
      "name": "nombre del producto",
      "quantity": número,
      "price": número,
      "category": "categoría"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Respuesta de Gemini:');
    console.log(text);

    // Intentar parsear JSON
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      console.log('✅ JSON parseado correctamente:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (parseError) {
      console.log('⚠️ Error parseando JSON:', parseError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGeminiConnection();