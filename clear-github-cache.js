#!/usr/bin/env node

/**
 * Script para limpiar el cache de GitHub y forzar detección de nueva versión
 */

console.log('🧹 Limpiando cache de GitHub para forzar detección de nueva versión...');

// Simular limpieza de localStorage (esto se haría en el navegador)
const cacheKeys = [
  'github-release-LautaroBravo08/namustock-app',
  'github-release-time-LautaroBravo08/namustock-app',
  'current-app-version',
  'installed-app-version',
  'last-checked-version',
  'app-version',
  'namustock-version',
  'version',
  'update-info',
  'last-update-check'
];

console.log('🗑️ Cache keys que deberían limpiarse en el navegador:');
cacheKeys.forEach(key => {
  console.log(`   • ${key}`);
});

console.log('\n💡 Para limpiar el cache en el navegador:');
console.log('   1. Abre DevTools (F12)');
console.log('   2. Ve a Application → Storage → Local Storage');
console.log('   3. Elimina las claves que empiecen con "github-release-"');
console.log('   4. Recarga la página');

console.log('\n🔄 O simplemente usa Ctrl+Shift+R para recargar sin cache');

console.log('\n✅ Instrucciones mostradas. Limpia el cache en el navegador y prueba la actualización.');