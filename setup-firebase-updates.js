#!/usr/bin/env node

/**
 * Script para configurar el sistema de actualizaciones basado en Firebase
 * Inicializa la base de datos con la información de versión actual
 */

const fs = require('fs');

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

// Leer información actual de versión
function getCurrentVersionInfo() {
  try {
    // Leer package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;
    
    // Leer version.json si existe
    let versionJson = null;
    if (fs.existsSync('public/version.json')) {
      versionJson = JSON.parse(fs.readFileSync('public/version.json', 'utf8'));
    }
    
    return {
      version: version,
      versionJson: versionJson,
      packageJson: packageJson
    };
  } catch (error) {
    logError(`Error leyendo información de versión: ${error.message}`);
    return null;
  }
}

// Generar estructura de datos para Firebase
function generateFirebaseVersionData(versionInfo) {
  const { version, versionJson } = versionInfo;
  
  return {
    version: version,
    buildDate: new Date().toISOString(),
    platform: 'android',
    versionType: versionJson?.versionType || 'patch',
    features: versionJson?.features || [
      'Sistema de inventario completo',
      'Gestión de ventas optimizada',
      'Actualizaciones en tiempo real con Firebase',
      'Sin problemas de rate limit',
      'Notificaciones instantáneas de nuevas versiones',
      'Interfaz de usuario mejorada'
    ],
    releaseNotes: versionJson?.releaseNotes || `Versión ${version} - Sistema de actualizaciones con Firebase`,
    downloads: {
      android: `https://github.com/LautaroBravo08/namustock-app/releases/download/v${version}/namustock-${version}.apk`,
      ios: `https://github.com/LautaroBravo08/namustock-app/releases/download/v${version}/namustock-${version}.ipa`
    },
    baseUrl: 'https://github.com/LautaroBravo08/namustock-app',
    updateSystem: {
      source: 'firebase',
      cacheEnabled: false,
      realTimeUpdates: true,
      supportedPlatforms: ['android'],
      platformRestriction: 'android-only'
    },
    lastUpdated: new Date().toISOString()
  };
}

// Mostrar instrucciones para configurar Firebase
function showFirebaseSetupInstructions() {
  logStep('🔥', 'Instrucciones para configurar Firebase');
  
  log('\n📋 Pasos para configurar el sistema de actualizaciones:', 'cyan');
  
  log('\n1️⃣ Configurar la base de datos:', 'cyan');
  log('   • Abre Firebase Console: https://console.firebase.google.com/', 'cyan');
  log('   • Ve a tu proyecto NamuStock', 'cyan');
  log('   • Ve a Firestore Database', 'cyan');
  log('   • Crea una colección llamada "app"', 'cyan');
  log('   • Crea un documento con ID "version"', 'cyan');
  
  log('\n2️⃣ Estructura del documento "version":', 'blue');
  const versionInfo = getCurrentVersionInfo();
  if (versionInfo) {
    const firebaseData = generateFirebaseVersionData(versionInfo);
    log('   Copia y pega estos datos en el documento:', 'blue');
    log('   ```json', 'blue');
    log(JSON.stringify(firebaseData, null, 2), 'blue');
    log('   ```', 'blue');
  }
  
  log('\n3️⃣ Configurar reglas de seguridad:', 'yellow');
  log('   • Ve a Firestore → Rules', 'yellow');
  log('   • Agrega estas reglas:', 'yellow');
  log('   ```', 'yellow');
  log('   rules_version = "2";', 'yellow');
  log('   service cloud.firestore {', 'yellow');
  log('     match /databases/{database}/documents {', 'yellow');
  log('       // Permitir lectura de información de versión', 'yellow');
  log('       match /app/version {', 'yellow');
  log('         allow read: if true;', 'yellow');
  log('         allow write: if false; // Solo administradores', 'yellow');
  log('       }', 'yellow');
  log('       // Permitir escritura de logs de actualización', 'yellow');
  log('       match /app/analytics/updateLogs/{document} {', 'yellow');
  log('         allow create: if true;', 'yellow');
  log('         allow read, update, delete: if false;', 'yellow');
  log('       }', 'yellow');
  log('     }', 'yellow');
  log('   }', 'yellow');
  log('   ```', 'yellow');
  
  log('\n4️⃣ Actualizar el UpdateService:', 'green');
  log('   • El nuevo FirebaseUpdateService ya está creado', 'green');
  log('   • Solo necesitas cambiar la importación en los componentes', 'green');
  log('   • Cambiar: import updateService from "../services/updateService"', 'green');
  log('   • Por: import updateService from "../services/firebaseUpdateService"', 'green');
}

