#!/usr/bin/env node

/**
 * Script para limpiar cache de versiones y forzar verificación limpia
 */

console.log('🧹 Limpiando cache de versiones...');

// Simular limpieza de localStorage (para mostrar qué se haría)
const keysToRemove = [
  'installed-app-version',
  'last-checked-version', 
  'app-version',
  'namustock-version',
  'version',
  'update-info',
  'last-update-check',
  'cleanup-version'
];

console.log('🗑️ Claves que se limpiarán del localStorage:');
keysToRemove.forEach(key => {
  console.log(`   - ${key}`);
});

console.log('\n📝 Para limpiar manualmente en el navegador/app:');
console.log('1. Abre las DevTools (F12)');
console.log('2. Ve a la pestaña "Application" o "Aplicación"');
console.log('3. En el panel izquierdo, busca "Local Storage"');
console.log('4. Selecciona tu dominio');
console.log('5. Elimina todas las claves relacionadas con versiones');
console.log('6. O ejecuta en la consola:');
console.log('   localStorage.clear();');

console.log('\n🔄 Alternativamente, ejecuta este código en la consola del navegador:');
console.log(`
const keysToRemove = ${JSON.stringify(keysToRemove, null, 2)};
keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log('🗑️ Eliminando:', key, '=', localStorage.getItem(key));
    localStorage.removeItem(key);
  }
});
console.log('✅ Cache de versiones limpiado');
location.reload();
`);

console.log('\n✅ Después de limpiar el cache, la app debería detectar correctamente que ya tienes la última versión.');