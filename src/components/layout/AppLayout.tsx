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
      <div ref={ref} className="flex h-screen bg-white">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b-[5px] border-black bg-amber-400 sticky top-0 z-30 md:hidden">
            <button
              className="flex flex-col justify-center items-center bg-black border-none cursor-pointer gap-1 w-8 h-8 transition-all duration-200 hover:bg-gray-800 hover:scale-105 active:scale-95"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <span className="w-4 h-0.5 bg-white transition-all duration-200"></span>
              <span className="w-4 h-0.5 bg-white transition-all duration-200"></span>
              <span className="w-4 h-0.5 bg-white transition-all duration-200"></span>
            </button>
            <h1 
              className="text-lg font-black uppercase tracking-wide m-0 text-black"
              style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
            >
              PERSUITE
            </h1>
            <div className="w-8"></div>
          </div>
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-white">
            {children}
          </main>
        </div>
      </div>
    )
  }
)
AppLayout.displayName = "AppLayout"

export { AppLayout }