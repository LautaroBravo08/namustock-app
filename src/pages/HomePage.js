import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ShoppingCart, LayoutGrid, List, ChevronDown, Trash2 } from 'lucide-react';
import { useRandomGlow } from '../hooks/useRandomGlow';
import { formatNumber } from '../utils/helpers';
import ProductCard from '../components/ProductCard';
import ProductListItem from '../components/ProductListItem';

const HomePage = ({ 
  products, 
  addToCart, 
  themeType, 
  cartItems, 
  cartTotal, 
  removeFromCart, 
  handleCheckout, 
  cardStyle, 
  loading, 
  error, 
  roundingMultiple, 
  allowDecimals 
}) => {
  const [view, setView] = useState('card');
  const [sort, setSort] = useState('alphabetical');
  const [searchTerm, setSearchTerm] = useState('');
  const [animatePrice, setAnimatePrice] = useState(false);
  const { isGlowActive } = useRandomGlow(themeType === 'dark');
  const priceRef = useRef(cartTotal);

  useEffect(() => {
    if (cartTotal !== priceRef.current) {
      setAnimatePrice(true);
      const timer = setTimeout(() => {
        setAnimatePrice(false);
      }, 500);
      priceRef.current = cartTotal;
      return () => clearTimeout(timer);
    }
  }, [cartTotal]);

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
      default: 
        return sorted;
    }
  }, [products, sort, searchTerm]);

  const gridClassName = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className={`bg-[var(--color-bg-secondary)] shadow rounded-lg p-4 mb-6 border border-[var(--color-border)] ${isGlowActive ? 'dark-glow' : ''} ${themeType === 'light' ? 'light-shadow' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
            <input 
              type="text"
              placeholder='Buscar productos...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg py-2 pl-10 pr-4 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          
          <div className="text-center md:col-span-1">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)] py-4">
                <ShoppingCart className="w-10 h-10" />
                <p className="mt-2 font-medium">El carrito está vacío</p>
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
                      <div className={`text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] animate-gradient-x transition-transform duration-500 ease-out ${animatePrice ? 'animate-price-pop' : ''}`}>
                        ${formatNumber(cartTotal, allowDecimals)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-end gap-2 md:col-span-1">
            <div className="flex items-center bg-[var(--color-bg)] rounded-lg p-1 border border-[var(--color-border)]">
              <button 
                onClick={() => setView('card')} 
                className={`p-2 rounded-md ${view === 'card' ? 'bg-[var(--color-bg-secondary)] shadow' : ''}`}
              >
                <LayoutGrid className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
              <button 
                onClick={() => setView('list')} 
                className={`p-2 rounded-md ${view === 'list' ? 'bg-[var(--color-bg-secondary)] shadow' : ''}`}
              >
                <List className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
            
            <div className="relative">
              <select 
                onChange={(e) => setSort(e.target.value)} 
                value={sort} 
                className="appearance-none bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg py-2 pl-3 pr-8 text-[var(--color-text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="alphabetical">Alfabético</option>
                <option value="stock">Stock</option>
                <option value="price">Precio</option>
                <option value="category">Categoría</option>
              </select>
              <ChevronDown className="h-5 w-5 text-[var(--color-text-secondary)] absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      {loading && <p>Cargando productos...</p>}
      {error && <p className="text-red-500">Error al cargar productos.</p>}
      {!loading && !error && products.length === 0 && <p>No se encontraron productos.</p>}
      
      {!loading && !error && products.length > 0 && (
        view === 'card' ? (
          <div className={gridClassName}>
            {filteredAndSortedProducts.map(p => 
              <ProductCard 
                key={p.id} 
                product={p} 
                addToCart={addToCart} 
                cardStyle={cardStyle} 
                roundingMultiple={roundingMultiple} 
                allowDecimals={allowDecimals} 
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedProducts.map(p => 
              <ProductListItem 
                key={p.id} 
                product={p} 
                addToCart={addToCart} 
                themeType={themeType} 
                roundingMultiple={roundingMultiple} 
                allowDecimals={allowDecimals} 
              />
            )}
          </div>
        )
      )}
    </div>
  );
};

export default HomePage;