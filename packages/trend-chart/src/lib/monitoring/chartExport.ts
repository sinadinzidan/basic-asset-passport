const LEGEND_COLUMN_COUNT = 2;
const LEGEND_ROW_HEIGHT_PX = 18;
const LEGEND_TOP_GAP_PX = 16;
const BOTH_SIDES = 2;
const TITLE_BASELINE_PX = 28;
const SCOPE_BASELINE_PX = 48;
const AS_OF_BASELINE_PX = 64;
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
  if (overlay)
    for (const child of Array.from(overlay.children)) clone.appendChild(child.cloneNode(true));
  const markup = resolveCssVariables(new XMLSerializer().serializeToString(clone));
  const imageUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = await loadImage(imageUrl);
    const style = getComputedStyle(document.documentElement);
    const background = style.getPropertyValue('--background').trim() || '#ffffff';
    const foreground = style.getPropertyValue('--foreground').trim() || '#000000';
    const muted = style.getPropertyValue('--muted-foreground').trim() || '#555555';
    const legendRows = Math.ceil(details.legend.length / LEGEND_COLUMN_COUNT);
    const totalHeight =
      IMAGE_HEADER_HEIGHT_PX + height + legendRows * LEGEND_ROW_HEIGHT_PX + IMAGE_PADDING_PX;
    const canvas = document.createElement('canvas');
    canvas.width = (width + IMAGE_PADDING_PX * BOTH_SIDES) * IMAGE_SCALE;
    canvas.height = totalHeight * IMAGE_SCALE;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The chart image could not be created.');
    context.scale(IMAGE_SCALE, IMAGE_SCALE);
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = foreground;
    context.font = '600 16px Outfit, sans-serif';
    context.fillText(details.title, IMAGE_PADDING_PX, TITLE_BASELINE_PX);
    context.fillStyle = muted;
    context.font = '12px Outfit, sans-serif';
    context.fillText(`${details.scope} · ${details.period}`, IMAGE_PADDING_PX, SCOPE_BASELINE_PX);
    context.fillText(`As of ${details.asOf}`, IMAGE_PADDING_PX, AS_OF_BASELINE_PX);
    context.drawImage(image, IMAGE_PADDING_PX, IMAGE_HEADER_HEIGHT_PX, width, height);
    context.fillStyle = foreground;
    details.legend.forEach((line, index) => {
      context.fillText(
        line,
        IMAGE_PADDING_PX + (index % LEGEND_COLUMN_COUNT) * (width / LEGEND_COLUMN_COUNT),
        IMAGE_HEADER_HEIGHT_PX +
          height +
          LEGEND_TOP_GAP_PX +
          Math.floor(index / LEGEND_COLUMN_COUNT) * LEGEND_ROW_HEIGHT_PX,
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
