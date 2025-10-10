/**
 * Draw an image to canvas using "object-fit: cover" logic
 * Ensures the image fills the canvas while maintaining aspect ratio
 */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | ImageBitmap,
  canvasWidth: number,
  canvasHeight: number
) {
  const imgAspect = img.width / img.height;
  const canvasAspect = canvasWidth / canvasHeight;

  let drawWidth: number;
  let drawHeight: number;
  let offsetX = 0;
  let offsetY = 0;

  if (imgAspect > canvasAspect) {
    // Image is wider - fit to height
    drawHeight = canvasHeight;
    drawWidth = drawHeight * imgAspect;
    offsetX = (canvasWidth - drawWidth) / 2;
  } else {
    // Image is taller - fit to width
    drawWidth = canvasWidth;
    drawHeight = drawWidth / imgAspect;
    offsetY = (canvasHeight - drawHeight) / 2;
  }

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}
