import type { Sketch } from '@p5-wrapper/react'

// Type for p5 instance - using a more specific type
interface P5Instance {
  width: number
  height: number
  mouseX: number
  mouseY: number
  windowWidth: number
  windowHeight: number
  createCanvas: (width: number, height: number) => { parent: (element: HTMLElement) => void }
  background: (r: number, g?: number, b?: number) => void
  fill: (r: number, g?: number, b?: number) => void
  rect: (x: number, y: number, w: number, h: number) => void
  frameRate: (fps: number) => void
  resizeCanvas: (width: number, height: number) => void
  loadImage: (path: string) => Promise<P5Image>
  createImage: (width: number, height: number) => P5Image
  canvas: HTMLCanvasElement
  textAlign: (horizAlign: string, vertAlign?: string) => void
  textSize: (size: number) => void
  text: (str: string, x: number, y: number) => void
  push: () => void
  pop: () => void
  translate: (x: number, y: number) => void
  scale: (s: number) => void
  image: (img: P5Image, x: number, y: number, w: number, h: number) => void
  CENTER: string
  [key: string]: unknown // Allow other p5 methods
}

// Type for p5 image objects
interface P5Image {
  width: number
  height: number
  pixels: Uint8ClampedArray
  loadPixels: () => void
  updatePixels: () => void
}

// --- Configuration ---
const TARGET_ROWS = 2; // Fixed number of rows
const TARGET_COLS = 10; // This will be calculated dynamically if FIX_ROWS is true
const FIX_ROWS = false; // If true, fix rows and calculate cols; if false, fix cols and calculate rows
const ORIGINAL_IMG_WIDTH = 600;
const ORIGINAL_IMG_HEIGHT = 500;
const IMAGE_ASPECT_RATIO = ORIGINAL_IMG_WIDTH / ORIGINAL_IMG_HEIGHT;
const FRAME_RATE = 15; // Frames per second for the animation
const ANIMATION_SPEED = 1; // Animation steps per frame (1 = normal, 0.5 = half speed, 2 = double speed)
const FREEZE_DURATION = 20; // Number of frames to freeze after each program completes (3 seconds at 20fps)
const ZIGZAG_OFFSET = 0.1; // How much to offset alternating rows (0 = no offset, 0.5 = half cell width)

// Color combination cycling - these will be dynamic
let currentColorMode = 3; // Start with mode 3 (both grayscale) for debugging
let useBrickGrayscale = false; // Dynamic variable
let useClayGrayscale = false; // Dynamic variable

// --- Image paths ---
const BRICK_IMG_PATH = '/images/Brick.png';
const CLAY_IMG_PATH = '/images/Clay.png';

// --- Grid cell states ---
const CELL_CLAY = 0;
const CELL_BRICK = 1;

interface Program {
  reset: () => void;
  update: () => void;
  isDone: () => boolean;
  p: P5Instance; // p5 instance
}

class ScanByLineProgram implements Program {
  p: P5Instance;
  private updateGridState: (row: number, col: number, value: number) => void;
  private getGridState: () => number[][];
  private rows: number;
  private cols: number;

  private phase: number = 0; // 0: initial, 1: horizontal, 2: vertical, 3: fill, 4: done
  private currentRow: number = 0;
  private currentCol: number = 0;
  private lastBrickPos: { r: number, c: number } | null = null;
  private fillCounter: number = 0; // For the fill phase
  private frameCounter: number = 0; // For animation speed control

  constructor(
    p: P5Instance,
    updateGridState: (row: number, col: number, value: number) => void,
    getGridState: () => number[][],
    rows: number,
    cols: number
  ) {
    this.p = p;
    this.updateGridState = updateGridState;
    this.getGridState = getGridState;
    this.rows = rows;
    this.cols = cols;
  }

  reset() {
    this.phase = 0;
    this.currentRow = 0;
    this.currentCol = 0;
    this.lastBrickPos = null;
    this.fillCounter = 0;
    this.frameCounter = 0;

    // Phase 0: Initial fill with Clay
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.updateGridState(r, c, CELL_CLAY);
      }
    }
    this.phase = 1; // Move to horizontal scan
  }

  update() {
    if (this.isDone()) return;

    // Control animation speed - only update on certain frames
    this.frameCounter += ANIMATION_SPEED;
    if (this.frameCounter < 1) {
      return; // Skip this frame
    }
    this.frameCounter = this.frameCounter % 1; // Reset counter

    const grid = this.getGridState();

    switch (this.phase) {
      case 1: // Horizontal Scan
        if (this.lastBrickPos) {
          this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
        }
        
        this.updateGridState(this.currentRow, this.currentCol, CELL_BRICK);
        this.lastBrickPos = { r: this.currentRow, c: this.currentCol };

        this.currentCol++;
        if (this.currentCol >= this.cols) {
          this.currentCol = 0;
          this.currentRow++;
          if (this.currentRow >= this.rows) {
            // Horizontal scan done
            if (this.lastBrickPos) { // Clear last brick of horizontal scan
                 this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
                 this.lastBrickPos = null;
            }
            this.phase = 2;
            this.currentRow = 0;
            this.currentCol = 0;
          }
        }
        break;

      case 2: // Vertical Scan
        if (this.lastBrickPos) {
          this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
        }

        this.updateGridState(this.currentRow, this.currentCol, CELL_BRICK);
        this.lastBrickPos = { r: this.currentRow, c: this.currentCol };
        
        this.currentRow++;
        if (this.currentRow >= this.rows) {
          this.currentRow = 0;
          this.currentCol++;
          if (this.currentCol >= this.cols) {
            // Vertical scan done
            if (this.lastBrickPos) { // Clear last brick of vertical scan
                this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
                this.lastBrickPos = null;
            }
            this.phase = 3;
            this.currentRow = 0;
            this.currentCol = 0;
            this.fillCounter = 0;
          }
        }
        break;

      case 3: // Fill with Bricks
        let filledInThisStep = false;
        for (let r = 0; r < this.rows && !filledInThisStep; r++) {
            for (let c = 0; c < this.cols && !filledInThisStep; c++) {
                if (grid[r][c] === CELL_CLAY) {
                    this.updateGridState(r, c, CELL_BRICK);
                    this.fillCounter++;
                    filledInThisStep = true; 
                }
            }
        }
        if (this.fillCounter >= this.rows * this.cols) {
          this.phase = 4; // All filled
        }
        break;
    }
  }

  isDone() {
    return this.phase === 4;
  }
}

class ScanBySpiralProgram implements Program {
  p: P5Instance;
  private updateGridState: (row: number, col: number, value: number) => void;
  private getGridState: () => number[][];
  private rows: number;
  private cols: number;

  private phase: number = 0; // 0: initial, 1: forward spiral, 2: reverse spiral, 3: fill, 4: done
  private lastBrickPos: { r: number, c: number } | null = null;
  private fillCounter: number = 0;
  private frameCounter: number = 0;
  
