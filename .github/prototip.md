```typescript
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Archive, Plus, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp, Scan, Calendar, Edit2, ShoppingBag, ListChecks, Clock } from 'lucide-react';

// --- DEFINICIONES DE TIPOS (Type Definitions) ---

interface Variant {
    id: string; // EAN/Barcode: Unique ID for the variant
    name: string; // Variant name (e.g., "Sin Lactosa")
    unit: string; // Size/unit (e.g., "1400g")
    expirationDate: string | null; // Date (YYYY-MM-DD)
}

interface ProductBase {
    baseId: string; // Base identifier (e.g., Brand + Generic Name)
    baseName: string; // Base name (e.g., "Leche Milex Original")
    variants: Variant[];
}

// Nuevo estado 'INVENTORY' para productos añadidos solo para seguimiento de vencimiento.
type ItemStatus = 'PENDING' | 'RESTOCKED' | 'OUT_OF_STOCK' | 'INVENTORY';
type ActiveView = 'RESTOCK' | 'EXPIRY';

interface RestockItem {
    id: string; // Unique ID for this list entry (timestamp)
    baseName: string;
    variantId: string; // EAN/Barcode of the specific product
    variantName: string; // Full variant name for display
    unit: string;
    expirationDate: string | null;
    quantity: number; // Quantity to restock or track
    addedAt: number; // Timestamp for ordering
    status: ItemStatus;
    isExpanded: boolean;
}

// --- MOCK DATA (Simulación de API OFF y Datos Locales) ---

const MOCK_PRODUCTS: ProductBase[] = [
    {
        baseId: 'milex-leche',
        baseName: 'Leche Milex Original',
        variants: [
            { id: '123456001', name: 'Original', unit: '1000g', expirationDate: '2025-11-20' }, // Vencimiento pronto
            { id: '123456002', name: 'Sin Lactosa', unit: '1400g', expirationDate: '2026-03-31' },
            { id: '123456003', name: 'Kinder', unit: '2000g', expirationDate: null },
        ],
    },
    {
        baseId: 'colgate-pasta',
        baseName: 'Pasta Dental Colgate Total',
        variants: [
            { id: '789012001', name: 'Menta Fresca', unit: '150ml', expirationDate: '2024-10-01' }, // Vencido
            { id: '789012002', name: 'Blanqueadora', unit: '100ml', expirationDate: '2026-03-15' },
        ],
    },
];

// --- FUNCIONES DE SERVICIO (Simulación de Local-First) ---

// Simula la obtención de un producto por EAN (OFF API o Local)
const getProductByEAN = (ean: string): { base: string, variant: Variant } | null => {
    for (const base of MOCK_PRODUCTS) {
        const variant = base.variants.find(v => v.id === ean);
        if (variant) {
            return { base: base.baseName, variant };
        }
    }
    return null; // Producto no encontrado
};

// --- UTILITY FUNCTIONS ---

const getExpiryStatus = (date: string | null): 'EXPIRED' | 'SOON' | 'OK' | 'NONE' => {
    if (!date) return 'NONE';

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate day comparison
    const expiryDate = new Date(date);
    expiryDate.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
        return 'EXPIRED';
    }

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Considerar pronto si es menos de 60 días
    if (diffDays <= 60) {
        return 'SOON';
    }

    return 'OK';
};

// --- COMPONENTE PRINCIPAL (Main Component) ---

const App: React.FC = () => {
    // Estado principal de la lista de reposición (incluye también items de inventario)
    const [restockList, setRestockList] = useState<RestockItem[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentQuantity, setCurrentQuantity] = useState<number>(1);
    
    // activeModalItemEAN: EAN del producto a añadir/actualizar.
    const [activeModalItemEAN, setActiveModalItemEAN] = useState<string | null>(null);
    // modalSourceView: Para saber si el modal fue abierto desde RESTOCK o EXPIRY
    const [modalSourceView, setModalSourceView] = useState<ActiveView>('RESTOCK'); 

    const [showQuantityModal, setShowQuantityModal] = useState<boolean>(false);
    const [showExpiryModal, setShowExpiryModal] = useState<boolean>(false);
    const [itemToUpdate, setItemToUpdate] = useState<RestockItem | null>(null);
    const [activeView, setActiveView] = useState<ActiveView>('RESTOCK');
    const [showError, setShowError] = useState<string | null>(null);

    // Color de acento vibrante (Cyan)
    const ACCENT_COLOR = 'bg-cyan-500';
    const TEXT_ACCENT_COLOR = 'text-cyan-600';

    // Función para simular el escaneo o la búsqueda manual
    const handleScanOrManualSearch = (ean: string, sourceView: ActiveView) => {
        setShowError(null); // Limpiar errores
        const productInfo = getProductByEAN(ean);
        if (productInfo) {
            setActiveModalItemEAN(ean);
            setModalSourceView(sourceView);
            setShowQuantityModal(true);
        } else {
            setShowError('Producto no encontrado. Intenta con otro EAN o búscalo manualmente.');
            // Usamos un EAN de mock data para que se pueda probar la app
            if (ean !== '123456001') {
                handleScanOrManualSearch('123456001', sourceView); 
            }
        }
    };

    // Función para agregar el producto a la lista con la cantidad deseada
    const addItemToRestock = (variantEan: string, quantity: number) => {
        const productInfo = getProductByEAN(variantEan);
        if (!productInfo) return;

        const isInventoryOnly = modalSourceView === 'EXPIRY';
        
        // Si es una acción de REPOSICIÓN, buscamos si ya existe un item PENDIENTE para actualizar la cantidad.
        // Si es INVENTORY, siempre se añade como nuevo item, ya que podría ser un nuevo lote.
        const existingItem = restockList.find(item => 
            item.variantId === variantEan && item.status === 'PENDING'
        );

        if (existingItem && !isInventoryOnly) {
            setRestockList(prev => prev.map(item => 
                item.id === existingItem.id 
                ? { ...item, quantity: item.quantity + quantity, addedAt: Date.now() } // Actualiza cantidad y mueve al final de la lista
                : item
            ).sort((a, b) => a.addedAt - b.addedAt));
        } else {
            const newItem: RestockItem = {
                id: Date.now().toString(),
                baseName: productInfo.base,
                variantId: productInfo.variant.id,
                variantName: `${productInfo.variant.name} (${productInfo.variant.unit})`,
                unit: productInfo.variant.unit,
                expirationDate: productInfo.variant.expirationDate,
                quantity: quantity,
                addedAt: Date.now(),
                status: isInventoryOnly ? 'INVENTORY' : 'PENDING', // Asigna el nuevo estado
                isExpanded: false,
            };
            setRestockList(prev => [...prev, newItem].sort((a, b) => a.addedAt - b.addedAt));
        }


        setShowQuantityModal(false);
        setActiveModalItemEAN(null);
        setCurrentQuantity(1);
        setSearchTerm('');
    };

    // Función para actualizar el estado de un item
    const updateItemStatus = (id: string, status: ItemStatus) => {
        setRestockList(prev =>
            prev.map(item =>
                item.id === id ? { ...item, status: status } : item
            )
        );
    };

    // Función para alternar la expansión de la tarjeta
    const toggleCardExpansion = useCallback((baseName: string) => {
        setRestockList(prev => {
            // Encontrar el estado actual de expansión de la base
            const isCurrentlyExpanded = prev.some(item => item.baseName === baseName && item.isExpanded);

            return prev.map(item =>
                item.baseName === baseName
                    ? { ...item, isExpanded: !isCurrentlyExpanded } // Alternar el estado
                    : item
            );
        });
    }, []);

    // Abre el modal para actualizar la fecha de vencimiento
    const openExpiryUpdateModal = (item: RestockItem) => {
        setItemToUpdate(item);
        setShowExpiryModal(true);
    };

    // Actualiza la fecha de vencimiento
    const updateExpiryDate = (id: string, date: string) => {
        setRestockList(prev =>
            prev.map(item =>
                item.id === id ? { ...item, expirationDate: date } : item
            )
        );
        setShowExpiryModal(false);
        setItemToUpdate(null);
    };

    // Eliminar un item
    const removeItem = (id: string) => {
        setRestockList(prev => prev.filter(item => item.id !== id));
    };

    // Agrupar la lista por Producto Base para la visualización de Reposición
    const groupedList = useMemo(() => {
        // Filtra: Solo muestra items relacionados con el ciclo de compra/reposición
        // Excluye los ítems de INVENTORY (que son solo para seguimiento de vencimiento)
        const restockItems = restockList.filter(item => item.status !== 'INVENTORY');

        return restockItems.reduce((acc, item) => {
            const group = acc.find(g => g.baseName === item.baseName);
            if (group) {
                group.variants.push(item);
            } else {
                // Determine initial expansion state from the first item
                acc.push({ baseName: item.baseName, isExpanded: item.isExpanded, variants: [item] });
            }
            return acc;
        }, [] as { baseName: string, isExpanded: boolean, variants: RestockItem[] }[]);
    }, [restockList]);

    // Lista de vencimientos ordenada
    const expiryList = useMemo(() => {
        return restockList
            // CORRECCIÓN: Filtrar SOLO por items en estado 'INVENTORY' que tengan fecha.
            .filter(item => item.status === 'INVENTORY' && item.expirationDate !== null) 
            .sort((a, b) => {
                const statusA = getExpiryStatus(a.expirationDate);
                const statusB = getExpiryStatus(b.expirationDate);

                // Prioridad: EXPIRED > SOON > OK
                const statusOrder = { 'EXPIRED': 1, 'SOON': 2, 'OK': 3, 'NONE': 4 };
                const orderDiff = statusOrder[statusA] - statusOrder[statusB];
                if (orderDiff !== 0) return orderDiff;

                // Si tienen el mismo estado, ordenar cronológicamente
                return new Date(a.expirationDate!).getTime() - new Date(b.expirationDate!).getTime();
            });
    }, [restockList]);

    // Hook para cargar/guardar estado local (Simulación Local-First)
    useEffect(() => {
        const savedList = localStorage.getItem('restockList');
        if (savedList) {
            setRestockList(JSON.parse(savedList));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('restockList', JSON.stringify(restockList));
    }, [restockList]);

    // --- RENDERIZADO DE COMPONENTES DE VISTA ---

    const StatusBadge: React.FC<{ status: ItemStatus }> = ({ status }) => {
        let colorClass = 'bg-gray-200 text-gray-700';
        let text = 'PENDIENTE';

        if (status === 'RESTOCKED') {
            colorClass = 'bg-emerald-500 text-white';
            text = 'REPUESTO';
        } else if (status === 'OUT_OF_STOCK') {
            colorClass = 'bg-red-500 text-white';
            text = 'SIN STOCK';
        } else if (status === 'INVENTORY') {
            colorClass = 'bg-cyan-100 text-cyan-700';
            text = 'INVENTARIO';
        }

        return (
            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
                {text}
            </span>
        );
    };

    const ExpiryChip: React.FC<{ date: string | null }> = ({ date }) => {
        if (!date) return (
            <div className="text-xs px-2 py-0.5 rounded-full border border-gray-300 bg-gray-100 text-gray-500 flex items-center gap-1">
                <Calendar size={12} />
                Sin Vencimiento
            </div>
        );

        const status = getExpiryStatus(date);
        let color = 'bg-gray-100 text-gray-600 border-gray-300';
        let text = `Vence: ${date}`;

        if (status === 'EXPIRED') {
            color = 'bg-red-500 text-white font-bold border-red-600';
            text = `¡VENCIDO! ${date}`;
        } else if (status === 'SOON') {
            color = 'bg-yellow-400 text-gray-900 font-bold border-yellow-500';
            text = `Vence Pronto: ${date}`;
        }

        return (
            <div className={`text-xs px-2 py-0.5 rounded-full border ${color} flex items-center gap-1 shadow-sm`}>
                <Clock size={12} />
                {text}
            </div>
        );
    };

    const RestockCard: React.FC<{ group: { baseName: string, isExpanded: boolean, variants: RestockItem[] } }> = ({ group }) => {
        const { baseName, isExpanded, variants } = group;

        // Solo cuenta los pendientes para el título de la tarjeta de reposición
        const pendingCount = variants.filter(v => v.status === 'PENDING').length;

        return (
            <div className="mb-4 bg-white shadow-xl rounded-xl overflow-hidden transform transition-all duration-300">
                {/* Header Collapsible Card */}
                <div
                    className={`p-4 flex justify-between items-center cursor-pointer ${TEXT_ACCENT_COLOR} font-bold text-lg border-b border-gray-100 hover:bg-gray-50 transition`}
                    onClick={() => toggleCardExpansion(baseName)}
                >
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={20} />
                        {baseName} ({pendingCount})
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {/* Variants List (Collapsible Content) */}
                {isExpanded && (
                    <div className="divide-y divide-gray-100">
                        {variants.sort((a, b) => a.addedAt - b.addedAt).map(item => (
                            <div key={item.id} className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center ${item.status === 'PENDING' ? '' : 'bg-gray-50 opacity-70'}`}>
                                {/* Product Info */}
                                <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                                    <p className="text-gray-900 font-semibold truncate">{item.variantName}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <StatusBadge status={item.status} />
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                    <span className={`text-xl font-extrabold px-3 py-1 rounded-lg ${ACCENT_COLOR} text-white`}>
                                        x{item.quantity}
                                    </span>
                                    <div className="flex space-x-2">
                                        {/* Repuesto Button (Checkmark) */}
                                        <button
                                            onClick={() => updateItemStatus(item.id, item.status === 'RESTOCKED' ? 'PENDING' : 'RESTOCKED')}
                                            className={`p-2 rounded-full transition ${item.status === 'RESTOCKED' ? 'bg-emerald-500' : 'bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-600'}`}
                                            title="Marcar como Repuesto"
                                        >
                                            <CheckCircle size={20} className={item.status === 'RESTOCKED' ? 'text-white' : ''} />
                                        </button>

                                        {/* Sin Stock Button (X) */}
                                        <button
                                            onClick={() => updateItemStatus(item.id, item.status === 'OUT_OF_STOCK' ? 'PENDING' : 'OUT_OF_STOCK')}
                                            className={`p-2 rounded-full transition ${item.status === 'OUT_OF_STOCK' ? 'bg-red-500' : 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600'}`}
                                            title="Marcar como Sin Stock"
                                        >
                                            <XCircle size={20} className={item.status === 'OUT_OF_STOCK' ? 'text-white' : ''} />
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition"
                                            title="Eliminar de la lista"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const ExpiryAddSection: React.FC = () => {
        return (
            <section className="p-4 bg-white border-b-4 border-red-100">
                <div className="flex flex-col space-y-3">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Escanear EAN o escribir producto base para añadir al inventario..."
                        className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-red-500 outline-none text-gray-800 transition shadow-sm"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleScanOrManualSearch(searchTerm || '123456001', 'EXPIRY')} // Pasa el contexto 'EXPIRY'
                            className={`flex items-center justify-center py-3 rounded-xl text-white font-semibold bg-red-500 hover:bg-red-600 transition shadow-md`}
                        >
                            <Scan size={20} className="mr-2" /> Escanear/Buscar
                        </button>
                        <button
                            onClick={() => handleScanOrManualSearch('789012001', 'EXPIRY')} // Pasa el contexto 'EXPIRY'
                            className="flex items-center justify-center py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition shadow-sm"
                        >
                            <Edit2 size={20} className="mr-2" /> Añadir Manual
                        </button>
                    </div>
                </div>
            </section>
        );
    };

    const ExpiryListView: React.FC = () => (
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <h2 className={`text-lg font-bold mb-3 text-red-600 uppercase tracking-wider`}>
                Inventario con Vencimientos ({expiryList.length})
            </h2>
            <p className="text-sm text-gray-600 mb-4">
                Listado ordenado por productos con fecha de vencimiento más próxima o ya expirada.
            </p>
            
            {expiryList.length === 0 ? (
                <div className="text-center p-10 text-gray-500 bg-white rounded-xl shadow-inner">
                    <Clock size={48} className="mx-auto mb-3" />
                    <p>No hay productos con fecha de vencimiento registrada que no sean de reposición.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {expiryList.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center">
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-500">{item.baseName}</p>
                                <p className="text-gray-900 font-bold truncate">{item.variantName}</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <ExpiryChip date={item.expirationDate} />
                                    {/* Muestra el estado si no es un item de inventario puro, o si lo es pero queremos el badge */}
                                    {item.status !== 'INVENTORY' && <StatusBadge status={item.status} />} 
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center space-x-2 ml-4">
                                <span className="text-xl font-extrabold text-cyan-600">
                                    x{item.quantity}
                                </span>
                                <button
                                    onClick={() => openExpiryUpdateModal(item)}
                                    className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-cyan-100 hover:text-cyan-600 transition"
                                    title="Editar Fecha de Vencimiento"
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition"
                                    title="Eliminar de la lista"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );

    // --- RENDERIZADO DE MODALES ---

    // Modal para Cantidad
    const QuantityModal = () => {
        if (!activeModalItemEAN) return null;
        const info = getProductByEAN(activeModalItemEAN);
        if (!info) return null;

        const titleText = modalSourceView === 'EXPIRY' 
            ? 'Añadir al Inventario (Lote)' 
            : `Añadir ${info.variant.name} (${info.variant.unit})`;

        return (
            <Modal title={titleText} onClose={() => setShowQuantityModal(false)}>
                <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4">
                        Define la cantidad a {modalSourceView === 'EXPIRY' ? 'rastrear' : 'reponer'} de: <span className="font-semibold">{info.base}</span>
                    </p>
                    <div className="flex justify-center items-center space-x-4 mb-6">
                        <button
                            onClick={() => setCurrentQuantity(Math.max(1, currentQuantity - 1))}
                            className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all text-2xl font-bold"
                        >
                            -
                        </button>
                        <input
                            type="number"
                            value={currentQuantity}
                            onChange={(e) => setCurrentQuantity(parseInt(e.target.value) || 1)}
                            className="w-24 text-center text-4xl font-extrabold border-b-4 border-cyan-500 focus:border-cyan-600 outline-none p-1"
                        />
                        <button
                            onClick={() => setCurrentQuantity(currentQuantity + 1)}
                            className={`p-3 rounded-full ${ACCENT_COLOR} text-white hover:bg-cyan-600 transition-all text-2xl font-bold`}
                        >
                            +
                        </button>
                    </div>
                    <button
                        onClick={() => addItemToRestock(activeModalItemEAN, currentQuantity)}
                        className={`w-full py-3 rounded-xl text-white font-bold ${ACCENT_COLOR} hover:bg-cyan-600 transition-all`}
                    >
                        <Plus className="inline-block mr-2" size={20} /> Añadir a la Lista
                    </button>
                </div>
            </Modal>
        );
    };

    // Modal para Fecha de Vencimiento
    const ExpiryModal = () => {
        if (!itemToUpdate) return null;
        const [date, setDate] = useState(itemToUpdate.expirationDate || new Date().toISOString().split('T')[0]);

        return (
            <Modal title={`Fecha de Vencimiento: ${itemToUpdate.variantName}`} onClose={() => setShowExpiryModal(false)}>
                <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4">
                        Selecciona la fecha de vencimiento para este producto:
                    </p>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-3 mb-6 border-2 border-gray-300 rounded-lg focus:border-cyan-500 outline-none"
                    />
                    <button
                        onClick={() => updateExpiryDate(itemToUpdate.id, date)}
                        className={`w-full py-3 rounded-xl text-white font-bold ${ACCENT_COLOR} hover:bg-cyan-600 transition-all`}
                    >
                        <Calendar className="inline-block mr-2" size={20} /> Guardar Fecha
                    </button>
                </div>
            </Modal>
        );
    };

    // Componente Modal Base
    const Modal: React.FC<{ title: string, onClose: () => void, children: React.ReactNode }> = ({ title, onClose, children }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl w-full max-w-sm shadow-2xl transform transition-all overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                        <XCircle size={24} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );

    // Error Toast
    const ErrorToast: React.FC<{ message: string, onClose: () => void }> = ({ message, onClose }) => (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg flex items-center space-x-4 max-w-sm">
                <XCircle size={24} />
                <p className="flex-1">{message}</p>
                <button onClick={onClose} className="p-1 -mr-2 rounded-full hover:bg-red-700">
                    <XCircle size={16} />
                </button>
            </div>
        </div>
    );


    return (
        <div className="min-h-screen bg-gray-50 font-sans p-0 sm:p-4">
            <div className="max-w-lg mx-auto bg-white min-h-screen sm:min-h-[90vh] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">

                {/* HEADER - Black Base */}
                <header className="bg-gray-900 text-white p-6 shadow-lg">
                    <h1 className="text-2xl font-extrabold flex items-center gap-2">
                        <Archive size={28} className={TEXT_ACCENT_COLOR} />
                        Gestor de Reposición
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Organiza tu lista y controla vencimientos.</p>
                </header>
                
                {/* NAVIGATION TABS */}
                <nav className="p-4 bg-white border-b border-gray-100">
                    <div className="flex justify-around bg-gray-100 p-1 rounded-full shadow-inner">
                        <button
                            onClick={() => setActiveView('RESTOCK')}
                            className={`flex-1 py-2 rounded-full font-bold transition-all flex items-center justify-center ${activeView === 'RESTOCK' ? ACCENT_COLOR + ' text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            <ListChecks size={20} className="mr-2" /> Reposición
                        </button>
                        <button
                            onClick={() => setActiveView('EXPIRY')}
                            className={`flex-1 py-2 rounded-full font-bold transition-all flex items-center justify-center ${activeView === 'EXPIRY' ? 'bg-red-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            <Clock size={20} className="mr-2" /> Vencimientos
                        </button>
                    </div>
                </nav>

                {/* ADD PRODUCT SECTION - Visible only in RESTOCK view */}
                {activeView === 'RESTOCK' && (
                    <section className="p-4 bg-white border-b-4 border-cyan-100">
                        <div className="flex flex-col space-y-3">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Escanear EAN o escribir producto base..."
                                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-cyan-500 outline-none text-gray-800 transition shadow-sm"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleScanOrManualSearch(searchTerm || '123456001', 'RESTOCK')} // Pasa el contexto 'RESTOCK'
                                    className={`flex items-center justify-center py-3 rounded-xl text-white font-semibold ${ACCENT_COLOR} hover:bg-cyan-600 transition shadow-md`}
                                >
                                    <Scan size={20} className="mr-2" /> Escanear/Buscar
                                </button>
                                <button
                                    onClick={() => handleScanOrManualSearch('789012001', 'RESTOCK')} // Pasa el contexto 'RESTOCK'
                                    className="flex items-center justify-center py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition shadow-sm"
                                >
                                    <Edit2 size={20} className="mr-2" /> Añadir Manual
                                </button>
                            </div>
                        </div>
                    </section>
                )}


                {/* MAIN CONTENT AREA */}
                {activeView === 'RESTOCK' && (
                    <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
                        <h2 className={`text-lg font-bold mb-3 ${TEXT_ACCENT_COLOR} uppercase tracking-wider`}>
                            Lista de Reposición ({restockList.filter(item => item.status === 'PENDING').length})
                        </h2>
                        {groupedList.length === 0 ? (
                            <div className="text-center p-10 text-gray-500 bg-white rounded-xl shadow-inner">
                                <Archive size={48} className="mx-auto mb-3" />
                                <p>¡Tu lista está vacía! Escanea o busca un producto para empezar a reponer.</p>
                            </div>
                        ) : (
                            groupedList.map(group => (
                                <RestockCard key={group.baseName} group={group} />
                            ))
                        )}
                    </main>
                )}
                
                {activeView === 'EXPIRY' && (
                    <>
                        <ExpiryAddSection />
                        <ExpiryListView />
                    </>
                )}
            </div>

            {/* Modals and Toasts */}
            {showQuantityModal && <QuantityModal />}
            {showExpiryModal && <ExpiryModal />}
            {showError && <ErrorToast message={showError} onClose={() => setShowError(null)} />}
        </div>
    );
};

export default App;
```