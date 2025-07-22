import React from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex justify-center items-center p-4">
      <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-sm border border-[var(--color-border)]">
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{title}</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">{message}</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={onClose} 
              className="px-6 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-semibold hover:bg-[var(--color-border)]"
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm} 
              className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;