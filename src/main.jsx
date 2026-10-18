import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles.css";

gsap.registerPlugin(ScrollTrigger);

function makeSky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { uTime: { value: 0 }, uMood: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime; uniform float uMood;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y); }
      float fbm(vec2 p){ float v=0.0; float a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
      void main(){
        vec2 uv=vUv; float cloud=fbm(vec2(uv.x*4.2+uTime*.008,uv.y*8.0));
        float horizon=smoothstep(.02,.82,uv.y);
        vec3 dayBottom=vec3(.98,.88,.91), dayTop=vec3(.67,.50,.78);
        vec3 nightBottom=vec3(.31,.24,.39), nightTop=vec3(.075,.065,.12);
        vec3 sky=mix(mix(dayBottom,dayTop,horizon),mix(nightBottom,nightTop,horizon),uMood);
        float cloudMask=smoothstep(.53,.79,cloud)*smoothstep(.04,.55,uv.y)*(1.0-smoothstep(.82,.99,uv.y));
        vec3 cloudDay=mix(vec3(.88,.77,.88),vec3(1.0,.97,.96),noise(uv*24.0));
        vec3 cloudNight=vec3(.63,.53,.69);
        vec3 cloudColor=mix(cloudDay,cloudNight,uMood);
        float haze=exp(-pow((uv.y-.39)*8.0,2.0))*.35;
        sky=mix(sky,vec3(.95,.80,.89),haze*(1.0-uMood));
        gl_FragColor=vec4(mix(sky,cloudColor,cloudMask*.78),1.0);
      }`
  });
  return new THREE.Mesh(new THREE.SphereGeometry(80, 48, 32), material);
}

function labelTexture(title, subline) {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 300;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,249,252,.84)"; ctx.fillRect(25, 28, 462, 244);
  ctx.strokeStyle = "rgba(123,74,165,.35)"; ctx.lineWidth = 2; ctx.strokeRect(39, 42, 434, 216);
  ctx.fillStyle = "#7b4aa5"; ctx.textAlign = "center"; ctx.font = "italic 42px Georgia"; ctx.fillText("GRASSIA", 256, 138);
  ctx.fillStyle = "#786b7c"; ctx.font = "16px Arial"; ctx.fillText(title, 256, 184);
  ctx.font = "12px Arial"; ctx.letterSpacing = "4px"; ctx.fillText(subline.toUpperCase(), 256, 218);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function roundedBottle(color = 0xead6ef) {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-.96, -.95); shape.lineTo(-1.04, .45); shape.quadraticCurveTo(-1.08, .86, -.73, .98);
  shape.lineTo(-.49, 1.07); shape.lineTo(-.42, 1.42); shape.lineTo(.42, 1.42); shape.lineTo(.49, 1.07);
  shape.lineTo(.73, .98); shape.quadraticCurveTo(1.08, .86, 1.04, .45); shape.lineTo(.96, -.95);
  shape.quadraticCurveTo(.91, -1.14, .68, -1.14); shape.lineTo(-.68, -1.14); shape.quadraticCurveTo(-.91, -1.14, -.96, -.95);
  const glass = new THREE.MeshPhysicalMaterial({ color, metalness: .05, roughness: .12, transmission: .78, thickness: .95, ior: 1.42, transparent: true, opacity: .94, clearcoat: 1, clearcoatRoughness: .08 });
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .54, bevelEnabled: true, bevelSegments: 5, steps: 1, bevelSize: .12, bevelThickness: .12, curveSegments: 16 }), glass);
  body.position.z = -.27; group.add(body);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.79, .83, .11, 48), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: .18, roughness: .22, transmission: .42, transparent: true })); base.position.y = -1.09; group.add(base);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.31, .34, .46, 32), new THREE.MeshPhysicalMaterial({ color: 0xf8eef8, metalness: .16, roughness: .19, transmission: .5, transparent: true })); neck.position.y = 1.51; group.add(neck);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .12, 40), new THREE.MeshStandardMaterial({ color: 0xc7a1d4, metalness: .7, roughness: .24 })); collar.position.y = 1.76; group.add(collar);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.37, .4, .72, 48, 1, false), new THREE.MeshPhysicalMaterial({ color: 0x563b65, metalness: .45, roughness: .19, clearcoat: 1 })); cap.position.y = 2.16; group.add(cap);
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(.33, .37, .05, 48), new THREE.MeshStandardMaterial({ color: 0xe7cedd, metalness: .55, roughness: .25 })); capTop.position.y = 2.545; group.add(capTop);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.48, .72), new THREE.MeshBasicMaterial({ map: labelTexture("EAU DE PARFUM", "PARIS · 50 ML"), transparent: true, depthWrite: false })); label.position.set(0, -.12, .41); group.add(label);
  return group;
}

function makeRidge(seed, color, z, height) {
  const width = 68, depth = 26, cols = 64, rows = 26;
  const positions = [], colors = [], indices = [];
  const base = new THREE.Color(color), highlight = new THREE.Color("#d6bce3");
  for (let iz = 0; iz <= rows; iz++) {
    for (let ix = 0; ix <= cols; ix++) {
      const x = (ix / cols - .5) * width;
      const zz = (iz / rows - .5) * depth;
      const peaks = Math.sin(x * .21 + seed) * .6 + Math.sin(x * .49 + seed * 1.8) * .27 + Math.sin(x * .085 - seed) * .7;
      const slope = Math.pow(Math.max(0, 1 - Math.abs(zz) / (depth * .8)), .7);
      const y = peaks * height * slope + Math.sin((x + zz) * .17 + seed) * .16;
      positions.push(x, y, zz);
      const tint = THREE.MathUtils.clamp((y / height + .7) * .45 + iz / rows * .28, 0, .72);
      const col = base.clone().lerp(highlight, tint); colors.push(col.r, col.g, col.b);
      if (ix < cols && iz < rows) { const a = iz * (cols + 1) + ix, b = a + cols + 1; indices.push(a, b, a + 1, b, b + 1, a + 1); }
    }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3)); geo.setIndex(indices); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: .04, flatShading: true, side: THREE.DoubleSide }));
  mesh.position.z = z; return mesh;
}

function chapterCard(title, label, accent = "#7b4aa5") {
  const canvas = document.createElement("canvas"); canvas.width = 768; canvas.height = 440;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(248,241,250,.90)"; ctx.fillRect(0, 0, 768, 440);
  ctx.strokeStyle = "rgba(123,74,165,.32)"; ctx.lineWidth = 2; ctx.strokeRect(20, 20, 728, 400);
  ctx.fillStyle = accent; ctx.font = "600 19px Arial"; ctx.letterSpacing = "5px"; ctx.fillText(label.toUpperCase(), 52, 82);
  ctx.fillStyle = "#3d3a42"; ctx.font = "italic 48px Georgia"; ctx.letterSpacing = "0px"; ctx.fillText(title, 52, 165);
  ctx.strokeStyle = "rgba(123,74,165,.24)"; ctx.beginPath(); ctx.moveTo(52, 205); ctx.lineTo(700, 205); ctx.stroke();
  for (let i = 0; i < 3; i++) { ctx.fillStyle = i === 0 ? accent : "rgba(123,74,165,.20)"; ctx.fillRect(52, 252 + i * 42, 220 + (i % 2) * 80, 8); }
  ctx.beginPath(); ctx.arc(638, 314, 40, 0, Math.PI * 2); ctx.strokeStyle = "rgba(247,168,184,.8)"; ctx.lineWidth = 8; ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshPhysicalMaterial({ map: texture, roughness: .36, metalness: .08, clearcoat: .7, transparent: true, side: THREE.DoubleSide }));
  return mesh;
}

function glassOrb(radius, color, roughness = .16) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 36), new THREE.MeshPhysicalMaterial({ color, metalness: .1, roughness, transmission: .72, thickness: .8, ior: 1.38, transparent: true, opacity: .94, clearcoat: 1 }));
}

function ThreeWalkthrough({ onProgress }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const isMobile = window.matchMedia("(max-width: 600px)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.15 : 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(39, window.innerWidth / window.innerHeight, .1, 220);
    camera.position.set(0, .12, 10);
    const sky = makeSky(); scene.add(sky);
    scene.add(new THREE.HemisphereLight(0xffeffc, 0x514257, 2.1));
    const key = new THREE.DirectionalLight(0xfff7f0, 4.4); key.position.set(-4, 7, 8); scene.add(key);
    const rim = new THREE.PointLight(0xf3b6d2, 125, 42, 2); rim.position.set(4, 2, 5); scene.add(rim);
    const fill = new THREE.PointLight(0xc9a1ee, 90, 50, 2); fill.position.set(-5, .5, 1); scene.add(fill);
    const chapters = [];
    const addChapter = (group, index) => { group.position.z = -12 * index; scene.add(group); chapters.push(group); };

    // A single light ribbon runs through all seven environments, giving the camera a visual thread to follow.
    const routePoints = Array.from({ length: 29 }, (_, index) => {
      const u = index / 28;
      const z = 2 - u * 84;
      const x = Math.sin(u * Math.PI * 7) * 4.15 + Math.sin(u * Math.PI * 14) * .28;
      const y = Math.sin(u * Math.PI * 5.5 + .35) * 1.45 + Math.cos(u * Math.PI * 11) * .22;
      return new THREE.Vector3(x, y, z);
    });
    const routeCurve = new THREE.CatmullRomCurve3(routePoints, false, "catmullrom", .28);
    const routeGeometry = new THREE.TubeGeometry(routeCurve, 700, .035, 10, false);
    const routeRibbon = new THREE.Mesh(routeGeometry, new THREE.MeshBasicMaterial({ color: 0xf7a8b8, transparent: true, opacity: .24, depthWrite: false }));
    scene.add(routeRibbon);
    const routeCore = new THREE.Mesh(new THREE.SphereGeometry(.085, 24, 20), new THREE.MeshBasicMaterial({ color: 0xfff8ff, blending: THREE.AdditiveBlending }));
    const routeGlow = new THREE.Mesh(new THREE.SphereGeometry(.24, 24, 20), new THREE.MeshBasicMaterial({ color: 0xcaabe5, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false }));
    const routeLight = new THREE.PointLight(0xf7a8b8, 6, 7, 2);
    scene.add(routeCore, routeGlow, routeLight);

    // 00 · Arrival: layered portals lead into the portfolio.
    const arrival = new THREE.Group();
    [3.5, 2.85, 2.15].forEach((radius, index) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .025 + index * .009, 12, 160), new THREE.MeshPhysicalMaterial({ color: index === 1 ? 0xf7a8b8 : 0xe9d9f2, metalness: .4, roughness: .16, emissive: 0x9f75bf, emissiveIntensity: .18, transparent: true, opacity: .8 })); ring.position.z = -2 - index * .25; arrival.add(ring); });
    const arrivalOrb = glassOrb(.46, 0xf7d9e6); arrivalOrb.position.set(0, 0, -1.25); arrival.add(arrivalOrb);
    addChapter(arrival, 0);

    // 01 · Vision: a data constellation and calibrated measurement rings.
    const vision = new THREE.Group();
    const central = glassOrb(1.12, 0xcaabe5); central.position.set(.2, .15, -1.5); vision.add(central);
    [2, 2.7, 3.4].forEach((radius, i) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .018, 8, 150), new THREE.MeshStandardMaterial({ color: i === 1 ? 0xf7a8b8 : 0x9f75bf, metalness: .8, roughness: .25, emissive: 0x9f75bf, emissiveIntensity: .25 })); ring.rotation.set(.4 + i * .28, .4, i * .55); ring.position.z = -1.5; vision.add(ring); });
    for (let i = 0; i < 7; i++) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .5 + (i % 3) * .35, 16), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xcaabe5 : 0xf7a8b8, metalness: .45, roughness: .22, emissive: 0x7b4aa5, emissiveIntensity: .12 })); const angle = (i / 7) * Math.PI * 2; bar.position.set(Math.cos(angle) * 3.5, -1.45 + ((i % 2) * .16), -1.2 + Math.sin(angle) * .55); vision.add(bar); }
    addChapter(vision, 1);

    // 02 · Grassia: this is the only chapter with a perfume bottle.
    const grassia = new THREE.Group();
    const bottle = roundedBottle(); bottle.position.set(.35, -.22, .3); bottle.scale.setScalar(.92); grassia.add(bottle);
    const bottleMini = roundedBottle(0xe3c5ec); bottleMini.position.set(3.15, -1.1, -2); bottleMini.scale.setScalar(.43); bottleMini.rotation.z = -.18; grassia.add(bottleMini);
    const scentOrbit = new THREE.Mesh(new THREE.TorusGeometry(2.6, .014, 8, 160), new THREE.MeshBasicMaterial({ color: 0xf7a8b8, transparent: true, opacity: .8 })); scentOrbit.rotation.set(.7, .3, .05); scentOrbit.position.z = -1.2; grassia.add(scentOrbit);
    const scentOrbitTwo = scentOrbit.clone(); scentOrbitTwo.scale.set(1.25, .82, 1); scentOrbitTwo.rotation.set(-.5, .6, -.4); grassia.add(scentOrbitTwo);
    addChapter(grassia, 2);

    // 03 · Career path: a sculpted metal timeline with three floating milestones.
    const timeline = new THREE.Group();
    const path = new THREE.CatmullRomCurve3([new THREE.Vector3(-4,-1.1,0),new THREE.Vector3(-2.2,.65,-.5),new THREE.Vector3(0,-.35,-1.2),new THREE.Vector3(2,.95,-1.7),new THREE.Vector3(4,-.25,-2.3)]);
    timeline.add(new THREE.Mesh(new THREE.TubeGeometry(path, 100, .025, 10, false), new THREE.MeshStandardMaterial({ color: 0xd9bce6, metalness: .75, roughness: .24, emissive: 0x7b4aa5, emissiveIntensity: .22 })));
    const milestoneCards = [];
    [[-2.3,.58,"EDD IUM","SEO & SEA"],[.2,-.38,"DIGITAL BUNDLE","MARKETING"],[2.7,.72,"XALBOX","DEVELOPMENT"]].forEach(([x,y,title,sub],i) => { const orb = glassOrb(.22, i === 1 ? 0xf7a8b8 : 0xcaabe5); orb.position.set(x,y,-1.3-i*.35); timeline.add(orb); const card = chapterCard(title,sub); card.position.set(x + (i===2?1:-1), y + (i===1?1.4:1.05), -1.5-i*.35); card.rotation.y = i === 2 ? -.22 : .2; card.scale.setScalar(.38); timeline.add(card); milestoneCards.push(card); });
    addChapter(timeline, 3);

    // 04 · Selected projects: a night gallery in an alpine landscape.
    const projects = new THREE.Group();
    const mountain = new THREE.Group(); mountain.add(makeRidge(1.7,"#705b7e",-10,2.1),makeRidge(3.4,"#4b4058",-5,2.6),makeRidge(5.2,"#322d3e",0,2.25)); mountain.position.y=-3.7; projects.add(mountain);
    const projectCards = [[-3.4,.1,"SEO","VISIBILITÉ"],[0,.55,"KIDSOLUTION","CONTENU"],[3.35,.05,"XALBOX","PLATEFORME"]].map(([x,y,title,label],i)=>{const card=chapterCard(title,label,i===1?"#c07599":"#7b4aa5");card.position.set(x,y,-1.6-i*.3);card.rotation.y=(i-1)*-.13;card.rotation.x=-.07;projects.add(card);return card;});
    addChapter(projects, 4);

    // 05 · Skills and education: suspended glass prisms and data columns.
    const toolkit = new THREE.Group();
    const columnMaterials = [0xcaabe5,0x9f75bf,0xf7a8b8,0x7b4aa5,0xe4cdec,0xbd91cf];
    for(let i=0;i<9;i++){const angle=i/9*Math.PI*2;const h=.7+(i%4)*.44;const prism=new THREE.Mesh(new THREE.OctahedronGeometry(.37+(i%3)*.1,1),new THREE.MeshPhysicalMaterial({color:columnMaterials[i%columnMaterials.length],metalness:.27,roughness:.2,transmission:.28,clearcoat:1,emissive:columnMaterials[i%columnMaterials.length],emissiveIntensity:.14}));prism.position.set(Math.cos(angle)*3.2,Math.sin(angle)*1.55,-1.5+Math.sin(angle)*.6);prism.scale.y=h;toolkit.add(prism);const stem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,h*1.3,8),new THREE.MeshStandardMaterial({color:0xe9d7f0,metalness:.6,roughness:.24}));stem.position.set(prism.position.x,prism.position.y-h*.62,prism.position.z);toolkit.add(stem);}
    const toolCore=glassOrb(.9,0xe7d4ee);toolCore.position.set(0,.1,-1.4);toolkit.add(toolCore);
    const skillRing=new THREE.Mesh(new THREE.TorusGeometry(2.1,.02,10,120),new THREE.MeshStandardMaterial({color:0xf7a8b8,metalness:.65,roughness:.22,emissive:0xc07599,emissiveIntensity:.18}));skillRing.rotation.x=.8;skillRing.position.z=-1.4;toolkit.add(skillRing);
    addChapter(toolkit,5);

    // 06 · Contact: an open portal, with a quiet star field beyond it.
    const contact = new THREE.Group();
    const portalRings=[];
    [4.1,3.3,2.48,1.74].forEach((radius,i)=>{const torus=new THREE.Mesh(new THREE.TorusGeometry(radius,.035,12,180),new THREE.MeshPhysicalMaterial({color:i%2?0xf7a8b8:0xe5caef,metalness:.5,roughness:.15,emissive:i%2?0xb46d91:0x7b4aa5,emissiveIntensity:.24,transparent:true,opacity:.86}));torus.position.z=-2-i*.3;torus.rotation.y=i*.08;contact.add(torus);portalRings.push(torus);});
    const portalCore=glassOrb(.74,0xf8e5f0);portalCore.position.set(0,0,-1.6);contact.add(portalCore);
    addChapter(contact,6);

    const starCount = isMobile ? 700 : 2000;
    const starPositions = new Float32Array(starCount * 3);
    for(let i=0;i<starCount;i++){starPositions[i*3]=(Math.random()-.5)*65;starPositions[i*3+1]=(Math.random()-.5)*36;starPositions[i*3+2]=-Math.random()*94-6;}
    const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute("position",new THREE.BufferAttribute(starPositions,3));
    const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xfff5ff,size:.05,transparent:true,opacity:.62,sizeAttenuation:true}));scene.add(stars);
    const dustCount=isMobile?450:1600;
    const dustPositions=new Float32Array(dustCount*3);
    for(let i=0;i<dustCount;i++){dustPositions[i*3]=(Math.random()-.5)*20;dustPositions[i*3+1]=(Math.random()-.5)*13;dustPositions[i*3+2]=(Math.random()-.5)*90-3;}
    const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute("position",new THREE.BufferAttribute(dustPositions,3));
    const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xffefff,size:.035,transparent:true,opacity:.6,sizeAttenuation:true}));scene.add(dust);

    const state={progress:0};
    const trigger=ScrollTrigger.create({trigger:document.querySelector(".journey"),start:"top top",end:"bottom bottom",scrub:1,onUpdate:self=>{state.progress=self.progress;onProgress(self.progress);}});
    const clock=new THREE.Clock();let raf=0;
    const smooth=(a,b,x)=>{const v=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return v*v*(3-2*v);};
    const render=()=>{
      const t=clock.getElapsedTime(),p=state.progress,travel=p*7;
      const stage=Math.min(6,Math.floor(travel));
      grassia.visible=stage===2;
      const ambientMotion=prefersReducedMotion?0:1;
      sky.material.uniforms.uTime.value=t*ambientMotion;sky.material.uniforms.uMood.value=smooth(3.2,5.9,travel);
      const targetZ=10-travel*12;
      const sway=Math.sin(travel*Math.PI*.52)*1.15;
      const cameraEase=prefersReducedMotion?.18:.065;
      camera.position.x+=((prefersReducedMotion?0:sway)-camera.position.x)*cameraEase;
      camera.position.y+=((Math.sin(t*.18)*.08*ambientMotion+Math.sin(travel*.9)*.36)-camera.position.y)*(prefersReducedMotion?.18:.06);
      camera.position.z+=(targetZ-camera.position.z)*(prefersReducedMotion?.18:.075);
      const targetX=(prefersReducedMotion?0:sway*.34)+Math.sin(travel*.65)*.18*(prefersReducedMotion?.35:1);
      const targetY=Math.sin(travel*.9)*.22*(prefersReducedMotion?.35:1);
      camera.lookAt(targetX,targetY,targetZ-8.5);
      camera.rotation.z+=((Math.sin(travel*.8)*.012*ambientMotion)-camera.rotation.z)*(prefersReducedMotion?.18:.05);
      const routePosition=routeCurve.getPointAt(THREE.MathUtils.clamp(p*.985+.01,0,1));
      routeCore.position.copy(routePosition);
      routeGlow.position.copy(routePosition);
      routeGlow.scale.setScalar(1+Math.sin(t*2.2)*.1*ambientMotion);
      routeLight.position.copy(routePosition);
      const local=travel-stage;
      const activeChapter=chapters[stage];
      activeChapter.rotation.y=Math.sin(t*.19+stage)*.025*ambientMotion;
      activeChapter.rotation.x=Math.sin(t*.16+stage)*.013*ambientMotion;
      bottle.rotation.y=Math.sin(t*.25)*.15*ambientMotion+Math.sin(local*Math.PI)*.12;
      bottle.rotation.z=Math.sin(t*.28)*.025*ambientMotion;
      bottleMini.rotation.y=-.34+Math.sin(t*.33+1)*.08*ambientMotion;
      scentOrbit.rotation.z=t*.07*ambientMotion;scentOrbitTwo.rotation.z=-t*.045*ambientMotion;
      central.rotation.y=t*.12*ambientMotion;central.rotation.x=Math.sin(t*.2)*.07*ambientMotion;
      vision.children.slice(1).forEach((child,i)=>{child.rotation.z+=(.12+((i%2)*-.24))*0.0015*ambientMotion;});
      milestoneCards.forEach((card,i)=>{card.rotation.z=Math.sin(t*.25+i)*.012*ambientMotion;});
      projectCards.forEach((card,i)=>{card.position.y=(i===1?.55:.08)+Math.sin(t*.38+i*1.7)*.08*ambientMotion;});
      toolkit.children.forEach((child,i)=>{if(i>0){child.rotation.y=t*.12*ambientMotion+(i*.08);child.rotation.z=Math.sin(t*.32+i)*.08*ambientMotion;}});
      const portalOpen=smooth(5.72,6.12,travel);
      portalCore.scale.setScalar(.95+Math.sin(t*.65)*.035*ambientMotion+portalOpen*.72);
      portalRings.forEach((ring,i)=>ring.scale.setScalar(.78+portalOpen*.22+Math.sin(t*.45+i)*.012*ambientMotion));
      rim.position.set(4+Math.sin(travel*.8)*2,2+Math.cos(t*.35),camera.position.z-3);
      fill.position.set(-5+Math.cos(travel*.65),.5,camera.position.z-5);
      stars.rotation.y=t*.002*ambientMotion;dust.rotation.y=t*.006*ambientMotion;
      renderer.render(scene,camera);raf=requestAnimationFrame(render);
    };
    render();
    const resize=()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight,false);ScrollTrigger.refresh();};
    window.addEventListener("resize",resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);trigger.kill();renderer.dispose();scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material){for(const material of Array.isArray(obj.material)?obj.material:[obj.material])material.dispose();}});};
  },[onProgress]);
  return <canvas ref={canvasRef} className="three-canvas" aria-label="Parcours immersif en scènes tridimensionnelles" />;
}

const experiences = [
  { year: "2026", title: "Stagiaire SEO & SEA", place: "Eddium · Février — mai 2026", text: "Audits SEO techniques, on-page et off-page. Recherche de mots-clés, analyse concurrentielle, optimisation des contenus et suivi des performances via Google Analytics et Google Search Console. Participation à la création et à l’optimisation de campagnes Google Ads." },
  { year: "2025", title: "Stagiaire en marketing digital", place: "Digital Bundle · Juin — août 2025", text: "Audit SEO pour l’agence et le site de la Tunisia Investment Authority, création de contenus sociaux et plannings éditoriaux. Contribution au relancement de KidSolution : présentation, script vidéo, contenus promotionnels, prospection téléphonique et test de l’application." },
  { year: "2023", title: "Stage de fin d’études · Développement web", place: "Xalbox · Février — avril 2023", text: "Développement d’une plateforme de réclamation client avec PocketBase, TypeScript, Node.js et SvelteKit. Analyse des besoins, fonctionnalités dynamiques et intégration front-end / back-end." }
];

function App() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const [night, setNight] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const dialogCloseRef = useRef(null);
  const lastProjectTrigger = useRef(null);
  const journeyRef = useRef(null);
  const scrollHandler = React.useCallback(value => {
    setProgress(value);
    setActive(Math.min(6, Math.floor(Math.min(.99999, value) * 7)));
  }, []);
  const goToStep = step => {
    const journey = journeyRef.current;
    if (!journey) return;
    const top = window.scrollY + journey.getBoundingClientRect().top + step * window.innerHeight;
    window.scrollTo({ top, behavior: "smooth" });
  };
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, []);
  useEffect(() => {
    if (!selectedProject) return undefined;
    dialogCloseRef.current?.focus();
    const onKeyDown = event => {
      if (event.key === "Escape") setSelectedProject(null);
      if (event.key === "Tab") {
        const dialog = document.querySelector(".project-dialog");
        const focusable = [...dialog.querySelectorAll("button, a[href]")];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      requestAnimationFrame(() => lastProjectTrigger.current?.focus());
    };
  }, [selectedProject]);
  const openProject = (event, project) => {
    lastProjectTrigger.current = event.currentTarget;
    setSelectedProject(project);
  };
  const projectsInfo = [
    { key: "seo", name: "Visibilité organique", category: "SEO · AUDIT & OPTIMISATION", role: "Stagiaire SEO & SEA · Eddium", detail: "Audits SEO techniques, on-page et off-page, recherche de mots-clés, analyse concurrentielle et optimisation de contenus. Le travail inclut le suivi via Google Analytics et Google Search Console, ainsi que la participation aux campagnes Google Ads.", tools: "SEO · Google Analytics · Search Console · Google Ads" },
    { key: "kidsolution", name: "KidSolution", category: "CONTENU · LANCEMENT", role: "Stagiaire marketing digital · Digital Bundle", detail: "Contribution au relancement de l’application : présentation du produit, script vidéo, contenus promotionnels, prospection téléphonique auprès des garderies et test fonctionnel de l’application.", tools: "Stratégie de contenu · Réseaux sociaux · Test fonctionnel" },
    { key: "xalbox", name: "Plateforme Xalbox", category: "DÉVELOPPEMENT · PRODUIT DIGITAL", role: "Stage de fin d’études · Xalbox", detail: "Développement d’une plateforme de réclamation client, depuis l’analyse des besoins jusqu’à l’intégration front-end et back-end, avec des fonctionnalités dynamiques.", tools: "PocketBase · TypeScript · Node.js · SvelteKit" }
  ];
  const chapterNames = ["Accueil", "Vision", "Grassia", "Parcours", "Projets", "Expertises", "Contact"];
  const chapters = [
    <section className="feature-panel hero-panel" id="accueil"><div className="hero-copy panel-copy"><p className="eyebrow">MARKETING DIGITAL · SEO · E-COMMERCE</p><p className="hero-hello">Bonjour, je suis</p><h1>Feryel<br /><em>Fourati</em></h1><p className="hero-descriptor">Stratégie, visibilité et expériences de marque.</p><button className="scroll-prompt" onClick={() => goToStep(1)}><span className="scroll-circle">↓</span> ENTRER DANS MON UNIVERS</button></div><div className="hero-aside">PARIS, FRANCE<br />PORTFOLIO · 2026</div><span className="scene-kicker">UN PARCOURS EN SEPT CHAPITRES</span></section>,
    <section className="feature-panel vision-panel" id="vision"><div className="panel-copy vision-copy"><p className="eyebrow">01 · MA VISION</p><h2>Le digital,<br />avec <em>justesse.</em></h2><p className="wide-copy">En Master Marketing Digital, après une Licence en Informatique de Gestion, spécialité Business Intelligence, je me spécialise en SEO et en acquisition digitale. Je relie stratégie marketing, analyse de données et compréhension technique du web pour faire émerger les marques avec sens.</p><div className="scroll-caption">UNE CURIOSITÉ QUI SE TRANSFORME EN MOUVEMENT <span>↓</span></div></div><span className="scene-kicker">01 / VISION</span></section>,
    <section className="feature-panel grassia-panel"><div className="glass-card"><div className="glass-card-top"><span>02 · EXPÉRIENCE ACTUELLE</span><span>2026 — PRÉSENT</span></div><div className="glass-card-body"><div className="grassia-mark">G<span>✳</span></div><div><p className="eyebrow">HAUTE PARFUMERIE DE NICHE</p><h2>Responsable Marketing Digital<br />&amp; Store Manager</h2><p className="company-name">Grassia · Paris</p></div></div><div className="grassia-details"><p>Pilotage des actions de marketing digital et de visibilité en ligne d’une enseigne spécialisée dans la haute parfumerie et les parfums de niche.</p><p>Gestion et mise à jour du site e-commerce : fiches produits, informations sur les fragrances, prix et valorisation des marques.</p><p>Suivi du trafic et analyse des performances digitales à l’aide de Google Analytics 4 (GA4).</p><p>Préparation et suivi des actions de communication digitale sur Instagram et Meta, en cohérence avec le positionnement premium de la marque.</p><p>Gestion opérationnelle de la boutique : accueil, conseil client, présentation des parfums et valorisation de l’expérience client.</p><p>Suivi de la présentation des produits, du merchandising et des stocks.</p></div><div className="glass-card-tags"><span>GA4</span><span>E-COMMERCE</span><span>INSTAGRAM &amp; META</span><span>MERCHANDISING</span><span>EXPÉRIENCE CLIENT</span></div></div><div className="chapter-label">L’ART DE LA PRÉSENCE <span>✳</span></div><span className="scene-kicker">02 / GRASSIA · HAUTE PARFUMERIE</span></section>,
    <section className="feature-panel timeline-panel" id="parcours"><div className="panel-copy timeline-copy"><p className="eyebrow">03 · EXPÉRIENCE</p><h2>Un parcours<br />qui <em>prend forme.</em></h2><div className="timeline-list">{experiences.map((item, index) => <article className="timeline-row" key={item.year}><span className="timeline-index">{item.year}</span><span className="timeline-track"><i /></span><div><span className="eyebrow">0{index + 1} / EXPÉRIENCE</span><h3>{item.title}</h3><p className="timeline-place">{item.place}</p><p className="timeline-text">{item.text}</p></div></article>)}</div></div><span className="scene-kicker">03 / PARCOURS</span></section>,
    <section className="feature-panel projects-panel" id="projets"><div className="panel-copy projects-copy"><p className="eyebrow">04 · PROJETS</p><h2>Faire émerger<br />les <em>bonnes idées.</em></h2><div className="project-strip"><article><span>01 / SEO</span><h3>Visibilité organique</h3><p>Audits, optimisation de contenus et suivi de visibilité sur plusieurs projets digitaux.</p><button className="project-open" onClick={event => openProject(event, projectsInfo[0])}>EXPLORER LE PROJET <span>↗</span></button></article><article><span>02 / SOCIAL</span><h3>KidSolution</h3><p>Contenus de relancement, script vidéo, prospection et test fonctionnel de l’application.</p><button className="project-open" onClick={event => openProject(event, projectsInfo[1])}>EXPLORER LE PROJET <span>↗</span></button></article><article><span>03 / DIGITAL</span><h3>Plateforme Xalbox</h3><p>Une plateforme de réclamation client pensée et développée pendant le stage de fin d’études.</p><button className="project-open" onClick={event => openProject(event, projectsInfo[2])}>EXPLORER LE PROJET <span>↗</span></button></article></div><p className="landscape-note">STRATÉGIE · CONTENU · ANALYSE · EXPÉRIENCE</p></div><span className="scene-kicker">04 / PROJETS</span></section>,
    <section className="feature-panel toolkit-panel"><div className="panel-copy toolkit-copy"><p className="eyebrow">05 · OUTILS &amp; FORMATION</p><h2>Relier les<br /><em>disciplines.</em></h2><div className="toolkit-grid"><div><span>01</span><h3>Acquisition &amp; analyse</h3><p>Google Ads · Meta Ads · SEO · SEA · GA4 · Google Search Console · Analyse concurrentielle</p></div><div><span>02</span><h3>Contenu &amp; création</h3><p>Gestion de contenu · Planning éditorial · E-mail marketing · Canva · Photoshop · WordPress</p></div><div><span>03</span><h3>Web &amp; données</h3><p>HTML · TypeScript · Node.js · SvelteKit · Excel · Power BI</p></div></div><div className="education-strip"><div><span>2024 — EN COURS</span><strong>Master en Marketing Digital</strong><small>IT Business School</small></div><div><span>2021 — 2024</span><strong>Licence en Informatique de Gestion</strong><small>Spécialité Business Intelligence · ISIG Kairouan</small></div><div><span>2025</span><strong>Google Digital Marketing &amp; E-commerce</strong><small>Certification · Coursera</small></div><div><span>LANGUES</span><strong>Arabe · Français · Anglais</strong><small>Natif · Courant · Courant</small></div></div></div><span className="scene-kicker">05 / OUTILS &amp; FORMATION</span></section>,
    <section className="feature-panel contact-panel" id="contact"><div className="panel-copy contact-copy"><p className="eyebrow">06 · CONTINUONS LA CONVERSATION</p><h2>Écrivons<br /><em>la suite.</em></h2><a className="contact-email" href="mailto:feryelfourati33@gmail.com">feryelfourati33@gmail.com <span>↗</span></a><p className="contact-phone"><a href="tel:+21656109779">+216 56 109 779</a> <span>·</span> Paris, France</p><a className="cv-button" href="/assets/CV-Feryel-Fourati.pdf" download>TÉLÉCHARGER LE CV <span>↓</span></a></div><div className="footer-meta"><span>© 2026 FERYEL FOURATI</span><span>UNE HISTOIRE EN MOUVEMENT <b>✳</b></span></div><span className="scene-kicker">06 / CONTACT</span></section>
  ];
  return <div className={`app-shell ${night ? "night-mode" : ""}`}>
    <div className="frame" aria-hidden="true" />
    <div className="reading-progress" style={{ transform: `scaleX(${progress})` }} />
    <ThreeWalkthrough onProgress={scrollHandler} />
    <header className="topbar"><button className="monogram" onClick={() => goToStep(0)}>FF<span>✳</span></button><nav><button onClick={() => goToStep(3)}>Parcours</button><button onClick={() => goToStep(4)}>Projets</button><button onClick={() => goToStep(6)}>Contact</button></nav><button className="theme-button" onClick={() => setNight(!night)} aria-label="Changer le thème">{night ? "☾" : "☼"}</button></header>
    <main className="journey" ref={journeyRef}>
      <div className="walkthrough-screen">
        <div className="feature-stack">{chapters.map((chapter, index) => <div className={`feature-frame ${active === index ? "active" : ""}`} aria-hidden={active !== index} key={index}>{chapter}</div>)}</div>
        <aside className="chapter-index" aria-label="Navigation du parcours">{chapters.map((_, index) => <button key={index} className={active === index ? "active" : ""} onClick={() => goToStep(index)} aria-label={`Aller au chapitre ${chapterNames[index]}`} aria-current={active === index ? "step" : undefined}><span>0{index}</span><b>{chapterNames[index]}</b></button>)}</aside>
        <div className="walkthrough-hint"><span>SCROLL</span><i /></div>
        {selectedProject && <div className="project-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedProject(null); }}><section className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" aria-describedby="project-dialog-description"><button className="dialog-close" ref={dialogCloseRef} onClick={() => setSelectedProject(null)} aria-label="Fermer le projet">×</button><p className="eyebrow">{selectedProject.category}</p><h2 id="project-dialog-title">{selectedProject.name}</h2><p className="dialog-role">{selectedProject.role}</p><p id="project-dialog-description">{selectedProject.detail}</p><div className="dialog-tools"><span>CONTRIBUTIONS &amp; OUTILS</span><p>{selectedProject.tools}</p></div><button className="dialog-return" onClick={() => setSelectedProject(null)}>RETOURNER AUX PROJETS <span>↗</span></button></section></div>}
      </div>
    </main>
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
