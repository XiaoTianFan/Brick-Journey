'use client'

import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vector3 } from 'three'
import SpiralGroup from './SpiralGroup'

// Camera controller component
function CameraController({ isInside, setIsInside }: { isInside: boolean; setIsInside: (inside: boolean) => void }) {
  const { camera, gl } = useThree()
  const targetPosition = useRef(new Vector3())
  const currentPosition = useRef(new Vector3())
  const isTransitioning = useRef(false)
  const orbitControlsRef = useRef<any>(null)
  
  // Define camera positions for more dramatic effect
  const outsidePosition = new Vector3(2, 2, 12) // Slightly elevated and further back
  const insidePosition = new Vector3(0, 2, 0.5) // Inside the spiral, slightly below center
  
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
        setIsInside(!isInside)
        targetPosition.current.copy(isInside ? outsidePosition : insidePosition)
        
        // Disable orbit controls during transition
        if (orbitControlsRef.current) {
          orbitControlsRef.current.enabled = false
        }
        
        // Reset transition flag and re-enable controls after animation
        setTimeout(() => {
          isTransitioning.current = false
          if (orbitControlsRef.current) {
            orbitControlsRef.current.enabled = true
            // Update orbit controls target based on new view
            orbitControlsRef.current.target.set(0, isInside ? 2 : 0, 0)
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
    if (isTransitioning.current) {
      // Lerp camera position for smooth transition
      const lerpSpeed = 0.03
      currentPosition.current.lerp(targetPosition.current, lerpSpeed)
      camera.position.copy(currentPosition.current)
    }
  })
  
  return (
    <OrbitControls
      ref={orbitControlsRef}
      enableZoom={true}
      enablePan={true}
      enableRotate={true}
      target={[0, isInside ? 2 : 0, 0]}
      minDistance={isInside ? 0.1 : 2}
      maxDistance={isInside ? 3 : 25}
      enableDamping={true}
      dampingFactor={0.05}
    />
  )
}

export default function HoldSpiralScene() {
  const [isInside, setIsInside] = useState(false)
  
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ 
          position: [2, 2, 12], 
          fov: isInside ? 80 : 60
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
          <SpiralGroup />
        </Suspense>
      </Canvas>
      
      {/* Enhanced instruction text */}
      <div className="absolute top-4 left-4 z-10 text-white text-sm font-light opacity-70 transition-opacity duration-500">
        <div>{isInside ? 'Click to exit spiral' : 'Click to enter spiral'}</div>
        <div className="text-xs mt-1 opacity-50">Drag to rotate • Scroll to zoom</div>
      </div>
      
      {/* Visual state indicator */}
      <div className="absolute bottom-4 left-4 z-10 text-white text-xs font-light opacity-50">
        {isInside ? 'Inside View' : 'Outside View'}
      </div>
    </div>
  )
} 