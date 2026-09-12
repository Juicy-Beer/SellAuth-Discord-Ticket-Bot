const fetch = require('node-fetch');
const BASE_URL = 'https://api.sellauth.com/v1';
const SHOP_ID = process.env.SHOP_ID;
function headers() {
  if (!process.env.SELLAUTH_API_KEY) {
    throw new Error('SELLAUTH_API_KEY is not set in the environment.');
  }
  return {
    Authorization: `Bearer ${process.env.SELLAUTH_API_KEY}`,
    Accept: 'application/json',
  };
}
async function request(pathSuffix) {
  const url = `${BASE_URL}/shops/${SHOP_ID}${pathSuffix}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SellAuth API ${res.status} ${res.statusText} on ${pathSuffix}: ${body.slice(0, 300)}`);
  }
  return res.json();
}
async function post(pathSuffix, data) {
  const url = `${BASE_URL}/shops/${SHOP_ID}${pathSuffix}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SellAuth API ${res.status} ${res.statusText} on ${pathSuffix}: ${body.slice(0, 300)}`);
  }
  return res.json();
}
async function put(pathSuffix, data) {
  const url = `${BASE_URL}/shops/${SHOP_ID}${pathSuffix}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SellAuth API ${res.status} ${res.statusText} on ${pathSuffix}: ${body.slice(0, 300)}`);
  }
  return res.json();
}
async function del(pathSuffix) {
  const url = `${BASE_URL}/shops/${SHOP_ID}${pathSuffix}`;
  const res = await fetch(url, { method: 'DELETE', headers: headers() });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SellAuth API ${res.status} ${res.statusText} on ${pathSuffix}: ${body.slice(0, 300)}`);
  }
  return res.status === 204 ? null : res.json();
}
async function getFeedbackStats() {
  return request('/feedbacks/stats');
}
async function getProducts() {
  return request('/products');
}
async function getAnalytics() {
  return request('/analytics');
}
async function getCoupons() {
  return request('/coupons');
}
async function createCoupon(data) {
  return post('/coupons', data);
}
async function updateCoupon(couponId, data) {
  return put(`/coupons/${couponId}/update`, data);
}
async function deleteCoupon(couponId) {
  return del(`/coupons/${couponId}`);
}
module.exports = {
  getFeedbackStats,
  getProducts,
  getAnalytics,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  SHOP_ID
};
