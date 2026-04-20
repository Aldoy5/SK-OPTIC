import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export const PRODUCT_CATEGORIES = ['Lunettes de vue', 'Solaire', 'Lentilles de contact', 'Entretien', 'Accessoires'] as const;
export const PRODUCT_GENDERS = ['Femme', 'Homme', 'Enfant'] as const;

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

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  isLoading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);
const PRODUCTS_CACHE_KEY = 'sk_optic_products_cache_v1';

const PATHOLOGY_MAPPING: Record<string, string> = {
  'Myopie': 'Lunettes de vue',
  'Presbytie': 'Lunettes de vue',
  'Astigmatisme': 'Lunettes de vue',
  'Hypermétropie': 'Lunettes de vue'
};

const normalizeProduct = (rawProduct: Partial<Product> & { id: string }): Product => {
  let categories = Array.isArray(rawProduct.categories) && rawProduct.categories.length > 0
    ? rawProduct.categories
    : rawProduct.category
      ? [rawProduct.category]
      : [PRODUCT_CATEGORIES[0]];

  // Mappe les anciennes catégories (pathologies) vers les nouvelles (types de produits)
  categories = [...new Set(categories.map(cat => PATHOLOGY_MAPPING[cat] || cat))];

  return {
    id: rawProduct.id,
    name: rawProduct.name || '',
    price: Number(rawProduct.price || 0),
    image: rawProduct.image || '',
    description: rawProduct.description || '',
    categories,
    genders: Array.isArray(rawProduct.genders) && rawProduct.genders.length > 0 ? rawProduct.genders : [...PRODUCT_GENDERS],
    category: categories[0]
  };
};

const getCachedProducts = (): Product[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Array<Partial<Product> & { id?: string }>;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Partial<Product> & { id: string } => typeof item?.id === 'string' && item.id.length > 0)
      .map((item) => normalizeProduct(item));
  } catch {
    return [];
  }
};

const cacheProducts = (rows: Product[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(rows));
  } catch {
    // Ignore cache write errors (private mode, quota, etc.)
  }
};

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const cachedProducts = useMemo(() => getCachedProducts(), []);
  const [products, setProducts] = useState<Product[]>(cachedProducts);
  const [isLoading, setIsLoading] = useState(cachedProducts.length === 0);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(item => normalizeProduct({
        id: item.id,
        ...(item.data() as Partial<Product>)
      }));
      setProducts(productsData);
      cacheProducts(productsData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const payload = {
        ...product,
        category: product.categories[0] || PRODUCT_CATEGORIES[0]
      };
      await addDoc(collection(db, 'products'), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const updateProduct = async (id: string, updatedProduct: Omit<Product, 'id'>) => {
    try {
      // Strip 'id' if accidentally included in the payload (e.g. from spreading the full product)
      const { id: _stripId, ...cleanProduct } = updatedProduct as Product;
      const payload = {
        ...cleanProduct,
        category: cleanProduct.categories?.[0] || PRODUCT_CATEGORIES[0]
      };

      // Optimistic UI update – reflect the change immediately
      setProducts(prev =>
        prev.map(p => p.id === id ? normalizeProduct({ id, ...payload }) : p)
      );

      await updateDoc(doc(db, 'products', id), payload);
    } catch (error) {
      // Revert optimistic update on failure – onSnapshot will restore correct state
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, isLoading }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
