import { Component, ElementRef, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-background-animation',
  standalone: true,
  template: `<canvas #bgCanvas id="bg-canvas"></canvas>`,
  styles: [`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: -50;
      background: #020205;
    }
    #bg-canvas {
      width: 100%;
      height: 100%;
    }
  `]
})
export class BackgroundAnimationComponent implements OnInit, OnDestroy {
  @ViewChild('bgCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private particles!: THREE.Points;
  private animationId!: number;

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.initThree();
    this.createParticles();
    this.animate();
    
    window.addEventListener('resize', this.onResize.bind(this));
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.dispose();
  }

  private initThree() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    this.camera.position.z = 5;
  }

  private createParticles() {
    const geometry = new THREE.BufferGeometry();
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i+1] = (Math.random() - 0.5) * 20;
      positions[i+2] = (Math.random() - 0.5) * 20;
      
      // Fire colors: Red, Orange, Gold
      const r = Math.random();
      if (r > 0.8) {
        // Gold
        colors[i] = 1.0;
        colors[i+1] = 0.8;
        colors[i+2] = 0.2;
      } else if (r > 0.4) {
        // Orange
        colors[i] = 1.0;
        colors[i+1] = 0.4;
        colors[i+2] = 0.0;
      } else {
        // Deep Red
        colors[i] = 0.8;
        colors[i+1] = 0.1;
        colors[i+2] = 0.0;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private animate() {
    this.ngZone.runOutsideAngular(() => {
      const render = () => {
        // Angled movement: Up and to the right
        const positions = this.particles.geometry.attributes['position'].array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += 0.005; // Move Right
          positions[i+1] += 0.01; // Move Up
          
          if (positions[i+1] > 10) {
            positions[i+1] = -10;
            positions[i] = (Math.random() - 0.5) * 20;
          }
          if (positions[i] > 10) {
            positions[i] = -10;
          }
        }
        this.particles.geometry.attributes['position'].needsUpdate = true;

        this.particles.rotation.y += 0.0001;
        
        this.renderer.render(this.scene, this.camera);
        this.animationId = requestAnimationFrame(render);
      };
      render();
    });
  }

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

