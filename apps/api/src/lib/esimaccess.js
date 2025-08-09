import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const BASE = process.env.ESIM_BASE_URL || 'https://api.esimaccess.com';
const ACCESS = process.env.ESIM_ACCESS_CODE;
const SECRET = process.env.ESIM_SECRET_KEY;

function headersFor(bodyObj = {}) {
  const timestamp = Date.now().toString();
  const requestId = uuidv4();
  const rawBody = JSON.stringify(bodyObj || {});
  const toSign = timestamp + requestId + ACCESS + rawBody;
  const signature = crypto.createHmac('sha256', SECRET).update(toSign).digest('hex');
  return {
    'RT-AccessCode': ACCESS,
    'RT-Timestamp': timestamp,
    'RT-RequestID': requestId,
    'RT-Signature': signature,
    'Content-Type': 'application/json'
  };
}

export async function listPackages({ slug } = {}) {
  // Ask supplier for ALL packages; we'll filter by country in our API.
  const body = {
    type: "",            // <- empty string to avoid filtering (not "PACKAGE"/"TOPUP")
    slug: slug || ""
    // locationCode: undefined  // omit on purpose
  };
  const headers = headersFor(body);
  const url = `${BASE}/api/v1/open/package/list`;
  const { data } = await axios.post(url, body, { headers });

  // Normalize to always return an array of packages
  return data?.obj?.packageList || data?.data || data?.list || data?.packages || [];
}

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// helper to fetch one package and its price
async function fetchPackageBySlug(slug) {
  const body = { type: "", slug: slug || "" }; // ask for all, filter by slug
  const headers = headersFor(body);
  const url = `${BASE}/api/v1/open/package/list`;
  const { data } = await axios.post(url, body, { headers });
  const rows = data?.obj?.packageList || data?.data || data?.list || data?.packages || [];
  return rows.find(p => (p.slug || p.packageCode) === slug);
}

export async function createOrder({ slug, packageCode, periodNum, qty = 1 } = {}) {
  const code = packageCode || slug;
  if (!code) throw new Error('Missing package code');

  // get supplier price (their unit is price * 10,000; eg 10000 = $1.00)
  const pkg = await fetchPackageBySlug(code);
  if (!pkg || !pkg.price) throw new Error('Package/price not found');

  const price = Number(pkg.price);
  const count = Number(qty) || 1;
  const amount = price * count;

  const body = {
    transactionId: uuidv4(),
    amount,                               // total
    packageInfoList: [
      Object.assign(
        { packageCode: code, count, price },               // required
        Number(periodNum) > 0 ? { periodNum: Number(periodNum) } : {}
      )
    ]
  };

  const headers = headersFor(body);
  const url = `${BASE}/api/v1/open/esim/order`;
  const { data } = await axios.post(url, body, { headers });
  return data; // expects { success, obj: { orderNo }, ... }
}

export async function queryEsim({ orderNo, iccid } = {}) {
  const body = { orderNo, iccid };
  const headers = headersFor(body);
  const url = `${BASE}/api/v1/open/esim/query`;
  const { data } = await axios.post(url, body, { headers });
  return data;
}
