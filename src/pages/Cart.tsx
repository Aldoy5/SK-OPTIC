import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { sendAdminNotificationEmails } from '../lib/adminNotifications';

export function Cart() {
  const { items, removeFromCart, updateQuantity, total, subtotal, discount, discountPercentage, appliedPromotion, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsCheckingOut(true);
    try {
      const orderData = {
        customerName,
        customerContact,
        customerAddress,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total,
        subtotal,
        discount,
        discountPercentage,
        appliedPromotion: appliedPromotion ? {
          id: appliedPromotion.id,
          title: appliedPromotion.title,
          type: appliedPromotion.type,
          value: appliedPromotion.value
        } : null,
        status: 'pending',
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'orders'), orderData);

      try {
        await sendAdminNotificationEmails({
          subject: 'Nouvelle commande SK OPTIC',
          text: `Nouvelle commande de ${customerName}. Total: ${total} FCFA. Contact: ${customerContact}.`,
          html: `<p><strong>Nouvelle commande</strong></p><p>Client: ${customerName}</p><p>Contact: ${customerContact}</p><p>Adresse: ${customerAddress}</p><p>Total: ${total} FCFA</p>`,
        });
      } catch (notificationError) {
        console.warn('Notification admin non envoyée:', notificationError);
      }

      setIsSuccess(true);
      clearCart();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center border border-gray-100">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Commande Réussie !</h2>
          <p className="text-lg text-gray-600 mb-8">
            Merci pour votre achat. Votre commande a été traitée avec succès et sera expédiée sous peu.
          </p>
          <Link
            to="/shop"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-700 transition-colors"
          >
            Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <ShoppingBag className="h-24 w-24 text-gray-300 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Votre panier est vide</h2>
        <p className="text-gray-500 mb-8">Découvrez notre collection de montures et trouvez la paire parfaite.</p>
        <Link
          to="/shop"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-700 transition-colors"
        >
          Voir la boutique <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Votre Panier</h1>

        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-100">
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.id} className="p-6 flex flex-col sm:flex-row items-center">
                <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden mb-4 sm:mb-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="sm:ml-6 flex-1 flex flex-col justify-between w-full">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{item.categories.join(', ')} • {item.genders.join(', ')}</p>
                    </div>
                    <p className="text-lg font-medium text-gray-900">{item.price} FCFA</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1 text-gray-700 hover:bg-gray-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value) || 1)}
                        className="w-16 text-center py-1 border-x border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 text-gray-700 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-2 transition-colors"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <div className="flex justify-between text-base font-medium text-gray-900 mb-2">
              <p>Sous-total</p>
              <p>{subtotal} FCFA</p>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm font-medium text-green-600 mb-2">
                <p>Remise ({discountPercentage}%)</p>
                <p>-{discount} FCFA</p>
              </div>
            )}
            {appliedPromotion && (
              <p className="text-xs text-green-700 mb-4">Promotion appliquée automatiquement : {appliedPromotion.title}</p>
            )}
            <div className="flex justify-between text-sm text-gray-500 mb-6">
              <p>Frais de livraison</p>
              <p>Gratuit</p>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 mb-8 border-t border-gray-200 pt-4">
              <p>Total à payer</p>
              <p>{total} FCFA</p>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom & prénom</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-700 focus:ring-purple-700"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                <input
                  type="text"
                  required
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-700 focus:ring-purple-700"
                  placeholder="Téléphone ou email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <textarea
                  required
                  rows={3}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-700 focus:ring-purple-700"
                  placeholder="Votre adresse complète"
                />
              </div>

              <button
                type="submit"
                disabled={isCheckingOut}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isCheckingOut ? 'Traitement en cours...' : 'Passer la commande'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
