import { Bottle } from '../App';
import { motion } from 'motion/react';

interface OceanMapProps {
  bottles: Bottle[];
  selectedBottle: Bottle | null;
  onSelectBottle: (bottle: Bottle) => void;
  activeOverlays: Set<string>;
}

export function OceanMap({ bottles, selectedBottle, onSelectBottle, activeOverlays }: OceanMapProps) {
  // Mock hazard zones (in reality these would be GeoJSON polygons)
  const hazardZones = [
    { type: 'turtle-nesting', x: '45%', y: '55%', size: 80, label: 'Turtle Nesting Ground' },
    { type: 'coral-reef', x: '30%', y: '65%', size: 60, label: 'Coral Reef Zone' },
    { type: 'whale-migration', x: '60%', y: '35%', size: 100, label: 'Whale Migration Route' },
    { type: 'fishing-ground', x: '25%', y: '45%', size: 70, label: 'Commercial Fishing' },
    { type: 'marine-protected', x: '70%', y: '60%', size: 90, label: 'Marine Protected Area' },
  ];

  const getHazardColor = (type: string) => {
    const colors: Record<string, string> = {
      'turtle-nesting': 'rgba(34, 197, 94, 0.2)',
      'coral-reef': 'rgba(236, 72, 153, 0.2)',
      'whale-migration': 'rgba(59, 130, 246, 0.2)',
      'fishing-ground': 'rgba(251, 191, 36, 0.2)',
      'marine-protected': 'rgba(139, 92, 246, 0.2)',
      'coastline': 'rgba(248, 113, 113, 0.2)',
    };
    return colors[type] || 'rgba(156, 163, 175, 0.2)';
  };

  return (
    <div className="size-full relative overflow-hidden bg-[#080c14]">
      {/* Ocean Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.07]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Hazard Overlay Zones */}
      {hazardZones.map((zone, idx) => (
        activeOverlays.has(zone.type) && (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute rounded-full border-2 border-dashed pointer-events-none"
            style={{
              left: zone.x,
              top: zone.y,
              width: zone.size,
              height: zone.size,
              backgroundColor: getHazardColor(zone.type),
              borderColor: getHazardColor(zone.type).replace('0.2', '0.6'),
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white/60 whitespace-nowrap">
              {zone.label}
            </div>
          </motion.div>
        )
      ))}

      {/* Bottle Markers */}
      {bottles.map((bottle, idx) => (
        <motion.div
          key={bottle.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.2 }}
          className="absolute cursor-pointer"
          style={{
            left: `${20 + idx * 15}%`,
            top: `${30 + idx * 10}%`,
          }}
          onClick={() => onSelectBottle(bottle)}
        >
          {/* Glow Effect */}
          <div
            className={`absolute inset-0 rounded-full blur-xl transition-all ${
              selectedBottle?.id === bottle.id
                ? 'bg-blue-400 scale-150 opacity-60'
                : 'bg-blue-500 scale-100 opacity-40'
            }`}
          />
          
          {/* Bottle Icon */}
          <div
            className={`relative size-4 rounded-full transition-all ${
              selectedBottle?.id === bottle.id
                ? 'bg-blue-300 ring-4 ring-blue-400/50'
                : 'bg-blue-400 ring-2 ring-blue-500/30'
            }`}
          />

          {/* Ripple Animation */}
          {selectedBottle?.id === bottle.id && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-blue-400"
                animate={{ scale: [1, 2, 2], opacity: [0.6, 0, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-blue-400"
                animate={{ scale: [1, 2, 2], opacity: [0.6, 0, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}
        </motion.div>
      ))}

      {/* Great Pacific Garbage Patch Label */}
      <div className="absolute left-[35%] top-[45%] pointer-events-none">
        <div className="bg-orange-500/10 border border-dashed border-orange-500/30 rounded-xl px-4 py-2">
          <div className="text-xs text-orange-400/70">Great Pacific</div>
          <div className="text-xs text-orange-400/70">Garbage Patch</div>
        </div>
      </div>

      {/* Date Display */}
      <div className="absolute bottom-5 right-5 bg-[#0d1117]/90 backdrop-blur-sm border border-white/5 rounded-xl px-4 py-2.5">
        <div className="text-xs text-gray-600">Current Date</div>
        <div className="text-sm text-gray-300">09/24/2026</div>
      </div>
    </div>
  );
}