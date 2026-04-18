import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- NEW: Define the exact shape of your Admin User ---
export interface AdminUser {
    email: string;
    role: string;
    token: string;     // <-- The missing token!
    name?: string;     // Optional, matches backend
    username?: string; // Optional, matches backend
}

// 1. Define the shape of your Admin State
interface AdminState {
  // UI Preferences
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarState: (isCollapsed: boolean) => void;

  // Global Context & Filters
  globalDateRange: { from: Date | null; to: Date | null };
  setDateRange: (range: { from: Date | null; to: Date | null }) => void;

  // Admin Profile (Populated after login/fetch)
  adminUser: AdminUser | null;                    // <-- UPDATED to use the new interface
  setAdminUser: (user: AdminUser | null) => void; // <-- UPDATED to use the new interface
  
  // Quick reset for logging out
  clearStore: () => void;
}

// 2. Create the Store with Persistence
export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      // Initial States
      isSidebarCollapsed: false,
      globalDateRange: { from: null, to: null },
      adminUser: null,

      // Actions (Mutators)
      toggleSidebar: () => 
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
        
      setSidebarState: (isCollapsed) => 
        set({ isSidebarCollapsed: isCollapsed }),

      setDateRange: (range) => 
        set({ globalDateRange: range }),

      setAdminUser: (user) => 
        set({ adminUser: user }),

      clearStore: () => 
        set({
          adminUser: null,
          globalDateRange: { from: null, to: null },
          isSidebarCollapsed: false, // reset to default
        }),
    }),
    {
      name: 'robotmarketplace-admin-storage', // The name of the key in localStorage
      // We only want to persist UI preferences, not sensitive user data or temporary date ranges
      partialize: (state) => ({ 
        isSidebarCollapsed: state.isSidebarCollapsed,
        adminUser: state.adminUser
        // NOTE: Because adminUser isn't listed here, they will have to log in again if they close the tab.
        // If you want them to stay logged in across tab closes, add `adminUser: state.adminUser` here!
      }),
    }
  )
);