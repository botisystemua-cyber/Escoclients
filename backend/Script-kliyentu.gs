// =============================================
// Script-kliyentu.gs — Backend для клієнтської апки
// BotiLogistics (перевезення Україна <-> Європа)
// Deploy: Web App → Execute as Me → Access Anyone
// =============================================

var KLIYENTU_ID = '1KW2Vh_E7OxggNB_NOzWmVM8siHzHr_mG8C939YXDC38';
var PASSENGERS_ID = '1lgaCHqWBIa6oFjFWfD8m58sLwbvQjmeje2gx3YAnBCo';
var CONFIG_ID = '1hZ67tuQYukugO_TjNsOS3IjovBR5hWMg-JmGAq5udBE';
var API_URL = 'https://script.google.com/macros/s/AKfycbxUexY0xi7T4MeqFEPjktsFeukwsySbX6t78U7LjM7WcuQ6rVdcws5vElm4lMyT9C4Eng/exec';

// =============================================
// doGet — GET-запити
// =============================================
function doGet(e) {
  var action = (e.parameter.action || 'ping');

  switch (action) {
    case 'ping':
      return respond({ ok: true, msg: 'Client API alive', ts: now() });

    case 'getAppContent':
      return respond(handleGetAppContent());

    case 'getAvailableTrips':
      return respond(handleGetAvailableTrips());

    default:
      return respond({ ok: false, error: 'Unknown GET action: ' + action });
  }
}

