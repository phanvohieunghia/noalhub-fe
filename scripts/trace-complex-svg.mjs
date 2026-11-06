import fs from 'node:fs';
import path from 'node:path';
import ImageTracer from 'imagetracerjs';
import { optimize } from 'svgo';

/**
 * Traces an image buffer into an ultra-intricate, multi-layered SVG.
 * 
 * @param {Uint8ClampedArray} rgbaData 
 * @param {number} width 
 * @param {number} height 
 * @param {object} customOpts 
 * @returns {string} Optimized SVG string
 */
export function traceRgbaToComplexSvg(rgbaData, width, height, customOpts = {}) {
  const imgd = {
    width,
    height,
    data: rgbaData
  };

  const defaultOpts = {
    numberofcolors: 36,
    blurradius: 1,
    blurdelta: 12,
    ltres: 0.8,
    qtres: 0.8,
    pathomit: 6,
    colorsampling: 2,
    colorquantcycles: 3,
    roundcoords: 1,
    viewbox: true,
    desc: false
  };

  const opts = { ...defaultOpts, ...customOpts };
  const rawSvg = ImageTracer.imagedataToSVG(imgd, opts);

  // Optimize with SVGO while preserving high geometric complexity
  const optimized = optimize(rawSvg, {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            cleanupNumericValues: { floatPrecision: 1 },
            convertPathData: { floatPrecision: 1 }
          }
        }
      }
    ]
  });

  return optimized.data;
}
