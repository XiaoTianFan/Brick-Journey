'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import * as THREE from 'three'
import { getSpiralPosition } from '../utils/spiralMath'

export default function SpiralGroup() {
  const groupRef = useRef<THREE.Group>(null)
  
  // Load textures
  const brickTexture = useLoader(TextureLoader, '/images/Brick.png')
  const clayTexture = useLoader(TextureLoader, '/images/Clay.png')
  
  // Set texture properties for better quality
  brickTexture.minFilter = THREE.LinearFilter
  clayTexture.minFilter = THREE.LinearFilter
  
  // Calculate aspect ratios once textures are loaded
  const brickAspectRatio = brickTexture.image ? brickTexture.image.width / brickTexture.image.height : 1
  const clayAspectRatio = clayTexture.image ? clayTexture.image.width / clayTexture.image.height : 1
  
  // Generate spiral positions with more density
  const spiralPositions = useMemo(() => {
    const positions = []
    const numPanels = 100 // Increased from 20 to 60 for more density
    
    for (let i = 0; i < numPanels; i++) {
      const t = (i / numPanels) * Math.PI * 8 // 8 full rotations instead of 4
      positions.push(getSpiralPosition(t, i))
    }
    
    return positions
  }, [])
  
  // Rotation animation - slower for better viewing
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1 // Slower rotation
    }
  })
  
  return (
    <group ref={groupRef}>
      {spiralPositions.map((position, index) => {
        const isBrick = index % 2 === 0
        const texture = isBrick ? brickTexture : clayTexture
        const aspectRatio = isBrick ? brickAspectRatio : clayAspectRatio
        
        // Calculate panel dimensions maintaining aspect ratio
        const baseSize = 1.2 // Reduced from 1.5 for more density
        const width = aspectRatio > 1 ? baseSize : baseSize * aspectRatio
        const height = aspectRatio > 1 ? baseSize / aspectRatio : baseSize
        
        return (
          <mesh key={index} position={position.position} rotation={position.rotation}>
            <planeGeometry args={[width, height]} />
            <meshStandardMaterial
              map={texture}
              side={THREE.DoubleSide}
              transparent={true}
              opacity={0.9}
            />
          </mesh>
        )
      })}
    </group>
  )
} 