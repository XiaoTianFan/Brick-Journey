'use client'

import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import * as THREE from 'three'
import { getSpiralPosition } from '../utils/spiralMath'
import { useGitHubImages } from '../utils/useGitHubImages'
import { GitHubRepoConfig } from '../utils/githubImageFetcher'

interface SpiralGroupProps {
  githubConfig?: GitHubRepoConfig  // Optional: if provided, use GitHub images
  numPanels?: number
  rotationSpeed?: number
  panelSize?: number
  useFallbackImages?: boolean
  onLoadingChange?: (loading: boolean) => void // Callback to notify parent of loading state
}

export default function SpiralGroup({
  githubConfig,
  numPanels = 100,
  rotationSpeed = 0.05,
  panelSize = 2.0,
  useFallbackImages = true,
  onLoadingChange
}: SpiralGroupProps = {}) {
  const groupRef = useRef<THREE.Group>(null)
  
  console.log('🌀 SpiralGroup render:', { 
    hasGithubConfig: !!githubConfig, 
    githubConfig,
    numPanels, 
    useFallbackImages 
  })
  
  // Load fallback/local textures
  const brickTexture = useLoader(TextureLoader, '/images/Brick.png')
  const clayTexture = useLoader(TextureLoader, '/images/Clay.png')
  
  // Set texture properties for better quality
  brickTexture.minFilter = THREE.LinearFilter
  clayTexture.minFilter = THREE.LinearFilter
  
  // Calculate fallback aspect ratios
  const brickAspectRatio = brickTexture.image ? brickTexture.image.width / brickTexture.image.height : 1
  const clayAspectRatio = clayTexture.image ? clayTexture.image.width / clayTexture.image.height : 1
  
  // GitHub images (hook will handle undefined config gracefully)
  const { images: githubImages, loading, error, hasImages } = useGitHubImages({
    config: githubConfig, // Pass undefined when not provided
    count: numPanels,
    random: false, // Use sequential order for numbered images
    autoRefresh: false,
    useSequential: true // Use sequential numbered images
  })
  
  console.log('📊 GitHub images state:', { 
    githubImagesCount: githubImages.length,
    loading, 
    error, 
    hasImages,
    firstFewImages: githubImages.slice(0, 3)
  })
  
  // State for loaded GitHub textures
  const [githubTextures, setGithubTextures] = useState<THREE.Texture[]>([])
  const [texturesLoading, setTexturesLoading] = useState(false)
  
  // Overall loading state (either fetching images or loading textures)
  const overallLoading = loading || texturesLoading
  
  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(overallLoading)
    }
  }, [overallLoading, onLoadingChange])
  
  // Load GitHub images as textures (only if we have GitHub config and images)
  useEffect(() => {
    console.log('🔄 Texture loading effect triggered:', { 
      hasGithubConfig: !!githubConfig,
      hasImages, 
      githubImagesLength: githubImages.length 
    })
    
    if (!githubConfig || !hasImages || githubImages.length === 0) {
      console.log('❌ Skipping texture loading - no config, images, or empty array')
      return
    }
    
    const loadTextures = async () => {
      console.log('⏳ Starting texture loading for', githubImages.length, 'images')
      setTexturesLoading(true)
      const textureLoader = new THREE.TextureLoader()
      const textures: THREE.Texture[] = []
      
      try {
        // Load textures in parallel
        const texturePromises = githubImages.map((image, index) => {
          return new Promise<THREE.Texture>((resolve, reject) => {
            console.log(`🖼️ Loading texture ${index + 1}:`, image.download_url)
            textureLoader.load(
              image.download_url,
              (texture) => {
                texture.minFilter = THREE.LinearFilter
                texture.magFilter = THREE.LinearFilter
                console.log(`✅ Texture ${index + 1} loaded successfully`)
                resolve(texture)
              },
              undefined,
              (error) => {
                console.error(`❌ Failed to load texture ${index + 1} from ${image.download_url}:`, error)
                reject(error)
              }
            )
          })
        })
        
        console.log('⏳ Waiting for all textures to load...')
        const loadedTextures = await Promise.allSettled(texturePromises)
        
        // Filter out failed loads and get successful textures
        loadedTextures.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            textures.push(result.value)
            console.log(`✅ Texture ${index + 1} added to collection`)
          } else {
            console.error(`❌ Texture ${index + 1} failed:`, result.reason)
          }
        })
        
        console.log('🎯 Final textures loaded:', textures.length, 'out of', githubImages.length)
        setGithubTextures(textures)
      } catch (error) {
        console.error('❌ Error loading GitHub textures:', error)
      } finally {
        setTexturesLoading(false)
        console.log('✅ Texture loading complete')
      }
    }
    
    loadTextures()
  }, [githubImages, hasImages, githubConfig])
  
  // Generate spiral positions
  const spiralPositions = useMemo(() => {
    const positions = []
    
    for (let i = 0; i < numPanels; i++) {
      const t = (i / numPanels) * Math.PI * 8 // 8 full rotations
      positions.push(getSpiralPosition(t))
    }
    
    return positions
  }, [numPanels])
  
  // Rotation animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * rotationSpeed
    }
  })
  
  // Determine which textures to use
  const shouldUseGitHub = githubConfig && hasImages && githubTextures.length > 0 && !texturesLoading
  const shouldUseFallback = !githubConfig || useFallbackImages && (!shouldUseGitHub || loading)
  
  console.log('🎨 Texture decision:', {
    shouldUseGitHub,
    shouldUseFallback,
    githubTexturesCount: githubTextures.length,
    texturesLoading,
    loading,
    hasGithubConfig: !!githubConfig,
    hasImages
  })
  
  // If we have GitHub config but no textures and no fallback, show loading/error state
  if (githubConfig && !shouldUseGitHub && !shouldUseFallback) {
    console.log('⏸️ Showing loading/error state')
    return (
      <group ref={groupRef}>
        {loading && (
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2, 1, 0.1]} />
            <meshStandardMaterial color="#4488ff" opacity={0.8} transparent />
          </mesh>
        )}
        {error && !loading && (
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[3, 1, 0.1]} />
            <meshStandardMaterial color="#ff4444" opacity={0.8} transparent />
          </mesh>
        )}
      </group>
    )
  }
  
  console.log('🖼️ Rendering spiral with', shouldUseGitHub ? 'GitHub' : 'local', 'textures')
  
  return (
    <group ref={groupRef}>
      {spiralPositions.map((position, index) => {
        let texture: THREE.Texture
        let aspectRatio: number
        
        if (shouldUseGitHub) {
          // Use GitHub textures
          texture = githubTextures[index % githubTextures.length]
          aspectRatio = texture.image ? texture.image.width / texture.image.height : 1
        } else {
          // Use local textures (original behavior)
          const isBrick = index % 2 === 0
          texture = isBrick ? brickTexture : clayTexture
          aspectRatio = isBrick ? brickAspectRatio : clayAspectRatio
        }
        
        // Calculate panel dimensions maintaining aspect ratio
        const width = aspectRatio > 1 ? panelSize : panelSize * aspectRatio
        const height = aspectRatio > 1 ? panelSize / aspectRatio : panelSize
        
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
      
      {/* Status indicators for GitHub mode */}
      {githubConfig && loading && (
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[4, 0.5, 0.1]} />
          <meshStandardMaterial color="#4488ff" opacity={0.8} transparent />
        </mesh>
      )}
      
      {githubConfig && error && !loading && !shouldUseFallback && (
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[4, 0.5, 0.1]} />
          <meshStandardMaterial color="#ff4444" opacity={0.8} transparent />
        </mesh>
      )}
    </group>
  )
} 