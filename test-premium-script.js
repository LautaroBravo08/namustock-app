/**
 * Script de Prueba para Sistema Premium
 * 
 * Este script te ayuda a probar el límite de productos de manera rápida.
 * 
 * CÓMO USAR:
 * 1. Abre la aplicación en el navegador
 * 2. Inicia sesión con tu cuenta
 * 3. Abre la consola del navegador (F12)
 * 4. Copia y pega este script completo
 * 5. Ejecuta las funciones según necesites
 */

// ==========================================
// FUNCIONES DE PRUEBA
// ==========================================

/**
 * Genera productos de prueba de forma rápida
 * @param {number} count - Cantidad de productos a generar
 * @param {string} prefix - Prefijo para los nombres (opcional)
 */
window.generateTestProducts = function(count = 10, prefix = 'Producto Test') {
  const products = [];
  const categories = ['Alimentos', 'Bebidas', 'Limpieza', 'Cuidado Personal', 'Otros'];
  
  for (let i = 1; i <= count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const cost = Math.floor(Math.random() * 500) + 50;
    const price = Math.round(cost * 1.4);
    
    products.push({
      id: `test-${Date.now()}-${i}`,
      name: `${prefix} ${i}`,
      cost: cost,
      price: price,
      stock: Math.floor(Math.random() * 50) + 1,
      category: category,
      createdAt: new Date().toISOString()
    });
  }
  
  console.log(`✅ ${count} productos de prueba generados`);
  return products;
};

/**
 * Simula agregar productos hasta cierta cantidad
 * NOTA: Esta función simula, pero realmente necesitas usar la UI de la app
 * @param {number} targetCount - Cantidad objetivo de productos
 */
window.simulateProductLimit = function(targetCount = 150) {
  console.log(`📦 Simulando ${targetCount} productos...`);
  console.log(`⚠️ IMPORTANTE: Esta función solo genera datos de ejemplo.`);
  console.log(`   Para probar realmente el límite, usa la función de agregar productos de la app.`);
  
  const products = window.generateTestProducts(targetCount);
  
  console.log(`\n📊 Resumen de Simulación:`);
  console.log(`   Total de productos: ${products.length}`);
  console.log(`   Límite gratuito: 150`);
  
  if (products.length >= 150) {
    console.log(`   ⚠️ LÍMITE ALCANZADO - Debería activarse el modal Premium`);
  } else {
    const remaining = 150 - products.length;
    console.log(`   ✅ Productos restantes: ${remaining}`);
    
    if (remaining <= 20) {
      console.log(`   ⚠️ CERCA DEL LÍMITE - Debería mostrar advertencia amarilla`);
    }
  }
  
  return products;
};

/**
 * Muestra información del estado actual del límite
 */
window.checkProductLimit = function() {
  // Intentar obtener info del React state (esto puede no funcionar siempre)
  console.log(`\n🔍 Verificando Estado del Límite de Productos\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  // Instrucciones para verificar manualmente
  console.log(`\n📋 Para verificar el estado actual:`);
  console.log(`   1. Ve a la página "Gestión de Inventario"`);
  console.log(`   2. Observa el indicador en la parte superior`);
  console.log(`   3. Debe mostrar: "X de 150 productos"`);
  console.log(`\n🎨 Colores del Indicador:`);
  console.log(`   🔵 Azul   = 0-129 productos (normal)`);
  console.log(`   🟡 Amarillo = 130-149 productos (cerca del límite)`);
  console.log(`   🔴 Rojo   = 150 productos (límite alcanzado)`);
  console.log(`   👑 Dorado = Usuario Premium (ilimitado)`);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
};

/**
 * Simula activación de Premium (solo visual en consola)
 */
window.testPremiumActivation = function() {
  console.log(`\n👑 Simulación de Activación Premium\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n✅ Para activar Premium REALMENTE, tienes 2 opciones:\n`);
  
  console.log(`📱 OPCIÓN 1: Firebase Console`);
  console.log(`   1. Ve a: https://console.firebase.google.com/`);
  console.log(`   2. Selecciona tu proyecto → Firestore`);
  console.log(`   3. Navega a: users/{userId}/data/settings`);
  console.log(`   4. Edita y agrega:`);
  console.log(`      {`);
  console.log(`        "isPremium": true,`);
  console.log(`        "subscriptionStatus": "active",`);
  console.log(`        "subscriptionProvider": "mercadopago"`);
  console.log(`      }`);
  
  console.log(`\n💻 OPCIÓN 2: Código Temporal`);
  console.log(`   En App.js, línea ~75, cambia:`);
  console.log(`   const [isPremium, setIsPremium] = useState(true);`);
  
  console.log(`\n🎁 Después de activar Premium:`);
  console.log(`   ✅ Productos ilimitados`);
  console.log(`   ✅ Sin advertencias de límite`);
  console.log(`   ✅ Indicador muestra corona dorada`);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
};

/**
 * Muestra ayuda general del script
 */
window.testHelp = function() {
  console.log(`\n🎯 FUNCIONES DE PRUEBA DISPONIBLES\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n1️⃣  generateTestProducts(count, prefix)`);
  console.log(`    Genera productos de prueba`);
  console.log(`    Ejemplo: generateTestProducts(50, "Producto")`);
  
  console.log(`\n2️⃣  simulateProductLimit(targetCount)`);
  console.log(`    Simula cantidad de productos`);
  console.log(`    Ejemplo: simulateProductLimit(150)`);
  
  console.log(`\n3️⃣  checkProductLimit()`);
  console.log(`    Verifica estado del límite`);
  console.log(`    Ejemplo: checkProductLimit()`);
  
  console.log(`\n4️⃣  testPremiumActivation()`);
  console.log(`    Muestra cómo activar Premium`);
  console.log(`    Ejemplo: testPremiumActivation()`);
  
  console.log(`\n5️⃣  testHelp()`);
  console.log(`    Muestra esta ayuda`);
  console.log(`    Ejemplo: testHelp()`);
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n💡 TIP: Todos los comandos están disponibles globalmente`);
  console.log(`    Puedes llamarlos desde cualquier parte de la consola\n`);
};

// ==========================================
// AUTO-EJECUTAR AL CARGAR
// ==========================================

console.log(`\n🚀 SCRIPT DE PRUEBA PARA SISTEMA PREMIUM CARGADO\n`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`\n✅ Funciones disponibles. Escribe: testHelp()\n`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

// Exportar las funciones para uso global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateTestProducts: window.generateTestProducts,
    simulateProductLimit: window.simulateProductLimit,
    checkProductLimit: window.checkProductLimit,
    testPremiumActivation: window.testPremiumActivation,
    testHelp: window.testHelp
  };
}
