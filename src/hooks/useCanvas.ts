import { useRef, useEffect, useCallback } from 'react';

interface UseCanvasOptions {
  width?: number;
  height?: number;
}

export function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, deltaTime: number) => void,
  dependencies: unknown[] = [],
  options: UseCanvasOptions = {}
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const { width = 600, height = 400 } = options;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle DPI scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    lastTimeRef.current = performance.now();

    function render(currentTime: number) {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      ctx!.clearRect(0, 0, width, height);
      draw(ctx!, deltaTime);

      animationFrameIdRef.current = requestAnimationFrame(render);
    }

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, ...dependencies]);

  const getContext = useCallback(() => {
    return canvasRef.current?.getContext('2d') ?? null;
  }, []);

  return { canvasRef, getContext };
}
