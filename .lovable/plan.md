
# Replace Hero Blue Background with Water Wave Animation

## What Changes
Remove the solid blue gradient background (`bg-gradient-hero`) from the hero section and replace it with an animated water wave effect using pure CSS.

## Technical Details

### 1. Add CSS Water Wave Animation (`src/index.css`)
Add keyframes and styles for animated water waves:
- Multiple layered SVG wave shapes using `::before` and `::after` pseudo-elements
- Gentle horizontal looping animation at different speeds for a natural feel
- Semi-transparent layers with blue-teal tones that work in both light and dark mode
- A subtle gradient overlay on top to keep text readable

### 2. Update Hero Section (`src/pages/HomePage.tsx`)
- Remove `bg-gradient-hero` class from the hero `<motion.section>`
- Replace the existing decorative blur divs with a wave container div using the new CSS class
- Apply a dark overlay layer so white text remains readable over the animated waves
- Keep all text content, buttons, and animations unchanged
- Change text colors from `text-white` to use foreground colors where appropriate, or keep white with the dark overlay

### Wave Animation Approach
- Use CSS `@keyframes` for a smooth infinite horizontal wave motion
- 3 layered wave shapes (SVG-based background images) moving at different speeds (15s, 10s, 20s)
- Colors: translucent blue/cyan/teal tones
- Background: dark navy/deep blue base so waves are visible and text is readable
- No extra dependencies needed -- pure CSS animation

### Files to Modify
- `src/index.css` -- Add `.wave-hero` class with keyframes and wave layers
- `src/pages/HomePage.tsx` -- Swap `bg-gradient-hero` for `.wave-hero` class and adjust the decorative elements
