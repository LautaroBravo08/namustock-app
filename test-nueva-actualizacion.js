#!/usr/bin/env node

/**
 * Script para probar que la aplicación detecte la nueva actualización
 * Simula el comportamiento del UpdateService
 */

const https = require('https');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step} ${message}`, 'bright');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Simular fetch para Node.js
function fetchGitHubAPI(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'NamuStock-App-UpdateChecker'
      }
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: response.statusCode === 200,
            status: response.statusCode,
            json: () => Promise.resolve(jsonData),
            headers: {
              get: (key) => response.headers[key.toLowerCase()]
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
  });
}

// Normalizar versión a array de números
function normalizeVersion(version) {
  return version.split('.').map(part => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });
}

// Comparar arrays de versión
function compareVersionArrays(newVersionArray, currentVersionArray) {
  const maxLength = Math.max(newVersionArray.length, currentVersionArray.length);
  
  for (let i = 0; i < maxLength; i++) {
    const newPart = newVersionArray[i] || 0;
    const currentPart = currentVersionArray[i] || 0;
    
    if (newPart > currentPart) {
      return true;
    } else if (newPart < currentPart) {
      return false;
    }
  }
  
  return false; // Son iguales
}

// Simular verificación de actualización
async function simulateUpdateCheck() {
  logStep('🔍', 'Simulando verificación de actualización...');
  
  const githubRepo = 'LautaroBravo08/namustock-app';
  const currentVersion = '1.0.77'; // Simular versión anterior
  
  logInfo(`Repositorio: ${githubRepo}`);
  logInfo(`Versión actual simulada: ${currentVersion}`);
  
  try {
    // Consultar GitHub API
    logInfo('Consultando GitHub API...');
    const response = await fetchGitHubAPI(`https://api.github.com/repos/${githubRepo}/releases/latest`);
    
    if (response.ok) {
      const release = await response.json();
      const latestVersion = release.tag_name.replace('v', '');
      
      logSuccess(`Información obtenida desde GitHub API`);
      logInfo(`Release encontrado: ${release.tag_name} (${release.name})`);
      logInfo(`Última versión en GitHub: ${latestVersion}`);
      
      // Comparar versiones
      logInfo('Comparando versiones detalladamente:');
      logInfo(`  📱 Versión actual (simulada): "${currentVersion}"`);
      logInfo(`  🐙 Versión disponible (GitHub): "${latestVersion}"`);
      
      const normalizedCurrent = normalizeVersion(currentVersion);
      const normalizedLatest = normalizeVersion(latestVersion);
      
      logInfo(`  📊 Versión actual normalizada: [${normalizedCurrent.join(', ')}]`);
      logInfo(`  📊 Versión disponible normalizada: [${normalizedLatest.join(', ')}]`);
      
      const isNewer = compareVersionArrays(normalizedLatest, normalizedCurrent);
      logInfo(`  🔍 ¿Es más nueva?: ${isNewer}`);
      
      if (isNewer) {
        logSuccess(`¡Nueva versión disponible: ${latestVersion}!`);
        
        // Buscar asset APK
        const asset = release.assets?.find(asset => asset.name.endsWith('.apk'));
        
        if (asset) {
          logSuccess(`APK encontrado: ${asset.name}`);
          logInfo(`URL de descarga: ${asset.browser_download_url}`);
          logInfo(`Tamaño: ${(asset.size / (1024 * 1024)).toFixed(2)} MB`);
          
          return {
            available: true,
            version: latestVersion,
            currentVersion: currentVersion,
            downloadUrl: asset.browser_download_url,
            releaseNotes: release.body || 'Nueva versión disponible',
            publishedAt: release.published_at
          };
        } else {
          logWarning('No se encontró APK en el release');
          return { available: false, error: 'No APK found' };
        }
      } else {
        logInfo('Ya tienes la última versión - No hay actualizaciones disponibles');
        return { available: false, latestVersion: latestVersion };
      }
      
    } else {
      logError(`GitHub API respondió con error: ${response.status}`);
      return { available: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    logError(`Error verificando actualizaciones: ${error.message}`);
    return { available: false, error: error.message };
  }
}

