import { supabase } from './supabase';
import { Product, Sale, Purchase, ScrapSale, AlertHistory } from '../types';

// Función auxiliar para determinar el estado de stock
const calculateStatus = (stock: number, minStock: number = 50): 'en_stock' | 'stock_bajo' | 'agotado' => {
  if (stock <= 0) return 'agotado';
  if (stock <= minStock) return 'stock_bajo';
  return 'en_stock';
};

// ==========================================
// 1. SERVICIOS DE INVENTARIO (PRODUCTOS)
// ==========================================

export async function getDbProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando inventario:', error.message);
    throw new Error('No se pudo cargar el inventario desde Supabase.');
  }

  // Mapeamos los nombres de columna de BD a TypeScript (unit_price -> price)
  return (data || []).map(p => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    stock: p.stock,
    price: Number(p.unit_price),
    min_stock: p.min_stock,
    status: p.status || calculateStatus(p.stock, p.min_stock),
    created_at: p.created_at
  }));
}

export async function addDbProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const minStock = product.min_stock || 50;
  const status = calculateStatus(product.stock, minStock);

  const { data, error } = await supabase
    .from('inventory')
    .insert([
      {
        sku: product.sku,
        name: product.name,
        category: product.category,
        stock: product.stock,
        min_stock: minStock,
        unit_price: product.price,
        status: status
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error agregando producto:', error.message);
    throw new Error(`Error al agregar el producto: ${error.message}`);
  }

  return {
    id: data.id,
    sku: data.sku,
    name: data.name,
    category: data.category,
    stock: data.stock,
    price: Number(data.unit_price),
    min_stock: data.min_stock,
    status: data.status,
    created_at: data.created_at
  };
}

export async function updateDbProduct(product: Product): Promise<Product> {
  const minStock = product.min_stock || 50;
  const status = calculateStatus(product.stock, minStock);

  const { data, error } = await supabase
    .from('inventory')
    .update({
      sku: product.sku,
      name: product.name,
      category: product.category,
      stock: product.stock,
      min_stock: minStock,
      unit_price: product.price,
      status: status
    })
    .eq('id', product.id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando producto:', error.message);
    throw new Error(`Error al actualizar el producto: ${error.message}`);
  }

  return {
    id: data.id,
    sku: data.sku,
    name: data.name,
    category: data.category,
    stock: data.stock,
    price: Number(data.unit_price),
    min_stock: data.min_stock,
    status: data.status,
    created_at: data.created_at
  };
}

export async function deleteDbProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando producto:', error.message);
    throw new Error('No se pudo eliminar el producto.');
  }
}

// ==========================================
// 2. SERVICIOS DE VENTAS
// ==========================================

export async function getDbSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando ventas:', error.message);
    throw new Error('No se pudo cargar el historial de ventas.');
  }

  return (data || []).map(s => ({
    id: s.id,
    productId: s.product_id,
    productName: s.product_name,
    sku: s.sku,
    quantity: s.quantity,
    unit_price: Number(s.unit_price),
    total: Number(s.total),
    client: s.client,
    date: new Date(s.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })
  }));
}

export async function registerDbSale(sale: Omit<Sale, 'id' | 'date'>): Promise<Sale> {
  // Obtenemos primero el producto para verificar el stock e info
  const { data: product, error: prodError } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', sale.productId)
    .single();

  if (prodError || !product) {
    throw new Error('El producto seleccionado no existe.');
  }

  if (product.stock < sale.quantity) {
    throw new Error(`Stock insuficiente. Solo quedan ${product.stock} unidades de este producto.`);
  }

  // 1. Registramos la venta
  const { data: newSale, error: saleError } = await supabase
    .from('sales')
    .insert([
      {
        product_id: sale.productId,
        product_name: sale.productName,
        sku: sale.sku,
        quantity: sale.quantity,
        unit_price: sale.unit_price,
        total: sale.total,
        client: sale.client
      }
    ])
    .select()
    .single();

  if (saleError) {
    console.error('Error al guardar la venta:', saleError.message);
    throw new Error('No se pudo procesar la venta en la base de datos.');
  }

  // 2. Actualizamos el stock del producto
  const newStock = product.stock - sale.quantity;
  const newStatus = calculateStatus(newStock, product.min_stock);

  const { error: updateError } = await supabase
    .from('inventory')
    .update({
      stock: newStock,
      status: newStatus
    })
    .eq('id', sale.productId);

  if (updateError) {
    console.error('Error actualizando stock tras venta:', updateError.message);
  }

  // 3. Crear alerta si el stock cae por debajo del mínimo y no hay una pendiente
  if (newStatus === 'stock_bajo' || newStatus === 'agotado') {
    const { data: existingAlerts } = await supabase
      .from('alerts_history')
      .select('id')
      .eq('product_id', sale.productId)
      .eq('status', 'pendiente')
      .limit(1);

    if (!existingAlerts || existingAlerts.length === 0) {
      await supabase.from('alerts_history').insert([{
        product_id: sale.productId,
        sku: product.sku,
        product_name: product.name,
        alert_type: newStatus,
        status: 'pendiente'
      }]);
    }
  }

  return {
    id: newSale.id,
    productId: newSale.product_id,
    productName: newSale.product_name,
    sku: newSale.sku,
    quantity: newSale.quantity,
    unit_price: Number(newSale.unit_price),
    total: Number(newSale.total),
    client: newSale.client,
    date: new Date(newSale.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })
  };
}