  // Spiral specific variables
  private spiralPositions: { r: number, c: number }[] = [];
  private spiralIndex: number = 0;
  private reverseIndex: number = 0; // For reverse spiral
  private fillIndex: number = 0; // For spiral filling

  constructor(
    p: P5Instance,
    updateGridState: (row: number, col: number, value: number) => void,
    getGridState: () => number[][],
    rows: number,
    cols: number
  ) {
    this.p = p;
    this.updateGridState = updateGridState;
    this.getGridState = getGridState;
    this.rows = rows;
    this.cols = cols;
    this.generateSpiralPath();
  }

  private generateSpiralPath() {
    // Generate spiral path from center outward
    const centerR = Math.max(0, Math.floor(this.rows / 2)); 
    const centerC = Math.max(0, Math.floor(this.cols / 2) - 1); // One col left, but not below 0
    
    this.spiralPositions = [];
    const visited = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
    
    // Start at center
    let r = centerR;
    let c = centerC;
    this.spiralPositions.push({ r, c });
    visited[r][c] = true;
    
    // Directions: right, down, left, up
    const directions = [
      { dr: 0, dc: 1 },   // right
      { dr: 1, dc: 0 },   // down
      { dr: 0, dc: -1 },  // left
      { dr: -1, dc: 0 }   // up
    ];
    
    let dirIndex = 0;
    let steps = 1;
    
    while (this.spiralPositions.length < this.rows * this.cols) {
      for (let i = 0; i < 2; i++) { // Each step count is used twice
        const dir = directions[dirIndex];
        
        for (let j = 0; j < steps; j++) {
          r += dir.dr;
          c += dir.dc;
          
          if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && !visited[r][c]) {
            this.spiralPositions.push({ r, c });
            visited[r][c] = true;
          }
        }
        
        dirIndex = (dirIndex + 1) % 4;
      }
      steps++;
    }
  }

  reset() {
    this.phase = 0;
    this.spiralIndex = 0;
    this.reverseIndex = 0;
    this.fillIndex = 0;
    this.lastBrickPos = null;
    this.fillCounter = 0;
    this.frameCounter = 0;

    // Phase 0: Initial fill with Clay
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.updateGridState(r, c, CELL_CLAY);
      }
    }
    this.phase = 1; // Move to forward spiral scan
  }

  update() {
    if (this.isDone()) return;

    // Control animation speed - only update on certain frames
    this.frameCounter += ANIMATION_SPEED;
    if (this.frameCounter < 1) {
      return; // Skip this frame
    }
    this.frameCounter = this.frameCounter % 1; // Reset counter

    const grid = this.getGridState();

    switch (this.phase) {
      case 1: // Forward Spiral Scan
        if (this.lastBrickPos) {
          this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
        }
        
        if (this.spiralIndex < this.spiralPositions.length) {
          const pos = this.spiralPositions[this.spiralIndex];
          this.updateGridState(pos.r, pos.c, CELL_BRICK);
          this.lastBrickPos = { r: pos.r, c: pos.c };
          this.spiralIndex++;
        } else {
          // Forward spiral scan done
          if (this.lastBrickPos) {
            this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
            this.lastBrickPos = null;
          }
          this.phase = 2;
          this.reverseIndex = this.spiralPositions.length - 1; // Start from the end
        }
        break;

      case 2: // Reverse Spiral Scan
        if (this.lastBrickPos) {
          this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
        }
        
        if (this.reverseIndex >= 0) {
          const pos = this.spiralPositions[this.reverseIndex];
          this.updateGridState(pos.r, pos.c, CELL_BRICK);
          this.lastBrickPos = { r: pos.r, c: pos.c };
          this.reverseIndex--;
        } else {
          // Reverse spiral scan done
          if (this.lastBrickPos) {
            this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
            this.lastBrickPos = null;
          }
          this.phase = 3;
          this.fillIndex = 0; // Reset fill index for spiral filling
        }
        break;

      case 3: // Fill with Bricks following spiral pattern
        if (this.fillIndex < this.spiralPositions.length) {
          const pos = this.spiralPositions[this.fillIndex];
          if (grid[pos.r][pos.c] === CELL_CLAY) {
            this.updateGridState(pos.r, pos.c, CELL_BRICK);
            this.fillCounter++;
          }
          this.fillIndex++;
        } else {
          this.phase = 4; // All filled
        }
        break;
    }
  }

  isDone() {
    return this.phase === 4;
  }
}

class ScanByDiagonalProgram implements Program {
  p: P5Instance;
  private updateGridState: (row: number, col: number, value: number) => void;
  private getGridState: () => number[][];
  private rows: number;
  private cols: number;

  private phase: number = 0; // 0: initial, 1: diagonal1 (top-left to bottom-right), 2: diagonal2 (top-right to bottom-left), 3: fill, 4: done
  private lastBrickPos: { r: number, c: number } | null = null;
  private fillCounter: number = 0;
  private frameCounter: number = 0;
  
  // Diagonal specific variables
  private diagonal1Positions: { r: number, c: number }[] = []; // Top-left to bottom-right diagonals
  private diagonal2Positions: { r: number, c: number }[] = []; // Top-right to bottom-left diagonals
  private diagonal1Index: number = 0;
  private diagonal2Index: number = 0;
  private fillIndex: number = 0; // For diagonal filling

  constructor(
    p: P5Instance,
    updateGridState: (row: number, col: number, value: number) => void,
    getGridState: () => number[][],
    rows: number,
    cols: number
  ) {
    this.p = p;
    this.updateGridState = updateGridState;
    this.getGridState = getGridState;
    this.rows = rows;
    this.cols = cols;
    this.generateDiagonalPaths();
  }

  private generateDiagonalPaths() {
    this.diagonal1Positions = [];
    this.diagonal2Positions = [];

    // Generate top-left to bottom-right diagonals
    // Each diagonal is identified by sum of indices (r + c)
    for (let sum = 0; sum < this.rows + this.cols - 1; sum++) {
      for (let r = 0; r < this.rows; r++) {
        const c = sum - r;
        if (c >= 0 && c < this.cols) {
          this.diagonal1Positions.push({ r, c });
        }
      }
    }

    // Generate top-right to bottom-left diagonals
    // Each diagonal is identified by difference of indices (c - r)
    for (let diff = this.cols - 1; diff >= -(this.rows - 1); diff--) {
      for (let r = 0; r < this.rows; r++) {
        const c = r + diff;
        if (c >= 0 && c < this.cols) {
          this.diagonal2Positions.push({ r, c });
        }
      }
    }
  }

