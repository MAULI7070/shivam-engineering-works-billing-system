import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getInvoice, updateInvoice } from '../api/invoices.js'
import toast from 'react-hot-toast'
import InvoiceForm from '../components/InvoiceForm.jsx'

const defaultItem = () => ({
  product_description: '', hsn_code: '', qty: 1, rate: 0,
  amount: 0, discount: 0, taxable_value: 0,
  cgst_rate: 9, cgst_amount: 0,
  sgst_rate: 9, sgst_amount: 0,
  igst_rate: 0, igst_amount: 0, total: 0
})

export default function EditInvoice() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setError(null)
    getInvoice(id)
      .then(res => {
        const inv = res.data.data
        // Normalize all fields for the form
        setData({
          invoice_no:      inv.invoice_no      || '',
          invoice_date:    inv.invoice_date    ? inv.invoice_date.slice(0, 10)    : '',
          transport_mode:  inv.transport_mode  || '',
          vehicle_number:  inv.vehicle_number  || '',
          reverse_charge:  inv.reverse_charge  || false,
          date_of_supply:  inv.date_of_supply  ? inv.date_of_supply.slice(0, 10) : '',
          state:           inv.state           || 'MAHARASHTRA',
          state_code:      inv.state_code      || '414111',
          place_of_supply: inv.place_of_supply || '',
          bill_name:       inv.bill_name       || '',
          bill_address:    inv.bill_address    || '',
          bill_gstin:      inv.bill_gstin      || '',
          bill_state:      inv.bill_state      || 'MAHARASHTRA',
          bill_state_code: inv.bill_state_code || '414111',
          ship_name:       inv.ship_name       || '',
          ship_address:    inv.ship_address    || '',
          ship_gstin:      inv.ship_gstin      || '',
          ship_state:      inv.ship_state      || 'MAHARASHTRA',
          ship_state_code: inv.ship_state_code || '414111',
          bank_name:       inv.bank_name       || '',
          bank_ac:         inv.bank_ac         || '',
          bank_ifsc:       inv.bank_ifsc       || '',
          notes:           inv.notes           || '',
          status:          inv.status          || 'submitted',
          items: (inv.items && inv.items.length > 0) ? inv.items.map(it => ({
            product_description: it.product_description || '',
            hsn_code:            it.hsn_code            || '',
            qty:                 parseFloat(it.qty)     || 1,
            rate:                parseFloat(it.rate)    || 0,
            amount:              parseFloat(it.amount)  || 0,
            discount:            parseFloat(it.discount)|| 0,
            taxable_value:       parseFloat(it.taxable_value) || 0,
            cgst_rate:           parseFloat(it.cgst_rate)     || 0,
            cgst_amount:         parseFloat(it.cgst_amount)   || 0,
            sgst_rate:           parseFloat(it.sgst_rate)     || 0,
            sgst_amount:         parseFloat(it.sgst_amount)   || 0,
            igst_rate:           parseFloat(it.igst_rate)     || 0,
            igst_amount:         parseFloat(it.igst_amount)   || 0,
            total:               parseFloat(it.total)         || 0,
          })) : [defaultItem()]
        })
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Failed to load invoice'
        setError(msg)
        toast.error(msg)
      })
  }, [id])

  const handleSubmit = async (formData) => {
    setLoading(true)
    try {
      await updateInvoice(id, formData)
      toast.success('Invoice updated successfully!')
      navigate(`/invoices/${id}`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Update failed. Please try again.'
      toast.error(msg)
      console.error('Update error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (error) return (
    <div className="max-w-xl mx-auto py-20 text-center">
      <div className="bg-red-50 border border-red-200 rounded p-6">
        <p className="text-red-600 font-medium">{error}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-govt-blue hover:underline text-sm">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-gray-400 text-lg">Loading invoice data...</div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 no-print">
        <Link to="/dashboard" className="hover:text-govt-blue">Dashboard</Link>
        <span>/</span>
        <Link to={`/invoices/${id}`} className="hover:text-govt-blue">{data.invoice_no}</Link>
        <span>/</span>
        <span className="text-govt-navy font-semibold">Edit</span>
      </div>
      <InvoiceForm
        initialData={data}
        onSubmit={handleSubmit}
        loading={loading}
        mode="edit"
        defaultItem={defaultItem}
      />
    </div>
  )
}
