'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface CameraFrameProps {
  imageUrl: string
  imageName: string
  currentIndex: number
  totalImages: number
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

export default function CameraFrame({
  imageUrl,
  imageName,
  currentIndex,
  totalImages,
  onSwipeLeft,
  onSwipeRight
}: CameraFrameProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset image state when URL changes
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [imageUrl])

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (Math.abs(distance) < minSwipeDistance) {
      // Small movement, do nothing (no tap handler)
      return
    }

    if (distance > minSwipeDistance) {
      // Swipe left (next image)
      onSwipeLeft()
    } else if (distance < -minSwipeDistance) {
      // Swipe right (previous image)
      onSwipeRight()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      onSwipeRight()
    } else if (e.key === 'ArrowRight') {
      onSwipeLeft()
    }
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-gray-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`Prague brick variation ${currentIndex} of ${totalImages}`}
    >
      {/* Camera Frame Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Camera frame border */}
        <div className="absolute inset-8 border-4 border-white border-opacity-80 rounded-lg shadow-2xl">
          {/* Corner markers */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-red-500"></div>
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-red-500"></div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-red-500"></div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-red-500"></div>
          
          {/* Center crosshair */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-0.5 bg-white bg-opacity-60"></div>
            <div className="w-0.5 h-8 bg-white bg-opacity-60 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
        
        {/* Camera UI elements */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
          {/* Recording indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-mono">REC</span>
          </div>
          
          {/* Settings icon */}
          <div className="text-white text-opacity-70">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8a4 4 0 100 8 4 4 0 000-8zM12 10a2 2 0 110 4 2 2 0 010-4z"/>
              <path fillRule="evenodd" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.094c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.807-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"/>
            </svg>
          </div>
        </div>
        
        {/* Bottom UI */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          {/* Image counter */}
          <div className="text-white text-sm font-mono bg-black bg-opacity-50 px-3 py-1 rounded">
            {currentIndex.toString().padStart(2, '0')}/{totalImages.toString().padStart(2, '0')}
          </div>
          
          {/* Image name */}
          <div className="text-white text-xs bg-black bg-opacity-50 px-3 py-1 rounded max-w-48 truncate">
            {imageName}
          </div>
        </div>
      </div>

      {/* Main Image - Now as background */}
      <div className="relative w-full h-full">
        <div className="relative w-full h-full overflow-hidden rounded-lg bg-gray-800">
          {/* Background placeholder */}
          <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-900"></div>
          
          {/* Foreground Image - Bottom Center */}
          {!imageError ? (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10 flex items-end justify-center">
              <Image
                src={imageUrl}
                alt={`Prague brick variation ${currentIndex}`}
                width={600}
                height={400}
                className={`object-contain object-bottom transition-opacity duration-300 h-[50vh] w-auto max-w-[90vw] ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                priority
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true)
                  console.error('❌ Failed to load image:', imageUrl)
                }}
              />
            </div>
          ) : (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
              <div className="text-white text-lg mb-2">⚠️</div>
              <div className="text-white text-sm">Failed to load image</div>
              <div className="text-gray-400 text-xs mt-1">{imageName}</div>
            </div>
          )}
          
          {/* Loading state */}
          {!imageLoaded && !imageError && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <div className="text-white text-sm">Loading...</div>
            </div>
          )}
        </div>
      </div>

      {/* Swipe indicators */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-opacity-50 pointer-events-none">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </div>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-opacity-50 pointer-events-none">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
        </svg>
      </div>
    </div>
  )
} 