  reset() {
    this.phase = 0;
    this.diagonal1Index = 0;
    this.diagonal2Index = 0;
    this.fillIndex = 0;
    this.lastBrickPos = null;
    this.fillCounter = 0;
    this.frameCounter = 0;

    // Phase 0: Initial fill with Clay
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.updateGridState(r, c, CELL_CLAY);
      }
    }
    this.phase = 1; // Move to first diagonal scan
  }

  update() {
    if (this.isDone()) return;

    // Control animation speed - only update on certain frames
    this.frameCounter += ANIMATION_SPEED;
    if (this.frameCounter < 1) {
      return; // Skip this frame
    }
    this.frameCounter = this.frameCounter % 1; // Reset counter

    const grid = this.getGridState();

    switch (this.phase) {
      case 1: // First Diagonal Scan (top-left to bottom-right)
        if (this.lastBrickPos) {
          this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
        }
        
        if (this.diagonal1Index < this.diagonal1Positions.length) {
          const pos = this.diagonal1Positions[this.diagonal1Index];
          this.updateGridState(pos.r, pos.c, CELL_BRICK);
          this.lastBrickPos = { r: pos.r, c: pos.c };
          this.diagonal1Index++;
        } else {
          // First diagonal scan done
          if (this.lastBrickPos) {
            this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
            this.lastBrickPos = null;
          }
          this.phase = 2;
        }
        break;

      case 2: // Second Diagonal Scan (top-right to bottom-left)
        if (this.lastBrickPos) {
          this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
        }
        
        if (this.diagonal2Index < this.diagonal2Positions.length) {
          const pos = this.diagonal2Positions[this.diagonal2Index];
          this.updateGridState(pos.r, pos.c, CELL_BRICK);
          this.lastBrickPos = { r: pos.r, c: pos.c };
          this.diagonal2Index++;
        } else {
          // Second diagonal scan done
          if (this.lastBrickPos) {
            this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
            this.lastBrickPos = null;
          }
          this.phase = 3;
          this.fillIndex = 0; // Reset fill index for diagonal filling
        }
        break;

      case 3: // Fill with Bricks following first diagonal pattern
        if (this.fillIndex < this.diagonal1Positions.length) {
          const pos = this.diagonal1Positions[this.fillIndex];
          if (grid[pos.r][pos.c] === CELL_CLAY) {
            this.updateGridState(pos.r, pos.c, CELL_BRICK);
            this.fillCounter++;
          }
          this.fillIndex++;
        } else {
          this.phase = 4; // All filled
        }
        break;
    }
  }

  isDone() {
    return this.phase === 4;
  }
}

class ScanByRadiationProgram implements Program {
  p: P5Instance;
  private updateGridState: (row: number, col: number, value: number) => void;
  private getGridState: () => number[][];
  private rows: number;
  private cols: number;

  private phase: number = 0; // 0: initial, 1: clockwise radiation, 2: counterclockwise radiation, 3: clockwise fill, 4: done
  private lastBrickPos: { r: number, c: number } | null = null;
  private fillCounter: number = 0;
  private frameCounter: number = 0;
  
  // Radiation specific variables
  private clockwisePositions: { r: number, c: number }[] = [];
  private counterclockwisePositions: { r: number, c: number }[] = [];
  private clockwiseIndex: number = 0;
  private counterclockwiseIndex: number = 0;
  private fillIndex: number = 0;

  constructor(
    p: P5Instance,
    updateGridState: (row: number, col: number, value: number) => void,
    getGridState: () => number[][],
    rows: number,
    cols: number
  ) {
    this.p = p;
    this.updateGridState = updateGridState;
    this.getGridState = getGridState;
    this.rows = rows;
    this.cols = cols;
    this.generateRadiationPaths();
  }

  private generateRadiationPaths() {
    const centerR = Math.max(0, Math.floor(this.rows / 2));
    const centerC = Math.max(0, Math.floor(this.cols / 2) - 1); // Same offset as spiral

    // Define number of radial lines (like clock hands)
    const numRays = 24; // 15° apart for smooth rotation
    const angleStep = (2 * Math.PI) / numRays;

    // Group positions by which ray they belong to
    const rayPositions: { [rayIndex: number]: { r: number, c: number, distance: number }[] } = {};

    // Initialize ray arrays
    for (let i = 0; i < numRays; i++) {
      rayPositions[i] = [];
    }

    // Assign each grid position to the closest ray
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Calculate angle from center to this position
        let angle = Math.atan2(r - centerR, c - centerC);
        if (angle < 0) angle += 2 * Math.PI; // Normalize to 0-2π

        // Find the closest ray
        const rayIndex = Math.round(angle / angleStep) % numRays;
        
        // Calculate distance from center
        const distance = Math.sqrt((r - centerR) ** 2 + (c - centerC) ** 2);
        
        rayPositions[rayIndex].push({ r, c, distance });
      }
    }

    // Sort positions along each ray by distance (center to edge)
    for (let i = 0; i < numRays; i++) {
      rayPositions[i].sort((a, b) => a.distance - b.distance);
    }

    // Create clockwise and counterclockwise patterns
    this.clockwisePositions = [];
    this.counterclockwisePositions = [];

    // Clockwise: rays in ascending order (0° → 360°)
    for (let i = 0; i < numRays; i++) {
      for (const pos of rayPositions[i]) {
        this.clockwisePositions.push({ r: pos.r, c: pos.c });
      }
    }

    // Counterclockwise: rays in descending order (360° → 0°)
    for (let i = numRays - 1; i >= 0; i--) {
      for (const pos of rayPositions[i]) {
        this.counterclockwisePositions.push({ r: pos.r, c: pos.c });
      }
    }
  }

  reset() {
    this.phase = 0;
    this.clockwiseIndex = 0;
    this.counterclockwiseIndex = 0;
    this.fillIndex = 0;
    this.lastBrickPos = null;
    this.fillCounter = 0;
    this.frameCounter = 0;

    // Phase 0: Initial fill with Clay
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.updateGridState(r, c, CELL_CLAY);
      }
    }
    this.phase = 1; // Move to clockwise radiation scan
  }

  update() {
    if (this.isDone()) return;

    // Control animation speed - only update on certain frames
    this.frameCounter += ANIMATION_SPEED;
    if (this.frameCounter < 1) {
      return; // Skip this frame
    }
    this.frameCounter = this.frameCounter % 1; // Reset counter

    const grid = this.getGridState();

    switch (this.phase) {
      case 1: // Clockwise Radiation Scan
        if (this.lastBrickPos) {
          this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
        }
        
        if (this.clockwiseIndex < this.clockwisePositions.length) {
          const pos = this.clockwisePositions[this.clockwiseIndex];
          this.updateGridState(pos.r, pos.c, CELL_BRICK);
          this.lastBrickPos = { r: pos.r, c: pos.c };
          this.clockwiseIndex++;
        } else {
          // Clockwise radiation scan done
          if (this.lastBrickPos) {
            this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
            this.lastBrickPos = null;
          }
          this.phase = 2;
        }
        break;

      case 2: // Counterclockwise Radiation Scan
        if (this.lastBrickPos) {
          this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
        }
        
        if (this.counterclockwiseIndex < this.counterclockwisePositions.length) {
          const pos = this.counterclockwisePositions[this.counterclockwiseIndex];
          this.updateGridState(pos.r, pos.c, CELL_BRICK);
          this.lastBrickPos = { r: pos.r, c: pos.c };
          this.counterclockwiseIndex++;
        } else {
          // Counterclockwise radiation scan done
          if (this.lastBrickPos) {
            this.updateGridState(this.lastBrickPos.r, this.lastBrickPos.c, CELL_CLAY);
            this.lastBrickPos = null;
          }
          this.phase = 3;
          this.fillIndex = 0; // Reset fill index for clockwise radiation filling
        }
        break;

      case 3: // Fill with Bricks following clockwise radiation pattern
        if (this.fillIndex < this.clockwisePositions.length) {
          const pos = this.clockwisePositions[this.fillIndex];
          if (grid[pos.r][pos.c] === CELL_CLAY) {
            this.updateGridState(pos.r, pos.c, CELL_BRICK);
            this.fillCounter++;
          }
          this.fillIndex++;
        } else {
          this.phase = 4; // All filled
        }
        break;
    }
  }

  isDone() {
    return this.phase === 4;
  }
}

