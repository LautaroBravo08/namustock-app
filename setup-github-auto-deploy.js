#!/usr/bin/env node

/**
 * Script de configuración inicial para despliegue automático
 * Configura GitHub CLI y verifica todo lo necesario
 */

const { execSync } = require('child_process');
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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Verificar si GitHub CLI está instalado
function checkGitHubCLI() {
  log('\n🔍 Verificando GitHub CLI...', 'bright');
  
  try {
    const version = execSync('gh --version', { encoding: 'utf8', stdio: 'pipe' });
    logSuccess('GitHub CLI está instalado');
    logInfo(version.split('\n')[0]);
    return true;
  } catch (error) {
    logError('GitHub CLI no está instalado');
    log('\n📥 Para instalar GitHub CLI:', 'cyan');
    log('   Windows: winget install --id GitHub.cli');
    log('   O descarga desde: https://cli.github.com/');
    return false;
  }
}

// Verificar autenticación de GitHub
function checkGitHubAuth() {
  log('\n🔐 Verificando autenticación de GitHub...', 'bright');
  
  try {
    const authStatus = execSync('gh auth status', { encoding: 'utf8', stdio: 'pipe' });
    logSuccess('Autenticado correctamente en GitHub');
    return true;
  } catch (error) {
    logError('No estás autenticado en GitHub');
    log('\n🔑 Para autenticarte:', 'cyan');
    log('   1. Ejecuta: gh auth login');
    log('   2. Selecciona GitHub.com');
    log('   3. Selecciona HTTPS');
    log('   4. Autoriza con tu navegador');
    return false;
  }
}

// Verificar configuración de Git
function checkGitConfig() {
  log('\n⚙️  Verificando configuración de Git...', 'bright');
  
  try {
    const gitUser = execSync('git config user.name', { encoding: 'utf8', stdio: 'pipe' }).trim();
    const gitEmail = execSync('git config user.email', { encoding: 'utf8', stdio: 'pipe' }).trim();
    
    logSuccess(`Usuario: ${gitUser}`);
    logSuccess(`Email: ${gitEmail}`);
    return true;
  } catch (error) {
    logError('Git no está configurado');
    log('\n🔧 Para configurar Git:', 'cyan');
    log('   git config --global user.name "Tu Nombre"');
    log('   git config --global user.email "tu@email.com"');
    return false;
  }
}

// Verificar repositorio remoto
function checkRemoteRepo() {
  log('\n🌐 Verificando repositorio remoto...', 'bright');
  
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8', stdio: 'pipe' }).trim();
    logSuccess(`Repositorio: ${remoteUrl}`);
    
    // Verificar que es un repositorio de GitHub
    if (remoteUrl.includes('github.com')) {
      logSuccess('Es un repositorio de GitHub');
      return true;
    } else {
      logWarning('No es un repositorio de GitHub');
      return false;
    }
  } catch (error) {
    logError('No hay repositorio remoto configurado');
    log('\n🔗 Para configurar el repositorio remoto:', 'cyan');
    log('   git remote add origin https://github.com/usuario/repositorio.git');
    return false;
  }
}

// Crear archivo de configuración
function createConfigFile() {
  log('\n📝 Creando archivo de configuración...', 'bright');
  
  const config = {
    autoDeployEnabled: true,
    githubRepo: "LautaroBravo08/namustock-app",
    defaultBranch: "main",
    releaseNotesTemplate: "auto",
    cleanupOldReleases: true,
    maxReleasesToKeep: 5,
    notifyUsers: true,
    lastDeployment: null
  };
  
  try {
    fs.writeFileSync('.github-deploy-config.json', JSON.stringify(config, null, 2));
    logSuccess('Archivo de configuración creado: .github-deploy-config.json');
    return true;
  } catch (error) {
    logError(`Error creando configuración: ${error.message}`);
    return false;
  }
}

// Función principal
function main() {
  log('🚀 Configuración de Despliegue Automático a GitHub', 'bright');
  
  let allGood = true;
  
  // Verificar todos los requisitos
  if (!checkGitHubCLI()) allGood = false;
  if (!checkGitHubAuth()) allGood = false;
  if (!checkGitConfig()) allGood = false;
  if (!checkRemoteRepo()) allGood = false;
  
  if (allGood) {
    createConfigFile();
    
    log('\n🎉 ¡Configuración completada exitosamente!', 'green');
    log('\n📋 Comandos disponibles:', 'cyan');
    log('   npm run deploy:auto        - Despliegue automático (patch)');
    log('   npm run deploy:auto:minor  - Despliegue automático (minor)');
    log('   npm run deploy:auto:major  - Despliegue automático (major)');
    
    log('\n🚀 Para hacer tu primer despliegue automático:', 'yellow');
    log('   npm run deploy:auto');
    
  } else {
    log('\n❌ Configuración incompleta', 'red');
    log('   Completa los pasos indicados arriba y vuelve a ejecutar este script', 'yellow');
  }
}

main();