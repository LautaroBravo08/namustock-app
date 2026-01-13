import React, { useState, useEffect, useRef } from 'react';
import { X, BarChart2, Home, Store, ShoppingCart, Package, TrendingUp, Activity, Zap, Star, Heart, Coffee, Upload, Lock } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import ThemeSwitcher from './ThemeSwitcher';
import CardStyleSwitcher from './CardStyleSwitcher';

// Componente para la capa de bloqueo premium
const PremiumLockOverlay = ({ onOpenPremiumModal }) => (
    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10 flex flex-col justify-center items-center p-4 rounded-xl">
        <Lock className="h-12 w-12 text-yellow-400 mb-4" />
        <h3 className="text-xl font-bold text-white text-center">Función Premium</h3>
        <p className="text-gray-200 text-center mb-6">Desbloquea todas las opciones de apariencia con NamuStock Premium.</p>
        <button
            onClick={onOpenPremiumModal}
            className="bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-yellow-500 transition-colors"
        >
            Obtener Premium
        </button>
    </div>
);

const AppearanceModal = ({ 
  isOpen, 
  onClose, 
  theme, 
  setTheme, 
  themeType, 
  glowIntensity, 
  setGlowIntensity, 
  shadowIntensity, 
  setShadowIntensity, 
  cardStyle, 
  setCardStyle,
  appName,
  setAppName,
  appIcon,
  setAppIcon,
  customIconUrl,
  setCustomIconUrl,
  showNotification,
  isPremium, // <-- Nueva prop
  onOpenPremiumModal // <-- Nueva prop
}) => {
  const [showContent, setShowContent] = useState(false);
  const fileInputRef = useRef(null);
  useBodyScrollLock(isOpen);

  // Función para manejar la carga de archivos
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 256;
          canvas.height = 256;
          ctx.drawImage(img, 0, 0, 256, 256);
          const resizedImageUrl = canvas.toDataURL('image/png');
          
          setCustomIconUrl(resizedImageUrl);
          setAppIcon('custom');
          if (showNotification) {
            showNotification('Icono personalizado cargado y redimensionado a 256x256.');
          }
        };
        img.onerror = () => {
          if (showNotification) {
            showNotification('Error al cargar la imagen. Por favor, intenta con otro archivo.');
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      if (showNotification) {
        showNotification('Por favor, selecciona un archivo de imagen válido.');
      }
    }
    
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    event.target.value = '';
  };

  // Función para abrir el selector de archivos
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen && !showContent) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black z-[60] flex justify-center items-center p-4 transition-opacity duration-300 ${
        isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-sm border border-[var(--color-border)] transform transition-all duration-300 ease-out ${
          showContent && isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Apariencia</h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="relative">
          {/* {!isPremium && <PremiumLockOverlay onOpenPremiumModal={onOpenPremiumModal} />} */}
          <div className={`p-6 flex flex-col items-center gap-6 max-h-[80vh] overflow-y-auto`}>
            {/* Personalización de la Aplicación */}
            <div className="w-full flex flex-col items-center">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Personalización</h3>
              
              {/* Nombre de la aplicación */}
              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Nombre de la aplicación
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => {
                    // Remover espacios y capitalizar primera letra
                    const value = e.target.value.replace(/\s/g, '');
                    const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
                    setAppName(capitalizedValue);
                  }}
                  className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
                  placeholder="NombreDeTuAplicacion"
                  maxLength="20"
                />
              </div>

              {/* Selector de icono */}
              <div className="w-full">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Icono de la aplicación
                </label>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                  Sube una imagen en cualquier formato para tu icono personalizado. Se redimensionará a 256x256 píxeles.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: 'BarChart2', icon: BarChart2 },
                    { name: 'Store', icon: Store },
                    { name: 'ShoppingCart', icon: ShoppingCart },
                    { name: 'Package', icon: Package },
                    { name: 'TrendingUp', icon: TrendingUp },
                    { name: 'Activity', icon: Activity },
                    { name: 'Zap', icon: Zap },
                    { name: 'Star', icon: Star },
                    { name: 'Heart', icon: Heart },
                    { name: 'Coffee', icon: Coffee }
                  ].map(({ name, icon: IconComponent }) => (
                    <button
                      key={name}
                      onClick={() => setAppIcon(name)}
                      className={`p-3 rounded-lg border transition-colors ${
                        appIcon === name
                          ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] border-[var(--color-primary)]'
                          : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]'
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </button>
                  ))}
                  
                  {/* Botón para subir icono personalizado */}
                  <button
                    onClick={handleUploadClick}
                    className={`p-3 rounded-lg border transition-colors ${
                      appIcon === 'custom'
                        ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] border-[var(--color-primary)]'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                    }`}
                    title="Subir icono personalizado"
                  >
                    {appIcon === 'custom' && customIconUrl ? (
                      <img 
                        src={customIconUrl} 
                        alt="Icono personalizado" 
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </button>
                  
                  {/* Input oculto para seleccionar archivos */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            
            <hr className="w-full border-[var(--color-border)]"/>

            <div className="w-full flex flex-col items-center">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Tema</h3>
              <ThemeSwitcher 
                theme={theme}
                setTheme={setTheme}
                glowIntensity={glowIntensity}
                setGlowIntensity={setGlowIntensity}
                themeType={themeType}
                shadowIntensity={shadowIntensity}
                setShadowIntensity={setShadowIntensity}
              />
            </div>
            
            <hr className="w-full border-[var(--color-border)]"/>
            
            <div className="w-full flex flex-col items-center">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Diseño de Tarjeta</h3>
              <CardStyleSwitcher cardStyle={cardStyle} setCardStyle={setCardStyle} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceModal;