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
          className={`fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 z-40 transition-all duration-200 md:hidden ${
            isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          onClick={onClose}
        />
        
        {/* Sidebar Container */}
        <div
          ref={ref}
          className={`flex flex-col h-screen bg-white border-r-[5px] border-black transition-transform duration-300 flex-shrink-0 
            fixed top-0 left-0 z-50 md:relative md:z-auto
            ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          `}
          style={{ 
            width: '280px',
          }}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b-[5px] border-black bg-amber-400 relative">
            <h1 
              className="text-2xl font-black uppercase tracking-wide m-0 text-black"
              style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
            >
              PERSUITE
            </h1>
            <p 
              className="text-xs font-bold uppercase tracking-wide mt-1 mb-0 opacity-80 text-black"
              style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
            >
              Personal Finance Suite
            </p>
            <button
              className="absolute top-4 right-4 bg-black text-white border-none w-8 h-8 flex items-center justify-center cursor-pointer font-black text-lg transition-all duration-100 hover:bg-red-500 hover:scale-110 md:hidden"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-6 flex-1 overflow-y-auto">
            <ul className="list-none p-0 m-0">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const baseClasses = "block p-4 border-[3px] border-black bg-white text-black cursor-pointer relative overflow-hidden no-underline transition-all duration-200 mb-2"
                const activeClasses = isActive 
                  ? "bg-black text-white transform -translate-x-0.5 -translate-y-0.5" 
                  : "hover:bg-amber-400 hover:transform hover:-translate-x-0.75 hover:-translate-y-0.75"
                
                const shadowStyle = isActive 
                  ? { boxShadow: '6px 6px 0px #10b981' }
                  : { boxShadow: '6px 6px 0px #000000' }
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`${baseClasses} ${activeClasses}`}
                      style={shadowStyle}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl flex-shrink-0">{item.icon}</span>
                        <div className="flex-1">
                          <h3 
                            className="font-black text-lg m-0 leading-tight"
                            style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
                          >
                            {item.name}
                          </h3>
                          <p className="text-xs opacity-70 mt-1 mb-0 leading-tight">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 px-6 border-t-[3px] border-black bg-gray-100 text-center">
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