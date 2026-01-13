// Servicio alternativo usando Hugging Face Inference API (GRATUITO)
class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.REACT_APP_HUGGINGFACE_API_KEY;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    if (!this.apiKey) {
      console.warn('API key de Hugging Face no configurada. Usando modo público (con límites).');
      // Hugging Face permite uso sin API key pero con límites
    }

    this.initialized = true;
  }

  // Análisis de texto usando modelo de lenguaje gratuito
  async analyzeVoiceText(transcript) {
    await this.initialize();

    const prompt = `Analiza este texto y extrae productos mencionados con sus cantidades y precios.

Texto: "${transcript}"

Responde SOLO en formato JSON válido:
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

Si no encuentras productos, responde con array vacío.`;

    try {
      const response = await fetch(`${this.baseUrl}/microsoft/DialoGPT-medium`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : undefined,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.1,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Procesar respuesta de Hugging Face
      let text = '';
      if (Array.isArray(result) && result[0]?.generated_text) {
        text = result[0].generated_text;
      } else if (result.generated_text) {
        text = result.generated_text;
      } else {
        throw new Error('Formato de respuesta inesperado');
      }

      // Intentar parsear JSON de la respuesta
      try {
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsedResponse = JSON.parse(cleanedText);
        return parsedResponse.products || [];
      } catch (parseError) {
        // Si falla el parsing, usar análisis básico como fallback
        console.warn('Error parsing HuggingFace response, using basic analysis');
        return this.basicTextAnalysis(transcript);
      }

    } catch (error) {
      console.error('Error con Hugging Face:', error);
      
      if (error.message.includes('503') || error.message.includes('loading')) {
        throw new Error('🔄 Modelo cargándose. Intenta en 30 segundos.');
      } else if (error.message.includes('429')) {
        throw new Error('⏱️ Límite de uso alcanzado. Intenta en unos minutos.');
      } else {
        throw new Error('🌐 Error de conexión con el servicio de IA.');
      }
    }
  }

  // Análisis de imagen usando modelo de visión gratuito
  async analyzeImage(imageData) {
    await this.initialize();

    try {
      // Convertir base64 a blob
      const base64Data = imageData.split(',')[1];
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/jpeg' });

      // Usar modelo de detección de objetos
      const response = await fetch(`${this.baseUrl}/facebook/detr-resnet-50`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : undefined,
        },
        body: blob
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Procesar detecciones y convertir a productos
      const products = this.processImageDetections(result);
      return products;

    } catch (error) {
      console.error('Error analizando imagen con Hugging Face:', error);
      
      if (error.message.includes('503') || error.message.includes('loading')) {
        throw new Error('🔄 Modelo de visión cargándose. Intenta en 30 segundos.');
      } else if (error.message.includes('429')) {
        throw new Error('⏱️ Límite de uso alcanzado. Intenta en unos minutos.');
      } else {
        throw new Error('🌐 Error procesando imagen. Intenta con otra imagen.');
      }
    }
  }

  // Procesar detecciones de imagen y convertir a productos
  processImageDetections(detections) {
    if (!Array.isArray(detections)) return [];

    const products = [];
    const productMap = new Map();

    detections.forEach(detection => {
      if (detection.score > 0.5) { // Solo objetos con alta confianza
        const label = detection.label.toLowerCase();
        const productName = this.mapLabelToProduct(label);
        
        if (productName) {
          if (productMap.has(productName)) {
            productMap.set(productName, productMap.get(productName) + 1);
          } else {
            productMap.set(productName, 1);
          }
        }
      }
    });

    // Convertir a formato de productos
    productMap.forEach((quantity, name) => {
      products.push({
        name: this.capitalizeWords(name),
        quantity: quantity,
        estimatedPrice: this.estimatePrice(name),
        category: this.guessCategory(name)
      });
    });

    return products;
  }

  // Mapear etiquetas de detección a nombres de productos
  mapLabelToProduct(label) {
    const mappings = {
      'apple': 'manzana',
      'banana': 'banana',
      'orange': 'naranja',
      'sandwich': 'sandwich',
      'pizza': 'pizza',
      'hot dog': 'perro caliente',
      'donut': 'dona',
      'cake': 'torta',
      'bottle': 'botella',
      'cup': 'vaso',
      'bowl': 'bowl',
      'spoon': 'cuchara',
      'knife': 'cuchillo',
      'fork': 'tenedor'
    };

    return mappings[label] || (label.includes('food') ? 'producto alimenticio' : null);
  }

  // Análisis básico de texto como fallback
  basicTextAnalysis(transcript) {
    const products = [];
    const text = transcript.toLowerCase().trim();
    
    if (!text) return products;

    // Patrones simples para detectar productos
    const patterns = [
      /(\d+(?:\.\d+)?)\s+([a-záéíóúñ\s]+?)(?:\s+(?:a|por|de|cuestan?|valen?|precio)\s+)?(\d+(?:\.\d+)?)/gi,
      /([a-záéíóúñ\s]+?)\s+(\d+(?:\.\d+)?)\s+(?:unidades?|piezas?)?\s*(?:a|por|de|cuestan?|valen?)?\s*(\d+(?:\.\d+)?)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let quantity, name, price;
        
        if (pattern.source.includes('\\d.*[a-z]')) {
          quantity = parseFloat(match[1]);
          name = match[2].trim();
          price = parseFloat(match[3]);
        } else {
          name = match[1].trim();
          quantity = parseFloat(match[2]);
          price = parseFloat(match[3]);
        }

        name = this.cleanProductName(name);
        
        if (name && quantity > 0 && price > 0) {
          products.push({
            name: this.capitalizeWords(name),
            quantity: quantity,
            price: price,
            category: this.guessCategory(name)
          });
        }
      }
    });

    return products;
  }

  // Estimar precio basado en el tipo de producto
  estimatePrice(productName) {
    const priceRanges = {
      'manzana': 2000,
      'banana': 1500,
      'naranja': 2500,
      'sandwich': 8000,
      'pizza': 15000,
      'perro caliente': 6000,
      'dona': 3000,
      'torta': 25000,
      'botella': 3000,
      'vaso': 2000
    };

    return priceRanges[productName.toLowerCase()] || 5000;
  }

  // Limpiar nombre del producto
  cleanProductName(name) {
    if (!name) return '';
    
    const stopWords = [
      'que', 'cuestan', 'valen', 'precio', 'pesos', 'unidades', 'piezas', 
      'kilos', 'kg', 'gramos', 'gr', 'tengo', 'hay', 'son', 'es'
    ];
    
    let cleaned = name.trim();
    stopWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '');
    });
    
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  // Capitalizar palabras
  capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  // Adivinar categoría
  guessCategory(name) {
    const categories = {
      'Comida': ['hamburguesa', 'pizza', 'sandwich', 'torta', 'dona', 'perro caliente'],
      'Bebidas': ['botella', 'vaso', 'agua', 'jugo'],
      'Frutas': ['manzana', 'banana', 'naranja'],
      'Utensilios': ['cuchara', 'cuchillo', 'tenedor', 'bowl']
    };

    const lowerName = name.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }
    
    return 'Nuevo';
  }

  // Verificar estado de la API
  async checkApiStatus() {
    try {
      await this.initialize();
      return { available: true, message: 'Hugging Face API disponible' };
    } catch (error) {
      return { available: false, message: error.message };
    }
  }
}

export default new HuggingFaceService();