// Probar diferentes escenarios
async function testDifferentScenarios() {
  logStep('🎭', 'Probando diferentes escenarios...');
  
  const scenarios = [
    {
      name: 'Versión anterior (1.0.77 vs 1.0.78)',
      currentVersion: '1.0.77',
      expectedResult: true
    },
    {
      name: 'Misma versión (1.0.78 vs 1.0.78)',
      currentVersion: '1.0.78',
      expectedResult: false
    },
    {
      name: 'Versión futura (1.0.79 vs 1.0.78)',
      currentVersion: '1.0.79',
      expectedResult: false
    }
  ];
  
  for (const scenario of scenarios) {
    logInfo(`\nEscenario: ${scenario.name}`);
    
    // Simular comparación
    const githubVersion = '1.0.78'; // Versión actual en GitHub
    const normalizedCurrent = normalizeVersion(scenario.currentVersion);
    const normalizedGitHub = normalizeVersion(githubVersion);
    
    const isNewer = compareVersionArrays(normalizedGitHub, normalizedCurrent);
    
    if (isNewer === scenario.expectedResult) {
      logSuccess(`✓ Resultado correcto: ${isNewer ? 'Actualización disponible' : 'No hay actualización'}`);
    } else {
      logError(`✗ Resultado incorrecto: esperado ${scenario.expectedResult}, obtenido ${isNewer}`);
    }
  }
}

// Mostrar instrucciones para probar en la aplicación
function showTestInstructions() {
  logStep('📱', 'Instrucciones para probar en la aplicación');
  
  log('\n🔧 Para probar la detección de actualización:', 'cyan');
  log('   1. Asegúrate de que la app esté en versión 1.0.77 o anterior', 'cyan');
  log('   2. Abre la aplicación en el navegador (npm start)', 'cyan');
  log('   3. Abre DevTools (F12) → Console', 'cyan');
  log('   4. Limpia el cache de localStorage:', 'cyan');
  log('      - Application → Storage → Local Storage', 'cyan');
  log('      - Elimina claves que empiecen con "github-release-"', 'cyan');
  log('   5. Recarga la página (Ctrl+Shift+R)', 'cyan');
  log('   6. Busca en console: "🚀 Verificando actualizaciones al iniciar"', 'cyan');
  log('   7. Deberías ver: "✅ Nueva versión disponible: 1.0.78"', 'cyan');
  
  log('\n🔍 Para verificación manual:', 'yellow');
  log('   1. Ve al menú de usuario (esquina superior derecha)', 'yellow');
  log('   2. Haz clic en "Comprobar actualizaciones"', 'yellow');
  log('   3. Busca en console: "🔍 Verificación manual de actualizaciones"', 'yellow');
  log('   4. Deberías ver la notificación de actualización', 'yellow');
  
  log('\n🐛 Si no detecta la actualización:', 'red');
  log('   • Verifica que REACT_APP_VERSION en .env.local sea 1.0.77 o menor', 'red');
  log('   • Limpia completamente el cache del navegador', 'red');
  log('   • Verifica que REACT_APP_GITHUB_REPO esté configurado correctamente', 'red');
  log('   • Revisa los logs en console para errores de red', 'red');
}

// Función principal
async function main() {
  log('\n🧪 Probando detección de nueva actualización (1.0.78)...', 'bright');
  
  try {
    // Simular verificación de actualización
    const updateInfo = await simulateUpdateCheck();
    
    // Probar diferentes escenarios
    await testDifferentScenarios();
    
    // Mostrar instrucciones
    showTestInstructions();
    
    // Resumen final
    logStep('📋', 'Resumen de la prueba');
    
    if (updateInfo.available) {
      logSuccess('✅ La simulación detectó correctamente la nueva versión');
      logInfo(`   Nueva versión: ${updateInfo.version}`);
      logInfo(`   URL de descarga: ${updateInfo.downloadUrl}`);
      logInfo(`   Fecha de publicación: ${updateInfo.publishedAt}`);
      
      log('\n🎉 ¡El sistema debería funcionar correctamente!', 'green');
      log('   Sigue las instrucciones arriba para probar en la aplicación.', 'green');
      
    } else {
      logWarning('⚠️ La simulación no detectó actualización');
      if (updateInfo.error) {
        logError(`   Error: ${updateInfo.error}`);
      }
      logInfo('   Esto puede ser normal si ya estás en la última versión');
    }
    
    return updateInfo.available;
    
  } catch (error) {
    logError(`Error durante la prueba: ${error.message}`);
    return false;
  }
}

// Ejecutar prueba
main().then(success => {
  process.exit(success ? 0 : 1);
});