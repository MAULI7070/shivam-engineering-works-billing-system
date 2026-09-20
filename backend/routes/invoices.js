const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── Utility: convert number to Indian words ──────────────────
function toWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
    'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
    'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertHundreds(n) {
    let result = '';
    if (n >= 100) { result += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n >= 20)  { result += tens[Math.floor(n / 10)] + ' '; n %= 10; }
    if (n > 0)    { result += ones[n] + ' '; }
    return result;
  }

  if (amount === 0) return 'Zero Rupees Only';
  const rupees = Math.floor(amount);
  const paise  = Math.round((amount - rupees) * 100);
  let words = '';
  if (rupees >= 10000000) { words += convertHundreds(Math.floor(rupees / 10000000)) + 'Crore '; }
  if (rupees >= 100000)   { words += convertHundreds(Math.floor((rupees % 10000000) / 100000)) + 'Lakh '; }
  if (rupees >= 1000)     { words += convertHundreds(Math.floor((rupees % 100000) / 1000)) + 'Thousand '; }
  words += convertHundreds(rupees % 1000);
  words = words.trim() + ' Rupees';
  if (paise > 0) words += ' and ' + convertHundreds(paise).trim() + ' Paise';
  return words + ' Only';
}

// ── GET /api/invoices — list all ────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id, invoice_no, invoice_date, bill_name, total_after_tax, status, created_at
       FROM invoices ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Invoice list failed:', err.message);
    res.status(503).json({
      success: false,
      error: 'Database unavailable. Configure DATABASE_URL or the DB_* environment variables.',
    });
  }
});

