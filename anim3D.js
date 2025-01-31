const initNumElectrons = 20 * 137
const orbitRadii = [53, 212, 477, 848, 1325] // Bohr Radius (hbar/m*c)*137 and subsequent orbits in picometers for Hydrogen
const orbitColors = ["#ef7383", "#efa983", "#efef93", "#73d6df", "#537cef"]
const maxElectronSpeed = 0.0015
const minElectronSpeed = 0.0003
const electronSize = 1.5
const nucleusDisplayFactor = 0.95

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const addElectronsButton = document.getElementById("add-electrons");
const removeElectronsButton = document.getElementById("remove-electrons");
const shellLinks = document.querySelectorAll("#shells a");

// Init

canvas.width = window.innerWidth
canvas.height = window.innerHeight
const center = { x: canvas.width / 2, y: canvas.height / 2 }

const maxOrbitRadius = orbitRadii[orbitRadii.length - 1]
const scalingFactor = (nucleusDisplayFactor * Math.min(canvas.width, canvas.height)) / (2 * maxOrbitRadius)
const adjustedOrbitRadii = orbitRadii.map(radius => radius * scalingFactor)

let perspective = 10 * 137
let mouseDistanceFromCenter = null

const electrons = []
let largestOrbitIdxToDisplay = orbitRadii.length - 1

function addElectrons(count) {
    for (let i = 0; i < count; i++) {
        const orbitIndex = Math.floor(Math.random() * adjustedOrbitRadii.length);
        const speed = minElectronSpeed + Math.random() * (maxElectronSpeed - minElectronSpeed);

        electrons.push({
            orbitRadius: adjustedOrbitRadii[orbitIndex],
            color: orbitColors[orbitIndex],
            theta: Math.random() * 2 * Math.PI,
            phi: Math.acos(2 * Math.random() - 1),
            thetaSpeed: speed * (Math.random() < 0.5 ? 1 : -1),
            phiSpeed: speed * (Math.random() < 0.5 ? 1 : -1),
            orbitIndex,
        });
    }
}

function removeElectrons(count) {
    electrons.splice(0, Math.min(count, electrons.length - 137));
}

addElectrons(initNumElectrons)

// Run

function project3D(x, y, z) {
    const scale = perspective / (perspective - z)
    return { x: center.x + x * scale, y: center.y + y * scale }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    electrons.forEach(electron => {
        if (electron.orbitIndex > largestOrbitIdxToDisplay) {
            return // Skips orbits larger than the one the mouse is in
        }

        electron.theta += electron.thetaSpeed
        electron.phi += electron.phiSpeed

        const x = electron.orbitRadius * Math.sin(electron.phi) * Math.cos(electron.theta)
        const y = electron.orbitRadius * Math.sin(electron.phi) * Math.sin(electron.theta)
        const z = electron.orbitRadius * Math.cos(electron.phi)
        const { x: projX, y: projY } = project3D(x, y, z)

        const electronRadius = electronSize * (perspective / (perspective - z))
        if (electronRadius <= 0) return // Electron is behind camera

        ctx.beginPath()
        ctx.arc(projX, projY, electronRadius, 0, Math.PI * 2)
        ctx.fillStyle = electron.color
        ctx.fill()
    })

    requestAnimationFrame(animate)
}

animate()

// Zoom in/out

function zoomIn() {
    perspective = Math.max(20, perspective * 0.95)
}

function zoomOut() {
    perspective = Math.min(5000, perspective * 1.05)
}

document.addEventListener("keydown", event => {
    if (["w", "ArrowUp", "PageUp", "Enter"].includes(event.key)) {
        zoomIn()
    } else if (["/", "s", "ArrowDown", "PageDown", "Backspace"].includes(event.key)) {
        zoomOut()
    }
})

canvas.addEventListener("wheel", event => {
    event.preventDefault()
    event.deltaY < 0 ? zoomIn() : zoomOut()
})

canvas.addEventListener("touchmove", (event) => {
    if (event.touches.length !== 2) return
    event.preventDefault()

    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    const currentDistance = Math.hypot(
        touch1.pageX - touch2.pageX, 
        touch1.pageY - touch2.pageY
    )

    if (window.lastTouchDistance) {
        const delta = currentDistance - window.lastTouchDistance
        delta < 0 ? zoomOut() : zoomIn()
    }

    window.lastTouchDistance = currentDistance
})

canvas.addEventListener("touchend", () => {
    window.lastTouchDistance = null
})

// Controls

function hoverShellLinks() {
    for (let i = 1; i < orbitRadii.length + 1; i++) {
        if (i === largestOrbitIdxToDisplay + 1) {
            document.getElementById(`shell-${i}`).classList.add('hover')
        } else {
            document.getElementById(`shell-${i}`).classList.remove('hover')
        }
    }
}

canvas.addEventListener("mousemove", event => {
    // TODO: Adjust mouseDistanceFromCenter for perspective?
    const dx = event.clientX - center.x
    const dy = event.clientY - center.y
    const mouseDistanceFromCenter = Math.sqrt(dx * dx + dy * dy)

    let orbitIdx = orbitRadii.length
    while (orbitIdx > 0 && mouseDistanceFromCenter <= adjustedOrbitRadii[orbitIdx - 1]) orbitIdx--
    if (orbitIdx !== largestOrbitIdxToDisplay) {
        largestOrbitIdxToDisplay = orbitIdx
        if (largestOrbitIdxToDisplay < orbitRadii.length) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
        hoverShellLinks()
    }
})

canvas.addEventListener("click", event => {
    document.getElementById(`shell-${largestOrbitIdxToDisplay + 1}`).click()
})

shellLinks.forEach(link => {
    link.addEventListener("mouseover", (event) => {
        event.preventDefault()
        largestOrbitIdxToDisplay = +event.target.id.split('-')[1] - 1
        hoverShellLinks()
    })
})

addElectronsButton.addEventListener("click", () => addElectrons(137));
removeElectronsButton.addEventListener("click", () => removeElectrons(137));

