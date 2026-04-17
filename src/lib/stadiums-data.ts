// Multi-stadium data for Arena Pulse
// 6 real Indian venues with live/upcoming matches

export interface Stadium {
  id: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  country: string;
  capacity: number;
  surface: 'Grass' | 'Hybrid' | 'Artificial';
  sport: 'Cricket' | 'Football' | 'Multi-Sport';
  emoji: string;
  gradient: [string, string];
  description: string;
  openedYear: number;
  gates: number;
  parkingSpots: number;
  lat: number;
  lng: number;
  nearestMetro?: string;
  parkingZones?: string;
}

export interface StadiumMatch {
  id: string;
  stadiumId: string;
  homeTeam: string;
  awayTeam: string;
  homeEmoji: string;
  awayEmoji: string;
  sport: string;
  league: string;
  status: 'live' | 'upcoming' | 'completed';
  score?: string;
  minute?: number;
  date: string;       // readable
  time: string;
  ticketPrice: string;
  attendance?: number;
  capacity: number;
}

// ─── Stadiums ─────────────────────────────────────────────────────────────────

export const STADIUMS: Stadium[] = [
  {
    id: 'nm-stadium',
    name: 'Narendra Modi Stadium',
    shortName: 'NM Stadium',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    capacity: 132000,
    surface: 'Hybrid',
    sport: 'Cricket',
    emoji: '🏏',
    gradient: ['#FF6B35', '#F7C59F'],
    description: "World's largest cricket stadium.",
    openedYear: 2020,
    gates: 16,
    parkingSpots: 3000,
    lat: 23.0900,
    lng: 72.5950,
  },
  {
    id: 'eden-gardens',
    name: 'Eden Gardens',
    shortName: 'Eden Gardens',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    capacity: 68000,
    surface: 'Grass',
    sport: 'Cricket',
    emoji: '🟢',
    gradient: ['#00B4D8', '#90E0EF'],
    description: "India's most iconic cricket ground.",
    openedYear: 1864,
    gates: 12,
    parkingSpots: 1800,
    lat: 22.5645,
    lng: 88.3433,
  },
  {
    id: 'wankhede',
    name: 'Wankhede Stadium',
    shortName: 'Wankhede',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    capacity: 33108,
    surface: 'Grass',
    sport: 'Cricket',
    emoji: '🌊',
    gradient: ['#0077B6', '#48CAE4'],
    description: 'Iconic Mumbai waterfront cricket venue.',
    openedYear: 1974,
    gates: 6,
    parkingSpots: 800,
    lat: 18.9388,
    lng: 72.8251,
  },
  {
    id: 'chinnaswamy',
    name: 'M. Chinnaswamy Stadium',
    shortName: 'Chinnaswamy',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    capacity: 40000,
    surface: 'Grass',
    sport: 'Cricket',
    emoji: '🔴',
    gradient: ['#E63946', '#F4A261'],
    description: 'Bengaluru\'s fortress of cricket.',
    openedYear: 1969,
    gates: 8,
    parkingSpots: 1200,
    lat: 12.9791,
    lng: 77.5996,
  },
  {
    id: 'dy-patil',
    name: 'DY Patil Stadium',
    shortName: 'DY Patil',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    country: 'India',
    capacity: 55000,
    surface: 'Hybrid',
    sport: 'Multi-Sport',
    emoji: '⚽',
    gradient: ['#7C5FF0', '#00D4FF'],
    description: 'Premier multi-sport venue near Mumbai.',
    openedYear: 2008,
    gates: 10,
    parkingSpots: 2500,
    lat: 19.0433,
    lng: 73.0297,
  },
  {
    id: 'sawai-mansingh',
    name: 'Sawai Mansingh Stadium',
    shortName: 'SMS Stadium',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    capacity: 30000,
    surface: 'Grass',
    sport: 'Cricket',
    emoji: '🏰',
    gradient: ['#E9C46A', '#F4A261'],
    description: 'Pink City\'s iconic cricket ground.',
    openedYear: 1969,
    gates: 6,
    parkingSpots: 900,
    lat: 26.8876,
    lng: 75.8069,
  },
];

// ─── Matches ──────────────────────────────────────────────────────────────────

