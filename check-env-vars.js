#!/usr/bin/env node

/**
 * Script para verificar que las variables de entorno se lean correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando variables de entorno...\n');

// Leer archivos .env
const envFiles = ['.env.local', '.env.production', '.env'];

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`📁 Archivo ${file}:`);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    lines.forEach(line => {
      if (line.includes('REACT_APP_VERSION')) {
        console.log(`   ✅ ${line}`);
      }
      if (line.includes('REACT_APP_GITHUB_REPO')) {
        console.log(`   ✅ ${line}`);
      }
    });
    console.log('');
  } else {
    console.log(`❌ Archivo ${file} no existe\n`);
  }
});

// Simular lo que React haría
console.log('🔧 Simulando carga de variables de entorno de React:');

// Leer .env.local (tiene prioridad)
if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  const lines = content.split('\n');
  
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#') && line.includes('=')) {
      const [key, value] = line.split('=');
      if (key.trim().startsWith('REACT_APP_')) {
        console.log(`   ${key.trim()} = ${value.trim()}`);
      }
    }
  });
}

console.log('\n💡 Para que React lea estas variables:');
console.log('   1. Detén el servidor (Ctrl+C)');
console.log('   2. Ejecuta: npm start');
console.log('   3. Las variables se cargarán automáticamente');

console.log('\n🚀 Después de reiniciar, deberías ver en console:');
console.log('   📦 Versión actual: 1.0.80');
console.log('   🐙 Última versión en GitHub: 1.0.81');
console.log('   ✅ Nueva versión disponible: 1.0.81');