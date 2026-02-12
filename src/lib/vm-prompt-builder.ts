/**
 * VM (Visual Merchandising) 提示词构建器
 * 将 Agent Team 分析结果 + VM 方法论 + 景别选择组装为最终生成提示词
 */

import type { VMAnalysisResult, SceneType } from './vm-analysis';

// ---- 景别构图模板 ----

function getSceneComposition(
  scene: SceneType,
  compositionPlan: VMAnalysisResult['compositionPlan'],
): string {
  // 所有景别共享的挂杆与错落感描述
  const railCore = `- A slim, elegant wall-mounted metal rail (thin and understated, NOT a bulky freestanding rack). The rail should be barely noticeable — the CLOTHES are the star.
- Place ${compositionPlan.totalPieces} pieces on the rail using wooden or velvet-covered hangers.
- OUTFIT GROUPING: Some hangers carry layered combinations (e.g., a knit cardigan draped over a camisole, a blazer over a shirt). This creates depth and styling intelligence. ${compositionPlan.layeredHangers} layered groups + ${compositionPlan.soloHangers} solo pieces.
- STAGGERED HEIGHT RHYTHM (关键): The garments MUST create a natural wave of varying heights — short crop top → long maxi dress → medium blazer → ankle-length pants → short knit vest. This "错落感" (staggered silhouette) is ESSENTIAL. NEVER line up all hems at the same height.
- ${compositionPlan.spacingPercent}% breathing room between hangers — generous negative space, unhurried elegance.
- Hem rhythm: ${compositionPlan.hemRhythm}`;

  switch (scene) {
    case 'wide':
      return `=== COMPOSITION: BOUTIQUE FULL VIEW (WIDE SHOT) ===
${railCore}
- Camera: straight-on or very slight 15-degree angle, eye level, capturing the full wall and rail.
- The rail extends across most of the wall but does NOT need to go beyond the frame — show the architectural context.
- Wall: hand-plastered artisan wall with subtle arch or alcove detail (like a European boutique). Warm cream/sand tone with visible plaster texture.
- Floor: warm-toned material (oak wood, terrazzo, or vintage tile) with a soft rug or runner.
- TRIANGULAR COMPOSITION ANCHORS on the floor: ${compositionPlan.anchorItems} — placed asymmetrically, one at the outer third.
- Props: 1-2 curated items (a wooden stool with an art book, a potted fiddle-leaf fig or olive tree, a woven basket). Props add life but never compete.
- Three-plane depth: foreground prop softly out of focus → rail and garments tack-sharp → wall texture gently soft.
- The space feels like walking into a curated Seoul/Copenhagen/Milan boutique — warm, inviting, unhurried.`;

    case 'medium':
      return `=== COMPOSITION: EDITORIAL RAIL DETAIL (MEDIUM SHOT) ===
${railCore}
- Camera: straight-on, slightly below eye level (looking slightly UP at the garments), creating a sense of reverence and importance.
- Frame captures the rail section with 4-6 key pieces — the garments fill 55-65% of the frame.
- The rail extends beyond both edges of the frame, suggesting it continues.
- Wall behind: warm artisan plaster with visible hand-troweled texture, softly out of focus but the material quality is palpable.
- Floor visible at the bottom 15-20% of frame — warm oak or terrazzo, grounding the scene.
- Floor props: at most ONE carefully placed item (a pair of leather loafers, a small ceramic vase) at the outer edge.
- Fabric details clearly visible: weave patterns, stitching quality, button details, collar construction, drape of the fabric.
- Layered outfits are the visual highlight — you can see how pieces work together (a coat draped over a blouse creates depth).
- Lighting: soft, directional, gallery-like. The garments glow with gentle highlights on fabric folds.
- Mood: like a curated editorial shot for Kinfolk or Cereal magazine — quiet luxury, intentional simplicity.`;

    case 'closeup':
      return `=== COMPOSITION: INTIMATE TEXTURE DETAIL (CLOSE-UP SHOT) ===
${railCore}
- Camera: VERY CLOSE, slightly elevated 25-35 degree angle, capturing 3-4 garments in intimate detail.
- The garments fill 80% of the frame. Individual fabric fibers, stitching, button textures, zipper teeth are visible.
- Fabric micro-texture is the HERO: cashmere fuzz, silk sheen, denim warp-and-weft, linen slub, wool weave — rendered at near-macro level.
- Very shallow depth of field: the center 2 garments are tack-sharp, garments at edges dissolve into creamy bokeh.
- The rail is barely visible — just a thin metallic line at the top of frame, almost cropped out.
- Background: pure warm bokeh blur suggesting plaster wall texture.
- Layered outfit details shine here — you can see how a cashmere sweater drapes over a silk camisole, the texture contrast between fabrics.
- No floor props visible — the focus is 100% on the garments and their material quality.
- Mood: intimate, tactile — like reaching out to touch the fabric in a Celine or The Row boutique.`;
  }
}

