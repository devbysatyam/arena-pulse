'use client';
import { create } from 'zustand';
import { routeBetween } from '@/lib/pathfinding';

export type Screen =
  | 'splash'  | 'welcome'  | 'auth'
  | 'home'    | 'map2d'    | 'heatmap'   | 'stadium3d'
  | 'ar-nav'  | 'ticket'   | 'food'      | 'stall-menu'
  | 'cart'    | 'order-track' | 'amenities' | 'exit-plan'
  | 'admin'   | 'profile'
  | 'stadiums' | 'stadium-detail' | 'admin-login' | 'venue-map';


export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  stallId: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'placed' | 'preparing' | 'ready' | 'collected';
  stallLabel: string;
  placedAt: Date;
  readyAt?: Date;
}

export interface User {
  uid: string;
  name: string;
  email?: string;
  avatar?: string;
  isGuest: boolean;
  hasTicker: boolean;
}

export interface AppState {
  // Navigation
  screen: Screen;
  prevScreen: Screen | null;
  navigate: (s: Screen) => void;
  back: () => void;

  // Auth
  user: User | null;
  isLoggedIn: boolean;
  loginAsGuest: () => void;
  loginUser: (u: User) => void;
  logout: () => void;

  // UI
  showAISheet: boolean;
  aiSheetOpen: () => void;
  aiSheetClose: () => void;
  showNav: boolean;
  setShowNav: (v: boolean) => void;

  // Food / Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem,'qty'>) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  activeOrder: Order | null;
  setActiveOrder: (o: Order | null) => void;

  // Navigation state
  navFrom: string;
  navTo: string;
  navRoute: any | null;
  setNavRoute: (from: string, to: string) => void;
  isNavigating: boolean;
  setNavigating: (v: boolean) => void;

  // Map state
  selectedSection: string | null;
  setSelectedSection: (s: string | null) => void;
  mapMode: '2d' | '3d' | 'ar' | 'heatmap';
  setMapMode: (m: '2d' | '3d' | 'ar' | 'heatmap') => void;

  // Crowd simulation tick
  crowdTick: number;
  tickCrowd: () => void;

  // Selected amenity
  selectedAmenity: string | null;
  setSelectedAmenity: (id: string | null) => void;

  // Ticket status
  ticketScanned: boolean;
  setTicketScanned: (v: boolean) => void;

  // Admin mode
  isAdmin: boolean;
  setAdmin: (v: boolean) => void;
  adminUser: { uid: string; email: string } | null;
  setAdminUser: (u: { uid: string; email: string } | null) => void;


  // AI messages
  aiMessages: { role: 'user' | 'ai'; text: string }[];
  addAiMessage: (m: { role: 'user' | 'ai'; text: string }) => void;
  clearAiMessages: () => void;

  // Multi-stadium
  selectedStadiumId: string | null;
  setSelectedStadiumId: (id: string | null) => void;

