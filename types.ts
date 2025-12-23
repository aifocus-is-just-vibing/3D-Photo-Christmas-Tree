export interface PhotoData {
  id: string;
  url: string;
}

export interface AppState {
  photos: PhotoData[];
  openness: number; // 0 to 1
  setOpenness: (val: number) => void;
  addPhotos: (files: File[]) => void;
  removePhoto: (id: string) => void;
  isCameraReady: boolean;
  setCameraReady: (ready: boolean) => void;
  gestureDetected: boolean;
  setGestureDetected: (detected: boolean) => void;
  heroIndex: number;
  cycleHeroIndex: () => void;
  showCameraPreview: boolean;
  setShowCameraPreview: (show: boolean) => void;
}