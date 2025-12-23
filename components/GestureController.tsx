import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { createHandLandmarker, calculateHandOpenness } from '../services/vision';
import * as THREE from 'three';

const GestureController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setOpenness, setCameraReady, setGestureDetected, showCameraPreview } = useStore((state) => state);
  const requestRef = useRef<number | null>(null);
  const landmarkerRef = useRef<any>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  
  // Ref to track current smoothed value to avoid React state dependency in loop
  const smoothedOpennessRef = useRef(0);

  useEffect(() => {
    const initVision = async () => {
      try {
        const landmarker = await createHandLandmarker();
        landmarkerRef.current = landmarker;
        
        // Start Camera
        const constraints = {
          video: {
            width: 320,
            height: 240,
            facingMode: "user"
          }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
            setCameraReady(true);
            predictWebcam();
          });
        }
      } catch (err) {
        console.error("Error initializing vision:", err);
      }
    };

    initVision();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      // Clean up stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const predictWebcam = () => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (video && landmarker) {
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const startTimeMs = performance.now();
        const results = landmarker.detectForVideo(video, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
          setGestureDetected(true);
          const rawOpenness = calculateHandOpenness(results.landmarks);
          
          // Apply smoothing (Linear Interpolation)
          // Moves 15% towards the target per frame for smoothness
          smoothedOpennessRef.current = THREE.MathUtils.lerp(smoothedOpennessRef.current, rawOpenness, 0.15);
          
          // Clean up very small values to prevent micro-jitter at 0
          if (smoothedOpennessRef.current < 0.02) smoothedOpennessRef.current = 0;
          
          setOpenness(smoothedOpennessRef.current); 
        } else {
          setGestureDetected(false);
          // Fast decay to 0 if hand is lost, but smooth enough to avoid instant snap if it's just a flicker
          smoothedOpennessRef.current = THREE.MathUtils.lerp(smoothedOpennessRef.current, 0, 0.2);
          if (smoothedOpennessRef.current < 0.01) smoothedOpennessRef.current = 0;
          
          setOpenness(smoothedOpennessRef.current);
        }
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 pointer-events-none overflow-hidden rounded-lg shadow-lg border border-white/20 transition-all duration-500 ease-in-out ${
        showCameraPreview 
          ? 'opacity-80 translate-y-0' 
          : 'opacity-0 translate-y-10 invisible'
      }`}
    >
      {/* Hidden processing video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-32 h-24 object-cover transform scale-x-[-1]" 
      />
      <div className="absolute top-1 left-1 bg-black/50 text-[10px] text-white px-1 rounded">
        AI Vision
      </div>
    </div>
  );
};

export default GestureController;