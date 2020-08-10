import * as THREE from "three";
import React, { useMemo, useEffect } from "react";
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
  SSAOEffect,
  BlurPass,
} from "postprocessing";

import Tv from "./components/Tv";
import InTheTv from "./components/InTheTv";
import Room from "./components/Room";

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
    withScene: true
  },
  {
    position: [0, 0, 0],
    scale: [1, 1, 1],
    withScene: false,
  },
  {
    position: [11, 0.4, 0.5],
    scale: [1.2, 1.2, 1.2],
    withScene: true,
  },
  {
    position: [-6, 8, 0],
    scale: [1.4, 1.4, 1.4],
    withScene: true,
    rotation: [0, 0, Math.PI / 32],
  },
  {
    position: [12, 7.2, 0],
    scale: [0.9, 0.9, 0.9],
    withScene: true,
    rotation: [0, -Math.PI / 10, 0],
  },
  {
    position: [12, 14, -1],
    scale: [1.1, 1.1, 1.1],
    withScene: false,
    rotation: [0, Math.PI / 6, 0],
  },
];

function Scene() {
  const smaa = useLoader(SMAAImageLoader);
  const [perturbationMap, noSignal] = useTextureLoader(["/perturb.jpg", "/no-signal.jpg"]);

  const { gl, scene, size, camera } = useThree();

  const [floorCamera, targetCamera, targetScene, voidTargetCamera, voidTargetScene] = useMemo(() => {
    const floorCamera = new THREE.PerspectiveCamera();
    floorCamera.position.set(0, 0, 65);
    floorCamera.lookAt(0, 0, 0);
    
    const targetScene = new THREE.Scene()
    targetScene.background = new THREE.Color(0xffffff);
    const voidTargetScene = new THREE.Scene()
    voidTargetScene.background = new THREE.Color(0xffffff);

    return [floorCamera, new THREE.PerspectiveCamera(), targetScene, new THREE.PerspectiveCamera(), voidTargetScene];
  }, []);


  const [composer, targetSavePass, floorSavePass, voidTargetSavePass] = useMemo(() => {
    const composer = new EffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType,
    });

    const renderPass = new RenderPass(scene, camera);
    const floorRenderPass = new RenderPass(scene, floorCamera);
    const targetRenderPass = new RenderPass(targetScene, targetCamera);
    const voidTargetRenderPass = new RenderPass(voidTargetScene, voidTargetCamera);

    const normalPass = new NormalPass(scene, camera);

    const blur = new BlurPass();

    const targetSavePass = new SavePass();
    const voidTargetSavePass = new SavePass();
    const floorSavePass = new SavePass();

    const SMAA = new SMAAEffect(...smaa);
    SMAA.colorEdgesMaterial.setEdgeDetectionThreshold(0.1);

    const BLOOM = new BloomEffect({
      opacity: 1,
      blendFunction: BlendFunction.SCREEN,
      kernelSize: KernelSize.LARGE,
      luminanceThreshold: 0.5,
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

    const VIGNETTE_OUT = new VignetteEffect({
      offset: 0.5,
      darkness: 0.5,
    });

    const aOconfig = {
      blendFunction: BlendFunction.MULTIPLY,
      samples: 3, // May get away with less samples
      rings: 4, // Just make sure this isn't a multiple of samples
      distanceThreshold: 0.4,
      distanceFalloff: 0.5,
      rangeThreshold: 1, // Controls sensitivity based on camera view distance **
      rangeFalloff: 0.01,
      luminanceInfluence: 0.6,
      radius: 7, // Spread range
      intensity: 5,
      bias: 0.5,
    }
    const AO = new SSAOEffect(camera, normalPass.renderTarget.texture, aOconfig)
    const CAO = new SSAOEffect(camera, normalPass.renderTarget.texture, {
      ...aOconfig,
      samples: 21,
      radius: 8,
      intensity: 30,
      luminanceInfluence: 0.6,
      color: "black",
    })


    const targetGlitchPass = new EffectPass(targetCamera, GLITCH, NOISE);
    const targetChromaticAberrationPass = new EffectPass( targetCamera, CHROMATIC_ABERRATION );
    const targetVignettePass = new EffectPass(targetCamera, VIGNETTE);
    
    const voidTargetGlitchPass = new EffectPass(voidTargetCamera, GLITCH, NOISE);
    const voidTargetChromaticAberrationPass = new EffectPass( voidTargetCamera, CHROMATIC_ABERRATION );

    const effectPass = new EffectPass(
      camera,
      SMAA,
      CAO,
      AO,
      BLOOM,
      DEPTH_OF_FIELD,
      VIGNETTE_OUT
    );

    //Adds the first target's renderpass and effectpass and then save the result in the relative savepass
    composer.addPass(targetRenderPass);
    composer.addPass(targetGlitchPass);
    composer.addPass(targetChromaticAberrationPass);
    composer.addPass(targetVignettePass);
    composer.addPass(targetSavePass);
    
    //Adds the void target's renderpass and effectpass and then save the result in the relative savepass
    composer.addPass(voidTargetRenderPass);
    composer.addPass(voidTargetGlitchPass);
    composer.addPass(voidTargetChromaticAberrationPass);
    composer.addPass(voidTargetSavePass);

    //Adds the floor's renderpass and blur efx and then save the result in the relative savepass
    composer.addPass(floorRenderPass);
    composer.addPass(blur);
    composer.addPass(floorSavePass);
    
    //Simple postprocessing to be applied to the whole scene
    composer.addPass(renderPass);
    composer.addPass(normalPass);
    composer.addPass(effectPass);

    return [composer, targetSavePass, floorSavePass, voidTargetSavePass];
  }, [
    voidTargetScene,
    camera,
    gl,
    perturbationMap,
    scene,
    smaa,
    targetCamera,
    targetScene,
    floorCamera,
    voidTargetCamera
  ]);

  useEffect(() => void (composer.setSize(size.width, size.height)), [composer, size, targetScene]);

  useFrame((_, delta) => void composer.render(delta), 1);

  useFrame((state) => {
    targetCamera.position.z = 15 + Math.sin(state.clock.getElapsedTime()) * 10;
  });

  return (
    <>
      {createPortal(<InTheTv />, targetScene)}
      {createPortal(<Plane args={[5, 5]} position={[0,0,-5]} material-map={noSignal}></Plane>, voidTargetScene)}

      {TELEVISIONS.map(({withScene, ...args}, index) => (
        <group key={`0${index}`} {...args}>
          <Tv scale={[0.1, 0.1, 0.1]} />
          <Plane args={[8, 6]} position={[-1.4, 0, -1]}>
            <meshStandardMaterial
              attach="material"
              map={withScene ? targetSavePass.renderTarget.texture : voidTargetSavePass.renderTarget.texture}
            />
          </Plane>
        </group>
      ))}

      <Room
        position={[0, -4.2, -20]}
        texture={floorSavePass.renderTarget.texture}
      />
    </>
  );
}

function App() {
  return (
    <>
      <group position={[0, 0, 10]}>
        <Scene />
        <Environment />
      </group>
    </>
  );
}

export default App;
