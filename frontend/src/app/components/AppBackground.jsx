import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function AppBackground() {
    const mountRef = useRef(null)

    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return undefined

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
        camera.position.z = 110

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
        mount.appendChild(renderer.domElement)

        const nodeCount = 48
        const nodePositions = new Float32Array(nodeCount * 3)
        const velocities = []

        for (let i = 0; i < nodeCount; i += 1) {
            const i3 = i * 3
            nodePositions[i3] = (Math.random() - 0.5) * 180
            nodePositions[i3 + 1] = (Math.random() - 0.5) * 120
            nodePositions[i3 + 2] = (Math.random() - 0.5) * 40
            velocities.push({
                x: (Math.random() - 0.5) * 0.12,
                y: (Math.random() - 0.5) * 0.09,
            })
        }

        const nodeGeometry = new THREE.BufferGeometry()
        nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))

        const nodeMaterial = new THREE.PointsMaterial({
            color: '#92ddff',
            size: 2.9,
            transparent: true,
            opacity: 0.92,
        })

        const points = new THREE.Points(nodeGeometry, nodeMaterial)
        scene.add(points)

        const lineGeometry = new THREE.BufferGeometry()
        const maxConnections = nodeCount * nodeCount * 2
        const linePositions = new Float32Array(maxConnections * 3)
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))

        const lineMaterial = new THREE.LineBasicMaterial({
            color: '#77c7ff',
            transparent: true,
            opacity: 0.24,
        })

        const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
        scene.add(lines)

        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(30, 32, 32),
            new THREE.MeshBasicMaterial({
                color: '#79c4ff',
                transparent: true,
                opacity: 0.12,
            })
        )
        glow.position.set(24, 8, -50)
        scene.add(glow)

        const glowSecondary = new THREE.Mesh(
            new THREE.SphereGeometry(24, 32, 32),
            new THREE.MeshBasicMaterial({
                color: '#3b7dff',
                transparent: true,
                opacity: 0.08,
            })
        )
        glowSecondary.position.set(-34, -20, -60)
        scene.add(glowSecondary)

        const resize = () => {
            const width = mount.clientWidth || window.innerWidth
            const height = mount.clientHeight || window.innerHeight
            renderer.setSize(width, height)
            camera.aspect = width / height
            camera.updateProjectionMatrix()
        }

        resize()
        window.addEventListener('resize', resize)

        let frameId = 0
        const animate = () => {
            frameId = window.requestAnimationFrame(animate)

            const positionAttr = nodeGeometry.attributes.position
            let lineIndex = 0

            for (let i = 0; i < nodeCount; i += 1) {
                const i3 = i * 3
                let x = positionAttr.array[i3]
                let y = positionAttr.array[i3 + 1]

                x += velocities[i].x
                y += velocities[i].y

                if (x > 95 || x < -95) velocities[i].x *= -1
                if (y > 70 || y < -70) velocities[i].y *= -1

                positionAttr.array[i3] = x
                positionAttr.array[i3 + 1] = y
            }

            for (let i = 0; i < nodeCount; i += 1) {
                for (let j = i + 1; j < nodeCount; j += 1) {
                    const i3 = i * 3
                    const j3 = j * 3
                    const dx = positionAttr.array[i3] - positionAttr.array[j3]
                    const dy = positionAttr.array[i3 + 1] - positionAttr.array[j3 + 1]
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist < 34) {
                        linePositions[lineIndex++] = positionAttr.array[i3]
                        linePositions[lineIndex++] = positionAttr.array[i3 + 1]
                        linePositions[lineIndex++] = positionAttr.array[i3 + 2]
                        linePositions[lineIndex++] = positionAttr.array[j3]
                        linePositions[lineIndex++] = positionAttr.array[j3 + 1]
                        linePositions[lineIndex++] = positionAttr.array[j3 + 2]
                    }
                }
            }

            lineGeometry.setDrawRange(0, lineIndex / 3)
            lineGeometry.attributes.position.needsUpdate = true
            positionAttr.needsUpdate = true

            points.rotation.z += 0.00045
            glow.position.x = 18 + Math.sin(Date.now() * 0.00035) * 12
            glow.position.y = 8 + Math.cos(Date.now() * 0.00028) * 8
            glowSecondary.position.x = -30 + Math.cos(Date.now() * 0.00024) * 10
            glowSecondary.position.y = -18 + Math.sin(Date.now() * 0.00031) * 12

            renderer.render(scene, camera)
        }

        animate()

        return () => {
            window.cancelAnimationFrame(frameId)
            window.removeEventListener('resize', resize)
            nodeGeometry.dispose()
            nodeMaterial.dispose()
            lineGeometry.dispose()
            lineMaterial.dispose()
            glow.geometry.dispose()
            glow.material.dispose()
            glowSecondary.geometry.dispose()
            glowSecondary.material.dispose()
            renderer.dispose()
            if (renderer.domElement.parentNode === mount) {
                mount.removeChild(renderer.domElement)
            }
        }
    }, [])

    return (
        <div className="app-bg-layer" aria-hidden="true">
            <div ref={mountRef} className="app-bg-canvas" />
            <div className="app-bg-gradient" />
            <div className="app-bg-grid" />
        </div>
    )
}
