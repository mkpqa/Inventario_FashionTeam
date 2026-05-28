export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  price: number; // Mapea a unit_price en la base de datos
  min_stock?: number;
  status?: 'en_stock' | 'stock_bajo' | 'agotado';
  created_at?: string;
}

export interface Sale {
  id: string;
  productId: string; // Mapea a product_id en la base de datos
  productName: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total: number;
  client: string;
  date: string; // Mapea a created_at en la base de datos
}

export interface Purchase {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total: number;
  supplier: string;
  date: string;
}

export interface ScrapSale {
  id: string;
  sku: string;
  productName: string;
  weight: number;
  price_per_kg: number;
  total: number;
  buyer: string;
  reason: string;
  date: string;
}

export interface AlertHistory {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  alertType: 'stock_bajo' | 'agotado';
  status: 'pendiente' | 'resuelto';
  date: string;
  resolvedAt: string | null;
}
