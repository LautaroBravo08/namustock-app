import { useState } from 'react';

export const useFormValidation = (initialValues = {}) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
      case 'category':
        if (value.length > 40) {
          error = 'Máximo 40 caracteres permitidos';
        }
        break;
      
      case 'stock':
      case 'price':
      case 'cost':
      case 'quantity':
      case 'totalCost':
        // Solo permitir números, puntos decimales y signos negativos
        const numericRegex = /^-?\d*\.?\d*$/;
        if (!numericRegex.test(value) && value !== '') {
          error = 'Solo se permiten números';
        } else {
          // Limitar a máximo 8 dígitos en la parte entera
          const cleanValue = value.replace(/[^0-9.]/g, '');
          const parts = cleanValue.split('.');
          if (parts[0] && parts[0].length > 8) {
            error = 'Máximo 8 dígitos en la parte entera';
          }
          
          // Limitar decimales a máximo 2
          if (value.includes('.')) {
            const parts = value.split('.');
            if (parts[1] && parts[1].length > 2) {
              error = 'Máximo 2 decimales permitidos';
            }
          }
        }
        break;
      
      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    const error = validateField(name, value);
    
    // Solo actualizar si no hay error de validación
    if (!error) {
      setFormData(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: '' }));
    } else {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const updateField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = (newValues = {}) => {
    setFormData(newValues);
    setErrors({});
  };

  const isValid = () => {
    return Object.keys(errors).every(key => !errors[key]);
  };

  return {
    formData,
    errors,
    handleChange,
    updateField,
    resetForm,
    isValid,
    setFormData
  };
};