  // Notifications (admin broadcast → fan inbox)
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'ts' | 'read'>) => void;
  markNotificationsRead: () => void;
  unreadCount: () => number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  priority: 'info' | 'warning' | 'critical';
  targetStadiumId: string | null; // null = all stadiums
  ts: number;
  read: boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── Navigation ────────────────────────────────────────
  screen: 'splash',
  prevScreen: null,
  navigate: (s) => set(st => ({ screen: s, prevScreen: st.screen })),
  back: () => {
    const prev = get().prevScreen;
    if (prev) set({ screen: prev, prevScreen: null });
  },

  // ── Auth ──────────────────────────────────────────────
  user: null,
  isLoggedIn: false,
  loginAsGuest: () => set({
    user: { uid:'guest', name:'Guest Fan', isGuest:true, hasTicker:false },
    isLoggedIn: true,
    showNav: true,
    screen: 'home',
  }),
  loginUser: (u) => set({
    user: u,
    isLoggedIn: true,
    showNav: true,
    screen: 'home',
  }),
  logout: () => set({
    user: null,
    isLoggedIn: false,
    screen: 'welcome',
    showNav: false,
    cart: [],
    activeOrder: null,
    ticketScanned: false,
  }),

  // ── UI ────────────────────────────────────────────────
  showAISheet: false,
  aiSheetOpen:  () => set({ showAISheet: true }),
  aiSheetClose: () => set({ showAISheet: false }),
  showNav: false,
  setShowNav: (v) => set({ showNav: v }),

  // ── Cart ──────────────────────────────────────────────
  cart: [],
  addToCart: (item) => set(st => {
    const found = st.cart.find(c => c.id === item.id);
    if (found) return { cart: st.cart.map(c => c.id===item.id ? { ...c, qty: c.qty+1 } : c) };
    return { cart: [...st.cart, { ...item, qty: 1 }] };
  }),
  removeFromCart: (id) => set(st => ({ cart: st.cart.filter(c => c.id!==id) })),
  updateQty: (id, delta) => set(st => ({
    cart: st.cart.map(c => c.id===id ? { ...c, qty: Math.max(0, c.qty+delta) } : c)
          .filter(c => c.qty > 0),
  })),
  clearCart: () => set({ cart: [] }),
  cartTotal: () => get().cart.reduce((acc, c) => acc + c.price * c.qty, 0),
  activeOrder: null,
  setActiveOrder: (o) => set({ activeOrder: o }),

  // ── Navigation ────────────────────────────────────────
  navFrom: 'GC',
  navTo:   'SA2',
  navRoute: routeBetween('GC', 'SA2'),
  setNavRoute: (from, to) => set({ 
    navFrom: from, 
    navTo: to,
    navRoute: routeBetween(from, to)
  }),
  isNavigating: false,
  setNavigating: (v) => set({ isNavigating: v }),

  // ── Map ───────────────────────────────────────────────
  selectedSection: null,
  setSelectedSection: (s) => set({ selectedSection: s }),
  mapMode: '2d',
  setMapMode: (m) => set({ mapMode: m }),

  // ── Crowd ─────────────────────────────────────────────
  crowdTick: 0,
  tickCrowd: () => set(st => ({ crowdTick: st.crowdTick + 1 })),

  // ── Amenity ───────────────────────────────────────────
  selectedAmenity: null,
  setSelectedAmenity: (id) => set({ selectedAmenity: id }),

  // ── Ticket ────────────────────────────────────────────
  ticketScanned: false,
  setTicketScanned: (v) => set({ ticketScanned: v }),

  // ── Admin ─────────────────────────────────────────────
  isAdmin: false,
  adminUser: null,
  setAdmin: (v) => set((st) => ({
    isAdmin: v,
    showNav: v ? false : st.showNav,
    screen:  v ? 'admin' : st.prevScreen ?? 'home',
  })),
  setAdminUser: (u) => set({ adminUser: u }),

  // ── AI ────────────────────────────────────────────────
  aiMessages: [
    { role: 'ai', text: '👋 I\'m Arena AI! Ask me anything — where\'s your seat, nearest WC, food recommendations, or live match updates.' }
  ],
  addAiMessage: (m) => set(st => ({ aiMessages: [...st.aiMessages, m] })),
  clearAiMessages: () => set({ aiMessages: [] }),

  // ── Multi-stadium ─────────────────────────────────────
  selectedStadiumId: 'nm-stadium',
  setSelectedStadiumId: (id) => set({ selectedStadiumId: id }),

  // ── Notifications ─────────────────────────────────────
  notifications: [
    {
      id: 'n-welcome',
      title: 'Welcome to Arena Pulse 🏟️',
      body: 'Your AI-powered stadium companion is ready. Explore the 3D map, order food, and navigate to your seat!',
      priority: 'info',
      targetStadiumId: null,
      ts: Date.now() - 120000,
      read: false,
    },
  ],
  addNotification: (n) => set(st => ({
    notifications: [
      { ...n, id: `notif-${Date.now()}`, ts: Date.now(), read: false },
      ...st.notifications,
    ],
  })),
  markNotificationsRead: () => set(st => ({
    notifications: st.notifications.map(n => ({ ...n, read: true })),
  })),
  unreadCount: () => get().notifications.filter(n => !n.read).length,
}));
