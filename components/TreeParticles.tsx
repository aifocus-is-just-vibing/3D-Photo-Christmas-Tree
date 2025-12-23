import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Image, Float, Octahedron } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { PhotoData } from '../types';

// Fix: Augment JSX namespace to include React Three Fiber elements which are missing in the current type definition
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      meshStandardMaterial: any;
      pointLight: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
    }
  }
}

// Helper to distribute points in a cone/tree shape
const generateTreePositions = (count: number, radius: number, height: number) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const ratio = i / count;
    const y = ratio * height - height / 2; // Bottom to top
    const r = radius * (1 - ratio); // Cone shape
    const angle = i * 137.5 * (Math.PI / 180); // Golden angle for spiral
    
    // Add some noise
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
};

const TreeParticles: React.FC = () => {
  const { photos } = useStore((state) => state);
  return (
    <group position={[0, -2, 0]}>
       <TreeContent photos={photos} />
    </group>
  );
};

// Wrapper that handles the group rotation based on gesture
const TreeContent = ({ photos }: { photos: PhotoData[] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { heroIndex, cycleHeroIndex } = useStore(state => state);
  const hasCycledRef = useRef(false);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const openness = useStore.getState().openness;
    
    // Cycle Hero Photo when tree is fully contracted (closed hand)
    if (openness < 0.1 && !hasCycledRef.current) {
      cycleHeroIndex();
      hasCycledRef.current = true;
    } else if (openness > 0.2) {
      hasCycledRef.current = false;
    }
    
    // Rotation Control:
    // Fast spin when closed (openness 0 -> speed 1.0)
    // Slow down as it opens
    // STOP completely when fully open (>0.9) so user can see the photo
    
    let targetSpeed = 0;
    if (openness < 0.9) {
      targetSpeed = THREE.MathUtils.lerp(1.2, 0.1, openness / 0.9);
    } else {
      targetSpeed = 0;
    }
    
    groupRef.current.rotation.y += targetSpeed * delta;
  });
  
  return (
    <group ref={groupRef}>
      <TopStar />
      <SmartLights />
      {photos.map((photo, i) => (
         <SmartPhoto 
            key={photo.id} 
            url={photo.url} 
            index={i} 
            total={photos.length} 
            isHero={i === heroIndex}
         />
      ))}
    </group>
  );
}

const TopStar = () => {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (ref.current) {
      const openness = useStore.getState().openness;

      // Gentle floating/spinning animation
      ref.current.rotation.y = state.clock.elapsedTime * 0.5;
      
      // Pulse scale
      const basePulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      
      // HIDE STAR when tree expands (openness > 0.4 starts fading, > 0.8 gone)
      // This ensures the star doesn't block the view or look awkward floating alone
      let visibilityScale = 1;
      if (openness > 0.2) {
         // Map openness 0.2->0.8 to visibility 1->0
         visibilityScale = 1 - THREE.MathUtils.clamp((openness - 0.2) / 0.6, 0, 1);
      }
      
      const targetScale = basePulse * visibilityScale;
      
      // Smooth lerp
      ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
    }
  });

  return (
    <group position={[0, 6.5, 0]} ref={ref}>
       <Octahedron args={[0.6, 0]}>
          <meshStandardMaterial 
            color="#fbbf24" 
            emissive="#fbbf24" 
            emissiveIntensity={3} 
            toneMapped={false} 
          />
       </Octahedron>
       <pointLight distance={5} intensity={2} color="#fbbf24" />
    </group>
  );
};

