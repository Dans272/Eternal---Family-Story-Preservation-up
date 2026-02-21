
import React from 'react';
import { 
  Sparkles, Disc, Heart, MapPin, ScrollText, Anchor, Map as MapIcon, History 
} from 'lucide-react';

export const STORAGE_KEYS = {
  // These keys are kept for any residual migration tooling.
  // The app itself no longer reads or writes localStorage for auth or data.
  PROFILES: 'eternal_profiles',
  FAMILY_TREES: 'eternal_family_trees',
  REMEMBERED_EMAIL: 'eternal_remembered_email',
  CIRCLE_POSTS: 'eternal_circle_posts',
};

export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// Archival Silhouette Placeholders
const PLACEHOLDERS = {
  M: `data:image/svg+xml;utf8,${encodeURIComponent('<svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#D4CBB9"/><path d="M200 120C222.091 120 240 137.909 240 160C240 182.091 222.091 200 200 200C177.909 200 160 182.091 160 160C160 137.909 177.909 120 200 120ZM200 220C255.228 220 300 255.82 300 300V320H100V300C100 255.82 144.772 220 200 220Z" fill="#1C1917" fill-opacity="0.15"/></svg>')}`,
  F: `data:image/svg+xml;utf8,${encodeURIComponent('<svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#D4CBB9"/><path d="M200 110C219.33 110 235 125.67 235 145C235 164.33 219.33 180 200 180C180.67 180 165 164.33 165 145C165 125.67 180.67 110 200 110ZM200 200C244.183 200 280 235.817 280 280C280 290 280 305 280 320H120C120 305 120 290 120 280C120 235.817 155.817 200 200 200Z" fill="#1C1917" fill-opacity="0.15"/></svg>')}`,
  U: `data:image/svg+xml;utf8,${encodeURIComponent('<svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#D4CBB9"/><circle cx="200" cy="150" r="45" fill="#1C1917" fill-opacity="0.15"/><path d="M110 320C110 270 150.294 230 200 230C249.706 230 290 270 290 320H110Z" fill="#1C1917" fill-opacity="0.15"/></svg>')}`
};

export const getPlaceholderImage = (gender?: string) => {
  if (gender === 'M') return PLACEHOLDERS.M;
  if (gender === 'F') return PLACEHOLDERS.F;
  return PLACEHOLDERS.U;
};

export type EventIconProps = { size?: number; className?: string };

const iconMap: Record<string, React.FC<EventIconProps>> = {
  'Birth':                (p) => <Sparkles  {...p} className="text-amber-500" />,
  'Death':                (p) => <Disc      {...p} className="text-stone-400" />,
  'Marriage':             (p) => <Heart     {...p} className="text-rose-400" />,
  'Residence':            (p) => <MapPin    {...p} className="text-blue-400" />,
  'Census':               (p) => <ScrollText {...p} className="text-emerald-400" />,
  'Departure/Emigration': (p) => <Anchor    {...p} className="text-orange-400" />,
  'Arrival/Immigration':  (p) => <MapIcon   {...p} className="text-indigo-400" />,
  'Burial':               (p) => <Disc      {...p} className="text-stone-500" />,
  'Graduation':           (p) => <Sparkles  {...p} className="text-purple-500" />,
  'Military Service':     (p) => <MapPin    {...p} className="text-red-500" />,
  'Bar Mitzvah':          (p) => <ScrollText {...p} className="text-blue-500" />,
  'Bat Mitzvah':          (p) => <ScrollText {...p} className="text-pink-500" />,
  'Confirmation':         (p) => <Sparkles  {...p} className="text-indigo-500" />,
  'Event':                (p) => <History   {...p} className="text-stone-400" />,
};

export const getEventIcon = (type: string): React.FC<EventIconProps> =>
  iconMap[type] ?? ((p) => <History {...p} className="text-stone-300" />);

export const eventVerb = (type: string) => {
  const verbs: Record<string, string> = {
    'Birth': 'was born',
    'Death': 'passed away',
    'Marriage': 'married',
    'Residence': 'resided',
    'Census': 'appears in the census',
    'Burial': 'was laid to rest',
    'Departure/Emigration': 'departed',
    'Arrival/Immigration': 'arrived',
    'Graduation': 'graduated',
    'Military Service': 'served',
    'Bar Mitzvah': 'celebrated their Bar Mitzvah',
    'Bat Mitzvah': 'celebrated their Bat Mitzvah',
    'Confirmation': 'was confirmed',
    'Event': 'had an event'
  };
  return verbs[type] || 'had a recorded event';
};
