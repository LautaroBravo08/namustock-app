// Script de prueba para funcionalidad offline
// Ejecutar en la consola del navegador para probar las funciones offline

console.log('🧪 Iniciando pruebas de funcionalidad offline...');

// Función para simular pérdida de conexión
function simulateOffline() {
  console.log('📴 Simulando pérdida de conexión...');
  
  // Cambiar el estado de navigator.onLine (solo para pruebas)
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: false
  });
  
  // Disparar evento offline
  window.dispatchEvent(new Event('offline'));
  
  console.log('✅ Modo offline simulado');
}

// Función para simular restauración de conexión
function simulateOnline() {
  console.log('🌐 Simulando restauración de conexión...');
  
  // Cambiar el estado de navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true
  });
  
  // Disparar evento online
  window.dispatchEvent(new Event('online'));
  
  console.log('✅ Conexión restaurada simulada');
}

// Función para verificar datos en localStorage
function checkLocalStorage() {
  console.log('💾 Verificando datos en localStorage...');
  
  const keys = [
    'namustock_products_offline',
    'namustock_sales_offline',
    'namustock_settings_offline',
    'namustock_pending_sync',
    'namustock_last_sync'
  ];
  
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log(`📋 ${key}:`, parsed);
      } catch (e) {
        console.log(`📋 ${key}:`, data);
      }
    } else {
      console.log(`📋 ${key}: No data`);
    }
  });
}

// Función para limpiar datos de prueba
function cleanupTestData() {
  console.log('🧹 Limpiando datos de prueba...');
  
  const keys = [
    'namustock_products_offline',
    'namustock_sales_offline',
    'namustock_settings_offline',
    'namustock_pending_sync',
    'namustock_last_sync'
  ];
  
  keys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('✅ Datos de prueba limpiados');
}

// Función para crear datos de prueba
function createTestData() {
  console.log('🔧 Creando datos de prueba...');
  
  const testProducts = [
    {
      id: 'test-1',
      name: 'Producto Test 1',
      price: 1000,
      cost: 600,
      stock: 10
    },
    {
      id: 'test-2',
      name: 'Producto Test 2',
      price: 2000,
      cost: 1200,
      stock: 5
    }
  ];
  
  const testSales = [
    {
      id: 'sale-test-1',
      date: new Date().toISOString(),
      items: [{ id: 'test-1', name: 'Producto Test 1', quantity: 2, price: 1000 }],
      totalSalePrice: 2000,
      totalSaleCost: 1200
    }
  ];
  
  const testSettings = {
    theme: 'default-dark',
    profitMargin: 50,
    roundingMultiple: 100
  };
  
  localStorage.setItem('namustock_products_offline', JSON.stringify(testProducts));
  localStorage.setItem('namustock_sales_offline', JSON.stringify(testSales));
  localStorage.setItem('namustock_settings_offline', JSON.stringify(testSettings));
  
  console.log('✅ Datos de prueba creados');
}

// Función para ejecutar suite completa de pruebas
function runOfflineTests() {
  console.log('🚀 Ejecutando suite completa de pruebas offline...');
  
  // 1. Limpiar datos previos
  cleanupTestData();
  
  // 2. Crear datos de prueba
  createTestData();
  
  // 3. Verificar datos creados
  checkLocalStorage();
  
  // 4. Simular offline
  simulateOffline();
  
  setTimeout(() => {
    // 5. Simular online después de 3 segundos
    simulateOnline();
    
    setTimeout(() => {
      // 6. Verificar datos después de sincronización
      checkLocalStorage();
      console.log('✅ Suite de pruebas completada');
    }, 2000);
  }, 3000);
}

// Exportar funciones para uso en consola
window.offlineTests = {
  simulateOffline,
  simulateOnline,
  checkLocalStorage,
  cleanupTestData,
  createTestData,
  runOfflineTests
};

console.log('✅ Funciones de prueba cargadas. Usa window.offlineTests para acceder a ellas.');
console.log('📖 Funciones disponibles:');
console.log('  - simulateOffline(): Simula pérdida de conexión');
console.log('  - simulateOnline(): Simula restauración de conexión');
console.log('  - checkLocalStorage(): Verifica datos locales');
console.log('  - cleanupTestData(): Limpia datos de prueba');
console.log('  - createTestData(): Crea datos de prueba');
console.log('  - runOfflineTests(): Ejecuta suite completa de pruebas');

// Ejecutar pruebas automáticamente si se desea
// runOfflineTests();