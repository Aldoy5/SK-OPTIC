import React, { useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShoppingCart, Filter, Tag, ShieldCheck } from 'lucide-react';
import { PRODUCT_CATEGORIES, PRODUCT_GENDERS, useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { usePromotions } from '../context/PromotionContext';

export function Shop() {
  const { addToCart } = useCart();
  const { activePromotions, isLoading: isPromotionsLoading } = usePromotions();
  const { products, isLoading } = useProducts();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category') || 'All';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedGender, setSelectedGender] = useState('All');

  const categories = ['All', ...PRODUCT_CATEGORIES];
  const genders = ['All', ...PRODUCT_GENDERS];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.categories.includes(selectedCategory);
      const matchesGender = selectedGender === 'All' || product.genders.includes(selectedGender);
      return matchesCategory && matchesGender;
    });
  }, [products, selectedCategory, selectedGender]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mb-4"></div>
        <p className="text-gray-500 font-medium">Chargement de la collection...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gradient-to-r from-purple-700 to-purple-800 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">Offres Spéciales</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Offres en cours</h2>
            <p className="text-purple-100 opacity-90">
              {isPromotionsLoading
                ? 'Chargement des promotions...'
                : activePromotions.length > 0
                  ? activePromotions.map((promotion) => promotion.title).join(' • ')
                  : 'Aucune promotion active pour le moment.'}
            </p>
          </div>
          <div className="hidden sm:block opacity-20 absolute -right-4 -bottom-4">
            <ShoppingCart className="w-48 h-48" />
          </div>
        </div>
        <div className="bg-white border border-purple-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-xl text-purple-700">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Assurances</h3>
            <p className="text-sm text-gray-500">Toutes mutuelles acceptées chez SK OPTIC.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Notre Collection</h1>
          <p className="mt-2 text-gray-500">Trouvez la monture parfaite pour votre style et votre vue.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm w-full sm:w-auto">
            <Filter className="h-5 w-5 text-gray-400 ml-2 mr-1" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 py-2 pl-2 pr-8 cursor-pointer w-full"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? 'Toutes les catégories' : cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm w-full sm:w-auto">
            <Filter className="h-5 w-5 text-gray-400 ml-2 mr-1" />
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 py-2 pl-2 pr-8 cursor-pointer w-full"
            >
              {genders.map(gender => (
                <option key={gender} value={gender}>{gender === 'All' ? 'Tous les genres' : gender}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {initialCategory !== 'All' && selectedCategory === initialCategory && (
        <div className="mb-8 bg-purple-50 border border-purple-100 rounded-lg p-4 flex items-start">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-purple-800">Filtre appliqué suite à votre ordonnance</h3>
            <div className="mt-1 text-sm text-purple-700">
              Nous avons filtré les montures pour la catégorie : <strong>{selectedCategory}</strong>.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
            <Link to={`/product/${product.id}`} className="relative aspect-w-4 aspect-h-3 bg-gray-100 overflow-hidden block">
              <img
                src={product.image}
                alt={product.name}
                className="object-cover w-full h-64 group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-800 shadow-sm">
                  {product.categories.join(', ')}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 shadow-sm border border-purple-100">
                  {product.genders.join(', ')}
                </span>
              </div>
            </Link>
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div className="pr-4">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-lg font-bold text-gray-900 hover:text-purple-700 transition-colors">{product.name}</h3>
                  </Link>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                </div>
                <p className="text-lg font-bold text-purple-700 whitespace-nowrap">{product.price} FCFA</p>
              </div>
              <div className="mt-auto pt-4">
                <button
                  onClick={() => addToCart(product)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Ajouter au panier
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Aucun produit trouvé pour ces filtres.</p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedGender('All');
            }}
            className="mt-4 text-purple-700 font-medium hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
