'use client'
import * as React from "react"
import { Sidebar } from "../organisms/Sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

const AppLayout = React.forwardRef<HTMLDivElement, AppLayoutProps>(
  ({ children }, ref) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false)

    const toggleSidebar = () => {
      setSidebarOpen(!sidebarOpen)
    }

    const closeSidebar = () => {
      setSidebarOpen(false)
    }

    // Close sidebar on escape key
    React.useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && sidebarOpen) {
          closeSidebar()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [sidebarOpen])

    // Prevent body scroll when sidebar is open on mobile
    React.useEffect(() => {
      if (sidebarOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }

      return () => {
        document.body.style.overflow = 'unset'
      }
    }, [sidebarOpen])

    return (
      <div ref={ref} className="app-layout">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        
        {/* Main Content */}
        <div className="app-main">
          {/* Mobile Header */}
          <div className="mobile-header">
            <button
              className="mobile-menu-btn"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
            <h1 className="mobile-header-title">PERSUITE</h1>
            <div className="mobile-header-spacer"></div>
          </div>
          
          {/* Page Content */}
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    )
  }
)
AppLayout.displayName = "AppLayout"

export { AppLayout }