// ---- 主构建函数 ----

export function buildVMGenerationPrompt(
  analysis: VMAnalysisResult,
  clothingCount: number,
  scene: SceneType = 'wide',
  additionalNotes?: string,
): string {
  const { colorAnalysis, styleDetection, compositionPlan, lightingPlan } = analysis;

  const sceneLabel = { wide: 'wide shot', medium: 'medium shot', closeup: 'close-up' }[scene];

  const compositionBlock = getSceneComposition(scene, compositionPlan);

  return `A professional 8K photorealistic visual merchandising photograph (${sceneLabel}) of a curated clothing display in a high-end designer boutique.

=== REFERENCE IMAGES (CRITICAL — READ CAREFULLY) ===
- IMAGE 1: A numbered grid showing all ${clothingCount} garments (#1 to #${clothingCount}) — use this for the LAYOUT and ARRANGEMENT plan.
- IMAGES 2 to ${clothingCount + 1}: High-resolution individual photos of each garment — use these to reproduce EXACT colors, patterns, textures, and silhouettes. These are the ground truth. Copy them pixel-perfectly.
- You MUST reproduce every garment EXACTLY as shown in the individual photos. Do NOT invent, simplify, or reinterpret any garment.

${compositionBlock}

=== COLOR STRATEGY: TONE-ON-TONE ===
- Dominant clothing colors: ${colorAnalysis.dominantColors.map(c => `${c.name} (${c.hex})`).join(', ')}
- Color family: ${colorAnalysis.colorFamily}
- Background wall: ${colorAnalysis.backgroundRecommendation.color} (${colorAnalysis.backgroundRecommendation.hex}) — SAME color family, LOWER saturation.
- ${colorAnalysis.backgroundRecommendation.reasoning}
- Use TEXTURE contrast (e.g., knit vs. plaster, denim vs. smooth wall) instead of color contrast.

=== SMART PROP SYSTEM: ${styleDetection.styleCategory} ===
- Style: ${styleDetection.styleDescription}
- Props to include: ${styleDetection.recommendedProps.join(', ')}
- Placement: ${styleDetection.propPlacement}
- Props are SECONDARY — they add warmth and life but NEVER compete with garments. Keep minimal.

=== LIGHTING & ATMOSPHERE ===
- Light source: ${lightingPlan.direction}
- Warmth: ${lightingPlan.warmth} (${lightingPlan.colorTemperature})
- Shadows: ${lightingPlan.shadowStyle}
- ${lightingPlan.specialNotes}
- Light should feel NATURAL — like warm daylight from a nearby window, creating soft graduated shadows on the wall.
- NOT flat studio lighting. The light has direction and mood.

=== ABSOLUTE RULES (NON-NEGOTIABLE) ===
1. SUBJECT FREEZE: Every garment from the reference must remain 100% UNCHANGED — exact colors, patterns, textures, silhouettes, fabric sheen. Zero hallucination. Do NOT invent details.
2. COLOR FIDELITY: Each garment's color must match the reference EXACTLY. No color shifts, no tinting. Black stays black, white stays white. Matte stays matte, glossy stays glossy.
3. STAGGERED HEIGHTS: Garment hems MUST create a natural wave pattern (short-long-medium-long-short). NEVER a flat horizontal line.
4. NO HUMAN MODELS: No people, no mannequins, no body parts.
5. NO HALLUCINATIONS: Clean, warm architectural environment only. No cluttered or messy backgrounds.
6. MATERIAL QUALITY: Fabric micro-texture visible (denim grain, knit softness, silk drape, cashmere fuzz). Premium cues throughout.
7. 8K PHOTOREALISTIC: Cinematic render quality. NOT illustration, NOT AI-looking, NOT stock photo.
8. PREMIUM FEEL: Every element exudes quiet luxury — curated, intentional, warm. Think Aesop store meets The Row boutique.

${additionalNotes ? `STORE OWNER'S NOTES: ${additionalNotes}` : ''}

OUTPUT: 8K photorealistic editorial boutique photograph with cinematic depth and warmth. Aspect ratio 4:3. No text, no watermarks, no people.`;
}
