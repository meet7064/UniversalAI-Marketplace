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
    image_url?: string;
    quantity: number; 
}

interface AppState {
    // 1. Auth State
    user: User | null;
    isAuthenticated: boolean;
    login: (userData: User) => void;
    logout: () => void;

    // 2. Cart State
    cart: CartItem[];
    addToCart: (item: Omit<CartItem, "quantity">) => void;
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
                cart: [] // Optional: clear cart when they log out for security
            }),

            // --- CART LOGIC ---
            cart: [],
            
            addToCart: (item) => set((state) => {
                const existingItem = state.cart.find((c) => c.id === item.id);
                
                if (existingItem) {
                    // If it's already in the cart, just increase the quantity
                    return {
                        cart: state.cart.map((c) =>
                            c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
                        ),
                    };
                }
                // Otherwise, add it as a new item with quantity 1
                return { cart: [...state.cart, { ...item, quantity: 1 }] };
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
            name: "vshop-client-state", // The key it will use in localStorage
            storage: createJSONStorage(() => localStorage), 
            // We only persist the user and the cart. Functions aren't persisted.
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, cart: state.cart }),
        }
    )
);