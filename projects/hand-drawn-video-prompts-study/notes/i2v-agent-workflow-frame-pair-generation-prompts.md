# AI Agent 首尾帧补齐：内置 ImageGen 最终提示词

本文件记录修订 7 使用 Codex 内置 ImageGen 模式生成的 6 张缺失状态帧。所有调用均把对应本地图片标为 `edit target`，非破坏性保存到新的 `-first.png` 或 `-last.png` 文件。

## Shot 01 FIRST

```text
Use case: precise-object-edit
Asset type: vertical 9:16 FIRST frame for shot 01 in a first-frame/last-frame image-to-video pair
Input images: Image 1 is the edit target and the exact LAST frame; derive the earlier state from it
Primary request: create the pre-action state immediately before the task flood begins
Change only: remove every tomato-red path and arrow; remove six of the seven blank task cards, leaving exactly one small blank card at upper right; remove the small yellow and blue motion accent strokes around the removed cards
Preserve exactly: the same Q-version Chinese creator, face, concerned expression, black hair bun, green outfit, body pose, placement and scale; preserve the cobalt-blue circular clock-like icon at upper left, warm-white #F8F6EF paper, texture, crayon linework, palette, shadows, locked frontal camera, full 9:16 canvas, generous top breathing room, and bottom 15% subtitle-safe area
Composition: character remains lower center, one blank card remains separated at upper right, large quiet negative space indicates the moment before more work arrives
Constraints: no text, letters, digits, logos, watermark, gradients, photorealism, 3D, interface, new objects, new characters, extra cards, red arrows, or camera change
```

## Shot 02 LAST

```text
Use case: precise-object-edit
Asset type: vertical 9:16 LAST frame for shot 02 in a first-frame/last-frame image-to-video pair
Input images: Image 1 is the edit target and exact FIRST frame; derive the completed collection state while preserving the composition
Primary request: show that all scattered task cards have entered the single blue funnel and have been collected into the yellow tray
Change only: remove every floating card above the funnel; remove the card from the creator’s hands so her hands remain gently extended and empty; place exactly five small completely blank paper task cards as one neat rigid stack inside the existing sunflower-yellow tray; make the machine antenna show one small cobalt-blue glow accent
Preserve exactly: the same Q-version Chinese creator, face, smile, hair bun, green outfit, placement and scale; the same cobalt-blue funnel, friendly blue assistant machine, yellow tray position, warm-white #F8F6EF paper, texture, crayon linework, palette, shadows, locked frontal camera, full 9:16 canvas, top breathing room, and bottom 15% subtitle-safe area
Composition: empty funnel above, stable creator and machine below, collected blank-card stack clearly visible in the yellow tray
Constraints: cards stay blank; no text, letters, digits, logos, watermark, gradients, photorealism, 3D, interface, new objects, new characters, floating cards, output checklist, or camera change
```

## Shot 03 FIRST

```text
Use case: precise-object-edit
Asset type: vertical 9:16 FIRST frame for shot 03 in a first-frame/last-frame image-to-video pair
Input images: Image 1 is the edit target and the exact LAST frame; derive the earlier inspection state from it
Primary request: show the moment before the Agent has located the real bottleneck
Change only: move the large cobalt-blue magnifying lens left so its circular glass surrounds the leftmost blank task card instead of the tomato-red X; keep the lens attached to the machine with the same rigid blue arm; remove the entire sunflower-yellow bypass arrow; make the tomato-red X marker slightly smaller and visually quiet while keeping it in the same connection position
Preserve exactly: the same three blank dependency cards, straight black connector line, creator, pointing pose, focused face, hair, green outfit, friendly blue machine, machine face, placement and scale, warm-white #F8F6EF paper, texture, crayon linework, palette, shadows, locked frontal camera, full 9:16 canvas, top breathing room, and bottom 15% subtitle-safe area
Composition: magnifying lens clearly starts on the left card, red X remains visible farther right as the destination of the later lens movement
Constraints: no yellow arrow, no checklist ribbon, no text, letters, digits, logos, watermark, gradients, photorealism, 3D, interface, new objects, new characters, extra cards, or camera change
```

## Shot 04 FIRST

