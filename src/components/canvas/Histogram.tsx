import { useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import type { LossFunction } from '@/types';
import { CANVAS_COLORS } from '@/lib/constants';

interface HistogramProps {
  errors: number[];
  isOutlier: boolean[];
  lossFunction: LossFunction;
  width?: number;
  height?: number;
}

const PADDING = { top: 10, right: 10, bottom: 24, left: 10 };

export function Histogram({
  errors,
  isOutlier,
  lossFunction,
  width = 220,
  height = 140,
}: HistogramProps) {
  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (errors.length === 0) return;

      // Compute bar values based on loss function
      const barValues = errors.map((error) =>
        lossFunction === 'mse' ? error * error : Math.abs(error)
      );

      const maxBarValue = Math.max(...barValues, 1);
      const barWidth = plotWidth / errors.length;
      const gap = Math.max(1, barWidth * 0.1);

      // Draw bars
      for (let i = 0; i < barValues.length; i++) {
        const barHeight = (barValues[i] / maxBarValue) * plotHeight;
        const barX = PADDING.left + i * barWidth + gap / 2;
        const barY = PADDING.top + plotHeight - barHeight;

        // Highlight outlier bars
        if (isOutlier[i]) {
          ctx.fillStyle =
            lossFunction === 'mse'
              ? CANVAS_COLORS.dataPointOutlier
              : '#F59E0B';
        } else {
          ctx.fillStyle = CANVAS_COLORS.dataPoint;
        }

        ctx.fillRect(barX, barY, barWidth - gap, barHeight);
      }

      // Label
      ctx.fillStyle = '#A8A29E';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        lossFunction === 'mse' ? 'Squared Errors' : 'Absolute Errors',
        width / 2,
        height - 4
      );
    },
    [errors, isOutlier, lossFunction, plotWidth, plotHeight, width, height]
  );

  const { canvasRef } = useCanvas(draw, [errors, lossFunction], {
    width,
    height,
  });

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg"
      aria-label={`Histogram of ${lossFunction === 'mse' ? 'squared' : 'absolute'} errors per data point`}
      role="img"
    />
  );
}