const SmartPhoto = ({ url, index, total, isHero }: {url: string, index: number, total: number, isHero: boolean}) => {
   const group = useRef<THREE.Group>(null);
   
   // Initial Tree Position (Spiral)
   const treePos = useMemo(() => {
    const ratio = index / total;
    const height = 12;
    const radius = 3.5;
    const y = ratio * height - height / 2;
    const r = radius * (1 - ratio);
    const angle = index * 2.4; 
    return new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
  }, [index, total]);

  const expandedPos = useMemo(() => treePos.clone().multiplyScalar(2.0), [treePos]);

   useFrame((state, delta) => {
      if(!group.current) return;
      const rawOpenness = useStore.getState().openness;
      
      const ud = group.current.userData;
      if (ud.currentOpenness === undefined) ud['currentOpenness'] = 0;
      ud.currentOpenness = THREE.MathUtils.lerp(ud.currentOpenness, rawOpenness, delta * 2.5);
      const openness = ud.currentOpenness;

      let targetPos = new THREE.Vector3();
      let targetScale = 0;
      let targetQuaternion = new THREE.Quaternion(); // For rotation matching

      if (openness < 0.1) {
        // Contracted
        targetPos.copy(treePos);
        targetScale = 0;
        targetQuaternion.copy(group.current.quaternion); // No change
      } else if (openness < 0.85) {
        // Expanding
        const t = (openness - 0.1) / 0.75;
        targetPos.lerpVectors(treePos, expandedPos, t);
        targetScale = THREE.MathUtils.lerp(0.1, 1.5, t); 
        // Look at camera
        group.current.lookAt(state.camera.position);
        targetQuaternion.copy(group.current.quaternion);
      } else {
         // Hero Moment (> 0.85)
         const t = (openness - 0.85) / 0.15;
         
         if (isHero) {
            // FIX: Calculate position in WORLD space, then convert to LOCAL space
            // This ensures it is always centered regardless of tree rotation
            
            const camDir = new THREE.Vector3();
            state.camera.getWorldDirection(camDir);
            
            // 4 units in front of camera
            const heroWorldPos = state.camera.position.clone().add(camDir.multiplyScalar(4));
            
            if (group.current.parent) {
                // Convert World Position to Local Position relative to the rotating tree group
                targetPos.copy(heroWorldPos);
                group.current.parent.worldToLocal(targetPos);
                
                // Convert World Rotation to Local Rotation
                // LocalQ = ParentInverseQ * WorldQ
                const parentInv = group.current.parent.quaternion.clone().invert();
                targetQuaternion.copy(parentInv.multiply(state.camera.quaternion));
            } else {
                targetPos.copy(heroWorldPos);
                targetQuaternion.copy(state.camera.quaternion);
            }

            // Scale up significantly
            targetScale = THREE.MathUtils.lerp(1.5, 3.0, t); // Adjusted scale for closer fit
            
         } else {
            // Others fly out
            const out = expandedPos.clone().multiplyScalar(2.5);
            targetPos.lerpVectors(expandedPos, out, t);
            targetScale = THREE.MathUtils.lerp(1.5, 0, t);
            group.current.lookAt(state.camera.position);
            targetQuaternion.copy(group.current.quaternion);
         }
      }
      
      group.current.position.lerp(targetPos, delta * 5);
      
      if (isHero && openness > 0.85) {
         // Use slerp for smooth rotation transition to camera alignment
         group.current.quaternion.slerp(targetQuaternion, delta * 5);
      } else if (openness >= 0.1) {
         group.current.lookAt(state.camera.position);
      }

      const currentScale = group.current.scale.x;
      const smoothScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 5);
      group.current.scale.setScalar(smoothScale);
   });

   return (
     <group ref={group}>
        <Image url={url} transparent scale={[1,1,1]} side={THREE.DoubleSide} />
     </group>
   )
}

const SmartLights = () => {
  const points = useRef<THREE.Points>(null);
  const count = 2000;
  const positions = useMemo(() => generateTreePositions(count, 3.8, 13), []);
  
  // Christmas Colors
  const colors = useMemo(() => {
    const c = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ef4444'), // Red
      new THREE.Color('#22c55e'), // Green
      new THREE.Color('#fbbf24'), // Gold
      new THREE.Color('#ffffff'), // White
    ];
    for(let i=0; i<count; i++) {
        const col = palette[Math.floor(Math.random() * palette.length)];
        c[i*3] = col.r;
        c[i*3+1] = col.g;
        c[i*3+2] = col.b;
    }
    return c;
  }, []);

  useFrame((state, delta) => {
    if(!points.current) return;
    const openness = useStore.getState().openness;
    
    // Scale expansion
    const targetScale = 1 + openness * 2.0;
    points.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 2);

    // Opacity
    const mat = points.current.material as THREE.Material;
    // Fade out when hero mode starts (>0.8)
    const targetOpacity = openness > 0.8 ? 0 : 1;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 5);
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial 
        transparent 
        vertexColors
        size={0.15} 
        sizeAttenuation 
        depthWrite={false} 
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default TreeParticles;