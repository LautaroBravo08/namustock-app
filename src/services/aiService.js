// Servicio unificado de IA con múltiples proveedores como fallback
import geminiService from './geminiService';
import huggingFaceService from './huggingFaceService';
import fallbackAnalyzer from './fallbackAnalyzer';

class AIService {
  constructor() {
    this.providers = [
      {
        name: 'Gemini',
        service: geminiService,
        priority: 1,
        supportsVision: true,
        supportsText: true
      },
      {
        name: 'HuggingFace',
        service: huggingFaceService,
        priority: 2,
        supportsVision: true,
        supportsText: true
      },
      {
        name: 'Fallback',
        service: fallbackAnalyzer,
        priority: 3,
        supportsVision: false,
        supportsText: true
      }
    ];
  }

  // Análisis de texto con fallback automático
  async analyzeVoiceText(transcript) {
    const textProviders = this.providers
      .filter(p => p.supportsText)
      .sort((a, b) => a.priority - b.priority);

    for (const provider of textProviders) {
      try {
        console.log(`🤖 Intentando análisis de voz con ${provider.name}...`);
        const result = await provider.service.analyzeVoiceText(transcript);
        
        if (result && result.length > 0) {
          console.log(`✅ Análisis exitoso con ${provider.name}`);
          return {
            products: result,
            provider: provider.name,
            success: true
          };
        }
      } catch (error) {
        console.warn(`❌ ${provider.name} falló:`, error.message);
        
        // Si es el último proveedor, lanzar el error
        if (provider === textProviders[textProviders.length - 1]) {
          throw new Error(`Todos los servicios de IA fallaron. Último error: ${error.message}`);
        }
        
        // Continuar con el siguiente proveedor
        continue;
      }
    }

    throw new Error('No se pudieron identificar productos con ningún servicio disponible.');
  }

  // Análisis de imagen con fallback automático
  async analyzeImage(imageData) {
    const visionProviders = this.providers
      .filter(p => p.supportsVision)
      .sort((a, b) => a.priority - b.priority);

    for (const provider of visionProviders) {
      try {
        console.log(`📷 Intentando análisis de imagen con ${provider.name}...`);
        const result = await provider.service.analyzeImage(imageData);
        
        if (result && result.length > 0) {
          console.log(`✅ Análisis de imagen exitoso con ${provider.name}`);
          return {
            products: result,
            provider: provider.name,
            success: true
          };
        }
      } catch (error) {
        console.warn(`❌ ${provider.name} falló para imagen:`, error.message);
        
        // Si es el último proveedor, lanzar el error
        if (provider === visionProviders[visionProviders.length - 1]) {
          throw new Error(`Servicios de análisis de imagen no disponibles. Último error: ${error.message}`);
        }
        
        // Continuar con el siguiente proveedor
        continue;
      }
    }

    throw new Error('📷 Análisis de imágenes no disponible. Usa el modo manual o voz como alternativa.');
  }

  // Verificar estado de todos los proveedores
  async checkAllProvidersStatus() {
    const status = {};
    
    for (const provider of this.providers) {
      try {
        if (provider.service.checkApiStatus) {
          const result = await provider.service.checkApiStatus();
          status[provider.name] = result;
        } else {
          status[provider.name] = { available: true, message: 'Disponible' };
        }
      } catch (error) {
        status[provider.name] = { available: false, message: error.message };
      }
    }
    
    return status;
  }

  // Obtener el mejor proveedor disponible para texto
  async getBestTextProvider() {
    const textProviders = this.providers
      .filter(p => p.supportsText)
      .sort((a, b) => a.priority - b.priority);

    for (const provider of textProviders) {
      try {
        if (provider.service.checkApiStatus) {
          const status = await provider.service.checkApiStatus();
          if (status.available) {
            return provider;
          }
        } else {
          return provider; // Fallback siempre disponible
        }
      } catch (error) {
        continue;
      }
    }

    return textProviders[textProviders.length - 1]; // Retornar fallback como último recurso
  }

  // Obtener el mejor proveedor disponible para imágenes
  async getBestVisionProvider() {
    const visionProviders = this.providers
      .filter(p => p.supportsVision)
      .sort((a, b) => a.priority - b.priority);

    for (const provider of visionProviders) {
      try {
        if (provider.service.checkApiStatus) {
          const status = await provider.service.checkApiStatus();
          if (status.available) {
            return provider;
          }
        } else {
          return provider;
        }
      } catch (error) {
        continue;
      }
    }

    return null; // No hay proveedores de visión disponibles
  }

  // Método para agregar nuevos proveedores dinámicamente
  addProvider(name, service, priority, supportsVision = false, supportsText = true) {
    this.providers.push({
      name,
      service,
      priority,
      supportsVision,
      supportsText
    });
    
    // Reordenar por prioridad
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  // Método para deshabilitar un proveedor temporalmente
  disableProvider(name) {
    const provider = this.providers.find(p => p.name === name);
    if (provider) {
      provider.disabled = true;
    }
  }

  // Método para habilitar un proveedor
  enableProvider(name) {
    const provider = this.providers.find(p => p.name === name);
    if (provider) {
      provider.disabled = false;
    }
  }

  // Obtener información de todos los proveedores
  getProvidersInfo() {
    return this.providers.map(p => ({
      name: p.name,
      priority: p.priority,
      supportsVision: p.supportsVision,
      supportsText: p.supportsText,
      disabled: p.disabled || false
    }));
  }
}

export default new AIService();