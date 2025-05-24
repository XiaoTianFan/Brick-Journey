'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import CameraFrame from './CameraFrame'
import { GitHubRepoConfig, GitHubImageFetcher } from '../../holdspiral/utils/githubImageFetcher'

interface LensViewerProps {
  githubConfig: GitHubRepoConfig
  onLoadingChange?: (loading: boolean) => void
}

export default function LensViewer({ githubConfig, onLoadingChange }: LensViewerProps) {
  const [images, setImages] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetcherRef = useRef<GitHubImageFetcher | null>(null)

  // Initialize fetcher and load images
  useEffect(() => {
    const loadImages = async () => {
      console.log('🔄 LensViewer loading images with config:', githubConfig)
      setIsLoading(true)
      setError(null)
      onLoadingChange?.(true)

      try {
        if (!fetcherRef.current) {
          fetcherRef.current = new GitHubImageFetcher(githubConfig)
        }

        // Use sequential images for the prague brick variations
        const loadedImages = fetcherRef.current.getSequentialImages(githubConfig.maxImages || 20)
        
        console.log('📦 Loaded images:', loadedImages.length)
        
        if (loadedImages.length === 0) {
          throw new Error('No images found')
        }
        
        setImages(loadedImages)
        setCurrentIndex(0)
      } catch (err) {
        console.error('❌ Error loading images:', err)
        setError(err instanceof Error ? err.message : 'Failed to load images')
      } finally {
        setIsLoading(false)
        onLoadingChange?.(false)
      }
    }

    if (githubConfig) {
      loadImages()
    }
  }, [githubConfig, onLoadingChange])

  const handleSwipeLeft = useCallback(() => {
    if (images.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
      console.log('⬅️ Swiped left, new index:', (currentIndex + 1) % images.length)
    }
  }, [images.length, currentIndex])

  const handleSwipeRight = useCallback(() => {
    if (images.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
      console.log('➡️ Swiped right, new index:', (currentIndex - 1 + images.length) % images.length)
    }
  }, [images.length, currentIndex])

  const currentImage = images[currentIndex]

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-500 text-center p-8">
          <div className="text-xl mb-2">Error Loading Images</div>
          <div className="text-sm opacity-70">{error}</div>
        </div>
      </div>
    )
  }

  if (isLoading || !currentImage) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div>Loading lens...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <CameraFrame
        imageUrl={currentImage.download_url}
        imageName={currentImage.name}
        currentIndex={currentIndex + 1}
        totalImages={images.length}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
      />
    </div>
  )
} 