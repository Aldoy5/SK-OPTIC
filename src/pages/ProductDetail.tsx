import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Shield, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products, isLoading } = useProducts();
  const [quantity, setQuantity] = useState(1);

  const product = products.find(p => p.id === id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mb-4"></div>
        <p className="text-gray-500 font-medium">Chargement du produit...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Produit introuvable</h2>
        <Link to="/shop" className="text-purple-700 hover:text-purple-900 flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 lg:p-12">
            {/* Image section */}
            <div className="rounded-xl overflow-hidden bg-gray-100 aspect-square">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Details section */}
            <div className="flex flex-col justify-center">
              <div className="mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {product.categories.join(', ')}
                </span>
              </div>

              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  Genres: {product.genders.join(', ')}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                {product.name}
              </h1>
              <p className="text-3xl font-bold text-gray-900 mb-6">
                {product.price} FCFA
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {product.description}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
                <div className="inline-flex items-center border border-gray-300 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="px-4 py-2 text-lg font-bold text-gray-700 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 text-center border-x border-gray-300 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="px-4 py-2 text-lg font-bold text-gray-700 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={() => addToCart(product, quantity)}
                className="w-full flex items-center justify-center py-4 px-8 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-700 transition-colors mb-8"
              >
                <ShoppingCart className="w-6 h-6 mr-2" />
                Ajouter au panier
              </button>

              <div className="bg-purple-50 rounded-xl p-4 mb-8 flex items-start gap-3 border border-purple-100">
                <ShieldCheck className="w-6 h-6 text-purple-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-purple-900">Assurances Acceptées</h3>
                  <p className="text-sm text-purple-700">SK OPTIC accepte la plupart des assurances et mutuelles. Devis gratuit disponible sur demande.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-3">
                    <Truck className="w-6 h-6 text-purple-700" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Livraison gratuite</h3>
                  <p className="text-xs text-gray-500 mt-1">Dès 50 000 FCFA d'achat</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-3">
                    <Shield className="w-6 h-6 text-purple-700" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Garantie 2 ans</h3>
                  <p className="text-xs text-gray-500 mt-1">Sur toutes les montures</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-3">
                    <RotateCcw className="w-6 h-6 text-purple-700" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Retours gratuits</h3>
                  <p className="text-xs text-gray-500 mt-1">Sous 30 jours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
