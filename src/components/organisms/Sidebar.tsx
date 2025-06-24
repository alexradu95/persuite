'use client'
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  name: string
  href: string
  icon: string
  description: string
}

const navItems: NavItem[] = [
  {
    name: "Income",
    href: "/income",
    icon: "💰",
    description: "Track work days and earnings"
  },
  {
    name: "Wealth",
    href: "/wealth", 
    icon: "📈",
    description: "Monitor assets and net worth"
  }
]

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ isOpen, onClose }, ref) => {
    const pathname = usePathname()

    return (
      <>
        {/* Mobile Overlay */}
        <div 
          className={`sidebar-overlay ${isOpen ? 'sidebar-overlay-open' : ''}`}
          onClick={onClose}
        />
        
        {/* Sidebar Container */}
        <div
          ref={ref}
          className={`sidebar-container ${isOpen ? 'sidebar-open' : ''}`}
        >
          {/* Sidebar Header */}
          <div className="sidebar-header">
            <h1 className="sidebar-title">PERSUITE</h1>
            <p className="sidebar-subtitle">Personal Finance Suite</p>
            <button
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            <ul>
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`sidebar-nav-item ${
                        isActive ? 'sidebar-nav-item-active' : ''
                      }`}
                    >
                      <div className="nav-item-content">
                        <span className="nav-item-icon">{item.icon}</span>
                        <div className="nav-item-text">
                          <h3 className="nav-item-title">{item.name}</h3>
                          <p className="nav-item-description">{item.description}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <div className="text-xs font-bold opacity-60">
              v1.0.0 • Built with Neo-Brutalism
            </div>
          </div>
        </div>
      </>
    )
  }
)
Sidebar.displayName = "Sidebar"

export { Sidebar }
export type { NavItem }