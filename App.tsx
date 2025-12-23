import React from 'react';
import Experience from './components/Experience';
import GestureController from './components/GestureController';
import UIOverlay from './components/UIOverlay';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-black">
      <Experience />
      <UIOverlay />
      <GestureController />
    </div>
  );
};

export default App;
