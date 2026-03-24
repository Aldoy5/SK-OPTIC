/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ProductProvider } from './context/ProductContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { UploadPrescription } from './pages/UploadPrescription';
import { Appointment } from './pages/Appointment';
import { Cart } from './pages/Cart';
import { ProductDetail } from './pages/ProductDetail';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isAuthReady } = useAuth();
  if (!isAuthReady) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
    </div>
  );
  if (!isAdmin) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/upload" element={<UploadPrescription />} />
                  <Route path="/appointment" element={<Appointment />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin" element={
                    <ProtectedAdminRoute>
                      <Admin />
                    </ProtectedAdminRoute>
                  } />
                </Routes>
              </main>
              
              <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                      <span className="font-serif text-xl font-bold text-purple-700 tracking-tight">SK OPTIC</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-gray-500 text-sm text-center md:text-left">
                        &copy; {new Date().getFullYear()} SK OPTIC. Tous droits réservés.
                      </p>
                      <Link to="/admin" className="text-gray-400 hover:text-purple-700 text-sm transition-colors">
                        Espace Admin
                      </Link>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </Router>
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

