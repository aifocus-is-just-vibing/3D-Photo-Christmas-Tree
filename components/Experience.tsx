import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import TreeParticles from './TreeParticles';

const Experience: React.FC = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 18], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: false }}
    >
      <color attach="background" args={['#020202']} />
      
      {/* Christmas Atmosphere Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffd700" />
      {/* Red Rim Light */}
      <pointLight position={[-15, 0, -5]} intensity={0.8} color="#ef4444" />
      {/* Green Rim Light */}
      <pointLight position={[15, 5, -5]} intensity={0.8} color="#22c55e" />

      {/* Environment */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0.5} fade speed={1} />
      <Sparkles count={300} scale={15} size={3} speed={0.4} opacity={0.5} color="#fff" />
      
      {/* Content */}
      <Suspense fallback={null}>
        <TreeParticles />
      </Suspense>

      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={5} 
        maxDistance={30} 
        autoRotate={false}
        maxPolarAngle={Math.PI / 1.5}
      />

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.1} mipmapBlur intensity={1.2} radius={0.5} />
        <Vignette eskil={false} offset={0.1} darkness={1.0} />
      </EffectComposer>
    </Canvas>
  );
};

export default Experience;