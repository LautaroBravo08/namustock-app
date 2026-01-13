import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    if (!this.apiKey) {
      throw new Error('API key de Gemini no configurada. Agrega REACT_APP_GEMINI_API_KEY a tu archivo .env');
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.initialized = true;
    } catch (error) {
      console.error('Error inicializando Gemini:', error);
      throw error;
    }
  }

  async analyzeImage(imageData) {
    try {
      await this.initialize();

      const prompt = `
Analiza esta imagen y extrae información de productos que puedas identificar.
Para cada producto que veas, proporciona:
- Nombre del producto (descriptivo y específico)
- Cantidad estimada (número de unidades visibles)
- Precio estimado en pesos colombianos (basado en el tipo de producto)
- Categoría del producto

Responde ÚNICAMENTE en formato JSON válido con esta estructura:
{
  "products": [
    {
      "name": "nombre del producto",
      "quantity": número,
      "estimatedPrice": número,
      "category": "categoría"
    }
  ]
}

Si no puedes identificar productos claramente, responde con un array vacío.
NO agregues texto adicional, solo el JSON.
`;

      // Convertir la imagen a formato que Gemini puede procesar
      const imagePart = {
        inlineData: {
          data: imageData.split(',')[1], // Remover el prefijo data:image/...;base64,
          mimeType: 'image/jpeg'
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Limpiar la respuesta y parsear JSON
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsedResponse = JSON.parse(cleanedText);

      return parsedResponse.products || [];
    } catch (error) {
      console.error('Error analizando imagen con Gemini:', error);
      
      // Manejo específico de errores de API
      if (error.message.includes('API_KEY_SERVICE_BLOCKED') || error.message.includes('403')) {
        throw new Error('🚫 Servicio de IA temporalmente no disponible. La API de Gemini está bloqueada o ha excedido los límites de uso. Intenta más tarde o contacta al administrador.');
      } else if (error.message.includes('API key')) {
        throw new Error('🔑 API key de Gemini no válida. Verifica la configuración.');
      } else if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
        throw new Error('📊 Límite de uso de IA alcanzado. Intenta más tarde.');
      } else if (error.message.includes('JSON')) {
        throw new Error('🔄 Error procesando la respuesta de la IA. Intenta con otra imagen.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('🌐 Error de conexión. Verifica tu internet e inténtalo de nuevo.');
      } else {
        throw new Error('❌ Error al analizar la imagen. El servicio de IA no está disponible temporalmente.');
      }
    }
  }

  async analyzeVoiceText(transcript) {
    try {
      await this.initialize();

      const prompt = `
Analiza este texto transcrito de voz y extrae información de productos mencionados.
El usuario puede mencionar productos de diferentes formas, por ejemplo:
- "3 hamburguesas a 5000 pesos"
- "tengo 5 milanesas que cuestan 3000"
- "2 empanadas 1500 cada una"
- "pizza grande 8000"

Para cada producto mencionado, extrae:
- Nombre del producto
- Cantidad mencionada
- Precio mencionado (en pesos colombianos)
- Categoría estimada del producto

Texto a analizar: "${transcript}"

Responde ÚNICAMENTE en formato JSON válido con esta estructura:
{
  "products": [
    {
      "name": "nombre del producto",
      "quantity": número,
      "price": número,
      "category": "categoría estimada"
    }
  ]
}

Si no puedes identificar productos claramente, responde con un array vacío.
NO agregues texto adicional, solo el JSON.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Limpiar la respuesta y parsear JSON
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsedResponse = JSON.parse(cleanedText);

      return parsedResponse.products || [];
    } catch (error) {
      console.error('Error analizando texto con Gemini:', error);
      
      // Manejo específico de errores de API
      if (error.message.includes('API_KEY_SERVICE_BLOCKED') || error.message.includes('403')) {
        throw new Error('🚫 Servicio de IA temporalmente no disponible. La API de Gemini está bloqueada o ha excedido los límites de uso. Intenta más tarde o contacta al administrador.');
      } else if (error.message.includes('API key')) {
        throw new Error('🔑 API key de Gemini no válida. Verifica la configuración.');
      } else if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
        throw new Error('📊 Límite de uso de IA alcanzado. Intenta más tarde.');
      } else if (error.message.includes('JSON')) {
        throw new Error('🔄 Error procesando la respuesta de la IA. Intenta reformular tu mensaje.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('🌐 Error de conexión. Verifica tu internet e inténtalo de nuevo.');
      } else {
        throw new Error('❌ Error al analizar el texto. El servicio de IA no está disponible temporalmente.');
      }
    }
  }

  // Método para verificar el estado de la API
  async checkApiStatus() {
    try {
      await this.initialize();
      // Hacer una prueba simple con la API
      const result = await this.model.generateContent('Test');
      return { available: true, message: 'API funcionando correctamente' };
    } catch (error) {
      console.error('API Status Check Error:', error);
      if (error.message.includes('API_KEY_SERVICE_BLOCKED') || error.message.includes('403')) {
        return { available: false, message: 'API bloqueada o límites excedidos' };
      } else if (error.message.includes('API key')) {
        return { available: false, message: 'API key inválida' };
      } else {
        return { available: false, message: 'API no disponible' };
      }
    }
  }

  // Métodos adicionales para compatibilidad con componentes existentes
  async generateContent(prompt) {
    await this.initialize();
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generando contenido con Gemini:', error);
      throw error;
    }
  }

  async generateContentWithImage(prompt, imageData) {
    await this.initialize();

    try {
      const imagePart = {
        inlineData: {
          data: imageData.split(',')[1],
          mimeType: 'image/jpeg'
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generando contenido con imagen:', error);
      throw error;
    }
  }
}

export default new GeminiService();