import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart2 } from 'lucide-react';

// Styles
import './styles/globals.css';

// Firebase
import { useAuth } from './hooks/useAuth';
import { saveProducts, getProducts, onProductsChange, saveSale, getSales, onSalesChange, saveUserSettings, getUserSettings, deleteSales } from './firebase/firestore';

// Components
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import IAPage from './pages/IAPage';
import RegistrosPage from './pages/RegistrosPage';
import CartModal from './components/CartModal';
import CartButton from './components/CartButton';
import AppearanceModal from './components/AppearanceModal';
import SettingsModal from './components/SettingsModal';
import ImportExportModal from './components/ImportExportModal';
import AuthModal from './components/AuthModal';
import EmailVerificationModal from './components/EmailVerificationModal';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import Notification from './components/Notification';
import NotificationSettings from './components/NotificationSettings';
import UpdateNotification from './components/UpdateNotification';

// Services and hooks
import notificationService from './services/notificationService';
import { useInventoryAnalysis } from './hooks/useInventoryAnalysis';

// Data and utilities
import { initialProducts } from './data/initialData';
import { themes } from './data/themes';
import { roundUpToMultiple, formatNumber } from './utils/helpers';

export default function App() {
    // Authentication
    const { user, loading: authLoading } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isEmailVerificationModalOpen, setIsEmailVerificationModalOpen] = useState(false);

    // App state
    const [currentPage, setCurrentPage] = useState('home');
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState(null);
    const [sales, setSales] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '' });
    
    // Settings
    const [theme, setTheme] = useState('default-light');
    const [glowIntensity, setGlowIntensity] = useState(0.4);
    const [shadowIntensity, setShadowIntensity] = useState(0.1);
    const [cardStyle, setCardStyle] = useState('default');
    const [profitMargin, setProfitMargin] = useState(40);
    const [roundingMultiple, setRoundingMultiple] = useState(100);
    const [allowDecimals, setAllowDecimals] = useState(true);
    
    // Modals
    const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

    const appStyles = {
        ...themes[theme].colors,
        '--glow-intensity': glowIntensity,
        '--shadow-intensity': shadowIntensity,
        '--shadow-length': '12px'
    };
    const themeType = themes[theme].type;

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

    // Firebase Effects
    useEffect(() => {
        if (user) {
            // Cargar productos del usuario
            const loadUserProducts = async () => {
                setProductsLoading(true);
                const { products: userProducts, error } = await getProducts(user.uid);
                if (error) {
                    console.error('Error loading products:', error);
                    setProducts(initialProducts); // Fallback a productos iniciales
                } else {
                    setProducts(userProducts.length > 0 ? userProducts : initialProducts);
                }
                setProductsLoading(false);
            };

            // Cargar ventas del usuario
            const loadUserSales = async () => {
                console.log('📊 Cargando ventas iniciales...');
                const { sales: userSales, error } = await getSales(user.uid);
                if (error) {
                    console.error('Error loading sales:', error);
                } else {
                    console.log(`📊 Ventas cargadas: ${userSales.length}`);
                    setSales(userSales);
                }
            };

            // Cargar configuraciones del usuario
            const loadUserSettings = async () => {
                const { settings, error } = await getUserSettings(user.uid);
                if (error) {
                    console.error('Error loading settings:', error);
                } else if (settings) {
                    setTheme(settings.theme || 'default-light');
                    setGlowIntensity(settings.glowIntensity || 0.4);
                    setShadowIntensity(settings.shadowIntensity || 0.1);
                    setCardStyle(settings.cardStyle || 'default');
                    setProfitMargin(settings.profitMargin || 40);
                    setRoundingMultiple(settings.roundingMultiple || 100);
                    setAllowDecimals(settings.allowDecimals !== undefined ? settings.allowDecimals : true);
                }
                // Marcar que las configuraciones se han cargado
                setSettingsLoaded(true);
            };

            loadUserProducts();
            loadUserSales();
            loadUserSettings();

            // Configurar listeners en tiempo real
            const unsubscribeProducts = onProductsChange(user.uid, (products) => {
                setProducts(products);
            });

            // Listener de ventas con manejo inteligente de eliminaciones
            const unsubscribeSales = onSalesChange(user.uid, (firebaseSales) => {
                console.log(`🔄 Listener: Recibidas ${firebaseSales.length} ventas de Firebase`);
                
                // Debug: Mostrar IDs de las ventas recibidas de Firebase
                firebaseSales.forEach((sale, index) => {
                    console.log(`  ${index + 1}. ID: ${sale.id} | Fecha: ${new Date(sale.date).toLocaleTimeString()}`);
                });
                
                // Si hay eliminaciones en progreso, no actualizar el estado
                if (deletingIds.size > 0) {
                    console.log('⏳ Listener: Eliminación en progreso, ignorando actualización');
                    return;
                }
                
                // Filtrar ventas que están siendo eliminadas
                const filteredSales = firebaseSales.filter(sale => !deletingIds.has(sale.id));
                
                console.log(`📊 Listener: Actualizando estado con ${filteredSales.length} ventas`);
                setSales(filteredSales);
            });

            return () => {
                unsubscribeProducts();
                unsubscribeSales();
            };
        } else {
            // Usuario no autenticado - usar datos locales
            setProducts(initialProducts);
            setSales([]);
            setSettingsLoaded(false); // Reset cuando no hay usuario
            setDeletingIds(new Set()); // Limpiar IDs de eliminación
        }
    }, [user, deletingIds]);

    // Estado para controlar si las configuraciones ya se cargaron
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Guardar configuraciones cuando cambien (solo después de cargarlas)
    useEffect(() => {
        if (user && settingsLoaded) {
            const settings = {
                theme,
                glowIntensity,
                shadowIntensity,
                cardStyle,
                profitMargin,
                roundingMultiple,
                allowDecimals
            };
            saveUserSettings(user.uid, settings);
            console.log('Configuraciones guardadas:', settings);
        }
    }, [user, settingsLoaded, theme, glowIntensity, shadowIntensity, cardStyle, profitMargin, roundingMultiple, allowDecimals]);

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
    const handleAddProduct = async (productData) => {
        const newProducts = [...products, productData];
        setProducts(newProducts);
        
        if (user) {
            const { error } = await saveProducts(user.uid, newProducts);
            if (error) {
                console.error('Error saving products:', error);
                showNotification(`Error al guardar: ${error}`);
            } else {
                showNotification(`${productData.name} añadido y sincronizado.`);
            }
        } else {
            showNotification(`${productData.name} añadido localmente.`);
        }
    };

    const handleUpdateProduct = async (productId, updatedData) => {
        const newProducts = products.map(p => p.id === productId ? { ...p, ...updatedData } : p);
        setProducts(newProducts);
        
        if (user) {
            const { error } = await saveProducts(user.uid, newProducts);
            if (error) {
                console.error('Error saving products:', error);
                showNotification(`Error al actualizar: ${error}`);
            } else {
                showNotification("Producto actualizado y sincronizado.");
            }
        } else {
            showNotification("Producto actualizado localmente.");
        }
    };

    const handleDeleteProduct = async (productId) => {
        const newProducts = products.filter(p => p.id !== productId);
        setProducts(newProducts);
        
        if (user) {
            const { error } = await saveProducts(user.uid, newProducts);
            if (error) {
                console.error('Error saving products:', error);
                showNotification(`Error al eliminar: ${error}`);
            } else {
                showNotification("Producto eliminado y sincronizado.");
            }
        } else {
            showNotification("Producto eliminado localmente.");
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
            return [...prevItems, { ...product, quantity: 1, price: roundUpToMultiple(product.price, roundingMultiple) }];
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

        const totalSalePrice = roundUpToMultiple(
            cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
            roundingMultiple
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

        if (user) {
            // Guardar en Firebase primero
            const { error: productsError } = await saveProducts(user.uid, updatedProducts);
            const { error: saleError, id: firebaseId } = await saveSale(user.uid, newSale);
            
            if (productsError || saleError) {
                console.error('Error saving to Firebase:', { productsError, saleError });
                showNotification("¡Venta realizada! Pero hubo un error al sincronizar.");
                // Agregar con ID temporal si falla Firebase
                setSales(prev => [...prev, newSale]);
            } else {
                console.log('✅ Venta guardada con ID de Firebase:', firebaseId);
                showNotification("¡Venta realizada y sincronizada exitosamente!");
                // No agregamos al estado local aquí porque el listener se encargará
            }
        } else {
            // Solo para usuarios no autenticados
            setSales(prev => [...prev, newSale]);
            showNotification("¡Venta realizada localmente!");
        }
    };

    // Análisis de inventario para notificaciones
    const inventoryAnalysis = useInventoryAnalysis(products);

    // Efecto para programar notificaciones cuando cambien los productos
    useEffect(() => {
        if (user && products.length > 0) {
            const { lowStockCount, expiringCount } = inventoryAnalysis;
            if (lowStockCount > 0 || expiringCount > 0) {
                notificationService.scheduleInventoryNotification(lowStockCount, expiringCount);
            }
        }
    }, [user, inventoryAnalysis]);

    // Inicializar notificaciones cuando el usuario se loguee
    useEffect(() => {
        if (user) {
            notificationService.initialize().then(success => {
                if (success) {
                    notificationService.scheduleDailyNotifications();
                }
            });
        }
    }, [user]);

    const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = useMemo(() =>
        roundUpToMultiple(
            cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
            roundingMultiple
        ),
        [cartItems, roundingMultiple]
    );

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage
                    products={products}
                    loading={productsLoading}
                    error={productsError}
                    addToCart={addToCart}
                    themeType={themeType}
                    cartItems={cartItems}
                    cartTotal={cartTotal}
                    removeFromCart={removeFromCart}
                    handleCheckout={handleCheckout}
                    cardStyle={cardStyle}
                    roundingMultiple={roundingMultiple}
                    allowDecimals={allowDecimals}
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
                    allowDecimals={allowDecimals}
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
                    loading={productsLoading}
                    error={productsError}
                    addToCart={addToCart}
                    themeType={themeType}
                    cartItems={cartItems}
                    cartTotal={cartTotal}
                    removeFromCart={removeFromCart}
                    handleCheckout={handleCheckout}
                    cardStyle={cardStyle}
                    roundingMultiple={roundingMultiple}
                    allowDecimals={allowDecimals}
                />;
        }
    };

    // Mostrar loading mientras se verifica la autenticación
    if (authLoading) {
        return (
            <div style={appStyles} className="bg-[var(--color-bg)] text-[var(--color-text-primary)] min-h-screen font-sans flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
                    <p className="text-[var(--color-text-secondary)]">Cargando TiendaModerna...</p>
                </div>
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
                onLoginClick={() => setIsAuthModalOpen(true)}
                user={user}
                showNotification={showNotification}
                themeType={themeType}
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

            <CartButton itemCount={cartItemCount} onClick={() => setIsCartOpen(true)} />

            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cartItems={cartItems}
                updateCartQuantity={updateCartQuantity}
                removeFromCart={removeFromCart}
                handleCheckout={handleCheckout}
                themeType={themeType}
                roundingMultiple={roundingMultiple}
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
            />

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                profitMargin={profitMargin}
                setProfitMargin={setProfitMargin}
                roundingMultiple={roundingMultiple}
                setRoundingMultiple={setRoundingMultiple}
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

            <UpdateNotification />
        </div>
    );
}