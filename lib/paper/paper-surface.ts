// Adapted from React Bits Paper Crumple, copyright (c) 2026 David Haz.
// Original simulation, creases, mesh normals and paper shading retained.
// https://reactbits.dev/micro/paper-crumple — license: /public/licenses/react-bits.md
import * as THREE from "three";
import { randomSource } from "./paper-geometry";
import { getPaperPath } from "./paper-path";
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;

export interface PaperSurface {
  render: (fold: number, x?: number, y?: number, tilt?: number, pose?: { scale?: number; rotation?: number }) => void;
  dispose: () => void;
}
export interface PaperSurfaceOptions {
  canvas: HTMLCanvasElement;
  texture: HTMLCanvasElement;
  width: number;
  height: number;
  centerX?: number;
  centerY?: number;
  rotation?: number;
  grip?: { x: number; y: number };
  stock?: string;
  signal?: AbortSignal;
}
export async function createPaperSurface({ canvas, texture: source, width, height, centerX = innerWidth / 2, centerY = innerHeight / 2, rotation = 0, grip, stock = "#f3ebdc", signal }: PaperSurfaceOptions): Promise<PaperSurface> {
  const detail = 48, seed = 7, foldCount = 7, foldSharpness = 0.68, wrinkleDepth = 0.7;
  const roughness = 0.94, paperTexture = 0.04, lightIntensity = 1.8, shadowOpacity = 0.12;
  const paperColor = stock, shadow = true;
    const paperWidth = Math.max(1, finite(width, 320));
    const paperHeight = Math.max(1, finite(height, 400));
    const aspect = paperHeight / paperWidth;
    const shortSide = Math.min(1, aspect);
    const resolution = Math.round(clamp(finite(detail, 64) / 4, 8, 24));
    const columns = Math.max(8, Math.round(resolution / Math.max(1, aspect)));
    const rows = Math.max(8, Math.round(resolution * Math.min(1, aspect)));
    const rng = randomSource(finite(seed, 7));
    const sharpness = clamp(finite(foldSharpness, 0.6), 0, 1);
    const foldTotal = Math.round(clamp(finite(foldCount, 6), 3, 16));
    const depth = clamp(finite(wrinkleDepth, 0.65), 0, 2);
    const count = (columns + 1) * (rows + 1);
    const original = new Float32Array(count * 3);
    const positions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const indices: number[] = [];
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= columns; col++) {
        const index = row * (columns + 1) + col;
        const u = (col + (col > 0 && col < columns ? (rng() - 0.5) * 0.5 : 0)) / columns;
        const v = (row + (row > 0 && row < rows ? (rng() - 0.5) * 0.5 : 0)) / rows;
        const x = u - 0.5,
          y = (v - 0.5) * aspect;
        original[index * 3] = x;
        original[index * 3 + 1] = y;
        uvs[index * 2] = u;
        uvs[index * 2 + 1] = v;
        if (col < columns && row < rows) {
          const a = index,
            b = index + 1,
            c = index + columns + 1,
            d = c + 1;
          if (rng() > 0.5) indices.push(a, b, d, a, d, c);
          else indices.push(a, b, c, b, d, c);
        }
      }
    }
    const paperPath = await getPaperPath(original, indices, shortSide, foldTotal, sharpness, depth, seed);
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    const renderPositions = new Float32Array(indices.length * 3);
    const renderNormals = new Float32Array(indices.length * 3);
    const renderUvs = new Float32Array(indices.length * 2);
    const faceNormals = new Float32Array(indices.length);
    const incidentFaces: number[][] = Array.from({ length: count }, () => []);
    for (let i = 0; i < indices.length; i++) {
      renderUvs[i * 2] = uvs[indices[i] * 2];
      renderUvs[i * 2 + 1] = uvs[indices[i] * 2 + 1];
      incidentFaces[indices[i]].push(Math.floor(i / 3) * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(renderPositions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('normal', new THREE.BufferAttribute(renderNormals, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv', new THREE.BufferAttribute(renderUvs, 2));

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    const grainData = new Uint8Array(128 * 128 * 4);
    for (let i = 0; i < grainData.length; i += 4) {
      const value = 100 + Math.floor(rng() * 155);
      grainData[i] = grainData[i + 1] = grainData[i + 2] = value;
      grainData[i + 3] = 255;
    }
    const grain = new THREE.DataTexture(grainData, 128, 128);
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
    grain.repeat.set(5, 5 * aspect);
    grain.magFilter = THREE.LinearFilter;
    grain.minFilter = THREE.LinearFilter;
    grain.needsUpdate = true;
    const materialOptions = {
      roughness: clamp(finite(roughness, 0.92), 0, 1),
      metalness: 0,
      bumpMap: grain,
      bumpScale: clamp(finite(paperTexture, 0.08), 0, 1) * 0.32,
      alphaTest: 0.04,
      alphaToCoverage: true,
      flatShading: false
    };
    const frontMaterial = new THREE.MeshStandardMaterial({ ...materialOptions, side: THREE.FrontSide });
    const backMaterial = new THREE.MeshStandardMaterial({
      ...materialOptions,
      side: THREE.BackSide,
      color: paperColor
    });
    const lighting = { value: 0 };
    for (const material of [frontMaterial, backMaterial]) {
      material.onBeforeCompile = shader => {
        shader.uniforms.paperLighting = lighting;
        shader.fragmentShader = 'uniform float paperLighting;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `
          #include <map_fragment>
          #ifdef USE_MAP
            if (vMapUv.x < 0.0 || vMapUv.x > 1.0 || vMapUv.y < 0.0 || vMapUv.y > 1.0) discard;
            ${material === backMaterial ? 'diffuseColor.rgb = diffuse;' : ''}
          #endif
        `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <opaque_fragment>',
          `
          outgoingLight = mix(diffuseColor.rgb, outgoingLight, paperLighting);
          #include <opaque_fragment>
        `
        );
      };
      material.customProgramCacheKey = () => `paper-${material === backMaterial ? 'stock' : 'print'}`;
    }
    const depthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      alphaTest: 0.04,
      side: THREE.DoubleSide
    });
    depthMaterial.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
        #ifdef USE_MAP
          if (vMapUv.x < 0.0 || vMapUv.x > 1.0 || vMapUv.y < 0.0 || vMapUv.y > 1.0) discard;
        #endif
      `
      );
    };
    const sheet = new THREE.Group();
    const front = new THREE.Mesh(geometry, frontMaterial);
    const back = new THREE.Mesh(geometry, backMaterial);
    front.castShadow = shadow;
    front.receiveShadow = shadow;
    back.receiveShadow = shadow;
    front.customDepthMaterial = depthMaterial;
    sheet.add(front, back);
    const scene = new THREE.Scene();
    scene.add(sheet);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
    const ambient = new THREE.HemisphereLight(0xffffff, 0xa4a0b0, 1.35);
    scene.add(ambient);
    const light = new THREE.DirectionalLight(0xfffaf0, Math.max(0, finite(lightIntensity, 1.8)));
    light.castShadow = shadow;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.bias = -0.0002;
    light.shadow.normalBias = 0.6;
    light.shadow.radius = 3;
    scene.add(light, light.target);
    const floorGeometry = new THREE.PlaneGeometry(1, 1);
    const floorMaterial = new THREE.ShadowMaterial({
      opacity: clamp(finite(shadowOpacity, 0.08), 0, 1),
      depthWrite: false
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.visible = shadow;
    scene.add(floor);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = shadow;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;


    const texture = new THREE.CanvasTexture(source);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    frontMaterial.map = texture;
    backMaterial.map = texture;
    depthMaterial.map = texture;
    const viewportWidth = innerWidth, viewportHeight = innerHeight;
    const scale = paperWidth;
    sheet.scale.setScalar(scale);
    camera.aspect = viewportWidth / viewportHeight;
    camera.position.z = viewportHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(viewportWidth, viewportHeight, false);
    const reach = Math.max(viewportWidth, viewportHeight);
    light.position.set(-reach * 0.5, reach * 0.8, reach * 4);
    light.shadow.camera.left = light.shadow.camera.bottom = -reach;
    light.shadow.camera.right = light.shadow.camera.top = reach;
    light.shadow.camera.far = reach * 6;
    light.shadow.camera.updateProjectionMatrix();
    floor.scale.set(viewportWidth * 4, viewportHeight * 4, 1);
    let previousAmount = -1;
    let disposed = false;
    function deform(fold: number) {
      if (fold === previousAmount) return;
      previousAmount = fold;
      const frame = fold * (paperPath.samples.length - 1);
      const lower = Math.floor(frame);
      const upper = Math.min(lower + 1, paperPath.samples.length - 1);
      const mix = frame - lower;
      const from = paperPath.samples[lower];
      const to = paperPath.samples[upper];
      for (let i = 0; i < positions.length; i++) {
        positions[i] = from[i] + (to[i] - from[i]) * mix;
      }
      for (let face = 0; face < indices.length; face += 3) {
        const a = indices[face] * 3,
          b = indices[face + 1] * 3,
          c = indices[face + 2] * 3;
        const bx = positions[b] - positions[a],
          by = positions[b + 1] - positions[a + 1],
          bz = positions[b + 2] - positions[a + 2];
        const cx = positions[c] - positions[a],
          cy = positions[c + 1] - positions[a + 1],
          cz = positions[c + 2] - positions[a + 2];
        const nx = by * cz - bz * cy,
          ny = bz * cx - bx * cz,
          nz = bx * cy - by * cx;
        const length = Math.hypot(nx, ny, nz) || 1;
        faceNormals[face] = nx / length;
        faceNormals[face + 1] = ny / length;
        faceNormals[face + 2] = nz / length;
      }
      for (let i = 0; i < indices.length; i++) {
        const source = indices[i] * 3;
        const face = Math.floor(i / 3) * 3;
        let nx = 0,
          ny = 0,
          nz = 0;
        for (const neighbor of incidentFaces[indices[i]]) {
          const dot =
            faceNormals[face] * faceNormals[neighbor] +
            faceNormals[face + 1] * faceNormals[neighbor + 1] +
            faceNormals[face + 2] * faceNormals[neighbor + 2];
          const weight = THREE.MathUtils.smoothstep(dot, 0.88 - (1 - sharpness) * 0.18, 0.98);
          nx += faceNormals[neighbor] * weight;
          ny += faceNormals[neighbor + 1] * weight;
          nz += faceNormals[neighbor + 2] * weight;
        }
        const length = Math.hypot(nx, ny, nz) || 1;
        renderPositions[i * 3] = positions[source];
        renderPositions[i * 3 + 1] = positions[source + 1];
        renderPositions[i * 3 + 2] = positions[source + 2];
        renderNormals[i * 3] = nx / length;
        renderNormals[i * 3 + 1] = ny / length;
        renderNormals[i * 3 + 2] = nz / length;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.normal.needsUpdate = true;
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      lighting.value = THREE.MathUtils.smoothstep(fold, 0, 0.4);
    }


    // Preserve the point the visitor actually grabbed as the paper contracts.
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    const weights = new THREE.Vector3(), anchor = new THREE.Vector3(), point = new THREE.Vector3();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), world = new THREE.Vector3();
    let gripFace: THREE.Face | undefined;
    if (grip) {
      deform(0);
      sheet.position.set(centerX - viewportWidth / 2, viewportHeight / 2 - centerY, 0);
      sheet.rotation.z = -THREE.MathUtils.degToRad(rotation);
      sheet.updateMatrixWorld(true); camera.updateMatrixWorld(true);
      pointer.set(grip.x / viewportWidth * 2 - 1, 1 - grip.y / viewportHeight * 2);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([front, back], false)[0];
      if (hit?.face) {
        gripFace = hit.face;
        const attribute = geometry.attributes.position;
        THREE.Triangle.getBarycoord(sheet.worldToLocal(hit.point.clone()),
          new THREE.Vector3().fromBufferAttribute(attribute, gripFace.a),
          new THREE.Vector3().fromBufferAttribute(attribute, gripFace.b),
          new THREE.Vector3().fromBufferAttribute(attribute, gripFace.c), weights);
      }
    }
    return {
      render(fold, x = 0, y = 0, tilt = 0, pose = {}) {
        if (disposed) return;
        deform(clamp(fold, 0, 1));
        const frameScale = scale * Math.max(0.01, finite(pose.scale ?? 1, 1));
        sheet.scale.setScalar(frameScale);
        sheet.position.set(centerX - viewportWidth / 2 + x, viewportHeight / 2 - centerY - y, 0);
        sheet.rotation.set(THREE.MathUtils.degToRad(tilt * 0.35), THREE.MathUtils.degToRad(tilt), -THREE.MathUtils.degToRad(rotation + (pose.rotation ?? 0)));
        if (grip && gripFace) {
          anchor.set(0, 0, 0);
          [gripFace.a, gripFace.b, gripFace.c].forEach((index, i) => {
            point.fromBufferAttribute(geometry.attributes.position, index);
            anchor.addScaledVector(point, weights.getComponent(i));
          });
          anchor.multiplyScalar(frameScale).applyEuler(sheet.rotation);
          pointer.set((grip.x + x) / viewportWidth * 2 - 1, 1 - (grip.y + y) / viewportHeight * 2);
          raycaster.setFromCamera(pointer, camera); plane.constant = -anchor.z;
          if (raycaster.ray.intersectPlane(plane, world)) sheet.position.set(world.x - anchor.x, world.y - anchor.y, 0);
        }
        sheet.updateMatrixWorld(true);
        const bounds = geometry.boundingBox;
        floor.position.z = (bounds?.min.z ?? 0) * frameScale - frameScale * shortSide * 0.08;
        renderer.render(scene, camera);
        canvas.dataset.fold = fold.toFixed(3);
        canvas.dataset.x = x.toFixed(1);
        canvas.dataset.y = y.toFixed(1);
        canvas.dataset.scale = (frameScale / scale).toFixed(3);
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        geometry.dispose(); floorGeometry.dispose(); frontMaterial.dispose(); backMaterial.dispose();
        depthMaterial.dispose(); floorMaterial.dispose(); grain.dispose(); texture.dispose();
        light.shadow.dispose(); renderer.dispose(); renderer.forceContextLoss();
      },
    };
}
