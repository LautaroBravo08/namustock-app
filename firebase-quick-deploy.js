#!/usr/bin/env node

/**
 * Script rápido para deploy a Firebase Storage
 * Uso: node firebase-quick-deploy.js [patch|minor|major]
 */

const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  const versionType = process.argv[2] || 'patch';
  
  log('\n🔥 Deploy Rápido a Firebase Iniciado...', 'bright');
  log(`📝 Tipo de versión: ${versionType}`, 'blue');
  
  try {
    // Ejecutar el script de Firebase con opciones automáticas
    const command = `node firebase-deploy.js ${versionType} --clean --auto`;
    
    log('\n⚡ Ejecutando deploy a Firebase...', 'yellow');
    log(`Comando: ${command}`, 'cyan');
    
    execSync(command, { stdio: 'inherit' });
    
    log('\n✅ Deploy a Firebase completado exitosamente!', 'green');
    
  } catch (error) {
    log('\n❌ Error en deploy a Firebase', 'red');
    process.exit(1);
  }
}

main();