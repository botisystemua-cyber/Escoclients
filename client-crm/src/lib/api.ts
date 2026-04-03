const API_URL = 'https://script.google.com/macros/s/AKfycby90xsjLFGfKwIAS49hVdj0Pd46SuW_34z8QXhWod-0Pk0k_6OK5u_MleNiBq1a5exx/exec';

async function postApi(action: string, data: Record<string, string | number>) {
  const res = await fetch(API_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...data }),
  });
  const json = await res.json();
  return json;
}

export interface ClientProfile {
  cli_id: string;
  phone: string;
  pib: string;
  email: string;
  client_type?: string;
  vip?: string;
  debt_uah?: number;
  debt_eur?: number;
  debt_chf?: number;
  debt_pln?: number;
  debt_czk?: number;
  trips_count?: number;
  packages_count?: number;
  bookings_count?: number;
  rating_driver?: number;
  rating_manager?: number;
  app_status?: string;
}

export async function registerClient(phone: string, pib: string) {
  const json = await postApi('register', { phone, pib });
  if (!json.ok) throw new Error(json.error || 'Помилка реєстрації');
  return json.data as ClientProfile;
}

export async function loginClient(phone: string) {
  const json = await postApi('login', { phone });
  if (!json.ok) throw new Error(json.error || 'Помилка входу');
  return json.data as ClientProfile;
}

export interface ParcelOrder {
  order_id: string;
  date_created: string;
  direction: string;
  addr_sender: string;
  addr_recipient: string;
  phone_recipient: string;
  weight: string;
  description: string;
  photo: string;
  price: string;
  currency: string;
  pay_status: string;
  pkg_id: string;
  rte_id: string;
  cal_id: string;
  status: string;
  delivery_date: string;
  note_client: string;
  note_manager: string;
}

export async function createOrder(cliId: string, data: Record<string, string>) {
  const json = await postApi('createOrder', { cli_id: cliId, ...data });
  if (!json.ok) throw new Error(json.error || 'Помилка створення замовлення');
  return json.data as { order_id: string };
}

export async function getMyOrders(cliId: string) {
  const json = await postApi('getMyOrders', { cli_id: cliId });
  if (!json.ok) throw new Error(json.error || 'Помилка завантаження замовлень');
  return json.data as ParcelOrder[];
}

export interface BookingOrder {
  booking_id: string;
  date_created: string;
  date_trip: string;
  direction: string;
  city: string;
  addr_from: string;
  addr_to: string;
  seats: string;
  pax_name: string;
  pax_phone: string;
  auto_id: string;
  seat: string;
  price: string;
  currency: string;
  pay_status: string;
  pax_id: string;
  rte_id: string;
  cal_id: string;
  status: string;
  note_client: string;
  note_manager: string;
}

export async function getMyBookings(cliId: string) {
  const json = await postApi('getMyBookings', { cli_id: cliId });
  if (!json.ok) throw new Error(json.error || 'Помилка завантаження бронювань');
  return json.data as BookingOrder[];
}

export async function fetchFlights() {
  const res = await fetch(`${API_URL}?action=getTrips`);
  const json = await res.json();

  if (!json.ok) {
    throw new Error(json.error || 'Помилка завантаження рейсів');
  }

  return json.data as {
    cal_id: string;
    rte_id: string;
    auto_id: string;
    auto_name: string;
    layout: string;
    date: string;
    direction: string;
    city: string;
    max_seats: number;
    free_seats: number;
    occupied: number;
    free_list: string;
    occupied_list: string;
    paired_id: string;
    status: string;
  }[];
}