// Mostrar beneficios del sistema Firebase
function showFirebaseBenefits() {
  logStep('🚀', 'Beneficios del sistema Firebase');
  
  log('\n💡 Ventajas sobre GitHub API:', 'green');
  log('   • Sin problemas de rate limit', 'green');
  log('   • Actualizaciones en tiempo real', 'green');
  log('   • Mucho más rápido (< 100ms vs varios segundos)', 'green');
  log('   • No depende de conexión a GitHub', 'green');
  log('   • Funciona offline con cache de Firebase', 'green');
  
  log('\n🔄 Actualizaciones en tiempo real:', 'blue');
  log('   • Los usuarios reciben notificaciones instantáneas', 'blue');
  log('   • No necesitan recargar la app', 'blue');
  log('   • No necesitan presionar "Comprobar actualizaciones"', 'blue');
  log('   • Sistema push automático', 'blue');
  
  log('\n📊 Analytics y monitoreo:', 'cyan');
  log('   • Registro automático de intentos de actualización', 'cyan');
  log('   • Estadísticas de éxito/fallo', 'cyan');
  log('   • Información de plataformas', 'cyan');
  log('   • Datos para mejorar el sistema', 'cyan');
  
  log('\n🔧 Facilidad de mantenimiento:', 'yellow');
  log('   • Actualizar versión desde Firebase Console', 'yellow');
  log('   • No necesita rebuild de la app', 'yellow');
  log('   • Cambios instantáneos para todos los usuarios', 'yellow');
  log('   • Control granular de releases', 'yellow');
}

// Generar script de actualización automática
function generateUpdateScript() {
  logStep('📝', 'Generando script de actualización automática');
  
  const versionInfo = getCurrentVersionInfo();
  if (!versionInfo) return;
  
  const scriptContent = `#!/usr/bin/env node

/**
 * Script para actualizar la versión en Firebase automáticamente
 * Se ejecuta después de crear un nuevo release
 */

const admin = require('firebase-admin');

// Configurar Firebase Admin (necesitas el archivo de credenciales)
// const serviceAccount = require('./path/to/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

const db = admin.firestore();

async function updateFirebaseVersion() {
  const versionData = ${JSON.stringify(generateFirebaseVersionData(versionInfo), null, 2)};
  
  try {
    await db.collection('app').doc('version').set(versionData);
    console.log('✅ Versión actualizada en Firebase:', versionData.version);
  } catch (error) {
    console.error('❌ Error actualizando Firebase:', error);
  }
}

updateFirebaseVersion();`;
  
  fs.writeFileSync('update-firebase-version.js', scriptContent);
  logSuccess('Script generado: update-firebase-version.js');
  logInfo('Configura las credenciales de Firebase Admin para usarlo');
}

// Mostrar comparación de rendimiento
function showPerformanceComparison() {
  logStep('⚡', 'Comparación de rendimiento');
  
  log('\n📊 GitHub API vs Firebase:', 'bright');
  
  const comparison = [
    ['Aspecto', 'GitHub API', 'Firebase'],
    ['Velocidad', '2-5 segundos', '< 100ms'],
    ['Rate Limit', '60/hora sin token', 'Sin límites'],
    ['Tiempo real', 'No', 'Sí'],
    ['Cache necesario', 'Sí (10 min)', 'No'],
    ['Retry necesario', 'Sí (3 intentos)', 'No'],
    ['Fallback necesario', 'Sí', 'No'],
    ['Offline', 'No funciona', 'Cache automático'],
    ['Complejidad', 'Alta', 'Baja'],
    ['Mantenimiento', 'Complejo', 'Simple']
  ];
  
  comparison.forEach(([aspect, github, firebase], index) => {
    if (index === 0) {
      log(`   ${aspect.padEnd(15)} | ${github.padEnd(15)} | ${firebase}`, 'cyan');
      log('   ' + '-'.repeat(50), 'cyan');
    } else {
      const githubColor = github.includes('No') || github.includes('Sí (') ? 'red' : 'yellow';
      const firebaseColor = firebase.includes('Sí') || firebase.includes('< ') || firebase.includes('Sin') ? 'green' : 'yellow';
      
      log(`   ${aspect.padEnd(15)} | `, 'reset');
      process.stdout.write(`${colors[githubColor]}${github.padEnd(15)}${colors.reset} | `);
      log(`${firebase}`, firebaseColor);
    }
  });
}

// Función principal
async function main() {
  log('\n🔥 Configurando sistema de actualizaciones con Firebase...', 'bright');
  
  try {
    // Obtener información actual
    const versionInfo = getCurrentVersionInfo();
    
    if (!versionInfo) {
      logError('No se pudo obtener información de versión');
      return false;
    }
    
    logSuccess(`Versión actual detectada: ${versionInfo.version}`);
    
    // Mostrar instrucciones
    showFirebaseSetupInstructions();
    
    // Mostrar beneficios
    showFirebaseBenefits();
    
    // Mostrar comparación
    showPerformanceComparison();
    
    // Generar script de actualización
    generateUpdateScript();
    
    // Resumen final
    logStep('📋', 'Resumen de la implementación');
    
    log('\n🎯 Estado actual:', 'green');
    log('   • FirebaseUpdateService creado', 'green');
    log('   • Funciones de Firebase implementadas', 'green');
    log('   • Sistema de tiempo real configurado', 'green');
    log('   • Analytics de actualizaciones incluido', 'green');
    log('   • Solo falta configurar la base de datos', 'green');
    
    log('\n🚀 Próximos pasos:', 'blue');
    log('   1. Configurar Firebase según las instrucciones arriba', 'blue');
    log('   2. Cambiar las importaciones en los componentes', 'blue');
    log('   3. Probar el sistema', 'blue');
    log('   4. ¡Disfrutar de actualizaciones instantáneas!', 'blue');
    
    return true;
    
  } catch (error) {
    logError(`Error durante la configuración: ${error.message}`);
    return false;
  }
}

// Ejecutar configuración
main().then(success => {
  process.exit(success ? 0 : 1);
});