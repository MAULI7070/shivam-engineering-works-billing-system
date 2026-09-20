import { useState, useEffect, useRef } from 'react'
import { Save } from 'lucide-react'

// Utility: compute row amounts
function computeRow(item) {
  const qty      = parseFloat(item.qty)      || 0
  const rate     = parseFloat(item.rate)     || 0
  const discount = parseFloat(item.discount) || 0
  const cgstRate = parseFloat(item.cgst_rate) || 0
  const sgstRate = parseFloat(item.sgst_rate) || 0
  const igstRate = parseFloat(item.igst_rate) || 0

  const amount       = qty * rate
  const taxable      = amount - discount
  const cgst_amount  = parseFloat(((taxable * cgstRate) / 100).toFixed(2))
  const sgst_amount  = parseFloat(((taxable * sgstRate) / 100).toFixed(2))
  const igst_amount  = parseFloat(((taxable * igstRate) / 100).toFixed(2))
  const total        = parseFloat((taxable + cgst_amount + sgst_amount + igst_amount).toFixed(2))

  return { ...item, amount, taxable_value: taxable, cgst_amount, sgst_amount, igst_amount, total }
}

// Strip null/padding rows (added by InvoicePrint for minimum row display)
// Keep ALL non-null items regardless of whether description is empty or missing
function sanitizeItems(items, defaultItem) {
  if (!Array.isArray(items) || items.length === 0) return [defaultItem()]
  // Only filter out literal null/undefined rows (padding from InvoicePrint)
  const real = items
    .filter(it => it != null && typeof it === 'object')
    .map(it => ({
      ...defaultItem(),  // ensure all required fields exist with defaults
      ...it,             // overlay actual values (may override defaults)
      product_description: it.product_description ?? '',  // never undefined
    }))
  return real.length > 0 ? real : [defaultItem()]
}

