// model by warkarma -> https://sketchfab.com/3d-models/1970-tv-6bb1511500864030abde5c30630c5be9

import React, { useRef } from "react";
import { useGLTFLoader } from "drei";

function Model({ metalness = 0, roughness = 0.8, transmission = 1, ...props }) {
  const group = useRef();

  const { nodes, materials } = useGLTFLoader("/tv3.glb", true);

  const materialProps = {
    clearcoat: 1.0,
    clearcoatRoughness: 0,
    roughness,
    metalness,
    color: 0xaaaaaa,
    transmission,
    opacity: 1,
    transparent: true,
  };

  return (
    <group ref={group} {...props} dispose={null}>
      <mesh
        material={materials.TV_1970_Mat}
        geometry={nodes.TV_1970_TV_1970_Mat_0.geometry}
        position={[-3.37, 0, 0.12]}
        receiveShadow
        castShadow
      />
      <group position={[-3.37, 0, 0.12]}>
        <mesh geometry={nodes.TV_1970_TV_1970_Mat_0001.geometry}>
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
      </group>
    </group>
  );
}

export default Model;
