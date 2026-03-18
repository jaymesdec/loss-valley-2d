import { useRef, useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { DataPoint } from '@/types';
import { CANVAS_COLORS } from '@/lib/constants';

interface ScatterplotProps {
  points: DataPoint[];
  weight: number;
  bias: number;
  xRange: [number, number];
  yRange: [number, number];
  xLabel?: string;
  yLabel?: string;
  width?: number;
  height?: number;
  showWhiskers?: boolean;
}

const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

export function Scatterplot({
  points,
  weight,
  bias,
  xRange,
  yRange,
  xLabel = 'X',
  yLabel = 'Y',
  width = 500,
  height = 400,
  showWhiskers = true,
}: ScatterplotProps) {
  const reducedMotion = useReducedMotion();
  const whiskerAnimationRef = useRef(0);

  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const toCanvasX = useCallback(
    (dataX: number) =>
      PADDING.left +
      ((dataX - xRange[0]) / (xRange[1] - xRange[0])) * plotWidth,
    [xRange, plotWidth]
  );

  const toCanvasY = useCallback(
    (dataY: number) =>
      PADDING.top +
      (1 - (dataY - yRange[0]) / (yRange[1] - yRange[0])) * plotHeight,
    [yRange, plotHeight]
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, deltaTime: number) => {
      // Animate whisker length
      if (!reducedMotion) {
        whiskerAnimationRef.current += deltaTime * 3;
      } else {
        whiskerAnimationRef.current = 1;
      }
      const whiskerProgress = Math.min(whiskerAnimationRef.current, 1);

      // Draw grid lines
      ctx.strokeStyle = CANVAS_COLORS.gridLine;
      ctx.lineWidth = 1;

      const xTicks = 5;
      const yTicks = 5;

      for (let i = 0; i <= xTicks; i++) {
        const xVal = xRange[0] + (i / xTicks) * (xRange[1] - xRange[0]);
        const canvasX = toCanvasX(xVal);
        ctx.beginPath();
        ctx.moveTo(canvasX, PADDING.top);
        ctx.lineTo(canvasX, PADDING.top + plotHeight);
        ctx.stroke();
      }

      for (let i = 0; i <= yTicks; i++) {
        const yVal = yRange[0] + (i / yTicks) * (yRange[1] - yRange[0]);
        const canvasY = toCanvasY(yVal);
        ctx.beginPath();
        ctx.moveTo(PADDING.left, canvasY);
        ctx.lineTo(PADDING.left + plotWidth, canvasY);
        ctx.stroke();
      }

      // Draw axis labels
      ctx.fillStyle = CANVAS_COLORS.axisLabel;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';

      for (let i = 0; i <= xTicks; i++) {
        const xVal = xRange[0] + (i / xTicks) * (xRange[1] - xRange[0]);
        ctx.fillText(
          xVal.toFixed(1),
          toCanvasX(xVal),
          PADDING.top + plotHeight + 16
        );
      }

      ctx.textAlign = 'right';
      for (let i = 0; i <= yTicks; i++) {
        const yVal = yRange[0] + (i / yTicks) * (yRange[1] - yRange[0]);
        ctx.fillText(
          yVal.toFixed(0),
          PADDING.left - 8,
          toCanvasY(yVal) + 4
        );
      }

      // Axis titles
      ctx.fillStyle = CANVAS_COLORS.axisLabel;
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(xLabel, PADDING.left + plotWidth / 2, height - 4);

      ctx.save();
      ctx.translate(14, PADDING.top + plotHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();

      // Draw model line
      const lineX1 = xRange[0];
      const lineX2 = xRange[1];
      const lineY1 = weight * lineX1 + bias;
      const lineY2 = weight * lineX2 + bias;

      ctx.strokeStyle = CANVAS_COLORS.modelLine;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(lineX1), toCanvasY(lineY1));
      ctx.lineTo(toCanvasX(lineX2), toCanvasY(lineY2));
      ctx.stroke();

      // Draw whiskers and data points
      for (const point of points) {
        const canvasX = toCanvasX(point.x);
        const canvasY = toCanvasY(point.y);
        const predicted = weight * point.x + bias;
        const predictedCanvasY = toCanvasY(predicted);

        // Whisker line
        if (showWhiskers) {
          const whiskerEndY =
            canvasY + (predictedCanvasY - canvasY) * whiskerProgress;
          ctx.strokeStyle = CANVAS_COLORS.whiskerLine;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(canvasX, canvasY);
          ctx.lineTo(canvasX, whiskerEndY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Data point
        ctx.fillStyle = point.isOutlier
          ? CANVAS_COLORS.dataPointOutlier
          : CANVAS_COLORS.dataPoint;
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Point border
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw axes border
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, PADDING.top);
      ctx.lineTo(PADDING.left, PADDING.top + plotHeight);
      ctx.lineTo(PADDING.left + plotWidth, PADDING.top + plotHeight);
      ctx.stroke();
    },
    [
      points,
      weight,
      bias,
      xRange,
      yRange,
      xLabel,
      yLabel,
      width,
      height,
      plotWidth,
      plotHeight,
      toCanvasX,
      toCanvasY,
      showWhiskers,
      reducedMotion,
    ]
  );

  const { canvasRef } = useCanvas(draw, [points, weight, bias], {
    width,
    height,
  });

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg"
      aria-label={`Scatterplot of ${xLabel} vs ${yLabel} with model line`}
      role="img"
    />
  );
}
