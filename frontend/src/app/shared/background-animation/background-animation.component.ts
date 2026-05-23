import { Component, ElementRef, OnInit, OnDestroy, ViewChild, NgZone, inject } from '@angular/core';
import * as THREE from 'three';
import { PhoenixSettingsService } from '../../services/phoenix-settings.service';

interface PhoenixState {
  theme: 'orange' | 'blue' | 'purple';
  group: THREE.Group;
  particles: THREE.Points;
  basePositions: Float32Array;
  phoenixCount: number;
  currentBank: number;
  flapTime: number;
  
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  previousVelocity: THREE.Vector3;
  wanderTheta: number;
  wanderPhi: number;
  
  targetWaypoint: THREE.Vector3;
  exclusionRadius: number;
  lastLogTime: number;
  curvePhase: number;
  
  historyPos: THREE.Vector3[];
  historyQuat: THREE.Quaternion[];
}

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
  
  private birds: PhoenixState[] = [];
  private readonly MAX_HISTORY = 600;
  
  // Mobile responsiveness
  private boundX = 15;
  private boundY = 10;
  private birdScale = 1.0;
  private readonly ambientBoxSize = 80;

  private settings = inject(PhoenixSettingsService);

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.initThree();
    this.createParticles();
    
    // Initialize Fire Phoenix
    const orangeBird = this.createBirdState('orange');
    this.initHistory(orangeBird);
    this.createPhoenixMesh(orangeBird);
    this.birds.push(orangeBird);
    
    // Initialize Ice Phoenix
    const blueBird = this.createBirdState('blue');
    this.initHistory(blueBird);
    this.createPhoenixMesh(blueBird);
    this.birds.push(blueBird);

    // Initialize Eclipse Phoenix
    const purpleBird = this.createBirdState('purple');
    this.initHistory(purpleBird);
    this.createPhoenixMesh(purpleBird);
    this.birds.push(purpleBird);

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

  private createBirdState(theme: 'orange' | 'blue' | 'purple'): PhoenixState {
    return {
      theme,
      group: new THREE.Group(),
      particles: new THREE.Points(),
      basePositions: new Float32Array(0),
      phoenixCount: 4000,
      currentBank: 0,
      flapTime: Math.random() * Math.PI, // Offset flap cycle
      
      position: new THREE.Vector3(0, 0, -15),
      velocity: new THREE.Vector3(0, 0, -1),
      previousVelocity: new THREE.Vector3(0, 0, -1),
      wanderTheta: 0,
      wanderPhi: Math.PI / 2,
      
      targetWaypoint: new THREE.Vector3(),
      exclusionRadius: 0,
      lastLogTime: 0,
      curvePhase: Math.random() * Math.PI, // Offset S-curves
      
      historyPos: [],
      historyQuat: []
    };
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
    
    for (const bird of this.birds) {
      bird.exclusionRadius = Math.sqrt(targetArea / Math.PI);
    }
  }

  private generateWaypoint(bird: PhoenixState) {
    let newWaypoint = new THREE.Vector3();
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 50) {
      newWaypoint.x = (Math.random() - 0.5) * (this.boundX * 2);
      newWaypoint.y = (Math.random() - 0.5) * (this.boundY * 2);
      newWaypoint.z = -15 + (Math.random() - 0.5) * 5; // Kept tightly around -15

      if (bird.targetWaypoint.lengthSq() === 0) {
        valid = true;
      } else {
        const dist = newWaypoint.distanceTo(bird.targetWaypoint);
        if (dist > bird.exclusionRadius) {
          valid = true;
        }
      }
      attempts++;
    }
    bird.targetWaypoint.copy(newWaypoint);
  }

  private createParticles() {
    const geometry = new THREE.BufferGeometry();
    const count = 7000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * this.ambientBoxSize;
      positions[i+1] = (Math.random() - 0.5) * this.ambientBoxSize;
      
      // Spawn 5000 in the background/midground, and 2000 specifically in the foreground
      if (i < 5000 * 3) {
        positions[i+2] = (Math.random() - 0.5) * 40 - 10; // Spans Z from -30 to +10
      } else {
        positions[i+2] = Math.random() * 8 - 4; // Spans Z from -4 to +4 (very close to camera at Z=5)
      }
      
      const r = Math.random();
      // Evenly distribute colors amongst Orange, Blue, and Purple
      if (r > 0.66) {
        const subR = Math.random();
        if (subR > 0.7) { colors[i] = 1.0; colors[i+1] = 0.8; colors[i+2] = 0.2; } // Gold
        else if (subR > 0.3) { colors[i] = 1.0; colors[i+1] = 0.4; colors[i+2] = 0.0; } // Orange
        else { colors[i] = 0.8; colors[i+1] = 0.1; colors[i+2] = 0.0; } // Deep Red
      } else if (r > 0.33) {
        const subR = Math.random();
        if (subR > 0.7) { colors[i] = 0.2; colors[i+1] = 0.8; colors[i+2] = 1.0; } // Cyan
        else if (subR > 0.3) { colors[i] = 0.0; colors[i+1] = 0.4; colors[i+2] = 1.0; } // Blue
        else { colors[i] = 0.0; colors[i+1] = 0.1; colors[i+2] = 0.8; } // Deep Blue
      } else {
        const subR = Math.random();
        if (subR > 0.7) { colors[i] = 0.9; colors[i+1] = 0.2; colors[i+2] = 1.0; } // Magenta/Pink
        else if (subR > 0.3) { colors[i] = 0.6; colors[i+1] = 0.0; colors[i+2] = 1.0; } // Vivid Purple
        else { colors[i] = 0.3; colors[i+1] = 0.0; colors[i+2] = 0.6; } // Deep Purple
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

  private initHistory(bird: PhoenixState) {
    const depth = -15;
    const distance = Math.abs(this.camera.position.z - depth);
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const height = 2 * Math.tan(vFov / 2) * distance;
    const width = height * this.camera.aspect;
    
    // Scale exclusion radius
    const screenArea = width * height;
    bird.exclusionRadius = Math.sqrt((screenArea * 0.025) / Math.PI);
    
    const viewportRadius = Math.sqrt(Math.pow(width/2, 2) + Math.pow(height/2, 2));
    const spawnRadius = viewportRadius * 1.25;

    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnX = Math.cos(spawnAngle) * spawnRadius;
    const spawnY = Math.sin(spawnAngle) * spawnRadius;
    const startPos = new THREE.Vector3(spawnX, spawnY, depth);
    
    bird.targetWaypoint = new THREE.Vector3(); 
    this.generateWaypoint(bird);
    
    const startDir = bird.targetWaypoint.clone().sub(startPos).normalize();
    
    bird.wanderTheta = Math.atan2(startDir.z, startDir.x);
    bird.wanderPhi = Math.acos(startDir.y);
    
    const speed = 0.06; 
    const startVel = startDir.clone().multiplyScalar(speed);

    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < this.MAX_HISTORY; i++) {
        const p = startPos.clone().sub(startDir.clone().multiplyScalar(i * speed));
        bird.historyPos.push(p);
        
        dummy.position.copy(p);
        dummy.lookAt(p.clone().add(startVel));
        dummy.rotateY(Math.PI);
        bird.historyQuat.push(dummy.quaternion.clone());
    }
    
    bird.position.copy(startPos);
    bird.velocity.copy(startVel);
  }

  private createPhoenixMesh(bird: PhoenixState) {
    const geometry = new THREE.BufferGeometry();
    bird.basePositions = new Float32Array(bird.phoenixCount * 3);
    const positions = new Float32Array(bird.phoenixCount * 3);
    const colors = new Float32Array(bird.phoenixCount * 3);

    for (let i = 0; i < bird.phoenixCount; i++) {
      const idx = i * 3;
      let x = 0, y = 0, z = 0;
      let rand = Math.random();

      if (rand < 0.5) {
        x = (Math.random() - 0.5) * 20; 
        z = 0.05 * (x * x) + Math.random() * 1.5 + 4; 
        y = Math.sin(Math.abs(x) * 0.3) * 1.5 + (Math.random() - 0.5) * 0.1; 
      } else if (rand < 0.7) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.acos(2 * Math.random() - 1);
        const r = Math.cbrt(Math.random()); 
        x = r * Math.sin(v) * Math.cos(u) * 0.8; 
        y = r * Math.sin(v) * Math.sin(u) * 0.8; 
        z = r * Math.cos(v) * 3 + 6; 
      } else if (rand < 0.85) {
        z = Math.random() * 4; 
        let radius = 0;
        if (z < 0.8) radius = z * 0.3; 
        else if (z < 1.8) radius = 0.6 - Math.abs(z - 1.3) * 0.4; 
        else radius = 0.2 + (z - 1.8) * 0.1; 
        
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * Math.random() * radius;
        y = Math.sin(angle) * Math.random() * radius;
      } else {
        const feather = Math.floor(Math.random() * 5); 
        z = 9 + Math.random() * 16; 
        x = (feather - 2) * (z - 9) * 0.15 + (Math.random() - 0.5) * 0.2; 
        y = -Math.pow(Math.abs(z - 9), 1.1) * 0.15 + (Math.random() - 0.5) * 0.2; 
      }
      
      z += (Math.random() - 0.5) * 0.5;
      if (z < 0) z = 0;

      const scale = 0.4;
      bird.basePositions[idx] = x * scale;
      bird.basePositions[idx+1] = y * scale;
      bird.basePositions[idx+2] = z * scale;
      
      positions[idx] = x;
      positions[idx+1] = y;
      positions[idx+2] = z;

      const distFromCenter = Math.sqrt(x*x + z*z);
      if (bird.theme === 'orange') {
        if (distFromCenter < 2 && z < 2) {
          colors[idx] = 1.0; colors[idx+1] = 0.9; colors[idx+2] = 0.5;
        } else if (distFromCenter < 5 && z < 6) {
          colors[idx] = 1.0; colors[idx+1] = 0.4; colors[idx+2] = 0.0;
        } else {
          colors[idx] = 0.8; colors[idx+1] = 0.1; colors[idx+2] = 0.0;
        }
      } else if (bird.theme === 'blue') {
        if (distFromCenter < 2 && z < 2) {
          colors[idx] = 0.5; colors[idx+1] = 0.9; colors[idx+2] = 1.0; // Cyan Core
        } else if (distFromCenter < 5 && z < 6) {
          colors[idx] = 0.0; colors[idx+1] = 0.4; colors[idx+2] = 1.0; // Vivid Blue
        } else {
          colors[idx] = 0.0; colors[idx+1] = 0.1; colors[idx+2] = 0.8; // Deep Blue edges
        }
      } else {
        // Purple/Eclipse Theme
        if (distFromCenter < 2 && z < 2) {
          colors[idx] = 0.9; colors[idx+1] = 0.2; colors[idx+2] = 1.0; // Magenta Core
        } else if (distFromCenter < 5 && z < 6) {
          colors[idx] = 0.6; colors[idx+1] = 0.0; colors[idx+2] = 1.0; // Vivid Purple
        } else {
          colors[idx] = 0.3; colors[idx+1] = 0.0; colors[idx+2] = 0.6; // Deep Purple edges
        }
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

    bird.particles = new THREE.Points(geometry, material);
    bird.particles.frustumCulled = false; 
    bird.group = new THREE.Group();
    bird.group.add(bird.particles);
    this.scene.add(bird.group);
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

        // Iterate over all Phoenix Birds
        const speed = 0.06; 
        
        for (let i = 0; i < this.birds.length; i++) {
          const bird = this.birds[i];
          
          if (bird.group) {
            // Respect visibility toggles from Settings Service
            const isVisible = (bird.theme === 'orange' && this.settings.fireEnabled()) ||
                              (bird.theme === 'blue' && this.settings.iceEnabled()) ||
                              (bird.theme === 'purple' && this.settings.eclipseEnabled());
            
            bird.group.visible = isVisible;

            // Performance: If disabled via the hidden menu, skip running heavy 3D physics for this bird!
            if (!isVisible) continue;

            // Check if waypoint reached
            if (bird.position.distanceTo(bird.targetWaypoint) < 10.0) {
                this.generateWaypoint(bird);
            }

            // 1. Fluid Wander Force
            bird.wanderTheta += (Math.random() - 0.5) * 0.05; 
            bird.wanderPhi += (Math.random() - 0.5) * 0.05;
            bird.wanderPhi = Math.max(Math.PI / 3, Math.min(2 * Math.PI / 3, bird.wanderPhi));

            const wanderForce = new THREE.Vector3(
                Math.sin(bird.wanderPhi) * Math.cos(bird.wanderTheta), 
                Math.cos(bird.wanderPhi), 
                Math.sin(bird.wanderPhi) * Math.sin(bird.wanderTheta)
            ).normalize().multiplyScalar(0.005); 

            // 2. S-Curve Waypoint Pull
            const directToTarget = bird.targetWaypoint.clone().sub(bird.position);
            directToTarget.normalize();
            
            bird.curvePhase += 0.015; 
            const curveIntensity = Math.sin(bird.curvePhase) * 0.8; 
            
            const up = new THREE.Vector3(0, 1, 0);
            let curveRight = new THREE.Vector3().crossVectors(directToTarget, up).normalize();
            if (curveRight.lengthSq() < 0.001) curveRight = new THREE.Vector3(1, 0, 0); 
            
            const curveVector = curveRight.multiplyScalar(curveIntensity);
            const waypointForce = directToTarget.add(curveVector).normalize().multiplyScalar(0.005);

            // 3. Loose Containment 
            let containForce = new THREE.Vector3();
            const distX = Math.abs(bird.position.x);
            const distY = Math.abs(bird.position.y);
            if (distX > this.boundX * 1.3 || distY > this.boundY * 1.3) {
                const centerXY = new THREE.Vector3(0, 0, bird.position.z);
                containForce = centerXY.sub(bird.position).normalize().multiplyScalar(0.01);
            }
            if (bird.position.z < -25) containForce.z += 0.01;
            else if (bird.position.z > -10) containForce.z -= 0.01;
            
            // 4. Mutual Avoidance Force (Boid Separation)
            let avoidForce = new THREE.Vector3();
            for (let j = 0; j < this.birds.length; j++) {
              if (i !== j) {
                const otherBird = this.birds[j];
                // Only avoid other birds that are currently active!
                const isOtherVisible = (otherBird.theme === 'orange' && this.settings.fireEnabled()) ||
                                       (otherBird.theme === 'blue' && this.settings.iceEnabled()) ||
                                       (otherBird.theme === 'purple' && this.settings.eclipseEnabled());
                if (isOtherVisible) {
                  const distToOther = bird.position.distanceTo(otherBird.position);
                  
                  // If they get within 15 units of each other, strongly repel
                  if (distToOther < 15.0 && distToOther > 0) {
                    const repel = bird.position.clone().sub(otherBird.position).normalize();
                    // Closer they are, stronger the repel
                    const repelStrength = (15.0 - distToOther) / 15.0; 
                    avoidForce.add(repel.multiplyScalar(repelStrength * 0.015)); 
                  }
                }
              }
            }
            
            // Combine forces
            const combinedForce = wanderForce.add(waypointForce).add(containForce).add(avoidForce);
            
            // Dynamic Turn Radius
            const ratioX = Math.min(1.0, distX / this.boundX);
            const ratioY = Math.min(1.0, distY / this.boundY);
            const edgeProximity = Math.max(ratioX, ratioY); 
            
            const baseTurn = 0.0001;
            const edgeBonus = 0.0008;
            let maxTurnForce = (baseTurn + (edgeProximity * edgeBonus)) / this.birdScale; 
            
            // Reynolds Steering Algorithm
            const desiredVelocity = bird.velocity.clone().add(combinedForce).normalize().multiplyScalar(speed);
            const steering = desiredVelocity.sub(bird.velocity);
            if (steering.length() > maxTurnForce) steering.normalize().multiplyScalar(maxTurnForce);

            bird.velocity.add(steering);
            bird.velocity.normalize().multiplyScalar(speed);
            bird.position.add(bird.velocity);

            const lookTarget = bird.position.clone().add(bird.velocity.clone().multiplyScalar(100));
            const dummy = new THREE.Object3D();
            dummy.position.copy(bird.position);
            dummy.lookAt(lookTarget);
            dummy.rotateY(Math.PI); 

            const vDiff = bird.velocity.clone().sub(bird.previousVelocity);
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(dummy.quaternion);
            let targetBank = vDiff.dot(right) * 400; 
            targetBank = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, targetBank));
            bird.currentBank += (targetBank - bird.currentBank) * 0.05;
            dummy.rotateZ(bird.currentBank);
            bird.previousVelocity.copy(bird.velocity);

            bird.historyPos.unshift(bird.position.clone());
            bird.historyQuat.unshift(dummy.quaternion.clone());
            if (bird.historyPos.length > this.MAX_HISTORY) {
                bird.historyPos.pop(); bird.historyQuat.pop();
            }

            // Dragon Snake Particle Mapping
            bird.flapTime += 0.04;
            const pPositions = bird.particles.geometry.attributes['position'].array as Float32Array;
            
            for (let k = 0; k < bird.phoenixCount; k++) {
              const idx = k * 3;
              const baseX = bird.basePositions[idx];
              const baseY = bird.basePositions[idx+1];
              const baseZ = bird.basePositions[idx+2];
              
              const scaledBaseX = baseX * this.birdScale;
              const scaledBaseY = baseY * this.birdScale;
              const scaledBaseZ = baseZ * this.birdScale;
              
              let histIdx = Math.floor(scaledBaseZ / speed);
              histIdx = Math.max(0, Math.min(bird.historyPos.length - 1, histIdx));
              
              const hPos = bird.historyPos[histIdx];
              const hQuat = bird.historyQuat[histIdx];
              
              const flapAmount = Math.abs(scaledBaseX) * 0.5; 
              const flapPhase = bird.flapTime - scaledBaseZ * 2.0; 
              const flapOffset = Math.sin(flapPhase) * flapAmount;
              
              const flickerX = (Math.random() - 0.5) * 0.05 * this.birdScale;
              const flickerY = (Math.random() - 0.5) * 0.05 * this.birdScale;
              
              const localOffset = new THREE.Vector3(scaledBaseX + flickerX, scaledBaseY + flapOffset + flickerY, 0);
              localOffset.applyQuaternion(hQuat);
              
              pPositions[idx] = hPos.x + localOffset.x;
              pPositions[idx+1] = hPos.y + localOffset.y;
              pPositions[idx+2] = hPos.z + localOffset.z;
            }
            bird.particles.geometry.attributes['position'].needsUpdate = true;
            
            // Console Debugging
            if (performance.now() - bird.lastLogTime > 1000) {
                const wpDist = bird.position.distanceTo(bird.targetWaypoint);
                console.log(`[Phoenix:${bird.theme}] Pos: (${bird.position.x.toFixed(1)}, ${bird.position.y.toFixed(1)}, ${bird.position.z.toFixed(1)}) | ` +
                            `WP: (${bird.targetWaypoint.x.toFixed(1)}, ${bird.targetWaypoint.y.toFixed(1)}, ${bird.targetWaypoint.z.toFixed(1)}) | ` +
                            `Dist: ${wpDist.toFixed(1)} | Turn: ${maxTurnForce.toFixed(5)}`);
                bird.lastLogTime = performance.now();
            }
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
