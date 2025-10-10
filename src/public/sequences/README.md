# Image Sequences for HeroLightpass

## Required Structure

Place your lightpass image sequence in the following directory:

```
/public/sequences/face_lightpass/
├── 0001.webp
├── 0002.webp
├── 0003.webp
...
└── 0150.webp
```

## Image Specifications

### Desktop Version
- Format: WEBP (preferred) or JPG
- Total frames: 150
- Frame naming: 4-digit padded (0001-0150)
- Total size target: 35-40MB
- Dimensions: Recommended 1920x1080 or higher

### Mobile Version
- The component automatically loads every 2nd frame on mobile
- Effective frames used: 75 frames
- This reduces mobile payload to ~10-12MB

## Creating the Sequence

The sequence should show:
1. A portrait with specular light traveling from LEFT to RIGHT across the face
2. Same camera position/crop across all frames
3. Consistent exposure except for the traveling highlight
4. Apple AirPods "hero-lightpass" style aesthetic

### Frame Breakdown
- Frames 1-30: Light entering from left edge
- Frames 31-120: Light sweeping across the face
- Frames 121-150: Light exiting to right edge

## Optimization Tips

1. **WebP Compression**: Use quality 75-85 for good balance
2. **Batch Processing**: Use tools like ffmpeg or ImageMagick
3. **Consistent Dimensions**: All frames must be identical size
4. **Progressive Loading**: Component loads frame 1 immediately, then batches

## Fallback Behavior

If frames cannot be loaded:
- Component shows a loading indicator
- On `prefers-reduced-motion`, shows single middle frame
- Console errors logged for debugging

## Testing

Test the sequence locally by:
1. Place images in `/public/sequences/face_lightpass/`
2. Reload the page
3. Scroll down - the light should sweep across as you scroll
4. Check console for any loading errors
