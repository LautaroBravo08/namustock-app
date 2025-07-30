import React, { useMemo, useState } from 'react';
import { BookText, Calendar, Trash2, AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useRandomGlow } from '../hooks/useRandomGlow';
import { formatNumber } from '../utils/helpers';

const RegistrosPage = ({ sales, themeType, allowDecimals, onDeleteSales }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(''); // 'day' or 'month'
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'all'

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
    if (!sales) return {};
    
    return sales.reduce((acc, sale) => {
      const saleDate = new Date(sale.date);
      if (isNaN(saleDate.getTime())) return acc;
      
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
      acc[monthKey].earnings += sale.totalSalePrice;
      acc[monthKey].costs += sale.totalSaleCost;
      acc[monthKey].count += 1;
      return acc;
    }, {});
  }, [sales]);

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
      <header className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Registros y Ganancias</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Historial de ventas y resumen financiero.</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'all' : 'calendar')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'calendar' 
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]' 
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            {viewMode === 'calendar' ? 'Ver Todo' : 'Calendario'}
          </button>
        </div>
      </header>

      {viewMode === 'calendar' ? (
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
      ) : (
        // Vista de todos los registros
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`lg:col-span-2 bg-[var(--color-bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--color-border)] ${isGlowActive1 ? 'dark-glow' : ''} ${themeType === 'light' ? 'light-shadow' : ''}`}>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Historial Completo de Ventas</h2>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {sales && sales.length > 0 ? (
                sales.sort((a,b) => new Date(b.date) - new Date(a.date)).map(sale => (
                  <div key={sale.id} className="bg-[var(--color-bg)] p-4 rounded-lg border border-[var(--color-border)]">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-[var(--color-border)]">
                      <span className="font-semibold text-sm text-[var(--color-text-secondary)]">
                        {new Date(sale.date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
                      </span>
                      <span className="font-bold text-lg text-[var(--color-primary)]">
                        Total: ${formatNumber(sale.totalSalePrice, allowDecimals)}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      {sale.items.map(item => (
                        <div key={`${sale.id}-${item.id}`} className="flex justify-between items-center text-sm">
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
                ))
              ) : (
                <div className="text-center text-[var(--color-text-secondary)] py-16">
                  <BookText className="mx-auto h-12 w-12" />
                  <p className="mt-4 font-semibold">No hay ventas registradas todavía.</p>
                  <p className="text-sm">Realiza una venta o carga un archivo de ventas para ver los registros aquí.</p>
                </div>
              )}
            </div>
          </div>

          <div className={`lg:col-span-1 bg-[var(--color-bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--color-border)] ${isGlowActive2 ? 'dark-glow' : ''} ${themeType === 'light' ? 'light-shadow' : ''}`}>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Resumen Financiero</h2>
            
            <div className="space-y-4">
              <div className="bg-[var(--color-primary)]/10 p-4 rounded-lg">
                <p className="text-sm font-medium text-[var(--color-primary)]">Ganancia Neta Total</p>
                <p className="text-3xl font-bold text-[var(--color-primary)]">
                  ${formatNumber(totalProfit, allowDecimals)}
                </p>
              </div>
              
              {Object.keys(monthlyData).length > 0 ? (
                Object.entries(monthlyData).map(([monthKey, data]) => (
                  <div key={monthKey} className="bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
                    <p className="font-semibold text-[var(--color-text-primary)] capitalize">{data.name}</p>
                    <div className="text-sm mt-1 text-[var(--color-text-secondary)]">
                      <p className="flex justify-between">
                        <span>Ventas:</span> 
                        <span className="font-medium text-[var(--color-text-primary)]">{data.count}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Ingresos:</span> 
                        <span className="font-medium text-green-600">
                          ${formatNumber(data.earnings, allowDecimals)}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>Costos:</span> 
                        <span className="font-medium text-red-600">
                          ${formatNumber(data.costs, allowDecimals)}
                        </span>
                      </p>
                      <p className="flex justify-between font-bold text-[var(--color-text-primary)]">
                        <span>Ganancia:</span> 
                        <span>${formatNumber(data.earnings - data.costs, allowDecimals)}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-[var(--color-text-secondary)] py-8">
                  <p>No hay datos mensuales para mostrar.</p>
                </div>
              )}
            </div>
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

export default RegistrosPage;