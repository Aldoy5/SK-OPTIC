import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Promotion, usePromotions } from './PromotionContext';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  categories: string[];
  genders: string[];
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  subtotal: number;
  discount: number;
  discountPercentage: number;
  appliedPromotion: Promotion | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { activePromotions } = usePromotions();

  const addToCart = (product: Product, quantity = 1) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + safeQuantity } : item
        );
      }
      return [...prev, { ...product, quantity: safeQuantity }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    setItems(prev => prev.map(item => item.id === productId ? { ...item, quantity: safeQuantity } : item));
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const appliedPromotion = useMemo(() => {
    const eligiblePromotions = activePromotions.filter((promotion) => totalItems >= promotion.minQuantity);
    if (eligiblePromotions.length === 0) {
      return null;
    }

    return eligiblePromotions.reduce<Promotion | null>((best, current) => {
      const currentDiscount = current.type === 'percentage'
        ? subtotal * (current.value / 100)
        : current.value;
      const bestDiscount = !best
        ? 0
        : best.type === 'percentage'
          ? subtotal * (best.value / 100)
          : best.value;

      return currentDiscount > bestDiscount ? current : best;
    }, null);
  }, [activePromotions, subtotal, totalItems]);

  const rawDiscount = appliedPromotion
    ? appliedPromotion.type === 'percentage'
      ? subtotal * (appliedPromotion.value / 100)
      : appliedPromotion.value
    : 0;

  const discount = Math.min(subtotal, Math.round(rawDiscount));
  const discountPercentage = subtotal > 0 ? Math.round((discount / subtotal) * 100) : 0;
  const total = subtotal - discount;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
        subtotal,
        discount,
        discountPercentage,
        appliedPromotion
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
