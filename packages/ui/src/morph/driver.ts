// Spring-driven animation loop. One Morpher per rendered path; it owns the
// requestAnimationFrame loop and writes `d` through the callback it is given.

import {type Shape, subsToD} from './geometry'
import {createPlan, type Plan} from './plan'

export interface SpringConfig {
  stiffness: number
  damping: number
}

export type SpringPreset = 'snappy' | 'smooth' | 'bouncy'

export const SPRINGS: Record<SpringPreset, SpringConfig> = {
  smooth: {stiffness: 170, damping: 26}, // no overshoot
  snappy: {stiffness: 420, damping: 30},
  bouncy: {stiffness: 300, damping: 14},
}

export function resolveSpring(
  spring: SpringPreset | SpringConfig,
): SpringConfig {
  return typeof spring === 'string' ? SPRINGS[spring] : spring
}

const REST_DISTANCE = 1e-3
const REST_SPEED = 1e-3
const STEP = 1 / 240

export class Morpher {
  private shape: Shape
  private plan: Plan | null = null
  private target: Shape | null = null
  private x = 0 // progress, 0 -> 1
  private v = 0 // progress velocity, carried over when retargeted mid-flight
  private raf = 0
  private last = 0
  private spring: SpringConfig = SPRINGS.snappy

  constructor(
    private readonly write: (d: string) => void,
    initial: Shape,
  ) {
    this.shape = initial
  }

  /** Jump to a shape without animating. */
  set(shape: Shape) {
    this.cancel()
    this.shape = shape
    this.write(shape.d)
  }

  /** Animate from whatever is on screen right now to `shape`. */
  morphTo(shape: Shape, spring: SpringConfig = SPRINGS.snappy) {
    if (this.target === shape || (!this.plan && this.shape.d === shape.d))
      return
    // Mid-flight: the shape on screen is the plan's live buffers.
    const from = this.plan ? this.plan.out : this.shape.subs
    this.plan = createPlan(from, shape)
    this.target = shape
    this.spring = spring
    this.x = 0
    if (!this.raf) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.frame)
    }
  }

  destroy() {
    this.cancel()
  }

  private cancel() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    this.plan = null
    this.target = null
    this.x = 0
    this.v = 0
  }

  private frame = (now: number) => {
    const plan = this.plan
    const target = this.target
    if (!plan || !target) return

    let dt = Math.min((now - this.last) / 1000, 1 / 20)
    this.last = now
    const {stiffness: k, damping: c} = this.spring
    while (dt > 0) {
      const h = Math.min(dt, STEP)
      this.v += (k * (1 - this.x) - c * this.v) * h // semi-implicit Euler
      this.x += this.v * h
      dt -= h
    }

    if (Math.abs(1 - this.x) < REST_DISTANCE && Math.abs(this.v) < REST_SPEED) {
      // Settled: write the target's exact path so rest state has no resampling artifacts.
      this.shape = target
      this.raf = 0
      this.plan = null
      this.target = null
      this.x = 0
      this.v = 0
      this.write(target.d)
      return
    }

    this.write(subsToD(plan.at(this.x)))
    this.raf = requestAnimationFrame(this.frame)
  }
}
