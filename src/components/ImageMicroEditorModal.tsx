import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { 
  X, 
  RotateCw, 
  RotateCcw, 
  Sun, 
  Sliders, 
  Type, 
  Square, 
  Pencil, 
  Download, 
  Undo, 
  Redo, 
  Crop, 
  Sparkles, 
  Image as ImageIcon, 
  Layers, 
  Check, 
  Trash2, 
  ShieldCheck, 
  Clock,
  Maximize2
} from 'lucide-react';

interface ImageMicroEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSaveModifiedImage?: (newUrl: string) => void;
}

export const ImageMicroEditorModal: React.FC<ImageMicroEditorModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onSaveModifiedImage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [activeTab, setActiveTab] = useState<'adjust' | 'text' | 'draw' | 'crop' | 'stickers'>('adjust');
  
  // Adjustments state
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');

  // Text state
  const [textInput, setTextInput] = useState<string>('Hamro AI Studio');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [bgColor, setBgColor] = useState<string>('#e11d48');
  const [fontSize, setFontSize] = useState<number>(36);

  // Brush state
  const [brushColor, setBrushColor] = useState<string>('#f59e0b');
  const [brushWidth, setBrushWidth] = useState<number>(5);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !canvasRef.current || !imageUrl) return;

    // Initialize Fabric Canvas
    const initWidth = 800;
    const initHeight = 450; // 16:9 aspect ratio

    const fc = new fabric.Canvas(canvasRef.current, {
      width: initWidth,
      height: initHeight,
      backgroundColor: '#0f172a',
    });

    fabricCanvasRef.current = fc;

    // Load background image onto Fabric canvas
    fabric.FabricImage.fromURL(imageUrl, {
      crossOrigin: 'anonymous',
    }).then((img) => {
      if (!fc) return;

      // Scale image to fit canvas nicely
      const scaleX = fc.width! / (img.width || 1);
      const scaleY = fc.height! / (img.height || 1);
      const scale = Math.min(scaleX, scaleY);

      img.set({
        scaleX: scale,
        scaleY: scale,
        originX: 'center',
        originY: 'center',
        left: fc.width! / 2,
        top: fc.height! / 2,
        selectable: false,
      });

      fc.add(img);
      fc.sendObjectToBack(img);
      fc.renderAll();
    }).catch(err => {
      console.warn('Fabric image load error:', err);
    });

    return () => {
      fc.dispose();
      fabricCanvasRef.current = null;
    };
  }, [isOpen, imageUrl]);

  // Handle Aspect Ratio Change
  const handleAspectRatioChange = (ratio: '16:9' | '9:16' | '1:1' | '4:5') => {
    setAspectRatio(ratio);
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    let w = 800;
    let h = 450;
    if (ratio === '9:16') { w = 450; h = 800; }
    if (ratio === '1:1') { w = 600; h = 600; }
    if (ratio === '4:5') { w = 480; h = 600; }

    fc.setDimensions({ width: w, height: h });
    fc.renderAll();
  };

  // Rotate canvas
  const handleRotate = (deg: number) => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const newRot = (rotation + deg) % 360;
    setRotation(newRot);

    const activeObj = fc.getActiveObject();
    if (activeObj) {
      activeObj.rotate((activeObj.angle || 0) + deg);
    } else {
      fc.getObjects().forEach(obj => {
        obj.rotate((obj.angle || 0) + deg);
      });
    }
    fc.renderAll();
  };

  // Add Text Layer
  const handleAddText = () => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const text = new fabric.Textbox(textInput || 'New Text Layer', {
      left: fc.width! / 2 - 100,
      top: fc.height! / 2 - 20,
      fontSize: fontSize,
      fill: textColor,
      backgroundColor: bgColor !== 'transparent' ? bgColor : '',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 'bold',
      padding: 10,
      cornerColor: '#e11d48',
      cornerSize: 10,
      transparentCorners: false,
    });

    fc.add(text);
    fc.setActiveObject(text);
    fc.renderAll();
  };

  // Add Lower-Third Banner
  const handleAddLowerThird = () => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const rect = new fabric.Rect({
      left: 40,
      top: fc.height! - 90,
      width: fc.width! - 80,
      height: 50,
      fill: '#0f172ae6',
      rx: 12,
      ry: 12,
      stroke: '#e11d48',
      strokeWidth: 2,
    });

    const text = new fabric.Textbox('LIVE • NEPAL AI NEWS', {
      left: 60,
      top: fc.height! - 78,
      fontSize: 20,
      fill: '#ffffff',
      fontWeight: 'bold',
      fontFamily: 'sans-serif',
    });

    const group = new fabric.Group([rect, text], {
      left: 40,
      top: fc.height! - 90,
    });

    fc.add(group);
    fc.setActiveObject(group);
    fc.renderAll();
  };

  // Toggle Free Drawing mode
  const toggleDrawing = () => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const nextState = !isDrawing;
    setIsDrawing(nextState);
    fc.isDrawingMode = nextState;

    if (nextState && fc.freeDrawingBrush) {
      fc.freeDrawingBrush.color = brushColor;
      fc.freeDrawingBrush.width = brushWidth;
    }
  };

  // Delete selected object
  const handleDeleteSelected = () => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const activeObj = fc.getActiveObject();
    if (activeObj) {
      fc.remove(activeObj);
      fc.renderAll();
    }
  };

  // Export modified image
  const handleExport = () => {
    const fc = fabricCanvasRef.current;
    if (!fc) return;

    const dataUrl = fc.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    // Trigger download
    const link = document.createElement('a');
    link.download = `nepalai_studio_edit_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    if (onSaveModifiedImage) {
      onSaveModifiedImage(dataUrl);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Editor Top Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>In-App Image Studio Micro-Editor</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] uppercase font-mono">
                  Fabric.js Powered
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Crop, annotate, add tickers, watermarks, filters, and export HD assets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Downloads Expire in 24 Hours</span>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export HD Image</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editor Workspace */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Canvas Viewport */}
          <div className="flex-1 bg-slate-950/80 p-6 flex items-center justify-center relative overflow-auto min-h-[350px]">
            <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 relative">
              <canvas ref={canvasRef} />
            </div>

            {/* Quick Canvas Overlay Controls */}
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur border border-slate-800 p-1.5 rounded-xl text-xs">
                <button
                  onClick={() => handleRotate(-90)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition"
                  title="Rotate Left 90°"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRotate(90)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition"
                  title="Rotate Right 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-800"></div>
                <button
                  onClick={handleDeleteSelected}
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition"
                  title="Delete Selected Object"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="pointer-events-auto bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>24h TTL Expiring Storage</span>
              </div>
            </div>
          </div>

          {/* Right Editing Tools Control Panel */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/90 flex flex-col">
            
            {/* Tool Category Tabs */}
            <div className="p-3 border-b border-slate-800 grid grid-cols-4 gap-1">
              {(['adjust', 'text', 'draw', 'stickers'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab !== 'draw' && isDrawing) toggleDrawing();
                  }}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer flex flex-col items-center gap-1 ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tab === 'adjust' && <Sliders className="w-3.5 h-3.5" />}
                  {tab === 'text' && <Type className="w-3.5 h-3.5" />}
                  {tab === 'draw' && <Pencil className="w-3.5 h-3.5" />}
                  {tab === 'stickers' && <Layers className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{tab}</span>
                </button>
              ))}
            </div>

            {/* Tool Settings Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              
              {/* TAB 1: Aspect Ratio & Adjustments */}
              {activeTab === 'adjust' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Canvas Aspect Ratio
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['16:9', '9:16', '1:1', '4:5'] as const).map(ratio => (
                        <button
                          key={ratio}
                          onClick={() => handleAspectRatioChange(ratio)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                            aspectRatio === ratio
                              ? 'bg-rose-600 border-rose-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <label className="text-xs font-bold text-slate-300 block">
                      Transform & Rotation
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRotate(-90)}
                        className="flex-1 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 font-bold flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>-90°</span>
                      </button>
                      <button
                        onClick={() => handleRotate(90)}
                        className="flex-1 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 font-bold flex items-center justify-center gap-1.5"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>+90°</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Text Layer & Formatting */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Text Caption Content
                    </label>
                    <input
                      type="text"
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      placeholder="Enter text..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Text Color</label>
                      <input
                        type="color"
                        value={textColor}
                        onChange={e => setTextColor(e.target.value)}
                        className="w-full h-9 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Background Box</label>
                      <input
                        type="color"
                        value={bgColor === 'transparent' ? '#e11d48' : bgColor}
                        onChange={e => setBgColor(e.target.value)}
                        className="w-full h-9 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddText}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Type className="w-4 h-4" />
                    <span>Add Text Layer</span>
                  </button>
                </div>
              )}

              {/* TAB 3: Freehand Brush */}
              {activeTab === 'draw' && (
                <div className="space-y-4">
                  <button
                    onClick={toggleDrawing}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      isDrawing
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Pencil className="w-4 h-4" />
                    <span>{isDrawing ? 'Drawing Mode ACTIVE' : 'Enable Freehand Brush'}</span>
                  </button>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">Brush Color</label>
                    <input
                      type="color"
                      value={brushColor}
                      onChange={e => {
                        setBrushColor(e.target.value);
                        if (fabricCanvasRef.current?.freeDrawingBrush) {
                          fabricCanvasRef.current.freeDrawingBrush.color = e.target.value;
                        }
                      }}
                      className="w-full h-9 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">Brush Size: {brushWidth}px</label>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={brushWidth}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setBrushWidth(val);
                        if (fabricCanvasRef.current?.freeDrawingBrush) {
                          fabricCanvasRef.current.freeDrawingBrush.width = val;
                        }
                      }}
                      className="w-full accent-rose-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: Lower Third & Brand Overlay Presets */}
              {activeTab === 'stickers' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 block">Studio Banners & Overlays</label>
                  <button
                    onClick={handleAddLowerThird}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500 text-left transition space-y-1 cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-rose-400 flex items-center justify-between">
                      <span>Add Lower-Third Ticker Banner</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Inserts a styled news ticker lower-third overlay at the bottom.
                    </p>
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
