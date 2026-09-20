import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getInvoice } from '../api/invoices.js'
import toast from 'react-hot-toast'
import InvoicePrint from '../components/InvoicePrint.jsx'
import { Edit2, Printer, Download } from 'lucide-react'

export default function ViewInvoice() {
  const { id }       = useParams()
  const [inv, setInv] = useState(null)
  const printRef     = useRef(null)

  useEffect(() => {
    getInvoice(id)
      .then(r => setInv(r.data.data))
      .catch(() => toast.error('Failed to load invoice'))
  }, [id])

  const handlePrint = () => window.print()

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF }      = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')

      toast.loading('Generating PDF…')
      // Make sure the print view has a white background for the PDF capture 
      // but inside it's pink. html2canvas sometimes needs explicit backgrounds.
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })
      toast.dismiss()

      const imgData  = canvas.toDataURL('image/png')
      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW     = pdf.internal.pageSize.getWidth()
      const pdfH     = (canvas.height * pdfW) / canvas.width

      if (pdfH <= pdf.internal.pageSize.getHeight()) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
      } else {
        const pageH  = pdf.internal.pageSize.getHeight()
        let yOffset  = 0
        while (yOffset < pdfH) {
          pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfW, pdfH)
          yOffset += pageH
          if (yOffset < pdfH) pdf.addPage()
        }
      }

      pdf.save(`Invoice_${inv.invoice_no}.pdf`)
      toast.success('PDF downloaded!')
    } catch (err) {
      toast.dismiss()
      toast.error('PDF generation failed')
      console.error(err)
    }
  }

  if (!inv) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-gray-400 text-lg">Loading invoice…</div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Action Bar */}
      <div className="no-print flex items-center justify-between mb-5 bg-white border border-gray-200 rounded shadow px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/dashboard" className="hover:text-govt-blue">Dashboard</Link>
          <span>/</span>
          <span className="text-govt-navy font-semibold">{inv.invoice_no}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/invoices/${id}/edit`}
            className="flex items-center gap-2 border border-govt-amber text-govt-amber px-4 py-2 rounded text-sm font-medium hover:bg-amber-50 transition-colors"
          >
            <Edit2 size={16} /> Edit
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 border border-govt-navy text-govt-navy px-4 py-2 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            <Printer size={16} /> Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-govt-navy text-white px-5 py-2 rounded text-sm font-semibold hover:bg-govt-blue transition-colors shadow"
          >
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* Printable Invoice */}
      <div ref={printRef}>
        <InvoicePrint invoice={inv} />
      </div>
    </div>
  )
}
