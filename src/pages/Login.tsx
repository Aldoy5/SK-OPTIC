import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

export function Login() {
  const { login, isAdmin, user, isAuthReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthReady && isAdmin) {
      navigate('/admin');
    }
  }, [isAuthReady, isAdmin, navigate]);

  const handleLogin = async () => {
    await login();
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-purple-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Accès Administrateur</h2>
          <p className="text-gray-500 mt-2 text-sm text-center">
            Connectez-vous avec votre compte Google pour accéder à la gestion.
          </p>
        </div>
        
        <div className="space-y-6">
          {user && !isAdmin && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600 text-center">
                Accès refusé. Vous n'êtes pas administrateur.
              </p>
            </div>
          )}
          
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-700 transition-colors"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" alt="Google" />
            Se connecter avec Google
          </button>
        </div>
      </div>
    </div>
  );
}
