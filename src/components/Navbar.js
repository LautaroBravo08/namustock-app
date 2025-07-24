import React, { useEffect, useRef } from 'react';
import { BarChart2, Home, Cpu, BookText, LogIn } from 'lucide-react';
import { useRandomGlow } from '../hooks/useRandomGlow';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';
import UserMenu from './UserMenu';

const Navbar = ({ 
  currentPage, 
  setCurrentPage, 
  onAppearanceClick, 
  onSettingsClick, 
  onImportExportClick, 
  onLoginClick,
  user,
  showNotification,
  themeType 
}) => {
  const menuRef = useRef(null);
  
  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'ia', label: 'IA', icon: Cpu },
    { id: 'registros', label: 'Registros', icon: BookText },
  ];

  const { isGlowActive } = useRandomGlow(themeType === 'dark');
  const { isKeyboardOpen } = useVirtualKeyboard();

  // El useEffect para handleClickOutside ya no es necesario
  // ya que eliminamos el estado isMenuOpen

  // Ocultar navbar cuando el teclado esté abierto
  if (isKeyboardOpen) {
    return null;
  }

  return (
    <nav className={`bg-[var(--color-bg-navbar)] backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-[var(--color-border)] transition-all duration-300 ${isGlowActive ? 'dark-glow' : ''} ${'light-shadow'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-16">
          {/* Left section - Vacío para balance */}
          <div className="flex items-center justify-self-start">
            {/* Espacio vacío para balance visual */}
          </div>

          {/* Center section - Logo y Navegación */}
          <div className="flex items-center justify-self-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <BarChart2 className="h-6 w-6 text-[var(--color-primary)]" />
                <span className="ml-2 text-lg font-bold text-[var(--color-text-primary)] hidden sm:inline">
                  NamuStock
                </span>
              </div>
              
              {/* Navigation buttons - más compactos */}
              <div className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                      currentPage === item.id
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
                showNotification={showNotification}
              />
            ) : (
              <button 
                onClick={onLoginClick}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-[var(--color-primary-text)] rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors text-sm"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav - Más compacto */}
      <div className="md:hidden border-t border-[var(--color-border)]">
        <div className="px-2 py-1.5 flex justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 w-full ${
                currentPage === item.id
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
    </nav>
  );
};

export default Navbar;