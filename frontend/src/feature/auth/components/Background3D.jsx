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
    renderer.setClearColor(0x05080d, 1)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000)
    camera.position.set(0, 0, 320)

    // Subdivided wave plane — 80×50 grid
    const COLS = 80, ROWS = 50
    const planeW = 700, planeH = 480
    const geo = new THREE.PlaneGeometry(planeW, planeH, COLS, ROWS)

    // Vertex colors for warm orange-red tones
    const posArr = geo.attributes.position
    const colors = new Float32Array(posArr.count * 3)
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = -0.38
    mesh.position.y = -30
    scene.add(mesh)

    // 4 independent drifting ripple sources
    const ripples = [
      { x: 0,    y: 0,   speed: 0.9,  amp: 22, freq: 0.022, phase: 0   },
      { x: -180, y: 60,  speed: 1.3,  amp: 14, freq: 0.018, phase: 2.1 },
      { x: 200,  y: -80, speed: 0.7,  amp: 18, freq: 0.025, phase: 4.4 },
      { x: 80,   y: 120, speed: 1.1,  amp: 10, freq: 0.020, phase: 1.7 },
    ]

    // Mouse ripple (5th source from pointer)
    const mouse = { x: 0, y: 0, active: false }

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / W - 0.5) * planeW
      mouse.y = -((e.clientY - rect.top)  / H - 0.5) * planeH
      mouse.active = true
    }
    canvas.addEventListener('mousemove', onMouseMove)

    let t = 0
    let animId

    const animate = () => {
      animId = requestAnimationFrame(animate)
      t += 0.016

      const pos = geo.attributes.position
      const col = geo.attributes.color

      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i)
        const py = pos.getY(i)
        let z = 0

        for (const rp of ripples) {
          const dx = px - rp.x
          const dy = py - rp.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          z += rp.amp * Math.sin(dist * rp.freq - t * rp.speed + rp.phase)
        }

        if (mouse.active) {
          const mdx = px - mouse.x
          const mdy = py - mouse.y
          const md = Math.sqrt(mdx * mdx + mdy * mdy)
          z += 16 * Math.sin(md * 0.028 - t * 2.2) * Math.exp(-md * 0.005)
        }

        pos.setZ(i, z)

        // deep crimson troughs → bright orange-amber peaks
        const norm = Math.max(0, Math.min(1, (z + 40) / 80))
        col.setXYZ(i, 0.10 + norm * 0.25, 0.28 + norm * 0.42, 0.45 + norm * 0.5)
      }

      pos.needsUpdate = true
      col.needsUpdate = true

      // Drift ripple centers
      ripples[0].x = Math.sin(t * 0.18) * 120
      ripples[0].y = Math.cos(t * 0.14) * 80
      ripples[1].x = -180 + Math.cos(t * 0.11) * 60
      ripples[2].x =  200 + Math.sin(t * 0.09) * 50
      ripples[3].y =  120 + Math.sin(t * 0.22) * 40

      // Camera breathes slowly
      camera.position.y = Math.sin(t * 0.12) * 8
      camera.lookAt(0, -10, 0)

      renderer.render(scene, camera)
    }

    animate()

    const onResize = () => {
      const W2 = root.offsetWidth
      const H2 = root.offsetHeight
      renderer.setSize(W2, H2)
      camera.aspect = W2 / H2
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      geo.dispose()
      mat.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
    />
  )
}
