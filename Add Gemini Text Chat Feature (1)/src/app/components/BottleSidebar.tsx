import { Bottle } from '../App';
import { ScrollArea } from './ui/scroll-area';
import { Crosshair, FlaskConical } from 'lucide-react';

interface BottleSidebarProps {
  bottles: Bottle[];
  selectedBottle: Bottle | null;
  onSelectBottle: (bottle: Bottle) => void;
}

export function BottleSidebar({ bottles, selectedBottle, onSelectBottle }: BottleSidebarProps) {
  return (
    <div className="w-72 bg-[#0d1117] border-r border-white/5 flex flex-col h-full min-h-0">

      {/* Top Toolbar */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <button className="flex flex-col items-center justify-center size-12 rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-400">
          <Crosshair className="size-5" />
          <span className="text-[10px] mt-0.5 opacity-80">D</span>
        </button>
        <button className="flex flex-col items-center justify-center size-12 rounded-xl bg-[#1a2035] text-gray-400 border border-white/5 transition-all hover:bg-[#1e2640] hover:text-gray-200">
          <FlaskConical className="size-5" />
          <span className="text-[10px] mt-0.5 opacity-60">B</span>
        </button>
      </div>

      {/* Clear All Button */}
      <div className="px-4 pb-3">
        <button className="w-full bg-[#161c2a] hover:bg-[#1a2235] border border-white/5 text-gray-300 hover:text-white py-2.5 px-4 rounded-xl transition-all text-sm">
          Clear all bottles
        </button>
      </div>

      {/* Bottle List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 pb-4 space-y-2.5">
          {bottles.map((bottle) => {
            const isSelected = selectedBottle?.id === bottle.id;
            return (
              <button
                key={bottle.id}
                onClick={() => onSelectBottle(bottle)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${
                  isSelected
                    ? 'bg-[#141929] border-blue-500/40 shadow-md shadow-blue-500/10'
                    : 'bg-[#111622] border-white/5 hover:bg-[#141929] hover:border-white/10'
                }`}
              >
                <div className="mb-1">
                  <span className="text-white">{bottle.name}</span>
                </div>
                <div className="text-sm text-gray-400 mb-2 truncate">
                  {bottle.message || '(no message)'}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-400">{bottle.location}</span>
                  <span className="text-xs text-gray-500">{bottle.daysAdrift}d</span>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Drop Button */}
      <div className="px-4 pb-4 pt-2 border-t border-white/5">
        <button className="w-full bg-blue-500 hover:bg-blue-400 text-white py-2.5 px-4 rounded-xl transition-all text-sm shadow-lg shadow-blue-500/20">
          + Drop New Bottle
        </button>
      </div>
    </div>
  );
}