// =============================================
// doPost — POST-запити (основний роутер)
// =============================================
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action || '';

    switch (action) {
      // --- Авторизація ---
      case 'register':
        return respond(handleRegister(body));
      case 'login':
        return respond(handleLogin(body));
      case 'changePassword':
        return respond(handleChangePassword(body));

      // --- Профіль ---
      case 'getProfile':
        return respond(handleGetProfile(body));
      case 'updateProfile':
        return respond(handleUpdateProfile(body));

      // --- Бронювання ---
      case 'createBooking':
        return respond(handleCreateBooking(body));
      case 'getMyBookings':
        return respond(handleGetMyBookings(body));
      case 'cancelBooking':
        return respond(handleCancelBooking(body));

      // --- Замовлення ---
      case 'createOrder':
        return respond(handleCreateOrder(body));
      case 'getMyOrders':
        return respond(handleGetMyOrders(body));

      // --- Чат ---
      case 'getMessages':
        return respond(handleGetMessages(body));
      case 'sendMessage':
        return respond(handleSendMessage(body));
      case 'markRead':
        return respond(handleMarkRead(body));

      // --- Відгуки ---
      case 'addReview':
        return respond(handleAddReview(body));

      // --- Сповіщення ---
      case 'getMyNotifications':
        return respond(handleGetMyNotifications(body));

      // --- Контент ---
      case 'getAppContent':
        return respond(handleGetAppContent());

      // --- Рейси ---
      case 'getAvailableTrips':
        return respond(handleGetAvailableTrips());

      default:
        return respond({ ok: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return respond({ ok: false, error: err.message });
  }
}

// =============================================
// АВТОРИЗАЦІЯ
// =============================================

function handleRegister(body) {
  var phone = (body.phone || '').trim();
  var pib = (body.pib || '').trim();

  if (!phone || !pib) {
    return { ok: false, error: 'Телефон та ПІБ обовязкові' };
  }

  var existing = findClientByPhone(phone);
  if (existing) {
    return { ok: false, error: 'Клієнт з таким телефоном вже існує' };
  }

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Клієнти');
  var cliId = genId('CLI');
  var dateNow = now();

  var row = [];
  row[0] = cliId;         // CLI_ID (A)
  row[1] = '';             // Ід_смарт/CRM (B)
  row[2] = dateNow;        // Дата реєстрації (C)
  row[3] = dateNow;        // Остання активність (D)
  row[4] = phone;           // Телефон (E)
  row[5] = '';             // Додатковий телефон (F)
  row[6] = pib;             // Піб (G)
  row[7] = '';              // EMAIL (H)
  row[8] = '';             // Напрям (I)
  row[9] = 'Новий';        // Тип клієнта (J)
  row[10] = '';            // VIP (K)
  row[11] = '';            // Стоп-лист (L)
  row[12] = '';            // Причина стоп-листа (M)
  row[13] = 0;             // К-сть рейсів (N)
  row[14] = 0;             // К-сть посилок (O)
  row[15] = 0;             // К-сть бронювань (P)
  row[16] = '';            // Остання оплата (Q)
  row[17] = 0;             // Борг UAH (R)
  row[18] = 0;             // Борг CHF (S)
  row[19] = 0;             // Борг EUR (T)
  row[20] = 0;             // Борг PLN (U)
  row[21] = 0;             // Борг CZK (V)
  row[22] = 0;             // Рейт. водія (W)
  row[23] = 0;             // Оцінок від водія (X)
  row[24] = 0;             // Сума балів водія (Y)
  row[25] = 0;             // Рейт. менеджера (Z)
  row[26] = 0;             // Оцінок від менеджера (AA)
  row[27] = 0;             // Сума балів менеджера (AB)
  row[28] = 0;             // Внутрішній рейтинг (AC)
  row[29] = 0;             // Рейт. через бот (AD)
  row[30] = 0;             // Оцінок через бот (AE)
  row[31] = 0;             // Сума балів бот (AF)
  row[32] = '';            // Супер (AG)
  row[33] = '';            // Добре (AH)
  row[34] = '';            // Погано (AI)
  row[35] = '';            // Останні 3 коментарі (AJ)
  row[36] = '';            // Останній відгук (AK)
  row[37] = '';            // Дата останнього відгуку (AL)
  row[38] = '';            // PASSWORD_HASH (AM) — не використовується
  row[39] = 'Активний';    // Статус апки (AN)
  row[40] = '';            // Примітка (AO)

  sheet.appendRow(row);

  // --- Записати в Config_crm_v2 ---
  writeClientToConfig(cliId, pib, phone, '', '', dateNow);

  return {
    ok: true,
    data: {
      cli_id: cliId,
      phone: phone,
      pib: pib
    }
  };
}

function handleLogin(body) {
  var phone = (body.phone || '').trim();

  if (!phone) {
    return { ok: false, error: 'Телефон обовязковий' };
  }

  var client = findClientByPhone(phone);
  if (!client) {
    return { ok: false, error: 'Клієнта з таким телефоном не знайдено' };
  }

  // Оновити останню активність
  var dateNow = now();
  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Клієнти');
  sheet.getRange(client.rowNum, 4).setValue(dateNow); // Остання активність (D)

  // Оновити останню активність в Config → Клієнти_доступ
  updateConfigClientActivity(client.row[0], dateNow, body.device || '');

  // Лог входу в Config → Лог доступів
  logAccess(client.row[0], client.row[6], 'Клієнт', 'Вхід в апку', 'KLIYENTU', '', body.device || '', dateNow);

  return {
    ok: true,
    data: buildProfileFromRow(client.row)
  };
}

function handleChangePassword(body) {
  var cliId = (body.cli_id || '').trim();
  var oldPassword = (body.old_password || '').trim();
  var newPassword = (body.new_password || '').trim();

  if (!cliId || !oldPassword || !newPassword) {
    return { ok: false, error: 'cli_id, старий і новий пароль обовязкові' };
  }

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Клієнти');
  var data = getSheetData(sheet);
  var found = null;

  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === cliId) {
      found = { row: data[i], rowNum: i + 2 };
      break;
    }
  }

  if (!found) {
    return { ok: false, error: 'Клієнта не знайдено' };
  }

  if (hashPassword(oldPassword) !== found.row[38]) {
    return { ok: false, error: 'Невірний старий пароль' };
  }

  var newHash = hashPassword(newPassword);
  var dateNow = now();

  sheet.getRange(found.rowNum, 39).setValue(newHash); // AM
  sheet.getRange(found.rowNum, 4).setValue(dateNow); // Остання активність

  // Синхронізувати хеш в Config → Клієнти_доступ
  updateConfigClientHash(cliId, newHash);

  // Лог зміни пароля
  logAccess(cliId, found.row[6], 'Клієнт', 'Зміна пароля', 'KLIYENTU', 'Клієнти', '', dateNow);

  return { ok: true, msg: 'Пароль змінено' };
}