class SwipeByLineProgram implements Program {
  p: P5Instance;
  private updateGridState: (row: number, col: number, value: number) => void;
  private getGridState: () => number[][];
  private rows: number;
  private cols: number;

  private phase: number = 0; // 0: initial, 1: create vertical line, 2: swipe vertically, 3: create horizontal line, 4: swipe horizontally, 5: fill lines, 6: done
  private frameCounter: number = 0;
  
  // Swipe specific variables
  private currentRow: number = 0;
  private currentCol: number = 0;
  private verticalDirection: number = 1; // 1 = down, -1 = up
  private horizontalDirection: number = 1; // 1 = right, -1 = left
  private verticalSwipeCount: number = 0;
  private horizontalSwipeCount: number = 0;
  private maxSwipes: number = 1; // Number of back-and-forth cycles
  private fillRow: number = 0;

  constructor(
    p: P5Instance,
    updateGridState: (row: number, col: number, value: number) => void,
    getGridState: () => number[][],
    rows: number,
    cols: number
  ) {
    this.p = p;
    this.updateGridState = updateGridState;
    this.getGridState = getGridState;
    this.rows = rows;
    this.cols = cols;
  }

  reset() {
    this.phase = 0;
    this.currentRow = 0;
    this.currentCol = 0;
    this.verticalDirection = 1;
    this.horizontalDirection = 1;
    this.verticalSwipeCount = 0;
    this.horizontalSwipeCount = 0;
    this.fillRow = 0;
    this.frameCounter = 0;

    // Phase 0: Initial fill with Clay
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.updateGridState(r, c, CELL_CLAY);
      }
    }
    this.phase = 1; // Move to create initial vertical line
  }

  update() {
    if (this.isDone()) return;

    // Control animation speed - only update on certain frames
    this.frameCounter += ANIMATION_SPEED;
    if (this.frameCounter < 1) {
      return; // Skip this frame
    }
    this.frameCounter = this.frameCounter % 1; // Reset counter

    switch (this.phase) {
      case 1: // Create initial vertical line
        // Fill the first row with bricks (horizontal line)
        for (let c = 0; c < this.cols; c++) {
          this.updateGridState(0, c, CELL_BRICK);
        }
        this.currentRow = 0;
        this.phase = 2; // Move to vertical swipe phase
        break;

      case 2: // Swipe vertically
        // Clear current horizontal line
        for (let c = 0; c < this.cols; c++) {
          this.updateGridState(this.currentRow, c, CELL_CLAY);
        }

        // Move to next row
        this.currentRow += this.verticalDirection;

        // Check boundaries and reverse direction
        if (this.currentRow >= this.rows - 1) {
          this.currentRow = this.rows - 1;
          this.verticalDirection = -1;
          this.verticalSwipeCount++;
        } else if (this.currentRow <= 0) {
          this.currentRow = 0;
          this.verticalDirection = 1;
          this.verticalSwipeCount++;
        }

        // Draw horizontal line at new position
        for (let c = 0; c < this.cols; c++) {
          this.updateGridState(this.currentRow, c, CELL_BRICK);
        }

        // Check if we've completed enough vertical swipes
        if (this.verticalSwipeCount >= this.maxSwipes * 2) {
          // Clear the final horizontal line
          for (let c = 0; c < this.cols; c++) {
            this.updateGridState(this.currentRow, c, CELL_CLAY);
          }
          this.phase = 3;
        }
        break;

      case 3: // Create initial horizontal line
        // Fill the first column with bricks (vertical line)
        for (let r = 0; r < this.rows; r++) {
          this.updateGridState(r, 0, CELL_BRICK);
        }
        this.currentCol = 0;
        this.phase = 4; // Move to horizontal swipe phase
        break;

      case 4: // Swipe horizontally
        // Clear current vertical line
        for (let r = 0; r < this.rows; r++) {
          this.updateGridState(r, this.currentCol, CELL_CLAY);
        }

        // Move to next column
        this.currentCol += this.horizontalDirection;

        // Check boundaries and reverse direction
        if (this.currentCol >= this.cols - 1) {
          this.currentCol = this.cols - 1;
          this.horizontalDirection = -1;
          this.horizontalSwipeCount++;
        } else if (this.currentCol <= 0) {
          this.currentCol = 0;
          this.horizontalDirection = 1;
          this.horizontalSwipeCount++;
        }

        // Draw vertical line at new position
        for (let r = 0; r < this.rows; r++) {
          this.updateGridState(r, this.currentCol, CELL_BRICK);
        }

        // Check if we've completed enough horizontal swipes
        if (this.horizontalSwipeCount >= this.maxSwipes * 2) {
          // Clear the final vertical line
          for (let r = 0; r < this.rows; r++) {
            this.updateGridState(r, this.currentCol, CELL_CLAY);
          }
          this.phase = 5;
          this.fillRow = 0;
        }
        break;

      case 5: // Fill remaining cells line by line
        if (this.fillRow < this.rows) {
          // Fill entire row with bricks
          for (let c = 0; c < this.cols; c++) {
            this.updateGridState(this.fillRow, c, CELL_BRICK);
          }
          this.fillRow++;
        } else {
          this.phase = 6; // All filled
        }
        break;
    }
  }

  isDone() {
    return this.phase === 6;
  }
}

class SwipeByDiagonalProgram implements Program {
  p: P5Instance;
  private updateGridState: (row: number, col: number, value: number) => void;
  private getGridState: () => number[][];
  private rows: number;
  private cols: number;

  private phase: number = 0; // 0: initial, 1: create diagonal1 line, 2: swipe diagonally, 3: create diagonal2 line, 4: swipe diagonally, 5: fill diagonally, 6: done
  private frameCounter: number = 0;
  
