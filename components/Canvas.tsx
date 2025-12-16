import React, { useMemo, useState } from 'react';
import { Layer, BlendMode } from '../types';

interface CanvasProps {
  layers: Layer[];
}

export const Canvas: React.FC<CanvasProps> = ({ layers }) => {
  // Track which URL has been fully loaded for each layer id
  const [loadedImages, setLoadedImages] = useState<Record<string, string>>({});

  const handleImageLoad = (id: string, url: string) => {
    setLoadedImages(prev => ({ ...prev, [id]: url }));
  };

  const visibleLayers = useMemo(() => layers.filter(layer => layer.isVisible), [layers]);
  const allVisibleImagesLoaded = useMemo(
    () => visibleLayers.every(layer => loadedImages[layer.id] === layer.url),
    [loadedImages, visibleLayers]
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 bg-[#0b0f19] overflow-hidden">
      {/* Artboard Container */}
      <div 
        className="relative w-full max-w-[600px] aspect-[3/4] bg-white shadow-2xl overflow-hidden ring-1 ring-slate-800"
        style={{
          boxShadow: '0 0 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Placeholder/Empty State */}
        {!allVisibleImagesLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-600">
            <span className="text-sm">Loading visual assets...</span>
          </div>
        )}

        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out`}
            style={{
              opacity: layer.isVisible ? layer.opacity : 0,
              zIndex: index,
              // 'Average' is not a native CSS blend mode. We use 'normal' with 50% opacity (handled in state) to simulate it.
              mixBlendMode: (layer.blendMode === BlendMode.NORMAL || layer.blendMode === BlendMode.AVERAGE) 
                ? 'normal' 
                : layer.blendMode as any,
            }}
          >
            {/* Loading Indicator for individual layer */}
            {loadedImages[layer.id] !== layer.url && layer.isVisible && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white opacity-20"></div>
              </div>
            )}
            
            <img
              src={layer.url}
              alt={`Layer ${index + 1}`}
              className="w-full h-full object-cover"
              onLoad={() => handleImageLoad(layer.id, layer.url)}
              crossOrigin="anonymous"
            />
          </div>
        ))}
      </div>
      
      {/* Decorative background elements to make it feel like an app workspace */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-slate-950"></div>
    </div>
  );
};