import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X, Smartphone, Monitor, Globe } from 'lucide-react';
import updateService from '../services/updateService';

const UpdateNotification = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, downloading, installing, completed, error

  useEffect(() => {
    const handleUpdateAvailable = (data) => {
      if (data.type === 'update-available') {
        setUpdateInfo(data.updateInfo);
        setIsVisible(true);
        setUpdateStatus('idle');
      } else if (data.type === 'download-started') {
        setUpdateStatus('downloading');
        setDownloadProgress(0);
      } else if (data.type === 'download-progress') {
        setDownloadProgress(data.progress || 0);
        if (data.status === 'downloading') {
          setUpdateStatus('downloading');
        } else if (data.status === 'installing') {
          setUpdateStatus('installing');
        } else if (data.status === 'completed') {
          setUpdateStatus('completed');
          // Ocultar notificación después de completar
          setTimeout(() => {
            setIsVisible(false);
            setUpdateInfo(null);
            setUpdateStatus('idle');
          }, 2000);
        } else if (data.status === 'error') {
          setUpdateStatus('error');
        }
      } else if (data.type === 'update-completed') {
        // Mostrar notificación de actualización completada exitosamente
        console.log('🎉 Actualización completada:', data);
        // Opcional: mostrar un toast o notificación de éxito
      }
    };

    updateService.addListener(handleUpdateAvailable);

    // Iniciar verificación automática
    updateService.startAutoCheck();

    return () => {
      updateService.removeListener(handleUpdateAvailable);
      updateService.stopAutoCheck();
    };
  }, []);

  const handleUpdate = async () => {
    if (!updateInfo) return;

    setIsUpdating(true);
    try {
      await updateService.applyUpdate(updateInfo);
      // Si llegamos aquí, la actualización fue exitosa
      setIsVisible(false);
    } catch (error) {
      console.error('Error durante la actualización:', error);
      alert('Error al aplicar la actualización. Por favor, intenta de nuevo.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setUpdateInfo(null);
  };

  const handleCheckNow = async () => {
    setIsUpdating(true);
    try {
      const update = await updateService.checkForUpdates();
      if (update && update.available) {
        setUpdateInfo(update);
        setIsVisible(true);
      } else {
        alert('No hay actualizaciones disponibles en este momento.');
      }
    } catch (error) {
      console.error('Error verificando actualizaciones:', error);
      alert('Error al verificar actualizaciones.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'android':
      case 'ios':
        return <Smartphone className="h-5 w-5" />;
      case 'electron':
        return <Monitor className="h-5 w-5" />;
      case 'web':
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const getPlatformName = (platform) => {
    switch (platform) {
      case 'android':
        return 'Android';
      case 'ios':
        return 'iOS';
      case 'electron':
        return 'Escritorio';
      case 'web':
      default:
        return 'Web';
    }
  };

  // Si no hay actualización disponible, no mostrar nada
  if (!isVisible || !updateInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-4 animate-slide-up">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getPlatformIcon(updateInfo.platform)}
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              Actualización Disponible
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Nueva versión disponible para {getPlatformName(updateInfo.platform)}
          </p>
          
          {updateInfo.version && (
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Versión: {updateInfo.version}
            </p>
          )}

          {updateInfo.releaseNotes && (
            <div className="text-xs text-[var(--color-text-secondary)] max-h-20 overflow-y-auto">
              <p className="font-medium mb-1">Novedades:</p>
              <p>{updateInfo.releaseNotes.substring(0, 100)}...</p>
            </div>
          )}

          {/* Mostrar progreso y estado */}
          {updateStatus === 'downloading' && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
                <span>Descargando...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-[var(--color-bg)] rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {updateStatus === 'installing' && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Instalando actualización...</span>
              </div>
              <div className="w-full bg-[var(--color-bg)] rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-full"></div>
              </div>
            </div>
          )}

          {updateStatus === 'completed' && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <Download className="h-3 w-3" />
              <span>¡Actualización completada!</span>
            </div>
          )}

          {updateStatus === 'error' && (
            <div className="text-xs text-red-500">
              Error durante la actualización. Intenta de nuevo.
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
          >
            Más tarde
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 px-3 py-2 text-sm bg-[var(--color-primary)] text-[var(--color-primary-text)] rounded-md hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Actualizar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;