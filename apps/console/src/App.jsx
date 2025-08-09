import React, { useEffect, useState } from 'react'
import { CreditCard, Globe2, Database, ShieldCheck } from 'lucide-react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const currency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v/100);

export default function App(){
  const [wallet, setWallet] = useState({ balance_cents: 0, currency: 'USD' });
  const [plans, setPlans] = useState([]);
  const [location, setLocation] = useState('SG');
  const [slug, setSlug] = useState('');
  const [days, setDays] = useState(7);
  const [amount, setAmount] = useState(50);

  useEffect(()=>{ fetch(API+'/v1/wallet').then(r=>r.json()).then(setWallet) },[])
  useEffect(()=>{ fetch(`${API}/v1/pricing?location=${location}`).then(r=>r.json()).then(d=>setPlans(d.plans||[])) },[location])

  async function topup(){
    const r = await fetch(API+'/v1/wallet/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount})})
    const d = await r.json(); if(d.url) window.location = d.url;
  }
  async function createOrder(){
    const r = await fetch(API+'/v1/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,slug,days})})
    const d = await r.json(); if(d.orderNo) alert('Order '+d.orderNo);
  }

  return (<div className='min-h-screen bg-slate-50 p-6'>
    <div className='mx-auto max-w-6xl'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold text-slate-900'>Journey Console</h1>
        <button onClick={()=>window.location.reload()} className='rounded-xl bg-slate-900 text-white px-3 py-2 text-sm'>Refresh</button>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-6'>
        <Stat label='Wallet Balance' value={currency(wallet.balance_cents)} icon={<CreditCard className='h-4 w-4'/>}/>
        <Stat label='Active eSIMs' value='—' icon={<Globe2 className='h-4 w-4'/>}/>
        <Stat label='Data Plans' value={String(plans.length)} icon={<Database className='h-4 w-4'/>}/>
        <Stat label='Status' value='Staging' icon={<ShieldCheck className='h-4 w-4'/>}/>
      </div>

      <div className='grid md:grid-cols-3 gap-4 mt-6'>
        <div className='rounded-2xl border bg-white p-5'>
          <p className='text-sm font-semibold'>Top up Wallet</p>
          <p className='text-xs text-slate-600'>Minimum $50 (Stripe test mode)</p>
          <div className='flex gap-2 mt-3'>
            {[50,100,250,500].map(v=>(
              <button key={v} onClick={()=>setAmount(v)} className={'px-3 py-2 rounded-lg border '+(amount===v?'bg-slate-900 text-white':'')}>${v}</button>
            ))}
          </div>
          <button onClick={topup} className='mt-3 rounded-xl bg-teal-600 text-white px-3 py-2 text-sm'>Checkout</button>
        </div>

        <div className='rounded-2xl border bg-white p-5'>
          <p className='text-sm font-semibold'>Create eSIM</p>
          <div className='mt-3 space-y-2 text-sm'>
            <input className='w-full border rounded-lg px-3 py-2' placeholder='Location (e.g., SG)' value={location} onChange={e=>setLocation(e.target.value.toUpperCase())}/>
            <input className='w-full border rounded-lg px-3 py-2' placeholder='Plan slug (from list below)' value={slug} onChange={e=>setSlug(e.target.value)}/>
            <input className='w-full border rounded-lg px-3 py-2' type='number' min='1' placeholder='Days' value={days} onChange={e=>setDays(Number(e.target.value))}/>
            <button onClick={createOrder} className='rounded-xl bg-teal-600 text-white px-3 py-2 text-sm'>Create Order</button>
          </div>
        </div>

        <div className='rounded-2xl border bg-white p-5'>
          <p className='text-sm font-semibold'>Networks</p>
          <p className='text-xs text-slate-600'>MNOs and 5G availability (per country)</p>
          <a className='text-teal-700 underline text-sm mt-3 inline-block' href={`${API}/v1/networks?location=${location}`} target='_blank'>Open {location} operators JSON</a>
        </div>
      </div>

      <div className='rounded-2xl border bg-white p-5 mt-6'>
        <p className='text-sm font-semibold'>Plans for {location}</p>
        <div className='overflow-auto mt-3'>
          <table className='min-w-full text-sm'>
            <thead><tr className='text-left text-slate-500'>
              <th className='px-2 py-2'>Name</th><th className='px-2 py-2'>Slug</th><th className='px-2 py-2'>Speed</th><th className='px-2 py-2'>Wholesale (raw)</th>
            </tr></thead>
            <tbody>
              {plans.map((p,i)=>(<tr className='border-t' key={i}>
                <td className='px-2 py-2'>{p.name}</td>
                <td className='px-2 py-2'>{p.slug}</td>
                <td className='px-2 py-2'>{p.speed}</td>
                <td className='px-2 py-2'>{p.price_cents_supplier}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>)
}

function Stat({label, value, icon}){
  return <div className='rounded-2xl border bg-white p-5 shadow-sm'>
    <div className='flex items-center justify-between'>
      <p className='text-sm text-slate-500'>{label}</p>
      <div className='p-2 rounded-full bg-teal-50 text-teal-600'>{icon}</div>
    </div>
    <p className='mt-3 text-2xl font-semibold text-slate-900'>{value}</p>
  </div>
}
