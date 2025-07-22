import { useState, useEffect } from 'react';

export const useInventoryAnalysis = (products) => {
  const [analysis, setAnalysis] = useState({
    lowStockProducts: [],
    expiringProducts: [],
    lowStockCount: 0,
    expiringCount: 0
  });

  useEffect(() => {
    if (!products || products.length === 0) {
      setAnalysis({
        lowStockProducts: [],
        expiringProducts: [],
        lowStockCount: 0,
        expiringCount: 0
      });
      return;
    }

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const lowStockProducts = products.filter(product => {
      const minStock = product.minStock || 5; // Stock mínimo por defecto
      return product.quantity <= minStock;
    });

    const expiringProducts = products.filter(product => {
      if (!product.expirationDate) return false;
      
      const expirationDate = new Date(product.expirationDate);
      return expirationDate <= sevenDaysFromNow && expirationDate >= now;
    });

    setAnalysis({
      lowStockProducts,
      expiringProducts,
      lowStockCount: lowStockProducts.length,
      expiringCount: expiringProducts.length
    });
  }, [products]);

  return analysis;
};