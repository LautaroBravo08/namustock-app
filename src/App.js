import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart2 } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';

// Styles
import './styles/globals.css';

// Hooks
import { useAuth } from './hooks/useAuth';
import useVersionCleanup from './hooks/useVersionCleanup';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useNetworkStatus } from './hooks/useNetworkStatus';

// Services
import updateService from './services/updateService';

// Firebase
import { onSalesChange, saveUserSettings, getUserSettings, deleteSales, onProductsChange, getProducts, onSettingsChange, getProductImage, getMultipleProductImages, initializeUserSettings } from './firebase/firestore';
import firebaseApp from './firebase/config';

// Components
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import IAPage from './pages/IAPage';
import RegistrosPage from './pages/RegistrosPage';
import CartModal from './components/CartModal';
// import PremiumModal from './components/PremiumModal';
// import UpdateModal from './components/UpdateModal';

import AppearanceModal from './components/AppearanceModal';
import SettingsModal from './components/SettingsModal';
import ImportExportModal from './components/ImportExportModal';
import AuthModal from './components/AuthModal';
import EmailVerificationModal from './components/EmailVerificationModal';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import Notification from './components/Notification';

import UpdateNotification from './components/UpdateNotification';
import DebugLogger from './components/DebugLogger';
import SyncIndicator from './components/SyncIndicator';
import OfflineNotification from './components/OfflineNotification';

// Services and hooks
import { canAddMoreProducts } from './services/subscriptionService';

// Data and utilities
import { initialProducts } from './data/initialData';
import { themes } from './data/themes';
import { roundToMultiple, formatNumber } from './utils/helpers';

