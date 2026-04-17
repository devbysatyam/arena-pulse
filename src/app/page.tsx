'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import SplashScreen     from '@/components/screens/SplashScreen';
import WelcomeScreen    from '@/components/screens/WelcomeScreen';
import AuthScreen       from '@/components/screens/AuthScreen';
import HomeScreen       from '@/components/screens/HomeScreen';
import Map2DScreen      from '@/components/screens/Map2DScreen';
import HeatmapScreen    from '@/components/screens/HeatmapScreen';
import Stadium3DScreen  from '@/components/screens/Stadium3DScreen';
import ARNavScreen      from '@/components/screens/ARNavScreen';
import TicketScreen     from '@/components/screens/TicketScreen';
import FoodScreen       from '@/components/screens/FoodScreen';
import StallMenuScreen  from '@/components/screens/StallMenuScreen';
import CartScreen       from '@/components/screens/CartScreen';
import OrderTrackScreen from '@/components/screens/OrderTrackScreen';
import AmenitiesScreen  from '@/components/screens/AmenitiesScreen';
import ExitPlanScreen   from '@/components/screens/ExitPlanScreen';
import AdminScreen      from '@/components/screens/AdminScreen';
import ProfileScreen    from '@/components/screens/ProfileScreen';
import StadiumBrowserScreen from '@/components/screens/StadiumBrowserScreen';
import StadiumDetailScreen  from '@/components/screens/StadiumDetailScreen';
import AdminLoginScreen from '@/components/screens/AdminLoginScreen';
import VenueMapScreen   from '@/components/screens/VenueMapScreen';
import BottomNav        from '@/components/layout/BottomNav';
import AIBubble         from '@/components/ai/AIBubble';
import AISheet          from '@/components/ai/AISheet';
import Toast            from '@/components/ui/Toast';

const SCREENS_WITH_NAV = new Set([
  'home','map2d','heatmap','stadium3d','food','stall-menu','cart','amenities','exit-plan','ticket','stadiums','stadium-detail','profile','venue-map'
]);
const NO_NAV_SCREENS = new Set([
  'splash','welcome','auth','ar-nav','order-track','admin','admin-login'
]);

export default function App() {
  const { screen, showNav, crowdTick, tickCrowd, showAISheet } = useAppStore();

  // Simulate crowd updates every 15s
  useEffect(() => {
    const timer = setInterval(tickCrowd, 15000);
    return () => clearInterval(timer);
  }, [tickCrowd]);

  const showNavBar = SCREENS_WITH_NAV.has(screen);
  const showAIBubble = !NO_NAV_SCREENS.has(screen);

  return (
    <main className={`relative w-full min-h-dvh overflow-x-hidden bg-[#0a0b14] flex justify-center ${screen !== 'admin' ? 'sm:py-4 sm:bg-black/90' : ''}`}>
      {/* Screen Renderer */}
      <div className={`relative w-full min-h-dvh bg-[#0a0b14] ${screen !== 'admin' ? 'max-w-[430px] sm:min-h-[844px] sm:h-[844px] sm:rounded-[2rem] sm:overflow-hidden sm:shadow-[0_0_50px_rgba(0,212,255,0.15)] sm:border sm:border-white/10' : ''}`}>
        {screen === 'splash'      && <SplashScreen />}
        {screen === 'welcome'     && <WelcomeScreen />}
        {screen === 'auth'        && <AuthScreen />}
        {screen === 'home'        && <HomeScreen />}
        {screen === 'map2d'       && <Map2DScreen />}
        {screen === 'heatmap'     && <HeatmapScreen />}
        {screen === 'stadium3d'   && <Stadium3DScreen />}
        {screen === 'ar-nav'      && <ARNavScreen />}
        {screen === 'ticket'      && <TicketScreen />}
        {screen === 'food'        && <FoodScreen />}
        {screen === 'stall-menu'  && <StallMenuScreen />}
        {screen === 'cart'        && <CartScreen />}
        {screen === 'order-track' && <OrderTrackScreen />}
        {screen === 'amenities'   && <AmenitiesScreen />}
        {screen === 'exit-plan'   && <ExitPlanScreen />}
        {screen === 'admin'         && <AdminScreen />}
        {screen === 'profile'        && <ProfileScreen />}
        {screen === 'stadiums'       && <StadiumBrowserScreen />}
        {screen === 'stadium-detail' && <StadiumDetailScreen />}
        {screen === 'admin-login'    && <AdminLoginScreen />}
        {screen === 'venue-map'       && <VenueMapScreen />}
      
        {/* Bottom Nav */}
        {showNavBar && <BottomNav />}

        {/* AI Floating Button */}
        {showAIBubble && <AIBubble />}

        {/* AI Sheet Overlay */}
        <AISheet />

        {/* Toast */}
        <Toast />
      </div>
    </main>
  );
}
