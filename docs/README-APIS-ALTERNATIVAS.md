# 🤖 APIs de IA Alternativas - Configuración

Este documento explica cómo configurar APIs alternativas gratuitas para reemplazar Gemini cuando esté bloqueada o no disponible.

## 🎯 Sistema de Fallback Automático

La aplicación ahora usa un sistema inteligente que prueba múltiples APIs en orden de prioridad:

1. **🤖 Gemini** (Google) - Principal
2. **🤗 Hugging Face** - Alternativa gratuita
3. **⚡ Análisis Básico** - Fallback sin IA

## 📋 APIs Disponibles

### 1. Hugging Face Inference API (RECOMENDADA) 🤗

**✅ Ventajas:**
- Completamente gratuita
- Sin límites estrictos
- Modelos de texto e imagen
- Fácil configuración

**🔧 Configuración:**

1. **Crear cuenta gratuita:**
   - Ve a [huggingface.co](https://huggingface.co)
   - Regístrate gratis

2. **Obtener API Key:**
   - Ve a [Settings → Access Tokens](https://huggingface.co/settings/tokens)
   - Crea un nuevo token con permisos de "Read"
   - Copia el token

3. **Configurar en la app:**
   ```bash
   # En .env.local
   REACT_APP_HUGGINGFACE_API_KEY=hf_tu_token_aqui
   ```

4. **¡Listo!** La app usará Hugging Face automáticamente si Gemini falla.

### 2. OpenAI GPT-4o-mini 🧠

**✅ Ventajas:**
- Muy barata ($0.15 por 1M tokens)
- Excelente calidad
- Soporte para imágenes

**🔧 Configuración:**

1. **Crear cuenta:**
   - Ve a [platform.openai.com](https://platform.openai.com)
   - Agrega método de pago (necesario pero muy barato)

2. **Obtener API Key:**
   - Ve a API Keys
   - Crea nueva key

3. **Agregar al proyecto:**
   ```bash
   # En .env.local
   REACT_APP_OPENAI_API_KEY=sk-tu_key_aqui
   ```

### 3. Ollama (Local) 💻

**✅ Ventajas:**
- Completamente gratuita
- Funciona offline
- Privacidad total

**❌ Desventajas:**
- Requiere instalación
- Consume recursos locales

**🔧 Configuración:**

1. **Instalar Ollama:**
   ```bash
   # Windows
   winget install Ollama.Ollama
   
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Instalar modelo:**
   ```bash
   ollama pull llama2
   ```

3. **Configurar en la app:**
   ```bash
   # En .env.local
   REACT_APP_OLLAMA_URL=http://localhost:11434
   ```

## 🚀 Implementación Rápida - Solo Hugging Face

Si solo quieres una alternativa rápida y gratuita:

1. **Regístrate en Hugging Face** (2 minutos)
2. **Crea un token** (1 minuto)
3. **Agrega a .env.local:**
   ```bash
   REACT_APP_HUGGINGFACE_API_KEY=hf_tu_token_aqui
   ```
4. **¡Listo!** Ya tienes backup gratuito

## 🔄 Cómo Funciona el Sistema de Fallback

```
Usuario analiza texto/imagen
         ↓
    ¿Gemini disponible?
         ↓ NO
  ¿Hugging Face disponible?
         ↓ NO
    Análisis básico sin IA
         ↓
    Resultado al usuario
```

## 🎛️ Configuración Avanzada

### Cambiar Orden de Prioridad

En `src/services/aiService.js` puedes cambiar el orden:

```javascript
this.providers = [
  { name: 'HuggingFace', service: huggingFaceService, priority: 1 }, // Primero
  { name: 'Gemini', service: geminiService, priority: 2 },           // Segundo
  { name: 'Fallback', service: fallbackAnalyzer, priority: 3 }       // Último
];
```

### Deshabilitar un Proveedor

```javascript
// En el código
aiService.disableProvider('Gemini');
```

## 🆘 Solución de Problemas

### Error: "Modelo cargándose"
- **Causa:** Hugging Face está cargando el modelo
- **Solución:** Espera 30 segundos e intenta de nuevo

### Error: "Límite alcanzado"
- **Causa:** Muchas peticiones muy rápido
- **Solución:** Espera unos minutos

### Error: "API key inválida"
- **Causa:** Token mal copiado o expirado
- **Solución:** Genera nuevo token

## 💡 Consejos

1. **Usa Hugging Face como principal** si Gemini da problemas frecuentes
2. **El análisis básico** funciona bien para texto simple
3. **Para imágenes** necesitas IA (Gemini o Hugging Face)
4. **Combina múltiples APIs** para máxima disponibilidad

## 📊 Comparación de APIs

| API | Costo | Calidad | Velocidad | Configuración |
|-----|-------|---------|-----------|---------------|
| Gemini | Gratis* | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Hugging Face | Gratis | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| OpenAI | $0.15/1M | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Ollama | Gratis | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |

*Con límites que pueden causar bloqueos

## 🎉 Resultado

Con esta configuración tendrás:
- ✅ **Backup automático** cuando Gemini falle
- ✅ **Análisis gratuito** con Hugging Face
- ✅ **Fallback básico** que siempre funciona
- ✅ **Experiencia fluida** para el usuario

¡Tu app nunca se quedará sin análisis de IA! 🚀