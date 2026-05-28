-- Habilitar extensión para UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Inventario de Productos
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 100,
  unit_price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'en_stock',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Ventas
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  client TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Compras / Reposición
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  supplier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Mermas
CREATE TABLE IF NOT EXISTS scrap_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  weight NUMERIC(10,2) NOT NULL, -- peso en kg
  price_per_kg NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  buyer TEXT NOT NULL,
  reason TEXT NOT NULL, -- motivo de merma
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Datos Iniciales de Semilla (Seed Data)
INSERT INTO inventory (sku, name, category, stock, min_stock, unit_price, status)
VALUES 
  ('TEX-COT-01', 'Algodón Pima Premium', 'Telas', 150, 80, 25.50, 'en_stock'),
  ('TEX-LIN-02', 'Lino Rústico Importado', 'Telas', 35, 50, 42.00, 'stock_bajo'),
  ('TEX-POL-03', 'Poliéster Deportivo', 'Telas', 0, 100, 15.00, 'agotado'),
  ('TEX-DEN-04', 'Denim Indigo 12oz', 'Telas', 220, 100, 35.80, 'en_stock'),
  ('TEX-SED-05', 'Seda Natural Satín', 'Telas', 12, 30, 85.00, 'stock_bajo')
ON CONFLICT (sku) DO NOTHING;

-- 5. Tabla de Historial de Alertas
CREATE TABLE IF NOT EXISTS alerts_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'stock_bajo' o 'agotado'
  status TEXT DEFAULT 'pendiente', -- 'pendiente' o 'resuelto'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE alerts_history DISABLE ROW LEVEL SECURITY;
