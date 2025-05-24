import { useState, useEffect, useCallback } from 'react'
import { GitHubImageFetcher, GitHubImage, GitHubRepoConfig } from './githubImageFetcher'

export interface UseGitHubImagesOptions {
  config?: GitHubRepoConfig
  count?: number
  random?: boolean
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
  useSequential?: boolean // Whether to use sequential numbered images instead of directory fetch
}

export interface UseGitHubImagesResult {
  images: GitHubImage[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  hasImages: boolean
}

export function useGitHubImages(options: UseGitHubImagesOptions): UseGitHubImagesResult {
  const {
    config,
    count = 10,
    random = false,
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
    useSequential = false
  } = options

  const [images, setImages] = useState<GitHubImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check if config is valid
  const isValidConfig = config && config.owner && config.repo
  
  console.log('🎣 useGitHubImages hook called:', {
    config,
    count,
    random,
    useSequential,
    isValidConfig,
    hasConfig: !!config
  })
  
  // Create or update fetcher when config changes
  const [fetcher, setFetcher] = useState<GitHubImageFetcher | null>(null)
  
  // Update fetcher when config changes
  useEffect(() => {
    if (isValidConfig) {
      console.log('🔧 Creating new GitHubImageFetcher with config:', config)
      setFetcher(new GitHubImageFetcher(config))
    } else {
      console.log('❌ Invalid config, setting fetcher to null')
      setFetcher(null)
    }
  }, [isValidConfig, config])

  const fetchImages = useCallback(async () => {
    console.log('🔍 fetchImages called:', { isValidConfig, hasFetcher: !!fetcher, useSequential })
    
    if (!isValidConfig || !fetcher) {
      console.log('❌ Skipping fetch - invalid config or no fetcher')
      setImages([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('⏳ Starting image fetch...')
      
      let fetchedImages: GitHubImage[]
      
      if (useSequential) {
        console.log('📸 Using sequential images...')
        fetchedImages = fetcher.getSequentialImages(count)
        console.log('✅ Sequential images generated:', fetchedImages)
        setLoading(false)
      } else {
        console.log('📁 Using directory-based fetching...')
        fetchedImages = random 
          ? await fetcher.getRandomImages(count)
          : await fetcher.getImages(count)
        console.log('✅ Directory images fetched:', fetchedImages)
      }
        
      setImages(fetchedImages)
      console.log('🎯 Images set to state:', fetchedImages.length, 'images')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch images from GitHub'
      console.error('❌ Error in fetchImages:', err)
      setError(errorMessage)
    } finally {
      if (!useSequential) {
        setLoading(false)
      }
    }
  }, [fetcher, count, random, isValidConfig, useSequential])

  const refresh = useCallback(async () => {
    if (!isValidConfig || !fetcher) return
    
    fetcher.clearCache()
    await fetchImages()
  }, [fetcher, fetchImages, isValidConfig])

  useEffect(() => {
    if (isValidConfig && fetcher) {
      fetchImages()
    }
  }, [fetchImages, isValidConfig, fetcher])

  useEffect(() => {
    if (!autoRefresh || !isValidConfig || !fetcher) return

    const interval = setInterval(() => {
      refresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refresh, refreshInterval, isValidConfig, fetcher])

  return {
    images,
    loading,
    error,
    refresh,
    hasImages: images.length > 0
  }
} 