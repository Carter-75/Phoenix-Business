import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Nav } from './components/nav/nav';
import { Footer } from './components/footer/footer';
import * as THREE from 'three';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Nav, Footer],
  template: `
    <main class="min-h-screen bg-black selection:bg-gg-secondary selection:text-gg-bg flex flex-col overflow-hidden relative">
      <!-- Global Three.js Background -->
      <canvas #threeCanvas class="fixed inset-0 z-0 pointer-events-none w-full h-full"></canvas>

      <!-- Ambient glowing blobs -->
      <div class="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gg-secondary/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div class="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gg-primary/30 rounded-full blur-[150px] pointer-events-none z-0"></div>
      
      <!-- Premium Trailing Cursor -->
      <div id="custom-cursor" class="pointer-events-none fixed top-0 left-0 z-[9999] w-12 h-12 rounded-full border border-gg-secondary/50 mix-blend-screen flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform duration-150 ease-out opacity-0">
        <div class="w-1.5 h-1.5 bg-gg-accent rounded-full animate-pulse shadow-[0_0_10px_#D97706]"></div>
      </div>

      <app-nav class="z-50 relative"></app-nav>
      <div class="flex-grow z-10 relative">
        <router-outlet></router-outlet>
      </div>
      <app-footer class="z-50 relative"></app-footer>
    </main>
  `,
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('threeCanvas', { static: true }) threeCanvas!: ElementRef<HTMLCanvasElement>;
  
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private reqId!: number;
  private mouseX = 0;
  private mouseY = 0;
  private currentRotateX = 0;
  private currentRotateY = 0;

  private mouseMoveHandler = (e: MouseEvent) => {
    // Custom Cursor tracking
    const cursor = document.getElementById('custom-cursor');
    if (cursor) {
      cursor.style.opacity = '1';
      cursor.style.transform = `translate(${e.clientX - 24}px, ${e.clientY - 24}px)`;
    }

    // Parallax tracking
    this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  };

  private windowResizeHandler = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  ngAfterViewInit() {
    window.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });
    window.addEventListener('resize', this.windowResizeHandler);

    // Initialize Global Three.js Scene
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.001);

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 30;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.threeCanvas.nativeElement,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const geometry = new THREE.IcosahedronGeometry(12, 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0x047857,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const sphere = new THREE.Mesh(geometry, material);
    this.scene.add(sphere);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.2,
      color: 0xD97706,
      transparent: true,
      opacity: 0.6
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(particlesMesh);

    const animate = () => {
      this.reqId = requestAnimationFrame(animate);
      sphere.rotation.x += 0.001;
      sphere.rotation.y += 0.002;
      particlesMesh.rotation.y -= 0.0005;

      // Premium Parallax Effect
      this.camera.position.x += (this.mouseX * 5 - this.camera.position.x) * 0.05;
      this.camera.position.y += (-this.mouseY * 5 - this.camera.position.y) * 0.05;
      this.camera.lookAt(this.scene.position);

      this.renderer.render(this.scene, this.camera);

      // Global Premium Butter-Smooth Text Tilt
      const targetRotateX = -this.mouseY * 12; // 12 deg max
      const targetRotateY = this.mouseX * 12;
      this.currentRotateX += (targetRotateX - this.currentRotateX) * 0.1;
      this.currentRotateY += (targetRotateY - this.currentRotateY) * 0.1;
      
      const tiltTargets = document.querySelectorAll<HTMLElement>('.tilt-target');
      tiltTargets.forEach(target => {
        target.style.transform = `perspective(1200px) rotateX(${this.currentRotateX}deg) rotateY(${this.currentRotateY}deg)`;
      });
    };
    animate();
  }

  ngOnDestroy() {
    window.removeEventListener('mousemove', this.mouseMoveHandler);
    window.removeEventListener('resize', this.windowResizeHandler);
    if (this.reqId) cancelAnimationFrame(this.reqId);
    if (this.renderer) this.renderer.dispose();
  }
}