// =============================================
// ПРОФІЛЬ
// =============================================

function handleGetProfile(body) {
  var cliId = (body.cli_id || '').trim();
  if (!cliId) return { ok: false, error: 'cli_id обовязковий' };

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Клієнти');
  var data = getSheetData(sheet);

  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === cliId) {
      return { ok: true, data: buildProfileFromRow(data[i]) };
    }
  }

  return { ok: false, error: 'Клієнта не знайдено' };
}

function handleUpdateProfile(body) {
  var cliId = (body.cli_id || '').trim();
  if (!cliId) return { ok: false, error: 'cli_id обовязковий' };

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Клієнти');
  var data = getSheetData(sheet);

  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === cliId) {
      var rowNum = i + 2;
      if (body.pib) sheet.getRange(rowNum, 7).setValue(body.pib);       // Піб (G)
      if (body.email) sheet.getRange(rowNum, 8).setValue(body.email);   // EMAIL (H)
      if (body.phone) sheet.getRange(rowNum, 5).setValue(body.phone);   // Телефон (E)
      sheet.getRange(rowNum, 4).setValue(now()); // Остання активність (D)
      return { ok: true, msg: 'Профіль оновлено' };
    }
  }

  return { ok: false, error: 'Клієнта не знайдено' };
}

function buildProfileFromRow(row) {
  return {
    cli_id: row[0],
    smart_id: row[1],
    date_registered: row[2],
    last_activity: row[3],
    phone: row[4],
    phone2: row[5],
    pib: row[6],
    email: row[7],
    direction: row[8],
    client_type: row[9],
    vip: row[10],
    stop_list: row[11],
    stop_reason: row[12],
    trips_count: row[13],
    packages_count: row[14],
    bookings_count: row[15],
    last_payment: row[16],
    debt_uah: row[17],
    debt_chf: row[18],
    debt_eur: row[19],
    debt_pln: row[20],
    debt_czk: row[21],
    rating_driver: row[22],
    rating_manager: row[25],
    internal_rating: row[28],
    rating_bot: row[29],
    app_status: row[39]
  };
}

// =============================================
// БРОНЮВАННЯ
// =============================================

function handleCreateBooking(body) {
  var cliId = (body.cli_id || '').trim();
  if (!cliId) return { ok: false, error: 'cli_id обовязковий' };

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Бронювання');
  var bookingId = genId('BK');
  var dateNow = now();

  var row = [];
  row[0] = bookingId;                       // BOOKING_ID (A)
  row[1] = cliId;                            // CLIENT_ID (B)
  row[2] = dateNow;                          // Дата створення (C)
  row[3] = body.date_trip || '';             // Дата поїздки (D)
  row[4] = body.direction || '';             // Напрям (E)
  row[5] = body.city || '';                  // Місто (F)
  row[6] = body.addr_from || '';             // Адреса відправки (G)
  row[7] = body.addr_to || '';               // Адреса прибуття (H)
  row[8] = body.seats || 1;                 // К-сть місць (I)
  row[9] = body.pax_name || '';              // Піб пасажира (J)
  row[10] = body.pax_phone || '';            // Телефон пасажира (K)
  row[11] = body.auto_id || '';              // AUTO_ID (L)
  row[12] = '';                              // Місце (M)
  row[13] = body.price || '';                // Ціна (N)
  row[14] = body.currency || 'UAH';         // Валюта (O)
  row[15] = 'Не оплачено';                  // Статус оплати (P)
  row[16] = '';                              // PAX_ID (Q)
  row[17] = body.rte_id || '';               // RTE_ID (R)
  row[18] = body.cal_id || '';               // CAL_ID (S)
  row[19] = 'Очікує підтвердження';         // Статус бронювання (T)
  row[20] = body.note || '';                 // Примітка клієнта (U)
  row[21] = '';                              // Примітка менеджера (V)

  sheet.appendRow(row);

  // Оновити к-сть бронювань в Клієнти
  updateClientCounter(cliId, 15); // К-сть бронювань (P, col 16)

  return { ok: true, data: { booking_id: bookingId } };
}

