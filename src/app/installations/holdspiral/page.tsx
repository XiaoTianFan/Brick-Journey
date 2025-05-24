'use client'

import React, { useState } from 'react'
import HoldSpiralScene from './components/HoldSpiralScene'
import { GitHubRepoConfig } from './utils/githubImageFetcher'

// Configure your GitHub repository here
const githubConfig: GitHubRepoConfig = {
  owner: 'XiaoTianFan', 
  repo: 'Brick-Journey-Image', 
  path: 'img/prague/', // Path to the hold images
  branch: 'master',
  maxImages: 72, // Configure how many images to fetch (up to holdprague-hold-50.jpg)
  imagePattern: 'holdprague-hold-{n}.jpg' // Pattern for sequential numbered images
}

export default function HoldSpiralPage() {
  const [useGitHub, setUseGitHub] = useState(true) // Default to GitHub images
  const [isLoading, setIsLoading] = useState(false)
  
  const handleLoadingChange = (loading: boolean) => {
    console.log('📡 Loading state changed:', loading)
    setIsLoading(loading)
  }
  
  console.log('📊 HoldSpiralPage render - useGitHub:', useGitHub)
  
  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <HoldSpiralScene 
        githubConfig={useGitHub ? githubConfig : undefined}
        showFallback={true}
        onLoadingChange={handleLoadingChange}
      />
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-8 flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <div className="text-white text-lg font-light">Loading Prague Images...</div>
            <div className="text-white text-sm opacity-70">Preparing 3D spiral experience</div>
          </div>
        </div>
      )}
      
      {/* Toggle button - Hidden */}
      {/* 
      <div className="absolute top-1 right-4 z-10">
        <button
          onClick={handleToggle}
          className="bg-white bg-opacity-20 text-white px-4 py-2 rounded text-sm font-light hover:bg-opacity-30 transition-all duration-300"
        >
          {useGitHub ? 'Use Local Images' : 'Use GitHub Images'}
        </button>
      </div>
      */}
      
      {/* Title */}
      <div className="absolute bottom-4 right-4 z-10">
        <h1 className="text-white text-2xl font-light tracking-wider">
          Hold Spiral
        </h1>
        <h2 className="text-white text-xs font-light tracking-wider opacity-50">
          Interactive Installation
        </h2>
      </div>
    </div>
  )
} 