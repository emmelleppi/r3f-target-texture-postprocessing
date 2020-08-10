import React, { useRef } from "react";
import { useFrame } from "react-three-fiber";
import { TorusKnot } from "drei";
import COLOR from "nice-color-palettes";

const COLOR_INDEX = 10;

function InTheTV() {
  const mesh = useRef();

  useFrame(
    () =>
      (mesh.current.rotation.x = mesh.current.rotation.y = mesh.current.rotation.z += 0.01)
  );

  return (
    <>
      <TorusKnot ref={mesh} args={[1, 0.4, 100, 16]}>
        <meshPhongMaterial attach="material" color={COLOR[COLOR_INDEX][4]} />
      </TorusKnot>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 1]} />
    </>
  );
}

export default InTheTV;
