import React, { useState, useMemo } from 'react';
import { 
  Mic, 
  Image as ImageIcon, 
  CheckCircle, 
  Search, 
  ChevronDown, 
  Edit, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import { useRandomGlow } from '../hooks/useRandomGlow';
import { formatNumber, roundUpToMultiple, getDaysUntilExpiry } from '../utils/helpers';
import ConfirmationModal from '../components/ConfirmationModal';
import EditProductModal from '../components/EditProductModal';
import VoiceAIModal from '../components/VoiceAIModal';
import ImageAIModal from '../components/ImageAIModal';
import AddProductModal from '../components/AddProductModal';
import FloatingActionButton from '../components/FloatingActionButton';
import EditableReviewItem from '../components/EditableReviewItem';

const IAPage = ({ 
  products, 
  showNotification, 
  themeType, 
  handleAddProduct, 
  handleUpdateProduct, 
  handleDeleteProduct, 
  profitMargin, 
  roundingMultiple, 
  allowDecimals 
}) => {
  const [reviewItems, setReviewItems] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState(null);
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventorySort, setInventorySort] = useState('alphabetical');

  const { isGlowActive: isGlowActive2 } = useRandomGlow(themeType === 'dark');
  const { isGlowActive: isGlowActive3 } = useRandomGlow(themeType === 'dark');

  const filteredAndSortedInventory = useMemo(() => {
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(inventorySearchTerm.toLowerCase())
    );
    const sorted = [...filtered];
    
    switch (inventorySort) {
      case 'alphabetical': 
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'stock': 
        return sorted.sort((a, b) => b.stock - a.stock);
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

  const handleAddToReview = (item) => {
    setReviewItems(prev => [...prev, item]);
  };

  const handleReviewItemUpdate = (id, field, value) => {
    setReviewItems(currentItems =>
      currentItems.map(item => {
        if (item.id !== id) return item;
        
        const updatedItem = { ...item };
        if (field === 'totalCost') {
          const totalCost = parseFloat(value) || 0;
          const quantity = parseFloat(updatedItem.quantity) || 1;
          updatedItem.cost = (totalCost / quantity).toFixed(2);
        } else {
          updatedItem[field] = value;
        }
        
        if (field === 'cost' || field === 'quantity' || field === 'totalCost') {
          const newCost = parseFloat(updatedItem.cost) || 0;
          updatedItem.price = roundUpToMultiple(newCost * (1 + profitMargin / 100), roundingMultiple);
        }
        
        return updatedItem;
      })
    );
  };

  const handleRemoveReviewItem = (id) => {
    setReviewItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const handleConfirm = () => {
    reviewItems.forEach(item => {
      const newProduct = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        stock: parseInt(item.quantity, 10),
        cost: parseFloat(item.cost),
        price: parseFloat(item.price) || roundUpToMultiple(parseFloat(item.cost) * (1 + profitMargin / 100), roundingMultiple),
        category: 'Nuevo',
        imageUrls: [`https://placehold.co/400x400/7f8c8d/ffffff?text=${encodeURIComponent(item.name)}`, '', ''],
        expiryDate: item.expiryDate || null,
      };
      handleAddProduct(newProduct);
    });
    setReviewItems([]);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleSave = (updatedProduct) => {
    handleUpdateProduct(updatedProduct.id, updatedProduct);
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteRequest = (productId) => {
    setProductToDeleteId(productId);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = () => {
    if (productToDeleteId) {
      handleDeleteProduct(productToDeleteId);
    }
    setIsDeleteConfirmOpen(false);
    setProductToDeleteId(null);
  };

  const handleProductsFoundByVoice = (foundProducts) => {
    setReviewItems(prev => [...prev, ...foundProducts]);
    showNotification(`${foundProducts.length} productos añadidos a revisión.`);
  };

  const handleProductsFoundByImage = (foundProducts) => {
    const itemsToAdd = foundProducts.map(p => ({
      id: Date.now() + Math.random(),
      name: p.name,
      quantity: p.quantity,
      price: p.price,
      cost: Math.round(p.price / (1 + profitMargin / 100))
    }));
    setReviewItems(prev => [...prev, ...itemsToAdd]);
    showNotification(`${itemsToAdd.length} productos añadidos a revisión desde la imagen.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer."
      />
      
      <EditProductModal 
        product={editingProduct} 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleSave} 
      />
      
      <VoiceAIModal 
        isOpen={isVoiceModalOpen} 
        onClose={() => setIsVoiceModalOpen(false)} 
        onProductsFound={handleProductsFoundByVoice} 
        profitMargin={profitMargin} 
        roundingMultiple={roundingMultiple} 
      />
      
      <ImageAIModal 
        isOpen={isImageModalOpen} 
        onClose={() => setIsImageModalOpen(false)} 
        onProductsFound={handleProductsFoundByImage} 
        themeType={themeType} 
        profitMargin={profitMargin} 
        roundingMultiple={roundingMultiple} 
      />
      
      <AddProductModal 
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onAddToReview={handleAddToReview}
        profitMargin={profitMargin}
        roundingMultiple={roundingMultiple}
        allowDecimals={allowDecimals}
      />

      <header className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Gestión de Inventario</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Agrega, publica y administra tus productos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setIsVoiceModalOpen(true)} 
            className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
          >
            <Mic className="h-5 w-5"/>Voz
          </button>
          <button 
            onClick={() => setIsImageModalOpen(true)} 
            className="bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-purple-600 transition-colors"
          >
            <ImageIcon className="h-5 w-5"/>Foto
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className={`bg-[var(--color-bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--color-border)] ${isGlowActive2 ? 'dark-glow' : ''} ${themeType === 'light' ? 'light-shadow' : ''} flex flex-col`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Lista de Revisión</h2>
            {reviewItems.length > 0 && (
              <button 
                onClick={handleConfirm} 
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-green-600 transition-colors duration-200"
              >
                <CheckCircle className="h-5 w-5" />Publicar Todo
              </button>
            )}
          </div>
          
          <div className={`flex-grow overflow-y-auto flex flex-col ${reviewItems.length === 0 ? 'justify-center' : 'space-y-2'}`}>
            {reviewItems.length > 0 ? (
              reviewItems.map(item => (
                <EditableReviewItem 
                  key={item.id} 
                  item={item} 
                  onUpdate={handleReviewItemUpdate} 
                  onRemove={handleRemoveReviewItem}
                  allowDecimals={allowDecimals}
                />
              ))
            ) : (
              <div className="text-center text-[var(--color-text-secondary)] py-8">
                <p>No hay productos en revisión.</p>
              </div>
            )}
          </div>
        </div>

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
                  <option value="stock">Stock</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-secondary)] absolute top-1/2 right-1.5 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {filteredAndSortedInventory.map(product => {
              const itemStyle = getInventoryItemStyle(product);
              return (
                <div key={product.id} className={`bg-[var(--color-bg)] p-4 rounded-lg border transition-colors duration-300 ${itemStyle}`}>
                  <div className="flex items-start gap-4">
                    <img 
                      src={(product.imageUrls && product.imageUrls[0]) || 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image'} 
                      alt={product.name} 
                      className="w-16 h-16 rounded-md object-cover flex-shrink-0" 
                    />
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-lg text-[var(--color-text-primary)] truncate pr-2" title={product.name}>
                        {product.name}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)] truncate">
                        Categoría: <span className="font-semibold">{product.category}</span>
                      </p>
                      {product.expiryDate && (
                        <p className="text-sm text-yellow-600 font-semibold flex items-center gap-1">
                          <AlertTriangle size={14}/> Vence: {product.expiryDate}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button 
                        onClick={() => handleEdit(product)} 
                        className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                      >
                        <Edit className="h-4 w-4"/>
                      </button>
                      <button 
                        onClick={() => handleDeleteRequest(product.id)} 
                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-sm mt-4 pt-4 border-t border-[var(--color-border)]">
                    <div className="min-w-0">
                      <p className="font-bold text-base text-[var(--color-text-primary)] truncate">{product.stock}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Cantidad</p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base text-orange-500 truncate" title={`$${formatNumber(product.cost || 0, allowDecimals)}`}>
                        ${formatNumber(product.cost || 0, allowDecimals)}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Costo</p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base text-red-500 truncate" title={`$${formatNumber((product.cost || 0) * (product.stock || 0), allowDecimals)}`}>
                        ${formatNumber((product.cost || 0) * (product.stock || 0), allowDecimals)}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Costo Total</p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base text-green-600 truncate" title={`$${formatNumber(roundUpToMultiple(product.price || 0, roundingMultiple), allowDecimals)}`}>
                        ${formatNumber(roundUpToMultiple(product.price || 0, roundingMultiple), allowDecimals)}
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

      <FloatingActionButton onClick={() => setIsAddProductModalOpen(true)} />
    </div>
  );
};

export default IAPage;