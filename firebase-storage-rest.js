#!/usr/bin/env node

/**
 * Script simplificado para deploy a Firebase Storage usando REST API
 * No requiere firebase-admin, solo Firebase CLI
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Ejecutar comando con logging mejorado
function execCommand(command, description, options = {}) {
  try {
    logInfo(`Ejecutando: ${description}`);
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    logSuccess(`${description} completado`);
    return result;
  } catch (error) {
    logError(`Error en ${description}: ${error.message}`);
    if (options.throwOnError !== false) {
      throw error;
    }
    return null;
  }
}

// Obtener token de acceso de Firebase CLI
function getFirebaseAccessToken() {
  try {
    const result = execCommand('firebase auth:print-access-token', 'Obteniendo token de acceso', { silent: true });
    return result.trim();
  } catch (error) {
    throw new Error('No se pudo obtener el token de Firebase. Ejecuta: firebase login');
  }
}

// Subir archivo usando REST API de Firebase Storage
async function uploadToFirebaseStorageREST(apkPath, version, fileSize) {
  logStep('☁️', 'Subiendo APK a Firebase Storage usando REST API...');

  try {
    const storagePath = `releases/namustock-${version}.apk`;
    const projectId = 'namu-inv';
    const bucket = 'namu-inv.firebasestorage.app';
    
    // Obtener token de acceso
    const accessToken = getFirebaseAccessToken();
    logSuccess('Token de acceso obtenido');

    // Leer archivo APK
    if (!fs.existsSync(apkPath)) {
      throw new Error(`Archivo APK no encontrado: ${apkPath}`);
    }

    const fileBuffer = fs.readFileSync(apkPath);
    const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
    logInfo(`Archivo leído: ${fileSizeMB} MB`);

    // Crear script para subir usando fetch (Node.js)
    const uploadScript = `
const fs = require('fs');
const https = require('https');

async function uploadFile() {
  try {
    const fileBuffer = fs.readFileSync('${apkPath.replace(/\\\\/g, '/')}');
    const projectId = '${projectId}';
    const bucket = '${bucket}';
    const storagePath = '${storagePath}';
    const accessToken = '${accessToken}';
    
    const uploadUrl = \`https://firebasestorage.googleapis.com/v0/b/\${bucket}/o?name=\${encodeURIComponent(storagePath)}&uploadType=media\`;
    
    console.log('🔗 URL de subida:', uploadUrl);
    console.log('📦 Subiendo archivo...');
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': fileBuffer.length
      }
    };
    
    const req = https.request(uploadUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Archivo subido exitosamente a Firebase Storage');
          console.log('📁 Path:', storagePath);
          
          // Hacer el archivo público
          makeFilePublic(projectId, bucket, storagePath, accessToken);
        } else {
          console.error('❌ Error HTTP:', res.statusCode, res.statusMessage);
          console.error('❌ Respuesta:', data);
          process.exit(1);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error de red:', error.message);
      process.exit(1);
    });
    
    req.write(fileBuffer);
    req.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function makeFilePublic(projectId, bucket, storagePath, accessToken) {
  const publicUrl = \`https://firebasestorage.googleapis.com/v0/b/\${bucket}/o/\${encodeURIComponent(storagePath)}/acl\`;
  
  const postData = JSON.stringify({
    entity: 'allUsers',
    role: 'READER'
  });
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  console.log('🌐 Configurando archivo como público...');
  
  const req = https.request(publicUrl, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Archivo configurado como público');
        process.exit(0);
      } else {
        console.log('⚠️ No se pudo hacer público (puede que ya lo sea)');
        process.exit(0);
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('⚠️ Error configurando público:', error.message);
    process.exit(0);
  });
  
  req.write(postData);
  req.end();
}

uploadFile();
`;

    // Escribir y ejecutar script de subida
    const scriptPath = 'temp-upload-rest.js';
    fs.writeFileSync(scriptPath, uploadScript);

    try {
      execCommand(`node ${scriptPath}`, 'Subida REST a Firebase Storage');
      logSuccess(`APK subido a Firebase Storage: ${storagePath}`);
      return storagePath;
    } finally {
      // Limpiar script temporal
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
      }
    }

  } catch (error) {
    logError(`Error subiendo a Firebase Storage: ${error.message}`);
    throw error;
  }
}

module.exports = { uploadToFirebaseStorageREST };