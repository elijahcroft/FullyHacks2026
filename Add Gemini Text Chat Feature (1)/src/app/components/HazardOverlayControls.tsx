import { Layers, Fish, Waves, Navigation, Shield, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface HazardOverlayControlsProps {
  activeOverlays: Set<string>;
  onToggleOverlay: (type: string) => void;
}

export function HazardOverlayControls({ activeOverlays, onToggleOverlay }: HazardOverlayControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const overlays = [
    { type: 'turtle-nesting', label: 'Sea Turtle Nesting', icon: Navigation, color: 'text-green-400' },
    { type: 'coral-reef', label: 'Coral Reef Zones', icon: Waves, color: 'text-pink-400' },
    { type: 'whale-migration', label: 'Whale Migration', icon: Fish, color: 'text-blue-400' },
    { type: 'fishing-ground', label: 'Fishing Grounds', icon: Fish, color: 'text-yellow-400' },
    { type: 'marine-protected', label: 'Marine Protected Areas', icon: Shield, color: 'text-purple-400' },
    { type: 'coastline', label: 'Populated Coastlines', icon: MapPin, color: 'text-orange-400' },
  ];

  const activeCount = overlays.filter(o => activeOverlays.has(o.type)).length;

  return (
    <div className="absolute top-5 right-5 z-10">
      <div className="bg-[#0d1117]/95 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl min-w-[220px]">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-white/3 transition-colors"
        >
          <Layers className="size-4 text-blue-400 shrink-0" />
          <span className="text-sm text-gray-300 flex-1 text-left">Ecosystem Overlays</span>
          {activeCount > 0 && (
            <span className="bg-blue-500/20 text-blue-400 text-xs px-1.5 py-0.5 rounded-full border border-blue-500/20">
              {activeCount}
            </span>
          )}
          <motion.svg
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="size-3.5 text-gray-500 shrink-0"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>

        {/* Overlay Options */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/5 overflow-hidden"
            >
              <div className="p-2 space-y-0.5">
                {overlays.map((overlay) => {
                  const Icon = overlay.icon;
                  const isActive = activeOverlays.has(overlay.type);

                  return (
                    <button
                      key={overlay.type}
                      onClick={() => onToggleOverlay(overlay.type)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        isActive
                          ? 'bg-[#111622] border border-white/5'
                          : 'hover:bg-white/3 border border-transparent'
                      }`}
                    >
                      <Icon className={`size-3.5 shrink-0 ${isActive ? overlay.color : 'text-gray-600'}`} />
                      <span className={`text-xs flex-1 text-left transition-colors ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>
                        {overlay.label}
                      </span>
                      <div
                        className={`size-3.5 rounded border transition-all shrink-0 flex items-center justify-center ${
                          isActive
                            ? 'bg-blue-500 border-blue-400'
                            : 'border-white/10'
                        }`}
                      >
                        {isActive && (
                          <svg className="size-2.5 text-white" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}