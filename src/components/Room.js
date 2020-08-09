import React from "react";

import { Plane, useTextureLoader } from "drei";

import COLOR from "nice-color-palettes";

const COLOR_INDEX = 45;

function Room(props) {
  const [
    aoMap,
    map,
    displacementMap,
    normalMap,
    roughnessMap,
  ] = useTextureLoader([
    "/Concrete_016_ambientOcclusion.jpg",
    "/Concrete_016_baseColor.jpg",
    "/Concrete_016_height.png",
    "/Concrete_016_normal.jpg",
    "/Concrete_016_roughness.jpg",
  ]);

  const materialProps = {
    aoMap,
    map,
    displacementMap,
    normalMap,
    roughnessMap,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    normalScale: [1.4, 1.4],
    roughness: 0.2,
    metalness: 0.2,
  };

  return (
    <group {...props}>
      <Plane args={[200, 200]} receiveShadow>
        <meshPhysicalMaterial
          {...materialProps}
          color={COLOR[COLOR_INDEX][2]}
        />
      </Plane>
      <Plane
        args={[200, 200]}
        rotation={[0, Math.PI / 2, 0]}
        position={[-40, 0, 0]}
        receiveShadow
      >
        <meshPhysicalMaterial
          {...materialProps}
          color={COLOR[COLOR_INDEX][2]}
        />
      </Plane>
      <Plane args={[200, 200]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshPhysicalMaterial
          {...materialProps}
          color={COLOR[COLOR_INDEX][4]}
        />
      </Plane>
    </group>
  );
}

export default Room;
