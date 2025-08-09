import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const BASE = process.env.ESIM_BASE_URL || 'https://api.esimaccess.com';
const ACCESS = process.env.ESIM_ACCESS_CODE;
const SECRET = process.env.ESIM_SECRET_KEY;

// Supplier HMAC headers
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

// ----- Catalog
export async function listPackages({ slug } = {}) {
  // Ask for all; filter by slug/location at our API layer
  const body = { type: '', slug: slug || '' };
  const headers = headersFor(body);
  const url = `${BASE}/api/v1/open/package/list`;
  const { data } = await axios.post(url, body, { headers });
  return data?.obj?.packageList || data?.data || data?.list || data?.packages || [];
}

async function fetchPackageBySlug(slug) {
  const rows = await listPackages({ slug });
  return rows.find(p => (p.slug || p.packageCode) === slug);
}

// ----- Orders
export async function createOrder({ slug, packageCode, periodNum, qty = 1 } = {}) {
  const code = packageCode || slug;
  if (!code) throw new Error('Missing package code');

  // Get supplier unit price (their format is used as-is)
  const pkg = await fetchPackageBySlug(code);
  if (!pkg || !pkg.price) throw new Error('Package/price not found');

  const price = Number(pkg.price);
  const count = Number(qty) || 1;
  const amount = price * count;

  const body = {
    transactionId: uuidv4(),
    amount,
    packageInfoList: [
      Object.assign(
        { packageCode: code, count, price },
        Number(periodNum) > 0 ? { periodNum: Number(periodNum) } : {}
      )
    ]
  };

  const headers = headersFor(body);
  const url = `${BASE}/api/v1/open/esim/order`;
  const { data } = await axios.post(url, body, { headers });
  return data;
}

export async function queryEsim({ orderNo, iccid } = {}) {
  const body = { orderNo, iccid };
  const headers = headersFor(body);
  const url = `${BASE}/api/v1/open/esim/query`;
  const { data } = await axios.post(url, body, { headers });
  return data;
}
