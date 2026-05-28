import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Sale, Purchase, ScrapSale, AlertHistory } from './types';
import * as db from './lib/db';

interface InventoryContextType {
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  scrapSales: ScrapSale[];
  alertsHistory: AlertHistory[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'date'>) => Promise<void>;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'date'>) => Promise<void>;
  addScrapSale: (scrap: Omit<ScrapSale, 'id' | 'date'>) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [scrapSales, setScrapSales] = useState<ScrapSale[]>([]);
  const [alertsHistory, setAlertsHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial de datos de Supabase
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dbProducts, dbSales, dbPurchases, dbScrapSales, dbAlerts] = await Promise.all([
        db.getDbProducts(),
        db.getDbSales(),
        db.getDbPurchases(),
        db.getDbScrapSales(),
        db.getDbAlertsHistory()
      ]);
      setProducts(dbProducts);
      setSales(dbSales);
      setPurchases(dbPurchases);
      setScrapSales(dbScrapSales);
      setAlertsHistory(dbAlerts);
    } catch (err: any) {
      console.error('Error al sincronizar con Supabase:', err);
      setError(err.message || 'Error desconocido al conectar con Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addProduct = async (newProduct: Omit<Product, 'id'>) => {
    try {
      setError(null);
      const savedProduct = await db.addDbProduct(newProduct);
      setProducts(prev => [savedProduct, ...prev]);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
      setError(null);
      const savedProduct = await db.updateDbProduct(updatedProduct);
      setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setError(null);
      await db.deleteDbProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addSale = async (newSale: Omit<Sale, 'id' | 'date'>) => {
    try {
      setError(null);
      const savedSale = await db.registerDbSale(newSale);
      setSales(prev => [savedSale, ...prev]);
      
      // Actualizamos stock localmente de inmediato para coincidir con la venta realizada
      setProducts(prev => prev.map(p => {
        if (p.id === newSale.productId) {
          const newStock = p.stock - newSale.quantity;
          const minStock = p.min_stock || 50;
          return {
            ...p,
            stock: newStock,
            status: newStock <= 0 ? 'agotado' : newStock <= minStock ? 'stock_bajo' : 'en_stock'
          };
        }
        return p;
      }));

      const dbAlerts = await db.getDbAlertsHistory();
      setAlertsHistory(dbAlerts);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addPurchase = async (newPurchase: Omit<Purchase, 'id' | 'date'>) => {
    try {
      setError(null);
      const savedPurchase = await db.registerDbPurchase(newPurchase);
      setPurchases(prev => [savedPurchase, ...prev]);

      // Incrementamos stock localmente de inmediato
      setProducts(prev => prev.map(p => {
        if (p.id === newPurchase.productId) {
          const newStock = p.stock + newPurchase.quantity;
          const minStock = p.min_stock || 50;
          return {
            ...p,
            stock: newStock,
            status: newStock <= 0 ? 'agotado' : newStock <= minStock ? 'stock_bajo' : 'en_stock'
          };
        }
        return p;
      }));

      const dbAlerts = await db.getDbAlertsHistory();
      setAlertsHistory(dbAlerts);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addScrapSale = async (newScrap: Omit<ScrapSale, 'id' | 'date'>) => {
    try {
      setError(null);
      const savedScrap = await db.registerDbScrapSale(newScrap);
      setScrapSales(prev => [savedScrap, ...prev]);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        sales,
        purchases,
        scrapSales,
        alertsHistory,
        loading,
        error,
        refreshData,
        addProduct,
        updateProduct,
        deleteProduct,
        addSale,
        addPurchase,
        addScrapSale
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