export default function App() {
    // LIMPIEZA FORZADA DE VERSIONES AL INICIAR
    useVersionCleanup();

    // Authentication
    const { user, loading: authLoading } = useAuth();
    
    // Network status and offline sync
    const { isOnline } = useNetworkStatus();
    const { 
        isSyncing, 
        pendingChanges, 
        lastSyncTime, 
        syncPendingChanges,
        handleProducts,
        handleSales,
        handleSettings,
        clearLocalData
    } = useOfflineSync(user);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isEmailVerificationModalOpen, setIsEmailVerificationModalOpen] = useState(false);

    // App state
    const [currentPage, setCurrentPage] = useState('home');
    const [products, setProducts] = useState([]);
    const [productsError, setProductsError] = useState(null);
    const [sales, setSales] = useState([]);
    const [productImages, setProductImages] = useState({}); // <-- Caché para imágenes de productos
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '' });

    // Settings
        const [theme, setTheme] = useState('default-dark');
    const [glowIntensity, setGlowIntensity] = useState(0.4);
    const [shadowIntensity, setShadowIntensity] = useState(0.1);
    const [cardStyle, setCardStyle] = useState('default');
    const [profitMargin, setProfitMargin] = useState(40);
    const [roundingMultiple, setRoundingMultiple] = useState(100);
    const [roundingDirection, setRoundingDirection] = useState('up');
    const [allowDecimals, setAllowDecimals] = useState(false);
    const [appName, setAppName] = useState('NamuStock');
    const [appIcon, setAppIcon] = useState('BarChart2');
    const [customIconUrl, setCustomIconUrl] = useState(null);
    const [isPremium, setIsPremium] = useState(false); // <-- Estado para el status premium
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // View states for synchronization
    const [homeSort, setHomeSort] = useState('alphabetical');
    const [homeViewMode, setHomeViewMode] = useState('card');
    const [inventorySort, setInventorySort] = useState('alphabetical');
    const [inventoryViewMode, setInventoryViewMode] = useState('list');

    // Modals
    const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
    // const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false); // <-- Estado para modal premium
    
    // Update modal states
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadStatus, setDownloadStatus] = useState('idle');

    // Update service is already initialized as singleton
    // const updateService = useMemo(() => new UpdateService(), []);

    const appStyles = {
        ...themes[theme].colors,
        '--glow-intensity': glowIntensity,
        '--shadow-intensity': shadowIntensity,
        '--shadow-length': '12px'
    };
    const themeType = themes[theme].type;

    useEffect(() => {
        document.body.style.backgroundColor = themes[theme].colors['--color-bg'];
    }, [theme]);

    // Estado para controlar las ventanas de detalles de producto
    const [homePageDetailsRef, setHomePageDetailsRef] = useState({ isOpen: false, setIsOpen: null });
    const [iaPageDetailsRef, setIaPageDetailsRef] = useState({ isOpen: false, setIsOpen: null });

    // Manejo del botón atrás para cerrar ventanas modales y la aplicación
    useEffect(() => {
        let lastBackPress = 0;
        let backButtonListener = null;
        
        const handleBackButton = () => {
            console.log("Botón atrás presionado");
            
            // Cerrar ventanas de detalles de producto primero
            if (homePageDetailsRef.isOpen && homePageDetailsRef.setIsOpen) {
                console.log("Cerrando detalles de producto en HomePage");
                homePageDetailsRef.setIsOpen(false);
            } else if (iaPageDetailsRef.isOpen && iaPageDetailsRef.setIsOpen) {
                console.log("Cerrando detalles de producto en IAPage");
                iaPageDetailsRef.setIsOpen(false);
            }
            // Cerrar modales abiertos después
            else if (isCartOpen) {
                console.log("Cerrando carrito");
                setIsCartOpen(false);
            } else if (isAppearanceModalOpen) {
                console.log("Cerrando modal de apariencia");
                setIsAppearanceModalOpen(false);
            } else if (isSettingsModalOpen) {
                console.log("Cerrando modal de configuración");
                setIsSettingsModalOpen(false);
            } else if (isImportExportModalOpen) {
                console.log("Cerrando modal de importación/exportación");
                setIsImportExportModalOpen(false);
            /* } else if (isPremiumModalOpen) {
                console.log("Cerrando modal premium");
                setIsPremiumModalOpen(false); */
            } else if (isAuthModalOpen) {
                console.log("Cerrando modal de autenticación");
                setIsAuthModalOpen(false);
            } else if (isEmailVerificationModalOpen) {
                console.log("Cerrando modal de verificación de email");
                setIsEmailVerificationModalOpen(false);
            } else {
                // Si no hay modales abiertos, manejar el doble clic para salir
                const now = new Date().getTime();
                if (now - lastBackPress < 2000) {
                    // Doble clic en menos de 2 segundos, cerrar la aplicación
                    console.log("Cerrando aplicación");
                    CapacitorApp.exitApp();
                } else {
                    // Primer clic, mostrar notificación
                    lastBackPress = now;
                    console.log("Primer clic en atrás, mostrando notificación");
                    showNotification('Presiona atrás nuevamente para salir');
                }
            }
        };

        // Registrar el listener para el botón atrás
        console.log("Registrando listener para botón atrás");
        
        // Capacitor addListener returns a Promise, so we need to handle it properly
        CapacitorApp.addListener('backButton', handleBackButton).then(listener => {
            backButtonListener = listener;
        });
        
        // Limpiar el listener cuando el componente se desmonte
        return () => {
            console.log("Eliminando listener de botón atrás");
            if (backButtonListener) {
                backButtonListener.remove();
            }
        };
    }, [isCartOpen, isAppearanceModalOpen, isSettingsModalOpen, isImportExportModalOpen, 
        /* isPremiumModalOpen, */ isAuthModalOpen, isEmailVerificationModalOpen,
        homePageDetailsRef, iaPageDetailsRef]);

    const showNotification = (message) => {
        setNotification({ show: true, message });
        setTimeout(() => {
            setNotification({ show: false, message: '' });
        }, 3000);
    };

    

    // Verificar si el usuario necesita verificar su email
    useEffect(() => {
        if (user && !user.emailVerified) {
            // Mostrar el modal de verificación después de un breve delay
            const timer = setTimeout(() => {
                setIsEmailVerificationModalOpen(true);
            }, 2000);
            return () => clearTimeout(timer);
        } else {
            setIsEmailVerificationModalOpen(false);
        }
    }, [user]);

    // Estado para controlar operaciones de eliminación en progreso
    const [deletingIds, setDeletingIds] = useState(new Set());

    // Firebase Effects: Carga de datos y listeners en tiempo real
    useEffect(() => {
        // No ejecutar nada hasta que el estado de autenticación sea definitivo.
        if (authLoading) return;

        if (user) {
            // Inicializar el servicio de actualización con Firebase
            updateService.initialize(firebaseApp);
            
            // La carga inicial de datos offline es manejada automáticamente por la persistencia de Firestore.

            // 1. Listener para Productos
            const unsubscribeProducts = onProductsChange(user.uid, (firebaseProducts) => {
                setProducts(firebaseProducts || []);
            });

            // 2. Inicializar y escuchar cambios en Configuraciones
            initializeUserSettings(user.uid).then(() => {
                console.log('🔧 Inicializando settings para usuario:', user.uid);
            });
            
            const unsubscribeSettings = onSettingsChange(user.uid, (settings) => {
                if (settings) {
                    console.log('📋 Settings recibidos:', settings); // Debug log
                    setIsPremium(settings.isPremium || false); // <-- Actualizar estado premium
                                        setTheme(settings.theme || 'default-dark');
                    setGlowIntensity(settings.glowIntensity || 0.4);
                    setShadowIntensity(settings.shadowIntensity || 0.1);
                    setCardStyle(settings.cardStyle || 'default');
                    setProfitMargin(settings.profitMargin || 40);
                    setRoundingMultiple(settings.roundingMultiple || 100);
                    setRoundingDirection(settings.roundingDirection || 'up');
                    setAllowDecimals(settings.allowDecimals !== undefined ? settings.allowDecimals : true);
                    setHomeSort(settings.homeSort || 'alphabetical');
                    setHomeViewMode(settings.homeViewMode || 'card');
                    setInventorySort(settings.inventorySort || 'alphabetical');
                    setInventoryViewMode(settings.inventoryViewMode || 'list');
                    setAppName(settings.appName || 'NamuStock');
                    setAppIcon(settings.appIcon || 'BarChart2');
                    setCustomIconUrl(settings.customIconUrl || null);
                }
                setSettingsLoaded(true);
            });

            // 3. Listener para Ventas
            const unsubscribeSales = onSalesChange(user.uid, (firebaseSales) => {
                if (deletingIds.size === 0) {
                    setSales(firebaseSales);
                }
            });

            // Limpieza de todos los listeners al salir
            return () => {
                unsubscribeProducts();
                unsubscribeSettings();
                unsubscribeSales();
            };
        } else {
            // Usuario no autenticado - limpiar datos
            clearLocalData();
            setProducts(initialProducts);
            setSales([]);
            setSettingsLoaded(false);
            setDeletingIds(new Set());
        }
    }, [user, authLoading, deletingIds, updateService]);

    // Configurar listener para actualizaciones
    useEffect(() => {
        if (!user) return;

        const handleUpdateEvent = (data) => {
            console.log('🔄 Evento de actualización:', data);
            
            if (data.type) {
                switch (data.type) {
                    case 'update-available':
                        setUpdateInfo(data);
                        setIsUpdateModalOpen(true);
                        break;
                    case 'download-start':
                        setDownloadStatus('downloading');
                        setDownloadProgress(0);
                        break;
                    case 'download-progress':
                        setDownloadProgress(data.progress);
                        break;
                    case 'download-complete':
                        setDownloadStatus('complete');
                        break;
                    case 'error':
                        setDownloadStatus('error');
                        showNotification(`Error en actualización: ${data.message}`);
                        break;
                    case 'no-update':
                        console.log('✅ La aplicación está actualizada');
                        break;
                }
            }
        };

        updateService.addListener(handleUpdateEvent);

        // Verificar actualizaciones al iniciar
        const checkUpdates = async () => {
            try {
                await updateService.checkForUpdates();
            } catch (error) {
                console.error('Error al verificar actualizaciones:', error);
            }
        };

        checkUpdates();

        return () => {
            updateService.removeListener(handleUpdateEvent);
        };
    }, [user]);

    // Verificación periódica de actualizaciones
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(async () => {
            try {
                await updateService.checkForUpdates();
            } catch (error) {
                console.error('Error en verificación periódica:', error);
            }
        }, 5 * 60 * 1000); // Cada 5 minutos

        return () => clearInterval(interval);
    }, [user]);

    // Efecto para cargar y cachear las imágenes de los productos
    useEffect(() => {
        const loadProductImages = async () => {
            if (!user || !products.length) return;

            const productsWithImagesToLoad = products.filter(p => {
                if (!p.imageIds || p.imageIds.length === 0) return false;
                const cachedImages = productImages[p.id] || [];
                return cachedImages.length !== p.imageIds.length;
            });

            if (productsWithImagesToLoad.length === 0) return;

            const imageMap = {};
            const allImageIds = productsWithImagesToLoad.flatMap(p => p.imageIds);
            
            if (allImageIds.length > 0) {
                const { images, error } = await getMultipleProductImages(user.uid, allImageIds);
                if (!error) {
                    const imageUrlMap = {};
                    images.forEach(img => {
                        if (img.data && !img.error) {
                            imageUrlMap[img.id] = img.data;
                        }
                    });

                    productsWithImagesToLoad.forEach(p => {
                        imageMap[p.id] = p.imageIds.map(id => imageUrlMap[id]).filter(url => url);
                    });
                }
            }
            
            if (Object.keys(imageMap).length > 0) {
                setProductImages(prevImages => ({ ...prevImages, ...imageMap }));
            }
        };

        loadProductImages();
    }, [user, products]);

    // Efecto para recalcular precios de todos los productos cuando cambia la configuración de redondeo
    useEffect(() => {
        if (user && settingsLoaded) {
            setProducts(currentProducts => {
                if (currentProducts.length === 0) {
                    return currentProducts;
                }

                const newProducts = currentProducts.map(p => {
                    const originalPrice = (p.cost || 0) * (1 + profitMargin / 100);
                    const newPrice = roundToMultiple(originalPrice, roundingMultiple, roundingDirection);
                    return { ...p, price: newPrice };
                });

                const pricesChanged = currentProducts.some((p, index) => p.price !== newProducts[index].price);

                if (pricesChanged) {
                    handleProducts.save(newProducts);
                    return newProducts;
                } else {
                    return currentProducts;
                }
            });
        }
    }, [roundingMultiple, roundingDirection, profitMargin, settingsLoaded, user, handleProducts]);

    // Efecto para actualizar los precios en el carrito cuando los precios de los productos cambian
    useEffect(() => {
      if (cartItems.length > 0) {
        const newCartItems = cartItems.map(item => {
          const productInState = products.find(p => p.id === item.id);
          if (productInState && item.price !== productInState.price) {
            return { ...item, price: productInState.price };
          }
          return item;
        });
    
        const cartPricesChanged = cartItems.some((item, index) => item.price !== newCartItems[index].price);
    
        if (cartPricesChanged) {
          setCartItems(newCartItems);
        }
      }
    }, [products, cartItems]);



    // Guardar configuraciones cuando cambien (solo después de cargarlas) con soporte offline y debounce
    useEffect(() => {
        if (user && settingsLoaded) {
            const handler = setTimeout(() => {
                const settings = {
                    theme,
                    glowIntensity,
                    shadowIntensity,
                    cardStyle,
                    profitMargin,
                    roundingMultiple,
                    roundingDirection, // Save setting
                    allowDecimals,
                    // Configuraciones de vista
                    homeSort,
                    homeViewMode,
                    inventorySort,
                    inventoryViewMode,
                    // Personalización de la aplicación
                    appName,
                    appIcon,
                    customIconUrl
                };
                handleSettings.save(settings);
                console.log('Configuraciones guardadas (debounced):', settings);
            }, 1000); // 1 second debounce delay

            return () => {
                clearTimeout(handler);
            };
        }
    }, [user, settingsLoaded, theme, glowIntensity, shadowIntensity, cardStyle, profitMargin, roundingMultiple, roundingDirection, allowDecimals, homeSort, homeViewMode, inventorySort, inventoryViewMode, appName, appIcon, customIconUrl, handleSettings]);

    // File handling functions
    const saveDataToFile = (data, filename) => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification(`${filename} guardado.`);
    };

    const handleFileLoad = (event, setData) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const data = JSON.parse(content);
                setData(data);
                showNotification(`${file.name} cargado correctamente.`);
            } catch (error) {
                console.error("Error parsing file:", error);
                showNotification(`Error al leer el archivo ${file.name}.`);
            }
        };
        reader.readAsText(file);
        event.target.value = null;
    };

    const triggerFileLoad = (setData) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt, .json';
        input.onchange = (e) => handleFileLoad(e, setData);
        input.click();
    };

    const saveProductsToFile = () => saveDataToFile(products, 'products.txt');
    const saveSalesToFile = () => saveDataToFile(sales, 'sales.txt');
    const loadProductsFromFile = () => triggerFileLoad(setProducts);
    const loadSalesFromFile = () => triggerFileLoad(setSales);

    // CRUD Functions
    const handleAddProduct = async (productData, isUpdate = false) => {
        let newProducts;
        
        if (isUpdate) {
            const productToUpdate = products.find(p => p.id === productData.id);
            if (!productToUpdate) return;

            let updatedProduct = { ...productData };

            if (productToUpdate.price !== updatedProduct.price) {
                const priceHistory = productToUpdate.priceHistory || [];
                const newPriceHistoryEntry = {
                    date: new Date().toISOString(),
                    oldPrice: productToUpdate.price,
                    newPrice: updatedProduct.price,
                };
                updatedProduct.priceHistory = [...priceHistory, newPriceHistoryEntry];
            }

            newProducts = products.map(p => p.id === productData.id ? updatedProduct : p);
            
            setProducts(newProducts);
            
            const { error } = await handleProducts.save(newProducts);
            if (error && error.includes('sincronizará')) {
                showNotification(`${productData.name} actualizado - ${error}`);
            } else if (error) {
                showNotification(`Error al actualizar: ${error}`);
            } else {
                showNotification(`${productData.name} actualizado${isOnline ? ' y sincronizado' : ' localmente'}.`);
            }
        } else {
            // Verificar límite de productos antes de agregar
            /* const productLimits = canAddMoreProducts(products.length, isPremium);
            
            if (!productLimits.canAdd) {
                showNotification(`¡Límite alcanzado! Los usuarios gratuitos pueden tener hasta ${productLimits.limit} productos. Suscríbete a Premium para productos ilimitados.`);
                setIsPremiumModalOpen(true);
                return;
            } */
            
            // Mostrar advertencia si está cerca del límite
            /* if (!isPremium && productLimits.remaining <= 20) {
                showNotification(`¡Atención! Solo te quedan ${productLimits.remaining} productos disponibles.`);
            } */
            
            const newProduct = {
                ...productData,
                createdAt: new Date().toISOString()
            };
            newProducts = [...products, newProduct];
            setProducts(newProducts);

            const { error } = await handleProducts.save(newProducts);
            if (error && error.includes('sincronizará')) {
                showNotification(`${productData.name} añadido - ${error}`);
            } else if (error) {
                showNotification(`Error al guardar: ${error}`);
            } else {
                showNotification(`${productData.name} añadido${isOnline ? ' y sincronizado' : ' localmente'}.`);
            }
        }
    };

    const handleUpdateProduct = async (productId, updatedData) => {
        const productToUpdate = products.find(p => p.id === productId);
        if (!productToUpdate) return;

        const newProducts = [...products];
        const productIndex = newProducts.findIndex(p => p.id === productId);

        let mutableUpdatedData = { ...updatedData };

        if (mutableUpdatedData.price !== undefined) {
            mutableUpdatedData.price = Number(mutableUpdatedData.price);
        }
        if (mutableUpdatedData.cost !== undefined) {
            mutableUpdatedData.cost = Number(mutableUpdatedData.cost);
        }
        if (mutableUpdatedData.stock !== undefined) {
            mutableUpdatedData.stock = Number(mutableUpdatedData.stock);
        }

        const updatedProduct = { ...productToUpdate, ...mutableUpdatedData };

        if (mutableUpdatedData.price !== undefined && productToUpdate.price !== mutableUpdatedData.price) {
            const priceHistory = productToUpdate.priceHistory || [];
            const newPriceHistoryEntry = {
                date: new Date().toISOString(),
                oldPrice: productToUpdate.price,
                newPrice: mutableUpdatedData.price,
            };
            updatedProduct.priceHistory = [...priceHistory, newPriceHistoryEntry];
        }

        newProducts[productIndex] = updatedProduct;

        setProducts(newProducts);

        const { error } = await handleProducts.save(newProducts);
        if (error && error.includes('sincronizará')) {
            showNotification(`Producto actualizado - ${error}`);
        } else if (error) {
            showNotification(`Error al actualizar: ${error}`);
        } else {
            showNotification(`Producto actualizado${isOnline ? ' y sincronizado' : ' localmente'}.`);
        }
    };

    const handleDeleteProduct = async (productId) => {
        const newProducts = products.filter(p => p.id !== productId);
        setProducts(newProducts);

        const { error } = await handleProducts.save(newProducts);
        if (error && error.includes('sincronizará')) {
            showNotification(`Producto eliminado - ${error}`);
        } else if (error) {
            showNotification(`Error al eliminar: ${error}`);
        } else {
            showNotification(`Producto eliminado${isOnline ? ' y sincronizado' : ' localmente'}.`);
        }
    };

    const handleDeleteSales = async (saleIds) => {
        console.log('🗑️ Iniciando eliminación de ventas:', saleIds);

        if (user) {
            try {
                // Marcar IDs como "siendo eliminados" para evitar conflictos con el listener
                setDeletingIds(prev => new Set([...prev, ...saleIds]));

                // Actualizar estado local inmediatamente para feedback visual
                const newSales = sales.filter(sale => !saleIds.includes(sale.id));
                setSales(newSales);

                console.log('📊 Ventas antes de eliminar:', sales.length);
                console.log('📊 Ventas después de filtrar:', newSales.length);
                console.log('🔒 IDs marcados como eliminándose:', saleIds);

                // Eliminar de Firebase
                const result = await deleteSales(user.uid, saleIds);

                if (result.error) {
                    console.error('❌ Error eliminando ventas de Firebase:', result.error);
                    // Revertir cambios locales si falla Firebase
                    setSales(sales);
                    showNotification(`Error al eliminar: ${result.error}`);
                } else {
                    console.log('✅ Ventas eliminadas exitosamente de Firebase');
                    showNotification(`${saleIds.length} venta${saleIds.length !== 1 ? 's' : ''} eliminada${saleIds.length !== 1 ? 's' : ''} y sincronizada${saleIds.length !== 1 ? 's' : ''}.`);
                }

                // Limpiar IDs de eliminación después de un breve delay
                setTimeout(() => {
                    setDeletingIds(prev => {
                        const newSet = new Set(prev);
                        saleIds.forEach(id => newSet.delete(id));
                        console.log('🔓 IDs liberados de eliminación:', saleIds);
                        return newSet;
                    });
                }, 2000); // 2 segundos de delay para asegurar sincronización

            } catch (error) {
                console.error('❌ Error en handleDeleteSales:', error);
                // Revertir cambios locales y limpiar IDs de eliminación
                setSales(sales);
                setDeletingIds(prev => {
                    const newSet = new Set(prev);
                    saleIds.forEach(id => newSet.delete(id));
                    return newSet;
                });
                showNotification(`Error inesperado al eliminar ventas: ${error.message}`);
            }
        } else {
            // Solo para usuarios no autenticados, actualizar estado local
            const newSales = sales.filter(sale => !saleIds.includes(sale.id));
            setSales(newSales);
            showNotification(`${saleIds.length} venta${saleIds.length !== 1 ? 's' : ''} eliminada${saleIds.length !== 1 ? 's' : ''} localmente.`);
        }
    };



    const addToCart = (product) => {
        const productInStock = products.find(p => p.id === product.id);
        if (!productInStock || productInStock.stock <= 0) {
            showNotification("Este producto está agotado.");
            return;
        }
        setCartItems(prevItems => {
            const itemInCart = prevItems.find(item => item.id === product.id);
            if (itemInCart) {
                if (itemInCart.quantity < productInStock.stock) {
                    return prevItems.map(item =>
                        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                    );
                } else {
                    showNotification("No hay más stock disponible para este producto.");
                    return prevItems;
                }
            }
            return [...prevItems, { ...product, quantity: 1, price: roundToMultiple(product.price, roundingMultiple, roundingDirection) }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    const updateCartQuantity = (productId, quantity) => {
        const productInStore = products.find(p => p.id === productId);
        if (quantity > productInStore.stock) {
            showNotification(`Solo quedan ${productInStore.stock} unidades en stock.`);
            return;
        }
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, quantity } : item
                )
            );
        }
    };

    const handleCheckout = async () => {
        let stockSufficient = true;
        const updatedProducts = [...products];

        for (const itemInCart of cartItems) {
            const productIndex = updatedProducts.findIndex(p => p.id === itemInCart.id);
            if (productIndex === -1 || updatedProducts[productIndex].stock < itemInCart.quantity) {
                stockSufficient = false;
                showNotification(`No hay suficiente stock para ${itemInCart.name}.`);
                break;
            }
            updatedProducts[productIndex].stock -= itemInCart.quantity;
        }

        if (!stockSufficient) return;

        const totalSalePrice = roundToMultiple(
            cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
            roundingMultiple,
            roundingDirection
        );
        const totalSaleCost = cartItems.reduce((sum, item) => sum + item.cost * item.quantity, 0);

        const newSale = {
            id: `sale_${Date.now()}`, // ID temporal para estado local
            date: new Date().toISOString(),
            items: cartItems.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                cost: item.cost,
            })),
            totalSalePrice,
            totalSaleCost,
        };

        // Actualizar productos localmente
        setProducts(updatedProducts);
        setCartItems([]);
        setIsCartOpen(false);

        // Guardar productos y venta con soporte offline
        const { error: productsError } = await handleProducts.save(updatedProducts);
        const { error: saleError } = await handleSales.save(newSale);

        // Actualizar ventas localmente
        setSales(prev => [...prev, newSale]);

        if (productsError || saleError) {
            if ((productsError && productsError.includes('sincronizará')) || 
                (saleError && saleError.includes('sincronizará'))) {
                showNotification("¡Venta realizada! Se sincronizará cuando haya conexión.");
            } else {
                showNotification("¡Venta realizada! Pero hubo un error al guardar.");
            }
        } else {
            showNotification(`¡Venta realizada${isOnline ? ' y sincronizada' : ' localmente'}!`);
        }
    };



    const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = useMemo(() =>
        roundToMultiple(
            cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
            roundingMultiple,
            roundingDirection
        ),
        [cartItems, roundingMultiple, roundingDirection]
    );

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage
                    products={products}
                    addToCart={addToCart}
                    themeType={themeType}
                    cartItems={cartItems}
                    cartTotal={cartTotal}
                    removeFromCart={removeFromCart}
                    handleCheckout={handleCheckout}
                    cardStyle={cardStyle}
                    roundingMultiple={roundingMultiple}
                    roundingDirection={roundingDirection}
                    allowDecimals={allowDecimals}
                    productImages={productImages} // <-- Pasar el caché de imágenes
                    // Estados de vista sincronizados
                    sort={homeSort}
                    setSort={setHomeSort}
                    view={homeViewMode}
                    setView={setHomeViewMode}
                    setHomePageDetailsRef={setHomePageDetailsRef}
                />;
            case 'ia':
                return <IAPage
                    products={products}
                    showNotification={showNotification}
                    themeType={themeType}
                    handleAddProduct={handleAddProduct}
                    handleUpdateProduct={handleUpdateProduct}
                    handleDeleteProduct={handleDeleteProduct}
                    profitMargin={profitMargin}
                    roundingMultiple={roundingMultiple}
                    roundingDirection={roundingDirection}
                    allowDecimals={allowDecimals}
                    productImages={productImages}
                    inventorySort={inventorySort}
                    setInventorySort={setInventorySort}
                    viewMode={inventoryViewMode}
                    setViewMode={setInventoryViewMode}
                    setIaPageDetailsRef={setIaPageDetailsRef}
                    isPremium={isPremium}
                    onOpenPremiumModal={() => setIsPremiumModalOpen(true)}
                />;
            case 'registros':
                return <RegistrosPage
                    sales={sales}
                    themeType={themeType}
                    allowDecimals={allowDecimals}
                    onDeleteSales={handleDeleteSales}
                />;
            default:
                return <HomePage
                    products={products}
                    loading={false} // La variable de error ya no existe
                    error={null} // La variable de error ya no existe
                    addToCart={addToCart}
                    themeType={themeType}
                    cartItems={cartItems}
                    cartTotal={cartTotal}
                    removeFromCart={removeFromCart}
                    handleCheckout={handleCheckout}
                    cardStyle={cardStyle}
                    roundingMultiple={roundingMultiple}
                    roundingDirection={roundingDirection}
                    allowDecimals={allowDecimals}
                    productImages={productImages}
                    sort={homeSort}
                    setSort={setHomeSort}
                    view={homeViewMode}
                    setView={setHomeViewMode}
                    setHomePageDetailsRef={setHomePageDetailsRef}
                />;
        }
    };

    // Inicialización inmediata - cargar datos locales al inicio
    useEffect(() => {
        // Cargar datos locales inmediatamente (sin esperar autenticación)
        const loadLocalDataImmediately = () => {
            // Productos locales
            const localProducts = localStorage.getItem('namustock_products_offline');
            if (localProducts) {
                try {
                    const parsedProducts = JSON.parse(localProducts);
                    setProducts(parsedProducts.length > 0 ? parsedProducts : initialProducts);
                } catch (error) {
                    setProducts(initialProducts);
                }
            } else {
                setProducts(initialProducts);
            }

            // Ventas locales
            const localSales = localStorage.getItem('namustock_sales_offline');
            if (localSales) {
                try {
                    const parsedSales = JSON.parse(localSales);
                    setSales(parsedSales);
                } catch (error) {
                    setSales([]);
                }
            }

            // Configuraciones locales
            const localSettings = localStorage.getItem('namustock_settings_offline');
            if (localSettings) {
                try {
                    const settings = JSON.parse(localSettings);
                    if (settings) {
                        setTheme(settings.theme || 'default-dark');
                        setGlowIntensity(settings.glowIntensity || 0.4);
                        setShadowIntensity(settings.shadowIntensity || 0.1);
                        setCardStyle(settings.cardStyle || 'default');
                        setProfitMargin(settings.profitMargin || 40);
                        setRoundingMultiple(settings.roundingMultiple || 100);
                        setRoundingDirection(settings.roundingDirection || 'up');
                        setAllowDecimals(settings.allowDecimals !== undefined ? settings.allowDecimals : true);
                        setHomeSort(settings.homeSort || 'alphabetical');
                        setHomeViewMode(settings.homeViewMode || 'card');
                        setInventorySort(settings.inventorySort || 'alphabetical');
                        setInventoryViewMode(settings.inventoryViewMode || 'list');
                        setAppName(settings.appName || 'NamuStock');
                        setAppIcon(settings.appIcon || 'BarChart2');
                        setCustomIconUrl(settings.customIconUrl || null);
                    }
                } catch (error) {
                    console.error('Error parsing local settings:', error);
                }
            }
        };

        loadLocalDataImmediately();
    }, []);

    // No mostrar loading - la app está disponible inmediatamente

    if (authLoading) {
        return (
            <div style={appStyles} className="bg-[var(--color-bg)] text-[var(--color-text-primary)] min-h-screen font-sans flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        );
    }

    return (
        <div style={appStyles} className="bg-[var(--color-bg)] text-[var(--color-text-primary)] min-h-screen font-sans">
            <Notification message={notification.message} show={notification.show} />

            <Navbar
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onAppearanceClick={() => setIsAppearanceModalOpen(true)}
                onSettingsClick={() => setIsSettingsModalOpen(true)}
                onImportExportClick={() => setIsImportExportModalOpen(true)}
                onOpenPremiumModal={() => setIsPremiumModalOpen(true)}
                onLoginClick={() => setIsAuthModalOpen(true)}
                user={user}
                showNotification={showNotification}
                themeType={themeType}
                appName={appName}
                appIcon={appIcon}
                customIconUrl={customIconUrl}
                isPremium={isPremium}
            />
            

            <EmailVerificationBanner
                user={user}
                showNotification={showNotification}
            />

            <main>
                <div className="page-transition">
                    {renderPage()}
                </div>
            </main>



            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cartItems={cartItems}
                updateCartQuantity={updateCartQuantity}
                removeFromCart={removeFromCart}
                handleCheckout={handleCheckout}
                themeType={themeType}
                roundingMultiple={roundingMultiple}
                roundingDirection={roundingDirection}
                allowDecimals={allowDecimals}
            />

            <AppearanceModal
                isOpen={isAppearanceModalOpen}
                onClose={() => setIsAppearanceModalOpen(false)}
                theme={theme}
                setTheme={setTheme}
                themeType={themeType}
                glowIntensity={glowIntensity}
                setGlowIntensity={setGlowIntensity}
                shadowIntensity={shadowIntensity}
                setShadowIntensity={setShadowIntensity}
                cardStyle={cardStyle}
                setCardStyle={setCardStyle}
                appName={appName}
                setAppName={setAppName}
                appIcon={appIcon}
                setAppIcon={setAppIcon}
                customIconUrl={customIconUrl}
                setCustomIconUrl={setCustomIconUrl}
                showNotification={showNotification}
                isPremium={isPremium}
                onOpenPremiumModal={() => setIsPremiumModalOpen(true)}
            />

            <PremiumModal 
                isOpen={false} // Force closed as it's being removed
                onClose={() => setIsPremiumModalOpen(false)}
                isPremium={isPremium}
                user={user}
            />



            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                profitMargin={profitMargin}
                setProfitMargin={setProfitMargin}
                roundingMultiple={roundingMultiple}
                setRoundingMultiple={setRoundingMultiple}
                roundingDirection={roundingDirection}
                setRoundingDirection={setRoundingDirection}
                allowDecimals={allowDecimals}
                setAllowDecimals={setAllowDecimals}
                products={products}
            />

            <ImportExportModal
                isOpen={isImportExportModalOpen}
                onClose={() => setIsImportExportModalOpen(false)}
                saveProductsToFile={saveProductsToFile}
                loadProductsFromFile={loadProductsFromFile}
                saveSalesToFile={saveSalesToFile}
                loadSalesFromFile={loadSalesFromFile}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                showNotification={showNotification}
            />

            <EmailVerificationModal
                isOpen={isEmailVerificationModalOpen}
                onClose={() => setIsEmailVerificationModalOpen(false)}
                user={user}
                showNotification={showNotification}
            />

            {/* UpdateModal component needs to be created */}

            <UpdateNotification />

            <DebugLogger />
        </div>
    );
}