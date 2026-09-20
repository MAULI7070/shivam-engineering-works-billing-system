import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getInvoices, deleteInvoice } from '../api/invoices.js'
import toast from 'react-hot-toast'
import { Plus, Search, Eye, Edit, Trash2, RefreshCw } from 'lucide-react'

export default function Dashboard() {
  const [invoices, setInvoices] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [search,   setSearch]   = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await getInvoices()
      setInvoices(res.data.data || [])
    } catch (err) {
      toast.error('Failed to load invoices. Is the backend running?')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, no) => {
    if (!window.confirm(`Are you sure you want to delete invoice "${no}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await deleteInvoice(id)
      toast.success(`Invoice ${no} deleted.`)
      // Remove from local state instantly
      setInvoices(prev => prev.filter(inv => inv.id !== id))
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete invoice.'
      toast.error(msg)
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  const filtered = invoices.filter(inv =>
    (inv.invoice_no || '').toLowerCase().includes(search.toLowerCase()) ||
    (inv.bill_name  || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-govt-navy">Invoice Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">All tax invoices — Shivam Engineering Works</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={load}
            className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <Link
            to="/invoices/new"
            className="flex items-center gap-2 bg-govt-navy text-white px-5 py-2 rounded font-semibold text-sm hover:bg-govt-blue transition-colors shadow"
          >
            <Plus size={16} /> New Invoice
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Invoices" value={invoices.length} color="bg-govt-navy" />
        <StatCard
          label="Submitted"
          value={invoices.filter(i => i.status === 'submitted').length}
          color="bg-govt-green"
        />
        <StatCard
          label="Total Value"
          value={`₹${invoices.reduce((s, i) => s + parseFloat(i.total_after_tax || 0), 0)
            .toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          color="bg-govt-amber text-govt-navy"
        />
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search by invoice no. or customer name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="govt-input pl-9 w-full"
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded overflow-hidden border border-gray-200">
        <table className="w-full invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Taxable Amt</th>
              <th>Tax</th>
              <th>Total (₹)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin" /> Loading invoices…
                  </div>
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-400">
                  {search ? 'No invoices match your search.' : 'No invoices yet. Create your first invoice!'}
                </td>
              </tr>
            )}
            {!loading && filtered.map((inv, idx) => (
              <tr key={inv.id} className={deleting === inv.id ? 'opacity-40' : ''}>
                <td>{idx + 1}</td>
                <td className="font-semibold text-govt-blue">{inv.invoice_no}</td>
                <td>
                  {inv.invoice_date
                    ? new Date(inv.invoice_date).toLocaleDateString('en-IN')
                    : '—'}
                </td>
                <td className="text-left font-medium">{inv.bill_name}</td>
                <td>₹{parseFloat(inv.total_taxable || 0).toFixed(2)}</td>
                <td>₹{parseFloat(inv.total_tax || 0).toFixed(2)}</td>
                <td className="font-bold text-govt-green">
                  ₹{parseFloat(inv.total_after_tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    inv.status === 'submitted'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td>
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="text-govt-blue hover:text-blue-800 transition-colors"
                      title="View Invoice"
                    >
                      <Eye size={17} />
                    </Link>
                    <Link
                      to={`/invoices/${inv.id}/edit`}
                      className="text-amber-500 hover:text-amber-700 transition-colors"
                      title="Edit Invoice"
                    >
                      <Edit size={17} />
                    </Link>
                    <button
                      onClick={() => handleDelete(inv.id, inv.invoice_no)}
                      disabled={deleting === inv.id}
                      className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
                      title="Delete Invoice"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className={`${color} text-white rounded shadow p-4`}>
      <div className="text-xs uppercase tracking-wide opacity-80 font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}
