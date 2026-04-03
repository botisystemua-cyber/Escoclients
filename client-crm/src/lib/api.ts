const API_URL = 'https://script.google.com/macros/s/AKfycbxUexY0xi7T4MeqFEPjktsFeukwsySbX6t78U7LjM7WcuQ6rVdcws5vElm4lMyT9C4Eng/exec';

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

export async function registerClient(phone: string, password: string, pib: string, email = '') {
  const json = await postApi('register', { phone, password, pib, email });
  if (!json.ok) throw new Error(json.error || 'Помилка реєстрації');
  return json.data as ClientProfile;
}

export async function loginClient(phone: string, password: string) {
  const json = await postApi('login', { phone, password });
  if (!json.ok) throw new Error(json.error || 'Помилка входу');
  return json.data as ClientProfile;
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
