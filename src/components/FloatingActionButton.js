import React from 'react';
import { Plus } from 'lucide-react';

const FloatingActionButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-6 right-6 bg-[var(--color-primary)] text-[var(--color-primary-text)] w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-200 z-40"
  >
    <Plus className="h-8 w-8" />
  </button>
);

export default FloatingActionButton;