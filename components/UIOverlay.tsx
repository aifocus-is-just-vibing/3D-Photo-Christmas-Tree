import React, { useRef } from 'react';
import { useStore } from '../store';
import { clsx } from 'clsx';

const UIOverlay: React.FC = () => {
  const { photos, addPhotos, removePhoto, isCameraReady, gestureDetected, openness, showCameraPreview, setShowCameraPreview } = useStore((state) => state);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addPhotos(Array.from(e.target.files));
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Top Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
           <h1 className="text-4xl font-bold text-white tracking-tighter drop-shadow-lg font-serif">
             <span className="text-red-500">3D Photo</span> <span className="text-green-500">Christmas Tree</span>
           </h1>
           <p className="text-white/80 text-sm mt-1 max-w-xs shadow-black drop-shadow-md">
             Upload photos, then use your hand to open the magic tree.
           </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2 items-end">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCameraPreview(!showCameraPreview)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-3 py-2 rounded-full text-xs transition-all flex items-center gap-1"
            >
              {showCameraPreview ? '👁️ Hide Camera' : '📷 Show Camera'}
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-red-600/20 hover:bg-red-600/40 backdrop-blur-md text-white border border-red-500/30 px-4 py-2 rounded-full text-sm transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            >
              + Add Photos ({photos.length})
            </button>
          </div>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
          />
          
          <div className="max-h-40 overflow-y-auto w-16 flex flex-col gap-1 pr-1">
             {photos.map(p => (
               <div key={p.id} className="relative group w-full aspect-square">
                 <img src={p.url} className="w-full h-full object-cover rounded border border-white/10" alt="" />
                 <button 
                    onClick={() => removePhoto(p.id)}
                    className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-xs"
                 >✕</button>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="self-center pointer-events-auto text-center mb-8">
         <div className={clsx(
           "px-6 py-3 rounded-2xl backdrop-blur-xl border transition-all duration-500 shadow-lg",
           isCameraReady 
             ? gestureDetected 
                ? openness > 0.8 
                  ? "bg-green-600/20 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]" 
                  : "bg-red-600/20 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                : "bg-gray-800/60 border-gray-600"
             : "bg-gray-800/80 border-gray-700"
         )}>
           <p className="text-white font-medium text-lg flex items-center gap-3">
             {!isCameraReady && (
               <>📷 <span className="animate-pulse">Starting Camera...</span></>
             )}
             {isCameraReady && !gestureDetected && (
               <>✋ Show your hand to control</>
             )}
             {isCameraReady && gestureDetected && openness < 0.2 && (
               <>✊ <span className="text-red-300">Tree Contracted</span></>
             )}
             {isCameraReady && gestureDetected && openness >= 0.2 && openness <= 0.8 && (
               <>🖐️ <span className="text-yellow-300">Opening... {(openness * 100).toFixed(0)}%</span></>
             )}
             {isCameraReady && gestureDetected && openness > 0.8 && (
               <>✨ <span className="text-green-300">Merry Christmas!</span></>
             )}
           </p>
           
           {/* Visual Meter */}
           {isCameraReady && gestureDetected && (
             <div className="w-full bg-white/10 h-1.5 mt-2 rounded-full overflow-hidden">
               <div 
                 className={clsx(
                   "h-full transition-all duration-100 ease-out",
                   openness > 0.8 ? "bg-green-400" : "bg-red-400"
                 )}
                 style={{ width: `${Math.min(100, openness * 100)}%` }}
               />
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

export default UIOverlay;