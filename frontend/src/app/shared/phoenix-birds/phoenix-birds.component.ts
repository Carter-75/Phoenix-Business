import { Component, ElementRef, OnInit, OnDestroy, ViewChild, NgZone, inject, effect } from '@angular/core';
import * as THREE from 'three';
import { PhoenixSettingsService } from '../../services/phoenix-settings.service';

const UP_VECTOR = new THREE.Vector3(0, 1, 0);

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

// The phoenix birds layer: three 4,000-particle Three.js phoenixes
// (fire, ice, eclipse) with the flight physics recovered unchanged
// from the old combined background component. This component is its
// own layer now: a fixed full-screen canvas at z-index -49, one step
// above the Proton ember canvas (-50) and still behind all content.
//
// Gating: the whole system is owned by the PhoenixSettingsService
// master switch (phoenixesEnabled, server stored, owner controlled,
// default OFF). While the switch is off this component is inert: it
// never creates a WebGL context, never starts a render loop, and the
// canvas stays transparent. When the switch turns on, the scene is
// built and the birds behave exactly as the old system did, including
// the per-bird toggles and the seasonal theme recoloring. Turning the
// switch back off tears the scene down again.
//
// Like the old code, the birds themselves do not check
// prefers-reduced-motion; the site-wide reduced-motion handling lives
// in the global CSS and the other motion systems, as before.
@Component({
  selector: 'app-phoenix-birds',
  standalone: true,
  template: `<canvas #birdsCanvas id="birds-canvas"></canvas>`,
  styles: [`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: -49;
      pointer-events: none;
    }
    #birds-canvas {
      width: 100%;
      height: 100%;
    }
  `]
})
export class PhoenixBirdsComponent implements OnInit, OnDestroy {
  @ViewChild('birdsCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // Preallocated scratch objects for the render loop. The loop used
  // to allocate fresh vectors for every force and every one of the
  // 12,000 particles on every frame; reusing scratch values keeps
  // the math (and therefore the visuals) identical while removing
  // the garbage-collection churn.
  private readonly _wander = new THREE.Vector3();
  private readonly _toTarget = new THREE.Vector3();
  private readonly _curveRight = new THREE.Vector3();
  private readonly _contain = new THREE.Vector3();
  private readonly _center = new THREE.Vector3();
  private readonly _avoid = new THREE.Vector3();
  private readonly _repel = new THREE.Vector3();
  private readonly _desired = new THREE.Vector3();
  private readonly _look = new THREE.Vector3();
  private readonly _vDiff = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _offset = new THREE.Vector3();
  private readonly _dummy = new THREE.Object3D();
  private animationId = 0;

  private birds: PhoenixState[] = [];
  private readonly MAX_HISTORY = 600;

  // Mobile responsiveness
  private boundX = 15;
  private boundY = 10;
  private birdScale = 1.0;

  // True only while the master switch is on and the scene exists.
  private active = false;
  private destroyed = false;

  private readonly boundResize = () => this.onResize();

  private settings = inject(PhoenixSettingsService);

  constructor(private ngZone: NgZone) {
    effect(() => {
      const colors = this.settings.themePromo.phoenixColors();
      if (this.birds.length >= 3) {
        this.recolorBird(this.birds[0], colors.bird1);
        this.recolorBird(this.birds[1], colors.bird2);
        this.recolorBird(this.birds[2], colors.bird3);
      }
    });
  }

  ngOnInit() {
    // The gate. Created here (not in the constructor) so the canvas
    // ViewChild is resolved before any start can run. The master
    // switch defaults to false and only flips when the server value
    // loads, so in the normal off state this effect never starts
    // anything.
    effect(() => {
      if (this.settings.phoenixesEnabled()) {
        this.start();
      } else {
        this.stop();
      }
    });
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.stop();
  }

  // Build the scene and the three birds, exactly as the old
  // component's ngOnInit did, then start the loop.
  private start() {
    if (this.active || this.destroyed) return;
    this.active = true;

    this.initThree();

    // Initialize Fire Phoenix (Phoenix 1)
    const orangeBird = this.createBirdState('orange');
    this.initHistory(orangeBird);
    this.createPhoenixMesh(orangeBird);
    this.birds.push(orangeBird);

    // Initialize Ice Phoenix (Phoenix 2)
    const blueBird = this.createBirdState('blue');
    this.initHistory(blueBird);
    this.createPhoenixMesh(blueBird);
    this.birds.push(blueBird);

    // Initialize Eclipse Phoenix (Phoenix 3)
    const purpleBird = this.createBirdState('purple');
    this.initHistory(purpleBird);
    this.createPhoenixMesh(purpleBird);
    this.birds.push(purpleBird);

    const initialColors = this.settings.themePromo.phoenixColors();
    this.recolorBird(orangeBird, initialColors.bird1);
    this.recolorBird(blueBird, initialColors.bird2);
    this.recolorBird(purpleBird, initialColors.bird3);

    this.animate();

    window.addEventListener('resize', this.boundResize);
  }

  // Tear the scene down so the layer is inert again: no loop, no
  // rendered frame left on the canvas, GL resources released.
  private stop() {
    if (!this.active) return;
    this.active = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    window.removeEventListener('resize', this.boundResize);

    if (this.renderer && this.camera) {
      // Present one empty frame so no bird image lingers on the
      // canvas after the loop stops.
      try {
        this.renderer.render(new THREE.Scene(), this.camera);
      } catch {
        // Best effort only; disposal below still runs.
      }
    }

    for (const bird of this.birds) {
      bird.particles?.geometry?.dispose();
      const material = bird.particles?.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) {
        material.forEach((m) => m.dispose());
      } else {
        material?.dispose();
      }
    }
    this.birds = [];

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
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
    if (!this.camera) return;
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

  private initHistory(bird: PhoenixState) {
    if (!this.camera) return;
    const depth = -15;
    const distance = Math.abs(this.camera.position.z - depth);
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const height = 2 * Math.tan(vFov / 2) * distance;
    const width = height * this.camera.aspect;

    // Scale exclusion radius
    const screenArea = width * height;
    bird.exclusionRadius = Math.sqrt((screenArea * 0.025) / Math.PI);

    const viewportRadius = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
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
    if (!this.scene) return;
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

      const scale = 0.28;
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
          colors[idx] = 0.6; colors[idx+1] = 0.0; colors[idx+2] = 1.0; // Vivid Purple Core
        } else if (distFromCenter < 5 && z < 6) {
          colors[idx] = 0.3; colors[idx+1] = 0.0; colors[idx+2] = 0.8; // Deep Purple
        } else {
          colors[idx] = 0.1; colors[idx+1] = 0.0; colors[idx+2] = 0.5; // Dark Void Purple edges
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

  private recolorBird(bird: PhoenixState, hexColor: string) {
    if (!bird.particles || !bird.particles.geometry) return;
    const colorsAttr = bird.particles.geometry.attributes['color'] as THREE.BufferAttribute;
    if (!colorsAttr) return;

    const colors = colorsAttr.array as Float32Array;
    const base = new THREE.Color(hexColor);
    const core = base.clone().lerp(new THREE.Color('#ffffff'), 0.45);
    const mid = base.clone();
    const edge = base.clone().multiplyScalar(0.6);

    const posAttr = bird.particles.geometry.attributes['position'] as THREE.BufferAttribute;
    const positions = posAttr ? (posAttr.array as Float32Array) : null;

    for (let i = 0; i < bird.phoenixCount; i++) {
      const idx = i * 3;
      let distFromCenter = 3;
      let z = 3;
      if (positions) {
        const x = positions[idx];
        z = positions[idx + 2];
        distFromCenter = Math.sqrt(x * x + z * z);
      }

      if (distFromCenter < 2 && z < 2) {
        colors[idx] = core.r;
        colors[idx + 1] = core.g;
        colors[idx + 2] = core.b;
      } else if (distFromCenter < 5 && z < 6) {
        colors[idx] = mid.r;
        colors[idx + 1] = mid.g;
        colors[idx + 2] = mid.b;
      } else {
        colors[idx] = edge.r;
        colors[idx + 1] = edge.g;
        colors[idx + 2] = edge.b;
      }
    }

    colorsAttr.needsUpdate = true;
  }

  private animate() {
    this.ngZone.runOutsideAngular(() => {
      const render = () => {
        // Inert unless the master switch is on and the scene exists.
        if (!this.active || this.destroyed) return;
        const renderer = this.renderer;
        const scene = this.scene;
        const camera = this.camera;
        if (!renderer || !scene || !camera) return;

        // Iterate over all Phoenix Birds
        const speed = 0.06;

        for (let i = 0; i < this.birds.length; i++) {
          const bird = this.birds[i];

          if (bird.group) {
            // Respect visibility toggles from Settings Service. The
            // server-side master switch (phoenixesEnabled, owner
            // controlled, default off) gates every bird for every
            // visitor; the per-bird toggles only apply on top of it.
            const isVisible = this.settings.phoenixesEnabled() &&
                              ((bird.theme === 'orange' && this.settings.fireEnabled()) ||
                               (bird.theme === 'blue' && this.settings.iceEnabled()) ||
                               (bird.theme === 'purple' && this.settings.eclipseEnabled()));

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

            const wanderForce = this._wander.set(
                Math.sin(bird.wanderPhi) * Math.cos(bird.wanderTheta),
                Math.cos(bird.wanderPhi),
                Math.sin(bird.wanderPhi) * Math.sin(bird.wanderTheta)
            ).normalize().multiplyScalar(0.005);

            // 2. S-Curve Waypoint Pull
            const directToTarget = this._toTarget.copy(bird.targetWaypoint).sub(bird.position);
            directToTarget.normalize();

            bird.curvePhase += 0.015;
            const curveIntensity = Math.sin(bird.curvePhase) * 0.8;

            const curveRight = this._curveRight.crossVectors(directToTarget, UP_VECTOR).normalize();
            if (curveRight.lengthSq() < 0.001) curveRight.set(1, 0, 0);

            const curveVector = curveRight.multiplyScalar(curveIntensity);
            const waypointForce = directToTarget.add(curveVector).normalize().multiplyScalar(0.005);

            // 3. Loose Containment
            const containForce = this._contain.set(0, 0, 0);
            const distX = Math.abs(bird.position.x);
            const distY = Math.abs(bird.position.y);
            if (distX > this.boundX * 1.3 || distY > this.boundY * 1.3) {
                containForce.copy(this._center.set(0, 0, bird.position.z)).sub(bird.position).normalize().multiplyScalar(0.01);
            }
            if (bird.position.z < -25) containForce.z += 0.01;
            else if (bird.position.z > -10) containForce.z -= 0.01;

            // 4. Mutual Avoidance Force (Boid Separation)
            const avoidForce = this._avoid.set(0, 0, 0);
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
                    const repel = this._repel.copy(bird.position).sub(otherBird.position).normalize();
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
            const desiredVelocity = this._desired.copy(bird.velocity).add(combinedForce).normalize().multiplyScalar(speed);
            const steering = desiredVelocity.sub(bird.velocity);
            if (steering.length() > maxTurnForce) steering.normalize().multiplyScalar(maxTurnForce);

            bird.velocity.add(steering);
            bird.velocity.normalize().multiplyScalar(speed);
            bird.position.add(bird.velocity);

            const lookTarget = this._look.copy(bird.velocity).multiplyScalar(100).add(bird.position);
            const dummy = this._dummy;
            dummy.position.copy(bird.position);
            dummy.lookAt(lookTarget);
            dummy.rotateY(Math.PI);

            const vDiff = this._vDiff.copy(bird.velocity).sub(bird.previousVelocity);
            const right = this._right.set(1, 0, 0).applyQuaternion(dummy.quaternion);
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

              const localOffset = this._offset.set(scaledBaseX + flickerX, scaledBaseY + flapOffset + flickerY, 0);
              localOffset.applyQuaternion(hQuat);

              pPositions[idx] = hPos.x + localOffset.x;
              pPositions[idx+1] = hPos.y + localOffset.y;
              pPositions[idx+2] = hPos.z + localOffset.z;
            }
            bird.particles.geometry.attributes['position'].needsUpdate = true;

            // Console Debugging
            if (performance.now() - bird.lastLogTime > 1000) {
                bird.lastLogTime = performance.now();
            }
          }
        }

        renderer.render(scene, camera);
        this.animationId = requestAnimationFrame(render);
      };
      render();
    });
  }

  private onResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.updateBounds();
  }
}
