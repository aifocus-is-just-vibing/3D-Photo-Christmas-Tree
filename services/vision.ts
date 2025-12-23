import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let handLandmarker: HandLandmarker | null = null;
let runningMode: "IMAGE" | "VIDEO" = "VIDEO";

export const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: runningMode,
    numHands: 1,
    minHandDetectionConfidence: 0.7, // Increased from default 0.5 to reduce false positives
    minHandPresenceConfidence: 0.7,  // Increased to ensure hand is really there
    minTrackingConfidence: 0.6
  });
  return handLandmarker;
};

// Calculate openness based on ratio of fingertip distance to palm size
// This ensures the value works regardless of how close/far the hand is from the camera
export const calculateHandOpenness = (landmarks: any[]) => {
  if (!landmarks || landmarks.length === 0) return 0;
  
  const hand = landmarks[0]; // First detected hand
  const wrist = hand[0];
  const middleMCP = hand[9]; // Middle finger knuckle (base of finger)

  // Calculate Reference Scale (Palm size)
  // Distance between Wrist and Middle Knuckle
  const scale = Math.sqrt(
    Math.pow(middleMCP.x - wrist.x, 2) + 
    Math.pow(middleMCP.y - wrist.y, 2)
  );
  
  // Prevent division by zero or errors with tiny detections
  if (scale < 0.005) return 0;

  // Fingertip indices: Thumb(4), Index(8), Middle(12), Ring(16), Pinky(20)
  const tips = [4, 8, 12, 16, 20];
  
  let totalRatio = 0;
  tips.forEach(idx => {
    const tip = hand[idx];
    const dist = Math.sqrt(
      Math.pow(tip.x - wrist.x, 2) + 
      Math.pow(tip.y - wrist.y, 2)
    );
    // Normalize distance by palm scale
    totalRatio += dist / scale;
  });
  
  const avgRatio = totalRatio / tips.length;
  
  // Tuned Ratios based on anatomy:
  // Closed Fist: Fingertips are close to knuckles. Ratio is roughly 1.0 (tips near MCPs)
  // Open Hand: Fingertips extended. Ratio is roughly 2.0+ (fingers are about length of palm)
  
  // We set a range that feels responsive
  const minRatio = 1.1;  // Slightly above 1.0 to allow for tight fist to be 0
  const maxRatio = 2.1;  // Reachable without over-stretching
  
  const openness = (avgRatio - minRatio) / (maxRatio - minRatio);
  return Math.max(0, Math.min(1, openness));
};
