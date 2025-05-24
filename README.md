# Brick Journey

**A Digital Art Installation Project**

*Bringing the City with Me: A Dialogue Between Physical and Digital Spaces*

---

## Project Overview

**Brick Journey** is a conceptual art project that explores the relationship between physical and digital spaces, tourism, memory, and the marks we leave on places. The project consists of two interconnected components: a physical art piece and digital installations that reimagine and extend the concept into virtual space.

### The Physical Art Project

The journey begins with a handcrafted clay brick, meticulously created to emulate the weathered bricks found throughout Prague's historic architecture. Rather than marking actual historical sites with graffiti—an act that would damage irreplaceable heritage—the project inverts this relationship: **the city comes with me**.

**The Process:**
- 🧱 **Brick Creation**: A clay brick is hand-formed and fired, designed to match Prague's characteristic brick aesthetic
- ✏️ **Tourist Markings**: The brick is adorned with pseudo-graffiti typical of tourist culture: "A loves B", "LOL", "RIP", initials, and other ephemeral expressions that visitors typically carve or draw
- 📸 **Mobile Documentation**: The brick travels to various locations and contexts, photographed in different environments as a portable piece of the city
- 🌍 **Contextual Dialogue**: Each placement creates a conversation between the brick's urban identity and its new surroundings

This approach respectfully preserves historical architecture while still capturing the human impulse to mark, remember, and connect with places we visit.

### The Digital Installations

The physical project expands into two interactive digital installations that reimagine the brick's journey through generative art and 3D environments.

---

## Digital Installations

### 1. **Brick Proliferates** (`/installations/proliferation`)

An animated generative art piece built with p5.js that visualizes the spread and transformation of brick and clay textures through various scanning and swiping algorithms.

**Features:**
- 🔄 **Seven Unique Programs**: Different algorithmic approaches to filling the canvas
  - **SwipeByRadiation**: Rotating line scanner that sweeps in radial patterns
  - **SwipeByDiagonal**: Diagonal swiping animations across the canvas
  - **SwipeByLine**: Vertical and horizontal scanning motions
  - **ScanByLine**: Linear progression algorithms
  - **ScanBySpiral**: Spiral-based filling patterns
  - **ScanByDiagonal**: Diagonal scanning methods
  - **ScanByRadiation**: Radial scanning from center outward

- 🎨 **Texture Integration**: Uses actual photographs of the handmade brick and clay
- ⏯️ **Automatic Cycling**: Programs run continuously, transitioning between different visual approaches
- 🎬 **Freeze Effect**: Each program concludes with a pause to appreciate the final composition

**Technical Implementation:**
- Built with TypeScript and p5.js
- React integration using `@p5-wrapper/react`
- Responsive grid system that adapts to canvas dimensions
- Sophisticated state management for seamless program transitions

### 2. **Hold Spiral** (`/installations/holdspiral`)

An immersive 3D installation built with Three.js that creates a rotating spiral of image panels, offering both external observation and internal experience.

**Features:**
- 🌀 **3D Spiral Architecture**: 60 image panels arranged in a mathematical spiral
- 🖼️ **Authentic Aspect Ratios**: Images maintain their original proportions
- 🎮 **Dual Interaction Modes**:
  - **Click to Toggle**: Switch between outside observation and inside immersion
  - **Orbit Controls**: Free camera movement with mouse drag and scroll
- 📐 **Spatial Intelligence**: Different distance limits and targets for inside vs outside views
- ✨ **Cinematic Transitions**: Smooth 2-second camera movements between perspectives
- 💫 **Dynamic Lighting**: Enhanced lighting system with colored accent lights

**The Experience:**
- **Outside View**: Observe the complete spiral structure rotating gracefully
- **Inside View**: Experience being surrounded by the rotating images from within
- **Exploration**: Full freedom to orbit, zoom, and explore from any angle

**Technical Implementation:**
- Built with TypeScript and Three.js
- React Three Fiber for React integration
- Mathematical spiral positioning algorithms
- Smart click vs. drag detection
- Proper camera and orbit controls synchronization

---

## Technical Architecture

### Frontend Framework
- **Next.js 15** with TypeScript
- **React 19** for component architecture
- **Tailwind CSS** for styling

### 3D Graphics & Animation
- **Three.js** for 3D rendering and spatial mathematics
- **React Three Fiber** for declarative 3D scenes
- **React Three Drei** for enhanced 3D utilities
- **p5.js** for generative art and 2D graphics processing

### Project Structure
```
brickjourney/
├── src/app/
│   ├── installations/
│   │   ├── proliferation/     # Generative art installation
│   │   └── holdspiral/        # 3D spiral installation
│   ├── [city]/               # City-specific content routing
│   └── about/                # Project information
├── public/images/            # Brick and clay texture assets
└── components/               # Shared React components
```

---

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone [repository-url]
   cd brickjourney
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Routes

- `/` - Random city/page redirect (dynamic entry point)
- `/installations/proliferation` - Brick Proliferates generative art
- `/installations/holdspiral` - Hold Spiral 3D experience
- `/[city]/hold` - City-specific hold pages
- `/[city]/beforeandafter` - Before/after documentation

---

## Artistic Statement

**Brick Journey** questions the traditional relationship between visitor and place. Instead of leaving marks on the world, what if we carry pieces of it with us? The handmade brick becomes a portable ambassador of Prague, creating new dialogues wherever it travels.

The digital installations extend this concept into virtual space, where the brick's identity can proliferate infinitely, spiral through impossible geometries, and exist in states that transcend physical limitations. Together, the physical and digital components create a meditation on presence, permanence, and the ways we connect with places both real and imagined.

This project respects cultural heritage while acknowledging the very human desire to mark our passage through the world. It's about carrying place with us rather than leaving traces behind—a gentler, more thoughtful approach to the tourist experience.

---

## Future Development

- 🌍 **Additional Cities**: Expanding the project to other historic cities
- 🎨 **New Scanning Algorithms**: More generative art programs for proliferation
- 🔧 **Interactive Elements**: Enhanced user interaction in both installations
- 📱 **Mobile Optimization**: Touch-friendly interfaces for mobile devices
- 🎵 **Audio Integration**: Ambient soundscapes for the digital installations

---

## Credits

**Artist & Developer**: Xiaotian Fan
**Physical Brick Creation**: Handcrafted in Prague  
**Digital Development**: TypeScript, React, Three.js, p5.js  
**Photography**: Original brick and clay documentation  

Built with modern web technologies to ensure accessibility and performance across devices.

---

*"The city travels with the brick, not the other way around."*