// ==========================================
// 3. SERVICIOS DE COMPRAS (REPOSICIONES)
// ==========================================

export async function getDbPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando compras:', error.message);
    throw new Error('No se pudo cargar el historial de compras.');
  }

  return (data || []).map(p => ({
    id: p.id,
    productId: p.product_id,
    productName: p.product_name,
    sku: p.sku,
    quantity: p.quantity,
    unit_price: Number(p.unit_price),
    total: Number(p.total),
    supplier: p.supplier,
    date: new Date(p.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })
  }));
}

export async function registerDbPurchase(purchase: Omit<Purchase, 'id' | 'date'>): Promise<Purchase> {
  // 1. Obtener producto para saber stock actual
  const { data: product, error: prodError } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', purchase.productId)
    .single();

  if (prodError || !product) {
    throw new Error('El producto del catálogo no existe en el inventario.');
  }

  // 2. Registrar la compra
  const { data: newPurchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert([
      {
        product_id: purchase.productId,
        product_name: purchase.productName,
        sku: purchase.sku,
        quantity: purchase.quantity,
        unit_price: purchase.unit_price,
        total: purchase.total,
        supplier: purchase.supplier
      }
    ])
    .select()
    .single();

  if (purchaseError) {
    console.error('Error guardando la compra:', purchaseError.message);
    throw new Error('No se pudo guardar la transacción de compra.');
  }

  // 3. Aumentar stock del producto e indicar su nuevo estado
  const newStock = product.stock + purchase.quantity;
  const newStatus = calculateStatus(newStock, product.min_stock);

  const { error: updateError } = await supabase
    .from('inventory')
    .update({
      stock: newStock,
      status: newStatus
    })
    .eq('id', purchase.productId);

  if (updateError) {
    console.error('Error actualizando stock tras compra:', updateError.message);
  }

  // 4. Resolver alertas pendientes de este producto si el stock se recuperó
  if (newStatus === 'en_stock') {
    await supabase.from('alerts_history')
      .update({
        status: 'resuelto',
        resolved_at: new Date().toISOString()
      })
      .eq('product_id', purchase.productId)
      .eq('status', 'pendiente');
  }

  return {
    id: newPurchase.id,
    productId: newPurchase.product_id,
    productName: newPurchase.product_name,
    sku: newPurchase.sku,
    quantity: newPurchase.quantity,
    unit_price: Number(newPurchase.unit_price),
    total: Number(newPurchase.total),
    supplier: newPurchase.supplier,
    date: new Date(newPurchase.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })
  };
}

// ==========================================
// 4. SERVICIOS DE MERMA
// ==========================================

export async function getDbScrapSales(): Promise<ScrapSale[]> {
  const { data, error } = await supabase
    .from('scrap_sales')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando mermas:', error.message);
    throw new Error('No se pudo cargar el historial de mermas.');
  }

  return (data || []).map(s => ({
    id: s.id,
    sku: s.sku,
    productName: s.product_name,
    weight: Number(s.weight),
    price_per_kg: Number(s.price_per_kg),
    total: Number(s.total),
    buyer: s.buyer,
    reason: s.reason,
    date: new Date(s.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })
  }));
}

export async function registerDbScrapSale(scrap: Omit<ScrapSale, 'id' | 'date'>): Promise<ScrapSale> {
  const { data, error } = await supabase
    .from('scrap_sales')
    .insert([
      {
        sku: scrap.sku,
        product_name: scrap.productName,
        weight: scrap.weight,
        price_per_kg: scrap.price_per_kg,
        total: scrap.total,
        buyer: scrap.buyer,
        reason: scrap.reason
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error registrando merma:', error.message);
    throw new Error('No se pudo registrar la merma.');
  }

  return {
    id: data.id,
    sku: data.sku,
    productName: data.product_name,
    weight: Number(data.weight),
    price_per_kg: Number(data.price_per_kg),
    total: Number(data.total),
    buyer: data.buyer,
    reason: data.reason,
    date: new Date(data.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })
  };
}

// ==========================================
// 5. SERVICIOS DE ALERTAS (HISTORIAL)
// ==========================================

export async function getDbAlertsHistory(): Promise<AlertHistory[]> {
  const { data, error } = await supabase
    .from('alerts_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando historial de alertas:', error.message);
    throw new Error('No se pudo cargar el historial de alertas.');
  }

  return (data || []).map(a => ({
    id: a.id,
    productId: a.product_id,
    sku: a.sku,
    productName: a.product_name,
    alertType: a.alert_type,
    status: a.status,
    date: new Date(a.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' }),
    resolvedAt: a.resolved_at ? new Date(a.resolved_at).toLocaleString('es-PE', { timeZone: 'America/Lima' }) : null
  }));
}