```text
Use case: precise-object-edit
Asset type: vertical 9:16 FIRST frame for shot 04 in a first-frame/last-frame image-to-video pair
Input images: Image 1 is the edit target and mixed-state reference; isolate only the pre-orchestration state
Primary request: show scattered work entering the Agent before any workflow has been produced
Change only: completely remove the three sunflower-yellow workflow step cards at upper right and all black arrows connecting those steps; retract the large yellow checklist ribbon into the machine so only one short blank yellow tab protrudes from the right output slot; keep the tomato-red circular X bottleneck visible to the right of the machine but remove the arrow that leads upward from it
Preserve exactly: the same six scattered blank cards and their black curved input arrows on the left, the same Q-version Chinese creator, thoughtful pose, face, hair, green outfit, friendly cobalt-blue assistant machine, machine face, placement and scale, warm-white #F8F6EF paper, texture, crayon linework, palette, shadows, locked frontal camera, full 9:16 canvas, top breathing room, and bottom 15% subtitle-safe area
Composition: scattered cards dominate the left input side; machine and creator stay fixed below; red X marks the blocked unorganized output; right upper area remains quiet and empty
Constraints: no completed checklist, no workflow step cards, no upward output arrows, no text, letters, digits, logos, watermark, gradients, photorealism, 3D, interface, new objects, new characters, check marks, or camera change
```

## Shot 04 LAST

```text
Use case: precise-object-edit
Asset type: vertical 9:16 LAST frame for shot 04 in a first-frame/last-frame image-to-video pair
Input images: Image 1 is the edit target and mixed-state reference; isolate only the completed workflow state
Primary request: show the Agent has converted scattered work into one executable, checkable workflow
Change only: completely remove all six scattered blank cards and all curved input arrows from the left side; remove the small loose paper protruding from the machine’s left input slot; replace the tomato-red X bottleneck circle with one sage-green circle containing a bold black check mark while keeping the circle in the same position; keep the black upward arrow from this resolved marker to the three yellow workflow step cards
Preserve exactly: the fully extended sunflower-yellow checklist ribbon from the machine, its three blank checkbox symbols and short black line symbols, the three sunflower-yellow workflow step cards and upward arrows, the same Q-version Chinese creator, thoughtful calm pose, face, hair, green outfit, friendly cobalt-blue assistant machine, machine face, placement and scale, warm-white #F8F6EF paper, texture, crayon linework, palette, shadows, locked frontal camera, full 9:16 canvas, top breathing room, and bottom 15% subtitle-safe area
Composition: quiet clean input space on the left; machine remains central; completed yellow checklist and three ordered workflow steps form a clear lower-right to upper-right path
Constraints: check mark and checkbox shapes are symbols only; no scattered input cards, no curved input arrows, no red X, no text, letters, digits, logos, watermark, gradients, photorealism, 3D, interface, new objects, new characters, or camera change
```

## Shot 05 FIRST

```text
Use case: precise-object-edit
Asset type: vertical 9:16 FIRST frame for shot 05 in a first-frame/last-frame image-to-video pair
Input images: Image 1 is the edit target and the exact LAST frame; derive the pre-execution state from it
Primary request: show the moment immediately before the creator activates the Agent and advances the workflow
Change only: completely remove all five checked task cards; retract the entire long sunflower-yellow workflow ribbon into the machine so only one short blank yellow tab is visible at the machine output; leave the sage-green result tray in the same lower-right position but completely empty; rotate the cobalt-blue lever to a clearly raised ready position while keeping the creator’s hand gently touching its handle
Preserve exactly: the same Q-version Chinese creator, calm face, hair bun, green outfit, placement and scale; the same friendly cobalt-blue assistant machine, machine face, antenna, green result tray, warm-white #F8F6EF paper, texture, crayon linework, palette, shadows, locked frontal camera, full 9:16 canvas, top breathing room, and bottom 15% subtitle-safe area
Composition: creator and raised lever at lower left, machine center, short yellow tab at output, empty green tray lower right, large quiet space above for the workflow that will emerge
Constraints: no checked cards, no long ribbon, no completed result, no text, letters, digits, logos, watermark, gradients, photorealism, 3D, interface, new objects, new characters, or camera change
```
