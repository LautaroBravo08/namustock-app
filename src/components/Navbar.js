import React, { useEffect, useRef } from 'react';
import { BarChart2, Home, Cpu, BookText, User, Store, ShoppingCart, Package, TrendingUp, Activity, Zap, Star, Heart, Coffee, Save } from 'lucide-react';
import { useRandomGlow } from '../hooks/useRandomGlow';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import UserMenu from './UserMenu';

const Navbar = ({
  currentPage,
  setCurrentPage,
  onAppearanceClick,
  onSettingsClick,
  onImportExportClick,
  onOpenPremiumModal,
  onLoginClick,
  user,
  showNotification,
  themeType,
  appName,
  appIcon,
  customIconUrl,
  isPremium
}) => {
  const menuRef = useRef(null);

  const navItems = [
    { id: 'home', label: '', icon: Home },
    { id: 'ia', label: '', icon: Package },
    { id: 'registros', label: '', icon: BookText },
  ];

  const { isGlowActive } = useRandomGlow(themeType === 'dark');
  const { isKeyboardOpen } = useVirtualKeyboard();

  // El useEffect para handleClickOutside ya no es necesario
  // ya que eliminamos el estado isMenuOpen

  // Función para obtener el icono dinámico
  const getAppIcon = () => {
    if (appIcon === 'custom' && customIconUrl) {
      return null; // Retornamos null para usar la imagen personalizada
    }
    const iconMap = {
      BarChart2, Store, ShoppingCart, Package, TrendingUp, Activity, Zap, Star, Heart, Coffee
    };
    return iconMap[appIcon] || BarChart2;
  };

  const AppIconComponent = getAppIcon();
  const isCustomIcon = appIcon === 'custom' && customIconUrl;

  // Ocultar navbar cuando el teclado esté abierto
  if (isKeyboardOpen) {
    return null; // No renderizar nada cuando el teclado esté abierto
  }

  return (
    <>
      <nav className={`bg-[var(--color-bg-navbar)] backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-[var(--color-border)] transition-all duration-300 ${isGlowActive ? 'dark-glow' : ''} ${'light-shadow'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center h-16">
            {/* Left section - Icono de la app */}
            <div className="flex items-center justify-self-start py-2">
              {isCustomIcon ? (
                <img
                  src={customIconUrl}
                  alt="Icono personalizado"
                  className="h-12 w-12 object-contain"
                />
              ) : (
                <AppIconComponent className="h-12 w-12 text-[var(--color-primary)]" />
              )}
            </div>

            {/* Center section - Nombre de la app y Navegación */}
            <div className="flex items-center justify-self-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <span className="text-lg font-bold text-[var(--color-text-primary)] whitespace-nowrap">
                    {appName || 'NamuStock'}
                  </span>
                </div>

                {/* Navigation buttons - tamaño uniforme */}
                <div className="hidden md:flex items-center space-x-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 min-w-[80px] ${currentPage === item.id
                          ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right section - User Menu */}
            <div className="flex items-center justify-end">
              {user ? (
                <UserMenu
                  user={user}
                  onAppearanceClick={onAppearanceClick}
                  onSettingsClick={onSettingsClick}
                  onImportExportClick={onImportExportClick}
                  onOpenPremiumModal={onOpenPremiumModal}
                  showNotification={showNotification}
                  isPremium={isPremium}
                />
              ) : (
                <button
                  onClick={onLoginClick}
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-[var(--color-bg)] transition-colors"
                >
                  <div className="w-8 h-8 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-[var(--color-primary-text)]" />
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-[var(--color-text-primary)]">
                    Iniciar Sesión
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Siempre visible en móvil */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-navbar)] backdrop-blur-lg border-t border-[var(--color-border)] shadow-lg">
        <div className="px-2 py-2 flex justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-colors duration-200 flex-1 mx-1 min-h-[60px] ${currentPage === item.id
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navbar;