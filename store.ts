import { create } from 'zustand';
import { AppState, PhotoData } from './types';
import { v4 as uuidv4 } from 'uuid';

// Default placeholder images
const DEFAULT_PHOTOS = Array.from({ length: 15 }).map((_, i) => ({
  id: `def-${i}`,
  url: `https://picsum.photos/seed/${i + 100}/500/500`
}));

export const useStore = create<AppState>((set) => ({
  photos: DEFAULT_PHOTOS,
  openness: 0,
  isCameraReady: false,
  gestureDetected: false,
  heroIndex: 0,
  showCameraPreview: true,
  setOpenness: (val) => set({ openness: val }),
  setCameraReady: (ready) => set({ isCameraReady: ready }),
  setGestureDetected: (detected) => set({ gestureDetected: detected }),
  setShowCameraPreview: (show) => set({ showCameraPreview: show }),
  addPhotos: (files) => {
    const newPhotos: PhotoData[] = files.map(file => ({
      id: uuidv4(),
      url: URL.createObjectURL(file)
    }));
    set(state => ({
      photos: [...newPhotos, ...state.photos].slice(0, 30) // Limit to 30
    }));
  },
  removePhoto: (id) => set(state => ({
    photos: state.photos.filter(p => p.id !== id)
  })),
  cycleHeroIndex: () => set(state => {
    if (state.photos.length <= 1) return { heroIndex: 0 };
    // Pick a random new index different from the current one
    let newIndex = Math.floor(Math.random() * state.photos.length);
    if (newIndex === state.heroIndex) {
      newIndex = (newIndex + 1) % state.photos.length;
    }
    return { heroIndex: newIndex };
  })
}));