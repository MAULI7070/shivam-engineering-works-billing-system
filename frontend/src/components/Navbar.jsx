import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FilePlus2, Calculator } from 'lucide-react'

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <header className="no-print">
      <div className="bg-govt-amber h-1.5 w-full" />
      <div className="bg-govt-navy text-white px-4 py-3 flex items-center gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow">
            <span className="text-govt-navy font-black text-lg leading-none">SEW</span>
          </div>
          <div>
            <div className="font-bold text-base leading-tight tracking-wide">SHIVAM ENGINEERING WORKS</div>
            <div className="text-blue-200 text-xs">A-14/8, Opp. Sidhi Forge, MIDC, Ahmednagar – 414111</div>
            <div className="text-blue-200 text-xs">GSTIN: 27AEMPN1799P1ZF | Tel: +91 9880649658</div>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-govt-amber font-semibold text-sm uppercase tracking-wider">Tax Invoice</div>
          <div className="text-blue-200 text-xs">Billing Management System</div>
        </div>
      </div>

      <nav className="bg-govt-blue text-white flex items-center gap-1 px-4 py-1.5 text-sm shadow">
        <NavLink to="/dashboard"    active={pathname === '/dashboard'}>
          <LayoutDashboard size={15} /> Dashboard
        </NavLink>
        <NavLink to="/invoices/new" active={pathname === '/invoices/new'}>
          <FilePlus2 size={15} /> New Invoice
        </NavLink>
        <NavLink to="/calculator"   active={pathname === '/calculator'}>
          <Calculator size={15} /> Grinding &amp; Milling
        </NavLink>
      </nav>
      <div className="h-0.5 bg-govt-amber" />
    </header>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-colors ${
        active ? 'bg-govt-amber text-govt-navy' : 'hover:bg-blue-700 text-white'
      }`}
    >
      {children}
    </Link>
  )
}
