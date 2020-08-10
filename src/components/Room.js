import React from "react";
import * as THREE from "three"
import { Plane, useTextureLoader } from "drei";

import COLOR from "nice-color-palettes";

const COLOR_INDEX = 10;

function Room({ texture,  ...props }) {
  const [
    carbon
  ] = useTextureLoader([
    "/carbon.jpeg",
  ]);

  const materialProps = {
    map: carbon,
    "map-wrapT": THREE.RepeatWrapping,
    "map-wrapS": THREE.RepeatWrapping,
    "map-repeat": [4, 4],
    "map-anisotropy": 16,
    displacementMap: carbon,
    normalMap: carbon,
    roughnessMap: carbon,
    clearcoat: 1,
    clearcoatRoughness: 0.3,
    normalScale: [1.2, 1.2],
    roughness: 0.5,
    metalness: 0.1,
    transmission: 0.1
  };

  return (
    <group {...props}>
      <Plane args={[200, 200]} receiveShadow>
        <meshPhysicalMaterial
          {...materialProps}
          color={COLOR[COLOR_INDEX][4]}
        />
      </Plane>
      <Plane
        args={[200, 200]}
        rotation={[0, Math.PI / 2, 0]}
        position={[-25, 0, 0]}
        receiveShadow
      >
        <meshPhysicalMaterial
          {...materialProps}
          color={COLOR[COLOR_INDEX][4]}
        />
      </Plane>
      <Plane args={[200, 200]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshPhysicalMaterial
          {...materialProps}
          color={COLOR[COLOR_INDEX][3]}
        />
      </Plane>
      <Plane args={[50, 40]} scale={[1,1.5,1]} rotation={[-Math.PI / 2, Math.PI, Math.PI]} position={[0, 0.6, 25]}>
        <meshBasicMaterial
          attach="material"
          side={THREE.BackSide}
          transparent
          opacity={0.6}
          alphaTest={0.55}
          map={texture}
        />
      </Plane>
    </group>
  );
}

export default Room;
