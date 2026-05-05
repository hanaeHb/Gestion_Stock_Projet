import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
function Letters() {
    const gRef = useRef();
    const oRef = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const moveProgress = Math.min(t / 2, 1);

        // Start & End positions
        const gStart = -4;
        const gEnd = 1.4;
        const oStart = 4;
        const oEnd = -1.4;

        // Smooth interpolation
        const gX = gStart + (gEnd - gStart) * moveProgress;
        const oX = oStart + (oEnd - oStart) * moveProgress;

        // Update positions
        if (gRef.current && oRef.current) {
            gRef.current.position.x = gX;
            oRef.current.position.x = oX;

            // Minor rotation per letter for 3D effect
            gRef.current.rotation.y = moveProgress * 0.5;
            oRef.current.rotation.y = -moveProgress * 0.5;
        }
    });

    return (
        <>
            <Text
                ref={gRef}
                fontSize={4.2}
                fontWeight="bold"
                color="#730d19"
                position={[-4, 0, 0]}
                castShadow
            >
                G
            </Text>

            <Text
                ref={oRef}
                fontSize={4.2}
                fontWeight="bold"
                color="#ff9a9e"
                position={[4, 0, 0]}
                castShadow
            >
                O
            </Text>
        </>
    );
}

export default function LogoScene() {
    return (
        <Canvas shadows camera={{ position: [0, 0, 6], fov: 50 }}>
            <color attach="background" args={["#ffffff"]} />

            {/* Lights */}
            <ambientLight intensity={0.6} />
            <directionalLight
                position={[5, 5, 5]}
                intensity={1}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-camera-left={-5}
                shadow-camera-right={5}
                shadow-camera-top={5}
                shadow-camera-bottom={-5}
            />

            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
                <planeGeometry args={[10, 10]} />
                <shadowMaterial opacity={0.3} />
            </mesh>

            <Letters />
        </Canvas>
    );
}