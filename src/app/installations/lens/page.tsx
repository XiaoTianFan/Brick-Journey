'use client'

import React, { useState } from 'react'
import LensViewer from './components/LensViewer'
import { GitHubRepoConfig } from '../holdspiral/utils/githubImageFetcher'

// Configure GitHub repository for Prague brick variation images
const githubConfig: GitHubRepoConfig = {
  owner: 'XiaoTianFan', 
  repo: 'Brick-Journey-Image', 
  path: 'img/prague/', // Path to the prague images
  branch: 'master',
  maxImages: 20, // Configure how many variations to fetch
  imagePattern: 'prague-brick-variation-{n}.png' // Pattern for prague brick variation images
}

export default function LensPage() {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleLoadingChange = (loading: boolean) => {
    console.log('📡 Lens loading state changed:', loading)
    setIsLoading(loading)
  }
  
  console.log('📊 LensPage render with config:', githubConfig)
  
  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <LensViewer 
        githubConfig={githubConfig}
        onLoadingChange={handleLoadingChange}
      />
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-8 flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <div className="text-white text-lg font-light">Loading Prague Variations...</div>
            <div className="text-white text-sm opacity-70">Preparing camera frame experience</div>
          </div>
        </div>
      )}
      
      {/* Title */}
      <div className="absolute bottom-4 right-4 z-10">
        <h1 className="text-white text-2xl font-light tracking-wider">
          Lens
        </h1>
        <h2 className="text-white text-xs font-light tracking-wider opacity-50">
          Prague Brick Variations
        </h2>
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="text-white text-sm font-light opacity-70">
          <div>Swipe to change variation</div>
          <div>Tap to view full frame</div>
        </div>
      </div>
    </div>
  )
} 