import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X, Smartphone, Monitor, Globe } from 'lucide-react';
import updateService from '../services/updateService';

const UpdateNotification = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, downloading, installing, completed, error
  
  // Estados para diálogos de permisos
  const [permissionDialog, setPermissionDialog] = useState(null);
  const [isPermissionDialogVisible, setIsPermissionDialogVisible] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = (data) => {
      if (data.type === 'update-available') {
        setUpdateInfo(data.updateInfo);
        setIsVisible(true);
        setUpdateStatus('idle');
        setDownloadProgress(0);
        setDownloadMessage('');
      } else if (data.type === 'download-progress') {
        setUpdateStatus('downloading');
        setDownloadProgress(data.progress || 0);
        setDownloadMessage(data.message || 'Descargando...');
      } else if (data.type === 'installation-started') {
        setUpdateStatus('installing');
        setDownloadProgress(100);
        setDownloadMessage(data.message || 'Instalando...');
      } else if (data.type === 'update-completed') {
        setUpdateStatus('completed');
        setDownloadMessage('¡Actualización completada!');
        // Ocultar notificación después de completar
        setTimeout(() => {
          setIsVisible(false);
          setUpdateInfo(null);
          setUpdateStatus('idle');
          setDownloadProgress(0);
          setDownloadMessage('');
        }, 3000);
      } else if (data.type === 'update-error') {
        setUpdateStatus('error');
        setDownloadMessage(data.message || 'Error durante la actualización');
      } else if (data.type === 'permission-explanation-dialog') {
        // Mostrar diálogo de permisos
        setPermissionDialog(data);
        setIsPermissionDialogVisible(true);
      } else if (data.type === 'ios-update-dialog') {
        // Mostrar diálogo específico de iOS
        setPermissionDialog(data);
        setIsPermissionDialogVisible(true);
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
    setUpdateStatus('downloading');
    setDownloadProgress(0);
    setDownloadMessage('Iniciando descarga...');
    
    try {
      await updateService.applyUpdate(updateInfo);
      // Si llegamos aquí, la actualización fue exitosa
      setUpdateStatus('completed');
      setDownloadMessage('¡Actualización completada!');
      setTimeout(() => {
        setIsVisible(false);
        setUpdateInfo(null);
        setUpdateStatus('idle');
        setDownloadProgress(0);
        setDownloadMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error durante la actualización:', error);
      setUpdateStatus('error');
      setDownloadMessage('Error: ' + error.message);
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

  // Manejar respuesta del diálogo de permisos
  const handlePermissionResponse = (action) => {
    if (permissionDialog) {
      // Enviar respuesta al servicio de actualizaciones
      updateService.notifyListeners({
        type: permissionDialog.type === 'permission-explanation-dialog' ? 'permission-dialog-response' : 'ios-dialog-response',
        action: action
      });
    }
    
    // Cerrar diálogo
    setIsPermissionDialogVisible(false);
    setPermissionDialog(null);
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

  // Renderizar diálogo de permisos si está visible
  if (isPermissionDialogVisible && permissionDialog) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-2xl p-6 max-w-md mx-4 animate-fade-in">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {permissionDialog.title}
            </h3>
            <button
              onClick={() => handlePermissionResponse('cancel')}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {permissionDialog.message}
            </p>

            {permissionDialog.permissions && permissionDialog.permissions.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  Permisos requeridos:
                </p>
                <div className="space-y-2">
                  {permissionDialog.permissions.map((permission, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                      <div className="flex-shrink-0 mt-0.5">
                        {permission.critical ? (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        ) : (
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          {permission.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                          {permission.description}
                        </p>
                        {permission.critical && (
                          <p className="text-xs text-red-500 mt-1 font-medium">
                            Requerido
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Seguridad:</strong> Estos permisos son necesarios para instalar la actualización de forma segura. 
                NamuStock solo solicita permisos esenciales para su funcionamiento.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handlePermissionResponse('cancel')}
              className="flex-1 px-4 py-2 text-sm border border-[var(--color-border)] rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handlePermissionResponse('grant')}
              className="flex-1 px-4 py-2 text-sm bg-[var(--color-primary)] text-[var(--color-primary-text)] rounded-md hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Conceder permisos
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
                <span>{downloadMessage || 'Descargando actualización...'}</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-[var(--color-bg)] rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] opacity-75">
                La actualización se instalará automáticamente
              </div>
            </div>
          )}

          {updateStatus === 'installing' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>{downloadMessage || 'Instalando actualización...'}</span>
              </div>
              <div className="w-full bg-[var(--color-bg)] rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-full"></div>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] opacity-75">
                Sigue las instrucciones en pantalla para completar la instalación
              </div>
            </div>
          )}

          {updateStatus === 'completed' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-green-600">
                <Download className="h-3 w-3" />
                <span>¡Descarga iniciada!</span>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] opacity-75">
                Se abrió en tu navegador para mayor seguridad
              </div>
            </div>
          )}

          {updateStatus === 'error' && (
            <div className="space-y-1">
              <div className="text-xs text-blue-500 font-medium">
                Descarga iniciada en navegador
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                {downloadMessage || 'Se abrió tu navegador para descargar de forma segura'}
              </div>
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