// ── GET /api/invoices/:id — single invoice with items ───────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invResult = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invResult.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Invoice not found' });

    const itemsResult = await db.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sr_no',
      [id]
    );
    res.json({ success: true, data: { ...invResult.rows[0], items: itemsResult.rows } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/invoices — create invoice + items ─────────────
router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const {
      invoice_no, invoice_date, transport_mode, vehicle_number,
      reverse_charge, date_of_supply, state, state_code, place_of_supply,
      bill_name, bill_address, bill_gstin, bill_state, bill_state_code,
      ship_name, ship_address, ship_gstin, ship_state, ship_state_code,
      bank_name, bank_ac, bank_ifsc, notes, status,
      items = []
    } = req.body;

    // Calculate totals from items
    let totalTaxable = 0, cgstAmt = 0, sgstAmt = 0, igstAmt = 0;
    items.forEach(item => {
      totalTaxable += parseFloat(item.taxable_value || 0);
      cgstAmt      += parseFloat(item.cgst_amount   || 0);
      sgstAmt      += parseFloat(item.sgst_amount   || 0);
      igstAmt      += parseFloat(item.igst_amount   || 0);
    });
    const totalTax     = cgstAmt + sgstAmt + igstAmt;
    const totalAfterTax = totalTaxable + totalTax;
    const amountInWords = toWords(totalAfterTax);

    const invResult = await client.query(
      `INSERT INTO invoices (
          invoice_no, invoice_date, transport_mode, vehicle_number,
          reverse_charge, date_of_supply, state, state_code, place_of_supply,
          bill_name, bill_address, bill_gstin, bill_state, bill_state_code,
          ship_name, ship_address, ship_gstin, ship_state, ship_state_code,
          total_taxable, cgst_amount, sgst_amount, igst_amount,
          total_tax, total_after_tax, amount_in_words,
          bank_name, bank_ac, bank_ifsc, notes, status
       ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          $10,$11,$12,$13,$14,
          $15,$16,$17,$18,$19,
          $20,$21,$22,$23,$24,$25,$26,
          $27,$28,$29,$30,$31
       ) RETURNING *`,
      [
        invoice_no, invoice_date, transport_mode || '', vehicle_number || '',
        reverse_charge || false, date_of_supply || null, state || 'MAHARASHTRA',
        state_code || '414111', place_of_supply || '',
        bill_name, bill_address || '', bill_gstin || '', bill_state || 'MAHARASHTRA', bill_state_code || '414111',
        ship_name || '', ship_address || '', ship_gstin || '', ship_state || 'MAHARASHTRA', ship_state_code || '414111',
        totalTaxable, cgstAmt, sgstAmt, igstAmt,
        totalTax, totalAfterTax, amountInWords,
        bank_name || 'G.S. Mahanagar Bank', bank_ac || '07701120000158',
        bank_ifsc || 'MCBL0960077', notes || '', status || 'submitted'
      ]
    );

    const invoiceId = invResult.rows[0].id;

    // Insert items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const amt   = parseFloat(it.qty || 0) * parseFloat(it.rate || 0);
      const taxVal = amt - parseFloat(it.discount || 0);
      const cAmt  = (taxVal * parseFloat(it.cgst_rate || 0)) / 100;
      const sAmt  = (taxVal * parseFloat(it.sgst_rate || 0)) / 100;
      const iAmt  = (taxVal * parseFloat(it.igst_rate || 0)) / 100;
      const total = taxVal + cAmt + sAmt + iAmt;

      await client.query(
        `INSERT INTO invoice_items (
            invoice_id, sr_no, item_title, product_description, hsn_code,
            qty, rate, amount, discount, taxable_value,
            cgst_rate, cgst_amount, sgst_rate, sgst_amount,
            igst_rate, igst_amount, total
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          invoiceId, i + 1, it.item_title || '',
          it.product_description, it.hsn_code || '',
          it.qty, it.rate, amt, it.discount || 0, taxVal,
          it.cgst_rate || 0, parseFloat(it.cgst_amount || cAmt),
          it.sgst_rate || 0, parseFloat(it.sgst_amount || sAmt),
          it.igst_rate || 0, parseFloat(it.igst_amount || iAmt),
          parseFloat(it.total || total)
        ]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { ...invResult.rows[0], items } });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505')
      return res.status(409).json({ success: false, error: 'Invoice number already exists' });
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// ── PUT /api/invoices/:id — update invoice ──────────────────
router.put('/:id', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const {
      invoice_no, invoice_date, transport_mode, vehicle_number,
      reverse_charge, date_of_supply, state, state_code, place_of_supply,
      bill_name, bill_address, bill_gstin, bill_state, bill_state_code,
      ship_name, ship_address, ship_gstin, ship_state, ship_state_code,
      bank_name, bank_ac, bank_ifsc, notes, status,
      items = []
    } = req.body;

    let totalTaxable = 0, cgstAmt = 0, sgstAmt = 0, igstAmt = 0;
    items.forEach(item => {
      totalTaxable += parseFloat(item.taxable_value || 0);
      cgstAmt      += parseFloat(item.cgst_amount   || 0);
      sgstAmt      += parseFloat(item.sgst_amount   || 0);
      igstAmt      += parseFloat(item.igst_amount   || 0);
    });
    const totalTax      = cgstAmt + sgstAmt + igstAmt;
    const totalAfterTax = totalTaxable + totalTax;

    await client.query(
      `UPDATE invoices SET
          invoice_no=$1, invoice_date=$2, transport_mode=$3, vehicle_number=$4,
          reverse_charge=$5, date_of_supply=$6, state=$7, state_code=$8, place_of_supply=$9,
          bill_name=$10, bill_address=$11, bill_gstin=$12, bill_state=$13, bill_state_code=$14,
          ship_name=$15, ship_address=$16, ship_gstin=$17, ship_state=$18, ship_state_code=$19,
          total_taxable=$20, cgst_amount=$21, sgst_amount=$22, igst_amount=$23,
          total_tax=$24, total_after_tax=$25, amount_in_words=$26,
          bank_name=$27, bank_ac=$28, bank_ifsc=$29, notes=$30, status=$31
       WHERE id=$32`,
      [
        invoice_no, invoice_date || null, transport_mode, vehicle_number,
        reverse_charge, date_of_supply || null, state, state_code, place_of_supply,
        bill_name, bill_address, bill_gstin, bill_state, bill_state_code,
        ship_name, ship_address, ship_gstin, ship_state, ship_state_code,
        totalTaxable, cgstAmt, sgstAmt, igstAmt,
        totalTax, totalAfterTax, toWords(totalAfterTax),
        bank_name, bank_ac, bank_ifsc, notes, status, id
      ]
    );

    // Re-create items
    await client.query('DELETE FROM invoice_items WHERE invoice_id=$1', [id]);
    for (let i = 0; i < items.length; i++) {
      const it  = items[i];
      const amt = parseFloat(it.qty || 0) * parseFloat(it.rate || 0);
      const tv  = amt - parseFloat(it.discount || 0);
      const cA  = (tv * parseFloat(it.cgst_rate || 0)) / 100;
      const sA  = (tv * parseFloat(it.sgst_rate || 0)) / 100;
      const iA  = (tv * parseFloat(it.igst_rate || 0)) / 100;

      await client.query(
        `INSERT INTO invoice_items (invoice_id, sr_no, item_title, product_description, hsn_code,
            qty, rate, amount, discount, taxable_value,
            cgst_rate, cgst_amount, sgst_rate, sgst_amount,
            igst_rate, igst_amount, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [id, i+1, it.item_title||'', it.product_description, it.hsn_code||'',
         it.qty, it.rate, amt, it.discount||0, tv,
         it.cgst_rate||0, it.cgst_amount||cA,
         it.sgst_rate||0, it.sgst_amount||sA,
         it.igst_rate||0, it.igst_amount||iA,
         it.total||(tv+cA+sA+iA)]
      );
    }

    await client.query('COMMIT');
    const updated = await db.query('SELECT * FROM invoices WHERE id=$1', [id]);
    res.json({ success: true, data: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// ── DELETE /api/invoices/:id ────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM invoices WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
