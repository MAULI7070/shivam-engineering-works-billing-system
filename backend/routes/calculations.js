const express = require('express')
const router  = express.Router()
const db      = require('../db')

// POST /api/calculations — save one or many calculations
router.post('/', async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body]
    const saved = []
    for (const c of items) {
      const r = await db.query(
        `INSERT INTO calculations
          (type, description, side1, side2, side3, rupees, formula, part1, part2, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          c.type || 'Grinding',
          c.description || '',
          c.side1 || 0, c.side2 || 0, c.side3 || 0,
          c.rupees || 0,
          c.formula || '',
          c.part1 || 0, c.part2 || 0,
          c.total || 0
        ]
      )
      saved.push(r.rows[0])
    }
    res.status(201).json({ success: true, data: saved })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/calculations — list all (most recent first)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100
    const type  = req.query.type
    const where = type ? `WHERE type = $1` : ''
    const params = type ? [type] : []
    const r = await db.query(
      `SELECT * FROM calculations ${where} ORDER BY created_at DESC LIMIT ${limit}`,
      params
    )
    res.json({ success: true, data: r.rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/calculations/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM calculations WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
