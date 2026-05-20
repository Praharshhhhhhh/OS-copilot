import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Button } from './saa-s-template';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const HorizonHeroSection = ({ onLogin }: { onLogin?: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const [isReady, setIsReady] = useState(false);
  const smoothCameraPos = useRef({ x: 0, y: 30, z: 100 });
  
  const threeRefs = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    composer: null as EffectComposer | null,
    stars: [] as THREE.Points[],
    nebula: null as THREE.Mesh | null,
    mountains: [] as THREE.Mesh[],
    animationId: null as number | null,
    locations: [] as number[],
    targetCameraX: 0,
    targetCameraY: 30,
    targetCameraZ: 100
  });

  // Initialize Three.js
  useEffect(() => {
    const initThree = () => {
      const { current: refs } = threeRefs;
      
      // Scene setup
      refs.scene = new THREE.Scene();
      refs.scene.fog = new THREE.FogExp2(0x000000, 0.00025);

      // Camera
      refs.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
      );
      refs.camera.position.z = 100;
      refs.camera.position.y = 30;

      // Renderer
      refs.renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        antialias: true,
        alpha: true
      });
      refs.renderer.setSize(window.innerWidth, window.innerHeight);
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      refs.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      refs.renderer.toneMappingExposure = 0.5;

      // Post-processing
      refs.composer = new EffectComposer(refs.renderer);
      const renderPass = new RenderPass(refs.scene, refs.camera);
      refs.composer.addPass(renderPass);

      // Lowered bloom glare as requested
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.3, // strength
        0.4, // radius
        0.85 // threshold
      );
      refs.composer.addPass(bloomPass);

      // Create scene elements
      createStarField();
      createNebula();
      createMountains();
      createAtmosphere();
      getLocation();

      // Start animation
      animate();
      
      setIsReady(true);
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

          // Color variation (more cyber/tech oriented)
          const color = new THREE.Color();
          const colorChoice = Math.random();
          if (colorChoice < 0.6) {
            color.setHSL(0.6, 0.8, 0.8 + Math.random() * 0.2); // Blue
          } else if (colorChoice < 0.8) {
            color.setHSL(0.75, 0.6, 0.8); // Purple
          } else {
            color.setHSL(0, 0, 0.9); // White
          }
          
          colors[j * 3] = color.r;
          colors[j * 3 + 1] = color.g;
          colors[j * 3 + 2] = color.b;

          sizes[j] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            depth: { value: i }
          },
          vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float time;
            uniform float depth;
            
            void main() {
              vColor = color;
              vec3 pos = position;
              
              float angle = time * 0.05 * (1.0 - depth * 0.3);
              mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
              pos.xy = rot * pos.xy;
              
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              
              float opacity = 1.0 - smoothstep(0.0, 0.5, dist);
              gl_FragColor = vec4(vColor, opacity);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        const stars = new THREE.Points(geometry, material);
        refs.scene.add(stars);
        refs.stars.push(stars);
      }
    };

    const createNebula = () => {
      const { current: refs } = threeRefs;
      if (!refs.scene) return;
      
      const geometry = new THREE.PlaneGeometry(8000, 4000, 50, 50);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color(0x312e81) }, // Indigo 900
          color2: { value: new THREE.Color(0x7e22ce) }, // Purple 700
          opacity: { value: 0.15 } // Reduced opacity to not overpower text
        },
        vertexShader: `
          varying vec2 vUv;
          varying float vElevation;
          uniform float time;
          
          void main() {
            vUv = uv;
            vec3 pos = position;
            
            float elevation = sin(pos.x * 0.01 + time) * cos(pos.y * 0.01 + time) * 20.0;
            pos.z += elevation;
            vElevation = elevation;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
          uniform float opacity;
          uniform float time;
          varying vec2 vUv;
          varying float vElevation;
          
          void main() {
            float mixFactor = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
            vec3 color = mix(color1, color2, mixFactor * 0.5 + 0.5);
            
            float alpha = opacity * (1.0 - length(vUv - 0.5) * 2.0);
            alpha *= 1.0 + vElevation * 0.01;
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const nebula = new THREE.Mesh(geometry, material);
      nebula.position.z = -1050;
      nebula.rotation.x = 0;
      refs.scene.add(nebula);
      refs.nebula = nebula;
    };

    const createMountains = () => {
      const { current: refs } = threeRefs;
      if (!refs.scene) return;
      
      const layers = [
        { distance: -50, height: 120, color: 0x0f172a, opacity: 1 },    // Slate 900
        { distance: -100, height: 160, color: 0x1e1b4b, opacity: 0.8 },  // Indigo 950
        { distance: -150, height: 200, color: 0x312e81, opacity: 0.6 }, // Indigo 900
        { distance: -200, height: 240, color: 0x4338ca, opacity: 0.3 }  // Indigo 700
      ];

      layers.forEach((layer, index) => {
        const points = [];
        const segments = 50;
        
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments - 0.5) * 1000;
          const y = Math.sin(i * 0.1) * layer.height + 
                   Math.sin(i * 0.05) * layer.height * 0.5 +
                   Math.random() * layer.height * 0.2 - 100;
          points.push(new THREE.Vector2(x, y));
        }
        
        points.push(new THREE.Vector2(5000, -2000));
        points.push(new THREE.Vector2(-5000, -2000));

        const shape = new THREE.Shape(points);
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
          color: layer.color,
          transparent: true,
          opacity: layer.opacity,
          side: THREE.DoubleSide
        });

        const mountain = new THREE.Mesh(geometry, material);
        mountain.position.z = layer.distance;
        mountain.position.y = layer.distance - 20; // Shift down slightly
        mountain.userData = { baseZ: layer.distance, index };
        refs.scene.add(mountain);
        refs.mountains.push(mountain);
      });
    };

    const createAtmosphere = () => {
      const { current: refs } = threeRefs;
      if (!refs.scene) return;
      
      const geometry = new THREE.SphereGeometry(600, 32, 32);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          uniform float time;
          
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            vec3 atmosphere = vec3(0.2, 0.4, 0.8) * intensity;
            
            float pulse = sin(time * 1.5) * 0.1 + 0.9;
            atmosphere *= pulse;
            
            gl_FragColor = vec4(atmosphere, intensity * 0.15); // lower intensity
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
      });

      const atmosphere = new THREE.Mesh(geometry, material);
      refs.scene.add(atmosphere);
    };

    const animate = () => {
      const { current: refs } = threeRefs;
      refs.animationId = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;

      // Update stars
      refs.stars.forEach((starField) => {
        if (starField.material instanceof THREE.ShaderMaterial) {
          starField.material.uniforms.time.value = time;
        }
      });

      // Update nebula
      if (refs.nebula && refs.nebula.material instanceof THREE.ShaderMaterial) {
        refs.nebula.material.uniforms.time.value = time * 0.5;
      }

      // Smooth camera motion
      if (refs.camera) {
        const smoothingFactor = 0.05;
        smoothCameraPos.current.x += (refs.targetCameraX - smoothCameraPos.current.x) * smoothingFactor;
        smoothCameraPos.current.y += (refs.targetCameraY - smoothCameraPos.current.y) * smoothingFactor;
        smoothCameraPos.current.z += (refs.targetCameraZ - smoothCameraPos.current.z) * smoothingFactor;
        
        const floatX = Math.sin(time * 0.1) * 2;
        const floatY = Math.cos(time * 0.15) * 1;
        
        refs.camera.position.x = smoothCameraPos.current.x + floatX;
        refs.camera.position.y = smoothCameraPos.current.y + floatY;
        refs.camera.position.z = smoothCameraPos.current.z;
        refs.camera.lookAt(0, 10, -600);
      }

      // Layer parallax
      refs.mountains.forEach((mountain, i) => {
        const parallaxFactor = 1 + i * 0.5;
        mountain.position.x = Math.sin(time * 0.1) * 2 * parallaxFactor;
        // Subtle wave motion
        mountain.position.y = (layerHeightByScroll() + mountain.userData.baseZ - 20) + (Math.cos(time * 0.15) * 1 * parallaxFactor);
      });

      if (refs.composer) {
        refs.composer.render();
      }
    };
    
    // Help calculate mountain Y over subtle scroll
    const layerHeightByScroll = () => {
       const scrollY = window.scrollY;
       return scrollY * -0.05; // tiny parallax effect on Y
    }

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

      refs.stars.forEach(starField => {
        starField.geometry.dispose();
        (starField.material as THREE.Material).dispose();
      });

      refs.mountains.forEach(mountain => {
        mountain.geometry.dispose();
        (mountain.material as THREE.Material).dispose();
      });

      if (refs.nebula) {
        refs.nebula.geometry.dispose();
        (refs.nebula.material as THREE.Material).dispose();
      }

      if (refs.renderer) {
        refs.renderer.dispose();
      }
    };
  }, []);

  const getLocation = () => {
    const { current: refs } = threeRefs;
    const locations: number[] = [];
    refs.mountains.forEach((mountain, i) => {
      locations[i] = mountain.position.z;
    });
    refs.locations = locations;
  };

  // GSAP Animations
  useEffect(() => {
    if (!isReady) return;
    
    // Make visible before animating
    gsap.set([titleRef.current, subtitleRef.current, ctaRef.current], {
      visibility: 'visible'
    });

    const tl = gsap.timeline();

    // Split text animation for title
    if (titleRef.current) {
      const titleChars = titleRef.current.querySelectorAll('.title-char');
      tl.fromTo(titleChars, 
        { y: 150, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.04,
          ease: "power4.out"
        }
      );
    }

    // Animate subtitles
    if (subtitleRef.current) {
      const lines = subtitleRef.current.querySelectorAll('.subtitle-line');
      tl.fromTo(lines, 
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out"
        },
        "-=0.6"
      );
    }
    
    // Animate CTA
    if (ctaRef.current) {
       tl.fromTo(ctaRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.5)" },
        "-=0.4"
       );
    }

    return () => {
      tl.kill();
    };
  }, [isReady]);

  // Subtle scroll parallax
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const { current: refs } = threeRefs;
      
      // We are dropping the intense multi-section scroll, 
      // instead just a subtle parallax as we scroll down the single page.
      refs.targetCameraZ = 100 - (scrollY * 0.1);
      refs.targetCameraY = 30 - (scrollY * 0.05);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const splitText = (text: string) => {
    return text.split('').map((char, i) => (
      <span key={i} className="title-char inline-block whitespace-pre">
        {char}
      </span>
    ));
  };

  return (
    <section ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* 3D Canvas Background */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 z-0 w-[100vw] h-[100vh] object-cover pointer-events-none"
      />
      
      {/* Front Content Layer */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-20 max-w-5xl mx-auto w-full">
        
        {/* Label Tag */}
        <aside className="mb-8 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/50 backdrop-blur-sm shadow-xl font-mono opacity-0 translate-y-4 animate-[fadeIn_1s_ease-out_forwards]">
          <span className="text-xs font-medium text-indigo-400 whitespace-nowrap">
            Open Source AI Agent
          </span>
          <div className="w-1 h-1 rounded-full bg-gray-700" />
          <a
            href="#features"
            className="flex items-center gap-1 text-xs font-medium hover:text-white transition-all active:scale-95 whitespace-nowrap text-gray-400"
          >
            See how it works
            <ArrowRight size={12} />
          </a>
        </aside>

        {/* Title */}
        <h1 
          ref={titleRef} 
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-6 uppercase flex flex-wrap justify-center overflow-hidden drop-shadow-2xl"
          style={{ visibility: 'hidden' }}
        >
          {splitText("OS COPILOT")}
        </h1>
        
        {/* Subtitle */}
        <div 
          ref={subtitleRef} 
          className="flex flex-col items-center gap-2 mb-12 text-gray-300 font-light text-lg md:text-xl drop-shadow-lg"
          style={{ visibility: 'hidden' }}
        >
          <p className="subtitle-line m-0">Automate your open source contributions.</p>
          <p className="subtitle-line m-0 text-gray-400">Build your portfolio while focusing on what matters.</p>
        </div>

        {/* Call to action */}
        <div ref={ctaRef} style={{ visibility: 'hidden' }} className="flex flex-col items-center gap-6">
          <button
            className="btn-liquid-glass px-10 py-5 text-lg font-semibold tracking-wide flex items-center gap-3"
            onClick={onLogin}
          >
            Connect GitHub
            <ArrowRight size={20} className="opacity-80" />
          </button>
        </div>
        
      </div>
    </section>
  );
};
