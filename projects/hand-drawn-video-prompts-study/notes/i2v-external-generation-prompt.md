# 外部图生视频实验｜AI Agent 整理任务

## 主题与素材

- 主题：AI Agent 把混乱任务整理成可执行流程
- 完成构图：`../demo/assets/i2v-agent-workflow-complete-frame.png`
- 空白首帧：`../demo/assets/i2v-blank-warm-white-first-frame.png`
- 推荐画幅：9:16
- 推荐时长：6 秒
- 推荐帧率观感：10–12 fps 纸片定格动画
- 生成音频：关闭；旁白、字幕与音效后期添加

## 方案 A｜只有一个图片上传框时（最通用）

上传“完成构图”，粘贴下面这段：

```text
Create a 6-second vertical 9:16 tactile paper stop-motion micro-animation from the supplied completed illustration. Keep a locked flat frontal camera and preserve the exact composition, Q-version creator, cobalt-blue assistant machine, warm-white paper texture, thick imperfect black crayon linework, and sunflower-yellow, tomato-red, sage-green palette.

0.0–1.2s: the scattered blank paper task cards on the left make small staggered paper-cutout hops along their existing arrows; the creator blinks once and tilts her head very slightly.
1.2–3.5s: two blank cards feed one at a time into the blue machine; its side roller turns, its antenna blinks blue twice, and the machine makes one restrained paper bounce.
3.5–5.2s: the yellow checklist ribbon unrolls only slightly; the three yellow step cards on the right settle in sequence from bottom to top; the tomato-red bottleneck marker pulses once and slides a few pixels aside so the path feels cleared.
5.2–6.0s: all paper pieces settle with tiny handmade jitter and hold the clean final composition.

Use rigid flat paper cutouts and charming low-frame-rate handmade motion. No camera drift, no zoom, no orbit, no parallax, no scene change, no lip sync, no face morphing, no body deformation, no extra limbs, no new characters, no new objects, no object replacement, no readable text, no letters, no digits, no logos, no watermark, no photorealism, no 3D, no glossy lighting, and no audio.
```

### 单图模式建议参数

- 运动强度：低到中（约 30%–45%）
- 镜头运动：关闭 / Static
- 创意或自由度：低（优先保构图）
- 首尾一致性、主体保持、结构保持：能开则开
- 提示词遵循：高

## 方案 B｜平台支持 First + Last 时（最接近上游样例）

- First frame：空白首帧
- Last frame：完成构图
- 粘贴下面这段：

```text
Create a 6-second vertical 9:16 tactile 10–12 fps paper stop-motion assembly. Start from the supplied completely blank warm-white paper first frame and end exactly on the supplied completed final illustration. Use a locked flat frontal camera.

0.0–1.0s: keep the warm-white paper empty for a brief beat, then slide the cobalt-blue assistant machine upward into the center with a small paper bounce.
1.0–2.2s: slide the Q-version creator in from the lower left; flutter the blank task cards in from the left one by one and draw the black arrows as short handmade strokes.
2.2–3.8s: feed two blank cards into the machine; turn the side roller and blink the blue antenna twice; unroll the yellow checklist ribbon from the machine.
3.8–5.2s: stamp the tomato-red bottleneck marker into place, then land the three sunflower-yellow step cards on the right from bottom to top with small paper settling bounces; draw their connecting arrows.
5.2–6.0s: settle into the supplied final illustration and hold it exactly for the final 0.8 seconds.

Preserve the exact final face, body proportions, object shapes, spacing, paper texture, thick black crayon linework, and color palette. Use rigid flat paper cutouts, not liquid morphing. No camera drift, zoom, orbit, parallax, smooth 3D motion, realistic physics, lip sync, face morphing, new characters, extra objects, readable text, letters, digits, logos, watermark, scene change, or audio.
```

### 首尾帧模式建议参数

- 首尾帧一致性：最高
- 运动强度：中等
- 镜头运动：关闭 / Locked camera
- 结束帧保持：0.8 秒（如果平台提供该参数）

## 负面提示词（平台有独立 Negative Prompt 时）

```text
camera movement, camera drift, zoom, dolly, pan, orbit, parallax, scene transition, background change, face morphing, identity change, body deformation, extra fingers, extra limbs, new character, new object, object replacement, liquid motion, melting, realistic physics, photorealism, 3D render, glossy lighting, gradient background, colored background, readable text, letters, digits, logo, watermark, subtitles, audio
```

## 后期确定性图层

视频模型里不要生成文字。导出后再用代码或剪辑软件叠加：

- 标题：`AI Agent 如何把混乱变成流程？`
- 口播：`真正有价值的 Agent，不只是回答问题，而是把散乱任务收进来，识别阻塞，再输出可以执行的下一步。`
- 关键词：`收集 → 判断 → 编排 → 执行`

## 首帧生成记录

- 生成方式：Codex 内置 ImageGen，新图生成模式
- 最终保存位置：`../demo/assets/i2v-agent-workflow-complete-frame.png`
- 最终提示词：

```text
Use case: illustration-story
Asset type: vertical 9:16 first-frame keyframe for an image-to-video experiment
Primary request: visualize “AI Agent turns scattered tasks into an executable workflow”
Scene/backdrop: solid warm-white #F8F6EF with subtle natural paper grain
Subject: a restrained cute Q-version Chinese creator at lower left, several scattered blank paper task cards and loose hand-drawn arrows drifting toward a simple cobalt-blue friendly assistant machine in the center; from the machine, an orderly sunflower-yellow blank checklist ribbon and three connected blank step cards emerge toward the upper right; one tomato-red bottleneck marker is visibly about to be cleared
Style: modern hand-drawn marker and wax-crayon illustration, flat paper-cutout shapes, thick imperfect black outlines, slight handmade jitter, editorial explainer aesthetic
Composition: 3–4 large readable visual groups, key subjects in center 65%, generous upper breathing room, bottom 15% visually quiet for deterministic subtitles, strong silhouette readability on a phone
Motion-readiness: keep objects separated and clearly outlined so a video model can animate cards flowing into the machine and ordered steps emerging; this image is the starting frame, not a storyboard sheet
Constraints: no text, no letters, no digits, no logos, no watermark, no gradients, no photorealism, no complex background, no 3D render, no interface screenshot
Palette: cobalt blue, sunflower yellow, tomato red, sage green, charcoal black on warm-white paper
```
