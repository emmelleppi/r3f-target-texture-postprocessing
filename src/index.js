import { Html } from "drei";
import React, { Suspense } from "react";
import { render } from "react-dom";
import { Canvas } from "react-three-fiber";

import App from "./App";

import "./styles.css";

render(
  <Canvas
    shadowMap
    colorManagement
    camera={{ position: [24, 5, 30] }}
    gl={{
      powerPreference: "high-performance",
      antialias: false,
      stencil: false,
      depth: false,
    }}
    onCreated={({ camera }) => camera.lookAt(0, 10, 0)}
  >
    <fog attach="fog" args={["#000000", 0, 70]} />

    <ambientLight intensity={0.2} />
    <pointLight intensity={0.8} color="red" position={[-1, 5, 5]} />
    <pointLight
      position={[10, 1, 20]}
      intensity={0.7}
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
    />
    <Suspense fallback={<Html scaleFactor={100} ><div style={{ color: "#ffffff"}}>loading...</div></Html>}>
      <App />
    </Suspense>
  </Canvas>,
  document.getElementById("root")
);
