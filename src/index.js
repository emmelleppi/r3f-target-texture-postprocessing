import React, { Suspense } from "react";
import { render } from "react-dom";

import { Canvas } from "react-three-fiber";

import App from "./App";

render(
  <Canvas
    shadowMap
    colorManagement
    camera={{ position: [24, 0, 30] }}
    gl={{
      powerPreference: "high-performance",
      antialias: false,
      stencil: false,
      depth: false,
    }}
    onCreated={({camera}) => camera.lookAt(0, 7, 0)}
  >
    <fog attach="fog" args={["#070710", 0, 50]} />

    <pointLight intensity={0.4} color="red" position={[-10, 5, 5]} />
    <pointLight
      position={[10, 1, 20]}
      intensity={0.7}
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
    />
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </Canvas>,
  document.getElementById("root")
);
