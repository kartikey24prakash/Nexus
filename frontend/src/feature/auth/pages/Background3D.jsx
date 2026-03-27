import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const NexusWaves = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);

        // Create a Plane Geometry for the Grid
        const geometry = new THREE.PlaneGeometry(20, 20, 60, 60);
        
        // Material with Wireframe for the "Grid" look
        const material = new THREE.MeshBasicMaterial({
            color: 0xff5c00,
            wireframe: true,
            transparent: true,
            opacity: 0.25
        });

        const mesh = new THREE.Mesh(geometry, material);
        // Tilt the mesh slightly to give perspective
        mesh.rotation.x = -Math.PI / 3; 
        scene.add(mesh);

        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            
            // Access positions to create the wave animation
            const position = geometry.attributes.position;
            for (let i = 0; i < position.count; i++) {
                const x = position.getX(i);
                const y = position.getY(i);
                
                // Vertical Wave Formula
                const wave1 = Math.sin(x * 0.5 + elapsedTime) * 0.2;
                const wave2 = Math.sin(y * 0.3 + elapsedTime * 0.5) * 0.2;
                
                position.setZ(i, wave1 + wave2);
            }
            position.needsUpdate = true;

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            mountRef.current?.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} className="wave-bg" />;
};

export default NexusWaves;