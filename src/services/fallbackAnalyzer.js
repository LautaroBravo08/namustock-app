// Analizador de fallback cuando la IA no está disponible
class FallbackAnalyzer {
  
  // Análisis básico de texto de voz sin IA
  analyzeVoiceText(transcript) {
    const products = [];
    const text = transcript.toLowerCase().trim();
    
    if (!text) return products;

    // Patrones comunes para detectar productos
    const patterns = [
      // "3 hamburguesas a 5000" o "3 hamburguesas 5000"
      /(\d+(?:\.\d+)?)\s+([a-záéíóúñ\s]+?)(?:\s+(?:a|por|de|cuestan?|valen?|precio)\s+)?(\d+(?:\.\d+)?)/gi,
      // "hamburguesas 3 unidades 5000 pesos"
      /([a-záéíóúñ\s]+?)\s+(\d+(?:\.\d+)?)\s+(?:unidades?|piezas?|kilos?|kg)?\s*(?:a|por|de|cuestan?|valen?|precio)?\s*(\d+(?:\.\d+)?)/gi,
      // "tengo 5 milanesas que cuestan 3000"
      /(?:tengo|hay)\s+(\d+(?:\.\d+)?)\s+([a-záéíóúñ\s]+?)(?:\s+que\s+)?(?:cuestan?|valen?|precio)\s+(\d+(?:\.\d+)?)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let quantity, name, price;
        
        if (pattern.source.includes('tengo|hay')) {
          // Patrón "tengo X productos que cuestan Y"
          quantity = parseFloat(match[1]);
          name = match[2].trim();
          price = parseFloat(match[3]);
        } else if (pattern.source.includes('[a-z].*\\d')) {
          // Patrón "producto X unidades Y pesos"
          name = match[1].trim();
          quantity = parseFloat(match[2]);
          price = parseFloat(match[3]);
        } else {
          // Patrón "X productos Y pesos"
          quantity = parseFloat(match[1]);
          name = match[2].trim();
          price = parseFloat(match[3]);
        }

        // Limpiar y validar el nombre del producto
        name = this.cleanProductName(name);
        
        if (name && quantity > 0 && price > 0) {
          // Evitar duplicados
          const exists = products.find(p => 
            p.name.toLowerCase() === name.toLowerCase()
          );
          
          if (!exists) {
            products.push({
              name: this.capitalizeWords(name),
              quantity: quantity,
              price: price,
              category: this.guessCategory(name)
            });
          }
        }
      }
    });

    return products;
  }

  // Limpiar nombre del producto
  cleanProductName(name) {
    if (!name) return '';
    
    // Remover palabras comunes que no son parte del producto
    const stopWords = [
      'que', 'cuestan', 'valen', 'precio', 'pesos', 'unidades', 'piezas', 
      'kilos', 'kg', 'gramos', 'gr', 'litros', 'ml', 'tengo', 'hay',
      'son', 'es', 'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas'
    ];
    
    let cleaned = name.trim();
    stopWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '');
    });
    
    // Limpiar espacios múltiples y caracteres especiales
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  // Capitalizar palabras
  capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  // Adivinar categoría basada en palabras clave
  guessCategory(name) {
    const categories = {
      'Comida': [
        'hamburguesa', 'pizza', 'empanada', 'milanesa', 'sandwich', 'torta',
        'pastel', 'pan', 'arepa', 'tamal', 'pollo', 'carne', 'pescado',
        'ensalada', 'sopa', 'pasta', 'arroz', 'papas', 'patatas'
      ],
      'Bebidas': [
        'agua', 'jugo', 'gaseosa', 'refresco', 'cerveza', 'vino', 'café',
        'té', 'leche', 'yogurt', 'batido', 'smoothie', 'coca', 'pepsi'
      ],
      'Dulces': [
        'chocolate', 'caramelo', 'dulce', 'galleta', 'cookie', 'helado',
        'postre', 'flan', 'gelatina', 'chicle', 'bombón'
      ],
      'Frutas': [
        'manzana', 'banana', 'naranja', 'pera', 'uva', 'fresa', 'mango',
        'piña', 'sandía', 'melón', 'kiwi', 'durazno', 'ciruela'
      ],
      'Verduras': [
        'tomate', 'lechuga', 'cebolla', 'zanahoria', 'papa', 'patata',
        'brócoli', 'espinaca', 'apio', 'pepino', 'pimiento'
      ]
    };

    const lowerName = name.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }
    
    return 'Nuevo';
  }

  // Para imágenes, no podemos hacer análisis sin IA, así que retornamos mensaje explicativo
  analyzeImage() {
    throw new Error('📷 Análisis de imágenes requiere IA. El servicio no está disponible temporalmente. Usa el modo manual o voz como alternativa.');
  }
}

export default new FallbackAnalyzer();