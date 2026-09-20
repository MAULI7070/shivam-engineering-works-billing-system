# 🏭 Shivam Engineering Works — Billing System

A full-stack **Tax Invoice Billing System** with government-style UI, built with:
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express REST API
- **Database:** PostgreSQL

---

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 13+

---

## ⚙️ Database Setup

1. Create the database:
```sql
CREATE DATABASE billing_db;
```

2. Run the migration:
```bash
psql -U postgres -d billing_db -f backend/migrations/001_create_tables.sql
```

---

## 🔧 Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy env file and configure
copy .env.example .env
# Edit .env — set your DB_PASSWORD

# Start server
npm run dev
```

Backend runs at: **http://localhost:5000**

---

## 🎨 Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🚀 Features

| Feature | Description |
|---|---|
| **Dashboard** | List all invoices with search and stats |
| **New Invoice** | Full form with all GST fields from the original invoice |
| **Dynamic Line Items** | Add/remove rows with auto-calculated tax |
| **Bill To / Ship To** | Separate customer and delivery party |
| **Tax Auto-Calc** | CGST + SGST + IGST computed automatically |
| **Amount in Words** | Indian number-to-words conversion |
| **Print** | Browser print with clean A4 layout |
| **PDF Download** | jsPDF + html2canvas PDF generation |
| **PostgreSQL** | All invoices and line items persisted |
| **Edit / Delete** | Full CRUD support |

---

## 📄 Invoice Fields (from scanned image)

- Invoice No, Invoice Date, Transport Mode, Vehicle Number
- Reverse Charge, Date of Supply, State, Code, Place of Supply
- **Bill To:** Name, Address, GSTIN, State, Code
- **Ship To:** Name, Address, GSTIN, State, Code
- **Line Items:** Product Description, HSN Code, Qty, Rate, Amount, Discount, Taxable Value, CGST%, CGST Amt, SGST%, SGST Amt, IGST%, IGST Amt, Total
- Total Taxable, CGST, SGST, Total Tax, Total After Tax
- Amount in Words
- Bank: Name, A/C, IFSC
- Common Seal, Authorised Signatory

---

## 🖨️ Print / PDF

- Click **Print** button on the invoice view page
- Click **Download PDF** to save as `Invoice_SEW-XX.pdf`
- Print layout hides all navigation and shows clean A4 invoice

---

## 🔌 API Endpoints

| Method | URL | Description |
|---|---|---|
| GET | `/api/invoices` | List all invoices |
| GET | `/api/invoices/:id` | Get invoice with line items |
| POST | `/api/invoices` | Create new invoice |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| GET | `/api/health` | Health check |
