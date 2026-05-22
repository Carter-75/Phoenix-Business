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
      pointer-events: none;
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
  
  // Phoenix properties
  private phoenixGroup!: THREE.Group;
  private phoenixParticles!: THREE.Points;
  private basePositions!: Float32Array;
  private phoenixCount = 4000;
  private currentBank = 0;
  private flapTime = 0;
  
  // Snake & Boid properties
  private phoenixVelocity = new THREE.Vector3(0, 0, -1);
  private phoenixPosition = new THREE.Vector3(0, 0, -15);
  private previousVelocity = new THREE.Vector3(0, 0, -1);
  private wanderTheta = 0;
  private wanderPhi = Math.PI / 2;
  
  private historyPos: THREE.Vector3[] = [];
  private historyQuat: THREE.Quaternion[] = [];
  private readonly MAX_HISTORY = 600;

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.initThree();
    this.createParticles();
    this.initHistory();
    this.createPhoenix();
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

  private initHistory() {
    const startPos = new THREE.Vector3(0, 0, -15);
    const startVel = new THREE.Vector3(0, 0, -1);
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < this.MAX_HISTORY; i++) {
        // i=0 is head, i>0 is progressively further behind
        const p = startPos.clone().sub(startVel.clone().multiplyScalar(i * 0.04));
        this.historyPos.push(p);
        
        dummy.position.copy(p);
        dummy.lookAt(p.clone().add(startVel));
        dummy.rotateY(Math.PI);
        this.historyQuat.push(dummy.quaternion.clone());
    }
    
    this.phoenixPosition.copy(startPos);
    this.phoenixVelocity.copy(startVel);
  }

  private createPhoenix() {
    const geometry = new THREE.BufferGeometry();
    this.basePositions = new Float32Array(this.phoenixCount * 3);
    const positions = new Float32Array(this.phoenixCount * 3);
    const colors = new Float32Array(this.phoenixCount * 3);

    for (let i = 0; i < this.phoenixCount; i++) {
      const idx = i * 3;
      let x = 0, y = 0, z = 0;
      let rand = Math.random();

      // Shape the bird. Beak is at Z=0, tail extends to Z=25.
      if (rand < 0.5) {
        // Wings (50%) - Razor thin, swept back
        x = (Math.random() - 0.5) * 20; 
        z = 0.05 * (x * x) + Math.random() * 1.5 + 4; // Attached to body at Z=4
        y = Math.sin(Math.abs(x) * 0.3) * 1.5 + (Math.random() - 0.5) * 0.1; 
      } else if (rand < 0.7) {
        // Body (20%) - Smooth ellipsoid
        const u = Math.random() * Math.PI * 2;
        const v = Math.acos(2 * Math.random() - 1);
        const r = Math.cbrt(Math.random()); 
        x = r * Math.sin(v) * Math.cos(u) * 0.8; // Slimmer width
        y = r * Math.sin(v) * Math.sin(u) * 0.8; // Slimmer height
        z = r * Math.cos(v) * 3 + 6; // Body spans from Z=3 to Z=9
      } else if (rand < 0.85) {
        // Head & Neck (15%) - Beak, Head, and Neck structure
        z = Math.random() * 4; 
        let radius = 0;
        if (z < 0.8) radius = z * 0.3; // Beak point
        else if (z < 1.8) radius = 0.6 - Math.abs(z - 1.3) * 0.4; // Round head
        else radius = 0.2 + (z - 1.8) * 0.1; // Neck thickening towards body
        
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * Math.random() * radius;
        y = Math.sin(angle) * Math.random() * radius;
      } else {
        // Tail (15%) - 5 distinct long feathers trailing behind
        const feather = Math.floor(Math.random() * 5); 
        z = 9 + Math.random() * 16; // Tail extends from 9 to 25
        x = (feather - 2) * (z - 9) * 0.15 + (Math.random() - 0.5) * 0.2; 
        y = -Math.pow(Math.abs(z - 9), 1.1) * 0.15 + (Math.random() - 0.5) * 0.2; 
      }
      
      z += (Math.random() - 0.5) * 0.5;
      if (z < 0) z = 0;

      const scale = 0.4;
      this.basePositions[idx] = x * scale;
      this.basePositions[idx+1] = y * scale;
      this.basePositions[idx+2] = z * scale;
      
      positions[idx] = x;
      positions[idx+1] = y;
      positions[idx+2] = z;

      // Color mapping: hotter core, cooling to red edges
      const distFromCenter = Math.sqrt(x*x + z*z);
      if (distFromCenter < 2 && z < 2) {
        colors[idx] = 1.0; colors[idx+1] = 0.9; colors[idx+2] = 0.5;
      } else if (distFromCenter < 5 && z < 6) {
        colors[idx] = 1.0; colors[idx+1] = 0.4; colors[idx+2] = 0.0;
      } else {
        colors[idx] = 0.8; colors[idx+1] = 0.1; colors[idx+2] = 0.0;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.phoenixParticles = new THREE.Points(geometry, material);
    this.phoenixGroup = new THREE.Group();
    this.phoenixGroup.add(this.phoenixParticles);
    // Note: Bird is scaled natively in basePositions, so Group is left at 1.0 scale.
    // This allows world-coordinate history tracking to work flawlessly.
    this.scene.add(this.phoenixGroup);
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

        // --- Phoenix Animation ---
        if (this.phoenixGroup) {
          // Boid Wandering Logic
          const speed = 0.04; // Gentle, majestic speed
          const maxTurnForce = 0.0002; // Extremely thin cone - halves the turn radius from before
          
          // 1. Wander Force (Severely restricted to favor straight flight)
          this.wanderTheta += (Math.random() - 0.5) * 0.02; // Very tiny adjustments
          this.wanderPhi += (Math.random() - 0.5) * 0.02;
          
          // Constrain phi so it doesn't fly perfectly straight up or down all the time
          this.wanderPhi = Math.max(Math.PI / 3, Math.min(2 * Math.PI / 3, this.wanderPhi));

          const wanderForce = new THREE.Vector3(
              Math.sin(this.wanderPhi) * Math.cos(this.wanderTheta), 
              Math.cos(this.wanderPhi), 
              Math.sin(this.wanderPhi) * Math.sin(this.wanderTheta)
          ).normalize().multiplyScalar(0.005); 

          // 2. Containment Force
          // This creates a strong "desired" vector back to the box if it goes out,
          // but the bird will only curve smoothly to match it because of maxTurnForce
          let containForce = new THREE.Vector3();
          
          if (this.phoenixPosition.x < -15) containForce.x += 0.05;
          else if (this.phoenixPosition.x > 15) containForce.x -= 0.05;
          
          if (this.phoenixPosition.y < -10) containForce.y += 0.05;
          else if (this.phoenixPosition.y > 10) containForce.y -= 0.05;
          
          if (this.phoenixPosition.z < -20) containForce.z += 0.05; 
          else if (this.phoenixPosition.z > -10) containForce.z -= 0.05; 

          // 3. Reynolds Steering Algorithm
          const desiredVelocity = this.phoenixVelocity.clone()
              .add(wanderForce)
              .add(containForce)
              .normalize()
              .multiplyScalar(speed);

          const steering = desiredVelocity.sub(this.phoenixVelocity);
          
          // Clamp steering force to enforce the "thin cone" (no sharp angles!)
          if (steering.length() > maxTurnForce) {
              steering.normalize().multiplyScalar(maxTurnForce);
          }

          // Apply forces
          this.phoenixVelocity.add(steering);
          this.phoenixVelocity.normalize().multiplyScalar(speed);

          // Move the bird head
          this.phoenixPosition.add(this.phoenixVelocity);

          // Point forward (multiply velocity by 100 to fix lookAt precision shaking)
          const lookTarget = this.phoenixPosition.clone().add(this.phoenixVelocity.clone().multiplyScalar(100));
          
          // Use a dummy object to calculate the master rotation for this frame
          const dummy = new THREE.Object3D();
          dummy.position.copy(this.phoenixPosition);
          dummy.lookAt(lookTarget);
          dummy.rotateY(Math.PI); // Flip 180 degrees

          // Calculate Bank Angle (Roll)
          const vDiff = this.phoenixVelocity.clone().sub(this.previousVelocity);
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(dummy.quaternion);
          const turnRate = vDiff.dot(right);
          
          let targetBank = turnRate * 400; 
          targetBank = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, targetBank));
          this.currentBank += (targetBank - this.currentBank) * 0.05;
          dummy.rotateZ(this.currentBank);
          
          this.previousVelocity.copy(this.phoenixVelocity);

          // Push new frame to history
          this.historyPos.unshift(this.phoenixPosition.clone());
          this.historyQuat.unshift(dummy.quaternion.clone());
          
          if (this.historyPos.length > this.MAX_HISTORY) {
              this.historyPos.pop();
              this.historyQuat.pop();
          }

          // Dragon Snake Particle Mapping
          this.flapTime += 0.04;
          const pPositions = this.phoenixParticles.geometry.attributes['position'].array as Float32Array;
          
          for (let i = 0; i < this.phoenixCount; i++) {
            const idx = i * 3;
            const baseX = this.basePositions[idx];
            const baseY = this.basePositions[idx+1];
            const baseZ = this.basePositions[idx+2];
            
            // Map the particle's Z distance to a frame in the flight history
            // baseZ is positive (0 = head, higher = tail). 
            // We divide by speed to get the number of frames behind the head it should be.
            let histIdx = Math.floor(baseZ / speed);
            histIdx = Math.max(0, Math.min(this.historyPos.length - 1, histIdx));
            
            const hPos = this.historyPos[histIdx];
            const hQuat = this.historyQuat[histIdx];
            
            const flapAmount = Math.abs(baseX) * 0.5; // X is scaled down, so boost flap multiplier
            const flapPhase = this.flapTime - baseZ * 2.0; // Wave travels down the body
            const flapOffset = Math.sin(flapPhase) * flapAmount;
            
            const flickerX = (Math.random() - 0.5) * 0.05;
            const flickerY = (Math.random() - 0.5) * 0.05;
            
            // Notice baseZ is entirely replaced by the history lookup!
            // We only apply the lateral offsets (X/Y) relative to the spine at that history frame.
            const localOffset = new THREE.Vector3(baseX + flickerX, baseY + flapOffset + flickerY, 0);
            localOffset.applyQuaternion(hQuat);
            
            pPositions[idx] = hPos.x + localOffset.x;
            pPositions[idx+1] = hPos.y + localOffset.y;
            pPositions[idx+2] = hPos.z + localOffset.z;
          }
          this.phoenixParticles.geometry.attributes['position'].needsUpdate = true;
        }
        
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

