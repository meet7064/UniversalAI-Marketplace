import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  adminUser: { email: string; role: string } | null;
  setAdminUser: (user: { email: string; role: string } | null) => void;
  
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
        isSidebarCollapsed: state.isSidebarCollapsed 
      }),
    }
  )
);