function handleGetMyBookings(body) {
  var cliId = (body.cli_id || '').trim();
  if (!cliId) return { ok: false, error: 'cli_id обовязковий' };

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Бронювання');
  var data = getSheetData(sheet);
  var bookings = [];

  for (var i = 0; i < data.length; i++) {
    if (data[i][1] === cliId) {
      bookings.push({
        booking_id: data[i][0],
        date_created: data[i][2],
        date_trip: data[i][3],
        direction: data[i][4],
        city: data[i][5],
        addr_from: data[i][6],
        addr_to: data[i][7],
        seats: data[i][8],
        pax_name: data[i][9],
        pax_phone: data[i][10],
        auto_id: data[i][11],
        seat: data[i][12],
        price: data[i][13],
        currency: data[i][14],
        pay_status: data[i][15],
        pax_id: data[i][16],
        rte_id: data[i][17],
        cal_id: data[i][18],
        status: data[i][19],
        note_client: data[i][20],
        note_manager: data[i][21]
      });
    }
  }

  return { ok: true, data: bookings };
}

function handleCancelBooking(body) {
  var cliId = (body.cli_id || '').trim();
  var bookingId = (body.booking_id || '').trim();
  if (!cliId || !bookingId) return { ok: false, error: 'cli_id і booking_id обовязкові' };

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Бронювання');
  var data = getSheetData(sheet);

  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === bookingId && data[i][1] === cliId) {
      var rowNum = i + 2;
      sheet.getRange(rowNum, 20).setValue('Скасовано клієнтом'); // Статус бронювання (T)
      return { ok: true, msg: 'Бронювання скасовано' };
    }
  }

  return { ok: false, error: 'Бронювання не знайдено' };
}

// =============================================
// ЗАМОВЛЕННЯ (посилки)
// =============================================

function handleCreateOrder(body) {
  var cliId = (body.cli_id || '').trim();
  if (!cliId) return { ok: false, error: 'cli_id обовязковий' };

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Замовлення');
  var orderId = genId('ORD');
  var dateNow = now();

  var row = [];
  row[0] = orderId;                          // ORDER_ID (A)
  row[1] = cliId;                            // CLIENT_ID (B)
  row[2] = dateNow;                          // Дата створення (C)
  row[3] = body.direction || '';             // Напрям (D)
  row[4] = body.addr_sender || '';           // Адреса відправника (E)
  row[5] = body.addr_recipient || '';        // Адреса отримувача (F)
  row[6] = body.phone_recipient || '';       // Телефон отримувача (G)
  row[7] = body.weight || '';                // Вага (H)
  row[8] = body.description || '';           // Опис (I)
  row[9] = body.photo || '';                 // Фото (J)
  row[10] = body.price || '';                // Ціна (K)
  row[11] = body.currency || 'UAH';         // Валюта (L)
  row[12] = 'Не оплачено';                  // Статус оплати (M)
  row[13] = '';                              // PKG_ID (N)
  row[14] = '';                              // RTE_ID (O)
  row[15] = '';                              // CAL_ID (P)
  row[16] = 'Нове';                          // Статус посилки (Q)
  row[17] = '';                              // Дата доставки (R)
  row[18] = body.note || '';                 // Примітка клієнта (S)
  row[19] = '';                              // Примітка менеджера (T)

  sheet.appendRow(row);

  // Оновити к-сть посилок в Клієнти
  updateClientCounter(cliId, 14); // К-сть посилок (O, col 15)

  return { ok: true, data: { order_id: orderId } };
}

