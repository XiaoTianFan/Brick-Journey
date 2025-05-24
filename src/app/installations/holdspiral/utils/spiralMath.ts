import * as THREE from 'three'

export interface SpiralPosition {
  position: [number, number, number]
  rotation: [number, number, number]
}

export function getSpiralPosition(t: number, index: number): SpiralPosition {
  // Spiral parameters for a tighter, more dense spiral
  const baseRadius = 8 // Reduced base radius
  const radiusVariation = 0.4 // Reduced variation for more consistent spacing
  const radius = baseRadius + Math.sin(t * 1.5) * radiusVariation
  
  // Tighter vertical spacing
  const height = t * 0.3 // Reduced from 0.5 for tighter vertical spacing
  
  // Calculate position
  const x = Math.cos(t) * radius
  const z = Math.sin(t) * radius
  const y = height - 3 // Adjusted center point
  
  // Calculate rotation to face center with slight variation
  const rotationY = -t + Math.PI / 2
  const rotationX = Math.sin(t * 0.5) * 0.1 // Small X rotation for visual interest
  const rotationZ = Math.cos(t * 0.7) * 0.05 // Tiny Z rotation
  
  return {
    position: [x, y, z],
    rotation: [rotationX, rotationY, rotationZ]
  }
} 