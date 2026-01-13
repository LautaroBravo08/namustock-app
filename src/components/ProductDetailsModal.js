import React, { useState, useEffect, useRef } from 'react';
import { X, Edit, Check, Upload, Trash2, Image as ImageIcon, ArrowLeft, ArrowRight, ShoppingCart, CreditCard } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import EditableField from './EditableField';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { saveProductImage, deleteProductImage } from '../firebase/firestore';

const ProductDetailsModal = ({ isOpen, onClose, product, onUpdate, productImages, isReadOnly = false, categories = [], onDelete }) => {
  useBodyScrollLock(isOpen);
  const [user] = useAuthState(auth);

  const [imageData, setImageData] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showManualCamera, setShowManualCamera] = useState(false);
  const [manualCameraError, setManualCameraError] = useState('');
  const [manualCameraStatus, setManualCameraStatus] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const manualCameraVideoRef = useRef(null);
  const manualCameraStreamRef = useRef(null);

  useEffect(() => {
    if (product && productImages && productImages[product.id]) {
      setImageData(productImages[product.id].map((url, index) => ({
        id: product.imageIds[index],
        data: url
      })));
    } else {
      setImageData([]);
    }
    setCurrentImageIndex(0);
  }, [product, productImages]);

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageData.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      (prevIndex - 1 + imageData.length) % imageData.length
    );
  };

  if (!isOpen || !product) return null;

  const handleSave = (field) => (value) => {
    onUpdate(product.id, { [field]: value });
  };

  const processImage = async (file) => {
    try {
      const { compressImageWithFallback, validateImageFile } = await import('../utils/imageUtils');
      validateImageFile(file);
      return await compressImageWithFallback(file, 700);
    } catch (error) {
      throw new Error(`${error.message}`);
    }
  };

  const handleImageUpload = async (file) => {
    if (!user || imageData.length >= 3) return;
    setIsProcessingImage(true);
    try {
      const processedDataUrl = await processImage(file);
      const { imageId, error } = await saveProductImage(user.uid, processedDataUrl);
      if (error) throw new Error(error);
      const newImageIds = [...(product.imageIds || []), imageId];
      onUpdate(product.id, { imageIds: newImageIds });
      setImageData([...imageData, { id: imageId, data: processedDataUrl }]);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const removeImage = async (index) => {
    if (!user) return;
    const imageToRemove = imageData[index];
    try {
      await deleteProductImage(user.uid, imageToRemove.id);
      const newImageIds = product.imageIds.filter(id => id !== imageToRemove.id);
      onUpdate(product.id, { imageIds: newImageIds });
      setImageData(imageData.filter((_, i) => i !== index));
    } catch (error) {
      alert('Error al eliminar la imagen');
    }
  };

  const initializeManualCamera = async () => {
    try {
      setManualCameraError('');
      setManualCameraStatus('Iniciando cámara...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      manualCameraStreamRef.current = stream;
      if (manualCameraVideoRef.current) {
        manualCameraVideoRef.current.srcObject = stream;
      }
      setManualCameraStatus('Cámara lista');
    } catch (error) {
      setManualCameraError('Error al acceder a la cámara. Asegúrate de dar permisos.');
    }
  };

  const takeManualPicture = async () => {
    if (!manualCameraVideoRef.current) return;
    setIsProcessingImage(true);
    const canvas = document.createElement('canvas');
    const video = manualCameraVideoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      await handleImageUpload(file);
      cancelManualCamera();
    }, 'image/jpeg', 0.8);
  };

  const cancelManualCamera = () => {
    if (manualCameraStreamRef.current) {
      manualCameraStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setShowManualCamera(false);
    setManualCameraError('');
    setManualCameraStatus('');
  };

  const handleDeleteProduct = () => {
    if (onDelete) {
      onDelete(product.id);
      onClose(); // Cerrar el modal después de eliminar
    }
  };

  const confirmDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const priceHistoryData = (product.priceHistory || []).map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    precio: item.newPrice,
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">Detalles del Producto</h2>
          <div className="flex gap-2 items-center">
            {!isReadOnly && onDelete && (
              <button 
                onClick={confirmDelete}
                className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-red-500/20 transition-colors"
                title="Eliminar producto"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="relative group/image w-full h-64 md:h-96 bg-gray-800 rounded-lg overflow-hidden">
              {imageData.length > 0 ? (
                <>
                  <img 
                    src={imageData[currentImageIndex]?.data} 
                    alt={`Producto ${currentImageIndex + 1}`} 
                    className="w-full h-full object-contain"
                  />
                  {imageData.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage} 
                        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-opacity"
                      >
                        <ArrowLeft size={24}/>
                      </button>
                      <button 
                        onClick={nextImage} 
                        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-opacity"
                      >
                        <ArrowRight size={24}/>
                      </button>
                    </>
                  )}
                  <button 
                    type="button" 
                    onClick={() => removeImage(currentImageIndex)} 
                    className={`absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full transition-opacity ${isReadOnly ? 'opacity-0' : 'opacity-0 group-hover/image:opacity-100'}`} 
                    title="Eliminar imagen"
                    disabled={isReadOnly}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <ImageIcon size={64} />
                </div>
              )}
            </div>

            {!isReadOnly && (
              <div className="space-y-2">
                <div className="flex gap-2 mb-3">
                  <input type="file" ref={React.createRef()} onChange={(e) => handleImageUpload(e.target.files[0])} className="hidden" accept="image/*" id="file-input-details" />
                  <button type="button" onClick={() => document.getElementById('file-input-details').click()} disabled={imageData.length >= 3 || isProcessingImage} className="flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 bg-blue-600 text-white disabled:bg-gray-500">
                    <Upload className="h-4 w-4" />
                    <span>{`Subir (${imageData.length}/3)`}</span>
                  </button>
                  <button type="button" onClick={() => {setShowManualCamera(true); initializeManualCamera();}} disabled={imageData.length >= 3 || isProcessingImage} className="flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 bg-green-600 text-white disabled:bg-gray-500">
                    <ImageIcon className="h-4 w-4" />
                    <span>Tomar Foto</span>
                  </button>
                </div>
                {showManualCamera && (
                  <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <video ref={manualCameraVideoRef} autoPlay playsInline className="w-full h-auto max-h-48 rounded-md bg-black mb-3"></video>
                    <div className="flex gap-2">
                      <button type="button" onClick={takeManualPicture} className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg">Capturar</button>
                      <button type="button" onClick={cancelManualCamera} className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg">Cancelar</button>
                    </div>
                    {manualCameraError && <p className="text-red-500 text-xs mt-2">{manualCameraError}</p>}
                    {manualCameraStatus && <p className="text-blue-400 text-xs mt-2">{manualCameraStatus}</p>}
                  </div>
                )}
              </div>
            )}
            
            {isReadOnly ? (
              <>
                <h2 className="text-3xl font-bold text-white text-center my-4">{product.name}</h2>
                {product.category && (
                  <p className="text-center text-gray-400 -mt-2 mb-4 text-lg">{product.category}</p>
                )}
              </>
            ) : (
              <EditableField label="Nombre" value={product.name} onSave={handleSave('name')} readOnly={isReadOnly} />
            )}
            
            <EditableField label="Descripción" value={product.description || ''} onSave={handleSave('description')} readOnly={isReadOnly}><textarea rows="3" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" /></EditableField>
            
            {!isReadOnly && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <EditableField label="Stock" value={product.stock} onSave={handleSave('stock')} inputType="number" />
                <EditableField label="Precio de Venta" value={product.price} onSave={handleSave('price')} inputType="number" />
                <EditableField label="Costo Unitario" value={product.cost} onSave={handleSave('cost')} inputType="number" />
                <EditableField label="Categoría" value={product.category || ''} onSave={handleSave('category')} suggestions={categories} />
                <EditableField label="Fecha de Vencimiento" value={product.expiryDate || ''} onSave={handleSave('expiryDate')} inputType="date" />
              </div>
            )}

            {isReadOnly && (
              <div className="text-center py-4">
                <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 animate-gradient-x">
                  ${product.price}
                </p>
              </div>
            )}

            {isReadOnly && (
              <div className="flex justify-center gap-2 mt-4">
                <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-base bg-blue-600 text-white hover:bg-blue-700">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Carrito</span>
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-base bg-green-600 text-white hover:bg-green-700">
                  <CreditCard className="h-5 w-5" />
                  <span>Comprar</span>
                </button>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Historial de Precios</h3>
              {priceHistoryData.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={priceHistoryData}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis dataKey="date" stroke="#A0AEC0" /><YAxis stroke="#A0AEC0" /><Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} /><Legend /><Line type="monotone" dataKey="precio" stroke="#48BB78" activeDot={{ r: 8 }} /></LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg max-h-40 overflow-y-auto">
                    <ul className="space-y-2">
                      {product.priceHistory.slice().reverse().map((item, index) => (
                        <li key={index} className="text-sm text-gray-300 flex justify-between"><span>{new Date(item.date).toLocaleString()}</span><span>${item.oldPrice} → ${item.newPrice}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 p-4 rounded-lg h-48 flex items-center justify-center"><p className="text-gray-500">No hay historial de precios.</p></div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[80] flex justify-center items-center p-4">
          <div className="bg-gray-900 rounded-xl shadow-2xl border border-red-500 p-6 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                ¿Eliminar producto?
              </h3>
              <p className="text-gray-300 mb-6">
                Esta acción no se puede deshacer. El producto "{product?.name}" se eliminará permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteProduct}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailsModal;