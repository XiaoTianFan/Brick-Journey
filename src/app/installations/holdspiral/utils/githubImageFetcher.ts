export interface GitHubImage {
  name: string
  download_url: string
  sha: string
}

export interface GitHubRepoConfig {
  owner: string
  repo: string
  path?: string // Optional path within the repo (e.g., "images" folder)
  branch?: string // Default to main/master
  maxImages?: number // Maximum number of sequential images to fetch (for numbered patterns)
  imagePattern?: string // Pattern for image names (e.g., "holdprague-hold-{n}.jpg")
}

export class GitHubImageFetcher {
  private config: GitHubRepoConfig
  private cache: Map<string, GitHubImage[]> = new Map()

  constructor(config: GitHubRepoConfig) {
    this.config = {
      ...config,
      path: config.path || '',
      branch: config.branch || 'main'
    }
  }

  /**
   * Fetch images from GitHub repository
   */
  async fetchImages(): Promise<GitHubImage[]> {
    // Validate configuration before making API calls
    if (!this.config.owner || !this.config.repo) {
      console.warn('GitHub repository configuration is incomplete. Owner and repo are required.')
      return []
    }

    const cacheKey = `${this.config.owner}/${this.config.repo}/${this.config.path}/${this.config.branch}`
    
    // Return cached results if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    try {
      const apiUrl = this.buildApiUrl()
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`)
      }

      const files = await response.json()
      
      // Filter for image files
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
      const images: GitHubImage[] = files
        .filter((file: any) => {
          const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
          return imageExtensions.includes(extension) && file.download_url
        })
        .map((file: any) => ({
          name: file.name,
          download_url: file.download_url,
          sha: file.sha
        }))

      // Cache the results
      this.cache.set(cacheKey, images)
      
      return images
    } catch (error) {
      console.error('Error fetching GitHub images:', error)
      return []
    }
  }

  /**
   * Get a specific number of images, cycling through available ones if needed
   */
  async getImages(count: number): Promise<GitHubImage[]> {
    const allImages = await this.fetchImages()
    
    if (allImages.length === 0) {
      return []
    }

    const result: GitHubImage[] = []
    for (let i = 0; i < count; i++) {
      result.push(allImages[i % allImages.length])
    }
    
    return result
  }

  /**
   * Get a random selection of images
   */
  async getRandomImages(count: number): Promise<GitHubImage[]> {
    const allImages = await this.fetchImages()
    
    if (allImages.length === 0) {
      return []
    }

    const shuffled = [...allImages].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, shuffled.length))
  }

  /**
   * Get sequential numbered images based on a pattern (e.g., holdprague-hold-1.jpg, holdprague-hold-2.jpg)
   * This avoids API calls and directly constructs download URLs
   */
  getSequentialImages(count: number): GitHubImage[] {
    console.log('🔢 getSequentialImages called:', { count, config: this.config })
    
    if (!this.config.owner || !this.config.repo) {
      console.warn('GitHub repository configuration is incomplete. Owner and repo are required.')
      return []
    }

    const { owner, repo, path = '', branch = 'master', imagePattern = 'holdprague-hold-{n}.jpg' } = this.config
    const maxImages = this.config.maxImages || count
    const actualCount = Math.min(count, maxImages)
    
    console.log('🔧 Sequential config:', { owner, repo, path, branch, imagePattern, maxImages, actualCount })
    
    const images: GitHubImage[] = []
    
    for (let i = 1; i <= actualCount; i++) {
      const fileName = imagePattern.replace('{n}', i.toString())
      const basePath = path ? `${path}/` : ''
      const download_url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${basePath}${fileName}`
      
      const image = {
        name: fileName,
        download_url,
        sha: `sequential-${i}` // Dummy sha for sequential images
      }
      
      images.push(image)
      
      if (i <= 3 || i === actualCount) {
        console.log(`🖼️ Generated image ${i}:`, image)
      } else if (i === 4 && actualCount > 4) {
        console.log(`... (generating ${actualCount - 3} more images)`)
      }
    }
    
    console.log('📦 Total sequential images generated:', images.length)
    return images
  }

  private buildApiUrl(): string {
    const { owner, repo, path, branch } = this.config
    let url = `https://api.github.com/repos/${owner}/${repo}/contents`
    
    if (path) {
      url += `/${path}`
    }
    
    if (branch && branch !== 'main') {
      url += `?ref=${branch}`
    }
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('GitHub API URL:', url)
    }
    
    return url
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// Default configuration - you can change this
export const defaultGitHubConfig: GitHubRepoConfig = {
  owner: 'your-github-username', // Replace with your GitHub username
  repo: 'your-repo-name', // Replace with your repository name
  path: 'images', // Replace with the folder containing images (optional)
  branch: 'main' // Replace with your branch name if different
} 