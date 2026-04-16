import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { products as initialProducts } from '../data/products';

export const PRODUCT_CATEGORIES = ['Myopie', 'Presbytie', 'Astigmatisme', 'Hypermétropie', 'Solaire', 'Entretien'] as const;
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

const normalizeProduct = (rawProduct: Partial<Product> & { id: string }): Product => {
  const categories = Array.isArray(rawProduct.categories) && rawProduct.categories.length > 0
    ? rawProduct.categories
    : rawProduct.category
      ? [rawProduct.category]
      : [PRODUCT_CATEGORIES[0]];

  const genders = Array.isArray(rawProduct.genders) && rawProduct.genders.length > 0
    ? rawProduct.genders
    : PRODUCT_GENDERS;

  return {
    id: rawProduct.id,
    name: rawProduct.name || '',
    price: Number(rawProduct.price || 0),
    image: rawProduct.image || '',
    description: rawProduct.description || '',
    categories,
    genders,
    category: categories[0]
  };
};

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const seedProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        if (snapshot.empty) {
          for (const product of initialProducts) {
            const { id, ...rest } = product;
            await addDoc(collection(db, 'products'), rest);
          }
        }
      } catch (error) {
        console.error('Error seeding products:', error);
      }
    };
    seedProducts();

    const q = query(collection(db, 'products'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(item => normalizeProduct({
        id: item.id,
        ...(item.data() as Partial<Product>)
      }));
      setProducts(productsData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
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
      const payload = {
        ...updatedProduct,
        category: updatedProduct.categories[0] || PRODUCT_CATEGORIES[0]
      };
      await updateDoc(doc(db, 'products', id), payload);
    } catch (error) {
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
