import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, AlertTriangle, Package, ShoppingCart as CartIcon, CheckCircle, Clock, Truck, Ban, CalendarCheck, Tag } from 'lucide-react';
import { useProducts, Product, PRODUCT_CATEGORIES, PRODUCT_GENDERS } from '../context/ProductContext';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Promotion, usePromotions } from '../context/PromotionContext';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

interface Order {
  id: string;
  customerName: string;
  customerContact: string;
  customerAddress: string;
  customerEmail?: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  status: 'pending' | 'validated' | 'shipped' | 'cancelled';
  createdAt: Timestamp;
}

interface Appointment {
  id: string;
  name: string;
  email?: string;
  phone: string;
  date: string;
  time: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Timestamp;
}

export function Admin() {
  const { products, addProduct, updateProduct, deleteProduct, isLoading: isProductsLoading } = useProducts();
  const { promotions, addPromotion, updatePromotion, deletePromotion } = usePromotions();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'appointments' | 'promotions'>('products');
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const [promotionForm, setPromotionForm] = useState<Omit<Promotion, 'id'>>({
    title: '',
    description: '',
    type: 'percentage',
    value: 10,
    minQuantity: 2,
    isActive: true
  });
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null);

  const categories = [...PRODUCT_CATEGORIES];
  const genders = [...PRODUCT_GENDERS];

  useEffect(() => {
    setIsOrdersLoading(true);
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      })) as Order[];
      setOrders(ordersData);
      setIsOrdersLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setIsOrdersLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsAppointmentsLoading(true);
    const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      })) as Appointment[];
      setAppointments(appointmentsData);
      setIsAppointmentsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
      setIsAppointmentsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${appointmentId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (window.confirm('Supprimer cette commande ?')) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
      }
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (window.confirm('Supprimer ce rendez-vous ?')) {
      try {
        await deleteDoc(doc(db, 'appointments', appointmentId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `appointments/${appointmentId}`);
      }
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'validated': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-purple-700" />;
      case 'cancelled': return <Ban className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'validated': return 'Validée';
      case 'shipped': return 'Expédiée';
      case 'cancelled': return 'Annulée';
    }
  };

  const getAppointmentStatusLabel = (status: Appointment['status']) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmé';
      case 'cancelled': return 'Annulé';
    }
  };

  const handleOpenEdit = (product?: Product) => {
    if (product) {
      setCurrentProduct({
        ...product,
        categories: product.categories?.length ? product.categories : [product.category],
        genders: product.genders?.length ? product.genders : genders
      });
    } else {
      setCurrentProduct({
        name: '',
        price: 0,
        image: '',
        category: categories[0],
        categories: [categories[0]],
        genders,
        description: ''
      });
    }
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
    setCurrentProduct({});
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentProduct.categories?.length) {
      alert('Veuillez sélectionner au moins une catégorie.');
      return;
    }

    if (!currentProduct.genders?.length) {
      alert('Veuillez sélectionner au moins un genre.');
      return;
    }
    if (currentProduct.id) {
      updateProduct(currentProduct.id, { ...currentProduct, category: currentProduct.categories[0] } as Omit<Product, 'id'>);
    } else {
      addProduct({ ...currentProduct, category: currentProduct.categories[0] } as Omit<Product, 'id'>);
    }
    handleCloseEdit();
  };


  const resetPromotionForm = () => {
    setEditingPromotionId(null);
    setPromotionForm({
      title: '',
      description: '',
      type: 'percentage',
      value: 10,
      minQuantity: 2,
      isActive: true
    });
  };

  const handlePromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPromotionId) {
      await updatePromotion(editingPromotionId, promotionForm);
    } else {
      await addPromotion(promotionForm);
    }
    resetPromotionForm();
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotionId(promotion.id);
    setPromotionForm({
      title: promotion.title,
      description: promotion.description,
      type: promotion.type,
      value: promotion.value,
      minQuantity: promotion.minQuantity,
      isActive: promotion.isActive
    });
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
      setProductToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Administration</h1>
          <p className="mt-2 text-gray-500">Gérez votre catalogue, vos commandes et vos rendez-vous.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${activeTab === 'products' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Package className="w-4 h-4 mr-2" />
              Produits
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${activeTab === 'orders' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CartIcon className="w-4 h-4 mr-2" />
              Commandes
              {orders.filter(order => order.status === 'pending').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {orders.filter(order => order.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${activeTab === 'appointments' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarCheck className="w-4 h-4 mr-2" />
              Rendez-vous
              {appointments.filter(appointment => appointment.status === 'pending').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {appointments.filter(appointment => appointment.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('promotions')}
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${activeTab === 'promotions' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Tag className="w-4 h-4 mr-2" />
              Promotions
            </button>
          </div>
          {activeTab === 'products' && (
            <button
              onClick={() => handleOpenEdit()}
              className="flex items-center px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouveau Produit
            </button>
          )}
        </div>
      </div>

      {activeTab === 'products' ? (
        <>
          {isProductsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mb-4"></div>
              <p className="text-gray-500">Chargement des produits...</p>
            </div>
          ) : (
            <>
              {/* Modal d'édition / ajout */}
              {isEditing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                      <h2 className="text-xl font-bold text-gray-900">
                        {currentProduct.id ? 'Modifier le produit' : 'Ajouter un produit'}
                      </h2>
                      <button onClick={handleCloseEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form onSubmit={handleSave} className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
                          <input
                            type="text"
                            required
                            value={currentProduct.name || ''}
                            onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-700 focus:ring-purple-700"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA)</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={currentProduct.price || ''}
                            onChange={e => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-700 focus:ring-purple-700"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Image du produit</label>
                          <div className="flex items-center space-x-4">
                            {currentProduct.image && (
                              <img src={currentProduct.image} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-gray-200" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setCurrentProduct({ ...currentProduct, image: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Catégories (choix multiple)</label>
                          <div className="grid grid-cols-2 gap-2 border border-gray-200 rounded-lg p-3">
                            {categories.map(cat => {
                              const currentCategories = currentProduct.categories || [];
                              const checked = currentCategories.includes(cat);
                              return (
                                <label key={cat} className="flex items-center gap-2 text-sm text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const updatedCategories = checked
                                        ? currentCategories.filter(item => item !== cat)
                                        : [...currentCategories, cat];
                                      setCurrentProduct({
                                        ...currentProduct,
                                        categories: updatedCategories,
                                        category: updatedCategories[0] || categories[0]
                                      });
                                    }}
                                    className="rounded border-gray-300 text-purple-700 focus:ring-purple-700"
                                  />
                                  {cat}
                                </label>
                              );
                            })}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">Sélectionnez au moins une catégorie.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Genres (choix multiple)</label>
                          <div className="grid grid-cols-2 gap-2 border border-gray-200 rounded-lg p-3">
                            {genders.map(gender => {
                              const currentGenders = currentProduct.genders || [];
                              const checked = currentGenders.includes(gender);
                              return (
                                <label key={gender} className="flex items-center gap-2 text-sm text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const updatedGenders = checked
                                        ? currentGenders.filter(item => item !== gender)
                                        : [...currentGenders, gender];
                                      setCurrentProduct({
                                        ...currentProduct,
                                        genders: updatedGenders
                                      });
                                    }}
                                    className="rounded border-gray-300 text-purple-700 focus:ring-purple-700"
                                  />
                                  {gender}
                                </label>
                              );
                            })}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">Sélectionnez un ou plusieurs genres.</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            required
                            rows={3}
                            value={currentProduct.description || ''}
                            onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-700 focus:ring-purple-700"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={handleCloseEdit}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="flex items-center px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors font-medium"
                        >
                          <Save className="w-5 h-5 mr-2" />
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal de suppression */}
              {productToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Confirmer la suppression</h2>
                    <p className="text-gray-500 mb-8">
                      Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => setProductToDelete(null)}
                        className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste des produits */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Genres</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                <img className="h-full w-full object-cover" src={product.image} alt="" referrerPolicy="no-referrer" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                              {product.categories.join(', ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                              {product.genders.join(', ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.price} FCFA
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleOpenEdit(product)}
                              className="text-purple-700 hover:text-purple-900 mr-4 p-2 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(product.id)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            Aucun produit dans le catalogue.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : activeTab === 'orders' ? (
        <div className="space-y-6">
          {isOrdersLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mb-4"></div>
              <p className="text-gray-500">Chargement des commandes...</p>
            </div>
          ) : (
            <>
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                        <CartIcon className="w-5 h-5 text-purple-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Commande #{order.id.slice(-6).toUpperCase()}</h3>
                        <p className="text-xs text-gray-500">{order.createdAt.toDate().toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                        order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                          order.status === 'validated' ? 'bg-green-50 text-green-700 border-green-100' :
                            order.status === 'shipped' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                              'bg-red-50 text-red-700 border-red-100'
                        }`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </div>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        className="text-xs rounded-lg border-gray-300 shadow-sm focus:border-purple-700 focus:ring-purple-700"
                      >
                        <option value="pending">En attente</option>
                        <option value="validated">Valider</option>
                        <option value="shipped">Expédier</option>
                        <option value="cancelled">Annuler</option>
                      </select>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Client</h4>
                        <p className="text-sm font-medium text-gray-900">{order.customerName || 'Non renseigné'}</p>
                        <p className="text-sm text-gray-600 mt-1">Contact: {order.customerContact || order.customerEmail || 'Non renseigné'}</p>
                        <p className="text-sm text-gray-600 mt-1">Adresse: {order.customerAddress || 'Non renseignée'}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Articles</h4>
                        <ul className="space-y-2">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-600">{item.quantity}x {item.name}</span>
                              <span className="font-medium text-gray-900">{item.price * item.quantity} FCFA</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-900">Total</span>
                          <span className="text-lg font-bold text-purple-700">{order.total} FCFA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <CartIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Aucune commande</h3>
                  <p className="text-gray-500">Les commandes de vos clients apparaîtront ici.</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : activeTab === 'appointments' ? (
        <div className="space-y-6">
          {isAppointmentsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mb-4"></div>
              <p className="text-gray-500">Chargement des rendez-vous...</p>
            </div>
          ) : (
            <>
              {appointments.map((appointment) => (
                <div key={appointment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                        <CalendarCheck className="w-5 h-5 text-purple-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Rendez-vous #{appointment.id.slice(-6).toUpperCase()}</h3>
                        <p className="text-xs text-gray-500">Créé le {appointment.createdAt.toDate().toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                        appointment.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                          appointment.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100' :
                            'bg-red-50 text-red-700 border-red-100'
                        }`}>
                        <Clock className="w-4 h-4" />
                        {getAppointmentStatusLabel(appointment.status)}
                      </div>
                      <select
                        value={appointment.status}
                        onChange={(e) => updateAppointmentStatus(appointment.id, e.target.value as Appointment['status'])}
                        className="text-xs rounded-lg border-gray-300 shadow-sm focus:border-purple-700 focus:ring-purple-700"
                      >
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmer</option>
                        <option value="cancelled">Annuler</option>
                      </select>
                      <button
                        onClick={() => deleteAppointment(appointment.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Informations client</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <p><span className="font-semibold text-gray-900">Nom:</span> <span className="text-gray-700">{appointment.name}</span></p>
                      <p><span className="font-semibold text-gray-900">Téléphone:</span> <span className="text-gray-700">{appointment.phone}</span></p>
                      {appointment.email && (<p><span className="font-semibold text-gray-900">Email:</span> <span className="text-gray-700">{appointment.email}</span></p>)}
                      <p><span className="font-semibold text-gray-900">Motif:</span> <span className="text-gray-700">{appointment.reason}</span></p>
                      <p className="md:col-span-2"><span className="font-semibold text-gray-900">Créneau:</span> <span className="text-gray-700">{appointment.date} à {appointment.time}</span></p>
                    </div>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Aucun rendez-vous</h3>
                  <p className="text-gray-500">Les rendez-vous de vos clients apparaîtront ici.</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingPromotionId ? 'Modifier la promotion' : 'Nouvelle promotion'}</h3>
            <form onSubmit={handlePromotionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  required
                  value={promotionForm.title}
                  onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-700 focus:ring-purple-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (visible sur le site)</label>
                <textarea
                  required
                  rows={3}
                  value={promotionForm.description}
                  onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-700 focus:ring-purple-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de remise</label>
                <select
                  value={promotionForm.type}
                  onChange={(e) => setPromotionForm({ ...promotionForm, type: e.target.value as Promotion['type'] })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-700 focus:ring-purple-700"
                >
                  <option value="percentage">Pourcentage</option>
                  <option value="fixed">Montant fixe</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
                  <input
                    type="number"
                    min={1}
                    value={promotionForm.value}
                    onChange={(e) => setPromotionForm({ ...promotionForm, value: Number(e.target.value) || 1 })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-700 focus:ring-purple-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qté minimale</label>
                  <input
                    type="number"
                    min={1}
                    value={promotionForm.minQuantity}
                    onChange={(e) => setPromotionForm({ ...promotionForm, minQuantity: Number(e.target.value) || 1 })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-700 focus:ring-purple-700"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={promotionForm.isActive}
                  onChange={(e) => setPromotionForm({ ...promotionForm, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-purple-700 focus:ring-purple-700"
                />
                Promotion active
              </label>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800">{editingPromotionId ? 'Mettre à jour' : 'Créer'}</button>
                {editingPromotionId && (
                  <button type="button" onClick={resetPromotionForm} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Annuler</button>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Offre</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Règle</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promotions.map((promotion) => (
                  <tr key={promotion.id}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{promotion.title}</p>
                      <p className="text-sm text-gray-500">{promotion.description}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      Dès {promotion.minQuantity} article(s) : {promotion.type === 'percentage' ? `${promotion.value}%` : `${promotion.value} FCFA`}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${promotion.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {promotion.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEditPromotion(promotion)} className="text-purple-700 hover:text-purple-900 mr-4"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deletePromotion(promotion.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {promotions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Aucune promotion configurée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
