import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export const SpaceBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothCameraPos = useRef({ x: 0, y: 30, z: 600 });
  
  const threeRefs = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    composer: null as EffectComposer | null,
    stars: [] as THREE.Points[],
    nebula: null as THREE.Mesh | null,
    mountains: [] as THREE.Mesh[],
    animationId: null as number | null,
    targetCameraX: 0,
    targetCameraY: 30,
    targetCameraZ: 100
  });

  useEffect(() => {
    const initThree = () => {
      const { current: refs } = threeRefs;
      
      refs.scene = new THREE.Scene();
      refs.scene.fog = new THREE.FogExp2(0x000000, 0.00025);

      refs.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
      refs.camera.position.z = 100;
      refs.camera.position.y = 30;

      refs.renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        antialias: true,
        alpha: true
      });
      refs.renderer.setSize(window.innerWidth, window.innerHeight);
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      refs.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      refs.renderer.toneMappingExposure = 0.5;

      refs.composer = new EffectComposer(refs.renderer);
      const renderPass = new RenderPass(refs.scene, refs.camera);
      refs.composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.3, 0.4, 0.85
      );
      refs.composer.addPass(bloomPass);

      createStarField();
      createNebula();
      createMountains();
      createAtmosphere();

      animate();
    };

    const createStarField = () => {
      const { current: refs } = threeRefs;
      if (!refs.scene) return;
      const starCount = 3000;
      for (let i = 0; i < 2; i++) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let j = 0; j < starCount; j++) {
          const radius = 200 + Math.random() * 800;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);

          positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[j * 3 + 2] = radius * Math.cos(phi);

          const color = new THREE.Color();
          const colorChoice = Math.random();
          if (colorChoice < 0.6) color.setHSL(0.0, 0.0, 0.8 + Math.random() * 0.2); // White
          else if (colorChoice < 0.8) color.setHSL(0.1, 0.2, 0.8); // Warm
          else color.setHSL(0.6, 0.2, 0.9); // Cool white
          
          colors[j * 3] = color.r;
          colors[j * 3 + 1] = color.g;
          colors[j * 3 + 2] = color.b;

          sizes[j] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
          uniforms: { time: { value: 0 }, depth: { value: i } },
          vertexShader: `
            attribute float size; attribute vec3 color; varying vec3 vColor; uniform float time; uniform float depth;
            void main() {
              vColor = color; vec3 pos = position;
              float angle = time * 0.05 * (1.0 - depth * 0.3);
              mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)); pos.xy = rot * pos.xy;
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5)); if (dist > 0.5) discard;
              float opacity = 1.0 - smoothstep(0.0, 0.5, dist); gl_FragColor = vec4(vColor, opacity);
            }
          `,
          transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });

        const stars = new THREE.Points(geometry, material);
        refs.scene.add(stars); refs.stars.push(stars);
      }
    };

    const createNebula = () => {
      const { current: refs } = threeRefs;
      if (!refs.scene) return;
      const geometry = new THREE.PlaneGeometry(8000, 4000, 50, 50);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 }, color1: { value: new THREE.Color(0x1a1a1a) },
          color2: { value: new THREE.Color(0x2a2a2a) }, opacity: { value: 0.15 }
        },
        vertexShader: `
          varying vec2 vUv; varying float vElevation; uniform float time;
          void main() {
            vUv = uv; vec3 pos = position;
            float elevation = sin(pos.x * 0.01 + time) * cos(pos.y * 0.01 + time) * 20.0; pos.z += elevation; vElevation = elevation;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1; uniform vec3 color2; uniform float opacity; uniform float time; varying vec2 vUv; varying float vElevation;
          void main() {
            float mixFactor = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time); vec3 color = mix(color1, color2, mixFactor * 0.5 + 0.5);
            float alpha = opacity * (1.0 - length(vUv - 0.5) * 2.0); alpha *= 1.0 + vElevation * 0.01; gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
      });
      const nebula = new THREE.Mesh(geometry, material);
      nebula.position.z = -1050; nebula.rotation.x = 0;
      refs.scene.add(nebula); refs.nebula = nebula;
    };

    const createMountains = () => {
      const { current: refs } = threeRefs;
      if (!refs.scene) return;
      const layers = [
        { distance: -50, height: 60, color: 0x050505, opacity: 1 },
        { distance: -100, height: 80, color: 0x0a0a0a, opacity: 0.8 },
        { distance: -150, height: 100, color: 0x111111, opacity: 0.6 },
        { distance: -200, height: 120, color: 0x1a1a1a, opacity: 0.3 }
      ];
      layers.forEach((layer, index) => {
        const points = []; const segments = 50;
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments - 0.5) * 1000;
          const y = Math.sin(i * 0.1) * layer.height + Math.sin(i * 0.05) * layer.height * 0.5 + Math.random() * layer.height * 0.2 - 100;
          points.push(new THREE.Vector2(x, y));
        }
        points.push(new THREE.Vector2(5000, -2000)); points.push(new THREE.Vector2(-5000, -2000));
        const shape = new THREE.Shape(points); const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({ color: layer.color, transparent: true, opacity: layer.opacity, side: THREE.DoubleSide });
        const mountain = new THREE.Mesh(geometry, material);
        mountain.position.z = layer.distance; mountain.position.y = layer.distance - 20;
        mountain.userData = { baseZ: layer.distance, index };
        refs.scene.add(mountain); refs.mountains.push(mountain);
      });
    };

    const createAtmosphere = () => {
      const { current: refs } = threeRefs;
      if (!refs.scene) return;
      const geometry = new THREE.SphereGeometry(600, 32, 32);
      const material = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: `
          varying vec3 vNormal; varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal); vPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal; varying vec3 vPosition; uniform float time;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0); vec3 atmosphere = vec3(0.3, 0.3, 0.3) * intensity;
            float pulse = sin(time * 1.5) * 0.1 + 0.9; atmosphere *= pulse; gl_FragColor = vec4(atmosphere, intensity * 0.15);
          }
        `,
        side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true
      });
      const atmosphere = new THREE.Mesh(geometry, material); refs.scene.add(atmosphere);
    };

    const animate = () => {
      const { current: refs } = threeRefs;
      refs.animationId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      refs.stars.forEach(starField => {
        if (starField.material instanceof THREE.ShaderMaterial) starField.material.uniforms.time.value = time;
      });

      if (refs.nebula && refs.nebula.material instanceof THREE.ShaderMaterial) refs.nebula.material.uniforms.time.value = time * 0.5;

      if (refs.camera) {
        const smoothingFactor = 0.05;
        smoothCameraPos.current.x += (refs.targetCameraX - smoothCameraPos.current.x) * smoothingFactor;
        smoothCameraPos.current.y += (refs.targetCameraY - smoothCameraPos.current.y) * smoothingFactor;
        smoothCameraPos.current.z += (refs.targetCameraZ - smoothCameraPos.current.z) * smoothingFactor;
        const floatX = Math.sin(time * 0.1) * 2; const floatY = Math.cos(time * 0.15) * 1;
        refs.camera.position.x = smoothCameraPos.current.x + floatX; refs.camera.position.y = smoothCameraPos.current.y + floatY; refs.camera.position.z = smoothCameraPos.current.z;
        refs.camera.lookAt(0, 10, -600);
      }

      refs.mountains.forEach((mountain, i) => {
        const parallaxFactor = 1 + i * 0.5;
        mountain.position.x = Math.sin(time * 0.1) * 2 * parallaxFactor;
        mountain.position.y = (layerHeightByScroll() + mountain.userData.baseZ - 20) + (Math.cos(time * 0.15) * 1 * parallaxFactor);
      });

      if (refs.composer) refs.composer.render();
    };
    
    const layerHeightByScroll = () => window.scrollY * -0.05;

    initThree();

    const handleResize = () => {
      const { current: refs } = threeRefs;
      if (refs.camera && refs.renderer && refs.composer) {
        refs.camera.aspect = window.innerWidth / window.innerHeight;
        refs.camera.updateProjectionMatrix();
        refs.renderer.setSize(window.innerWidth, window.innerHeight);
        refs.composer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      const { current: refs } = threeRefs;
      if (refs.animationId) cancelAnimationFrame(refs.animationId);
      window.removeEventListener('resize', handleResize);
      refs.stars.forEach(starField => { starField.geometry.dispose(); (starField.material as THREE.Material).dispose(); });
      refs.mountains.forEach(mountain => { mountain.geometry.dispose(); (mountain.material as THREE.Material).dispose(); });
      if (refs.nebula) { refs.nebula.geometry.dispose(); (refs.nebula.material as THREE.Material).dispose(); }
      if (refs.renderer) refs.renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 w-full h-full object-cover pointer-events-none" />;
};