  // Diagonal swipe specific variables
  private diagonal1Positions: { r: number, c: number }[] = []; // Top-left to bottom-right diagonals
  private diagonal2Positions: { r: number, c: number }[] = []; // Top-right to bottom-left diagonals
  private currentDiagonal1Index: number = 0;
  private currentDiagonal2Index: number = 0;
  private diagonal1Direction: number = 1; // 1 = forward, -1 = backward
  private diagonal2Direction: number = 1; // 1 = forward, -1 = backward
  private diagonal1SwipeCount: number = 0;
  private diagonal2SwipeCount: number = 0;
  private maxSwipes: number = 1; // Number of back-and-forth cycles
  private fillIndex: number = 0;
  private currentFillDiagonal: number = 0; // Track which diagonal line we're filling

  constructor(
    p: P5Instance,
    updateGridState: (row: number, col: number, value: number) => void,
    getGridState: () => number[][],
    rows: number,
    cols: number
  ) {
    this.p = p;
    this.updateGridState = updateGridState;
    this.getGridState = getGridState;
    this.rows = rows;
    this.cols = cols;
    this.generateDiagonalPaths();
  }

  private generateDiagonalPaths() {
    this.diagonal1Positions = [];
    this.diagonal2Positions = [];

    // Generate top-left to bottom-right diagonals
    // Each diagonal is identified by sum of indices (r + c)
    for (let sum = 0; sum < this.rows + this.cols - 1; sum++) {
      for (let r = 0; r < this.rows; r++) {
        const c = sum - r;
        if (c >= 0 && c < this.cols) {
          this.diagonal1Positions.push({ r, c });
        }
      }
    }

    // Generate top-right to bottom-left diagonals
    // Each diagonal is identified by difference of indices (c - r)
    for (let diff = this.cols - 1; diff >= -(this.rows - 1); diff--) {
      for (let r = 0; r < this.rows; r++) {
        const c = r + diff;
        if (c >= 0 && c < this.cols) {
          this.diagonal2Positions.push({ r, c });
        }
      }
    }
  }

  reset() {
    this.phase = 0;
    this.currentDiagonal1Index = 0;
    this.currentDiagonal2Index = 0;
    this.diagonal1Direction = 1;
    this.diagonal2Direction = 1;
    this.diagonal1SwipeCount = 0;
    this.diagonal2SwipeCount = 0;
    this.fillIndex = 0;
    this.currentFillDiagonal = 0;
    this.frameCounter = 0;

    // Phase 0: Initial fill with Clay
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.updateGridState(r, c, CELL_CLAY);
      }
    }
    this.phase = 1; // Move to create initial diagonal line
  }

  update() {
    if (this.isDone()) return;

    // Control animation speed - only update on certain frames
    this.frameCounter += ANIMATION_SPEED;
    if (this.frameCounter < 1) {
      return; // Skip this frame
    }
    this.frameCounter = this.frameCounter % 1; // Reset counter

    switch (this.phase) {
      case 1: // Create initial diagonal1 line (first diagonal)
        // Fill the first diagonal with bricks (top-left to bottom-right)
        if (this.diagonal1Positions.length > 0) {
          for (let i = 0; i < Math.min(this.rows, this.cols); i++) {
            if (i < this.diagonal1Positions.length) {
              const pos = this.diagonal1Positions[i];
              this.updateGridState(pos.r, pos.c, CELL_BRICK);
            }
          }
        }
        this.currentDiagonal1Index = 0;
        this.phase = 2; // Move to diagonal swipe phase
        break;

      case 2: // Swipe diagonally (top-left to bottom-right direction)
        // Clear current diagonal line
        if (this.currentDiagonal1Index >= 0 && this.currentDiagonal1Index < this.diagonal1Positions.length) {
          for (let i = 0; i < Math.min(this.rows, this.cols); i++) {
            const idx = this.currentDiagonal1Index + i;
            if (idx < this.diagonal1Positions.length) {
              const pos = this.diagonal1Positions[idx];
              this.updateGridState(pos.r, pos.c, CELL_CLAY);
            }
          }
        }

        // Move to next diagonal
        this.currentDiagonal1Index += this.diagonal1Direction * Math.min(this.rows, this.cols);

        // Check boundaries and reverse direction
        if (this.currentDiagonal1Index >= this.diagonal1Positions.length - Math.min(this.rows, this.cols)) {
          this.currentDiagonal1Index = this.diagonal1Positions.length - Math.min(this.rows, this.cols);
          this.diagonal1Direction = -1;
          this.diagonal1SwipeCount++;
        } else if (this.currentDiagonal1Index <= 0) {
          this.currentDiagonal1Index = 0;
          this.diagonal1Direction = 1;
          this.diagonal1SwipeCount++;
        }

        // Draw diagonal line at new position
        if (this.currentDiagonal1Index >= 0 && this.currentDiagonal1Index < this.diagonal1Positions.length) {
          for (let i = 0; i < Math.min(this.rows, this.cols); i++) {
            const idx = this.currentDiagonal1Index + i;
            if (idx < this.diagonal1Positions.length) {
              const pos = this.diagonal1Positions[idx];
              this.updateGridState(pos.r, pos.c, CELL_BRICK);
            }
          }
        }

        // Check if we've completed enough diagonal swipes
        if (this.diagonal1SwipeCount >= this.maxSwipes * 2) {
          // Clear the final diagonal line
          if (this.currentDiagonal1Index >= 0 && this.currentDiagonal1Index < this.diagonal1Positions.length) {
            for (let i = 0; i < Math.min(this.rows, this.cols); i++) {
              const idx = this.currentDiagonal1Index + i;
              if (idx < this.diagonal1Positions.length) {
                const pos = this.diagonal1Positions[idx];
                this.updateGridState(pos.r, pos.c, CELL_CLAY);
              }
            }
          }
          this.phase = 3;
        }
        break;

      case 3: // Create initial diagonal2 line (second diagonal)
        // Fill the first diagonal with bricks (top-right to bottom-left)
        if (this.diagonal2Positions.length > 0) {
          for (let i = 0; i < Math.min(this.rows, this.cols); i++) {
            if (i < this.diagonal2Positions.length) {
              const pos = this.diagonal2Positions[i];
              this.updateGridState(pos.r, pos.c, CELL_BRICK);
            }
          }
        }
        this.currentDiagonal2Index = 0;
        this.phase = 4; // Move to second diagonal swipe phase
        break;

      case 4: // Swipe diagonally (top-right to bottom-left direction)
        // Clear current diagonal line
        if (this.currentDiagonal2Index >= 0 && this.currentDiagonal2Index < this.diagonal2Positions.length) {
          for (let i = 0; i < Math.min(this.rows, this.cols); i++) {
            const idx = this.currentDiagonal2Index + i;
            if (idx < this.diagonal2Positions.length) {
              const pos = this.diagonal2Positions[idx];
              this.updateGridState(pos.r, pos.c, CELL_CLAY);
            }
          }
        }

        // Move to next diagonal
        this.currentDiagonal2Index += this.diagonal2Direction * Math.min(this.rows, this.cols);

        // Check boundaries and reverse direction
        if (this.currentDiagonal2Index >= this.diagonal2Positions.length - Math.min(this.rows, this.cols)) {
          this.currentDiagonal2Index = this.diagonal2Positions.length - Math.min(this.rows, this.cols);
          this.diagonal2Direction = -1;
          this.diagonal2SwipeCount++;
        } else if (this.currentDiagonal2Index <= 0) {
          this.currentDiagonal2Index = 0;
          this.diagonal2Direction = 1;
          this.diagonal2SwipeCount++;
        }

        // Draw diagonal line at new position
        if (this.currentDiagonal2Index >= 0 && this.currentDiagonal2Index < this.diagonal2Positions.length) {
          for (let i = 0; i < Math.min(this.rows, this.cols); i++) {
            const idx = this.currentDiagonal2Index + i;
            if (idx < this.diagonal2Positions.length) {
              const pos = this.diagonal2Positions[idx];
              this.updateGridState(pos.r, pos.c, CELL_BRICK);
            }
          }
        }

        // Check if we've completed enough diagonal swipes
        if (this.diagonal2SwipeCount >= this.maxSwipes * 2) {
          // Clear the final diagonal line
          if (this.currentDiagonal2Index >= 0 && this.currentDiagonal2Index < this.diagonal2Positions.length) {
            for (let i = 0; i < Math.min(this.rows, this.cols); i++) {
              const idx = this.currentDiagonal2Index + i;
              if (idx < this.diagonal2Positions.length) {
                const pos = this.diagonal2Positions[idx];
                this.updateGridState(pos.r, pos.c, CELL_CLAY);
              }
            }
          }
          this.phase = 5;
          this.fillIndex = 0;
          this.currentFillDiagonal = 0;
        }
        break;

      case 5: // Fill remaining cells diagonal line by line
        if (this.currentFillDiagonal < this.rows + this.cols - 1) {
          // Fill one complete diagonal line (top-left to bottom-right direction)
          const currentSum = this.currentFillDiagonal;
          for (let r = 0; r < this.rows; r++) {
            const c = currentSum - r;
            if (c >= 0 && c < this.cols) {
              this.updateGridState(r, c, CELL_BRICK);
            }
          }
          this.currentFillDiagonal++;
        } else {
          this.phase = 6; // All filled
        }
        break;
    }
  }

  isDone() {
    return this.phase === 6;
  }
}

