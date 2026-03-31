import { CONFIG } from '../config';
import type { Route, ShippingRoute, Passenger, Package, ShippingItem, RouteItem } from '../types';

async function postApi<T>(body: unknown): Promise<T> {
  // Google Apps Script redirects POST → use redirect:'follow' + no-cors fallback
  const response = await fetch(CONFIG.API_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Невалідна відповідь від сервера: ' + text.substring(0, 200));
  }
}

// ---- Routes ----
export async function fetchRoutes(): Promise<{ routes: Route[]; shipping: ShippingRoute[] }> {
  const data = await postApi<{
    success: boolean;
    routes?: Route[];
    shipping?: ShippingRoute[];
    error?: string;
  }>({ action: 'getAvailableRoutes' });

  if (!data.success) throw new Error(data.error || 'Помилка завантаження маршрутів');
  return { routes: data.routes || [], shipping: data.shipping || [] };
}

// ---- Route Items (passengers + packages from one sheet) ----
export async function fetchRouteItems(sheetName: string): Promise<{ passengers: Passenger[]; packages: Package[] }> {
  const data = await postApi<{
    success: boolean;
    passengers?: Passenger[];
    packages?: Package[];
    error?: string;
  }>({ action: 'getRouteItems', payload: { sheetName } });

  if (!data.success) throw new Error(data.error || 'Помилка завантаження');
  return { passengers: data.passengers || [], packages: data.packages || [] };
}

// ---- Shipping (read-only) ----
export async function fetchShippingItems(sheetName: string): Promise<ShippingItem[]> {
  const data = await postApi<{
    success: boolean;
    items?: ShippingItem[];
    error?: string;
  }>({ action: 'getShippingItems', payload: { sheetName } });

  if (!data.success) throw new Error(data.error || 'Помилка завантаження');
  return data.items || [];
}

// ---- Status Update ----
export async function updateItemStatus(
  driverName: string,
  routeName: string,
  item: RouteItem,
  status: string,
  cancelReason = ''
) {
  return postApi({
    action: 'updateDriverStatus',
    driverId: driverName,
    routeName,
    itemId: item.itemId,
    itemType: item.type,
    phone: 'phone' in item ? item.phone : ('recipientPhone' in item ? item.recipientPhone : ''),
    status,
    cancelReason,
  });
}
