'use client'

import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import SpiralGroup from './SpiralGroup'
import { GitHubRepoConfig } from '../utils/githubImageFetcher'

// Camera controller component
function CameraController({ isInside, setIsInside }: { isInside: boolean; setIsInside: (inside: boolean) => void }) {
  const { camera, gl } = useThree()
  const targetPosition = useRef(new Vector3())
  const currentPosition = useRef(new Vector3())
  const isTransitioning = useRef(false)
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null)
  
  // Define camera positions for more dramatic effect
  const outsidePosition = new Vector3(0, 2, 16) // Slightly elevated and further back
  const insidePosition = new Vector3(0, 0, 0) // Inside the spiral center
  
  // Define target positions for orbit controls
  const outsideTarget = new Vector3(0, 0, 0)
  const insideTarget = new Vector3(0, 0, 0) // Look slightly upward when inside
  
  // Set initial positions
  React.useEffect(() => {
    currentPosition.current.copy(camera.position)
    targetPosition.current.copy(outsidePosition)
  }, [])
  
  // Handle click to toggle view (only when not dragging)
  React.useEffect(() => {
    let isMouseDown = false
    let mouseMovedDistance = 0
    let startMousePos = { x: 0, y: 0 }
    
    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true
      mouseMovedDistance = 0
      startMousePos = { x: e.clientX, y: e.clientY }
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDown) {
        const deltaX = e.clientX - startMousePos.x
        const deltaY = e.clientY - startMousePos.y
        mouseMovedDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      }
    }
    
    const handleMouseUp = () => {
      if (isMouseDown && mouseMovedDistance < 5 && !isTransitioning.current) {
        // Only toggle if it was a click (not drag) and not transitioning
        isTransitioning.current = true
        const newIsInside = !isInside
        setIsInside(newIsInside)
        
        // Set new target position
        targetPosition.current.copy(newIsInside ? insidePosition : outsidePosition)
        
        // Immediately update orbit controls target and settings
        if (orbitControlsRef.current) {
          orbitControlsRef.current.enabled = false
          
          // Update target immediately
          const newTarget = newIsInside ? insideTarget : outsideTarget
          orbitControlsRef.current.target.copy(newTarget)
          orbitControlsRef.current.update()
        }
        
        // Reset transition flag and re-enable controls after animation
        setTimeout(() => {
          isTransitioning.current = false
          if (orbitControlsRef.current) {
            orbitControlsRef.current.enabled = true
            orbitControlsRef.current.update()
          }
        }, 2000)
      }
      isMouseDown = false
    }
    
    gl.domElement.addEventListener('mousedown', handleMouseDown)
    gl.domElement.addEventListener('mousemove', handleMouseMove)
    gl.domElement.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      gl.domElement.removeEventListener('mousedown', handleMouseDown)
      gl.domElement.removeEventListener('mousemove', handleMouseMove)
      gl.domElement.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isInside, setIsInside, gl])
  
  // Smooth camera animation during transitions
  useFrame(() => {
    if (isTransitioning.current && orbitControlsRef.current) {
      // Lerp camera position for smooth transition
      const lerpSpeed = 0.04
      currentPosition.current.lerp(targetPosition.current, lerpSpeed)
      camera.position.copy(currentPosition.current)
      
      // Update orbit controls object3d to maintain sync
      orbitControlsRef.current.object = camera
      orbitControlsRef.current.update()
    }
  })
  
  return (
    <OrbitControls
      ref={orbitControlsRef}
      enableZoom={true}
      enablePan={true}
      enableRotate={true}
      target={isInside ? insideTarget : outsideTarget}
      minDistance={isInside ? 0.5 : 2}
      maxDistance={isInside ? 4 : 25}
      enableDamping={true}
      dampingFactor={0.05}
      // Better angle limits for inside view
      maxPolarAngle={isInside ? Math.PI : Math.PI}
      minPolarAngle={isInside ? 0 : 0}
    />
  )
}

interface HoldSpiralSceneProps {
  githubConfig?: GitHubRepoConfig  // Optional: if provided, use GitHub images
  showFallback?: boolean
  onLoadingChange?: (loading: boolean) => void // Callback to notify parent of loading state
}

export default function HoldSpiralScene({ 
  githubConfig,
  showFallback = true,
  onLoadingChange
}: HoldSpiralSceneProps = {}) {
  const [isInside, setIsInside] = useState(false)
  
  console.log('🎬 HoldSpiralScene render:', { 
    hasGithubConfig: !!githubConfig, 
    githubConfig, 
    showFallback 
  })
  
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ 
          position: [0, 2, 12], 
          fov: isInside ? 75 : 60
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          cursor: 'grab'
        }}
      >
        {/* Enhanced lighting for better inside view */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={0.8} 
        />
        <directionalLight 
          position={[-5, -5, 5]} 
          intensity={0.3} 
          color="#4488ff"
        />
        
        {/* Camera controller for interaction */}
        <CameraController isInside={isInside} setIsInside={setIsInside} />
        
        {/* Suspense for async loading */}
        <Suspense fallback={null}>
          <SpiralGroup 
            githubConfig={githubConfig}
            useFallbackImages={showFallback}
            onLoadingChange={onLoadingChange}
          />
        </Suspense>
      </Canvas>
      
      {/* Enhanced instruction text */}
      <div className="absolute top-4 left-4 z-10 text-white text-sm font-light opacity-70 transition-opacity duration-500">
        <div>{isInside ? 'Click to exit spiral' : 'Click to enter spiral'}</div>
        <div className="text-xs mt-1 opacity-50">Drag to rotate • Scroll to zoom</div>
      </div>
      
      {/* GitHub repo indicator - Hidden */}
      {/* 
      {githubConfig && (
        <div className="absolute top-12 right-4 z-10 text-white text-xs font-light opacity-50">
          <div>Images from: {githubConfig.owner}/{githubConfig.repo}</div>
          {githubConfig.path && <div>Path: {githubConfig.path}</div>}
        </div>
      )}
      */}
      
      {/* Visual state indicator */}
      <div className="absolute bottom-4 left-4 z-10 text-white text-xs font-light opacity-50">
        {isInside ? 'Inside View' : 'Outside View'}
      </div>
    </div>
  )
} 