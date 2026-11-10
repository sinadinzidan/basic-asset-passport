const IMAGE_HEADER_HEIGHT_PX = 74;
const IMAGE_SCALE = 2;
const IMAGE_PADDING_PX = 16;

export interface ChartImageDetails {
  title: string;
  scope: string;
  period: string;
  asOf: string;
  legend: readonly string[];
}

function resolveCssVariables(markup: string): string {
  const style = getComputedStyle(document.documentElement);
  return markup.replace(
    /var\((--[a-zA-Z0-9-]+)\)/g,
    (_match, name: string) => style.getPropertyValue(name).trim() || 'currentColor',
  );
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The chart image could not be created.'));
    image.src = url;
  });
}

export async function exportChartImage(
  svg: SVGSVGElement,
  details: ChartImageDetails,
  fileName: string,
  overlay?: SVGSVGElement,
): Promise<void> {
  const width = svg.width.baseVal.value;
  const height = svg.height.baseVal.value;
  const clone = svg.cloneNode(true);
  if (!(clone instanceof SVGSVGElement)) throw new Error('The chart image could not be created.');
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (overlay) for (const child of Array.from(overlay.children)) clone.appendChild(child.cloneNode(true));
  const markup = resolveCssVariables(new XMLSerializer().serializeToString(clone));
  const imageUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = await loadImage(imageUrl);
    const style = getComputedStyle(document.documentElement);
    const background = style.getPropertyValue('--background').trim() || '#ffffff';
    const foreground = style.getPropertyValue('--foreground').trim() || '#000000';
    const muted = style.getPropertyValue('--muted-foreground').trim() || '#555555';
    const legendRows = Math.ceil(details.legend.length / 2);
    const totalHeight = IMAGE_HEADER_HEIGHT_PX + height + legendRows * 18 + IMAGE_PADDING_PX;
    const canvas = document.createElement('canvas');
    canvas.width = (width + IMAGE_PADDING_PX * 2) * IMAGE_SCALE;
    canvas.height = totalHeight * IMAGE_SCALE;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The chart image could not be created.');
    context.scale(IMAGE_SCALE, IMAGE_SCALE);
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = foreground;
    context.font = '600 16px Outfit, sans-serif';
    context.fillText(details.title, IMAGE_PADDING_PX, 28);
    context.fillStyle = muted;
    context.font = '12px Outfit, sans-serif';
    context.fillText(`${details.scope} · ${details.period}`, IMAGE_PADDING_PX, 48);
    context.fillText(`As of ${details.asOf}`, IMAGE_PADDING_PX, 64);
    context.drawImage(image, IMAGE_PADDING_PX, IMAGE_HEADER_HEIGHT_PX, width, height);
    context.fillStyle = foreground;
    details.legend.forEach((line, index) => {
      context.fillText(
        line,
        IMAGE_PADDING_PX + (index % 2) * (width / 2),
        IMAGE_HEADER_HEIGHT_PX + height + 16 + Math.floor(index / 2) * 18,
      );
    });
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('The chart image could not be created.');
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
