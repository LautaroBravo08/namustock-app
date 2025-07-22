import React, { useState, useEffect, useRef } from 'react';
import { BarChart2, Home, Cpu, BookText, Settings, Sun, Download, Upload, LogIn } from 'lucide-react';
import { useRandomGlow } from '../hooks/useRandomGlow';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'ia', label: 'IA', icon: Cpu },
    { id: 'registros', label: 'Registros', icon: BookText },
  ];

  const { isGlowActive } = useRandomGlow(themeType === 'dark');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <nav className={`bg-[var(--color-bg-navbar)] backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-[var(--color-border)] transition-shadow duration-500 ${isGlowActive ? 'dark-glow' : ''} ${'light-shadow'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-16">
          {/* Left section */}
          <div className="flex items-center justify-self-start">
            <div className="flex-shrink-0">
              <BarChart2 className="h-8 w-8 text-[var(--color-primary)]" />
            </div>
            <span className="ml-3 text-2xl font-bold text-[var(--color-text-primary)] hidden sm:inline">
              TiendaModerna
            </span>
          </div>

          {/* Center section */}
          <div className="hidden md:flex items-center justify-self-center">
            <div className="flex items-baseline space-x-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    currentPage === item.id
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

          {/* Right section */}
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
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] rounded-lg font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                <LogIn className="h-5 w-5" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t border-[var(--color-border)]">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 w-full ${
                currentPage === item.id
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
    </nav>
  );
};

export default Navbar;