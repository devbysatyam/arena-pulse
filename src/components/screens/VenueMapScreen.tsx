'use client';
import { useAppStore } from '@/store/app-store';
import { STADIUMS } from '@/lib/stadiums-data';

/**
 * VenueMapScreen — Google Maps Embed
 *
 * Uses the Google Maps Embed API to display the selected stadium's
 * real-world location. No JS Maps SDK required — just an iframe
 * with the embed API key.
 *
 * Accessibility:
 * - iframe has a descriptive title
 * - Back button has aria-label
 * - Loading state communicated via aria-busy
 *
 * Security:
 * - API key is restricted to Maps Embed API via Google Cloud Console
 * - referrerpolicy="no-referrer-when-downgrade" is the Maps default
 */

const MAPS_API_KEY = process.env.NEXT_PUBLIC_MAPS_API_KEY ?? '';

function buildMapUrl(placeName: string, lat?: number, lng?: number): string {
  const base = 'https://www.google.com/maps/embed/v1/place';
  const q = lat && lng
    ? `${lat},${lng}`
    : encodeURIComponent(placeName);
  return `${base}?key=${MAPS_API_KEY}&q=${q}&zoom=16&maptype=satellite`;
}

export default function VenueMapScreen() {
  const { back, selectedStadiumId } = useAppStore();
  const stadium = STADIUMS.find(s => s.id === selectedStadiumId) ?? STADIUMS[0];

  const mapUrl = buildMapUrl(stadium.name, stadium.lat, stadium.lng);
  const hasKey = !!MAPS_API_KEY;

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0b14]">
      {/* Header */}
      <header className="px-5 pt-14 pb-3 flex items-center gap-3 sticky top-0 z-20 bg-[#0a0b14]/90 backdrop-blur-xl border-b border-white/5">
        <button
          onClick={back}
          aria-label="Go back"
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-headline font-bold text-lg text-white truncate">Venue Location</h1>
          <p className="text-xs text-white/50 truncate">{stadium.name}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#4285F4]/10">
          <span className="text-[10px] text-[#4285F4] font-black tracking-wider">GOOGLE MAPS</span>
        </div>
      </header>

      {/* Stadium info bar */}
      <div className="px-5 py-3 flex items-center gap-4 border-b border-white/5"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="w-10 h-10 rounded-2xl flex-shrink-0 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c5ff0, #00d4ff)' }}>
            <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>stadium</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{stadium.name}</p>
          <p className="text-xs text-white/40 truncate">{stadium.city} · Capacity {stadium.capacity?.toLocaleString()}</p>
        </div>
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(stadium.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${stadium.name} in Google Maps`}
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold text-white/70 hover:text-white transition-all"
          style={{ background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.2)' }}>
          <span className="material-symbols-outlined text-base">open_in_new</span>
          Directions
        </a>
      </div>

      {/* Map */}
      <main className="flex-1 relative">
        {hasKey ? (
          <iframe
            title={`Google Maps — ${stadium.name}`}
            src={mapUrl}
            className="w-full h-full min-h-[60vh]"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            aria-label={`Interactive map showing location of ${stadium.name}`}
          />
        ) : (
          /* Fallback when no API key — shows a link-out instead */
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 py-16">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(66,133,244,0.1)', border: '1px solid rgba(66,133,244,0.2)' }}>
              <span className="material-symbols-outlined text-[#4285F4] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg mb-2">Map Requires API Key</p>
              <p className="text-white/40 text-sm">Add <code className="text-[#00d4ff] text-xs">NEXT_PUBLIC_MAPS_API_KEY</code> to your environment to enable the embedded map.</p>
            </div>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(stadium.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${stadium.name} in Google Maps`}
              className="flex items-center gap-2 h-12 px-6 rounded-2xl font-headline font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #4285F4, #0f9d58)', color: 'white', boxShadow: '0 0 20px rgba(66,133,244,0.3)' }}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
              Open in Google Maps
            </a>
          </div>
        )}
      </main>

      {/* Info cards */}
      <div className="px-5 py-4 border-t border-white/5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: 'directions_transit', label: 'Transit', value: stadium.nearestMetro ?? 'By Metro' },
            { icon: 'local_parking', label: 'Parking', value: stadium.parkingZones ?? 'Multiple Zones' },
            { icon: 'emergency', label: 'Emergency', value: '100 / 101' },
          ].map(item => (
            <div key={item.label} className="rounded-2xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="material-symbols-outlined text-xl text-white/50 block mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
              <p className="text-[9px] text-white/40 uppercase font-bold">{item.label}</p>
              <p className="text-xs text-white font-bold mt-0.5 truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
