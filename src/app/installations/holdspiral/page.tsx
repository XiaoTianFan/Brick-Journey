'use client'

import React from 'react'
import HoldSpiralScene from './components/HoldSpiralScene'

export default function HoldSpiralPage() {
  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <HoldSpiralScene />
      
      {/* Title */}
      <div className="absolute bottom-4 right-4 z-10">
        <h1 className="text-white text-2xl font-light tracking-wider">
          Hold Spiral
        </h1>
      </div>
    </div>
  )
} 