function handleGetMyOrders(body) {
  var cliId = (body.cli_id || '').trim();
  if (!cliId) return { ok: false, error: 'cli_id обовязковий' };

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Замовлення');
  var data = getSheetData(sheet);
  var orders = [];

  for (var i = 0; i < data.length; i++) {
    if (data[i][1] === cliId) {
      orders.push({
        order_id: data[i][0],
        date_created: data[i][2],
        direction: data[i][3],
        addr_sender: data[i][4],
        addr_recipient: data[i][5],
        phone_recipient: data[i][6],
        weight: data[i][7],
        description: data[i][8],
        photo: data[i][9],
        price: data[i][10],
        currency: data[i][11],
        pay_status: data[i][12],
        pkg_id: data[i][13],
        rte_id: data[i][14],
        cal_id: data[i][15],
        status: data[i][16],
        delivery_date: data[i][17],
        note_client: data[i][18],
        note_manager: data[i][19]
      });
    }
  }

  return { ok: true, data: orders };
}

// =============================================
// ЧАТ
// =============================================

function handleGetMessages(body) {
  var cliId = (body.cli_id || '').trim();
  if (!cliId) return { ok: false, error: 'cli_id обовязковий' };

  var offset = parseInt(body.offset) || 0;
  var limit = parseInt(body.limit) || 50;

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Чат');
  var data = getSheetData(sheet);
  var messages = [];

  for (var i = 0; i < data.length; i++) {
    if (data[i][1] === cliId) {
      messages.push({
        message_id: data[i][0],
        datetime: data[i][2],
        role: data[i][3],
        sender_name: data[i][4],
        text: data[i][5],
        read: data[i][6],
        booking_id: data[i][7],
        order_id: data[i][8]
      });
    }
  }

  // Сортувати за датою (найновіші останні)
  messages.sort(function(a, b) {
    return new Date(a.datetime) - new Date(b.datetime);
  });

  // Пагінація
  var sliced = messages.slice(offset, offset + limit);

  return { ok: true, data: sliced, total: messages.length };
}

function handleSendMessage(body) {
  var cliId = (body.cli_id || '').trim();
  var text = (body.text || '').trim();
  if (!cliId || !text) return { ok: false, error: 'cli_id і текст обовязкові' };

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Чат');
  var msgId = genId('MSG');
  var dateNow = now();

  var row = [];
  row[0] = msgId;                        // MESSAGE_ID (A)
  row[1] = cliId;                        // CLIENT_ID (B)
  row[2] = dateNow;                      // Дата і час (C)
  row[3] = 'client';                     // Роль відправника (D)
  row[4] = '';                           // Ім'я відправника (E) — заповнюється автоматично
  row[5] = text;                         // Текст повідомлення (F)
  row[6] = '';                           // Прочитано (G)
  row[7] = body.booking_id || '';        // BOOKING_ID (H)
  row[8] = body.order_id || '';          // ORDER_ID (I)

  // Додати ім'я відправника з профілю
  var client = findClientById(cliId);
  if (client) {
    row[4] = client.row[6]; // Піб
  }

  sheet.appendRow(row);

  return { ok: true, data: { message_id: msgId } };
}

function handleMarkRead(body) {
  var cliId = (body.cli_id || '').trim();
  if (!cliId) return { ok: false, error: 'cli_id обовязковий' };

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Чат');
  var data = getSheetData(sheet);
  var count = 0;

  for (var i = 0; i < data.length; i++) {
    // Позначити прочитаними тільки повідомлення ВІД менеджера
    if (data[i][1] === cliId && data[i][3] !== 'client' && data[i][6] !== 'Так') {
      sheet.getRange(i + 2, 7).setValue('Так'); // Прочитано (G)
      count++;
    }
  }

  return { ok: true, msg: 'Прочитано: ' + count };
}

