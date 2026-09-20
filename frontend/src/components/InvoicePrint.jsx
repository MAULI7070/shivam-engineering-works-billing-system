// InvoicePrint.jsx — Pixel-perfect replica of the physical pink Tax Invoice

function fmt(v) {
  const n = parseFloat(v)
  if (!v || isNaN(n) || n === 0) return ''
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d) {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date)) return ''
  return `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getFullYear()}`
}

const MIN_ROWS = 10  // ensures the table always has enough rows like the physical paper

export default function InvoicePrint({ invoice: inv }) {
  const items = (inv.items || []).filter(it => it && it.product_description)

  // Pad to minimum rows so the paper looks full
  const rows = [...items]
  while (rows.length < MIN_ROWS) rows.push(null)

  return (
    <div
      className="print-container"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '12px',
        color: '#00008B',
        backgroundColor: '#f95d9b',
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '8mm',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ border: '2px solid #00008B', padding: '2px' }}>
        <div style={{ border: '1px solid #00008B', padding: '6px' }}>

          {/* ── Company Header ─────────────────────────── */}
          <div style={{ position: 'relative', textAlign: 'center', paddingBottom: '6px', borderBottom: '1px solid #00008B' }}>
            {/* SEW stamp */}
            <div style={{
              position: 'absolute', top: '4px', left: '8px',
              border: '2px solid #cc0000', color: '#cc0000',
              fontWeight: 'bold', fontSize: '20px', padding: '1px 8px',
              transform: 'rotate(-15deg)', letterSpacing: '2px'
            }}>SEW</div>

            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>A-14/8, OPPOSITE SIDHI FORGE, MIDC</div>
            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>AHMEDNAGAR, MAHARASHTRA-414111</div>
            <div style={{ fontSize: '11px' }}>Tel: +91 9880649658 / 9529214214</div>
            <div style={{ fontSize: '11px' }}>
              GSTIN:27AEMPN1799P1ZF &nbsp;/&nbsp; Email: nimbalkar.shivamengineering@gmail.com
            </div>
          </div>

          {/* ── Tax Invoice Title ──────────────────────── */}
          <div style={{
            textAlign: 'center', color: '#cc0000', fontSize: '20px',
            fontWeight: 'bold', padding: '3px 0',
            borderBottom: '1px solid #00008B',
          }}>
            Tax Invoice
          </div>

          {/* ── Invoice Meta ───────────────────────────── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1px solid #00008B' }}>
            <tbody>
              <tr>
                <td style={tm}>Invoice No: <b>{inv.invoice_no}</b></td>
                <td style={tm}>Transport Mode: <b>{inv.transport_mode || '—'}</b></td>
                <td style={tm}>Vehicle No: <b>{inv.vehicle_number || '—'}</b></td>
              </tr>
              <tr>
                <td style={tm}>Invoice Date: <b>{fmtDate(inv.invoice_date)}</b></td>
                <td style={tm}>Date of Supply: <b>{fmtDate(inv.date_of_supply)}</b></td>
                <td style={tm}>Reverse Charge: <b>{inv.reverse_charge ? 'Yes' : 'No'}</b></td>
              </tr>
              <tr>
                <td style={tm}>State: <b>MAHARASHTRA</b></td>
                <td style={tm}>Code: <b>{inv.state_code}</b></td>
                <td style={tm}>Place of Supply: <b>{inv.place_of_supply}</b></td>
              </tr>
            </tbody>
          </table>

          {/* ── Bill To / Ship To ─────────────────────── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1px solid #00008B' }}>
            <thead>
              <tr>
                <th style={{ ...th2, width: '50%', borderRight: '1px solid #00008B' }}>&nbsp;</th>
                <th style={th2}>Ship to Party</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...td2, borderRight: '1px solid #00008B', verticalAlign: 'top' }}>
                  <b>Name:</b> {inv.bill_name}<br />
                  <b>Address:</b> {inv.bill_address}
                </td>
                <td style={{ ...td2, verticalAlign: 'top' }}>
                  <b>Name:</b> {inv.ship_name}<br />
                  <b>Address:</b> {inv.ship_address}
                </td>
              </tr>
              <tr>
                <td style={{ ...td2, borderRight: '1px solid #00008B', borderTop: '1px solid #00008B' }}>
                  <b>GSTIN:</b> {inv.bill_gstin || '—'}
                </td>
                <td style={{ ...td2, borderTop: '1px solid #00008B' }}>
                  <b>GSTIN:</b> {inv.ship_gstin || '—'}
                </td>
              </tr>
              <tr>
                <td style={{ ...td2, borderRight: '1px solid #00008B', borderTop: '1px solid #00008B' }}>
                  <b>State:</b> {inv.bill_state} &nbsp; <b>Code:</b> {inv.bill_state_code}
                </td>
                <td style={{ ...td2, borderTop: '1px solid #00008B' }}>
                  <b>State:</b> {inv.ship_state} &nbsp; <b>Code:</b> {inv.ship_state_code}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── Line Items Table ───────────────────────── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,139,0.1)' }}>
                <th style={{ ...th, width: '4%' }} rowSpan={2}>Sr<br/>No</th>
                <th style={{ ...th, width: '25%', textAlign: 'left' }} rowSpan={2}>Product Description</th>
                <th style={th} rowSpan={2}>HSN<br/>Code</th>
                <th style={th} rowSpan={2}>Qty</th>
                <th style={th} rowSpan={2}>Rate</th>
                <th style={th} rowSpan={2}>Amount</th>
                <th style={th} rowSpan={2}>Discount</th>
                <th style={th} rowSpan={2}>Taxable<br/>Value</th>
                <th style={th} colSpan={2}>CGST</th>
                <th style={th} colSpan={2}>SGST</th>
                <th style={th} rowSpan={2}>Total</th>
              </tr>
              <tr style={{ background: 'rgba(0,0,139,0.07)' }}>
                <th style={th}>Rate</th>
                <th style={th}>Amt</th>
                <th style={th}>Rate</th>
                <th style={th}>Amt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, idx) => (
                <tr key={idx} style={{ height: '22px', borderBottom: '1px solid rgba(0,0,139,0.2)' }}>
                  <td style={td}>{item ? idx + 1 : ''}</td>
                  <td style={{ ...td, textAlign: 'left', paddingLeft: '4px' }}>
                    {item?.item_title ? (
                      <>
                        <div style={{ fontWeight: 'bold', paddingBottom: '2px' }}>{item.item_title}</div>
                        <div>{item.product_description || ''}</div>
                      </>
                    ) : (
                      item?.product_description || ''
                    )}
                  </td>
                  <td style={td}>{item?.hsn_code || ''}</td>
                  <td style={td}>{item ? (parseFloat(item.qty) || '') : ''}</td>
                  <td style={td}>{item ? fmt(item.rate) : ''}</td>
                  <td style={td}>{item ? fmt(item.amount) : ''}</td>
                  <td style={td}>{item ? fmt(item.discount) : ''}</td>
                  <td style={{ ...td, fontWeight: item ? '600' : 'normal' }}>
                    {item ? fmt(item.taxable_value) : ''}
                  </td>
                  <td style={td}>{item && parseFloat(item.cgst_rate) ? `${item.cgst_rate}%` : ''}</td>
                  <td style={td}>{item ? fmt(item.cgst_amount) : ''}</td>
                  <td style={td}>{item && parseFloat(item.sgst_rate) ? `${item.sgst_rate}%` : ''}</td>
                  <td style={td}>{item ? fmt(item.sgst_amount) : ''}</td>
                  <td style={{ ...td, fontWeight: item ? 'bold' : 'normal' }}>
                    {item ? fmt(item.total) : ''}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr style={{ borderTop: '2px solid #00008B', fontWeight: 'bold', background: 'rgba(0,0,139,0.06)' }}>
                <td style={td} colSpan={5}>Total</td>
                <td style={td}>{fmt(items.reduce((s,i)=>s+(parseFloat(i.amount)||0),0))}</td>
                <td style={td}>{fmt(items.reduce((s,i)=>s+(parseFloat(i.discount)||0),0))}</td>
                <td style={td}>{fmt(inv.total_taxable)}</td>
                <td style={td}></td>
                <td style={td}>{fmt(inv.cgst_amount)}</td>
                <td style={td}></td>
                <td style={td}>{fmt(inv.sgst_amount)}</td>
                <td style={td}>{fmt(inv.total_after_tax)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── Summary Footer ─────────────────────────── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #00008B', marginTop: '-1px' }}>
            <tbody>
              <tr>
                {/* Amount in words */}
                <td style={{ ...td2, width: '60%', borderRight: '1px solid #00008B', verticalAlign: 'top', padding: 0 }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #00008B', padding: '2px 4px', fontWeight: 'bold', fontSize: '11px' }}>
                    Total Invoice Amount in words
                  </div>
                  <div style={{ padding: '5px 8px', fontWeight: 'bold', fontStyle: 'italic', fontSize: '12px' }}>
                    {inv.amount_in_words || '—'}
                  </div>
                </td>
                {/* Tax summary */}
                <td style={{ width: '40%', verticalAlign: 'top', padding: 0 }}>
                  <TaxSummary label="Total Amount before Tax" value={fmt(inv.total_taxable)} />
                  <TaxSummary label="Add: CGST"               value={fmt(inv.cgst_amount)} />
                  <TaxSummary label="Add: SGST"               value={fmt(inv.sgst_amount)} />
                  {parseFloat(inv.igst_amount||0) > 0 &&
                    <TaxSummary label="Add: IGST"             value={fmt(inv.igst_amount)} />}
                  <TaxSummary label="Total Tax Amount"        value={fmt(inv.total_tax)} />
                  <TaxSummary label="Total Amount after Tax"  value={`₹ ${fmt(inv.total_after_tax)}`} bold />
                </td>
              </tr>
              {/* Bank + Certification */}
              <tr>
                <td style={{ ...td2, borderRight: '1px solid #00008B', borderTop: '1px solid #00008B', verticalAlign: 'top', padding: 0 }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #00008B', padding: '2px 4px', fontWeight: 'bold', fontSize: '11px' }}>Bank Details</div>
                  <div style={{ padding: '3px 6px', borderBottom: '1px solid #00008B', fontSize: '11px' }}>{inv.bank_name}</div>
                  <div style={{ padding: '3px 6px', borderBottom: '1px solid #00008B', fontSize: '11px' }}>Bank A/C: {inv.bank_ac}</div>
                  <div style={{ padding: '3px 6px', borderBottom: '1px solid #00008B', fontSize: '11px' }}>Bank IFSC: {inv.bank_ifsc}</div>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #00008B', padding: '2px 4px', fontWeight: 'bold', fontSize: '11px' }}>Terms &amp; Conditions</div>
                  <div style={{ padding: '5px 8px', minHeight: '40px', fontSize: '10px', color: '#333' }}>{inv.notes}</div>
                </td>
                <td style={{ ...td2, borderTop: '1px solid #00008B', verticalAlign: 'top', padding: 0 }}>
                  <div style={{ borderBottom: '1px solid #00008B', padding: '3px 6px', fontSize: '10px' }}>
                    GST on Reverse charge: {inv.reverse_charge ? 'Yes' : 'No'}
                  </div>
                  <div style={{ padding: '6px', fontSize: '10px', textAlign: 'center' }}>
                    Certified that the Particulars given above are true and Correct
                    <div style={{ color: '#cc0000', fontWeight: 'bold', marginTop: '6px', fontSize: '12px' }}>
                      For SHIVAM ENGINEERING WORKS
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', paddingRight: '12px', paddingBottom: '6px', fontSize: '11px', marginTop: '20px' }}>
                    Authorised Signatory
                  </div>
                </td>
              </tr>
              {/* Common seal */}
              <tr>
                <td style={{ ...td2, borderTop: '1px solid #00008B', borderRight: '1px solid #00008B', textAlign: 'center', padding: '6px' }}>
                  Common Seal
                </td>
                <td style={{ ...td2, borderTop: '1px solid #00008B', padding: '6px' }}></td>
              </tr>
            </tbody>
          </table>

          {/* Computer generated note */}
          <div style={{ textAlign: 'center', fontSize: '9px', color: '#555', marginTop: '5px' }}>
            This is a computer generated invoice.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Style tokens ───────────────────────────────────────────────
const tm = { padding: '2px 5px', fontSize: '11px' }
const th = {
  border: '1px solid rgba(0,0,139,0.4)', padding: '3px 2px',
  textAlign: 'center', fontWeight: '600', fontSize: '10px'
}
const td = {
  border: '1px solid rgba(0,0,139,0.25)', padding: '2px 3px',
  textAlign: 'center', fontSize: '10px'
}
const th2 = {
  border: '1px solid #00008B', padding: '3px 6px',
  textAlign: 'center', fontWeight: 'bold', fontSize: '11px'
}
const td2 = { padding: '4px 6px', fontSize: '11px' }

function TaxSummary({ label, value, bold }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '2px 6px', borderBottom: '1px solid rgba(0,0,139,0.3)',
      fontWeight: bold ? 'bold' : 'normal', fontSize: '11px'
    }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
