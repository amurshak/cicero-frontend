import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Reused vectors to avoid per-frame allocation
const _direction = new THREE.Vector3()
const _right = new THREE.Vector3()

/**
 * Ship-style flight controls:
 * - Mouse position steers the camera (further from center = faster rotation)
 * - WASD to fly, Space/Shift for altitude
 * - Scroll to adjust speed
 * - Cursor stays visible at all times
 */
export function FlyCamera({
  speed = 30,
  lookSpeed = 1.2,
  deadZone = 0.05,
}: {
  speed?: number
  lookSpeed?: number
  deadZone?: number
}) {
  const { camera, gl } = useThree()
  const keys = useRef<Set<string>>(new Set())
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const currentSpeed = useRef(speed)
  // Normalized mouse position: (0,0) = center, (-1,-1) to (1,1) = edges
  const mouseNorm = useRef({ x: 0, y: 0 })

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    keys.current.add(e.code)
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault()
    }
  }, [])

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    keys.current.delete(e.code)
  }, [])

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      // Normalize mouse to -1..1 relative to canvas center
      const rect = gl.domElement.getBoundingClientRect()
      mouseNorm.current = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
      }
    },
    [gl],
  )

  const onMouseLeave = useCallback(() => {
    // Stop rotating when mouse leaves the canvas
    mouseNorm.current = { x: 0, y: 0 }
  }, [])

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    currentSpeed.current = Math.max(5, Math.min(200, currentSpeed.current - e.deltaY * 0.05))
  }, [])

  useEffect(() => {
    const el = gl.domElement

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseleave', onMouseLeave)
    el.addEventListener('wheel', onWheel, { passive: false })
    const onContextMenu = (e: Event) => e.preventDefault()
    el.addEventListener('contextmenu', onContextMenu)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseleave', onMouseLeave)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('contextmenu', onContextMenu)
    }
  }, [gl, onKeyDown, onKeyUp, onMouseMove, onMouseLeave, onWheel])

  useFrame((_, delta) => {
    // --- Camera rotation from mouse position ---
    const mx = mouseNorm.current.x
    const my = mouseNorm.current.y

    // Apply dead zone in the center so small movements don't rotate
    const ax = Math.abs(mx) > deadZone ? (mx - Math.sign(mx) * deadZone) / (1 - deadZone) : 0
    const ay = Math.abs(my) > deadZone ? (my - Math.sign(my) * deadZone) / (1 - deadZone) : 0

    if (ax !== 0 || ay !== 0) {
      euler.current.setFromQuaternion(camera.quaternion)
      euler.current.y -= ax * lookSpeed * delta
      euler.current.x -= ay * lookSpeed * delta
      euler.current.x = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, euler.current.x))
      camera.quaternion.setFromEuler(euler.current)
    }

    // --- WASD movement ---
    const v = currentSpeed.current * delta
    const direction = _direction
    const right = _right

    camera.getWorldDirection(direction)
    right.crossVectors(direction, camera.up).normalize()

    if (keys.current.has('KeyW') || keys.current.has('ArrowUp')) {
      camera.position.addScaledVector(direction, v)
    }
    if (keys.current.has('KeyS') || keys.current.has('ArrowDown')) {
      camera.position.addScaledVector(direction, -v)
    }
    if (keys.current.has('KeyA') || keys.current.has('ArrowLeft')) {
      camera.position.addScaledVector(right, -v)
    }
    if (keys.current.has('KeyD') || keys.current.has('ArrowRight')) {
      camera.position.addScaledVector(right, v)
    }
    if (keys.current.has('Space')) {
      camera.position.y += v
    }
    if (keys.current.has('ShiftLeft') || keys.current.has('ShiftRight')) {
      camera.position.y -= v
    }
  })

  return null
}

// No drag detection needed — clicks are always clean clicks
FlyCamera.isDrag = (): boolean => false
