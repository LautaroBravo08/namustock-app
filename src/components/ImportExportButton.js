import React from 'react';
import { Download, Upload } from 'lucide-react';

const ImportExportButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-6 right-24 bg-blue-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-200 z-40 group"
    title="Import/Export"
  >
    <div className="relative">
      <Upload className="h-6 w-6 absolute -top-1 -left-1 opacity-70" />
      <Download className="h-6 w-6 absolute top-1 left-1 opacity-70" />
    </div>
    
    {/* Tooltip */}
    <div className="absolute right-full mr-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
      Import/Export
    </div>
  </button>
);

export default ImportExportButton;