export default function InvoiceForm({ initialData, onSubmit, loading, mode, defaultItem }) {
  const [form,  setForm]  = useState(initialData)
  const [items, setItems] = useState(() => sanitizeItems(initialData.items, defaultItem))

  // ── CRITICAL FIX ──────────────────────────────────────────
  // Track the previous initialData reference with a ref.
  // Only reset form+items when initialData ACTUALLY changes reference
  // (i.e., when EditInvoice loads fresh data from the API).
  // This prevents parent re-renders from wiping the user's entered items.
  const prevInitialData = useRef(initialData)
  useEffect(() => {
    if (prevInitialData.current !== initialData) {
      prevInitialData.current = initialData
      setForm(initialData)
      setItems(sanitizeItems(initialData.items, defaultItem))
    }
  }, [initialData, defaultItem])

  // Totals
  const totalTaxable  = items.reduce((s, i) => s + (parseFloat(i.taxable_value) || 0), 0)
  const totalCGST     = items.reduce((s, i) => s + (parseFloat(i.cgst_amount)   || 0), 0)
  const totalSGST     = items.reduce((s, i) => s + (parseFloat(i.sgst_amount)   || 0), 0)
  const totalIGST     = items.reduce((s, i) => s + (parseFloat(i.igst_amount)   || 0), 0)
  const totalTax      = totalCGST + totalSGST + totalIGST
  const totalAfterTax = totalTaxable + totalTax

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const setItemField = (idx, k, v) => {
    setItems(prev => {
      const updated = [...prev]
      updated[idx] = computeRow({ ...updated[idx], [k]: v })
      return updated
    })
  }

  const addItem    = () => setItems(p => [...p, defaultItem()])
  const removeItem = (idx) => setItems(p => p.filter((_, i) => i !== idx))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      items,
      total_taxable:   totalTaxable,
      cgst_amount:     totalCGST,
      sgst_amount:     totalSGST,
      igst_amount:     totalIGST,
      total_tax:       totalTax,
      total_after_tax: totalAfterTax,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Invoice Header Card ─────────────────────────────── */}
      <SectionCard title="Invoice Details">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="govt-label">Invoice No *</label>
            <input className="govt-input" required value={form.invoice_no}
              onChange={e => setField('invoice_no', e.target.value)} />
          </div>
          <div>
            <label className="govt-label">Invoice Date *</label>
            <input type="date" className="govt-input" required value={form.invoice_date}
              onChange={e => setField('invoice_date', e.target.value)} />
          </div>
          <div>
            <label className="govt-label">Transport Mode</label>
            <input className="govt-input" value={form.transport_mode}
              onChange={e => setField('transport_mode', e.target.value)} placeholder="By Hand / Road / Rail" />
          </div>
          <div>
            <label className="govt-label">Vehicle Number</label>
            <input className="govt-input" value={form.vehicle_number}
              onChange={e => setField('vehicle_number', e.target.value)} placeholder="MH-16-AB-1234" />
          </div>
          <div>
            <label className="govt-label">Reverse Charge (Y/N)</label>
            <select className="govt-input" value={form.reverse_charge ? 'Y' : 'N'}
              onChange={e => setField('reverse_charge', e.target.value === 'Y')}>
              <option value="N">No</option>
              <option value="Y">Yes</option>
            </select>
          </div>
          <div>
            <label className="govt-label">Date of Supply</label>
            <input type="date" className="govt-input" value={form.date_of_supply}
              onChange={e => setField('date_of_supply', e.target.value)} />
          </div>
          <div>
            <label className="govt-label">State</label>
            <input className="govt-input" value={form.state}
              onChange={e => setField('state', e.target.value)} />
          </div>
          <div>
            <label className="govt-label">Place of Supply</label>
            <input className="govt-input" value={form.place_of_supply}
              onChange={e => setField('place_of_supply', e.target.value)} />
          </div>
        </div>
      </SectionCard>

      {/* ── Bill To / Ship To ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard title="Bill To (Customer)">
          <div className="space-y-3">
            <div>
              <label className="govt-label">Customer Name *</label>
              <input className="govt-input" required value={form.bill_name}
                onChange={e => setField('bill_name', e.target.value)} placeholder="G-Tech Industries" />
            </div>
            <div>
              <label className="govt-label">Address</label>
              <textarea className="govt-input resize-none" rows={2} value={form.bill_address}
                onChange={e => setField('bill_address', e.target.value)} placeholder="MIDC, Ahmednagar" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="govt-label">GSTIN</label>
                <input className="govt-input uppercase" value={form.bill_gstin}
                  onChange={e => setField('bill_gstin', e.target.value.toUpperCase())}
                  placeholder="27XXXXX0000X1ZX" maxLength={15} />
              </div>
              <div>
                <label className="govt-label">State</label>
                <input className="govt-input" value={form.bill_state}
                  onChange={e => setField('bill_state', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="govt-label">State Code</label>
              <input className="govt-input w-28" value={form.bill_state_code}
                onChange={e => setField('bill_state_code', e.target.value)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Ship To (Party)">
          <div className="space-y-3">
            <div>
              <label className="govt-label">Party Name</label>
              <input className="govt-input" value={form.ship_name}
                onChange={e => setField('ship_name', e.target.value)} />
            </div>
            <div>
              <label className="govt-label">Address</label>
              <textarea className="govt-input resize-none" rows={2} value={form.ship_address}
                onChange={e => setField('ship_address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="govt-label">GSTIN</label>
                <input className="govt-input uppercase" value={form.ship_gstin}
                  onChange={e => setField('ship_gstin', e.target.value.toUpperCase())}
                  maxLength={15} />
              </div>
              <div>
                <label className="govt-label">State</label>
                <input className="govt-input" value={form.ship_state}
                  onChange={e => setField('ship_state', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="govt-label">State Code</label>
              <input className="govt-input w-28" value={form.ship_state_code}
                onChange={e => setField('ship_state_code', e.target.value)} />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Line Items ──────────────────────────────────────── */}
      <SectionCard title="Line Items">
        <div className="overflow-x-auto">
          <table className="w-full invoice-table text-xs">
            <thead>
              <tr>
                <th className="w-8">Sr</th>
                <th className="min-w-[180px]">Product Description</th>
                <th className="w-20">HSN Code</th>
                <th className="w-16">Qty</th>
                <th className="w-20">Rate (₹)</th>
                <th className="w-20">Amount (₹)</th>
                <th className="w-20">Discount (₹)</th>
                <th className="w-24">Taxable Value</th>
                <th className="w-16">CGST %</th>
                <th className="w-20">CGST ₹</th>
                <th className="w-16">SGST %</th>
                <th className="w-20">SGST ₹</th>
                <th className="w-16">IGST %</th>
                <th className="w-20">IGST ₹</th>
                <th className="w-24">Total (₹)</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="font-semibold text-gray-500">{idx + 1}</td>
                  <td>
                    <div className="flex flex-col gap-1 py-1">
                      <input
                        className="w-full border-0 focus:outline-none bg-transparent text-xs font-bold"
                        value={item.item_title || ''}
                        onChange={e => setItemField(idx, 'item_title', e.target.value)}
                        placeholder="Title (optional)"
                      />
                      <input
                        className="w-full border-0 focus:outline-none bg-transparent text-xs"
                        value={item.product_description || ''}
                        onChange={e => setItemField(idx, 'product_description', e.target.value)}
                        required
                        placeholder="Product / Service description"
                      />
                    </div>
                  </td>
                  <td>
                    <input className="w-full border-0 focus:outline-none bg-transparent text-xs text-center"
                      value={item.hsn_code}
                      onChange={e => setItemField(idx, 'hsn_code', e.target.value)} />
                  </td>
                  <NumCell item={item} field="qty"       idx={idx} setItemField={setItemField} />
                  <NumCell item={item} field="rate"      idx={idx} setItemField={setItemField} />
                  <td className="text-right pr-2">{(item.amount||0).toFixed(2)}</td>
                  <NumCell item={item} field="discount"  idx={idx} setItemField={setItemField} />
                  <td className="text-right pr-2 font-medium">{(item.taxable_value||0).toFixed(2)}</td>
                  <NumCell item={item} field="cgst_rate" idx={idx} setItemField={setItemField} />
                  <td className="text-right pr-2">{(item.cgst_amount||0).toFixed(2)}</td>
                  <NumCell item={item} field="sgst_rate" idx={idx} setItemField={setItemField} />
                  <td className="text-right pr-2">{(item.sgst_amount||0).toFixed(2)}</td>
                  <NumCell item={item} field="igst_rate" idx={idx} setItemField={setItemField} />
                  <td className="text-right pr-2">{(item.igst_amount||0).toFixed(2)}</td>
                  <td className="text-right pr-2 font-bold text-govt-navy">{(item.total||0).toFixed(2)}</td>
                  <td>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)}
                        className="text-red-400 hover:text-red-600 font-bold text-base leading-none">×</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="text-left">
                  <button type="button" onClick={addItem}
                    className="text-govt-blue hover:underline text-xs font-semibold px-2 py-1">
                    + Add Row
                  </button>
                </td>
                <td className="text-right pr-2 font-bold">{items.reduce((s,i)=>s+(parseFloat(i.amount)||0),0).toFixed(2)}</td>
                <td className="text-right pr-2 font-bold">{items.reduce((s,i)=>s+(parseFloat(i.discount)||0),0).toFixed(2)}</td>
                <td className="text-right pr-2 font-bold text-govt-navy">{totalTaxable.toFixed(2)}</td>
                <td></td>
                <td className="text-right pr-2 font-bold">{totalCGST.toFixed(2)}</td>
                <td></td>
                <td className="text-right pr-2 font-bold">{totalSGST.toFixed(2)}</td>
                <td></td>
                <td className="text-right pr-2 font-bold">{totalIGST.toFixed(2)}</td>
                <td className="text-right pr-2 font-bold text-govt-navy">{totalAfterTax.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      {/* ── Summary ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard title="Bank Details">
          <div className="space-y-3">
            <div>
              <label className="govt-label">Bank Name</label>
              <input className="govt-input" value={form.bank_name}
                onChange={e => setField('bank_name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="govt-label">Account Number</label>
                <input className="govt-input" value={form.bank_ac}
                  onChange={e => setField('bank_ac', e.target.value)} />
              </div>
              <div>
                <label className="govt-label">IFSC Code</label>
                <input className="govt-input uppercase" value={form.bank_ifsc}
                  onChange={e => setField('bank_ifsc', e.target.value.toUpperCase())} />
              </div>
            </div>
            <div>
              <label className="govt-label">Notes / Terms & Conditions</label>
              <textarea className="govt-input resize-none" rows={3} value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="Terms &amp; Conditions..." />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Tax Summary">
          <div className="space-y-2 text-sm">
            <SummaryRow label="Total Taxable Amount" value={totalTaxable} />
            <SummaryRow label="Add: CGST"            value={totalCGST} />
            <SummaryRow label="Add: SGST"            value={totalSGST} />
            {totalIGST > 0 && <SummaryRow label="Add: IGST" value={totalIGST} />}
            <SummaryRow label="Total Tax Amount"     value={totalTax} />
            <div className="border-t-2 border-govt-navy pt-2">
              <SummaryRow label="Total Amount after Tax" value={totalAfterTax} bold />
            </div>
            <div className="mt-3 bg-govt-light rounded p-2 text-xs text-gray-600 italic border border-blue-200">
              <span className="font-semibold not-italic text-govt-navy">Amount in words: </span>
              {totalAfterTax > 0 ? toWordsClient(totalAfterTax) : '—'}
            </div>
          </div>

          <div className="mt-4">
            <label className="govt-label">Status</label>
            <select className="govt-input" value={form.status}
              onChange={e => setField('status', e.target.value)}>
              <option value="submitted">Submitted</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </SectionCard>
      </div>

      {/* ── Submit ──────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 no-print pb-8">
        <a href="/dashboard"
          className="px-6 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 text-sm font-medium">
          Cancel
        </a>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-govt-navy text-white px-8 py-2 rounded font-semibold text-sm hover:bg-govt-blue disabled:opacity-50 shadow transition-colors"
        >
          <Save size={16} /> {loading ? 'Saving…' : mode === 'create' ? 'Save Invoice' : 'Update Invoice'}
        </button>
      </div>
    </form>
  )
}

// ── Helpers ──────────────────────────────────────────────────

function NumCell({ item, field, idx, setItemField }) {
  return (
    <td>
      <input
        type="number"
        min="0"
        step="0.01"
        className="w-full border-0 focus:outline-none bg-transparent text-xs text-right pr-1"
        value={item[field] === 0 ? '' : item[field]}
        onChange={e => setItemField(idx, field, e.target.value)}
        placeholder="0"
      />
    </td>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded shadow border border-gray-200">
      <div className="bg-govt-navy text-white px-4 py-2 rounded-t text-sm font-semibold tracking-wide">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function SummaryRow({ label, value, bold }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold text-govt-navy text-base' : ''}`}>
      <span>{label}</span>
      <span>₹ {value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    </div>
  )
}

// Client-side number to words (Indian system)
function toWordsClient(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
    'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
    'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function h(n) {
    let r = ''
    if (n >= 100) { r += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100 }
    if (n >= 20)  { r += tens[Math.floor(n / 10)] + ' '; n %= 10 }
    if (n > 0)    { r += ones[n] + ' ' }
    return r
  }

  if (!amount || amount === 0) return 'Zero Rupees Only'
  const rupees = Math.floor(amount)
  const paise  = Math.round((amount - rupees) * 100)
  let w = ''
  if (rupees >= 10000000) { w += h(Math.floor(rupees / 10000000)) + 'Crore ' }
  if (rupees >= 100000)   { w += h(Math.floor((rupees % 10000000) / 100000)) + 'Lakh ' }
  if (rupees >= 1000)     { w += h(Math.floor((rupees % 100000) / 1000)) + 'Thousand ' }
  w += h(rupees % 1000)
  w = w.trim() + ' Rupees'
  if (paise > 0) w += ' and ' + h(paise).trim() + ' Paise'
  return w + ' Only'
}
