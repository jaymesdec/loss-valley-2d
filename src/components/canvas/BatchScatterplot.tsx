import { useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import type { DataPoint } from '@/types';
import { CANVAS_COLORS } from '@/lib/constants';

interface BatchScatterplotProps {
  points: DataPoint[];
  activeBatchIndices: number[];
  batchSize: number;
  width?: number;
  height?: number;
}

const PADDING = { top: 20, right: 10, bottom: 10, left: 10 };

export function BatchScatterplot({
  points,
  activeBatchIndices,
  batchSize,
  width = 260,
  height = 140,
}: BatchScatterplotProps) {
  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (points.length === 0) return;

      const xMin = Math.min(...points.map((p) => p.x));
      const xMax = Math.max(...points.map((p) => p.x));
      const yMin = Math.min(...points.map((p) => p.y));
      const yMax = Math.max(...points.map((p) => p.y));

      const toX = (dataX: number) =>
        PADDING.left + ((dataX - xMin) / (xMax - xMin || 1)) * plotWidth;
      const toY = (dataY: number) =>
        PADDING.top + (1 - (dataY - yMin) / (yMax - yMin || 1)) * plotHeight;

      const activeSet = new Set(activeBatchIndices);

      // Header text
      ctx.fillStyle = '#A8A29E';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      if (activeBatchIndices.length > 0) {
        ctx.fillText(
          `Batch: ${batchSize} of ${points.length} points`,
          width / 2,
          12
        );
      } else {
        ctx.fillText('Click Step to see your batch', width / 2, 12);
      }

      // Draw all points dim first
      for (let i = 0; i < points.length; i++) {
        if (activeSet.has(i)) continue;
        const canvasX = toX(points[i].x);
        const canvasY = toY(points[i].y);
        ctx.fillStyle = CANVAS_COLORS.dataPoint;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      // Draw active batch points bright
      for (const index of activeBatchIndices) {
        if (index >= points.length) continue;
        const canvasX = toX(points[index].x);
        const canvasY = toY(points[index].y);
        ctx.fillStyle = CANVAS_COLORS.batchHighlight;
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },
    [points, activeBatchIndices, batchSize, plotWidth, plotHeight, width]
  );

  const { canvasRef } = useCanvas(draw, [points, activeBatchIndices], {
    width,
    height,
  });

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg"
      aria-label={`Batch scatterplot showing ${activeBatchIndices.length} of ${points.length} points highlighted`}
      role="img"
    />
  );
}
