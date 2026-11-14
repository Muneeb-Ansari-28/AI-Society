import React from 'react';
import type { VillageLocation } from '../types/simulation';
import { MapPin, X, Navigation } from 'lucide-react';
import { EventBus } from '../game/EventBus';

interface LocationModalProps {
  location: VillageLocation | null;
  selectedAgentId: string | null;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  location,
  selectedAgentId,
  onClose,
}) => {
  if (!location) return null;

  const handleSendVillager = () => {
    if (selectedAgentId) {
      EventBus.emit('command-agent-move', {
        agentId: selectedAgentId,
        locationId: location.id,
      });
      onClose();
    }
  };

  return (
    <div className="absolute top-20 left-6 z-20 w-72 bg-gray-900/95 border border-gray-700/80 p-4 rounded-xl shadow-2xl backdrop-blur select-none animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-lg">
            <MapPin size={16} />
          </div>
          <div>
            <h3 className="font-bold text-gray-100 text-sm">{location.name}</h3>
            <span className="text-[10px] text-emerald-400 font-mono uppercase">
              {location.type} zone
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <p className="text-xs text-gray-300 leading-relaxed mb-3">
        {location.description}
      </p>

      {selectedAgentId && (
        <button
          onClick={handleSendVillager}
          className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow"
        >
          <Navigation size={13} />
          <span>Walk Selected Agent Here</span>
        </button>
      )}
    </div>
  );
};
