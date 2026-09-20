import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Dashboard     from './pages/Dashboard.jsx'
import CreateInvoice from './pages/CreateInvoice.jsx'
import ViewInvoice   from './pages/ViewInvoice.jsx'
import EditInvoice   from './pages/EditInvoice.jsx'
import Calculator    from './pages/Calculator.jsx'
import Navbar        from './components/Navbar.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          <Route path="/"                   element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"          element={<Dashboard />} />
          <Route path="/invoices/new"       element={<CreateInvoice />} />
          <Route path="/invoices/:id"       element={<ViewInvoice />} />
          <Route path="/invoices/:id/edit"  element={<EditInvoice />} />
          <Route path="/calculator"         element={<Calculator />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
