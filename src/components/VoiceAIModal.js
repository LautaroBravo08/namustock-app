import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Bot } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { roundUpToMultiple } from '../utils/helpers';

const VoiceAIModal = ({ isOpen, onClose, onProductsFound, profitMargin, roundingMultiple }) => {
  const [isListening, setIsListening] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [status, setStatus] = useState('Inactivo');
  const [isApiSupported, setIsApiSupported] = useState(true);
  const [reviewItems, setReviewItems] = useState([]);
  const recognitionRef = useRef(null);

  useBodyScrollLock(isOpen);

  // Funciones para manejar la lista de revisión
  const handleAddToReview = (items) => {
    setReviewItems(prev => [...prev, ...items]);
  };

  const handleReviewItemUpdate = (id, field, value) => {
    setReviewItems(currentItems =>
      currentItems.map(item => {
        if (item.id !== id) return item;
        
        const updatedItem = { ...item, [field]: value };
        
        // Recalcular precio si cambia quantity o cost
        if (field === 'quantity' || field === 'cost') {
          const quantity = parseFloat(field === 'quantity' ? value : updatedItem.quantity);
          const cost = parseFloat(field === 'cost' ? value : updatedItem.cost);
          if (!isNaN(quantity) && !isNaN(cost) && quantity > 0 && cost > 0) {
            updatedItem.price = roundUpToMultiple(cost * (1 + profitMargin / 100), roundingMultiple);
          }
        }
        
        return updatedItem;
      })
    );
  };

  const handleRemoveReviewItem = (id) => {
    setReviewItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const handleConfirmReview = () => {
    if (reviewItems.length > 0) {
      onProductsFound(reviewItems);
      setReviewItems([]);
      setEditableTranscript('');
      onClose();
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsApiSupported(false);
      setStatus('API de voz no soportada en este navegador.');
      return;
    }

    setIsApiSupported(true);

    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'es-ES';
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('Escuchando...');
    };

    recognition.onend = () => {
      if (recognitionRef.current) {
        setIsListening(false);
        setStatus('Inactivo');
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage;
      if (event.error === 'network') {
        errorMessage = 'Error de red. Por favor, comprueba tu conexión a internet.';
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMessage = 'Permiso denegado. Por favor, permite el acceso al micrófono.';
      } else if (event.error === 'no-speech') {
        errorMessage = 'No se detectó voz. Inténtalo de nuevo.';
      } else {
        errorMessage = `Error: ${event.error}`;
      }
      setStatus(errorMessage);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const newTranscript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setEditableTranscript(newTranscript);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [isOpen]);

  const toggleListening = () => {
    if (!isApiSupported) return;

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
      } catch (error) {
        console.error("Error starting recognition:", error);
        setStatus("No se pudo iniciar el reconocimiento.");
      }
    }
  };

  const handleCommand = () => {
    const transcript = editableTranscript.trim();
    const parts = transcript.split(/\s+/).filter(p => p);
    const foundProducts = [];
    let i = 0;

    while (i < parts.length) {
      const quantity = parseFloat(parts[i]);
      if (isNaN(quantity) || i + 1 >= parts.length) {
        break;
      }
      i++;

      const nameParts = [];
      while (i < parts.length && isNaN(parseFloat(parts[i]))) {
        nameParts.push(parts[i]);
        i++;
      }

      if (nameParts.length === 0 || i >= parts.length) {
        break;
      }

      const cost = parseFloat(parts[i]);
      if (isNaN(cost)) {
        break;
      }
      i++;

      foundProducts.push({
        id: Date.now() + Math.random(),
        name: nameParts.join(' '),
        quantity: quantity,
        cost: cost,
        price: roundUpToMultiple(cost * (1 + profitMargin / 100), roundingMultiple),
      });
    }

    if (foundProducts.length > 0) {
      handleAddToReview(foundProducts);
      setEditableTranscript('');
      setStatus(`${foundProducts.length} productos agregados a revisión`);
      setTimeout(() => setStatus('Inactivo'), 2000);
    } else {
      setStatus("Formato no reconocido. Use: CANTIDAD NOMBRE COSTO.");
      setTimeout(() => setStatus('Inactivo'), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4">
      <div className={`bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-lg border border-[var(--color-border)]`}>
        <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Bot /> Asistente de Voz
          </h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-[var(--color-text-secondary)] mb-2">
            Presiona el micrófono y di algo como: <br/> 
            <strong className="text-[var(--color-text-primary)]">"3 hamburguesas 3000 6 milanesas 1500"</strong>
          </p>
          
          <div className="h-6 mb-2 text-sm font-semibold text-red-500">
            {!isApiSupported && 'API de voz no soportada en este navegador.'}
            {isApiSupported && status !== 'Inactivo' && status !== 'Escuchando...' && status}
          </div>
          
          <button 
            onClick={toggleListening} 
            disabled={!isApiSupported} 
            className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
              isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            <Mic className="h-12 w-12 text-white" />
          </button>
          
          <div className="mt-2 h-6 text-sm font-semibold text-[var(--color-text-primary)]">
            {isListening && status}
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-left text-[var(--color-text-secondary)] mb-1">
              Texto reconocido (editable)
            </label>
            <textarea 
              value={editableTranscript}
              onChange={(e) => setEditableTranscript(e.target.value)}
              className="w-full p-2 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] min-h-[80px] font-mono text-lg text-[var(--color-text-primary)]"
              placeholder='El texto reconocido aparecerá aquí...'
            />
          </div>
          
          <button 
            onClick={handleCommand} 
            disabled={!editableTranscript}
            className="mt-4 w-full bg-blue-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Bot className="h-5 w-5"/>Analizar y Agregar
          </button>

          {/* Lista de Revisión */}
          {reviewItems.length > 0 && (
            <div className="mt-6 border-t border-[var(--color-border)] pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Lista de Revisión ({reviewItems.length})
                </h3>
                <button 
                  onClick={handleConfirmReview}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Confirmar Todo
                </button>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {reviewItems.map(item => (
                  <div key={item.id} className="bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
                    <div className="flex justify-between items-start mb-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleReviewItemUpdate(item.id, 'name', e.target.value)}
                        className="font-semibold bg-transparent border-none text-[var(--color-text-primary)] flex-grow mr-2"
                      />
                      <button
                        onClick={() => handleRemoveReviewItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <label className="text-xs text-[var(--color-text-secondary)]">Cantidad</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleReviewItemUpdate(item.id, 'quantity', e.target.value)}
                          className="w-full bg-transparent border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--color-text-secondary)]">Costo</label>
                        <input
                          type="number"
                          value={item.cost}
                          onChange={(e) => handleReviewItemUpdate(item.id, 'cost', e.target.value)}
                          className="w-full bg-transparent border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--color-text-secondary)]">Precio</label>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-green-600 font-semibold">
                          ${item.price?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceAIModal;