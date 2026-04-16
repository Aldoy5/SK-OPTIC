import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export type PromotionType = 'percentage' | 'fixed';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: PromotionType;
  value: number;
  minQuantity: number;
  isActive: boolean;
}

interface PromotionContextType {
  promotions: Promotion[];
  activePromotions: Promotion[];
  isLoading: boolean;
  addPromotion: (promotion: Omit<Promotion, 'id'>) => Promise<void>;
  updatePromotion: (id: string, promotion: Omit<Promotion, 'id'>) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
}

const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

const DEFAULT_PROMOTIONS: Omit<Promotion, 'id'>[] = [
  {
    title: 'Offre Duo',
    description: '2 montures achetées = -15% sur le total',
    type: 'percentage',
    value: 15,
    minQuantity: 2,
    isActive: true
  },
  {
    title: 'Offre Trio',
    description: '3 montures achetées = -25% sur le total',
    type: 'percentage',
    value: 25,
    minQuantity: 3,
    isActive: true
  }
];

const normalizePromotion = (id: string, data: Partial<Promotion>): Promotion => ({
  id,
  title: data.title || '',
  description: data.description || '',
  type: data.type === 'fixed' ? 'fixed' : 'percentage',
  value: Number(data.value || 0),
  minQuantity: Math.max(1, Number(data.minQuantity || 1)),
  isActive: Boolean(data.isActive)
});

export function PromotionProvider({ children }: { children: React.ReactNode }) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const seedPromotions = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'promotions'));
        if (snapshot.empty) {
          for (const promotion of DEFAULT_PROMOTIONS) {
            await addDoc(collection(db, 'promotions'), promotion);
          }
        }
      } catch (error) {
        console.error('Error seeding promotions:', error);
      }
    };

    seedPromotions();

    const q = query(collection(db, 'promotions'), orderBy('minQuantity', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rows = snapshot.docs.map((item) => normalizePromotion(item.id, item.data() as Partial<Promotion>));
      setPromotions(rows);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'promotions');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addPromotion = async (promotion: Omit<Promotion, 'id'>) => {
    try {
      await addDoc(collection(db, 'promotions'), promotion);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'promotions');
    }
  };

  const updatePromotion = async (id: string, promotion: Omit<Promotion, 'id'>) => {
    try {
      await updateDoc(doc(db, 'promotions', id), promotion);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `promotions/${id}`);
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'promotions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `promotions/${id}`);
    }
  };

  const activePromotions = useMemo(() => promotions.filter((promotion) => promotion.isActive), [promotions]);

  return (
    <PromotionContext.Provider value={{ promotions, activePromotions, isLoading, addPromotion, updatePromotion, deletePromotion }}>
      {children}
    </PromotionContext.Provider>
  );
}

export function usePromotions() {
  const context = useContext(PromotionContext);
  if (!context) {
    throw new Error('usePromotions must be used within a PromotionProvider');
  }
  return context;
}
