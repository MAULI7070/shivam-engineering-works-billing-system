import { useState, useEffect } from 'react'
import axios from 'axios'
import { Trash2, FileText, Plus, RotateCcw, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── FORMULAS ────────────────────────────────────────────────
// GRINDING : Total = (Side1 × Side2) / 645 × Rupees
// SURFACE  : Total = (Side1 × Side2) / 645 × Rupees
// MILLING  : Total = ((S1×S3)/645×Rate) + ((S2×S3)/645×Rate)
// ─────────────────────────────────────────────────────────────
const C = 645

function calcGS(s1, s2, r) {
  return (parseFloat(s1)||0) * (parseFloat(s2)||0) / C * (parseFloat(r)||0)
}
function calcMill(s1, s2, s3, r) {
  const a = parseFloat(s1)||0, b = parseFloat(s2)||0, h = parseFloat(s3)||0
  const rate = parseFloat(r)||0
  const p1 = (a * h) / C * rate
  const p2 = (b * h) / C * rate
  return { p1, p2, total: p1 + p2 }
}

const TABS = [
  { id: 'Grinding', label: 'Grinding',        color: '#003366', bg: '#e8f0fe' },
  { id: 'Milling',  label: 'Milling',         color: '#7B3F00', bg: '#FFF3E0' },
  { id: 'Surface',  label: 'Surface Grinding', color: '#1A6B3C', bg: '#E8F5E9' },
]

export default function Calculator() {
  const [tab,  setTab]  = useState('Milling')
  const [cart, setCart] = useState([])
  const [history, setHistory] = useState([])
  const [histTab, setHistTab] = useState('cart') // 'cart' | 'history'

  // ── Input state for each tab ──────────────────────────────
  const [vals, setVals] = useState({ Grinding: empty(), Milling: emptyM(), Surface: empty() })
  const setV = (field, val) => setVals(p => ({ ...p, [tab]: { ...p[tab], [field]: val } }))
  const v = vals[tab]

  // Load history from DB on mount
  useEffect(() => {
    axios.get('/api/calculations?limit=50')
      .then(r => setHistory(r.data.data || []))
      .catch(() => {})
  }, [])

  // ── Live result ───────────────────────────────────────────
  const liveResult = () => {
    if (tab === 'Milling') {
      if (!v.s1 || !v.s2 || !v.s3 || !v.r) return null
      return calcMill(v.s1, v.s2, v.s3, v.r)
    } else {
      if (!v.s1 || !v.s2 || !v.r) return null
      return { total: calcGS(v.s1, v.s2, v.r) }
    }
  }
  const live = liveResult()

  // ── Calculate & add to cart ───────────────────────────────
  const handleCalc = async () => {
    let item
    if (tab === 'Milling') {
      if (!v.s1 || !v.s2 || !v.s3 || !v.r) return toast.error('Fill all three sides and Rate')
      const { p1, p2, total } = calcMill(v.s1, v.s2, v.s3, v.r)
      item = {
        type: 'Milling',
        description: v.desc || `Milling ${v.s1}×${v.s2}×${v.s3}`,
        side1: parseFloat(v.s1), side2: parseFloat(v.s2), side3: parseFloat(v.s3),
        rupees: parseFloat(v.r), part1: p1, part2: p2, total,
        formula: `(${v.s1}×${v.s3})÷645×${v.r} + (${v.s2}×${v.s3})÷645×${v.r}`,
      }
    } else {
      if (!v.s1 || !v.s2 || !v.r) return toast.error('Fill Length, Breadth and Rate')
      const total = calcGS(v.s1, v.s2, v.r)
      item = {
        type: tab,
        description: v.desc || `${tab} ${v.s1}×${v.s2}${v.s3 ? '×'+v.s3 : ''}`,
        side1: parseFloat(v.s1), side2: parseFloat(v.s2),
        side3: v.s3 ? parseFloat(v.s3) : 0,
        rupees: parseFloat(v.r), part1: 0, part2: 0, total,
        formula: `(${v.s1}×${v.s2})÷645×${v.r}`,
      }
    }

    // Save to DB
    try {
      const res = await axios.post('/api/calculations', item)
      const saved = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data
      item.id = saved?.id || Date.now()
      setHistory(prev => [{ ...item, created_at: new Date().toISOString() }, ...prev])
    } catch {
      item.id = Date.now()
    }

    setCart(prev => [...prev, { ...item, cartId: Date.now() + Math.random() }])
    setVals(p => ({ ...p, [tab]: tab === 'Milling' ? emptyM() : empty() }))
    toast.success('Added to cart!')
  }

  const removeFromCart = id => setCart(prev => prev.filter(c => c.cartId !== id))

  // ── THE CRITICAL FIX: use window.location.href to force full page re-mount ──
  const addToInvoice = () => {
    if (cart.length === 0) return toast.error('Cart is empty')
    const invoiceItems = cart.map((c, idx) => {
      const taxable = parseFloat(c.total.toFixed(2))
      const cgst    = parseFloat((taxable * 0.09).toFixed(2))
      const sgst    = parseFloat((taxable * 0.09).toFixed(2))
      // Guarantee product_description is ALWAYS a non-empty string
      // JSON.stringify drops undefined — so we must never let it be undefined
      const desc = (c.description && String(c.description).trim())
        || (c.type ? `${c.type} work` : `Item ${idx + 1}`)
      return {
        product_description: desc,
        hsn_code: '',
        qty: 1,
        rate: taxable,
        amount: taxable,
        discount: 0,
        taxable_value: taxable,
        cgst_rate: 9,  cgst_amount: cgst,
        sgst_rate: 9,  sgst_amount: sgst,
        igst_rate: 0,  igst_amount: 0,
        total: parseFloat((taxable + cgst + sgst).toFixed(2)),
      }
    })
    sessionStorage.setItem('calc_prefill_items', JSON.stringify(invoiceItems.map((item, idx) => ({
      ...item,
      item_title: cart[idx]?.type || '',   // "Grinding" | "Milling" | "Surface"
    }))))
    // HARD redirect (not React navigate) so CreateInvoice always re-mounts fresh
    window.location.href = '/invoices/new?from=calculator'
  }

  const cartTotal = cart.reduce((s, c) => s + c.total, 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-govt-navy mb-1">
        Grinding, Milling &amp; Surface Calculator
      </h1>
      <p className="text-gray-500 text-sm mb-6">Calculate work amounts and add directly to an invoice</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Calculator Panel ───────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Tab selector */}
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                    tab === t.id ? 'text-white' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                  style={tab === t.id ? { backgroundColor: t.color } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Formula badge */}
            <div className="px-4 py-2 text-xs font-mono text-gray-500 bg-gray-50 border-b">
              {tab === 'Milling'
                ? '((L×H)÷645×Rate) + ((B×H)÷645×Rate)'
              //   <div>
              //     <label> class</label>
              //     <div>

              //  <label class="govt-label">Rate (per unit)</label> 
              //  <input type="number" step="0.01" min="0" class="govt-input" placeholder="0" value=""> 

              //   </div>
                

            
                : '(L×B)÷645×Rate'}
            </div>

            {/* Inputs */}
            <div className="p-4 space-y-3">
              {/* Description */}
              <div>
                <label className="govt-label">Description</label>
                <input
                  className="govt-input"
                  placeholder={`e.g. ${tab} top face`}
                  value={v.desc}
                  onChange={e => setV('desc', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <CalcInput label="Side 1 — Length" value={v.s1} onChange={val => setV('s1', val)} />
                <CalcInput label="Side 2 — Breadth" value={v.s2} onChange={val => setV('s2', val)} />
                <CalcInput label="Side 3 — Height" value={v.s3} onChange={val => setV('s3', val)}
                  required={tab === 'Milling'} optional={tab !== 'Milling'} />
              </div>

              <div className="max-w-xs">
                <CalcInput label="Rate (₹ per unit)" value={v.r} onChange={val => setV('r', val)} />
              </div>
            </div>

            {/* ── Calculator Display ───────────────────── */}
            <div className="mx-4 mb-4 rounded-lg overflow-hidden border-2"
              style={{ borderColor: TABS.find(t=>t.id===tab)?.color || '#003366' }}>
              <div className="px-4 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: TABS.find(t=>t.id===tab)?.color || '#003366' }}>
                Result
              </div>
              <div className="p-3 bg-white">
                {live ? (
                  <>
                    {tab === 'Milling' && (
                      <div className="text-xs text-gray-500 font-mono space-y-0.5 mb-2">
                        <div>Part 1 = ({v.s1}×{v.s3})÷645×{v.r} = <b>₹{live.p1.toFixed(2)}</b></div>
                        <div>Part 2 = ({v.s2}×{v.s3})÷645×{v.r} = <b>₹{live.p2.toFixed(2)}</b></div>
                      </div>
                    )}
                    {tab !== 'Milling' && (
                      <div className="text-xs text-gray-500 font-mono mb-1">
                        = ({v.s1} × {v.s2}) ÷ 645 × {v.r}
                      </div>
                    )}
                    <div className="text-3xl font-bold" style={{ color: TABS.find(t=>t.id===tab)?.color }}>
                      ₹{live.total.toFixed(2)}
                    </div>
                  </>
                ) : (
                  <div className="text-2xl text-gray-300 font-mono">₹ 0.00</div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="px-4 pb-4 flex gap-3">
              <button
                onClick={handleCalc}
                className="flex items-center gap-2 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow transition-opacity hover:opacity-90"
                style={{ backgroundColor: TABS.find(t=>t.id===tab)?.color || '#003366' }}
              >
                <Plus size={16} /> Add to Cart
              </button>
              <button
                onClick={() => setVals(p => ({ ...p, [tab]: tab === 'Milling' ? emptyM() : empty() }))}
                className="flex items-center gap-2 border border-gray-300 text-gray-500 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50"
              >
                <RotateCcw size={15} /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Cart ──────────────────────────────── */}
        <div className="space-y-4">
          {/* Cart / History toggle */}
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setHistTab('cart')}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${histTab === 'cart' ? 'bg-govt-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Cart ({cart.length})
              </button>
              <button
                onClick={() => setHistTab('history')}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${histTab === 'history' ? 'bg-govt-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                History
              </button>
            </div>

            {/* Cart panel */}
            {histTab === 'cart' && (
              <div>
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm px-4">
                    No items yet.<br/>Calculate values and click "Add to Cart".
                  </div>
                ) : (
                  <div>
                    {cart.map((c, i) => (
                      <div key={c.cartId} className="px-4 py-3 border-b border-gray-100 flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                              c.type==='Grinding'?'bg-blue-100 text-blue-700':
                              c.type==='Milling'?'bg-amber-100 text-amber-700':
                              'bg-green-100 text-green-700'}`}>
                              {c.type}
                            </span>
                            <span className="text-xs text-gray-400">#{i+1}</span>
                          </div>
                          {/* Editable description — this becomes product_description in invoice */}
                          <input
                            className="w-full text-sm font-medium text-gray-800 border border-gray-200 rounded px-2 py-1 mb-1 focus:outline-none focus:border-govt-blue bg-white"
                            value={c.description || ''}
                            placeholder="Enter description for invoice..."
                            onChange={e => setCart(prev => prev.map(item =>
                              item.cartId === c.cartId
                                ? { ...item, description: e.target.value }
                                : item
                            ))}
                          />
                          <div className="text-xs text-gray-400 font-mono">{c.formula}</div>
                          <div className="text-base font-bold text-govt-green mt-0.5">₹{c.total.toFixed(2)}</div>
                        </div>
                        <button onClick={() => removeFromCart(c.cartId)} className="text-red-400 hover:text-red-600 mt-1">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}

                    {/* Cart total + send to invoice */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex justify-between text-sm font-bold text-govt-navy mb-3">
                        <span>Total ({cart.length} items)</span>
                        <span>₹{cartTotal.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={addToInvoice}
                        className="w-full flex items-center justify-center gap-2 bg-govt-navy text-white py-2.5 rounded-lg font-bold text-sm hover:bg-govt-blue transition-colors shadow"
                      >
                        <FileText size={16} /> Add All to Invoice
                      </button>
                      <button
                        onClick={() => setCart([])}
                        className="w-full mt-2 text-xs text-red-400 hover:text-red-600 py-1"
                      >
                        Clear Cart
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History panel */}
            {histTab === 'history' && (
              <div className="max-h-96 overflow-y-auto">
                {history.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No history yet.</div>
                ) : history.map(h => (
                  <div key={h.id} className="px-4 py-2.5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                        h.type==='Grinding'?'bg-blue-100 text-blue-700':
                        h.type==='Milling'?'bg-amber-100 text-amber-700':
                        'bg-green-100 text-green-700'}`}>
                        {h.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(h.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="text-sm font-medium mt-0.5 truncate">{h.description}</div>
                    <div className="text-xs text-gray-400 font-mono">{h.formula}</div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-base font-bold text-govt-green">₹{parseFloat(h.total).toFixed(2)}</span>
                      <button
                        onClick={() => {
                          const item = {
                            type: h.type, description: h.description, formula: h.formula,
                            side1: h.side1, side2: h.side2, side3: h.side3,
                            rupees: h.rupees, part1: h.part1, part2: h.part2,
                            total: parseFloat(h.total),
                          }
                          setCart(prev => [...prev, { ...item, cartId: Date.now() }])
                          setHistTab('cart')
                          toast.success('Added to cart from history!')
                        }}
                        className="text-xs text-govt-blue hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────
function empty()  { return { desc: '', s1: '', s2: '', s3: '', r: '' } }
function emptyM() { return { desc: '', s1: '', s2: '', s3: '', r: '' } }

function CalcInput({ label, value, onChange, required, optional }) {
  return (
    <div>
      <label className="govt-label">
        {label}
        {optional && <span className="text-gray-400 normal-case font-normal ml-1">(opt)</span>}
      </label>
      <input
        type="number"
        step="0.01"
        min="0"
        className="govt-input"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
      />
    </div>
  )
}
