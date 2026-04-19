import { Bottle, EcosystemHazard } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, TrendingUp, MapPin, Calendar, Sparkles } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { useState, useEffect } from 'react';

interface EnvironmentalImpactPanelProps {
  bottle: Bottle | null;
  onClose: () => void;
}

export function EnvironmentalImpactPanel({ bottle, onClose }: EnvironmentalImpactPanelProps) {
  const [geminiResponse, setGeminiResponse] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const mockHazards: EcosystemHazard[] = bottle ? [
    {
      type: 'turtle-nesting',
      name: 'Loggerhead Turtle Nesting Site',
      severity: 'high',
      description: 'This bottle is drifting through a critical nesting ground for endangered loggerhead sea turtles. Peak nesting season: May–August.'
    },
    {
      type: 'coral-reef',
      name: 'Pacific Coral Reef System',
      severity: 'critical',
      description: 'Debris in this area poses severe risk to fragile coral structures and reef-dwelling species.'
    },
    {
      type: 'whale-migration',
      name: 'Humpback Whale Migration Corridor',
      severity: 'medium',
      description: 'Plastic debris can be ingested by migrating whales. This route is active March–November.'
    }
  ] : [];

  useEffect(() => {
    if (bottle) {
      setIsGenerating(true);
      setTimeout(() => {
        setGeminiResponse(
          `• **Critical Habitat Proximity:** This bottle is drifting through sea turtle nesting grounds. Monitor closely during May–August nesting season.\n\n• **Coral Reef Threat:** Debris within 50km of fragile reef systems. Immediate risk to marine biodiversity and ecosystem health.\n\n• **Migration Route Intersection:** Whale migration corridors overlap this trajectory. Ingestion risk elevated March–November.`
        );
        setIsGenerating(false);
      }, 1500);
    } else {
      setGeminiResponse('');
    }
  }, [bottle]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { badge: 'bg-red-500/15 text-red-400 border-red-500/25', dot: 'bg-red-400' };
      case 'high':     return { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/25', dot: 'bg-orange-400' };
      case 'medium':   return { badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25', dot: 'bg-yellow-400' };
      case 'low':      return { badge: 'bg-green-500/15 text-green-400 border-green-500/25', dot: 'bg-green-400' };
      default:         return { badge: 'bg-gray-500/15 text-gray-400 border-gray-500/25', dot: 'bg-gray-400' };
    }
  };

  return (
    <AnimatePresence>
      {bottle && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="absolute right-0 top-0 bottom-0 w-[440px] bg-[#0d1117] border-l border-white/5 z-20 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white">Environmental Impact</h2>
                <p className="text-sm text-gray-500 mt-0.5">AI-powered ecosystem analysis</p>
              </div>
              <button
                onClick={onClose}
                className="size-8 flex items-center justify-center rounded-lg bg-[#161c2a] hover:bg-[#1a2235] text-gray-400 hover:text-white transition-all border border-white/5"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Bottle Info Card */}
            <div className="bg-[#111622] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-9 rounded-xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                  <div className="size-2.5 rounded-full bg-blue-400" />
                </div>
                <div>
                  <div className="text-white">{bottle.name}</div>
                  <div className="text-sm text-orange-400">{bottle.status}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0d1117] rounded-lg p-2.5">
                  <div className="text-xs text-gray-500 mb-1">Location</div>
                  <div className="flex items-center gap-1 text-sm text-gray-300">
                    <MapPin className="size-3 text-orange-400 shrink-0" />
                    {bottle.location}
                  </div>
                </div>
                <div className="bg-[#0d1117] rounded-lg p-2.5">
                  <div className="text-xs text-gray-500 mb-1">Days Adrift</div>
                  <div className="flex items-center gap-1 text-sm text-gray-300">
                    <Calendar className="size-3 text-blue-400 shrink-0" />
                    {bottle.daysAdrift} days
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-5 space-y-5">

              {/* Gemini AI Analysis */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="size-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Gemini AI Analysis</span>
                </div>

                {isGenerating ? (
                  <div className="bg-[#111622] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                    <div className="size-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="text-sm text-gray-500">Analyzing environmental impact...</span>
                  </div>
                ) : (
                  <div className="bg-[#111622] border border-purple-500/15 rounded-xl p-4">
                    <div className="text-sm text-gray-400 whitespace-pre-line leading-relaxed">
                      {geminiResponse}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-600">
                      Google Gemini · {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                )}

                <div className="mt-2 bg-[#111622] border border-white/5 rounded-xl p-3">
                  <div className="text-xs text-gray-600">
                    <span className="text-blue-400/70">Developer:</span> Replace mock with real Gemini API key to enable live analysis.
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* Ecosystem Hazards */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="size-4 text-orange-400" />
                  <span className="text-sm text-gray-300">Ecosystem Hazards</span>
                  <div className="ml-auto bg-[#1a2035] border border-white/5 text-gray-400 text-xs px-2 py-0.5 rounded-full">
                    {mockHazards.length}
                  </div>
                </div>

                <div className="space-y-2">
                  {mockHazards.map((hazard, idx) => {
                    const colors = getSeverityColor(hazard.severity);
                    return (
                      <div
                        key={idx}
                        className="bg-[#111622] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-200">{hazard.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${colors.badge}`}>
                            {hazard.severity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {hazard.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* Impact Metrics */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="size-4 text-green-400" />
                  <span className="text-sm text-gray-300">Impact Metrics</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Ecosystems Affected', value: '3', color: 'text-green-400' },
                    { label: 'Risk Level', value: 'High', color: 'text-orange-400' },
                    { label: 'Latitude', value: `${bottle.currentPosition.lat.toFixed(1)}°N`, color: 'text-blue-400' },
                    { label: 'Longitude', value: `${Math.abs(bottle.currentPosition.lng).toFixed(1)}°W`, color: 'text-blue-400' },
                  ].map((metric) => (
                    <div key={metric.label} className="bg-[#111622] border border-white/5 rounded-xl p-3">
                      <div className={`text-lg ${metric.color} mb-0.5`}>{metric.value}</div>
                      <div className="text-xs text-gray-600">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Sources */}
              <div className="bg-[#111622] border border-white/5 rounded-xl p-4">
                <div className="text-xs text-gray-600 mb-2">Data Sources</div>
                <div className="space-y-1">
                  {['NOAA Marine Regions Database', 'MarineRegions.org GeoJSON', 'Protected Planet WDPA', 'Google Gemini AI'].map((src) => (
                    <div key={src} className="text-xs text-gray-500 flex items-center gap-1.5">
                      <div className="size-1 rounded-full bg-blue-500/50 shrink-0" />
                      {src}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}