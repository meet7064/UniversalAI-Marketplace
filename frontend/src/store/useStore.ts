import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// --- TYPES & INTERFACES ---
export interface User {
    name: string;
    username: string;
    email: string;
    role: string;
    token: string; // We store the JWT here so API calls can grab it easily
}

export interface CartItem {
    id: string;
    name: string;
    price: number;
    category: string; // e.g., "Buy", "Rent", "Accessory"
    image?: string;   // UPDATED: Changed from image_url to match the CartPage UI
    quantity: number; 
    rentDuration?: number; 
    rentPeriod?: string;
}

interface AppState {
    // 1. Auth State
    user: User | null;
    isAuthenticated: boolean;
    login: (userData: User) => void;
    logout: () => void;

    // 2. Cart State
    cart: CartItem[];
    // UPDATED: Makes quantity optional. Defaults to 1, but allows bulk adds.
    addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
}

// --- ZUSTAND STORE IMPLEMENTATION ---
export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            // --- AUTHENTICATION ---
            user: null,
            isAuthenticated: false,
            
            login: (userData) => set({ 
                user: userData, 
                isAuthenticated: true 
            }),
            
            logout: () => set({ 
                user: null, 
                isAuthenticated: false,
                cart: [] // Clear cart when they log out for security
            }),

            // --- CART LOGIC ---
            cart: [],
            
            addToCart: (item) => set((state) => {
                const quantityToAdd = item.quantity || 1; // Default to 1 if not provided
                const existingItem = state.cart.find((c) => c.id === item.id);
                
                if (existingItem) {
                    // If it's already in the cart, increase the quantity safely
                    return {
                        cart: state.cart.map((c) =>
                            c.id === item.id ? { ...c, quantity: c.quantity + quantityToAdd } : c
                        ),
                    };
                }
                // Otherwise, add it as a new item
                return { cart: [...state.cart, { ...item, quantity: quantityToAdd }] };
            }),

            removeFromCart: (id) => set((state) => ({
                cart: state.cart.filter((item) => item.id !== id)
            })),

            updateQuantity: (id, quantity) => set((state) => ({
                cart: state.cart.map((item) => 
                    item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
                )
            })),

            clearCart: () => set({ cart: [] }),

            getCartTotal: () => {
                const { cart } = get();
                return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
            }
        }),
        {
            name: "robostore-client-state", // The key it will use in localStorage
            storage: createJSONStorage(() => localStorage), 
            // We only persist the user and the cart. Functions aren't persisted.
            partialize: (state) => ({ 
                user: state.user, 
                isAuthenticated: state.isAuthenticated, 
                cart: state.cart 
            }),
        }
    )
);