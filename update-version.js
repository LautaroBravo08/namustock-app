const fs = require('fs');
const path = require('path');

// Función para incrementar versión
function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }
  
  return parts.join('.');
}

// Leer versión actual
const versionPath = path.join(__dirname, 'public', 'version.json');
const packagePath = path.join(__dirname, 'package.json');

try {
  // Leer archivos
  const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Obtener tipo de actualización desde argumentos
  const updateType = process.argv[2] || 'patch';
  
  // Incrementar versión
  const newVersion = incrementVersion(versionData.version, updateType);
  
  // Actualizar version.json
  const updatedVersionData = {
    ...versionData,
    version: newVersion,
    buildDate: new Date().toISOString(),
    features: [
      "Sistema de inventario completo",
      "Gestión de ventas",
      "Análisis de productos",
      "Notificaciones automáticas",
      "Auto-actualización mejorada",
      "Validaciones de formularios",
      "Eliminación de ventas corregida"
    ],
    releaseNotes: `Nueva versión ${newVersion} con mejoras y correcciones`,
    downloads: {
      android: `https://github.com/LautaroBravo08/namustock-app/releases/download/v${newVersion}/app-release.apk`,
      ios: `https://github.com/LautaroBravo08/namustock-app/releases/download/v${newVersion}/app-release.ipa`
    },
    baseUrl: "https://github.com/LautaroBravo08/namustock-app"
  };
  
  // Actualizar package.json
  const updatedPackageData = {
    ...packageData,
    version: newVersion
  };
  
  // Escribir archivos
  fs.writeFileSync(versionPath, JSON.stringify(updatedVersionData, null, 2));
  fs.writeFileSync(packagePath, JSON.stringify(updatedPackageData, null, 2));
  
  // Actualizar .env.production
  const envProductionPath = path.join(__dirname, '.env.production');
  let envContent = fs.readFileSync(envProductionPath, 'utf8');
  
  // Reemplazar versión en .env.production
  envContent = envContent.replace(
    /REACT_APP_VERSION=[\d.]+/,
    `REACT_APP_VERSION=${newVersion}`
  );
  
  fs.writeFileSync(envProductionPath, envContent);
  
  // Actualizar service worker con nueva versión
  const swPath = path.join(__dirname, 'public', 'sw.js');
  if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, 'utf8');
    
    // Reemplazar versión en service worker
    swContent = swContent.replace(
      /const CACHE_NAME = 'tienda-moderna-v[\d.]+';/,
      `const CACHE_NAME = 'tienda-moderna-v${newVersion}';`
    );
    
    fs.writeFileSync(swPath, swContent);
  }
  
  console.log(`✅ Versión actualizada de ${versionData.version} a ${newVersion}`);
  console.log(`📦 Tipo de actualización: ${updateType}`);
  console.log(`🕒 Fecha de build: ${updatedVersionData.buildDate}`);
  
} catch (error) {
  console.error('❌ Error actualizando versión:', error.message);
  process.exit(1);
}