// Servicio para manejar sincronización en segundo plano
class BackgroundSyncService {
  constructor() {
    this.syncQueue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 segundos
  }

  // Agregar operación a la cola de sincronización
  addToQueue(operation) {
    const queueItem = {
      id: Date.now() + Math.random(),
      operation,
      attempts: 0,
      timestamp: new Date().toISOString()
    };
    
    this.syncQueue.push(queueItem);
    console.log('📋 Operación agregada a la cola de sincronización:', queueItem.id);
    
    // Procesar cola si no está en proceso
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Procesar cola de sincronización
  async processQueue() {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log('🔄 Procesando cola de sincronización...');

    while (this.syncQueue.length > 0) {
      const item = this.syncQueue[0];
      
      try {
        console.log(`⚡ Procesando operación ${item.id} (intento ${item.attempts + 1})`);
        
        // Ejecutar operación
        await item.operation();
        
        // Remover de la cola si fue exitosa
        this.syncQueue.shift();
        console.log(`✅ Operación ${item.id} completada exitosamente`);
        
      } catch (error) {
        console.error(`❌ Error en operación ${item.id}:`, error);
        
        item.attempts++;
        
        if (item.attempts >= this.retryAttempts) {
          // Remover después de máximos intentos
          this.syncQueue.shift();
          console.log(`🚫 Operación ${item.id} descartada después de ${this.retryAttempts} intentos`);
        } else {
          // Mover al final de la cola para reintentar después
          const failedItem = this.syncQueue.shift();
          this.syncQueue.push(failedItem);
          console.log(`🔄 Operación ${item.id} reintentará en ${this.retryDelay}ms`);
          
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    this.isProcessing = false;
    console.log('✅ Cola de sincronización procesada completamente');
  }

  // Limpiar cola
  clearQueue() {
    this.syncQueue = [];
    this.isProcessing = false;
    console.log('🧹 Cola de sincronización limpiada');
  }

  // Obtener estado de la cola
  getQueueStatus() {
    return {
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessing,
      nextOperation: this.syncQueue[0] || null
    };
  }
}

// Instancia singleton
const backgroundSync = new BackgroundSyncService();

export default backgroundSync;