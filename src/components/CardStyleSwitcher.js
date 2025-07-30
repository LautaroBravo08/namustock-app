import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cardStyles } from '../data/themes';

const CardStyleSwitcher = ({ cardStyle, setCardStyle }) => {
  const styleKeys = Object.keys(cardStyles);
  const currentStyleName = cardStyles[cardStyle].name;

  const handleStyleChange = (direction) => {
    const currentStyleIndex = styleKeys.indexOf(cardStyle);
    let nextStyleIndex;
    
    if (direction === 'next') {
      nextStyleIndex = (currentStyleIndex + 1) % styleKeys.length;
    } else {
      nextStyleIndex = (currentStyleIndex - 1 + styleKeys.length) % styleKeys.length;
    }
    
    setCardStyle(styleKeys[nextStyleIndex]);
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => handleStyleChange('prev')} 
        className="p-2 rounded-md bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
      >
        <ArrowLeft className="h-5 w-5"/>
      </button>
      <span className="text-center font-semibold w-40">{currentStyleName}</span>
      <button 
        onClick={() => handleStyleChange('next')} 
        className="p-2 rounded-md bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
      >
        <ArrowRight className="h-5 w-5"/>
      </button>
    </div>
  );
};

export default CardStyleSwitcher;