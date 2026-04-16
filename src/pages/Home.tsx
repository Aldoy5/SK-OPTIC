import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Upload, Calendar, Eye, Tag, ShieldCheck } from 'lucide-react';
import { usePromotions } from '../context/PromotionContext';

export function Home() {
  const { activePromotions } = usePromotions();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left flex flex-col justify-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                <span className="block xl:inline">Votre vision,</span>{' '}
                <span className="block text-purple-700 xl:inline">notre passion</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Découvrez notre collection de montures élégantes. Téléchargez votre ordonnance pour trouver les lunettes parfaitement adaptées à votre vue, ou prenez rendez-vous avec nos experts.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/upload"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-700 hover:bg-purple-800 transition-colors shadow-sm"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Envoyer mon ordonnance
                </Link>
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Voir la boutique
                </Link>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-2xl shadow-xl lg:max-w-md overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1582142407894-ec85a1260a46?auto=format&fit=crop&q=80&w=1000"
                  alt="Boutique SK OPTIC"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offers & Insurance Section */}
      <section className="py-12 bg-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-4">
                <Tag className="w-8 h-8" />
                <h2 className="text-3xl font-bold">Offres Exceptionnelles</h2>
              </div>
              <p className="text-purple-100 text-lg mb-6">
                Profitez de nos offres groupées pour toute la famille !
              </p>
              <div className="space-y-4">
                {activePromotions.map((promotion) => (
                  <div key={promotion.id} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                    <h3 className="font-bold text-xl">{promotion.title}</h3>
                    <p className="text-purple-100">{promotion.description}</p>
                  </div>
                ))}
                {activePromotions.length === 0 && (
                  <p className="text-purple-100">Aucune offre active pour le moment.</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-4 text-purple-700">
                <ShieldCheck className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Assurances Acceptées</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Nous facilitons vos démarches ! SK OPTIC accepte la plupart des assurances et mutuelles pour votre prise en charge.
              </p>
              <ul className="grid grid-cols-2 gap-4 text-sm font-medium text-gray-700">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-700 rounded-full"></div>
                  Tiers payant disponible
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-700 rounded-full"></div>
                  Devis gratuit
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-700 rounded-full"></div>
                  Accompagnement administratif
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-700 rounded-full"></div>
                  Partenariats mutuelles
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-purple-700 tracking-wide uppercase">Services</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Une expérience sur mesure
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-100 text-purple-700 mb-6">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">Ordonnance en ligne</h3>
                <p className="text-gray-500 mb-6">
                  Prenez en photo votre ordonnance. Notre système analyse vos besoins et vous propose les montures compatibles.
                </p>
                <Link to="/upload" className="text-purple-700 font-medium hover:text-purple-900 flex items-center">
                  Commencer <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-100 text-purple-700 mb-6">
                  <Eye className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">Large choix</h3>
                <p className="text-gray-500 mb-6">
                  Parcourez notre catalogue de montures de créateurs et de marques reconnues pour tous les styles.
                </p>
                <Link to="/shop" className="text-purple-700 font-medium hover:text-purple-900 flex items-center">
                  Découvrir <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-100 text-purple-700 mb-6">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">Consultation</h3>
                <p className="text-gray-500 mb-6">
                  Besoin d'un conseil personnalisé ou d'un examen de la vue ? Prenez rendez-vous avec nos opticiens.
                </p>
                <Link to="/appointment" className="text-purple-700 font-medium hover:text-purple-900 flex items-center">
                  Prendre RDV <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
