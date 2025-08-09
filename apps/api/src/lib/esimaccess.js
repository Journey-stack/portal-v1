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

export async function createOrder({ locationCode, slug, periodNum = 7, qty = 1 } = {}) {
  const body = { locationCode, packageCode: slug, periodNum, quantity: qty };
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
