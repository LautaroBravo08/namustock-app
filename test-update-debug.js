// Script para probar actualizaciones manualmente
const https = require('https');

// Simular el entorno del navegador
global.window = {
  location: { origin: 'http://localhost:3000' }
};

// Simular Capacitor
global.Capacitor = {
  isNativePlatform: () => false,
  getPlatform: () => 'web'
};

// Variables de entorno simuladas
process.env.REACT_APP_GITHUB_REPO = 'LautaroBravo08/namustock-app';
process.env.REACT_APP_VERSION = '1.0.11'; // Simular versión anterior
process.env.REACT_APP_SIMULATE_UPDATE = 'false';

async function testGitHubAPI() {
  console.log('🔍 Probando API de GitHub...');
  
  const repo = process.env.REACT_APP_GITHUB_REPO;
  const url = `https://api.github.com/repos/${repo}/releases/latest`;
  
  console.log(`📡 URL: ${url}`);
  
  try {
    const response = await fetch(url);
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const release = await response.json();
      console.log(`📦 Última versión en GitHub: ${release.tag_name}`);
      console.log(`📅 Fecha: ${release.published_at}`);
      console.log(`🔗 URL: ${release.html_url}`);
      
      const latestVersion = release.tag_name.replace('v', '');
      const currentVersion = process.env.REACT_APP_VERSION;
      
      console.log(`\n🔄 Comparación de versiones:`);
      console.log(`   Actual: ${currentVersion}`);
      console.log(`   Disponible: ${latestVersion}`);
      
      // Función para comparar versiones
      function isNewerVersion(newVersion, currentVersion) {
        const newParts = newVersion.split('.').map(Number);
        const currentParts = currentVersion.split('.').map(Number);
        
        for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
          const newPart = newParts[i] || 0;
          const currentPart = currentParts[i] || 0;
          
          if (newPart > currentPart) return true;
          if (newPart < currentPart) return false;
        }
        
        return false;
      }
      
      const hasUpdate = isNewerVersion(latestVersion, currentVersion);
      console.log(`\n✅ ¿Hay actualización disponible? ${hasUpdate ? 'SÍ' : 'NO'}`);
      
      if (hasUpdate) {
        console.log(`🎉 ¡Nueva versión ${latestVersion} disponible!`);
      } else {
        console.log(`ℹ️ Ya tienes la versión más reciente`);
      }
      
    } else {
      console.error(`❌ Error en la respuesta: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Función fetch para Node.js
global.fetch = async function(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'namustock-app-updater'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode === 200,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    }).on('error', reject);
  });
};

testGitHubAPI();