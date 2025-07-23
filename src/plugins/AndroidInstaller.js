// Plugin personalizado para instalar APK en Android
import { registerPlugin } from '@capacitor/core';

const AndroidInstaller = registerPlugin('AndroidInstaller', {
  web: {
    async installApk(options) {
      console.log('AndroidInstaller no disponible en web');
      // Fallback para web: abrir URL
      window.open(options.path, '_blank');
      return { success: false, message: 'No disponible en web' };
    }
  }
});

export default AndroidInstaller;