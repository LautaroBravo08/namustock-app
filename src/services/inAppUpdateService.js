// Servicio de actualización in-app para Android
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Browser } from '@capacitor/browser';

class InAppUpdateService {
  constructor() {
    this.isDownloading = false;
    this.downloadProgress = 0;
    this.listeners = [];
  }

  // Agregar listener para progreso de descarga
  addProgressListener(callback) {
    this.listeners.push(callback);
  }

  // Remover listener
  removeProgressListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  // Notificar progreso
  notifyProgress(progress) {
    this.listeners.forEach(callback => callback(progress));
  }

  // Verificar si podemos hacer actualización in-app
  canUpdateInApp() {
    return Capacitor.getPlatform() === 'android';
  }

  // Descargar e instalar APK
  async downloadAndInstall(downloadUrl) {
    if (!this.canUpdateInApp()) {
      throw new Error('Actualización in-app solo disponible en Android');
    }

    if (this.isDownloading) {
      throw new Error('Ya hay una descarga en progreso');
    }

    this.isDownloading = true;
    this.downloadProgress = 0;

    try {
      // Notificar inicio de descarga
      this.notifyProgress({ status: 'downloading', progress: 0 });

      // Descargar APK usando fetch con seguimiento de progreso
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Error descargando: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        if (total) {
          const progress = Math.round((loaded / total) * 100);
          this.downloadProgress = progress;
          this.notifyProgress({ status: 'downloading', progress });
        }
      }

      // Combinar chunks en un solo array
      const apkData = new Uint8Array(loaded);
      let position = 0;
      for (const chunk of chunks) {
        apkData.set(chunk, position);
        position += chunk.length;
      }

      // Convertir a base64 para Capacitor
      const base64Data = this.arrayBufferToBase64(apkData);

      // Guardar APK en el sistema de archivos
      const fileName = `namustock-update-${Date.now()}.apk`;
      
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache
      });

      this.notifyProgress({ status: 'installing', progress: 100 });

      // Obtener la URI del archivo
      const fileUri = await Filesystem.getUri({
        directory: Directory.Cache,
        path: fileName
      });

      // Instalar APK usando intent de Android
      await this.installApk(fileUri.uri);

      this.notifyProgress({ status: 'completed', progress: 100 });
      
      return true;

    } catch (error) {
      console.error('Error en actualización in-app:', error);
      this.notifyProgress({ status: 'error', error: error.message });
      throw error;
    } finally {
      this.isDownloading = false;
    }
  }

  // Instalar APK usando intent de Android
  async installApk(fileUri) {
    try {
      // Usar plugin nativo para instalar APK
      if (window.AndroidInstaller) {
        await window.AndroidInstaller.installApk(fileUri);
      } else {
        // Fallback: abrir con intent genérico
        await Browser.open({
          url: fileUri,
          windowName: '_system'
        });
      }
    } catch (error) {
      console.error('Error instalando APK:', error);
      // Fallback: abrir URL de descarga en navegador
      await Browser.open({
        url: fileUri,
        windowName: '_system'
      });
    }
  }

  // Convertir ArrayBuffer a Base64
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }

  // Actualización simple (abrir en navegador)
  async openDownloadUrl(downloadUrl) {
    try {
      await Browser.open({
        url: downloadUrl,
        windowName: '_system'
      });
      return true;
    } catch (error) {
      console.error('Error abriendo URL de descarga:', error);
      // Fallback: window.open
      window.open(downloadUrl, '_system');
      return true;
    }
  }
}

// Instancia singleton
const inAppUpdateService = new InAppUpdateService();
export default inAppUpdateService;