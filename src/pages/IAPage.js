import React, { useState, useMemo, useEffect } from 'react';
import {
  Mic,
  Image as ImageIcon,
  Search,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { useRandomGlow } from '../hooks/useRandomGlow';
import { formatNumber, roundToMultiple, getDaysUntilExpiry } from '../utils/helpers';
import AddProductModal from '../components/AddProductModal';
import FloatingActionButton from '../components/FloatingActionButton';
import ProductDetailsModal from '../components/ProductDetailsModal';

const IAPage = ({
  products,
  showNotification,
  themeType,
  handleAddProduct,
  handleUpdateProduct,
  handleDeleteProduct,
  profitMargin,
  roundingMultiple,
  roundingDirection,
  allowDecimals,
  productImages,
  inventorySort,
  setInventorySort,
  setIaPageDetailsRef
}) => {
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Actualizar la referencia en App.js cuando cambie el estado del modal
  useEffect(() => {
    if (setIaPageDetailsRef) {
      setIaPageDetailsRef({
        isOpen: isDetailsModalOpen,
        setIsOpen: setIsDetailsModalOpen
      });
    }
  }, [isDetailsModalOpen, setIaPageDetailsRef]);

  const categories = useMemo(() => {
    const allCategories = products.map(p => p.category).filter(Boolean);
    return [...new Set(allCategories)];
  }, [products]);

  const { isGlowActive: isGlowActive3 } = useRandomGlow(themeType === 'dark');

  useEffect(() => {
    if (selectedProductForDetails) {
      const updatedProduct = products.find(p => p.id === selectedProductForDetails.id);
      if (updatedProduct) {
        setSelectedProductForDetails(updatedProduct);
      }
    }
  }, [products, selectedProductForDetails]);

  const handleProductClick = (product) => {
    setSelectedProductForDetails(product);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setSelectedProductForDetails(null);
    setIsDetailsModalOpen(false);
  };

  const filteredAndSortedInventory = useMemo(() => {
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(inventorySearchTerm.toLowerCase())
    );
    const sorted = [...filtered];

    switch (inventorySort) {
      case 'alphabetical':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'category':
        return sorted.sort((a, b) => (a.category || 'Sin categoría').localeCompare(b.category || 'Sin categoría'));
      case 'stock':
        return sorted.sort((a, b) => a.stock - b.stock);
      case 'expiry':
        return sorted.sort((a, b) => {
          if (!a.expiryDate && !b.expiryDate) return 0;
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate) - new Date(b.expiryDate);
        });
      default:
        return sorted;
    }
  }, [products, inventorySort, inventorySearchTerm]);

  const getInventoryItemStyle = (product) => {
    const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);

    if (daysUntilExpiry !== null && daysUntilExpiry <= 0) {
      return 'animate-pulse-red border-red-500 bg-red-500/10'; // Expired
    }
    if (product.stock === 0) {
      return 'animate-pulse-orange border-orange-500 bg-orange-500/10'; // Out of stock
    }
    if (daysUntilExpiry !== null && daysUntilExpiry <= 4) {
      return 'bg-red-500/10 border-red-400'; // Nearing expiry
    }
    if (product.stock <= 4) {
      return 'bg-orange-500/10 border-orange-400'; // Low stock
    }
    return 'border-[var(--color-border)]'; // Default
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6">
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onAddProduct={handleAddProduct}
        profitMargin={profitMargin}
        roundingMultiple={roundingMultiple}
        roundingDirection={roundingDirection}
        allowDecimals={allowDecimals}
        themeType={themeType}
        showNotification={showNotification}
        existingProducts={products}
      />

      <ProductDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        product={selectedProductForDetails}
        onUpdate={handleUpdateProduct}
        onDelete={handleDeleteProduct}
        productImages={productImages}
        categories={categories}
      />

      <header className="mb-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Gestión de Inventario</h1>
        </div>
      </header>

      <div className="mb-4">
        <div className={`bg-[var(--color-bg-secondary)] p-4 rounded-xl shadow-lg border border-[var(--color-border)] ${isGlowActive3 ? 'dark-glow' : ''} ${themeType === 'light' ? 'light-shadow' : ''}`}>
          <div className="flex flex-wrap gap-2 justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Inventario de la Tienda</h2>
            <div className="flex gap-1.5 items-center">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                <input
                  type="text"
                  placeholder='Buscar en inventario...'
                  value={inventorySearchTerm}
                  onChange={(e) => setInventorySearchTerm(e.target.value)}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md py-1 pl-7 pr-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all duration-200"
                />
              </div>
              <div className="relative">
                <select
                  onChange={(e) => setInventorySort(e.target.value)}
                  value={inventorySort}
                  className="appearance-none bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md py-1 pl-2.5 pr-6 text-sm text-[var(--color-text-primary)] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all duration-200"
                >
                  <option value="alphabetical">Alfabético</option>
                  <option value="category">Categoría</option>
                  <option value="stock">Stock</option>
                  <option value="expiry">Vencimiento</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-secondary)] absolute top-1/2 right-1.5 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {filteredAndSortedInventory.map(product => {
              const itemStyle = getInventoryItemStyle(product);
              return (
                <div key={product.id} 
                     className={`bg-[var(--color-bg)] p-4 rounded-lg border transition-all duration-300 cursor-pointer hover:border-[var(--color-primary)] hover:shadow-md ${itemStyle}`}
                     onClick={() => handleProductClick(product)}>
                  <div className="mb-3">
                    <p className="font-bold text-lg text-[var(--color-text-primary)] break-words leading-tight" title={product.name}>
                      {product.name}
                    </p>
                  </div>

                  <div className="flex items-start gap-4">
                    <img
                      src={(Array.isArray(productImages[product.id]) ? productImages[product.id][0] : productImages[product.id]) || 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image'}
                      alt={product.name}
                      className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/200x200/cccccc/ffffff?text=Error';
                      }}
                    />
                    <div className="flex-grow min-w-0">
                      <p className="text-sm text-[var(--color-text-secondary)] truncate mb-1">
                        Categoría: <span className="font-semibold">{product.category}</span>
                      </p>
                      {product.expiryDate && (
                        <div className="text-sm text-yellow-600 font-semibold flex items-start gap-1">
                          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <span>Vence:</span>
                            <br />
                            <span>{product.expiryDate}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-sm mt-3 pt-3 border-t border-[var(--color-border)]">
                    <div className="min-w-0">
                      <p className="font-bold text-base text-[var(--color-text-primary)] truncate">{product.stock}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Stock</p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base text-orange-500 truncate" title={`${formatNumber(product.cost || 0, allowDecimals)}`}>
                        ${formatNumber(product.cost || 0, allowDecimals)}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Costo</p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base text-green-600 truncate" title={`${formatNumber(roundToMultiple(product.price || 0, roundingMultiple, roundingDirection), allowDecimals)}`}>
                        ${formatNumber(roundToMultiple(product.price || 0, roundingMultiple, roundingDirection), allowDecimals)}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Precio</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Indicador de límite de productos movido abajo - ELIMINADO */}

      <FloatingActionButton onClick={() => setIsAddProductModalOpen(true)} />
    </div>
  );
};

export default React.memo(IAPage);