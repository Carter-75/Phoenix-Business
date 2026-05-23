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
  
  private targetWaypoint = new THREE.Vector3();
  private exclusionRadius = 0;
  
  private historyPos: THREE.Vector3[] = [];
  private historyQuat: THREE.Quaternion[] = [];
  private readonly MAX_HISTORY = 600;
  private lastLogTime = 0;
  
  // Mobile responsiveness
  private boundX = 15;
  private boundY = 10;
  private birdScale = 1.0;
  private readonly ambientBoxSize = 80;

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
    this.updateBounds();
  }

  private updateBounds() {
    const depth = -15; 
    const distance = Math.abs(this.camera.position.z - depth);
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const height = 2 * Math.tan(vFov / 2) * distance;
    const width = height * this.camera.aspect;
    
    // Scale bird down on mobile screens (baseline 1200px width)
    this.birdScale = Math.max(0.4, Math.min(1.0, window.innerWidth / 1200));
    
    // 90% of viewport for waypoint spawning
    this.boundX = (width / 2) * 0.9;
    this.boundY = (height / 2) * 0.9;

    // Exclusion radius area = 2.5% of total screen area
    const screenArea = width * height;
    const targetArea = screenArea * 0.025;
    this.exclusionRadius = Math.sqrt(targetArea / Math.PI);
  }

  private generateWaypoint() {
    let newWaypoint = new THREE.Vector3();
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 50) {
      newWaypoint.x = (Math.random() - 0.5) * (this.boundX * 2);
      newWaypoint.y = (Math.random() - 0.5) * (this.boundY * 2);
      newWaypoint.z = -17.5 + (Math.random() - 0.5) * 15; // Z between -25 and -10

      if (this.targetWaypoint.lengthSq() === 0) {
        valid = true;
      } else {
        const dist = newWaypoint.distanceTo(this.targetWaypoint);
        if (dist > this.exclusionRadius) {
          valid = true;
        }
      }
      attempts++;
    }
    this.targetWaypoint.copy(newWaypoint);
  }

  private createParticles() {
    const geometry = new THREE.BufferGeometry();
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * this.ambientBoxSize;
      positions[i+1] = (Math.random() - 0.5) * this.ambientBoxSize;
      positions[i+2] = (Math.random() - 0.5) * 40 - 10; // Spans Z from -30 to +10
      
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
    // 1. Calculate physical viewport size at the Phoenix's depth layer (Z = -15)
    const depth = -15;
    const distance = Math.abs(this.camera.position.z - depth);
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const height = 2 * Math.tan(vFov / 2) * distance;
    const width = height * this.camera.aspect;
    
    // 2. Create an invisible circle encompassing the full viewport, plus 25%
    const viewportRadius = Math.sqrt(Math.pow(width/2, 2) + Math.pow(height/2, 2));
    const spawnRadius = viewportRadius * 1.25;

    // 3. Pick a completely random point on this circle
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnX = Math.cos(spawnAngle) * spawnRadius;
    const spawnY = Math.sin(spawnAngle) * spawnRadius;
    const startPos = new THREE.Vector3(spawnX, spawnY, depth);
    
    // Generate the very first waypoint
    this.targetWaypoint = new THREE.Vector3(); // reset
    this.generateWaypoint();
    
    // Initial direction directly aims from spawn point into the screen towards waypoint
    const startDir = this.targetWaypoint.clone().sub(startPos).normalize();
    
    this.wanderTheta = Math.atan2(startDir.z, startDir.x);
    this.wanderPhi = Math.acos(startDir.y);
    
    const speed = 0.08; // Doubled speed
    const startVel = startDir.clone().multiplyScalar(speed);

    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < this.MAX_HISTORY; i++) {
        // i=0 is head, i>0 is progressively further behind
        const p = startPos.clone().sub(startDir.clone().multiplyScalar(i * speed));
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
    this.phoenixParticles.frustumCulled = false; // CRITICAL: Prevents ThreeJS from hiding the bird!
    this.phoenixGroup = new THREE.Group();
    this.phoenixGroup.add(this.phoenixParticles);
    // Note: Bird is scaled natively in basePositions, so Group is left at 1.0 scale.
    // This allows world-coordinate history tracking to work flawlessly.
    this.scene.add(this.phoenixGroup);
  }

  private animate() {
    this.ngZone.runOutsideAngular(() => {
      const render = () => {
        // Ambient background drifting
        const positions = this.particles.geometry.attributes['position'].array as Float32Array;
        const halfBox = this.ambientBoxSize / 2;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += 0.005; positions[i+1] += 0.01; 
          if (positions[i+1] > halfBox) { positions[i+1] = -halfBox; positions[i] = (Math.random() - 0.5) * this.ambientBoxSize; }
          if (positions[i] > halfBox) positions[i] = -halfBox;
        }
        this.particles.geometry.attributes['position'].needsUpdate = true;
        this.particles.rotation.y += 0.0001;

        // --- Phoenix Animation ---
        if (this.phoenixGroup) {
          const speed = 0.08; 
          
          // Check if waypoint reached (capture radius increased to 10 since it's only wandering loosely towards it)
          if (this.phoenixPosition.distanceTo(this.targetWaypoint) < 10.0) {
              this.generateWaypoint();
          }

          // 1. Fluid Wander Force
          this.wanderTheta += (Math.random() - 0.5) * 0.05; 
          this.wanderPhi += (Math.random() - 0.5) * 0.05;
          this.wanderPhi = Math.max(Math.PI / 3, Math.min(2 * Math.PI / 3, this.wanderPhi));

          const wanderForce = new THREE.Vector3(
              Math.sin(this.wanderPhi) * Math.cos(this.wanderTheta), 
              Math.cos(this.wanderPhi), 
              Math.sin(this.wanderPhi) * Math.sin(this.wanderTheta)
          ).normalize().multiplyScalar(0.005); 

          // 2. Waypoint Pull (Favoring the point)
          const waypointForce = this.targetWaypoint.clone().sub(this.phoenixPosition).normalize().multiplyScalar(0.005);

          // 3. Loose Containment (Just in case the wander pushes it too far off screen)
          let containForce = new THREE.Vector3();
          const distX = Math.abs(this.phoenixPosition.x);
          const distY = Math.abs(this.phoenixPosition.y);
          if (distX > this.boundX * 1.3 || distY > this.boundY * 1.3) {
              const centerXY = new THREE.Vector3(0, 0, this.phoenixPosition.z);
              containForce = centerXY.sub(this.phoenixPosition).normalize().multiplyScalar(0.01);
          }
          if (this.phoenixPosition.z < -25) containForce.z += 0.01;
          else if (this.phoenixPosition.z > -10) containForce.z -= 0.01;
          
          // Combine forces (Wander + Waypoint + Containment)
          const combinedForce = wanderForce.add(waypointForce).add(containForce);
          
          // Significantly lower turn force for majestic, sweeping, massive turns
          let maxTurnForce = 0.00025 / this.birdScale; 
          
          // Reynolds Steering Algorithm
          const desiredVelocity = this.phoenixVelocity.clone().add(combinedForce).normalize().multiplyScalar(speed);
          const steering = desiredVelocity.sub(this.phoenixVelocity);
          if (steering.length() > maxTurnForce) steering.normalize().multiplyScalar(maxTurnForce);

          this.phoenixVelocity.add(steering);
          this.phoenixVelocity.normalize().multiplyScalar(speed);
          this.phoenixPosition.add(this.phoenixVelocity);

          const lookTarget = this.phoenixPosition.clone().add(this.phoenixVelocity.clone().multiplyScalar(100));
          const dummy = new THREE.Object3D();
          dummy.position.copy(this.phoenixPosition);
          dummy.lookAt(lookTarget);
          dummy.rotateY(Math.PI); 

          const vDiff = this.phoenixVelocity.clone().sub(this.previousVelocity);
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(dummy.quaternion);
          let targetBank = vDiff.dot(right) * 400; 
          targetBank = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, targetBank));
          this.currentBank += (targetBank - this.currentBank) * 0.05;
          dummy.rotateZ(this.currentBank);
          this.previousVelocity.copy(this.phoenixVelocity);

          this.historyPos.unshift(this.phoenixPosition.clone());
          this.historyQuat.unshift(dummy.quaternion.clone());
          if (this.historyPos.length > this.MAX_HISTORY) {
              this.historyPos.pop(); this.historyQuat.pop();
          }

          // Dragon Snake Particle Mapping
          this.flapTime += 0.08;
          const pPositions = this.phoenixParticles.geometry.attributes['position'].array as Float32Array;
          
          for (let i = 0; i < this.phoenixCount; i++) {
            const idx = i * 3;
            const baseX = this.basePositions[idx];
            const baseY = this.basePositions[idx+1];
            const baseZ = this.basePositions[idx+2];
            
            const scaledBaseX = baseX * this.birdScale;
            const scaledBaseY = baseY * this.birdScale;
            const scaledBaseZ = baseZ * this.birdScale;
            
            let histIdx = Math.floor(scaledBaseZ / speed);
            histIdx = Math.max(0, Math.min(this.historyPos.length - 1, histIdx));
            
            const hPos = this.historyPos[histIdx];
            const hQuat = this.historyQuat[histIdx];
            
            const flapAmount = Math.abs(scaledBaseX) * 0.5; 
            const flapPhase = this.flapTime - scaledBaseZ * 2.0; 
            const flapOffset = Math.sin(flapPhase) * flapAmount;
            
            const flickerX = (Math.random() - 0.5) * 0.05 * this.birdScale;
            const flickerY = (Math.random() - 0.5) * 0.05 * this.birdScale;
            
            const localOffset = new THREE.Vector3(scaledBaseX + flickerX, scaledBaseY + flapOffset + flickerY, 0);
            localOffset.applyQuaternion(hQuat);
            
            pPositions[idx] = hPos.x + localOffset.x;
            pPositions[idx+1] = hPos.y + localOffset.y;
            pPositions[idx+2] = hPos.z + localOffset.z;
          }
          this.phoenixParticles.geometry.attributes['position'].needsUpdate = true;
          
          // Debugging log every 1 second
          if (performance.now() - this.lastLogTime > 1000) {
              const center = new THREE.Vector3(0, 0, -15);
              const dist = this.phoenixPosition.distanceTo(center);
              console.log(`Phoenix Distance: ${dist.toFixed(2)} | Pos: (${this.phoenixPosition.x.toFixed(2)}, ${this.phoenixPosition.y.toFixed(2)}, ${this.phoenixPosition.z.toFixed(2)}) | Vel: (${this.phoenixVelocity.x.toFixed(3)}, ${this.phoenixVelocity.y.toFixed(3)}, ${this.phoenixVelocity.z.toFixed(3)})`);
              this.lastLogTime = performance.now();
          }
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
    this.updateBounds();
  }
}