export const STADIUM_MATCHES: StadiumMatch[] = [
  {
    id: 'm1',
    stadiumId: 'nm-stadium',
    homeTeam: 'Gujarat Titans',
    awayTeam: 'Mumbai Indians',
    homeEmoji: '🦅',
    awayEmoji: '🌊',
    sport: 'Cricket',
    league: 'IPL 2026',
    status: 'live',
    score: 'GT 187/4 (18.2)',
    minute: 18,
    date: 'Today',
    time: '19:30',
    ticketPrice: '₹800 – ₹5,000',
    attendance: 128400,
    capacity: 132000,
  },
  {
    id: 'm2',
    stadiumId: 'nm-stadium',
    homeTeam: 'Gujarat Titans',
    awayTeam: 'Chennai Super Kings',
    homeEmoji: '🦅',
    awayEmoji: '🦁',
    sport: 'Cricket',
    league: 'IPL 2026',
    status: 'upcoming',
    date: 'Apr 19',
    time: '19:30',
    ticketPrice: '₹1,000 – ₹8,000',
    capacity: 132000,
  },
  {
    id: 'm3',
    stadiumId: 'eden-gardens',
    homeTeam: 'Kolkata Knight Riders',
    awayTeam: 'Rajasthan Royals',
    homeEmoji: '🐅',
    awayEmoji: '👑',
    sport: 'Cricket',
    league: 'IPL 2026',
    status: 'live',
    score: 'KKR 142/3 (14.0)',
    minute: 14,
    date: 'Today',
    time: '15:30',
    ticketPrice: '₹500 – ₹4,000',
    attendance: 65000,
    capacity: 68000,
  },
  {
    id: 'm4',
    stadiumId: 'wankhede',
    homeTeam: 'Mumbai Indians',
    awayTeam: 'Delhi Capitals',
    homeEmoji: '🌊',
    awayEmoji: '🏛️',
    sport: 'Cricket',
    league: 'IPL 2026',
    status: 'upcoming',
    date: 'Apr 17',
    time: '19:30',
    ticketPrice: '₹1,200 – ₹10,000',
    capacity: 33108,
  },
  {
    id: 'm5',
    stadiumId: 'chinnaswamy',
    homeTeam: 'Royal Challengers',
    awayTeam: 'Punjab Kings',
    homeEmoji: '🔴',
    awayEmoji: '🦁',
    sport: 'Cricket',
    league: 'IPL 2026',
    status: 'upcoming',
    date: 'Apr 18',
    time: '19:30',
    ticketPrice: '₹700 – ₹6,000',
    capacity: 40000,
  },
  {
    id: 'm6',
    stadiumId: 'dy-patil',
    homeTeam: 'Mumbai City FC',
    awayTeam: 'Bengaluru FC',
    homeEmoji: '🌊',
    awayEmoji: '🔵',
    sport: 'Football',
    league: 'ISL 2026',
    status: 'live',
    score: 'MCFC 1 – 0 BFC',
    minute: 67,
    date: 'Today',
    time: '18:00',
    ticketPrice: '₹300 – ₹2,000',
    attendance: 48200,
    capacity: 55000,
  },
  {
    id: 'm7',
    stadiumId: 'sawai-mansingh',
    homeTeam: 'Rajasthan Royals',
    awayTeam: 'Sunrisers Hyderabad',
    homeEmoji: '👑',
    awayEmoji: '🌅',
    sport: 'Cricket',
    league: 'IPL 2026',
    status: 'upcoming',
    date: 'Apr 20',
    time: '15:30',
    ticketPrice: '₹400 – ₹3,000',
    capacity: 30000,
  },
  {
    id: 'm8',
    stadiumId: 'dy-patil',
    homeTeam: 'Indian National Team',
    awayTeam: 'Saudi Arabia',
    homeEmoji: '🇮🇳',
    awayEmoji: '🇸🇦',
    sport: 'Football',
    league: 'FIFA WC Qualifier',
    status: 'upcoming',
    date: 'Apr 22',
    time: '20:00',
    ticketPrice: '₹500 – ₹5,000',
    capacity: 55000,
  },
];

// ─── Filter helpers ───────────────────────────────────────────────────────────

export const STATES = [...new Set(STADIUMS.map(s => s.state))].sort();
export const CITIES = [...new Set(STADIUMS.map(s => s.city))].sort();

export function getStadiumById(id: string): Stadium | undefined {
  return STADIUMS.find(s => s.id === id);
}

export function getMatchesForStadium(stadiumId: string): StadiumMatch[] {
  return STADIUM_MATCHES.filter(m => m.stadiumId === stadiumId);
}

export function getLiveMatchForStadium(stadiumId: string): StadiumMatch | undefined {
  return STADIUM_MATCHES.find(m => m.stadiumId === stadiumId && m.status === 'live');
}

export function filterStadiums(stateFilter: string, cityFilter: string, statusFilter: 'all' | 'live' | 'upcoming') {
  return STADIUMS.filter(s => {
    if (stateFilter && s.state !== stateFilter) return false;
    if (cityFilter && s.city !== cityFilter) return false;
    if (statusFilter === 'live') {
      return STADIUM_MATCHES.some(m => m.stadiumId === s.id && m.status === 'live');
    }
    if (statusFilter === 'upcoming') {
      return STADIUM_MATCHES.some(m => m.stadiumId === s.id && m.status === 'upcoming');
    }
    return true;
  });
}
