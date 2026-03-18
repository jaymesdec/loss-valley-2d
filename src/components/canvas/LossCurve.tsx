import { useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import type { TrainingStep } from '@/types';

interface LossCurveProps {
  steps: TrainingStep[];
  maxSteps?: number;
  width?: number;
  height?: number;
}

const PADDING = { top: 15, right: 15, bottom: 30, left: 50 };

export function LossCurve({
  steps,
  maxSteps = 50,
  width = 300,
  height = 200,
}: LossCurveProps) {
  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (steps.length === 0) return;

      const maxLoss = Math.max(...steps.map((s) => s.loss), 1);
      const minLoss = 0;

      const toX = (stepNum: number) =>
        PADDING.left + (stepNum / maxSteps) * plotWidth;
      const toY = (loss: number) =>
        PADDING.top +
        (1 - (loss - minLoss) / (maxLoss - minLoss || 1)) * plotHeight;

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = PADDING.top + (i / 4) * plotHeight;
        ctx.beginPath();
        ctx.moveTo(PADDING.left, y);
        ctx.lineTo(PADDING.left + plotWidth, y);
        ctx.stroke();
      }

      // Axis labels
      ctx.fillStyle = '#A8A29E';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        const val = maxLoss - (i / 4) * (maxLoss - minLoss);
        ctx.fillText(
          val.toFixed(1),
          PADDING.left - 4,
          PADDING.top + (i / 4) * plotHeight + 3
        );
      }

      ctx.textAlign = 'center';
      for (let i = 0; i <= 5; i++) {
        const stepVal = Math.round((i / 5) * maxSteps);
        ctx.fillText(
          String(stepVal),
          toX(stepVal),
          height - 4
        );
      }

      // Titles
      ctx.fillStyle = '#A8A29E';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Step', PADDING.left + plotWidth / 2, height - 14);

      ctx.save();
      ctx.translate(10, PADDING.top + plotHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Loss', 0, 0);
      ctx.restore();

      // Loss curve line
      if (steps.length > 1) {
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toX(steps[0].step), toY(steps[0].loss));
        for (let i = 1; i < steps.length; i++) {
          ctx.lineTo(toX(steps[i].step), toY(steps[i].loss));
        }
        ctx.stroke();

        // Current point
        const current = steps[steps.length - 1];
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(toX(current.step), toY(current.loss), 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, PADDING.top);
      ctx.lineTo(PADDING.left, PADDING.top + plotHeight);
      ctx.lineTo(PADDING.left + plotWidth, PADDING.top + plotHeight);
      ctx.stroke();
    },
    [steps, maxSteps, width, height, plotWidth, plotHeight]
  );

  const { canvasRef } = useCanvas(draw, [steps], { width, height });

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg"
      aria-label="Loss curve showing loss vs. training step"
      role="img"
    />
  );
}
