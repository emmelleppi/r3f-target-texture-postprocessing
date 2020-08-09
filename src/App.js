import * as THREE from "three";
import React, { useMemo, useEffect, useState, Suspense } from "react";
import { createPortal, useFrame, useThree, useLoader } from "react-three-fiber";
import { Plane, useTextureLoader } from "drei";
import {
  EffectComposer,
  EffectPass,
  SavePass,
  RenderPass,
  VignetteEffect,
  BloomEffect,
  SMAAImageLoader,
  DepthOfFieldEffect,
  GlitchEffect,
  BlendFunction,
  NoiseEffect,
  ChromaticAberrationEffect,
  SMAAEffect,
  NormalPass,
  KernelSize,
} from "postprocessing";
import COLOR from "nice-color-palettes";

import Tv from "./components/Tv";
import InTheTv from "./components/InTheTv";
import Room from "./components/Room";

import "./styles.css";

const COLOR_INDEX = 45;

function Environment() {
  const { gl, scene } = useThree();
  const envMapTexture = useTextureLoader("/env.jpeg");
  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl);
    generator.compileEquirectangularShader();
    const hdrCubeRenderTarget = generator.fromCubemap(envMapTexture);
    envMapTexture.dispose();
    generator.dispose();
    scene.environment = hdrCubeRenderTarget.texture;
    return () => (scene.environment = scene.background = null);
  }, [envMapTexture, gl, scene.background, scene.environment]);
  return null;
}

const TELEVISIONS = [
  {
    position: [-9.5, -0.3, 1],
    scale: [0.9, 0.9, 0.9],
  },
  {
    position: [0, 0, 0],
    scale: [1, 1, 1],
  },
  {
    position: [11, 0.4, 0.5],
    scale: [1.2, 1.2, 1.2],
  },
  {
    position: [-6, 8, 0],
    scale: [1.4, 1.4, 1.4],
    rotation: [0, 0, Math.PI / 32],
  },
  {
    position: [12, 7.2, 0],
    scale: [0.9, 0.9, 0.9],
    rotation: [0, -Math.PI / 10, 0],
  },
  {
    position: [12, 14, -1],
    scale: [1.1, 1.1, 1.1],
    rotation: [0, Math.PI / 6, 0],
  },
];

function Televisions(props) {
  const targetCamera = useMemo(() => new THREE.PerspectiveCamera(), []);
  const targetScene = useMemo(() => new THREE.Scene(), []);

  const smaa = useLoader(SMAAImageLoader);
  const perturbationMap = useTextureLoader("/perturb.jpg");

  const { gl, scene, size, camera } = useThree();

  const [composer, savePass] = useMemo(() => {
    const composer = new EffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType,
    });

    const renderPass = new RenderPass(scene, camera);
    const targetRenderPass = new RenderPass(targetScene, targetCamera);
    const normalPass = new NormalPass(scene, camera);

    const SMAA = new SMAAEffect(...smaa);
    SMAA.colorEdgesMaterial.setEdgeDetectionThreshold(0.1);

    const BLOOM = new BloomEffect({
      opacity: 1,
      blendFunction: BlendFunction.SCREEN,
      kernelSize: KernelSize.LARGE,
      luminanceThreshold: 0.8,
      luminanceSmoothing: 0.2,
      height: 300,
    });

    const DEPTH_OF_FIELD = new DepthOfFieldEffect(camera, {
      focusDistance: 0,
      focalLength: 10,
      bokehScale: 1,
    });

    const CHROMATIC_ABERRATION = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.005, 0.005),
    });

    const GLITCH = new GlitchEffect({
      perturbationMap,
      chromaticAberrationOffset: CHROMATIC_ABERRATION.offset,
    });

    const NOISE = new NoiseEffect({
      blendFunction: BlendFunction.COLOR_DODGE,
    });
    NOISE.blendMode.opacity.value = 0.1;

    const VIGNETTE = new VignetteEffect({
      offset: 0.5,
      darkness: 0.8,
    });

    const smaaEffect = new EffectPass(targetCamera, SMAA);
    const glitchPass = new EffectPass(targetCamera, GLITCH, NOISE);
    const chromaticAberrationPass = new EffectPass(
      targetCamera,
      CHROMATIC_ABERRATION
    );
    const targetEffectPass = new EffectPass(targetCamera, VIGNETTE);
    const effectPass = new EffectPass(
      camera,
      SMAA,
      BLOOM,
      DEPTH_OF_FIELD,
      VIGNETTE
    );
    const savePass = new SavePass();

    composer.addPass(targetRenderPass);
    composer.addPass(targetEffectPass);
    composer.addPass(smaaEffect);
    composer.addPass(glitchPass);
    composer.addPass(chromaticAberrationPass);
    composer.addPass(savePass);
    composer.addPass(renderPass);
    composer.addPass(normalPass);
    composer.addPass(effectPass);

    return [composer, savePass];
  }, [camera, gl, perturbationMap, scene, smaa, targetCamera, targetScene]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    targetScene.background = new THREE.Color(0xffffff);
  }, [composer, size, targetScene]);

  useFrame((_, delta) => void composer.render(delta), 1);

  useFrame((state) => {
    targetCamera.position.z = 15 + Math.sin(state.clock.getElapsedTime()) * 10;
  });

  return (
    <>
      {createPortal(<InTheTv />, targetScene)}
      {TELEVISIONS.map((args, index) => (
        <group key={`0${index}`} {...args}>
          <Tv scale={[0.1, 0.1, 0.1]} />
          <Plane args={[8, 6]} position={[-1.4, 0, -1]}>
            <meshStandardMaterial
              attach="material"
              map={savePass.renderTarget.texture}
            />
          </Plane>
        </group>
      ))}
    </>
  );
}

function App() {
  return (
    <>
      <Room position={[0, -4.2, -20]} />
      <group position={[0, 0, 10]}>
        <Televisions />
        <Environment />
      </group>
    </>
  );
}

export default App;
