// @ts-check
import fs from 'node:fs'
import path from 'node:path'

const OUT_DIR = path.resolve('apps/web/public/images/default-covers')

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

/**
 * Standard Archival Monograph Bookplate SVG wrapper
 * @param {string} id
 * @param {string} plateNumber
 * @param {string} categoryLabel
 * @param {string} titleLabel
 * @param {string} glowColor
 * @param {string} content
 */
function monographSvgWrapper(id, plateNumber, categoryLabel, titleLabel, glowColor, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
  <defs>
    <!-- Deep Scholarly Teal Gradient (Noalhub Brand-950 to Brand-800) -->
    <linearGradient id="bg-ink" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#021c22" />
      <stop offset="60%" stop-color="#002e37" />
      <stop offset="100%" stop-color="#004552" />
    </linearGradient>

    <!-- Warm Atmospheric Ambient Glow -->
    <radialGradient id="ambient-glow" cx="50%" cy="60%" r="65%">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.32" />
      <stop offset="50%" stop-color="${glowColor}" stop-opacity="0.10" />
      <stop offset="100%" stop-color="#002e37" stop-opacity="0" />
    </radialGradient>

    <!-- Ridge/Shape Shading Gradients -->
    <linearGradient id="layer-back" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#005f6e" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#002e37" stop-opacity="0.9"/>
    </linearGradient>

    <linearGradient id="layer-mid" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#044b56"/>
      <stop offset="100%" stop-color="#01242b"/>
    </linearGradient>

    <linearGradient id="layer-front" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#013038"/>
      <stop offset="100%" stop-color="#00181d"/>
    </linearGradient>
  </defs>

  <!-- Background Canvas -->
  <rect width="800" height="450" fill="url(#bg-ink)" />
  <rect width="800" height="450" fill="url(#ambient-glow)" />

  <!-- Double Archival Bookplate Frame -->
  <rect x="24" y="24" width="752" height="402" rx="12" fill="none" stroke="#00b6d2" stroke-width="1.2" stroke-opacity="0.4" />
  <rect x="30" y="30" width="740" height="390" rx="8" fill="none" stroke="#56dfcf" stroke-width="0.8" stroke-dasharray="8 6" stroke-opacity="0.22" />

  <!-- Classical Corner Notches -->
  <g stroke="#00b6d2" stroke-width="1" stroke-opacity="0.6" fill="none">
    <path d="M 24 44 L 44 44 L 44 24" />
    <path d="M 776 44 L 756 44 L 756 24" />
    <path d="M 24 406 L 44 406 L 44 426" />
    <path d="M 776 406 L 756 406 L 756 426" />
  </g>

  <!-- Editorial Monograph Typography Stamp -->
  <g transform="translate(56, 62)">
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="2.5" fill="#00b6d2" opacity="0.9">NOALHUB EDITORIAL MONOGRAPH</text>
    <line x1="0" y1="8" x2="260" y2="8" stroke="#00b6d2" stroke-width="0.75" stroke-opacity="0.4" />
    <text x="0" y="24" font-family="serif" font-style="italic" font-size="13" fill="#fed7aa" opacity="0.8">${categoryLabel} // ${titleLabel}</text>
  </g>

  <!-- Bottom Coordinates Stamp -->
  <g transform="translate(640, 395)" opacity="0.6">
    <text x="0" y="0" font-family="monospace" font-size="10" letter-spacing="1.5" fill="#56dfcf">${plateNumber}</text>
  </g>

  <!-- Central / Topic Focal Ink Artwork -->
  ${content}
</svg>
`
}

/**
 * Definitions for all 51 editorial bookplate plates
 * @type {Record<string, { plate: string, cat: string, title: string, glow: string, content: string }>}
 */
const MONOGRAPH_COVERS = {
  // ==========================================
  // GROUP A: TECHNOLOGY & SOFTWARE
  // ==========================================
  'software-engineering': {
    plate: 'PLATE NO. 01',
    cat: 'Technology',
    title: 'Software Engineering & Architecture',
    glow: '#3cdbfa',
    content: `
      <!-- Isometric Architectural Blueprint & Drafting Guides -->
      <g transform="translate(240, 110)">
        <g stroke="#00b6d2" stroke-width="0.75" stroke-dasharray="4 4" opacity="0.35">
          <line x1="0" y1="120" x2="320" y2="120" />
          <line x1="0" y1="180" x2="320" y2="180" />
          <line x1="160" y1="20" x2="160" y2="240" />
        </g>
        <polygon points="160,50 300,120 160,190 20,120" fill="#01242b" stroke="#3cdbfa" stroke-width="1.6" stroke-opacity="0.7" />
        <polygon points="160,90 260,140 160,190 60,140" fill="none" stroke="#56dfcf" stroke-width="1" stroke-dasharray="6 4" stroke-opacity="0.5" />
        <g stroke="#fed7aa" stroke-width="1.8" fill="none">
          <line x1="160" y1="120" x2="160" y2="40" stroke="#fde047" stroke-width="2.2" />
          <polygon points="160,40 190,55 160,70 130,55" fill="#004552" stroke="#fde047" stroke-width="1.5" />
          <line x1="100" y1="140" x2="100" y2="80" />
          <polygon points="100,80 120,90 100,100 80,90" fill="#01242b" stroke="#fed7aa" stroke-width="1.4" />
          <line x1="220" y1="140" x2="220" y2="80" />
          <polygon points="220,80 240,90 220,100 200,90" fill="#01242b" stroke="#fed7aa" stroke-width="1.4" />
        </g>
        <path d="M 100 100 L 160 135 L 220 100" fill="none" stroke="#3cdbfa" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="160" cy="135" r="4" fill="#3cdbfa" />
      </g>
      <g transform="translate(680, 80)" opacity="0.35" stroke="#3cdbfa" stroke-width="1.5" fill="none">
        <path d="M 30 0 L 15 0 C 5 0, 5 15, 0 20 C 5 25, 5 40, 15 40 L 30 40" />
      </g>
    `
  },

  'ai-machine-learning': {
    plate: 'PLATE NO. 02',
    cat: 'Intelligence',
    title: 'Artificial Intelligence & Neural Topology',
    glow: '#818cf8',
    content: `
      <!-- Celestial Astrolabe & Synaptic Constellation Star Map -->
      <g transform="translate(380, 220)">
        <circle cx="0" cy="0" r="110" fill="none" stroke="#818cf8" stroke-width="1.2" stroke-dasharray="6 4" stroke-opacity="0.4" />
        <ellipse cx="0" cy="0" rx="140" ry="46" fill="none" stroke="#56dfcf" stroke-width="1.4" transform="rotate(-25)" stroke-opacity="0.6" />
        <ellipse cx="0" cy="0" rx="140" ry="46" fill="none" stroke="#fed7aa" stroke-width="1.2" transform="rotate(35)" stroke-opacity="0.5" />
        <g stroke="#3cdbfa" stroke-width="1.2" stroke-opacity="0.7">
          <line x1="-70" y1="-40" x2="0" y2="-75" /><line x1="-70" y1="-40" x2="60" y2="-30" />
          <line x1="-70" y1="-40" x2="-20" y2="20" /><line x1="0" y1="-75" x2="60" y2="-30" />
          <line x1="60" y1="-30" x2="80" y2="40" /><line x1="-20" y1="20" x2="80" y2="40" />
          <line x1="-20" y1="20" x2="-60" y2="60" /><line x1="-60" y1="60" x2="20" y2="70" />
          <line x1="80" y1="40" x2="20" y2="70" />
        </g>
        <g fill="#021c22" stroke="#fde047" stroke-width="1.8">
          <circle cx="-70" cy="-40" r="5" />
          <circle cx="0" cy="-75" r="6" />
          <circle cx="60" cy="-30" r="5" />
          <circle cx="-20" cy="20" r="7" fill="#fde047" />
          <circle cx="80" cy="40" r="5" />
          <circle cx="-60" cy="60" r="5" />
          <circle cx="20" cy="70" r="6" />
        </g>
        <circle cx="-20" cy="20" r="14" fill="none" stroke="#3cdbfa" stroke-width="1" stroke-dasharray="3 3" />
      </g>
    `
  },

  'web-development': {
    plate: 'PLATE NO. 03',
    cat: 'Systems',
    title: 'Web Engineering & Interface Structure',
    glow: '#00b6d2',
    content: `
      <!-- Architectural Browser Viewport Elevation with Ratio Calipers -->
      <g transform="translate(200, 85)">
        <rect x="0" y="0" width="400" height="250" rx="10" fill="#01242b" stroke="#00b6d2" stroke-width="1.8" />
        <line x1="0" y1="32" x2="400" y2="32" stroke="#00b6d2" stroke-width="1.2" stroke-opacity="0.5" />
        <circle cx="18" cy="16" r="3.5" fill="#f43f5e" />
        <circle cx="30" cy="16" r="3.5" fill="#f59e0b" />
        <circle cx="42" cy="16" r="3.5" fill="#10b981" />
        <rect x="60" y="8" width="220" height="16" rx="4" fill="none" stroke="#56dfcf" stroke-width="0.8" stroke-opacity="0.4" />
        
        <rect x="24" y="52" width="220" height="85" rx="6" fill="#003844" stroke="#56dfcf" stroke-width="1.2" stroke-opacity="0.7" />
        <rect x="40" y="68" width="100" height="10" rx="3" fill="#fed7aa" />
        <line x1="40" y1="90" x2="200" y2="90" stroke="#00b6d2" stroke-width="1.5" stroke-dasharray="4 3" />
        <line x1="40" y1="104" x2="160" y2="104" stroke="#00b6d2" stroke-width="1.5" stroke-dasharray="4 3" />
        
        <rect x="260" y="52" width="116" height="175" rx="6" fill="#002e37" stroke="#3cdbfa" stroke-width="1.2" stroke-opacity="0.6" />
        <rect x="24" y="152" width="102" height="75" rx="6" fill="#002e37" stroke="#3cdbfa" stroke-width="1" />
        <rect x="142" y="152" width="102" height="75" rx="6" fill="#002e37" stroke="#3cdbfa" stroke-width="1" />
      </g>
    `
  },

  'mobile-development': {
    plate: 'PLATE NO. 04',
    cat: 'Systems',
    title: 'Mobile Architecture & Tactile Layout',
    glow: '#ec4899',
    content: `
      <!-- Dual Mobile Monograph Plates & Precision Touch Wave -->
      <g transform="translate(300, 70)">
        <rect x="50" y="10" width="170" height="300" rx="28" fill="#01242b" stroke="#56dfcf" stroke-width="1.2" stroke-dasharray="6 4" stroke-opacity="0.4" transform="rotate(-8 135 160)" />
        <rect x="20" y="20" width="170" height="300" rx="28" fill="#011f26" stroke="#fed7aa" stroke-width="2" />
        <rect x="75" y="34" width="60" height="8" rx="4" fill="#004552" stroke="#fed7aa" stroke-width="0.8" />
        <rect x="36" y="60" width="138" height="75" rx="10" fill="#003844" stroke="#00b6d2" stroke-width="1" />
        <circle cx="60" cy="95" r="16" fill="#00b6d2" fill-opacity="0.3" stroke="#fed7aa" stroke-width="1.5" />
        <rect x="36" y="150" width="62" height="50" rx="8" fill="#002e37" stroke="#56dfcf" stroke-width="1" />
        <rect x="112" y="150" width="62" height="50" rx="8" fill="#002e37" stroke="#56dfcf" stroke-width="1" />
        <line x1="75" y1="305" x2="135" y2="305" stroke="#fed7aa" stroke-width="2" stroke-linecap="round" />
      </g>
    `
  },

  'cloud-devops': {
    plate: 'PLATE NO. 05',
    cat: 'Infrastructure',
    title: 'Cloud DevOps & Continuous Pipelines',
    glow: '#3cdbfa',
    content: `
      <!-- Cloud Silhouette with Infinite CI/CD Ribbon -->
      <g transform="translate(240, 95)">
        <path d="M 80 180 A 55 55 0 0 1 150 90 A 80 80 0 0 1 280 90 A 60 60 0 0 1 340 160 A 45 45 0 0 1 320 220 L 80 220 Z" fill="#01242b" stroke="#00b6d2" stroke-width="1.5" stroke-opacity="0.4" stroke-dasharray="6 4" />
        <path d="M 120 160 C 120 100, 200 100, 240 160 C 280 220, 360 220, 360 160 C 360 100, 280 100, 240 160 C 200 220, 120 220, 120 160 Z" fill="none" stroke="#3cdbfa" stroke-width="3" stroke-linecap="round" />
        <circle cx="120" cy="160" r="7" fill="#002e37" stroke="#fde047" stroke-width="2" />
        <circle cx="240" cy="160" r="9" fill="#002e37" stroke="#3cdbfa" stroke-width="2" />
        <circle cx="360" cy="160" r="7" fill="#002e37" stroke="#fde047" stroke-width="2" />
      </g>
    `
  },

  'cybersecurity': {
    plate: 'PLATE NO. 06',
    cat: 'Security',
    title: 'Cybersecurity & Cryptographic Proofs',
    glow: '#10b981',
    content: `
      <!-- Classical Hexagonal Seal, Vault Lock & Keyhole -->
      <g transform="translate(380, 220)">
        <polygon points="0,-115 100,-58 100,58 0,115 -100,58 -100,-58" fill="none" stroke="#10b981" stroke-width="1.2" stroke-dasharray="8 6" stroke-opacity="0.5" />
        <polygon points="0,-95 82,-48 82,48 0,95 -82,48 -82,-48" fill="#01242b" stroke="#3cdbfa" stroke-width="2" />
        <path d="M -25 -10 A 25 25 0 0 1 25 -10 L 25 15 L -25 15 Z" fill="none" stroke="#fed7aa" stroke-width="3.5" stroke-linecap="round" />
        <rect x="-35" y="15" width="70" height="50" rx="8" fill="#003844" stroke="#fde047" stroke-width="1.8" />
        <circle cx="0" cy="35" r="5" fill="#fde047" />
        <polygon points="-2,38 2,38 4,52 -4,52" fill="#fde047" />
      </g>
    `
  },

  'data-databases': {
    plate: 'PLATE NO. 07',
    cat: 'Data',
    title: 'Database Systems & Sharded Storages',
    glow: '#06b6d4',
    content: `
      <!-- Intersecting Storage Cylinders with Sharding Topology -->
      <g transform="translate(250, 100)">
        <path d="M 40 40 A 50 16 0 0 0 140 40 L 140 100 A 50 16 0 0 1 40 100 Z" fill="#01242b" stroke="#00b6d2" stroke-width="1.6" />
        <ellipse cx="90" cy="40" rx="50" ry="16" fill="#003844" stroke="#00b6d2" stroke-width="1.6" />
        <path d="M 40 70 A 50 16 0 0 0 140 70" fill="none" stroke="#56dfcf" stroke-width="1" stroke-dasharray="4 3" />
        <path d="M 160 80 A 70 22 0 0 0 300 80 L 300 170 A 70 22 0 0 1 160 170 Z" fill="#011f26" stroke="#fed7aa" stroke-width="2" />
        <ellipse cx="230" cy="80" rx="70" ry="22" fill="#004552" stroke="#fed7aa" stroke-width="2" />
        <path d="M 160 110 A 70 22 0 0 0 300 110" fill="none" stroke="#fde047" stroke-width="1.2" />
      </g>
    `
  },

  'algorithms-systems': {
    plate: 'PLATE NO. 08',
    cat: 'Theory',
    title: 'Algorithms & Directed Graph Traversal',
    glow: '#fde047',
    content: `
      <!-- Binary Tree / Directed Acyclic Graph with Golden Path -->
      <g transform="translate(220, 90)">
        <line x1="180" y1="30" x2="90" y2="100" stroke="#fde047" stroke-width="2.5" />
        <line x1="180" y1="30" x2="270" y2="100" stroke="#00b6d2" stroke-width="1.2" stroke-dasharray="4 4" stroke-opacity="0.5" />
        <line x1="90" y1="100" x2="40" y2="180" stroke="#00b6d2" stroke-width="1.2" stroke-dasharray="4 4" stroke-opacity="0.5" />
        <line x1="90" y1="100" x2="140" y2="180" stroke="#fde047" stroke-width="2.5" />
        <line x1="270" y1="100" x2="220" y2="180" stroke="#00b6d2" stroke-width="1.2" stroke-opacity="0.5" />
        <line x1="270" y1="100" x2="320" y2="180" stroke="#00b6d2" stroke-width="1.2" stroke-opacity="0.5" />
        <line x1="140" y1="180" x2="170" y2="240" stroke="#fde047" stroke-width="2.5" />
        
        <circle cx="180" cy="30" r="14" fill="#002e37" stroke="#fde047" stroke-width="2" />
        <circle cx="90" cy="100" r="13" fill="#002e37" stroke="#fde047" stroke-width="2" />
        <circle cx="270" cy="100" r="11" fill="#01242b" stroke="#00b6d2" stroke-width="1.5" />
        <circle cx="140" cy="180" r="13" fill="#002e37" stroke="#fde047" stroke-width="2" />
        <circle cx="170" cy="240" r="15" fill="#fde047" stroke="#ffffff" stroke-width="2" />
      </g>
    `
  },

  'robotics-hardware': {
    plate: 'PLATE NO. 09',
    cat: 'Hardware',
    title: 'Robotics Engineering & Kinematics',
    glow: '#f97316',
    content: `
      <!-- Articulated Robotic Arm Drafting Kinematics -->
      <g transform="translate(250, 90)">
        <ellipse cx="120" cy="240" rx="60" ry="18" fill="#01242b" stroke="#f97316" stroke-width="2" />
        <rect x="95" y="210" width="50" height="30" rx="4" fill="#003844" stroke="#fed7aa" stroke-width="1.5" />
        <circle cx="120" cy="210" r="12" fill="#01242b" stroke="#fde047" stroke-width="2" />
        <line x1="120" y1="210" x2="190" y2="130" stroke="#f97316" stroke-width="8" stroke-linecap="round" />
        <line x1="120" y1="210" x2="190" y2="130" stroke="#fed7aa" stroke-width="2" stroke-linecap="round" />
        <circle cx="190" cy="130" r="14" fill="#01242b" stroke="#3cdbfa" stroke-width="2" />
        <line x1="190" y1="130" x2="280" y2="90" stroke="#3cdbfa" stroke-width="6" stroke-linecap="round" />
        <circle cx="280" cy="90" r="10" fill="#01242b" stroke="#fed7aa" stroke-width="2" />
      </g>
    `
  },

  'tools-workflow': {
    plate: 'PLATE NO. 10',
    cat: 'Workflow',
    title: 'Productivity Systems & Precision Mechanics',
    glow: '#00b6d2',
    content: `
      <!-- Interlocking Precision Watchmaker Gears & Calipers -->
      <g transform="translate(380, 220)">
        <circle cx="-35" cy="15" r="65" fill="#01242b" stroke="#00b6d2" stroke-width="2.2" />
        <circle cx="-35" cy="15" r="26" fill="#003844" stroke="#56dfcf" stroke-width="1.5" />
        <circle cx="55" cy="-45" r="45" fill="#011f26" stroke="#fed7aa" stroke-width="2" />
        <circle cx="55" cy="-45" r="18" fill="#002e37" stroke="#fde047" stroke-width="1.5" />
      </g>
    `
  },

  // ==========================================
  // GROUP B: SCIENCES & MATHEMATICS
  // ==========================================
  'mathematics': {
    plate: 'PLATE NO. 11',
    cat: 'Mathematics',
    title: 'The Golden Ratio & Sacred Geometry',
    glow: '#fde047',
    content: `
      <!-- Golden Fibonacci Spiral & Archimedean Polyhedra Projection -->
      <g transform="translate(270, 75)">
        <rect x="0" y="0" width="260" height="260" fill="none" stroke="#00b6d2" stroke-width="1" stroke-opacity="0.35" />
        <rect x="0" y="100" width="160" height="160" fill="none" stroke="#00b6d2" stroke-width="1" stroke-opacity="0.4" />
        <rect x="100" y="100" width="60" height="60" fill="none" stroke="#00b6d2" stroke-width="1" stroke-opacity="0.5" />
        
        <path d="M 0 260 A 260 260 0 0 1 260 0 A 160 160 0 0 1 100 160 A 60 60 0 0 1 160 100" fill="none" stroke="#fde047" stroke-width="2.8" stroke-linecap="round" />
        
        <g transform="translate(130, 130)" stroke="#56dfcf" stroke-width="1.4" fill="none">
          <polygon points="0,-65 56,-32 56,32 0,65 -56,32 -56,-32" />
          <polygon points="0,-65 56,32 -56,32" stroke="#fed7aa" stroke-width="1.2" stroke-dasharray="4 3" />
          <polygon points="0,65 56,-32 -56,-32" stroke="#fed7aa" stroke-width="1.2" stroke-dasharray="4 3" />
        </g>
      </g>
      <g transform="translate(90, 180)" font-family="serif" font-style="italic" fill="#fed7aa" opacity="0.7">
        <text x="0" y="0" font-size="38">∫</text>
        <text x="0" y="45" font-size="28">∑</text>
        <text x="0" y="85" font-size="26">π</text>
      </g>
    `
  },

  'physics': {
    plate: 'PLATE NO. 12',
    cat: 'Physics',
    title: 'Quantum Mechanics & Wave Harmonics',
    glow: '#00f0ff',
    content: `
      <!-- Bohr Rutherford Quantum Orbital Ellipses & Harmonic Interference -->
      <g transform="translate(380, 220)">
        <ellipse cx="0" cy="0" rx="150" ry="52" fill="none" stroke="#3cdbfa" stroke-width="1.8" transform="rotate(-30)" stroke-opacity="0.8" />
        <ellipse cx="0" cy="0" rx="150" ry="52" fill="none" stroke="#fed7aa" stroke-width="1.5" transform="rotate(30)" stroke-opacity="0.7" />
        <ellipse cx="0" cy="0" rx="150" ry="52" fill="none" stroke="#56dfcf" stroke-width="1.2" transform="rotate(90)" stroke-opacity="0.5" />
        
        <circle cx="0" cy="0" r="14" fill="#fde047" stroke="#ffffff" stroke-width="2" />
        <circle cx="0" cy="0" r="26" fill="none" stroke="#3cdbfa" stroke-width="1" stroke-dasharray="3 3" />
        
        <circle cx="130" cy="-75" r="6" fill="#3cdbfa" />
        <circle cx="-130" cy="75" r="6" fill="#3cdbfa" />
        <circle cx="-112" cy="-65" r="5" fill="#fed7aa" />
      </g>
    `
  },

  'astronomy-space': {
    plate: 'PLATE NO. 13',
    cat: 'Astronomy',
    title: 'Cosmic Charts & Celestial Spheres',
    glow: '#fde047',
    content: `
      <!-- Ringed Giant Planet, Crescent Moon & Ancient Armillary Grid -->
      <g transform="translate(420, 210)">
        <circle cx="0" cy="0" r="75" fill="#01242b" stroke="#3cdbfa" stroke-width="1.5" />
        <ellipse cx="0" cy="0" rx="170" ry="42" fill="none" stroke="#fde047" stroke-width="3.5" transform="rotate(-18)" />
        <ellipse cx="0" cy="0" rx="155" ry="34" fill="none" stroke="#fed7aa" stroke-width="1.2" transform="rotate(-18)" stroke-opacity="0.7" />
      </g>
      <g transform="translate(140, 90)">
        <path d="M 40 10 A 30 30 0 0 0 65 55 A 36 36 0 1 1 40 10 Z" fill="#fde047" />
        <g stroke="#3cdbfa" stroke-width="1" stroke-opacity="0.6" fill="#fed7aa">
          <line x1="90" y1="35" x2="140" y2="20" /><line x1="140" y1="20" x2="180" y2="60" />
          <circle cx="90" cy="35" r="3" />
          <circle cx="140" cy="20" r="4" />
          <circle cx="180" cy="60" r="3" />
        </g>
      </g>
    `
  },

  'biology-genetics': {
    plate: 'PLATE NO. 14',
    cat: 'Biology',
    title: 'DNA Double Helix & Biomorphic Forms',
    glow: '#10b981',
    content: `
      <!-- Flowing Double Helix DNA Wave & Botanical Cellular Form -->
      <g transform="translate(180, 100)">
        <path d="M 40 120 C 100 20, 160 220, 220 120 C 280 20, 340 220, 400 120 C 460 20, 520 220, 580 120" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" />
        <path d="M 40 120 C 100 220, 160 20, 220 120 C 280 220, 340 20, 400 120 C 460 220, 520 20, 580 120" fill="none" stroke="#56dfcf" stroke-width="3" stroke-linecap="round" />
        <g stroke="#fed7aa" stroke-width="2" stroke-linecap="round" stroke-dasharray="5 3">
          <line x1="80" y1="70" x2="80" y2="170" /><line x1="140" y1="170" x2="140" y2="70" />
          <line x1="260" y1="70" x2="260" y2="170" /><line x1="320" y1="170" x2="320" y2="70" />
          <line x1="440" y1="70" x2="440" y2="170" /><line x1="500" y1="170" x2="500" y2="70" />
        </g>
        <circle cx="100" cy="120" r="5" fill="#fde047" />
        <circle cx="220" cy="120" r="5" fill="#fde047" />
        <circle cx="340" cy="120" r="5" fill="#fde047" />
        <circle cx="460" cy="120" r="5" fill="#fde047" />
      </g>
    `
  },

  'neuroscience': {
    plate: 'PLATE NO. 15',
    cat: 'Neuroscience',
    title: 'Cerebral Topography & Synaptic Pulses',
    glow: '#818cf8',
    content: `
      <!-- Sagittal Brain Contour & Neural Sulci Etchings -->
      <g transform="translate(250, 75)">
        <path d="M 120 270 C 60 270, 20 220, 20 170 C 20 110, 60 35, 150 35 C 200 35, 230 55, 250 75 C 290 45, 350 65, 360 125 C 370 185, 330 250, 250 250 C 220 250, 190 270, 120 270 Z" fill="#01242b" stroke="#3cdbfa" stroke-width="2.2" />
        <path d="M 60 150 C 100 120, 140 170, 180 120 C 220 80, 280 120, 320 90" fill="none" stroke="#56dfcf" stroke-width="1.8" stroke-linecap="round" />
        <path d="M 90 200 C 130 180, 160 220, 210 190 C 260 160, 290 210, 330 170" fill="none" stroke="#fed7aa" stroke-width="1.8" stroke-linecap="round" />
        <circle cx="150" cy="85" r="5" fill="#fde047" />
        <circle cx="280" cy="105" r="6" fill="#fde047" />
        <circle cx="180" cy="205" r="5" fill="#fde047" />
      </g>
    `
  },

  'chemistry-materials': {
    plate: 'PLATE NO. 16',
    cat: 'Chemistry',
    title: 'Molecular Crystals & Covalent Lattices',
    glow: '#10b981',
    content: `
      <!-- Benzene Ring Lattice & Covalent Bond Nodes -->
      <g transform="translate(260, 90)">
        <polygon points="100,20 180,66 180,158 100,204 20,158 20,66" fill="#01242b" stroke="#10b981" stroke-width="2.5" />
        <circle cx="100" cy="112" r="46" fill="none" stroke="#56dfcf" stroke-width="1.6" stroke-dasharray="6 4" />
        <polygon points="180,66 260,20 340,66 340,158 260,204 180,158" fill="#011f26" stroke="#fed7aa" stroke-width="2" />
        <circle cx="100" cy="20" r="8" fill="#fde047" stroke="#002e37" stroke-width="2" />
        <circle cx="180" cy="66" r="7" fill="#3cdbfa" stroke="#002e37" stroke-width="1.5" />
        <circle cx="180" cy="158" r="7" fill="#3cdbfa" stroke="#002e37" stroke-width="1.5" />
        <circle cx="100" cy="204" r="8" fill="#fde047" stroke="#002e37" stroke-width="2" />
        <circle cx="340" cy="66" r="8" fill="#fde047" stroke="#002e37" stroke-width="2" />
      </g>
    `
  },

  'nature-ecology': {
    plate: 'PLATE NO. 17',
    cat: 'Ecology',
    title: 'Topography, Forests & Natural Habitats',
    glow: '#10b981',
    content: `
      <!-- Mountain Ridges, Radiant Dawn Sun & Botanical Leaf Venation -->
      <g transform="translate(0, 70)">
        <circle cx="480" cy="130" r="55" fill="#fde047" opacity="0.6" />
        <polygon points="80,280 300,120 480,280" fill="url(#layer-back)" stroke="#56dfcf" stroke-width="1.4" />
        <polygon points="340,280 540,100 720,280" fill="url(#layer-mid)" stroke="#00b6d2" stroke-width="1.6" />
        <polygon points="0,320 220,170 460,320" fill="url(#layer-front)" stroke="#fed7aa" stroke-width="2" />
      </g>
      <g stroke="#3cdbfa" stroke-width="1.4" opacity="0.8">
        <path d="M 220 170 L 210 190 M 220 170 L 230 190 M 220 180 L 205 205 M 220 180 L 235 205" />
        <path d="M 540 100 L 532 118 M 540 100 L 548 118 M 540 110 L 528 132 M 540 110 L 552 132" />
      </g>
    `
  },

  // ==========================================
  // GROUP C: ARTS, DESIGN & CULTURE
  // ==========================================
  'ui-ux-design': {
    plate: 'PLATE NO. 18',
    cat: 'Design',
    title: 'Interface Craft & Bezier Geometry',
    glow: '#3cdbfa',
    content: `
      <!-- Drafting Bezier Pen Tool Curve with Control Handles & Glass Tiles -->
      <g transform="translate(180, 80)">
        <rect x="60" y="40" width="300" height="190" rx="16" fill="#01242b" stroke="#00b6d2" stroke-width="1.5" stroke-dasharray="6 4" />
        <rect x="120" y="80" width="320" height="200" rx="18" fill="#011f26" stroke="#fed7aa" stroke-width="2" />
        <path d="M 60 240 C 160 50, 320 310, 420 120" fill="none" stroke="#fde047" stroke-width="3.5" stroke-linecap="round" />
        <line x1="160" y1="50" x2="120" y2="110" stroke="#3cdbfa" stroke-width="1.5" />
        <circle cx="160" cy="50" r="5" fill="#3cdbfa" />
        <rect x="114" y="104" width="12" height="12" fill="#ffffff" stroke="#3cdbfa" stroke-width="1.5" />
        <line x1="320" y1="310" x2="360" y2="230" stroke="#3cdbfa" stroke-width="1.5" />
        <circle cx="320" cy="310" r="5" fill="#3cdbfa" />
        <rect x="354" y="224" width="12" height="12" fill="#ffffff" stroke="#3cdbfa" stroke-width="1.5" />
        <polygon points="420,120 440,110 435,130" fill="#fed7aa" />
      </g>
    `
  },

  'typography': {
    plate: 'PLATE NO. 19',
    cat: 'Typography',
    title: 'Typographic Guidelines & Letterform Proportions',
    glow: '#fed7aa',
    content: `
      <!-- Monumental Serif Letterform & Typographic Baseline Matrix -->
      <g transform="translate(200, 70)">
        <line x1="0" y1="50" x2="420" y2="50" stroke="#fed7aa" stroke-width="1" stroke-dasharray="4 4" stroke-opacity="0.6" />
        <text x="426" y="53" font-family="monospace" font-size="9" fill="#fed7aa" opacity="0.8">CAP-HEIGHT</text>
        <line x1="0" y1="120" x2="420" y2="120" stroke="#00b6d2" stroke-width="1" stroke-dasharray="4 4" stroke-opacity="0.6" />
        <text x="426" y="123" font-family="monospace" font-size="9" fill="#00b6d2" opacity="0.8">X-HEIGHT</text>
        <line x1="0" y1="250" x2="420" y2="250" stroke="#56dfcf" stroke-width="1.5" stroke-opacity="0.7" />
        <text x="426" y="253" font-family="monospace" font-size="9" fill="#56dfcf" opacity="0.8">BASELINE</text>
        
        <text x="40" y="250" font-family="serif" font-size="260" font-weight="bold" fill="none" stroke="#fde047" stroke-width="3">A</text>
        <text x="170" y="270" font-family="serif" font-style="italic" font-size="240" fill="#3cdbfa" opacity="0.45">&amp;</text>
      </g>
    `
  },

  'visual-arts': {
    plate: 'PLATE NO. 20',
    cat: 'Art',
    title: 'Chromatics, Composition & Pigment Wells',
    glow: '#f59e0b',
    content: `
      <!-- Venn Optical Discs & Painterly Arcs -->
      <g transform="translate(380, 220)">
        <circle cx="-45" cy="-25" r="75" fill="none" stroke="#f43f5e" stroke-width="2" stroke-opacity="0.7" />
        <circle cx="45" cy="-25" r="75" fill="none" stroke="#3cdbfa" stroke-width="2" stroke-opacity="0.7" />
        <circle cx="0" cy="45" r="75" fill="none" stroke="#fde047" stroke-width="2" stroke-opacity="0.7" />
        <path d="M -110 30 Q 0 -90, 110 20 T 150 110" fill="none" stroke="#fed7aa" stroke-width="4" stroke-linecap="round" />
        <circle cx="0" cy="-5" r="8" fill="#ffffff" />
      </g>
    `
  },

  'architecture': {
    plate: 'PLATE NO. 21',
    cat: 'Architecture',
    title: 'Classical Colonnades & Cantilever Elevation',
    glow: '#00b6d2',
    content: `
      <!-- Classical Roman Arch Elevation & Blueprint Cantilever Truss -->
      <g transform="translate(220, 80)">
        <rect x="60" y="40" width="160" height="230" fill="#01242b" stroke="#00b6d2" stroke-width="1.8" />
        <path d="M 60 120 A 40 40 0 0 1 140 120 L 140 270 L 60 270 Z" fill="#002e37" stroke="#56dfcf" stroke-width="1.4" />
        <path d="M 140 120 A 40 40 0 0 1 220 120 L 220 270 L 140 270 Z" fill="#002e37" stroke="#56dfcf" stroke-width="1.4" />
        
        <polygon points="180,40 360,40 360,130 180,230" fill="none" stroke="#fed7aa" stroke-width="2" />
        <line x1="180" y1="40" x2="360" y2="130" stroke="#fde047" stroke-width="1.5" />
        <line x1="180" y1="130" x2="360" y2="40" stroke="#fde047" stroke-width="1.5" />
      </g>
    `
  },

  'music-sound': {
    plate: 'PLATE NO. 22',
    cat: 'Acoustics',
    title: 'Harmonic Resonance & Frequency Spectra',
    glow: '#3cdbfa',
    content: `
      <!-- Equalizer Frequency Bars & Harmonic Sine Waves -->
      <g transform="translate(160, 110)">
        <g fill="#00b6d2" opacity="0.75">
          <rect x="0" y="70" width="12" height="90" rx="5" />
          <rect x="22" y="30" width="12" height="130" rx="5" />
          <rect x="44" y="90" width="12" height="70" rx="5" />
          <rect x="66" y="10" width="12" height="150" rx="5" />
          <rect x="88" y="50" width="12" height="110" rx="5" />
          <rect x="110" y="95" width="12" height="65" rx="5" />
          <rect x="132" y="20" width="12" height="140" rx="5" />
        </g>
        <path d="M 150 110 Q 220 10, 290 110 T 430 110 T 520 110" fill="none" stroke="#fde047" stroke-width="3.5" stroke-linecap="round" />
        <path d="M 150 110 Q 220 200, 290 110 T 430 110 T 520 110" fill="none" stroke="#56dfcf" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.8" />
        <circle cx="480" cy="110" r="16" fill="none" stroke="#fed7aa" stroke-width="1.8" />
        <circle cx="480" cy="110" r="32" fill="none" stroke="#fed7aa" stroke-width="1" stroke-dasharray="4 3" />
      </g>
    `
  },

  'literature-writing': {
    plate: 'PLATE NO. 23',
    cat: 'Literature',
    title: 'The Written Word & Manuscript Craft',
    glow: '#fed7aa',
    content: `
      <!-- Classic Fountain Pen Nib Tracing Poetic Script -->
      <g transform="translate(240, 85)">
        <path d="M 20 220 Q 140 160, 220 200 T 380 140" fill="none" stroke="#fde047" stroke-width="3.5" stroke-linecap="round" />
        <path d="M 60 250 Q 180 210, 260 230" fill="none" stroke="#56dfcf" stroke-width="1.8" stroke-opacity="0.7" />
        <g transform="translate(320, 50) rotate(45)">
          <polygon points="0,0 18,-45 36,0 28,70 8,70" fill="#01242b" stroke="#fed7aa" stroke-width="2" />
          <line x1="18" y1="0" x2="18" y2="35" stroke="#fde047" stroke-width="1.8" />
          <circle cx="18" cy="35" r="3.5" fill="#fde047" />
        </g>
      </g>
    `
  },

  'cinema-photography': {
    plate: 'PLATE NO. 24',
    cat: 'Optics',
    title: 'Aperture Geometry & Viewfinder Composition',
    glow: '#f59e0b',
    content: `
      <!-- Camera Lens Aperture Blades & Rule of Thirds Crosshairs -->
      <g transform="translate(380, 220)">
        <circle cx="0" cy="0" r="120" fill="#01242b" stroke="#00b6d2" stroke-width="2" />
        <circle cx="0" cy="0" r="100" fill="none" stroke="#56dfcf" stroke-width="1" stroke-dasharray="6 4" stroke-opacity="0.6" />
        <g stroke="#fed7aa" stroke-width="2" fill="#003844">
          <line x1="-55" y1="-25" x2="25" y2="-65" />
          <line x1="25" y1="-65" x2="65" y2="0" />
          <line x1="65" y1="0" x2="20" y2="65" />
          <line x1="20" y1="65" x2="-55" y2="45" />
          <line x1="-55" y1="45" x2="-55" y2="-25" />
        </g>
        <circle cx="0" cy="0" r="18" fill="#fde047" />
      </g>
      <g transform="translate(150, 90)" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6">
        <path d="M 0 25 L 0 0 L 25 0" /><path d="M 475 0 L 500 0 L 500 25" />
        <path d="M 0 235 L 0 260 L 25 260" /><path d="M 475 260 L 500 260 L 500 235" />
      </g>
    `
  },

  'culture-heritage': {
    plate: 'PLATE NO. 25',
    cat: 'Heritage',
    title: 'Dong Son Sun Mandala & Ancient Gateways',
    glow: '#fed7aa',
    content: `
      <!-- Ancient Sun Mandala & Temple Gateway Arch -->
      <g transform="translate(380, 220)">
        <circle cx="0" cy="0" r="95" fill="none" stroke="#fde047" stroke-width="2" stroke-dasharray="8 5" />
        <circle cx="0" cy="0" r="65" fill="none" stroke="#fed7aa" stroke-width="1.4" />
        <circle cx="0" cy="0" r="30" fill="#01242b" stroke="#fde047" stroke-width="2" />
        <g stroke="#fde047" stroke-width="1.8">
          <line x1="0" y1="-30" x2="0" y2="-65" /><line x1="0" y1="30" x2="0" y2="65" />
          <line x1="-30" y1="0" x2="-65" y2="0" /><line x1="30" y1="0" x2="65" y2="0" />
          <line x1="-21" y1="-21" x2="-46" y2="-46" /><line x1="21" y1="21" x2="46" y2="46" />
          <line x1="-21" y1="21" x2="-46" y2="46" /><line x1="21" y1="-21" x2="46" y2="-46" />
        </g>
      </g>
    `
  },

  // ==========================================
  // GROUP D: PHILOSOPHY, PSYCHOLOGY & MIND
  // ==========================================
  'philosophy': {
    plate: 'PLATE NO. 26',
    cat: 'Philosophy',
    title: 'The Portal of Reason & The Solitary Beacon',
    glow: '#3cdbfa',
    content: `
      <!-- Nested Perspective Portals of Truth -->
      <g transform="translate(260, 65)">
        <rect x="0" y="0" width="280" height="280" fill="none" stroke="#00b6d2" stroke-width="1.5" stroke-opacity="0.3" />
        <rect x="35" y="35" width="210" height="210" fill="none" stroke="#56dfcf" stroke-width="1.5" stroke-opacity="0.5" />
        <rect x="70" y="70" width="140" height="140" fill="none" stroke="#3cdbfa" stroke-width="2" stroke-opacity="0.8" />
        <rect x="105" y="105" width="70" height="70" fill="#01242b" stroke="#fde047" stroke-width="2.5" />
        
        <line x1="0" y1="0" x2="105" y2="105" stroke="#3cdbfa" stroke-width="1.2" />
        <line x1="280" y1="0" x2="175" y2="105" stroke="#3cdbfa" stroke-width="1.2" />
        <line x1="0" y1="280" x2="105" y2="175" stroke="#3cdbfa" stroke-width="1.2" />
        <line x1="280" y1="280" x2="175" y2="175" stroke="#3cdbfa" stroke-width="1.2" />
        
        <circle cx="140" cy="140" r="10" fill="#ffffff" />
      </g>
    `
  },

  'psychology': {
    plate: 'PLATE NO. 27',
    cat: 'Psychology',
    title: 'Dual Perspectives & Resonant Minds',
    glow: '#f43f5e',
    content: `
      <!-- Intersecting Facing Human Profile Contours & Neural Bridge -->
      <g transform="translate(230, 65)">
        <path d="M 110 290 L 110 230 C 50 220, 10 170, 10 120 C 10 50, 70 5, 150 5 C 180 5, 200 15, 210 35" fill="none" stroke="#3cdbfa" stroke-width="2.5" stroke-linecap="round" />
        <path d="M 230 290 L 230 230 C 290 220, 330 170, 330 120 C 330 50, 270 5, 190 5 C 160 5, 140 15, 130 35" fill="none" stroke="#fed7aa" stroke-width="2.5" stroke-linecap="round" />
        <ellipse cx="170" cy="130" rx="75" ry="45" fill="#01242b" stroke="#fde047" stroke-width="1.8" stroke-dasharray="6 4" />
        <circle cx="130" cy="120" r="8" fill="#3cdbfa" />
        <circle cx="210" cy="120" r="8" fill="#fed7aa" />
        <line x1="130" y1="120" x2="210" y2="120" stroke="#fde047" stroke-width="2" />
      </g>
    `
  },

  'logic-critical-thinking': {
    plate: 'PLATE NO. 28',
    cat: 'Logic',
    title: 'The Strategist\'s Knight & Boolean Propositions',
    glow: '#3cdbfa',
    content: `
      <!-- Chess Knight Geometric Facets & Intersecting Logic Venn -->
      <g transform="translate(270, 75)">
        <polygon points="120,40 180,20 220,60 210,120 250,180 230,250 100,250 110,200 80,170 80,110 130,90" fill="#01242b" stroke="#fde047" stroke-width="2.8" />
        <line x1="130" y1="90" x2="210" y2="120" stroke="#fed7aa" stroke-width="1.4" />
        <line x1="110" y1="200" x2="210" y2="120" stroke="#fed7aa" stroke-width="1.4" />
        <circle cx="170" cy="65" r="6" fill="#3cdbfa" />
        <circle cx="70" cy="130" r="45" fill="none" stroke="#00b6d2" stroke-width="1.5" stroke-dasharray="4 3" />
      </g>
    `
  },

  'mindfulness-zen': {
    plate: 'PLATE NO. 29',
    cat: 'Zen',
    title: 'The Enso Brushstroke & Cairn Equilibrium',
    glow: '#10b981',
    content: `
      <!-- Calligraphic Enso Circle, Balanced Cairn Stones & Concentric Water Basin -->
      <g transform="translate(250, 75)">
        <path d="M 230 155 A 105 105 0 1 1 190 60" fill="none" stroke="#56dfcf" stroke-width="7" stroke-linecap="round" />
        <ellipse cx="150" cy="215" rx="58" ry="20" fill="#01242b" stroke="#fed7aa" stroke-width="2" />
        <ellipse cx="150" cy="175" rx="44" ry="16" fill="#003844" stroke="#fed7aa" stroke-width="2" />
        <ellipse cx="150" cy="142" rx="30" ry="12" fill="#004552" stroke="#fed7aa" stroke-width="2" />
        <ellipse cx="150" cy="116" rx="16" ry="8" fill="#fde047" />
        <ellipse cx="150" cy="255" rx="95" ry="18" fill="none" stroke="#00b6d2" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.6" />
      </g>
    `
  },

  'linguistics-language': {
    plate: 'PLATE NO. 30',
    cat: 'Linguistics',
    title: 'Phonology, Syntax Trees & Ancient Roots',
    glow: '#3cdbfa',
    content: `
      <!-- Syntax Branching Tree & Multilingual Glyph Roots -->
      <g transform="translate(250, 80)">
        <path d="M 150 260 L 150 170 L 70 95 L 30 40" fill="none" stroke="#3cdbfa" stroke-width="2.5" stroke-linecap="round" />
        <path d="M 150 170 L 230 95 L 270 40" fill="none" stroke="#3cdbfa" stroke-width="2.5" stroke-linecap="round" />
        <path d="M 70 95 L 100 40" fill="none" stroke="#56dfcf" stroke-width="1.8" stroke-linecap="round" />
        <path d="M 230 95 L 200 40" fill="none" stroke="#56dfcf" stroke-width="1.8" stroke-linecap="round" />
        <text x="25" y="30" font-family="serif" font-size="26" fill="#fde047">A</text>
        <text x="95" y="30" font-family="serif" font-size="26" fill="#fed7aa">Ω</text>
        <text x="195" y="30" font-family="serif" font-size="26" fill="#56dfcf">文</text>
        <text x="265" y="30" font-family="serif" font-size="26" fill="#3cdbfa">א</text>
      </g>
    `
  },

  // ==========================================
  // GROUP E: LEARNING, EDUCATION & HABITS
  // ==========================================
  'learning-study': {
    plate: 'PLATE NO. 31',
    cat: 'Pedagogy',
    title: 'Study Methods & Active Knowledge Recall',
    glow: '#fde047',
    content: `
      <!-- Open Hardcover Book with Soaring Origami Knowledge Birds -->
      <g transform="translate(240, 95)">
        <line x1="160" y1="80" x2="160" y2="15" stroke="#fde047" stroke-width="2.5" stroke-linecap="round" />
        <line x1="160" y1="80" x2="95" y2="30" stroke="#fde047" stroke-width="2" stroke-linecap="round" />
        <line x1="160" y1="80" x2="225" y2="30" stroke="#fde047" stroke-width="2" stroke-linecap="round" />
        <path d="M 160 190 C 110 150, 40 170, 20 190 L 20 250 C 40 230, 110 210, 160 250 C 210 210, 280 230, 300 250 L 300 190 C 280 170, 210 150, 160 190 Z" fill="#01242b" stroke="#3cdbfa" stroke-width="2.5" />
        <line x1="160" y1="190" x2="160" y2="250" stroke="#fed7aa" stroke-width="2.5" />
        <line x1="45" y1="210" x2="135" y2="210" stroke="#56dfcf" stroke-width="1" stroke-dasharray="4 3" />
        <line x1="185" y1="210" x2="275" y2="210" stroke="#56dfcf" stroke-width="1" stroke-dasharray="4 3" />
      </g>
    `
  },

  'reading-books': {
    plate: 'PLATE NO. 32',
    cat: 'Reading',
    title: 'The Solitary Library & Origami Flights',
    glow: '#fed7aa',
    content: `
      <!-- Open Book with Soaring Birds in Arched Window Light -->
      <g transform="translate(240, 100)">
        <path d="M 160 210 Q 90 180, 40 200 L 40 240 Q 90 220, 160 250 Q 230 220, 280 240 L 280 200 Q 230 180, 160 210 Z" fill="#01242b" stroke="#fed7aa" stroke-width="2.2" />
        <polygon points="120,120 150,100 140,130" fill="#fde047" stroke="#002e37" stroke-width="1" />
        <polygon points="180,70 220,40 205,85" fill="#fde047" stroke="#002e37" stroke-width="1" />
        <polygon points="230,20 260,0 250,35" fill="#3cdbfa" stroke="#002e37" stroke-width="1" />
      </g>
    `
  },

  'memory-cognition': {
    plate: 'PLATE NO. 33',
    cat: 'Cognition',
    title: 'Memory Consolidation & Spaced Recall',
    glow: '#818cf8',
    content: `
      <!-- Interconnected Neural Indexing Topology Graph -->
      <g transform="translate(230, 80)">
        <polygon points="170,30 280,105 240,210 100,210 60,105" fill="none" stroke="#3cdbfa" stroke-width="1.8" stroke-dasharray="6 4" />
        <circle cx="170" cy="30" r="12" fill="#002e37" stroke="#fde047" stroke-width="2" />
        <circle cx="280" cy="105" r="10" fill="#002e37" stroke="#3cdbfa" stroke-width="1.8" />
        <circle cx="240" cy="210" r="14" fill="#002e37" stroke="#fed7aa" stroke-width="2" />
        <circle cx="100" cy="210" r="10" fill="#002e37" stroke="#3cdbfa" stroke-width="1.8" />
        <circle cx="60" cy="105" r="12" fill="#002e37" stroke="#fde047" stroke-width="2" />
        <circle cx="170" cy="135" r="22" fill="#01242b" stroke="#ffffff" stroke-width="2.5" />
      </g>
    `
  },

  'education-pedagogy': {
    plate: 'PLATE NO. 34',
    cat: 'Education',
    title: 'Curriculum Progression & Academic Dividers',
    glow: '#00b6d2',
    content: `
      <!-- Ascending Stepping Blocks & Scholar\'s Mortarboard -->
      <g transform="translate(250, 85)">
        <rect x="20" y="190" width="75" height="60" rx="5" fill="#01242b" stroke="#00b6d2" stroke-width="1.8" />
        <rect x="95" y="140" width="75" height="110" rx="5" fill="#003844" stroke="#00b6d2" stroke-width="1.8" />
        <rect x="170" y="90" width="75" height="160" rx="5" fill="#004552" stroke="#56dfcf" stroke-width="2" />
        <polygon points="208,35 248,55 208,75 168,55" fill="#fde047" stroke="#002e37" stroke-width="1.5" />
        <line x1="248" y1="55" x2="253" y2="80" stroke="#fed7aa" stroke-width="2" />
      </g>
    `
  },

  'productivity-habits': {
    plate: 'PLATE NO. 35',
    cat: 'Rhythm',
    title: 'Daily Cadence & Streak Completion',
    glow: '#10b981',
    content: `
      <!-- Concentric Habit Rings & Sharp Completion Checkmark -->
      <g transform="translate(380, 220)">
        <circle cx="0" cy="0" r="100" fill="none" stroke="#004552" stroke-width="12" />
        <circle cx="0" cy="0" r="100" fill="none" stroke="#10b981" stroke-width="12" stroke-dasharray="480 180" stroke-linecap="round" />
        <circle cx="0" cy="0" r="74" fill="none" stroke="#fde047" stroke-width="8" stroke-dasharray="350 140" stroke-linecap="round" />
        <path d="M -30 5 L -8 30 L 40 -22" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    `
  },

  'qa-quizzes': {
    plate: 'PLATE NO. 36',
    cat: 'Inquiry',
    title: 'Interrogative Inquiry & Flashcard Proofs',
    glow: '#fde047',
    content: `
      <!-- Intersecting Flashcards with '?' and '!' Glyphs & Hourglass -->
      <g transform="translate(250, 75)">
        <rect x="20" y="30" width="150" height="210" rx="14" fill="#01242b" stroke="#3cdbfa" stroke-width="2" transform="rotate(-8 95 135)" />
        <text x="65" y="150" font-family="serif" font-weight="900" font-size="80" fill="#3cdbfa" transform="rotate(-8 95 135)">?</text>
        <rect x="135" y="40" width="150" height="210" rx="14" fill="#011f26" stroke="#fde047" stroke-width="2.5" />
        <text x="195" y="165" font-family="serif" font-weight="900" font-size="80" fill="#fde047">!</text>
      </g>
    `
  },

  'career-growth': {
    plate: 'PLATE NO. 37',
    cat: 'Growth',
    title: 'Ascending Trajectory & The Guiding Star',
    glow: '#f97316',
    content: `
      <!-- Career Steps Horizon & Guiding North Star -->
      <g transform="translate(190, 85)">
        <rect x="40" y="210" width="55" height="70" rx="4" fill="#01242b" stroke="#00b6d2" stroke-width="1.5" />
        <rect x="125" y="160" width="55" height="120" rx="4" fill="#003844" stroke="#00b6d2" stroke-width="1.5" />
        <rect x="210" y="110" width="55" height="170" rx="4" fill="#004552" stroke="#56dfcf" stroke-width="1.8" />
        <rect x="295" y="60" width="55" height="220" rx="4" fill="#021c22" stroke="#fed7aa" stroke-width="2" />
        <path d="M 40 230 L 125 180 L 210 130 L 350 30" fill="none" stroke="#f97316" stroke-width="4.5" stroke-linecap="round" />
        <polygon points="350,12 355,26 369,26 358,35 362,49 350,40 338,49 342,35 331,26 345,26" fill="#fde047" />
      </g>
    `
  },

  // ==========================================
  // GROUP F: SOCIETY, ECONOMICS & LIFE
  // ==========================================
  'economics-finance': {
    plate: 'PLATE NO. 38',
    cat: 'Economics',
    title: 'Market Equilibrium & Candlestick Trends',
    glow: '#10b981',
    content: `
      <!-- Financial Market Candlesticks & Ascending Trendline -->
      <g transform="translate(200, 85)">
        <g stroke="#10b981" stroke-width="1.8">
          <line x1="60" y1="170" x2="60" y2="230" /><rect x="52" y="185" width="16" height="30" rx="2" fill="#10b981" />
          <line x1="120" y1="130" x2="120" y2="200" /><rect x="112" y="145" width="16" height="35" rx="2" fill="#10b981" />
          <line x1="180" y1="150" x2="180" y2="210" /><rect x="172" y="160" width="16" height="28" rx="2" fill="#f43f5e" />
          <line x1="240" y1="80" x2="240" y2="160" /><rect x="232" y="100" width="16" height="45" rx="2" fill="#10b981" />
          <line x1="300" y1="40" x2="300" y2="120" /><rect x="292" y="60" width="16" height="40" rx="2" fill="#10b981" />
        </g>
        <path d="M 40 220 Q 170 170, 340 35" fill="none" stroke="#fde047" stroke-width="3.5" stroke-linecap="round" />
        <circle cx="340" cy="35" r="7" fill="#fde047" />
      </g>
    `
  },

  'business-strategy': {
    plate: 'PLATE NO. 39',
    cat: 'Strategy',
    title: 'Strategic Navigation & Forward Trajectory',
    glow: '#00b6d2',
    content: `
      <!-- Nautical Compass Target & Strategy Arrow -->
      <g transform="translate(380, 220)">
        <circle cx="0" cy="0" r="110" fill="none" stroke="#00b6d2" stroke-width="1.8" stroke-dasharray="8 6" />
        <circle cx="0" cy="0" r="75" fill="none" stroke="#56dfcf" stroke-width="1.6" />
        <circle cx="0" cy="0" r="38" fill="#01242b" stroke="#fed7aa" stroke-width="2" />
        <polygon points="0,-95 12,0 0,12 -12,0" fill="#fde047" />
        <polygon points="0,95 12,0 0,-12 -12,0" fill="#004552" />
      </g>
    `
  },

  'product-management': {
    plate: 'PLATE NO. 40',
    cat: 'Product',
    title: 'Double Diamond Discovery & Delivery Roadmap',
    glow: '#818cf8',
    content: `
      <!-- Double Diamond Design Thinking Polygons & Launch Axis -->
      <g transform="translate(200, 105)">
        <polygon points="120,35 195,110 120,185 45,110" fill="#01242b" stroke="#3cdbfa" stroke-width="2.5" />
        <polygon points="270,35 345,110 270,185 195,110" fill="#003844" stroke="#fed7aa" stroke-width="2.5" />
        <circle cx="195" cy="110" r="9" fill="#fde047" stroke="#ffffff" stroke-width="2" />
      </g>
    `
  },

  'law-legal': {
    plate: 'PLATE NO. 41',
    cat: 'Jurisprudence',
    title: 'The Scales of Justice & Roman Colonnade',
    glow: '#fed7aa',
    content: `
      <!-- Classical Scales of Justice Balance & Pedestal Pillar -->
      <g transform="translate(270, 65)">
        <line x1="130" y1="35" x2="130" y2="270" stroke="#fed7aa" stroke-width="4.5" stroke-linecap="round" />
        <rect x="80" y="270" width="100" height="16" rx="4" fill="#01242b" stroke="#fed7aa" stroke-width="2" />
        <line x1="30" y1="75" x2="230" y2="75" stroke="#fed7aa" stroke-width="3.5" stroke-linecap="round" />
        <line x1="30" y1="75" x2="5" y2="155" stroke="#fde047" stroke-width="1.2" />
        <line x1="30" y1="75" x2="55" y2="155" stroke="#fde047" stroke-width="1.2" />
        <path d="M -5 155 Q 30 185, 65 155 Z" fill="#003844" stroke="#fde047" stroke-width="1.8" />
        <line x1="230" y1="75" x2="205" y2="155" stroke="#fde047" stroke-width="1.2" />
        <line x1="230" y1="75" x2="255" y2="155" stroke="#fde047" stroke-width="1.2" />
        <path d="M 195 155 Q 230 185, 265 155 Z" fill="#003844" stroke="#fde047" stroke-width="1.8" />
      </g>
    `
  },

  'sociology-community': {
    plate: 'PLATE NO. 42',
    cat: 'Society',
    title: 'The Hearth of Belonging & Interconnected Kinship',
    glow: '#ec4899',
    content: `
      <!-- Interconnected Diverse Circle of Community Nodes -->
      <g transform="translate(380, 220)">
        <circle cx="0" cy="0" r="95" fill="none" stroke="#fed7aa" stroke-width="1.8" stroke-dasharray="6 4" />
        <circle cx="0" cy="-95" r="14" fill="#002e37" stroke="#3cdbfa" stroke-width="2" />
        <circle cx="90" cy="-28" r="13" fill="#002e37" stroke="#fde047" stroke-width="2" />
        <circle cx="55" cy="76" r="14" fill="#002e37" stroke="#56dfcf" stroke-width="2" />
        <circle cx="-55" cy="76" r="13" fill="#002e37" stroke="#fde047" stroke-width="2" />
        <circle cx="-90" cy="-28" r="14" fill="#002e37" stroke="#3cdbfa" stroke-width="2" />
        <circle cx="0" cy="0" r="26" fill="#fde047" stroke="#ffffff" stroke-width="2" />
      </g>
    `
  },

  'communication': {
    plate: 'PLATE NO. 43',
    cat: 'Dialogue',
    title: 'Resonant Dialogue & Acoustic Bridges',
    glow: '#00b6d2',
    content: `
      <!-- Intersecting Editorial Dialogue Bubbles -->
      <g transform="translate(250, 85)">
        <path d="M 60 40 A 45 45 0 0 1 150 40 A 45 45 0 0 1 150 130 L 90 130 L 60 160 L 60 130 A 45 45 0 0 1 60 40 Z" fill="#01242b" stroke="#3cdbfa" stroke-width="2.2" />
        <path d="M 170 75 A 55 55 0 0 1 280 75 A 55 55 0 0 1 280 165 L 230 165 L 205 195 L 205 165 A 55 55 0 0 1 170 75 Z" fill="#003844" stroke="#fed7aa" stroke-width="2.2" />
      </g>
    `
  },

  'geography-travel': {
    plate: 'PLATE NO. 44',
    cat: 'Geography',
    title: 'Topographic Elevation & Wayfarer Contours',
    glow: '#10b981',
    content: `
      <!-- Topographical Elevation Contours & Navigation Waypoint -->
      <g transform="translate(220, 80)">
        <path d="M 30 230 Q 110 170, 230 210 T 390 230" fill="none" stroke="#fed7aa" stroke-width="1.2" stroke-opacity="0.4" />
        <path d="M 70 170 Q 170 110, 270 150 T 350 160" fill="none" stroke="#fed7aa" stroke-width="1.8" stroke-opacity="0.6" />
        <path d="M 110 110 Q 190 70, 250 100 T 290 110" fill="none" stroke="#fde047" stroke-width="2.2" stroke-opacity="0.8" />
        <g transform="translate(195, 60)">
          <path d="M 20 0 C 8 0, 0 10, 0 20 C 0 35, 20 60, 20 60 C 20 60, 40 35, 40 20 C 40 10, 32 0, 20 0 Z" fill="#f43f5e" stroke="#ffffff" stroke-width="2" />
          <circle cx="20" cy="20" r="6" fill="#ffffff" />
        </g>
      </g>
    `
  },

  'health-wellness': {
    plate: 'PLATE NO. 45',
    cat: 'Wellness',
    title: 'Vitruvian Balance & Botanical Vitality',
    glow: '#10b981',
    content: `
      <!-- Cardiogram Pulse Wave & Lotus Silhouette -->
      <g transform="translate(170, 110)">
        <path d="M 20 130 L 130 130 L 150 70 L 170 190 L 190 100 L 210 140 L 225 130 L 440 130" fill="none" stroke="#10b981" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
        <g transform="translate(230, 130)">
          <path d="M 0 0 C -28 -55, 28 -55, 0 0 Z" fill="#fed7aa" opacity="0.8" />
          <path d="M 0 0 C -55 -35, -18 -75, 0 0 Z" fill="#fed7aa" opacity="0.6" />
          <path d="M 0 0 C 55 -35, 18 -75, 0 0 Z" fill="#fed7aa" opacity="0.6" />
        </g>
      </g>
    `
  },

  'essays-reflections': {
    plate: 'PLATE NO. 46',
    cat: 'Reflections',
    title: 'The Contemplative Hearth & Reflective Pool',
    glow: '#fed7aa',
    content: `
      <!-- Pendant Reading Lamp & Serene Water Ripple Horizon -->
      <g transform="translate(250, 75)">
        <polygon points="150,30 20,270 280,270" fill="#fed7aa" fill-opacity="0.12" />
        <line x1="150" y1="0" x2="150" y2="30" stroke="#fed7aa" stroke-width="2" />
        <path d="M 130 30 Q 150 20, 170 30 L 180 44 L 120 44 Z" fill="#fed7aa" stroke="#fde047" stroke-width="1.4" />
        <circle cx="150" cy="50" r="9" fill="#fde047" />
        <line x1="60" y1="270" x2="240" y2="270" stroke="#3cdbfa" stroke-width="2" stroke-linecap="round" />
        <line x1="90" y1="285" x2="210" y2="285" stroke="#3cdbfa" stroke-width="1.4" stroke-linecap="round" opacity="0.6" />
      </g>
    `
  },

  'research-methodology': {
    plate: 'PLATE NO. 47',
    cat: 'Methodology',
    title: 'Empirical Scatterplots & Regression Fit',
    glow: '#00b6d2',
    content: `
      <!-- Empirical Data Scatterplot with Optimal Regression Line -->
      <g transform="translate(210, 85)">
        <line x1="40" y1="230" x2="360" y2="230" stroke="#00b6d2" stroke-width="2" />
        <line x1="40" y1="230" x2="40" y2="20" stroke="#00b6d2" stroke-width="2" />
        <circle cx="80" cy="200" r="5" fill="#3cdbfa" />
        <circle cx="130" cy="170" r="6" fill="#3cdbfa" />
        <circle cx="170" cy="180" r="5" fill="#3cdbfa" />
        <circle cx="210" cy="120" r="6" fill="#3cdbfa" />
        <circle cx="260" cy="100" r="6" fill="#3cdbfa" />
        <circle cx="300" cy="65" r="6" fill="#3cdbfa" />
        <circle cx="340" cy="45" r="7" fill="#3cdbfa" />
        <line x1="40" y1="220" x2="350" y2="35" stroke="#fde047" stroke-width="2.8" stroke-linecap="round" />
      </g>
    `
  },

  'history-civilization': {
    plate: 'PLATE NO. 48',
    cat: 'History',
    title: 'The Hourglass of Epochs & Classical Ruins',
    glow: '#fed7aa',
    content: `
      <!-- Classical Hourglass & Architectural Pillar Ruin -->
      <g transform="translate(270, 70)">
        <polygon points="110,40 190,40 150,130 190,220 110,220 150,130" fill="none" stroke="#fde047" stroke-width="2.8" />
        <line x1="150" y1="130" x2="150" y2="190" stroke="#fed7aa" stroke-width="2" stroke-dasharray="3 3" />
        <polygon points="135,215 165,215 150,190" fill="#fde047" />
        <rect x="35" y="80" width="22" height="140" fill="#003844" stroke="#fed7aa" stroke-width="1.5" />
        <rect x="245" y="80" width="22" height="140" fill="#003844" stroke="#fed7aa" stroke-width="1.5" />
      </g>
    `
  },

  'future-trends': {
    plate: 'PLATE NO. 49',
    cat: 'Horizons',
    title: 'Warp Perspectives & Future Trajectories',
    glow: '#00f0ff',
    content: `
      <!-- Perspective Ground Grid Lines & Radiant Future Sun -->
      <g transform="translate(0, 160)">
        <line x1="400" y1="50" x2="0" y2="280" stroke="#3cdbfa" stroke-width="1.8" stroke-opacity="0.7" />
        <line x1="400" y1="50" x2="200" y2="280" stroke="#3cdbfa" stroke-width="1.4" stroke-opacity="0.6" />
        <line x1="400" y1="50" x2="400" y2="280" stroke="#fde047" stroke-width="2" />
        <line x1="400" y1="50" x2="600" y2="280" stroke="#3cdbfa" stroke-width="1.4" stroke-opacity="0.6" />
        <line x1="400" y1="50" x2="800" y2="280" stroke="#3cdbfa" stroke-width="1.8" stroke-opacity="0.7" />
        
        <line x1="300" y1="90" x2="500" y2="90" stroke="#56dfcf" stroke-width="1.4" />
        <line x1="200" y1="150" x2="600" y2="150" stroke="#56dfcf" stroke-width="1.8" />
        <line x1="60" y1="230" x2="740" y2="230" stroke="#56dfcf" stroke-width="2.2" />
      </g>
      <circle cx="400" cy="200" r="30" fill="#fde047" opacity="0.8" />
    `
  },

  'creativity-ideas': {
    plate: 'PLATE NO. 50',
    cat: 'Creativity',
    title: 'Prismatic Refraction & Idea Illuminations',
    glow: '#fde047',
    content: `
      <!-- Prismatic Refraction Triangle & Spectrum Rays -->
      <g transform="translate(380, 210)">
        <polygon points="0,-75 75,55 -75,55" fill="#01242b" stroke="#ffffff" stroke-width="2.8" />
        <line x1="-180" y1="15" x2="-25" y2="0" stroke="#ffffff" stroke-width="2.8" />
        <path d="M 24 0 L 200 -55" stroke="#f43f5e" stroke-width="2.5" />
        <path d="M 24 5 L 200 -20" stroke="#f59e0b" stroke-width="2.5" />
        <path d="M 24 10 L 200 15" stroke="#10b981" stroke-width="2.5" />
        <path d="M 24 15 L 200 50" stroke="#3cdbfa" stroke-width="2.5" />
        <path d="M 24 20 L 200 85" stroke="#818cf8" stroke-width="2.5" />
      </g>
    `
  },

  // ==========================================
  // FALLBACK: GENERAL DEFAULT
  // ==========================================
  'general-default': {
    plate: 'PLATE NO. 51',
    cat: 'Essays',
    title: 'General Reading & Solitary Mountain View',
    glow: '#f59e0b',
    content: `
      <!-- Distant Mountain Ridge 1 -->
      <path d="M 24 280 C 120 250, 200 230, 280 255 C 380 285, 460 210, 560 230 C 660 250, 720 220, 776 250 L 776 426 L 24 426 Z" fill="url(#layer-back)" />
      <path d="M 24 280 C 120 250, 200 230, 280 255 C 380 285, 460 210, 560 230 C 660 250, 720 220, 776 250" fill="none" stroke="#3cdbfa" stroke-width="1.2" stroke-opacity="0.4" />

      <!-- Mid Mountain Ridge 2 (With Pine Tree Contours) -->
      <path d="M 24 320 C 140 270, 220 310, 340 270 C 440 240, 540 290, 640 260 C 710 240, 750 260, 776 270 L 776 426 L 24 426 Z" fill="url(#layer-mid)" />
      <path d="M 24 320 C 140 270, 220 310, 340 270 C 440 240, 540 290, 640 260 C 710 240, 750 260, 776 270" fill="none" stroke="#00b6d2" stroke-width="1.5" stroke-opacity="0.6" />

      <!-- Distant Pine Tree Etchings along Ridge 2 -->
      <g stroke="#00798d" stroke-width="1.2" opacity="0.7">
        <path d="M 120 300 L 120 285 M 116 295 L 120 285 L 124 295" />
        <path d="M 132 305 L 132 290 M 128 300 L 132 290 L 136 300" />
        <path d="M 220 315 L 220 295 M 215 308 L 220 295 L 225 308" />
        <path d="M 330 275 L 330 258 M 325 270 L 330 258 L 335 270" />
        <path d="M 630 266 L 630 250 M 626 261 L 630 250 L 634 261" />
      </g>

      <!-- Foreground Meadow Ridge -->
      <path d="M 24 370 C 160 330, 320 370, 480 330 C 600 300, 700 330, 776 315 L 776 426 L 24 426 Z" fill="url(#layer-front)" />
      <path d="M 24 370 C 160 330, 320 370, 480 330 C 600 300, 700 330, 776 315" fill="none" stroke="#56dfcf" stroke-width="1.8" stroke-opacity="0.8" />

      <!-- Detailed Fine-Line Foreground Pines -->
      <g stroke="#3cdbfa" stroke-width="1.4" fill="none" stroke-linecap="round">
        <line x1="80" y1="390" x2="80" y2="300" stroke="#004552" stroke-width="3"/>
        <path d="M 80 300 L 70 325 M 80 300 L 90 325 M 80 315 L 66 345 M 80 315 L 94 345" />
        <line x1="110" y1="410" x2="110" y2="280" stroke="#004552" stroke-width="3.5"/>
        <path d="M 110 280 L 98 310 M 110 280 L 122 310 M 110 300 L 93 335 M 110 300 L 127 335 M 110 325 L 88 365 M 110 325 L 132 365" />
        <line x1="710" y1="390" x2="710" y2="295" stroke="#004552" stroke-width="3"/>
        <path d="M 710 295 L 700 320 M 710 295 L 720 320 M 710 312 L 695 342 M 710 312 L 725 342" />
        <line x1="735" y1="410" x2="735" y2="275" stroke="#004552" stroke-width="3.5"/>
        <path d="M 735 275 L 722 305 M 735 275 L 748 305 M 735 295 L 717 330 M 735 295 L 753 330" />
      </g>

      <!-- Solitary Wooden Reading Bench -->
      <g transform="translate(350, 318)" stroke="#fde047" stroke-width="1.8" fill="none" stroke-linejoin="round">
        <line x1="0" y1="12" x2="90" y2="4" />
        <line x1="2" y1="20" x2="92" y2="12" />
        <polygon points="4,28 94,20 102,26 12,34" fill="#002e37" fill-opacity="0.8" />
        <line x1="12" y1="34" x2="10" y2="52" stroke-width="2.2" />
        <line x1="26" y1="32" x2="24" y2="48" stroke-width="2" />
        <line x1="88" y1="24" x2="86" y2="44" stroke-width="2.2" />
        <line x1="100" y1="26" x2="98" y2="42" stroke-width="2" />
      </g>

      <!-- Gentle Soaring Birds (Like Home Hero BIRDS) -->
      <g stroke="#fed7aa" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.85">
        <path d="M 280 130 Q 288 123, 296 128 Q 304 123, 312 130" />
        <path d="M 326 142 Q 332 136, 338 140 Q 344 136, 350 142" />
        <path d="M 305 152 Q 310 147, 315 150 Q 320 147, 325 152" />
        <path d="M 360 125 Q 365 120, 370 123 Q 375 120, 380 125" />
      </g>
    `
  }
}

// Generate all 51 Monograph Bookplate SVGs
let count = 0
for (const [id, data] of Object.entries(MONOGRAPH_COVERS)) {
  const filePath = path.join(OUT_DIR, `${id}.svg`)
  const svg = monographSvgWrapper(id, data.plate, data.cat, data.title, data.glow, data.content)
  fs.writeFileSync(filePath, svg, 'utf-8')
  count++
}

console.log(`Successfully generated ${count} Architectural Monograph Bookplate SVGs in ${OUT_DIR}`)
