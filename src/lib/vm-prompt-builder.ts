/**
 * VM (Visual Merchandising) 提示词构建器
 * 将 Agent Team 分析结果 + VM 方法论组装为最终生成提示词
 */

import type { VMAnalysisResult } from './vm-analysis';

export function buildVMGenerationPrompt(
  analysis: VMAnalysisResult,
  clothingCount: number,
  additionalNotes?: string
): string {
  const { colorAnalysis, styleDetection, compositionPlan, lightingPlan } = analysis;

  return `A professional 8K photorealistic visual merchandising photograph of a curated clothing display in a high-end designer boutique (Seoul/Copenhagen aesthetic).

REFERENCE IMAGE: A numbered grid of ${clothingCount} clothing items — these are the EXACT garments to arrange on the rail.

=== COMPOSITION: AIRY HORIZONTAL FLOW ===
- Generate a long, continuous, sleek polished metal rail extending BEYOND both left and right edges of the frame (infinite rail, no visible endpoints).
- Place ${compositionPlan.totalPieces} pieces on the rail: ${compositionPlan.soloHangers} solo hangers + ${compositionPlan.layeredHangers} layered combinations.
- Maintain strict ${compositionPlan.spacingPercent}% gap between items — significant "breathing room" (negative space) on both sides.
- Hem rhythm: ${compositionPlan.hemRhythm} — avoid one straight horizontal bottom line.
- TRIANGULAR COMPOSITION ANCHORS on the floor directly below clothes: ${compositionPlan.anchorItems}
- Camera: 30-degree side angle, eye level, shallow depth of field with gentle bokeh background.
- Three-plane depth: foreground edge softly out of focus → main rail tack-sharp → textured wall softly blurred.

=== COLOR STRATEGY: TONE-ON-TONE ===
- Dominant clothing colors: ${colorAnalysis.dominantColors.map(c => `${c.name} (${c.hex})`).join(', ')}
- Color family: ${colorAnalysis.colorFamily}
- Background wall: ${colorAnalysis.backgroundRecommendation.color} (${colorAnalysis.backgroundRecommendation.hex}) — SAME color family, LOWER saturation.
- ${colorAnalysis.backgroundRecommendation.reasoning}
- Use TEXTURE contrast (e.g., velvet vs. concrete, knit vs. plaster) instead of color contrast.
- Floor: polished concrete or warm oak wood, visible and grounding the scene.

=== SMART PROP SYSTEM: ${styleDetection.styleCategory} ===
- Style: ${styleDetection.styleDescription}
- Props to include: ${styleDetection.recommendedProps.join(', ')}
- Placement: ${styleDetection.propPlacement}
- Props are SECONDARY — they support the garments, never compete. Keep minimal.
- ONE ground prop at the outer one-third of frame, grounded with contact shadow.

=== LIGHTING & ATMOSPHERE ===
- Light source: ${lightingPlan.direction}
- Warmth: ${lightingPlan.warmth} (${lightingPlan.colorTemperature})
- Shadows: ${lightingPlan.shadowStyle}
- ${lightingPlan.specialNotes}
- Realistic contact shadows under rail feet and floor props to prove depth.
- Some areas brighter, some in soft shadow — NOT flat even illumination.

=== ABSOLUTE RULES (NON-NEGOTIABLE) ===
1. SUBJECT FREEZE: Every garment from the reference grid must remain 100% UNCHANGED — exact colors, patterns, textures, silhouettes. Zero hallucination on clothing.
2. INFINITE RAIL: The sleek metal rail MUST visually extend beyond BOTH left and right edges of the frame.
3. NO HUMAN MODELS: No people, no mannequins, no body parts.
4. NO HALLUCINATIONS: Clean, controlled architectural environment only. No random messy backgrounds.
5. FLOOR ANCHORS: Items on the floor (shoes, art books, vases) directly below clothes for stable triangular composition.
6. DEPTH & LAYERS: Clear three-plane depth, subtle overlap among 2-3 garments for spatial feel.
7. MATERIAL QUALITY: Fabric micro-texture visible (denim grain, knit softness, silk drape). Premium cues: clean hanger alignment, polished metal bar.
8. 8K PHOTOREALISTIC: Unreal Engine 5 render quality, "Old Money" aesthetic. NOT illustration.

${additionalNotes ? `STORE OWNER'S NOTES: ${additionalNotes}` : ''}

OUTPUT: 8K photorealistic editorial boutique photograph with cinematic depth. Aspect ratio 4:3. No text, no watermarks, no people.`;
}
