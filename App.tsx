import React, { useState, useCallback } from 'react';
import { Plus, Shuffle, Download, Layers, Wand2, RefreshCcw, Loader2 } from 'lucide-react';
import { Layer, BlendMode } from './types';
import { INITIAL_LAYERS_COUNT, IMAGE_WIDTH, IMAGE_HEIGHT } from './constants';
import { LayerControls } from './components/LayerControls';
import { Canvas } from './components/Canvas';

const generateRandomUrl = (seed: string) => {
  return `https://picsum.photos/seed/${seed}/${IMAGE_WIDTH}/${IMAGE_HEIGHT}`;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [isExporting, setIsExporting] = useState(false);
  const [layers, setLayers] = useState<Layer[]>(() => {
    // Define a diverse set of initial modes to showcase capabilities with 10 layers
    const initialModes = [
      BlendMode.NORMAL,      // 1: Base
      BlendMode.AVERAGE,     // 2: Soften
      BlendMode.MULTIPLY,    // 3: Darken
      BlendMode.SCREEN,      // 4: Lighten
      BlendMode.OVERLAY,     // 5: Contrast
      BlendMode.SOFT_LIGHT,  // 6: Subtle
      BlendMode.DIFFERENCE,  // 7: Abstract
      BlendMode.HARD_LIGHT,  // 8: Intense
      BlendMode.COLOR_DODGE, // 9: Vibrant
      BlendMode.LUMINOSITY   // 10: Texture
    ];

    return Array.from({ length: INITIAL_LAYERS_COUNT }).map((_, i) => {
      const mode = initialModes[i % initialModes.length];
      
      // Smart default opacity based on mode
      let opacity = 0.7;
      if (i === 0) opacity = 1;
      else if (mode === BlendMode.AVERAGE) opacity = 0.5;
      else if (mode === BlendMode.DIFFERENCE) opacity = 0.3;
      else if (mode === BlendMode.HARD_LIGHT) opacity = 0.6;

      return {
        id: generateId(),
        name: `Layer ${i + 1}`,
        url: generateRandomUrl(generateId()),
        blendMode: mode,
        opacity: opacity,
        isVisible: true,
        isLoading: true,
      };
    });
  });

  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== id));
  }, []);

  const refreshLayerImage = useCallback((id: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, url: generateRandomUrl(generateId()), isLoading: true } : layer
    ));
  }, []);

  const addLayer = useCallback(() => {
    setLayers(prev => [
      ...prev,
      {
        id: generateId(),
        name: `Layer ${prev.length + 1}`,
        url: generateRandomUrl(generateId()),
        blendMode: BlendMode.OVERLAY,
        opacity: 0.7,
        isVisible: true,
        isLoading: true,
      }
    ]);
  }, []);

  const getRandomModeAndOpacity = (index: number) => {
    const modes = [
      BlendMode.NORMAL, BlendMode.AVERAGE, BlendMode.MULTIPLY, 
      BlendMode.SCREEN, BlendMode.OVERLAY, BlendMode.SOFT_LIGHT, 
      BlendMode.HARD_LIGHT, BlendMode.DIFFERENCE, BlendMode.EXCLUSION,
      BlendMode.COLOR_DODGE, BlendMode.COLOR_BURN, BlendMode.HUE,
      BlendMode.SATURATION, BlendMode.LUMINOSITY
    ];
    
    // First layer usually looks best as Normal to provide a solid background
    const mode = index === 0 ? BlendMode.NORMAL : modes[Math.floor(Math.random() * modes.length)];
    
    let opacity = 0.4 + Math.random() * 0.6; // Random opacity between 0.4 and 1.0
    if (index === 0) opacity = 1;
    if (mode === BlendMode.AVERAGE) opacity = 0.5;

    return { mode, opacity };
  };

  const remixStyles = useCallback(() => {
    setLayers(prev => prev.map((layer, index) => {
      const { mode, opacity } = getRandomModeAndOpacity(index);
      return {
        ...layer,
        blendMode: mode,
        opacity: opacity,
      };
    }));
  }, []);

  const loadNewImages = useCallback(() => {
    setLayers(prev => prev.map((layer, index) => {
      const { mode, opacity } = getRandomModeAndOpacity(index);
      return {
        ...layer,
        url: generateRandomUrl(generateId()),
        blendMode: mode,
        opacity: opacity,
        isLoading: true,
      };
    }));
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = IMAGE_WIDTH;
      canvas.height = IMAGE_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const visibleLayers = layers.filter(l => l.isVisible);

      // Load all images first to ensure draw order
      const loadedImages = await Promise.all(visibleLayers.map(layer => {
        return new Promise<{ img: HTMLImageElement, layer: Layer } | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous'; // Critical for exporting canvas
          img.src = layer.url;
          img.onload = () => resolve({ img, layer });
          img.onerror = () => resolve(null);
        });
      }));

      // Draw layers
      loadedImages.forEach(item => {
        if (!item) return;
        const { img, layer } = item;
        
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        
        // Map CSS blend modes to Canvas globalCompositeOperation
        let gco: GlobalCompositeOperation = 'source-over';
        
        if (layer.blendMode === BlendMode.AVERAGE) {
          // Average is simulated by Normal mode + 50% opacity (already in layer.opacity)
          gco = 'source-over';
        } else if (layer.blendMode === BlendMode.NORMAL) {
          gco = 'source-over';
        } else {
          // Most CSS blend modes map directly to canvas GCO names
          gco = layer.blendMode as GlobalCompositeOperation;
        }

        try {
          ctx.globalCompositeOperation = gco;
        } catch (e) {
          // Fallback if browser doesn't support specific GCO
          console.warn(`Blend mode ${layer.blendMode} not supported in canvas, falling back to source-over`);
          ctx.globalCompositeOperation = 'source-over';
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      });

      // Trigger download
      const link = document.createElement('a');
      link.download = `lumina-art-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* Sidebar Controls */}
      <div className="w-full md:w-96 flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                Lumina Layers
              </h1>
              <p className="text-xs text-slate-400 font-medium">Artistic Composite Tool</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Layers ({layers.length})
            </h2>
          </div>
          
          <div className="space-y-1">
            {layers.map((layer) => (
              <LayerControls
                key={layer.id}
                layer={layer}
                onUpdate={updateLayer}
                onRemove={removeLayer}
                onRefresh={refreshLayerImage}
                isOnlyLayer={layers.length <= 1}
              />
            ))}
          </div>

          <button
            onClick={addLayer}
            className="w-full mt-4 py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add New Layer
          </button>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-3">
           <div className="grid grid-cols-2 gap-3">
            <button
              onClick={remixStyles}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all flex items-center justify-center gap-2 font-medium text-sm border border-slate-700"
              title="Shuffle blend modes and opacity for current images"
            >
              <Wand2 className="w-4 h-4 text-purple-400" />
              Remix
            </button>
            
            <button
              onClick={loadNewImages}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all flex items-center justify-center gap-2 font-medium text-sm border border-slate-700"
              title="Load completely new random images"
            >
              <RefreshCcw className="w-4 h-4 text-blue-400" />
              Reset
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export Art'}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-[#0f1218]">
        <Canvas layers={layers} />
        
        {/* Floating Info / Instructions */}
        <div className="absolute top-6 right-6 max-w-xs bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-lg shadow-xl text-sm text-slate-300 hidden md:block pointer-events-none">
            <p className="mb-2 font-semibold text-slate-100">Quick Guide</p>
            <ul className="space-y-1 text-xs list-disc pl-4 text-slate-400">
                <li>Experiment with <span className="text-indigo-400">Blend Modes</span> to see how layers interact.</li>
                <li>"Multiply" darkens, "Screen" lightens.</li>
                <li>"Average" sets 50% opacity for a median blend.</li>
                <li>Use opacity to subtlely merge textures.</li>
            </ul>
        </div>
      </div>
    </div>
  );
}

export default App;