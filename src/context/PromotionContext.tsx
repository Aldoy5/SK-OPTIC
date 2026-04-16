import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
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
const PROMOTIONS_CACHE_KEY = 'sk_optic_promotions_cache_v1';

const normalizePromotion = (id: string, data: Partial<Promotion>): Promotion => ({
  id,
  title: data.title || '',
  description: data.description || '',
  type: data.type === 'fixed' ? 'fixed' : 'percentage',
  value: Number(data.value || 0),
  minQuantity: Math.max(1, Number(data.minQuantity || 1)),
  isActive: Boolean(data.isActive)
});

const getCachedPromotions = (): Promotion[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PROMOTIONS_CACHE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Array<Partial<Promotion> & { id?: string }>;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Partial<Promotion> & { id: string } => typeof item?.id === 'string' && item.id.length > 0)
      .map((item) => normalizePromotion(item.id, item));
  } catch {
    return [];
  }
};

const cachePromotions = (rows: Promotion[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(PROMOTIONS_CACHE_KEY, JSON.stringify(rows));
  } catch {
    // Ignore cache write errors (private mode, quota, etc.)
  }
};

export function PromotionProvider({ children }: { children: React.ReactNode }) {
  const cachedPromotions = useMemo(() => getCachedPromotions(), []);
  const [promotions, setPromotions] = useState<Promotion[]>(cachedPromotions);
  const [isLoading, setIsLoading] = useState(cachedPromotions.length === 0);

  useEffect(() => {
    const q = query(collection(db, 'promotions'), orderBy('minQuantity', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rows = snapshot.docs.map((item) => normalizePromotion(item.id, item.data() as Partial<Promotion>));
      setPromotions(rows);
      cachePromotions(rows);
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
