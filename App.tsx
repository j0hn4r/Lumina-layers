import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Download, Layers, Wand2, RefreshCcw, Loader2, Scale, Info, X, Bookmark, Trash2, Save, RotateCcw } from 'lucide-react';
import { Layer, BlendMode, Preset } from './types';
import { INITIAL_LAYERS_COUNT, IMAGE_WIDTH, IMAGE_HEIGHT } from './constants';
import { LayerControls } from './components/LayerControls';
import { Canvas } from './components/Canvas';

const generateRandomUrl = (seed: string) => {
  return `https://picsum.photos/seed/${seed}/${IMAGE_WIDTH}/${IMAGE_HEIGHT}`;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [isExporting, setIsExporting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');
  
  // Initialize presets from localStorage
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const saved = localStorage.getItem('lumina_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load presets', e);
      return [];
    }
  });

  // Save presets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('lumina_presets', JSON.stringify(presets));
  }, [presets]);

  // Helper to generate smart defaults based on total layer count
  const getRandomModeAndOpacity = (index: number, totalLayers: number) => {
    const modes = [
      BlendMode.NORMAL, BlendMode.AVERAGE, BlendMode.MULTIPLY, 
      BlendMode.SCREEN, BlendMode.OVERLAY, BlendMode.SOFT_LIGHT, 
      BlendMode.HARD_LIGHT, BlendMode.DIFFERENCE, BlendMode.EXCLUSION,
      BlendMode.COLOR_DODGE, BlendMode.COLOR_BURN, BlendMode.HUE,
      BlendMode.SATURATION, BlendMode.LUMINOSITY
    ];
    
    // We treat all layers equally now, including the first one, to ensure
    // a balanced composition where no single layer dominates (even the background).
    
    const mode = modes[Math.floor(Math.random() * modes.length)];
    
    // Dynamic Opacity Calculation
    // Goal: Maintain total visual density around ~2.5 across ALL layers
    // This allows the white canvas to bleed through slightly, creating a more cohesive blend.
    const targetAvg = 2.5 / Math.max(1, totalLayers);
    
    // Add some randomness (+/- 40% of target)
    const variation = targetAvg * 0.4;
    const randomShift = (Math.random() * variation) - (variation / 2);
    
    let opacity = targetAvg + randomShift;

    // Clamp values to keep them usable
    opacity = Math.max(0.05, Math.min(1.0, opacity));

    // Specific tweaks for strong blend modes
    if (mode === BlendMode.DIFFERENCE || mode === BlendMode.EXCLUSION) {
      opacity *= 0.8; 
    }

    if (mode === BlendMode.AVERAGE) {
      opacity = Math.min(0.5, opacity);
    }

    return { mode, opacity };
  };
  
  const [layers, setLayers] = useState<Layer[]>(() => {
    const count = INITIAL_LAYERS_COUNT;
    const initialModes = [
      BlendMode.NORMAL,      
      BlendMode.AVERAGE,     
      BlendMode.MULTIPLY,    
      BlendMode.SCREEN,      
      BlendMode.OVERLAY,     
      BlendMode.SOFT_LIGHT,  
      BlendMode.DIFFERENCE,  
      BlendMode.HARD_LIGHT,  
      BlendMode.COLOR_DODGE, 
      BlendMode.LUMINOSITY   
    ];

    return Array.from({ length: count }).map((_, i) => {
      // Use the pre-defined sequence for nice first impression, but apply dynamic opacity to ALL layers
      const mode = initialModes[i % initialModes.length];
      
      // Apply the same distribution logic as the random generator
      // Target sum ~2.5 split across all layers
      const targetAvg = 2.5 / Math.max(1, count);
      let opacity = targetAvg;
      
      if (mode === BlendMode.AVERAGE) opacity = Math.min(0.5, opacity);
      
      // Clamp
      opacity = Math.max(0.05, Math.min(1.0, opacity));

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

  const moveLayerUp = useCallback((index: number) => {
    if (index === 0) return;
    setLayers(prev => {
      const newLayers = [...prev];
      // Swap with previous
      [newLayers[index - 1], newLayers[index]] = [newLayers[index], newLayers[index - 1]];
      return newLayers;
    });
  }, []);

  const moveLayerDown = useCallback((index: number) => {
    setLayers(prev => {
      if (index === prev.length - 1) return prev;
      const newLayers = [...prev];
      // Swap with next
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      return newLayers;
    });
  }, []);

  const addLayer = useCallback(() => {
    setLayers(prev => {
      const newCount = prev.length + 1;
      const index = prev.length;
      // Calculate opacity based on the NEW total count
      const { mode, opacity } = getRandomModeAndOpacity(index, newCount);
      return [
        ...prev,
        {
          id: generateId(),
          name: `Layer ${index + 1}`,
          url: generateRandomUrl(generateId()),
          blendMode: mode,
          opacity: opacity,
          isVisible: true,
          isLoading: true,
        }
      ];
    });
  }, []);

  const handleLayerCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(e.target.value, 10);
    if (isNaN(newCount)) return;

    setLayers(prev => {
      if (newCount > prev.length) {
        // Add layers
        const layersToAdd = newCount - prev.length;
        const newLayers: Layer[] = [];
        
        for (let i = 0; i < layersToAdd; i++) {
          const index = prev.length + i;
          const { mode, opacity } = getRandomModeAndOpacity(index, newCount);
          newLayers.push({
            id: generateId(),
            name: `Layer ${index + 1}`,
            url: generateRandomUrl(generateId()),
            blendMode: mode,
            opacity: opacity,
            isVisible: true,
            isLoading: true,
          });
        }
        return [...prev, ...newLayers];
      } else if (newCount < prev.length) {
        // Remove layers from the end
        return prev.slice(0, newCount);
      }
      return prev;
    });
  };

  const remixStyles = useCallback(() => {
    setLayers(prev => {
      const totalLayers = prev.length;
      return prev.map((layer, index) => {
        const { mode, opacity } = getRandomModeAndOpacity(index, totalLayers);
        return {
          ...layer,
          blendMode: mode,
          opacity: opacity,
        };
      });
    });
  }, []);

  const handleEqualize = useCallback(() => {
    setLayers(prev => {
      const count = prev.length;
      if (count === 0) return prev;
      
      const uniformOpacity = 1.0 / count;
      
      return prev.map(layer => ({
        ...layer,
        blendMode: BlendMode.AVERAGE,
        opacity: uniformOpacity,
      }));
    });
  }, []);

  const loadNewImages = useCallback(() => {
    setLayers(prev => {
      const totalLayers = prev.length;
      return prev.map((layer, index) => {
        const { mode, opacity } = getRandomModeAndOpacity(index, totalLayers);
        return {
          ...layer,
          url: generateRandomUrl(generateId()),
          blendMode: mode,
          opacity: opacity,
          isLoading: true,
        };
      });
    });
  }, []);

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    
    const newPreset: Preset = {
      id: generateId(),
      name: presetName.trim(),
      timestamp: Date.now(),
      layers: layers,
    };
    
    setPresets(prev => [newPreset, ...prev]);
    setPresetName('');
  };

  const handleLoadPreset = (preset: Preset) => {
    // When loading, we might want to re-trigger loadings state to be safe, 
    // although browser caching usually handles it.
    const loadedLayers = preset.layers.map(l => ({
      ...l,
      isLoading: true // Force reload indicator just in case
    }));
    setLayers(loadedLayers);
    setShowPresets(false);
  };

  const handleDeletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  };

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
          // Average is simulated by Normal mode + 50% opacity (handled via layer.opacity)
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
            <div className="flex gap-1">
              <button
                onClick={() => setShowPresets(true)}
                className="p-2 text-slate-500 hover:text-indigo-400 transition-colors rounded-full hover:bg-slate-800"
                title="Library / Presets"
              >
                <Bookmark className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowGuide(true)}
                className="p-2 text-slate-500 hover:text-indigo-400 transition-colors rounded-full hover:bg-slate-800"
                title="Quick Guide"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
          
          {/* Layer Count Slider */}
          <div className="mb-6 px-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Layers
              </h2>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {layers.length}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={layers.length}
              onChange={handleLayerCountChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-colors"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
              <span>1</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Stack
            </h2>
          </div>
          
          <div className="space-y-1">
            {layers.map((layer, index) => (
              <LayerControls
                key={layer.id}
                index={index}
                totalLayers={layers.length}
                layer={layer}
                onUpdate={updateLayer}
                onRemove={removeLayer}
                onRefresh={refreshLayerImage}
                onMoveUp={moveLayerUp}
                onMoveDown={moveLayerDown}
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
              title="Shuffle blend modes and opacity"
            >
              <Wand2 className="w-4 h-4 text-purple-400" />
              Remix
            </button>

             <button
              onClick={handleEqualize}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all flex items-center justify-center gap-2 font-medium text-sm border border-slate-700"
              title="Set all to Average mode with equal opacity"
            >
              <Scale className="w-4 h-4 text-emerald-400" />
              Equalize
            </button>
          </div>
          
           <button
              onClick={loadNewImages}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all flex items-center justify-center gap-2 font-medium text-sm border border-slate-700"
              title="Load completely new random images"
            >
              <RefreshCcw className="w-4 h-4 text-blue-400" />
              Reset Images
            </button>

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
      <div className="flex-1 relative overflow-hidden bg-[#0f1218] flex flex-col items-center justify-center">
        <Canvas layers={layers} />
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-400" />
                Quick Guide
              </h3>
              <button 
                onClick={() => setShowGuide(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="p-2 bg-slate-800 rounded-lg h-fit">
                  <Layers className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">Layer Stack</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Use the Up/Down arrows to reorder layers. The top layer in the list is the top-most image in the artwork.
                  </p>
                </div>
              </div>

               <div className="flex gap-4">
                <div className="p-2 bg-slate-800 rounded-lg h-fit">
                  <Scale className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">Equalize</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Instantly sets all layers to 'Average' blend mode with uniform opacity calculated by layer count.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-2 bg-slate-800 rounded-lg h-fit">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">Remix</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Shuffle blend modes and opacity for the current images to discover new effects without changing the photos.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
               <button 
                onClick={() => setShowGuide(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Presets/Library Modal */}
      {showPresets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-400" />
                Library
              </h3>
              <button 
                onClick={() => setShowPresets(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {/* Save Section */}
              <div className="mb-8">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Save Current Workspace
                </h4>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Enter preset name..."
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                  />
                  <button 
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>

              {/* List Section */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Saved Presets
                </h4>
                {presets.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg">
                    <p className="text-slate-500 text-sm">No saved presets yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {presets.map(preset => (
                      <div 
                        key={preset.id}
                        className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-lg group transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-slate-200 text-sm truncate">{preset.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {preset.layers.length} layers • {new Date(preset.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLoadPreset(preset)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded-md transition-colors"
                            title="Load Preset"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
                            title="Delete Preset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
               <button 
                onClick={() => setShowPresets(false)}
                className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;