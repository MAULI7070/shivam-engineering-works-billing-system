import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createInvoice } from '../api/invoices.js'
import toast from 'react-hot-toast'
import InvoiceForm from '../components/InvoiceForm.jsx'

export const defaultItem = () => ({
  item_title: '',
  product_description: '', hsn_code: '', qty: 1, rate: 0,
  amount: 0, discount: 0, taxable_value: 0,
  cgst_rate: 9, cgst_amount: 0,
  sgst_rate: 9, sgst_amount: 0,
  igst_rate: 0, igst_amount: 0, total: 0
})

// ─── CRITICAL FIX ────────────────────────────────────────────
// React 18 Strict Mode calls useState initializers TWICE.
// If we delete sessionStorage inside the initializer, the second
// call finds it empty and returns no items.
// FIX: Only READ in the initializer. Delete in useEffect (runs once).
// ─────────────────────────────────────────────────────────────
function buildInitialForm() {
  const base = {
    invoice_no:      'SEW-',
    invoice_date:    new Date().toISOString().slice(0, 10),
    transport_mode:  'By Hand',
    vehicle_number:  '',
    reverse_charge:  false,
    date_of_supply:  new Date().toISOString().slice(0, 10),
    state:           'MAHARASHTRA',
    state_code:      '414111',
    place_of_supply: 'A Nagar',
    bill_name:       '',
    bill_address:    '',
    bill_gstin:      '',
    bill_state:      'MAHARASHTRA',
    bill_state_code: '414111',
    ship_name:       'SHIVAM ENGINEERING WORKS',
    ship_address:    'A-14/5, MIDC Ahmednagar',
    ship_gstin:      '27AEMPN1799P1ZF',
    ship_state:      'MAHARASHTRA',
    ship_state_code: '414111',
    bank_name:       'G.S. Mahanagar Bank',
    bank_ac:         '07701120000158',
    bank_ifsc:       'MCBL0960077',
    notes:           '',
    status:          'submitted',
    items:           [defaultItem()],
    _fromCalc:       0,   // number of items from calculator (0 = not from calc)
  }

  // READ only — do NOT delete here (Strict Mode calls this fn twice)
  try {
    const stored = sessionStorage.getItem('calc_prefill_items')
    if (stored) {
      const calcItems = JSON.parse(stored)
      if (Array.isArray(calcItems) && calcItems.length > 0) {
        base.items     = [...calcItems, defaultItem()]
        base._fromCalc = calcItems.length
      }
    }
  } catch (e) {
    console.warn('Could not read calc_prefill_items from sessionStorage', e)
  }

  return base
}

export default function CreateInvoice() {
  const navigate            = useNavigate()
  const [form]              = useState(buildInitialForm)   // read-only after init
  const [loading, setLoading] = useState(false)

  // ── Delete sessionStorage AFTER mount (not inside initializer) ──
  useEffect(() => {
    sessionStorage.removeItem('calc_prefill_items')

    // Show toast if items came from calculator
    if (form._fromCalc > 0) {
      toast.success(
        `${form._fromCalc} item${form._fromCalc > 1 ? 's' : ''} added from Calculator!`,
        { icon: '🧮' }
      )
    }
  }, []) // empty deps = runs once after first mount

  const handleSubmit = useCallback(async (data) => {
    setLoading(true)
    try {
      const res = await createInvoice(data)
      toast.success(`Invoice ${data.invoice_no} saved!`)
      navigate(`/invoices/${res.data.data.id}`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create invoice'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 no-print">
        <a href="/dashboard" className="hover:text-govt-blue">Dashboard</a>
        <span>/</span>
        <span className="text-govt-navy font-semibold">New Invoice</span>
        {form._fromCalc > 0 && (
          <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
            {form._fromCalc} item{form._fromCalc > 1 ? 's' : ''} from Calculator
          </span>
        )}
      </div>

      <InvoiceForm
        initialData={form}
        onSubmit={handleSubmit}
        loading={loading}
        mode="create"
        defaultItem={defaultItem}
      />
    </div>
  )
}
