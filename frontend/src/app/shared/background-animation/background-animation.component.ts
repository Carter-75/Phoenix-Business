import { Component, ElementRef, OnInit, ViewChild, OnDestroy, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';

@Component({
  selector: 'app-background-animation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #canvas class="fixed top-0 left-0 w-full h-full -z-50 pointer-events-none opacity-40"></canvas>
  `,
  styles: [`
    canvas {
      filter: blur(1px);
    }
  `]
})
export class BackgroundAnimationComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private ngZone = inject(NgZone);
  private animationId?: number;
  
  private lines: any[] = [];
  private readonly lineCount = 15;

  ngOnInit() {
    this.initCanvas();
    this.createLines();
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
    
    window.addEventListener('resize', () => this.resize());
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  private resize() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private createLines() {
    for (let i = 0; i < this.lineCount; i++) {
      this.lines.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        length: Math.random() * 200 + 100,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.5 + 0.1,
        angle: Math.random() * Math.PI / 4 - Math.PI / 8 // Slight tilt
      });
    }
  }

  private animate() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    this.lines.forEach(line => {
      line.y -= line.speed;
      if (line.y + line.length < 0) {
        line.y = window.innerHeight;
        line.x = Math.random() * window.innerWidth;
      }

      this.ctx.beginPath();
      this.ctx.strokeStyle = `rgba(249, 115, 22, ${line.opacity})`;
      this.ctx.lineWidth = 1;
      this.ctx.moveTo(line.x, line.y);
      this.ctx.lineTo(line.x + Math.sin(line.angle) * line.length, line.y + line.length);
      this.ctx.stroke();
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}
