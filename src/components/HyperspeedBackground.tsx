import { useEffect, useRef } from "react";

interface HyperspeedBackgroundProps {
  className?: string;
}

export const HyperspeedBackground = ({ className = "" }: HyperspeedBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    class Star {
      x: number;
      y: number;
      z: number;
      prevX: number;
      prevY: number;

      constructor() {
        this.x = Math.random() * canvas.width - canvas.width / 2;
        this.y = Math.random() * canvas.height - canvas.height / 2;
        this.z = Math.random() * canvas.width;
        this.prevX = this.x;
        this.prevY = this.y;
      }

      update(speed: number) {
        this.prevX = this.x;
        this.prevY = this.y;
        this.z -= speed;

        if (this.z <= 0) {
          this.x = Math.random() * canvas.width - canvas.width / 2;
          this.y = Math.random() * canvas.height - canvas.height / 2;
          this.z = canvas.width;
          this.prevX = this.x;
          this.prevY = this.y;
        }
      }

      draw() {
        if (!ctx) return;

        const x = (this.x / this.z) * canvas.width + canvas.width / 2;
        const y = (this.y / this.z) * canvas.height + canvas.height / 2;
        const prevX = (this.prevX / (this.z + 4)) * canvas.width + canvas.width / 2;
        const prevY = (this.prevY / (this.z + 4)) * canvas.height + canvas.height / 2;

        const size = Math.max(0, (1 - this.z / canvas.width) * 3);
        
        const gradient = ctx.createLinearGradient(prevX, prevY, x, y);
        gradient.addColorStop(0, "rgba(27, 184, 205, 0)");
        gradient.addColorStop(1, `rgba(27, 184, 205, ${1 - this.z / canvas.width})`);

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = size;
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${1 - this.z / canvas.width})`;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const stars: Star[] = [];
    const numStars = 800;
    let speed = 2;
    let targetSpeed = 2;

    for (let i = 0; i < numStars; i++) {
      stars.push(new Star());
    }

    const handleMouseDown = () => {
      targetSpeed = 20;
    };

    const handleMouseUp = () => {
      targetSpeed = 2;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleMouseDown);
    canvas.addEventListener("touchend", handleMouseUp);

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      speed += (targetSpeed - speed) * 0.05;

      stars.forEach((star) => {
        star.update(speed);
        star.draw();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleMouseDown);
      canvas.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ background: "linear-gradient(to bottom, #000000, #0a0a0a)" }}
    />
  );
};