class SwipeByRadiationProgram implements Program {
  p: P5Instance;
  private updateGridState: (row: number, col: number, value: number) => void;
  private getGridState: () => number[][];
  private rows: number;
  private cols: number;

  private phase: number = 0; // 0: initial, 1: create center line, 2: rotate clockwise, 3: rotate counterclockwise, 4: fill clockwise, 5: done
  private frameCounter: number = 0;
  
  // Radiation swipe specific variables
  private centerR: number = 0;
  private centerC: number = 0;
  private currentAngle: number = 0; // Current rotation angle in radians
  private clockwiseRotationCount: number = 0;
  private counterclockwiseRotationCount: number = 0;
  private maxRotations: number = 1; // Number of complete rotations
  private angleStep: number = Math.PI / 12; // 15 degrees per step (24 steps per full rotation)
  
  // For filling phase - reuse radiation pattern from ScanByRadiation
  private clockwiseRays: { r: number, c: number }[][] = [];
  private currentFillRay: number = 0;

  constructor(
    p: P5Instance,
    updateGridState: (row: number, col: number, value: number) => void,
    getGridState: () => number[][],
    rows: number,
    cols: number
  ) {
    this.p = p;
    this.updateGridState = updateGridState;
    this.getGridState = getGridState;
    this.rows = rows;
    this.cols = cols;
    this.centerR = Math.floor(this.rows / 2);
    this.centerC = Math.floor(this.cols / 2);
    this.generateRadiationRays();
  }

  private generateRadiationRays() {
    // Generate rays similar to ScanByRadiation but organized by rays for filling
    const numRays = 24; // 15° apart for smooth rotation
    const rayAngleStep = (2 * Math.PI) / numRays;

    // Group positions by which ray they belong to
    const rayPositions: { [rayIndex: number]: { r: number, c: number, distance: number }[] } = {};

    // Initialize ray arrays
    for (let i = 0; i < numRays; i++) {
      rayPositions[i] = [];
    }

    // Assign each grid position to the closest ray
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Calculate angle from center to this position
        let angle = Math.atan2(r - this.centerR, c - this.centerC);
        if (angle < 0) angle += 2 * Math.PI; // Normalize to 0-2π

        // Find the closest ray
        const rayIndex = Math.round(angle / rayAngleStep) % numRays;
        
        // Calculate distance from center
        const distance = Math.sqrt((r - this.centerR) ** 2 + (c - this.centerC) ** 2);
        
        rayPositions[rayIndex].push({ r, c, distance });
      }
    }

    // Sort positions along each ray by distance (center to edge)
    for (let i = 0; i < numRays; i++) {
      rayPositions[i].sort((a, b) => a.distance - b.distance);
    }

    // Create clockwise ray array for filling
    this.clockwiseRays = [];
    for (let i = 0; i < numRays; i++) {
      this.clockwiseRays.push(rayPositions[i].map(pos => ({ r: pos.r, c: pos.c })));
    }
  }

  private getLinePositions(angle: number): { r: number, c: number }[] {
    const positions: { r: number, c: number }[] = [];
    
    // Calculate line direction from angle
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    
    // Find all grid positions that lie on the line through center at this angle
    // We'll extend the line from one edge to the other
    const maxDist = Math.max(this.rows, this.cols) * Math.sqrt(2);
    
    for (let t = -maxDist; t <= maxDist; t += 0.1) {
      const x = this.centerC + t * dx;
      const y = this.centerR + t * dy;
      
      const r = Math.round(y);
      const c = Math.round(x);
      
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        // Check if we already added this position to avoid duplicates
        if (!positions.some(pos => pos.r === r && pos.c === c)) {
          positions.push({ r, c });
        }
      }
    }
    
    return positions;
  }

  private clearLine(positions: { r: number, c: number }[]) {
    for (const pos of positions) {
      this.updateGridState(pos.r, pos.c, CELL_CLAY);
    }
  }

  private drawLine(positions: { r: number, c: number }[]) {
    for (const pos of positions) {
      this.updateGridState(pos.r, pos.c, CELL_BRICK);
    }
  }

  reset() {
    this.phase = 0;
    this.currentAngle = 0; // Start horizontal (0 radians)
    this.clockwiseRotationCount = 0;
    this.counterclockwiseRotationCount = 0;
    this.currentFillRay = 0;
    this.frameCounter = 0;

    // Phase 0: Initial fill with Clay
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.updateGridState(r, c, CELL_CLAY);
      }
    }
    this.phase = 1; // Move to create initial center line
  }

  update() {
    if (this.isDone()) return;

    // Control animation speed - only update on certain frames
    this.frameCounter += ANIMATION_SPEED;
    if (this.frameCounter < 1) {
      return; // Skip this frame
    }
    this.frameCounter = this.frameCounter % 1; // Reset counter

    switch (this.phase) {
      case 1: // Create initial center line (horizontal)
        const initialLine = this.getLinePositions(this.currentAngle);
        this.drawLine(initialLine);
        this.phase = 2; // Move to clockwise rotation
        break;

      case 2: // Rotate clockwise
        // Clear current line
        const currentLine = this.getLinePositions(this.currentAngle);
        this.clearLine(currentLine);

        // Rotate clockwise (increase angle)
        this.currentAngle += this.angleStep;

        // Check if we completed a full rotation
        if (this.currentAngle >= 2 * Math.PI) {
          this.currentAngle = this.currentAngle % (2 * Math.PI);
          this.clockwiseRotationCount++;
          
          if (this.clockwiseRotationCount >= this.maxRotations) {
            this.phase = 3; // Move to counterclockwise rotation
          }
        }

        // Draw line at new angle
        const newClockwiseLine = this.getLinePositions(this.currentAngle);
        this.drawLine(newClockwiseLine);
        break;

      case 3: // Rotate counterclockwise
        // Clear current line
        const currentCCWLine = this.getLinePositions(this.currentAngle);
        this.clearLine(currentCCWLine);

        // Rotate counterclockwise (decrease angle)
        this.currentAngle -= this.angleStep;

        // Check if we completed a full rotation
        if (this.currentAngle <= -2 * Math.PI) {
          this.currentAngle = this.currentAngle % (2 * Math.PI);
          this.counterclockwiseRotationCount++;
          
          if (this.counterclockwiseRotationCount >= this.maxRotations) {
            // Clear the final line before moving to fill phase
            const finalLine = this.getLinePositions(this.currentAngle);
            this.clearLine(finalLine);
            this.phase = 4; // Move to filling phase
            this.currentFillRay = 0;
          }
        }

        // Draw line at new angle
        if (this.phase === 3) { // Only draw if we haven't moved to next phase
          const newCCWLine = this.getLinePositions(this.currentAngle);
          this.drawLine(newCCWLine);
        }
        break;

      case 4: // Fill by rays in clockwise direction
        if (this.currentFillRay < this.clockwiseRays.length) {
          // Fill one complete ray with bricks
          const rayPositions = this.clockwiseRays[this.currentFillRay];
          for (const pos of rayPositions) {
            this.updateGridState(pos.r, pos.c, CELL_BRICK);
          }
          this.currentFillRay++;
        } else {
          this.phase = 5; // All filled
        }
        break;
    }
  }

  isDone() {
    return this.phase === 5;
  }
}

