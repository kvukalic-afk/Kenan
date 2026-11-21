/* Lažni Tuya Cloud server za testove: provjerava potpis nezavisno (Node crypto). */
const crypto = require('crypto');
const assert = require('node:assert/strict');
const ID = 'acc123', SECRET = 'tajna456', BRAVA = 'lockABC', SVJETLA = 'switchXYZ';

/** Lažni Tuya Cloud: provjerava potpis nezavisno (Node crypto) i vraća odgovore. */
function lazniTuya(logovi) {
  const stanje = { pozivi: [], svjetlo: false, otkljucano: 0, tokeni: 0, losPotpis: 0 };
  const fetch = (url, o) => {
    const u = new URL(url);
    const putanja = u.pathname + u.search;
    const h = o.headers;
    const body = o.payload || '';
    const token = h.access_token || '';
    const zaPotpis = o.method.toUpperCase() + '\n' + crypto.createHash('sha256').update(body).digest('hex') + '\n\n' + putanja;
    const ocekivan = crypto.createHmac('sha256', SECRET).update(h.client_id + token + h.t + h.nonce + zaPotpis).digest('hex').toUpperCase();
    if (h.sign !== ocekivan || h.client_id !== ID) { stanje.losPotpis++; return { success: false, code: 1004, msg: 'sign invalid' }; }
    stanje.pozivi.push(o.method.toUpperCase() + ' ' + u.pathname);
    if (u.pathname === '/v1.0/token') { stanje.tokeni++; return { success: true, result: { access_token: 'TOK' + stanje.tokeni, expire_time: 7200 } }; }
    if (token !== 'TOK' + stanje.tokeni) return { success: false, code: 1010, msg: 'token invalid' };
    if (u.pathname === `/v1.0/devices/${BRAVA}`) return { success: true, result: { name: 'Ulazna vrata', online: true } };
    if (u.pathname === `/v1.0/devices/${BRAVA}/status`) return { success: true, result: [{ code: 'residual_electricity', value: 78 }] };
    if (u.pathname === `/v1.0/devices/${SVJETLA}`) return { success: true, result: { name: 'Svjetla sala', online: true } };
    if (u.pathname === `/v1.0/devices/${SVJETLA}/status`) return { success: true, result: [{ code: 'switch_1', value: stanje.svjetlo }] };
    if (u.pathname === `/v1.0/devices/${SVJETLA}/commands`) { stanje.svjetlo = JSON.parse(body).commands[0].value; return { success: true, result: true }; }
    if (u.pathname === `/v1.0/devices/${BRAVA}/door-lock/password-ticket`) return { success: true, result: { ticket_id: 'T1', expire_time: 300 } };
    if (u.pathname === `/v1.0/devices/${BRAVA}/door-lock/password-free/open-door`) {
      assert.equal(JSON.parse(body).ticket_id, 'T1'); stanje.otkljucano++; return { success: true, result: true };
    }
    if (u.pathname === `/v1.0/devices/${BRAVA}/door-lock/open-logs`) {
      const st = +u.searchParams.get('start_time'), en = +u.searchParams.get('end_time');
      return { success: true, result: { logs: logovi.filter(l => l.update_time >= st && l.update_time <= en), has_more: false } };
    }
    return { success: false, code: 2001, msg: 'device not found' };
  };
  return { fetch, stanje };
}

module.exports = { lazniTuya, ID, SECRET, BRAVA, SVJETLA };
