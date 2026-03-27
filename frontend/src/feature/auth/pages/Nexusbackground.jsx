import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function NexusBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const root = canvas.parentElement
    const W = root.offsetWidth || 900
    const H = root.offsetHeight || 640

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true })
    renderer.setSize(W, H)
    renderer.setClearColor(0x0a0400, 1)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0d0500, 0.0012)

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000)
    camera.position.z = 280

    // Node positions
    const NODE_COUNT = 55
    const positions = Array.from({ length: NODE_COUNT }, () =>
      new THREE.Vector3(
        (Math.random() - 0.5) * 520,
        (Math.random() - 0.5) * 400,
        (Math.random() - 0.5) * 200
      )
    )

    // Node velocities
    const vel = positions.map(() =>
      new THREE.Vector3(
        (Math.random() - 0.5) * 0.12,
        (Math.random() - 0.5) * 0.10,
        (Math.random() - 0.5) * 0.06
      )
    )

    // Line materials
    const lineMat1 = new THREE.LineBasicMaterial({ color: 0xff5511, transparent: true, opacity: 0.18 })
    const lineMat2 = new THREE.LineBasicMaterial({ color: 0xff8833, transparent: true, opacity: 0.09 })

    // Build lines between nearby nodes
    const lineData = []
    const lineGroup = new THREE.Group()

    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const d = positions[i].distanceTo(positions[j])
        if (d < 140) {
          const geo = new THREE.BufferGeometry().setFromPoints([positions[i], positions[j]])
          const baseMat = d < 80 ? lineMat1 : lineMat2
          const mat = baseMat.clone()
          const line = new THREE.Line(geo, mat)
          lineGroup.add(line)
          lineData.push({ line, i, j, baseOpacity: d < 80 ? 0.18 : 0.09 })
        }
      }
    }
    scene.add(lineGroup)

    // Node dots
    const dotGeo = new THREE.SphereGeometry(1.2, 6, 6)
    const dotMatBright = new THREE.MeshBasicMaterial({ color: 0xff6622 })
    const dotMatDim = new THREE.MeshBasicMaterial({ color: 0xff9944, transparent: true, opacity: 0.5 })

    const dots = positions.map((pos, i) => {
      const mesh = new THREE.Mesh(dotGeo, (i % 5 === 0 ? dotMatBright : dotMatDim).clone())
      mesh.position.copy(pos)
      mesh.scale.setScalar(i % 7 === 0 ? 1.6 : 1)
      scene.add(mesh)
      return mesh
    })

    let t = 0
    let animId

    const animate = () => {
      animId = requestAnimationFrame(animate)
      t += 0.008

      // Drift nodes
      for (let i = 0; i < NODE_COUNT; i++) {
        positions[i].add(vel[i])
        if (Math.abs(positions[i].x) > 270) vel[i].x *= -1
        if (Math.abs(positions[i].y) > 210) vel[i].y *= -1
        if (Math.abs(positions[i].z) > 110) vel[i].z *= -1
        dots[i].position.copy(positions[i])
      }

      // Update lines
      lineData.forEach((ld, k) => {
        const d = positions[ld.i].distanceTo(positions[ld.j])
        ld.line.geometry.setFromPoints([positions[ld.i], positions[ld.j]])
        const pulse = ld.baseOpacity * (0.7 + 0.3 * Math.sin(t * 1.5 + k * 0.3))
        ld.line.material.opacity = d < 140 ? pulse : 0
      })

      // Slow camera sway
      camera.position.x = Math.sin(t * 0.18) * 18
      camera.position.y = Math.cos(t * 0.14) * 10
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  )
}