// =============================================
// ВІДГУКИ
// =============================================

function handleAddReview(body) {
  var cliId = (body.cli_id || '').trim();
  if (!cliId) return { ok: false, error: 'cli_id обовязковий' };

  var client = findClientById(cliId);
  if (!client) return { ok: false, error: 'Клієнта не знайдено' };

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Відгуки клієнтів');
  var reviewId = genId('REV');
  var dateNow = now();

  var row = [];
  row[0] = reviewId;                        // REVIEW_ID (A)
  row[1] = dateNow;                         // Дата відгуку (B)
  row[2] = 'Новий';                         // Статус відгуку (C)
  row[3] = body.rte_id || '';               // RTE_ID (D)
  row[4] = body.pax_id || '';               // PAX_ID (E)
  row[5] = body.pkg_id || '';               // PKG_ID (F)
  row[6] = body.date_trip || '';            // Дата рейсу (G)
  row[7] = body.direction || '';            // Напрям (H)
  row[8] = body.auto_num || '';             // Номер авто (I)
  row[9] = body.driver || '';               // Водій (J)
  row[10] = cliId;                          // CLIENT_ID (K)
  row[11] = client.row[1];                  // Ід_смарт/CRM (L)
  row[12] = client.row[4];                  // Телефон клієнта (M)
  row[13] = client.row[6];                  // Піб клієнта (N)
  row[14] = body.record_type || 'Відгук';  // Тип запису (O)
  row[15] = body.driver_rating || '';       // Оцінка водія (P)
  row[16] = body.driver_score || '';        // Бал водія (Q)
  row[17] = body.driver_comment || '';      // Коментар про водія (R)
  row[18] = body.manager_rating || '';      // Оцінка менеджера (S)
  row[19] = body.manager_score || '';       // Бал менеджера (T)
  row[20] = body.manager_comment || '';     // Коментар про менеджера (U)
  row[21] = body.general_review || '';      // Загальний відгук (V)
  row[22] = '';                             // Опрацьовано (W)
  row[23] = '';                             // Хто опрацював (X)
  row[24] = '';                             // Дата опрацювання (Y)
  row[25] = '';                             // Результат (Z)

  sheet.appendRow(row);

  return { ok: true, data: { review_id: reviewId } };
}

// =============================================
// СПОВІЩЕННЯ
// =============================================

function handleGetMyNotifications(body) {
  var cliId = (body.cli_id || '').trim();
  if (!cliId) return { ok: false, error: 'cli_id обовязковий' };

  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Сповіщення');
  var data = getSheetData(sheet);
  var notifications = [];

  for (var i = 0; i < data.length; i++) {
    if (data[i][7] === cliId) { // CLIENT_ID (H)
      notifications.push({
        notif_id: data[i][0],
        type: data[i][1],
        event: data[i][2],
        channel: data[i][3],
        template: data[i][4],
        active: data[i][5],
        log_id: data[i][6],
        phone: data[i][8],
        ref_id: data[i][9],
        sent: data[i][10],
        send_status: data[i][11],
        sent_text: data[i][12],
        sent_by: data[i][13],
        sent_date: data[i][14]
      });
    }
  }

  return { ok: true, data: notifications };
}

// =============================================
// КОНТЕНТ АПКИ
// =============================================

function handleGetAppContent() {
  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Контент апки');
  var data = getSheetData(sheet);
  var content = [];

  for (var i = 0; i < data.length; i++) {
    if (data[i][5] === 'Так' || data[i][5] === 'TRUE' || data[i][5] === true) { // Активний (F)
      content.push({
        content_id: data[i][0],
        type: data[i][1],
        name: data[i][2],
        lang: data[i][3],
        value: data[i][4]
      });
    }
  }

  return { ok: true, data: content };
}

