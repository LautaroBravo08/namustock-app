import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ShoppingCart, LayoutGrid, List, ChevronDown, Trash2 } from 'lucide-react';
import { useRandomGlow } from '../hooks/useRandomGlow';
import { formatNumber } from '../utils/helpers';
import ProductCard from '../components/ProductCard';
import ProductListItem from '../components/ProductListItem';
import InstantSearch from '../components/InstantSearch';
import ProductDetailsModal from '../components/ProductDetailsModal';

const HomePage = ({ 
  products = [], 
  addToCart, 
  themeType, 
  cartItems = [], 
  cartTotal, 
  removeFromCart, 
  handleCheckout, 
  cardStyle, 
  error, 
  roundingMultiple, 
  roundingDirection, 
  allowDecimals,
  productImages, // <-- Recibir caché de imágenes
  // Estados sincronizados
  sort,
  setSort,
  view,
  setView,
  setHomePageDetailsRef
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const animatePrice = false;
  const isGlowActive = false;
  const priceRef = useRef(cartTotal);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Actualizar la referencia en App.js cuando cambie el estado del modal
  useEffect(() => {
    if (setHomePageDetailsRef) {
      setHomePageDetailsRef({
        isOpen: isDetailsModalOpen,
        setIsOpen: setIsDetailsModalOpen
      });
    }
  }, [isDetailsModalOpen, setHomePageDetailsRef]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);



  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedProduct(null);
  };

  const categories = useMemo(() => {
    const allCategories = products.map(p => p.category).filter(Boolean);
    return [...new Set(allCategories)];
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = selectedCategory === 'all' || p.category === selectedCategory;
      return searchMatch && categoryMatch;
    });
    const sorted = [...filtered];
    
    switch (sort) {
      case 'alphabetical': 
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'stock': 
        return sorted.sort((a, b) => b.stock - a.stock);
      case 'price': 
        return sorted.sort((a, b) => a.price - b.price);
      case 'category': 
        return sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      case 'date':
        return sorted.sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt) : null;
          const bDate = b.createdAt ? new Date(b.createdAt) : null;
          if (aDate && !bDate) return -1; // `a` tiene fecha, `b` no -> `a` va primero
          if (!aDate && bDate) return 1;  // `b` tiene fecha, `a` no -> `b` va primero
          if (!aDate && !bDate) return 0; // ninguno tiene fecha -> sin cambios
          return bDate - aDate; // ambos tienen fecha -> ordenar por fecha
        });
      default: 
        return sorted;
    }
  }, [products, sort, searchTerm, selectedCategory]);

  const PRODUCTS_PER_PAGE = 16;
  const totalPages = Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, currentPage]);

  const gridClassName = "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6";

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
      <header className={`bg-[var(--color-bg-secondary)] shadow rounded-lg p-1.5 mb-2 border border-[var(--color-border)]`}>
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-1.5">
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
              <input 
                type="text"
                placeholder='Buscar productos...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus={true}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md py-1 pl-7 pr-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all duration-200"
              />
            </div>
          </div>
          
          <div className="text-center md:col-span-1">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)] py-2">
                <ShoppingCart className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-full">
                <div className="space-y-1 max-h-28 overflow-y-auto pr-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm animate-cart-item-in">
                      <span className="font-medium text-[var(--color-text-primary)] truncate">
                        {item.name} <span className="text-[var(--color-text-secondary)]">({item.quantity})</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          ${formatNumber(item.price * item.quantity, allowDecimals)}
                        </span>
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[var(--color-border)] mt-2 pt-2">
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={handleCheckout} 
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-green-600 transition-colors duration-200 text-sm"
                    >
                      Vender
                    </button>
                    <div className="text-right">
                      <span className="text-sm font-medium text-[var(--color-text-secondary)]">Total</span>
                      <div className={`text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)]`}>
                        ${formatNumber(cartTotal, allowDecimals)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-end gap-1.5 md:col-span-1">
            <div className="flex items-center bg-[var(--color-bg)] rounded-md p-0.5 border border-[var(--color-border)]">
              <button 
                onClick={() => setView('card')} 
                className={`p-1 rounded-sm ${view === 'card' ? 'bg-[var(--color-bg-secondary)] shadow' : ''}`}
              >
                <LayoutGrid className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
              </button>
              <button 
                onClick={() => setView('list')} 
                className={`p-1 rounded-sm ${view === 'list' ? 'bg-[var(--color-bg-secondary)] shadow' : ''}`}
              >
                <List className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
            
            <div className="relative">
              <select 
                onChange={(e) => setSelectedCategory(e.target.value)} 
                value={selectedCategory} 
                className="appearance-none bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md py-1 pl-2.5 pr-6 text-[var(--color-text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-xs"
              >
                <option value="all">Categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-secondary)] absolute top-1/2 right-1.5 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select 
                onChange={(e) => setSort(e.target.value)} 
                value={sort} 
                className="appearance-none bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md py-1 pl-2.5 pr-6 text-[var(--color-text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-xs"
              >
                <option value="alphabetical">Alfabético</option>
                <option value="stock">Stock</option>
                <option value="price">Precio</option>
                <option value="category">Categoría</option>
                <option value="date">Más recientes</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-secondary)] absolute top-1/2 right-1.5 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      {error && <p className="text-red-500">Error al cargar productos.</p>}
      {products.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-[var(--color-text-secondary)] mb-4">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No hay productos disponibles</p>
            <p className="text-sm mt-2">Los productos aparecerán aquí cuando se sincronicen</p>
          </div>
        </div>
      )}
      
      {products.length > 0 && (
        <>
          {view === 'card' ? (
            <div className={gridClassName}>
              {paginatedProducts.map(p => 
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  addToCart={addToCart} 
                  cardStyle={cardStyle} 
                  roundingMultiple={roundingMultiple} 
                  roundingDirection={roundingDirection} 
                  allowDecimals={allowDecimals} 
                  imageUrls={productImages[p.id]} // <-- Pasar el ARRAY de URLs
                  onProductClick={handleProductClick}
                />
              )}
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {paginatedProducts.map(p => 
                <ProductListItem 
                  key={p.id} 
                  product={p} 
                  addToCart={addToCart} 
                  themeType={themeType} 
                  roundingMultiple={roundingMultiple} 
                  roundingDirection={roundingDirection} 
                  allowDecimals={allowDecimals} 
                  imageUrl={productImages[p.id] && productImages[p.id][0]} // <-- Pasar SOLO la primera URL
                  onProductClick={handleProductClick}
                />
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-6">
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.max(prev - 1, 1));
                  window.scrollTo(0, 0);
                }}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-md disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-[var(--color-text-secondary)]">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.min(prev + 1, totalPages));
                  window.scrollTo(0, 0);
                }}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-md disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      <ProductDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        product={selectedProduct}
        isReadOnly={true}
        productImages={productImages}
      />
    </div>
  );
};

export default React.memo(HomePage);