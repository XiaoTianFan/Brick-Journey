'use client';

import React from 'react';
import dynamic from 'next/dynamic'; // Re-enable dynamic import
// import { NextReactP5Wrapper } from '@p5-wrapper/next'; // Remove this
import { proliferationSketch } from './ProliferationSketch';

// Dynamically import ReactP5Wrapper from @p5-wrapper/react
const DynamicReactP5Wrapper = dynamic(
  () => import('@p5-wrapper/react').then(mod => mod.ReactP5Wrapper),
  {
    ssr: false, // Disable server-side rendering for this component
    loading: () => <p>Loading Sketch...</p>, // Optional loading component
  }
);

export default function ProliferationPage() {
  return (
    <div className="w-full h-screen flex flex-col bg-black">
      {/* Optional title overlay - remove if you want completely full screen */}
      <div className="absolute bottom-4 right-4 z-10 text-white">
        <h1 className="text-2xl font-bold opacity-80">Brick Proliferates</h1>
      </div>
      
      {/* Full-screen canvas container */}
      <div 
        id="proliferation-canvas-container" 
        className="w-full h-full"
      >
        {/* Use the dynamically imported ReactP5Wrapper */}
        <DynamicReactP5Wrapper sketch={proliferationSketch} />
      </div>
      
      {/* Optional description overlay*/}
      <div className="absolute bottom-4 left-4 z-10 text-white">
        <p className="text-sm opacity-80">
        </p>
      </div>
    </div>
  );
} 