// =============================================
// РЕЙСИ (з PASSENGERS таблиці)
// =============================================

function handleGetAvailableTrips() {
  var ss = SpreadsheetApp.openById(PASSENGERS_ID);
  var calSheet = ss.getSheetByName('Календар');
  if (!calSheet) return { ok: false, error: 'Аркуш Календар не знайдено' };

  var data = getSheetData(calSheet);
  var trips = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var freeSeats = parseInt(row[10]) || 0; // Вільні місця
    if (freeSeats <= 0) continue;

    trips.push({
      cal_id: row[0],
      rte_id: row[1],
      auto_id: row[2],
      auto_name: row[3],
      layout: row[4],
      date: row[5],
      direction: row[6],
      city: row[7],
      max_seats: parseInt(row[8]) || 0,
      free_seats: freeSeats,
      occupied: parseInt(row[9]) || 0,
      free_list: row[11] || '',
      occupied_list: row[12] || '',
      paired_id: row[13] || '',
      status: row[14] || ''
    });
  }

  return { ok: true, data: trips };
}

// =============================================
// CONFIG_CRM_V2 — запис доступів
// =============================================

/**
 * При реєстрації: записати в Клієнти_доступ + Паролі + Лог доступів
 */
function writeClientToConfig(cliId, pib, phone, email, hash, dateNow) {
  var cfgSs = SpreadsheetApp.openById(CONFIG_ID);

  // 1. Клієнти_доступ (14 колонок)
  var accessSheet = cfgSs.getSheetByName('Клієнти_доступ');
  var accessId = genId('ACC');
  accessSheet.appendRow([
    accessId,        // ACCESS_ID (A)
    cliId,           // CLI_ID (B)
    pib,             // Піб (C)
    phone,           // Телефон (D)
    email,           // EMAIL (E)
    phone,           // Логін (F) — телефон як логін
    hash,            // PASSWORD_HASH (G)
    'Активний',      // Статус апки (H)
    dateNow,         // Дата реєстрації (I)
    dateNow,         // Остання активність (J)
    '',              // Пристрій (K)
    '',              // Заблоковано (L)
    '',              // Причина блокування (M)
    ''               // Примітка (N)
  ]);

  // 2. Паролі (15 колонок)
  var pwdSheet = cfgSs.getSheetByName('Паролі');
  var pwdId = genId('PWD');
  pwdSheet.appendRow([
    pwdId,           // PWD_ID (A)
    cliId,           // USER_ID (B)
    pib,             // Піб (C)
    'Клієнт',        // Роль (D)
    phone,           // Телефон (E)
    phone,           // Логін (F)
    '',              // Тимчасовий пароль (G)
    'Встановлено',   // Статус пароля (H)
    '',              // Відправлено СМС (I)
    '',              // Дата відправки (J)
    'Так',           // Змінено клієнтом (K) — сам встановив при реєстрації
    dateNow,         // Дата зміни (L)
    'Система',       // Хто створив (M)
    dateNow,         // Дата створення (N)
    'Реєстрація через апку' // Примітка (O)
  ]);

  // 3. Лог доступів
  logAccess(cliId, pib, 'Клієнт', 'Реєстрація', 'KLIYENTU', 'Клієнти', '', dateNow);
}

/**
 * Оновити останню активність в Config → Клієнти_доступ
 */
function updateConfigClientActivity(cliId, dateNow, device) {
  var cfgSs = SpreadsheetApp.openById(CONFIG_ID);
  var sheet = cfgSs.getSheetByName('Клієнти_доступ');
  var data = getSheetData(sheet);

  for (var i = 0; i < data.length; i++) {
    if (data[i][1] === cliId) { // CLI_ID (B)
      var rowNum = i + 2;
      sheet.getRange(rowNum, 10).setValue(dateNow);  // Остання активність (J)
      if (device) {
        sheet.getRange(rowNum, 11).setValue(device);  // Пристрій (K)
      }
      return;
    }
  }
}

