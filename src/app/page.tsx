'use client';
import { useEffect } from 'react';
import type { ComponentType } from 'react';
import { useAppStore, type Screen } from '@/store/app-store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import SplashScreen          from '@/components/screens/SplashScreen';
import WelcomeScreen         from '@/components/screens/WelcomeScreen';
import AuthScreen            from '@/components/screens/AuthScreen';
import HomeScreen            from '@/components/screens/HomeScreen';
import Map2DScreen           from '@/components/screens/Map2DScreen';
import HeatmapScreen         from '@/components/screens/HeatmapScreen';
import Stadium3DScreen       from '@/components/screens/Stadium3DScreen';
import ARNavScreen           from '@/components/screens/ARNavScreen';
import TicketScreen          from '@/components/screens/TicketScreen';
import FoodScreen            from '@/components/screens/FoodScreen';
import StallMenuScreen       from '@/components/screens/StallMenuScreen';
import CartScreen            from '@/components/screens/CartScreen';
import OrderTrackScreen      from '@/components/screens/OrderTrackScreen';
import AmenitiesScreen       from '@/components/screens/AmenitiesScreen';
import ExitPlanScreen        from '@/components/screens/ExitPlanScreen';
import AdminScreen           from '@/components/screens/AdminScreen';
import ProfileScreen         from '@/components/screens/ProfileScreen';
import StadiumBrowserScreen  from '@/components/screens/StadiumBrowserScreen';
import StadiumDetailScreen   from '@/components/screens/StadiumDetailScreen';
import AdminLoginScreen      from '@/components/screens/AdminLoginScreen';
import VenueMapScreen        from '@/components/screens/VenueMapScreen';
import BottomNav             from '@/components/layout/BottomNav';
import AIBubble              from '@/components/ai/AIBubble';
import AISheet               from '@/components/ai/AISheet';
import Toast                 from '@/components/ui/Toast';

// Declarative map keeps screen→component co-located; adding a new screen requires
// one entry here plus a type union update in app-store — nothing else.
const SCREEN_MAP: Record<Screen, ComponentType> = {
  splash:         SplashScreen,
  welcome:        WelcomeScreen,
  auth:           AuthScreen,
  home:           HomeScreen,
  map2d:          Map2DScreen,
  heatmap:        HeatmapScreen,
  stadium3d:      Stadium3DScreen,
  'ar-nav':       ARNavScreen,
  ticket:         TicketScreen,
  food:           FoodScreen,
  'stall-menu':   StallMenuScreen,
  cart:           CartScreen,
  'order-track':  OrderTrackScreen,
  amenities:      AmenitiesScreen,
  'exit-plan':    ExitPlanScreen,
  admin:          AdminScreen,
  profile:        ProfileScreen,
  stadiums:       StadiumBrowserScreen,
  'stadium-detail': StadiumDetailScreen,
  'admin-login':  AdminLoginScreen,
  'venue-map':    VenueMapScreen,
};

const SCREENS_WITH_NAV = new Set<Screen>([
  'home', 'map2d', 'heatmap', 'stadium3d', 'food', 'stall-menu',
  'cart', 'amenities', 'exit-plan', 'ticket', 'stadiums',
  'stadium-detail', 'profile', 'venue-map',
]);

const SCREENS_WITHOUT_AI_BUBBLE = new Set<Screen>([
  'splash', 'welcome', 'auth', 'ar-nav', 'order-track', 'admin', 'admin-login',
]);

export default function App() {
  const { screen, tickCrowd } = useAppStore();

  useKeyboardShortcuts();

  useEffect(() => {
    const timer = setInterval(tickCrowd, 15000);
    return () => clearInterval(timer);
  }, [tickCrowd]);

  const CurrentScreen = SCREEN_MAP[screen];
  const isAdminScreen = screen === 'admin';

  return (
    <main
      className={`relative w-full min-h-dvh overflow-x-hidden bg-[#0a0b14] flex justify-center ${
        isAdminScreen ? '' : 'sm:py-4 sm:bg-black/90'
      }`}
    >
      <div
        className={`relative w-full min-h-dvh bg-[#0a0b14] ${
          isAdminScreen
            ? ''
            : 'max-w-[430px] sm:min-h-[844px] sm:h-[844px] sm:rounded-[2rem] sm:overflow-hidden sm:shadow-[0_0_50px_rgba(0,212,255,0.15)] sm:border sm:border-white/10'
        }`}
      >
        <CurrentScreen />

        {SCREENS_WITH_NAV.has(screen) && <BottomNav />}
        {!SCREENS_WITHOUT_AI_BUBBLE.has(screen) && <AIBubble />}

        <AISheet />
        <Toast />
      </div>
    </main>
  );
}
