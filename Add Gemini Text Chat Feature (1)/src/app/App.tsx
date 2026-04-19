import { useState } from 'react';
import { BottleSidebar } from './components/BottleSidebar';
import { EnvironmentalImpactPanel } from './components/EnvironmentalImpactPanel';
import { OceanMap } from './components/OceanMap';
import { HazardOverlayControls } from './components/HazardOverlayControls';

export interface Bottle {
  id: string;
  name: string;
  location: string;
  status: string;
  lat: number;
  lng: number;
  message?: string;
  daysAdrift: number;
  currentPosition: { lat: number; lng: number };
}

export interface EcosystemHazard {
  type: 'turtle-nesting' | 'coral-reef' | 'whale-migration' | 'fishing-ground' | 'marine-protected' | 'coastline';
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export default function App() {
  const [selectedBottle, setSelectedBottle] = useState<Bottle | null>(null);
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set(['turtle-nesting', 'coral-reef']));

  // Mock bottle data
  const bottles: Bottle[] = [
    {
      id: 'test4',
      name: 'Test4',
      location: 'Pacific Ocean',
      status: 'Drifting',
      lat: 35.5,
      lng: -140.2,
      daysAdrift: 363,
      currentPosition: { lat: 35.5, lng: -140.2 }
    },
    {
      id: 'test3',
      name: 'Test3',
      location: 'North Pacific',
      status: 'Drifting',
      lat: 38.2,
      lng: -145.8,
      daysAdrift: 321,
      currentPosition: { lat: 38.2, lng: -145.8 }
    },
    {
      id: 'test2',
      name: 'Test2',
      location: 'Garbage Patch',
      status: 'Trapped in gyre',
      lat: 35.0,
      lng: -142.0,
      daysAdrift: 189,
      currentPosition: { lat: 35.0, lng: -142.0 }
    },
    {
      id: 'test1',
      name: 'Test1',
      location: 'Philippine Sea',
      status: 'Drifting',
      lat: 15.5,
      lng: 125.3,
      daysAdrift: 7901,
      currentPosition: { lat: 15.5, lng: 125.3 }
    },
  ];

  const toggleOverlay = (overlayType: string) => {
    setActiveOverlays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(overlayType)) {
        newSet.delete(overlayType);
      } else {
        newSet.add(overlayType);
      }
      return newSet;
    });
  };

  return (
    <div className="h-screen w-screen bg-[#0d1117] text-white flex overflow-hidden">
      {/* Left Sidebar with Bottle List */}
      <BottleSidebar 
        bottles={bottles}
        selectedBottle={selectedBottle}
        onSelectBottle={setSelectedBottle}
      />

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <OceanMap 
          bottles={bottles}
          selectedBottle={selectedBottle}
          onSelectBottle={setSelectedBottle}
          activeOverlays={activeOverlays}
        />
        
        {/* Hazard Overlay Controls */}
        <HazardOverlayControls 
          activeOverlays={activeOverlays}
          onToggleOverlay={toggleOverlay}
        />
      </div>

      {/* Environmental Impact Panel (slides in when bottle selected) */}
      <EnvironmentalImpactPanel 
        bottle={selectedBottle}
        onClose={() => setSelectedBottle(null)}
      />
    </div>
  );
}