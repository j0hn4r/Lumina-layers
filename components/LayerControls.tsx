import React from 'react';
import { Eye, EyeOff, Trash2, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { Layer, BlendMode } from '../types';
import { BLEND_MODES } from '../constants';

interface LayerControlsProps {
  layer: Layer;
  index: number;
  totalLayers: number;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
  onRemove: (id: string) => void;
  onRefresh: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isOnlyLayer: boolean;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  layer,
  index,
  totalLayers,
  onUpdate,
  onRemove,
  onRefresh,
  onMoveUp,
  onMoveDown,
  isOnlyLayer,
}) => {
  const isFirst = index === 0;
  const isLast = index === totalLayers - 1;

  return (
    <div 
      className="bg-slate-800 rounded-lg p-3 mb-3 border border-slate-700 shadow-sm transition-all hover:border-slate-600 group"
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Reorder Controls */}
        <div className="flex flex-col gap-1 pt-1">
          <button
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            className={`p-1 rounded hover:bg-slate-700 transition-colors ${
              isFirst ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-indigo-400'
            }`}
            title="Move Layer Up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            className={`p-1 rounded hover:bg-slate-700 transition-colors ${
              isLast ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-indigo-400'
            }`}
            title="Move Layer Down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Thumbnail Image */}
        <div className="relative w-12 h-12 flex-shrink-0 bg-slate-900 rounded overflow-hidden ring-1 ring-slate-700">
          <img 
            src={layer.url} 
            alt="Thumbnail" 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            crossOrigin="anonymous"
          />
        </div>

        {/* Controls Header */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-200 text-sm truncate pr-2 select-none">{layer.name}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onRefresh(layer.id)}
                className="p-1.5 hover:bg-slate-700 rounded-md text-slate-500 hover:text-white transition-colors"
                title="Reload Image"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdate(layer.id, { isVisible: !layer.isVisible })}
                className="p-1.5 hover:bg-slate-700 rounded-md text-slate-500 hover:text-white transition-colors"
                title={layer.isVisible ? "Hide Layer" : "Show Layer"}
              >
                {layer.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onRemove(layer.id)}
                disabled={isOnlyLayer}
                className={`p-1.5 rounded-md transition-colors ${
                  isOnlyLayer
                    ? 'text-slate-700 cursor-not-allowed'
                    : 'hover:bg-red-900/30 text-slate-500 hover:text-red-400'
                }`}
                title="Remove Layer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
           {/* Opacity Slider Compact */}
           <div className="flex items-center gap-2">
             <span className="text-[10px] text-slate-500 font-mono w-8 select-none">
               {Math.round(layer.opacity * 100)}%
             </span>
             <input
               type="range"
               min="0"
               max="1"
               step="0.01"
               value={layer.opacity}
               onChange={(e) => onUpdate(layer.id, { opacity: parseFloat(e.target.value) })}
               className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
             />
           </div>
        </div>
      </div>

      {/* Blend Mode Selector */}
      <div>
        <select
          value={layer.blendMode}
          onChange={(e) => {
            const newMode = e.target.value as BlendMode;
            const updates: Partial<Layer> = { blendMode: newMode };
            if (newMode === BlendMode.AVERAGE) {
              updates.opacity = 0.5;
            }
            onUpdate(layer.id, updates);
          }}
          className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          {BLEND_MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};