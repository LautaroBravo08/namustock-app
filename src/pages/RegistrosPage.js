import React, { useMemo, useState } from 'react';
import { BookText, Calendar, Trash2, AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useRandomGlow } from '../hooks/useRandomGlow';
import { formatNumber } from '../utils/helpers';

const RegistrosPage = ({ sales, themeType, allowDecimals, onDeleteSales }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(''); // 'day' or 'month'


  // Datos agrupados por fecha
  const salesByDate = useMemo(() => {
    if (!sales) return {};
    
    return sales.reduce((acc, sale) => {
      const saleDate = new Date(sale.date);
      if (isNaN(saleDate.getTime())) return acc;
      
      const dateKey = saleDate.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(sale);
      return acc;
    }, {});
  }, [sales]);

  // Ventas del día seleccionado
  const selectedDateSales = useMemo(() => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    return salesByDate[dateKey] || [];
  }, [salesByDate, selectedDate]);

  // Datos mensuales
  const monthlyData = useMemo(() => {
    if (!sales || !Array.isArray(sales)) return {};
    
    return sales.reduce((acc, sale) => {
      // Verificar que la venta tenga los campos necesarios
      if (!sale || !sale.date || typeof sale.totalSalePrice !== 'number' || typeof sale.totalSaleCost !== 'number') {
        console.warn('Venta con datos incompletos:', sale);
        return acc;
      }
      
      const saleDate = new Date(sale.date);
      if (isNaN(saleDate.getTime())) {
        console.warn('Fecha inválida en venta:', sale.date);
        return acc;
      }
      
      const monthKey = `${saleDate.getFullYear()}-${saleDate.getMonth()}`;
      const monthName = saleDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { 
          name: monthName,
          earnings: 0, 
          costs: 0, 
          count: 0,
          year: saleDate.getFullYear(),
          month: saleDate.getMonth()
        };
      }
      
      acc[monthKey].earnings += sale.totalSalePrice || 0;
      acc[monthKey].costs += sale.totalSaleCost || 0;
      acc[monthKey].count += 1;
      
      return acc;
    }, {});
  }, [sales]);

  // Datos del mes actual seleccionado en el calendario
  const currentMonthData = useMemo(() => {
    const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
    return monthlyData[monthKey] || {
      name: currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
      earnings: 0,
      costs: 0,
      count: 0,
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth()
    };
  }, [monthlyData, currentMonth]);

  const totalEarnings = sales ? sales.reduce((sum, sale) => sum + sale.totalSalePrice, 0) : 0;
  const totalCosts = sales ? sales.reduce((sum, sale) => sum + sale.totalSaleCost, 0) : 0;
  const totalProfit = totalEarnings - totalCosts;

  const { isGlowActive: isGlowActive1 } = useRandomGlow(themeType === 'dark');
  const { isGlowActive: isGlowActive2 } = useRandomGlow(themeType === 'dark');

  // Funciones del calendario
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Lunes = 0
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const selectDate = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
  };

  const hasSalesOnDate = (day) => {
    const dateKey = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString().split('T')[0];
    return salesByDate[dateKey] && salesByDate[dateKey].length > 0;
  };

  const getSalesCountOnDate = (day) => {
    const dateKey = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString().split('T')[0];
    return salesByDate[dateKey] ? salesByDate[dateKey].length : 0;
  };

  // Funciones de limpieza
  const handleDeleteDay = () => {
    setDeleteType('day');
    setShowDeleteModal(true);
  };

  const handleDeleteMonth = () => {
    setDeleteType('month');
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteType === 'day') {
      const dateKey = selectedDate.toISOString().split('T')[0];
      const salesToDelete = salesByDate[dateKey] || [];
      onDeleteSales(salesToDelete.map(sale => sale.id));
    } else if (deleteType === 'month') {
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const salesToDelete = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= monthStart && saleDate <= monthEnd;
      });
      
      onDeleteSales(salesToDelete.map(sale => sale.id));
    }
    
    setShowDeleteModal(false);
    setDeleteType('');
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    // Días de la semana
    dayNames.forEach(day => {
      days.push(
        <div key={day} className="text-center text-xs font-semibold text-[var(--color-text-secondary)] p-2">
          {day}
        </div>
      );
    });

    // Espacios vacíos para el primer día del mes
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate.getDate() === day && 
                        selectedDate.getMonth() === currentMonth.getMonth() && 
                        selectedDate.getFullYear() === currentMonth.getFullYear();
      const hasSales = hasSalesOnDate(day);
      const salesCount = getSalesCountOnDate(day);
      const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

      days.push(
        <div
          key={day}
          onClick={() => selectDate(day)}
          className={`
            relative p-2 text-center cursor-pointer rounded-lg transition-all duration-200 min-h-[2.5rem] flex flex-col justify-center
            ${isSelected 
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] font-bold' 
              : hasSales 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'hover:bg-[var(--color-bg-secondary)]'
            }
            ${isToday && !isSelected ? 'ring-2 ring-[var(--color-primary)] ring-opacity-50' : ''}
          `}
        >
          <span className="text-sm font-medium">{day}</span>
          {hasSales && (
            <span className={`text-xs ${isSelected ? 'text-[var(--color-primary-text)]' : 'text-green-600'}`}>
              {salesCount} venta{salesCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    );
  };

  const selectedDateSalesTotal = selectedDateSales.reduce((sum, sale) => sum + sale.totalSalePrice, 0);
  const selectedDateCostsTotal = selectedDateSales.reduce((sum, sale) => sum + sale.totalSaleCost, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Registros y Ganancias</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Historial de ventas y resumen financiero.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendario */}
        <div className={`lg:col-span-2 bg-[var(--color-bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--color-border)] ${isGlowActive1 ? 'dark-glow' : ''} ${themeType === 'light' ? 'light-shadow' : ''}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              {currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteMonth}
                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center gap-1"
                disabled={!Object.keys(monthlyData).some(key => {
                  const data = monthlyData[key];
                  return data.year === currentMonth.getFullYear() && data.month === currentMonth.getMonth();
                })}
              >
                <Trash2 className="h-3 w-3" />
                Limpiar Mes
              </button>
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-[var(--color-bg)] rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-[var(--color-bg)] rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
          </div>
          
          {renderCalendar()}
        </div>

        {/* Detalles del día seleccionado */}
        <div className={`lg:col-span-1 bg-[var(--color-bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--color-border)] ${isGlowActive2 ? 'dark-glow' : ''} ${themeType === 'light' ? 'light-shadow' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              {selectedDate.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </h2>
            {selectedDateSales.length > 0 && (
              <button
                onClick={handleDeleteDay}
                className="px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Limpiar
              </button>
            )}
          </div>
          
          {selectedDateSales.length > 0 ? (
            <div className="space-y-4">
              {/* Resumen del día */}
              <div className="bg-[var(--color-bg)] p-4 rounded-lg border border-[var(--color-border)]">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[var(--color-text-secondary)]">Ventas</p>
                    <p className="font-bold text-[var(--color-text-primary)]">{selectedDateSales.length}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-secondary)]">Total</p>
                    <p className="font-bold text-green-600">${formatNumber(selectedDateSalesTotal, allowDecimals)}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-secondary)]">Costos</p>
                    <p className="font-bold text-red-600">${formatNumber(selectedDateCostsTotal, allowDecimals)}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-secondary)]">Ganancia</p>
                    <p className="font-bold text-[var(--color-primary)]">${formatNumber(selectedDateSalesTotal - selectedDateCostsTotal, allowDecimals)}</p>
                  </div>
                </div>
              </div>

              {/* Lista de ventas del día */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {selectedDateSales.map(sale => (
                  <div key={sale.id} className="bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {new Date(sale.date).toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span className="font-bold text-[var(--color-primary)]">
                        ${formatNumber(sale.totalSalePrice, allowDecimals)}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      {sale.items.map(item => (
                        <div key={`${sale.id}-${item.id}`} className="flex justify-between items-center text-xs">
                          <span className="text-[var(--color-text-primary)]">
                            {item.name} <span className="text-[var(--color-text-secondary)]">x{item.quantity}</span>
                          </span>
                          <span className="text-[var(--color-text-secondary)]">
                            ${formatNumber(item.price * item.quantity, allowDecimals)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-[var(--color-text-secondary)] py-8">
              <Calendar className="mx-auto h-12 w-12 mb-4" />
              <p className="font-medium">No hay ventas este día</p>
              <p className="text-sm">Selecciona otro día en el calendario</p>
            </div>
          )}
        </div>
      </div>

      {/* Resumen Mensual */}
      <div className="mt-8">
        <div className={`bg-[var(--color-bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--color-border)] ${isGlowActive1 ? 'dark-glow' : ''} ${themeType === 'light' ? 'light-shadow' : ''}`}>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 text-center">
              Resumen Mensual - {currentMonthData.name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Costos */}
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Costos Totales</h3>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-500">
                    ${formatNumber(currentMonthData.costs, allowDecimals)}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    Inversión del mes
                  </p>
                </div>
              </div>

              {/* Ingresos */}
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">Ingresos Totales</h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-500">
                    ${formatNumber(currentMonthData.earnings, allowDecimals)}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    {currentMonthData.count} venta{currentMonthData.count !== 1 ? 's' : ''} realizadas
                  </p>
                </div>
              </div>

              {/* Ganancia */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-2">Ganancia Neta</h3>
                  <p className="text-3xl font-bold text-[var(--color-primary)]">
                    ${formatNumber(currentMonthData.earnings - currentMonthData.costs, allowDecimals)}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                    {currentMonthData.earnings > 0 
                      ? `${(((currentMonthData.earnings - currentMonthData.costs) / currentMonthData.earnings) * 100).toFixed(1)}% margen`
                      : 'Sin ventas'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Estadísticas adicionales */}
            {currentMonthData.count > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[var(--color-bg)] p-4 rounded-lg border border-[var(--color-border)]">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Venta promedio:</span>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      ${formatNumber(currentMonthData.earnings / currentMonthData.count, allowDecimals)}
                    </span>
                  </div>
                </div>
                <div className="bg-[var(--color-bg)] p-4 rounded-lg border border-[var(--color-border)]">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Ganancia por venta:</span>
                    <span className="font-bold text-[var(--color-primary)]">
                      ${formatNumber((currentMonthData.earnings - currentMonthData.costs) / currentMonthData.count, allowDecimals)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex justify-center items-center p-4">
          <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-md border border-[var(--color-border)]">
            <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Confirmar Eliminación
              </h2>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-[var(--color-text-primary)] mb-4">
                {deleteType === 'day' 
                  ? `¿Estás seguro de que quieres eliminar todas las ventas del ${selectedDate.toLocaleDateString('es-ES')}?`
                  : `¿Estás seguro de que quieres eliminar todas las ventas de ${currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}?`
                }
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm font-medium">
                  ⚠️ Esta acción no se puede deshacer
                </p>
                <p className="text-red-600 text-sm">
                  {deleteType === 'day' 
                    ? `Se eliminarán ${selectedDateSales.length} venta${selectedDateSales.length !== 1 ? 's' : ''}`
                    : `Se eliminarán todas las ventas del mes seleccionado`
                  }
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-[var(--color-bg)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-border)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
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

export default React.memo(RegistrosPage);