/**
 * Оновити хеш пароля в Config → Клієнти_доступ
 */
function updateConfigClientHash(cliId, newHash) {
  var cfgSs = SpreadsheetApp.openById(CONFIG_ID);
  var sheet = cfgSs.getSheetByName('Клієнти_доступ');
  var data = getSheetData(sheet);

  for (var i = 0; i < data.length; i++) {
    if (data[i][1] === cliId) { // CLI_ID (B)
      sheet.getRange(i + 2, 7).setValue(newHash); // PASSWORD_HASH (G)
      return;
    }
  }
}

/**
 * Записати в Config → Лог доступів
 */
function logAccess(userId, pib, role, action, table, sheetName, device, dateNow) {
  var cfgSs = SpreadsheetApp.openById(CONFIG_ID);
  var logSheet = cfgSs.getSheetByName('Лог доступів');
  var logId = genId('LOG');

  logSheet.appendRow([
    logId,           // LOG_ID (A)
    userId,          // USER_ID (B)
    pib,             // Піб (C)
    role,            // Роль (D)
    action,          // Дія (E)
    table,           // Таблиця (F)
    sheetName,       // Аркуш (G)
    '',              // IP адреса (H) — недоступно в GAS
    device,          // Пристрій (I)
    dateNow,         // Дата і час (J)
    'Успішно',       // Статус (K)
    ''               // Примітка (L)
  ]);
}

// =============================================
// ХЕЛПЕРИ
// =============================================

/**
 * Пошук клієнта по телефону
 */
function findClientByPhone(phone) {
  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Клієнти');
  var data = getSheetData(sheet);

  for (var i = 0; i < data.length; i++) {
    if (data[i][4] === phone) { // Телефон (E)
      return { row: data[i], rowNum: i + 2 };
    }
  }
  return null;
}

/**
 * Пошук клієнта по CLI_ID
 */
function findClientById(cliId) {
  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Клієнти');
  var data = getSheetData(sheet);

  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === cliId) { // CLI_ID (A)
      return { row: data[i], rowNum: i + 2 };
    }
  }
  return null;
}

/**
 * SHA-256 хеш пароля
 */
function hashPassword(pwd) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pwd);
  var hash = '';
  for (var i = 0; i < raw.length; i++) {
    var byte = raw[i];
    if (byte < 0) byte += 256;
    var hex = byte.toString(16);
    if (hex.length === 1) hex = '0' + hex;
    hash += hex;
  }
  return hash;
}

/**
 * Генерація унікального ID: PREFIX-YYYYMMDD-XXXX
 */
function genId(prefix) {
  var d = new Date();
  var yyyy = d.getFullYear();
  var mm = ('0' + (d.getMonth() + 1)).slice(-2);
  var dd = ('0' + d.getDate()).slice(-2);
  var rand = ('0000' + Math.floor(Math.random() * 10000)).slice(-4);
  return prefix + '-' + yyyy + mm + dd + '-' + rand;
}

/**
 * Поточна дата/час у Europe/Kyiv
 */
function now() {
  return Utilities.formatDate(new Date(), 'Europe/Kyiv', 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Отримати дані аркуша (без заголовка)
 */
function getSheetData(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = sheet.getLastColumn();
  return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
}

/**
 * Оновити лічильник в Клієнти (+1)
 * @param {string} cliId - ID клієнта
 * @param {number} colIndex - 0-based індекс колонки
 */
function updateClientCounter(cliId, colIndex) {
  var ss = SpreadsheetApp.openById(KLIYENTU_ID);
  var sheet = ss.getSheetByName('Клієнти');
  var data = getSheetData(sheet);

  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === cliId) {
      var rowNum = i + 2;
      var current = parseInt(data[i][colIndex]) || 0;
      sheet.getRange(rowNum, colIndex + 1).setValue(current + 1);
      return;
    }
  }
}

/**
 * JSON відповідь
 */
function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