export const proliferationSketch: Sketch = (p: P5Instance) => {
  let brickImg: P5Image | null = null;
  let clayImg: P5Image | null = null;
  let brickImgGray: P5Image | null = null; // Grayscale version of brick image
  let clayImgGray: P5Image | null = null;  // Grayscale version of clay image
  let canvasParentRef: HTMLElement | null = null;
  let imagesLoaded: boolean = false;

  let gridState: number[][] = [];
  let cellWidth: number = 0;
  let cellHeight: number = 0;
  let scaledImgWidth: number = 0;
  let scaledImgHeight: number = 0;
  
  // Dynamic grid dimensions
  let actualRows: number = TARGET_ROWS;
  let actualCols: number = TARGET_COLS;

  let programs: Program[] = [];
  let currentProgramIndex: number = 0;
  let currentProgram: Program | null = null;
  
  // Freeze state variables
  let isFrozen: boolean = false;
  let freezeCounter: number = 0;

  const updateGridCell = (row: number, col: number, value: number) => {
    if (gridState[row] && gridState[row][col] !== undefined) {
      gridState[row][col] = value;
    }
  };

  const getGrid = () => gridState;

  const updateColorMode = () => {
    // Cycle through 4 color combinations
    currentColorMode = (currentColorMode + 1) % 4;
    
    switch (currentColorMode) {
      case 0: // Both in Color
        useBrickGrayscale = false;
        useClayGrayscale = false;
        console.log('Color Mode: Both in Color');
        break;
      case 1: // Brick Grayscale, Clay Color
        useBrickGrayscale = true;
        useClayGrayscale = false;
        console.log('Color Mode: Brick Grayscale, Clay Color');
        break;
      case 2: // Clay Grayscale, Brick Color
        useBrickGrayscale = false;
        useClayGrayscale = true;
        console.log('Color Mode: Clay Grayscale, Brick Color');
        break;
      case 3: // Both Grayscale
        useBrickGrayscale = true;
        useClayGrayscale = true;
        console.log('Color Mode: Both Grayscale');
        break;
    }
  };

  const calculateDimensions = () => {
    if (!canvasParentRef) return;
    const canvasWidth = canvasParentRef.offsetWidth;
    const canvasHeight = canvasParentRef.offsetHeight;
    const canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent(canvasParentRef);
    p.frameRate(FRAME_RATE);

    if (FIX_ROWS) {
      // Fix rows, calculate columns to fit width
      actualRows = TARGET_ROWS;
      cellHeight = canvasHeight / actualRows;
      actualCols = Math.floor(canvasWidth / cellHeight);
      cellWidth = canvasWidth / actualCols; // Use exact width to avoid gaps
    } else {
      // Fix columns, prioritize adding rows while maintaining aspect ratio
      actualCols = TARGET_COLS;
      cellWidth = canvasWidth / actualCols;
      
      // Calculate ideal cell height based on original image aspect ratio
      const idealCellHeight = cellWidth / IMAGE_ASPECT_RATIO;
      
      // Calculate how many rows can fit with the ideal aspect ratio
      actualRows = Math.floor(canvasHeight / idealCellHeight);
      
      // If we can't fit even one row, force at least one row
      if (actualRows < 1) {
        actualRows = 1;
      }
      
      // Use exact height to fill remaining space (minimal stretch)
      cellHeight = canvasHeight / actualRows;
    }

    // Make images fill the entire cell
    scaledImgWidth = cellWidth;
    scaledImgHeight = cellHeight;
    
    console.log(`Grid dimensions: ${actualRows} rows x ${actualCols} cols (cellWidth: ${cellWidth.toFixed(1)}, cellHeight: ${cellHeight.toFixed(1)}, aspect ratio: ${(cellWidth/cellHeight).toFixed(2)} vs original: ${IMAGE_ASPECT_RATIO.toFixed(2)})`);
  };

  const initializeGrid = () => {
    // Initialize grid state with current dimensions
    gridState = Array(actualRows).fill(null).map(() => Array(actualCols).fill(CELL_CLAY));
    
    // Reinitialize programs with new dimensions - SwipeByRadiation first, others randomized
    programs = [
      new ScanByLineProgram(p, updateGridCell, getGrid, actualRows, actualCols),
      new ScanBySpiralProgram(p, updateGridCell, getGrid, actualRows, actualCols),
      new ScanByDiagonalProgram(p, updateGridCell, getGrid, actualRows, actualCols),
      new ScanByRadiationProgram(p, updateGridCell, getGrid, actualRows, actualCols),
      new SwipeByRadiationProgram(p, updateGridCell, getGrid, actualRows, actualCols),
      new SwipeByDiagonalProgram(p, updateGridCell, getGrid, actualRows, actualCols),
      new SwipeByLineProgram(p, updateGridCell, getGrid, actualRows, actualCols),
      // Add more programs here in the future
    ];
    currentProgramIndex = 0; // Start with SwipeByRadiation (index 0)
    currentProgram = programs[currentProgramIndex];
    currentProgram.reset();
  };

  p.setup = async () => {
    let parentEl: HTMLElement | null = document.getElementById('proliferation-canvas-container');

    if (!parentEl) {
      console.warn(
        "Canvas parent container 'proliferation-canvas-container' not found. Attempting fallback."
      );
      // Check p.canvas.parentElement first, as ReactP5Wrapper might have already created the canvas
      if (p.canvas && p.canvas.parentElement) {
        parentEl = p.canvas.parentElement;
      } else {
        // As a last resort, use document.body, but this should ideally not be hit
        // if the component is mounted correctly.
        parentEl = document.body;
      }
    }

    if (!parentEl) {
      // This case should be extremely rare if document.body exists.
      console.error("CRITICAL: No suitable parent element found for the p5.js canvas. Cannot create canvas.");
      return; // Stop setup if no parent is found
    }

    canvasParentRef = parentEl; // canvasParentRef is now guaranteed to be non-null if we proceed

    const canvasWidth = canvasParentRef.offsetWidth;
    const canvasHeight = canvasParentRef.offsetHeight;
    const canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.parent(canvasParentRef);
    p.frameRate(FRAME_RATE);

    // Load images asynchronously
    try {
      brickImg = await p.loadImage(BRICK_IMG_PATH);
      clayImg = await p.loadImage(CLAY_IMG_PATH);
      
      // Create proper grayscale versions using pixel manipulation
      console.log('Creating grayscale versions...');
      
      // Create grayscale brick image
      brickImg.loadPixels();
      brickImgGray = p.createImage(brickImg.width, brickImg.height);
      brickImgGray.loadPixels();
      
      for (let i = 0; i < brickImg.pixels.length; i += 4) {
        const r = brickImg.pixels[i];
        const g = brickImg.pixels[i + 1];
        const b = brickImg.pixels[i + 2];
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b); // Standard grayscale conversion
        
        brickImgGray.pixels[i] = gray;     // red
        brickImgGray.pixels[i + 1] = gray; // green  
        brickImgGray.pixels[i + 2] = gray; // blue
        brickImgGray.pixels[i + 3] = brickImg.pixels[i + 3]; // alpha (preserve transparency)
      }
      brickImgGray.updatePixels();
      
      // Create grayscale clay image
      clayImg.loadPixels();
      clayImgGray = p.createImage(clayImg.width, clayImg.height);
      clayImgGray.loadPixels();
      
      for (let i = 0; i < clayImg.pixels.length; i += 4) {
        const r = clayImg.pixels[i];
        const g = clayImg.pixels[i + 1];
        const b = clayImg.pixels[i + 2];
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b); // Standard grayscale conversion
        
        clayImgGray.pixels[i] = gray;     // red
        clayImgGray.pixels[i + 1] = gray; // green  
        clayImgGray.pixels[i + 2] = gray; // blue
        clayImgGray.pixels[i + 3] = clayImg.pixels[i + 3]; // alpha (preserve transparency)
      }
      clayImgGray.updatePixels();
      
      imagesLoaded = true;
      console.log('Images loaded successfully with proper grayscale conversion');
    } catch (error) {
      console.error('Error loading images:', error);
      // Continue without images for now - could show placeholder or retry
      imagesLoaded = false;
    }

    calculateDimensions();
    initializeGrid();
    
    // Initialize first color mode
    updateColorMode();
  };

  p.draw = () => {
    p.background(240); // Light grey background

    // Only proceed with animation if images are loaded
    if (!imagesLoaded) {
      // Show loading text
      p.fill(0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(24);
      p.text('Loading...', p.width / 2, p.height / 2);
      return;
    }

    if (currentProgram) {
      currentProgram.update();
      if (currentProgram.isDone()) {
        if (!isFrozen) {
          // Program just completed, start freeze period
          isFrozen = true;
          freezeCounter = 0;
        } else {
          // Already freezing, count frames
          freezeCounter++;
          
          // Check if freeze period is complete
          if (freezeCounter >= FREEZE_DURATION) {
            // Switch to next color combination when freeze completes
            updateColorMode();
            
            // Randomly select next program (excluding current one)
            let nextProgramIndex;
            do {
              nextProgramIndex = Math.floor(Math.random() * programs.length);
            } while (nextProgramIndex === currentProgramIndex && programs.length > 1);
            
            currentProgramIndex = nextProgramIndex;
            currentProgram = programs[currentProgramIndex];
            currentProgram.reset();
            
            // Reset freeze state
            isFrozen = false;
            freezeCounter = 0;
          }
        }
      }
    }

    // Apply scaling transformation to crop out zigzag edge gaps
    p.push(); // Save current transformation state
    
    // Calculate zoom factor to hide edge gaps
    const zoomFactor = 1 + (ZIGZAG_OFFSET * 1.5); // Zoom in enough to crop the offset gaps
    
    // Scale from center and translate to center the zoomed content
    p.translate(p.width / 2, p.height / 2);
    p.scale(zoomFactor);
    p.translate(-p.width / 2, -p.height / 2);

    for (let r = 0; r < actualRows; r++) {
      for (let c = 0; c < actualCols; c++) {
        const cellX = c * cellWidth;
        const cellY = r * cellHeight;
        
        // Calculate zigzag offset for alternating rows
        const isEvenRow = r % 2 === 0;
        const zigzagOffsetX = isEvenRow ? 
          cellWidth * ZIGZAG_OFFSET :      // Even rows: shift right
          -cellWidth * ZIGZAG_OFFSET;     // Odd rows: shift left
        
        const finalX = cellX + zigzagOffsetX;
        const finalY = cellY;

        // Draw images to fill entire cell area with optional grayscale
        if (gridState[r] && gridState[r][c] === CELL_BRICK && brickImg) {
          const imageToUse = useBrickGrayscale ? brickImgGray : brickImg;
          if (imageToUse) {
            p.image(imageToUse, finalX, finalY, scaledImgWidth, scaledImgHeight);
          }
        } else if (clayImg) {
          const imageToUse = useClayGrayscale ? clayImgGray : clayImg;
          if (imageToUse) {
            p.image(imageToUse, finalX, finalY, scaledImgWidth, scaledImgHeight);
          }
        }
      }
    }
    
    p.pop(); // Restore transformation state
  };

  p.windowResized = () => {
    calculateDimensions();
    initializeGrid(); // Reinitialize grid with new dimensions
  };
}; 