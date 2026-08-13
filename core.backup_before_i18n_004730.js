/* ============================================================
   MikroTik Config Generator — core.js
   Чисті утиліти: валідація, екранування, мережева арифметика
   Підключається і в index.html і в test.html
   ============================================================ */
'use strict';

/* --- Рядкові утиліти --- */
function q(value) {
  return String(value == null ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/\$/g, '\\$')
    .replace(/"/g, '\\"')
    .replace(/%/g, '\\%')
    .replace(/\r/g, '')
    .replace(/\n/g, '');
}

function sip(value) {
  return String(value == null ? '' : value).trim().split(/\s+/)[0];
}

function lineValue(value, fallback) {
  var result = String(value == null ? '' : value).trim();
  return result || fallback;
}

function rosSafeName(value, fallback) {
  var name = String(value == null ? '' : value).trim();
  return /^[a-zA-Z0-9_\-]+$/.test(name) ? name : (fallback || 'interface1');
}

/* --- Валідація --- */
function isIPv4(value) {
  var octets = String(value || '').trim().split('.');
  return octets.length === 4 && octets.every(function(o) {
    return /^\d+$/.test(o) && Number(o) >= 0 && Number(o) <= 255;
  });
}

function isCIDR(value) {
  var parts = String(value || '').trim().split('/');
  return parts.length === 2 &&
    isIPv4(parts[0]) &&
    /^\d+$/.test(parts[1]) &&
    Number(parts[1]) >= 0 &&
    Number(parts[1]) <= 32;
}

function isPort(value) {
  return /^\d+$/.test(String(value).trim()) &&
    Number(value) >= 1 &&
    Number(value) <= 65535;
}

function isMac(value) {
  return /^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$/.test(
    String(value || '').trim()
  );
}

function isDhcpRange(value) {
  var parts = String(value || '').trim().split('-');
  return parts.length === 2 && isIPv4(parts[0]) && isIPv4(parts[1]);
}

function dhcpRangeNetwork(value) {
  var parts = String(value || '').trim().split('-');
  if (parts.length !== 2) return false;
  var a = parts[0].split('.'), b = parts[1].split('.');
  return a[0]===b[0] && a[1]===b[1] && a[2]===b[2];
}

/* --- Мережева арифметика --- */
function calcNet(cidr) {
  var parts = String(cidr || '').trim().split('/');
  var ip = sip(parts[0]);
  var prefix = parseInt(parts[1] || '24', 10);

  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32 || !isIPv4(ip)) {
    return ip + '/' + (Number.isInteger(prefix) ? prefix : 24);
  }

  var octets = ip.split('.').map(Number);
  var mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  var ipInt = ((octets[0] << 24) | (octets[1] << 16) |
               (octets[2] << 8)  |  octets[3]) >>> 0;
  var netInt = (ipInt & mask) >>> 0;

  return [
    (netInt >>> 24) & 255,
    (netInt >>> 16) & 255,
    (netInt >>> 8)  & 255,
     netInt         & 255
  ].join('.') + '/' + prefix;
}
