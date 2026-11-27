
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// ===================================
// DAMAS 2 SIMULATOR - 3D ENGINE
// ===================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91b7d4);
scene.fog = new THREE.Fog(0x91b7d4, 35, 120);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

document.getElementById("scene").appendChild(renderer.domElement);

// ===================================
// LIGHTING
// ===================================

scene.add(new THREE.HemisphereLight(0xffffff, 0x536477, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 3);
sunlight.position.set(-10, 20, 10);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(1024, 1024);
scene.add(sunlight);

// ===================================
// MATERIALS
// ===================================

const whitePaint = new THREE.MeshStandardMaterial({
  color: 0xf5f5f2,
  metalness: 0.45,
  roughness: 0.27
});

const black = new THREE.MeshStandardMaterial({
  color: 0x151719,
  roughness: 0.75
});

const glass = new THREE.MeshStandardMaterial({
  color: 0x243b4d,
  metalness: 0.3,
  roughness: 0.15
});

const chrome = new THREE.MeshStandardMaterial({
  color: 0xc9d0d5,
  metalness: 0.9,
  roughness: 0.2
});

const rubber = new THREE.MeshStandardMaterial({
  color: 0x151515,
  roughness: 0.95
});

// ===================================
// ENVIRONMENT
// ===================================

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({
    color: 0x647d56,
    roughness: 1
  })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 300),
  new THREE.MeshStandardMaterial({
    color: 0x30343a,
    roughness: 0.95
  })
);

road.rotation.x = -Math.PI / 2;
road.position.y = 0.015;
scene.add(road);

// Road markings
for (let z = -140; z < 150; z += 12) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.025, 5),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );

  line.position.set(0, 0.035, z);
  scene.add(line);
}

// ===================================
// DAMAS 2 MODEL
// ===================================

const car = new THREE.Group();
scene.add(car);

function box(parent, width, height, depth, material, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

// Main body
box(car, 2.05, 1.35, 4.0, whitePaint, 0, 1.35, 0);

// Roof
box(car, 1.98, 0.12, 3.85, whitePaint, 0, 2.08, 0.05);

// Front cabin
box(car, 1.95, 0.85, 1.5, whitePaint, 0, 1.85, -1.05);

// Windshield
const windshield = box(
  car, 1.78, 0.66, 0.035,
  glass, 0, 1.88, -1.81
);
windshield.rotation.x = -0.15;

// Rear window
box(car, 1.7, 0.58, 0.035, glass, 0, 1.83, 1.98);

// Side windows
for (const side of [-1, 1]) {
  box(car, 0.035, 0.58, 1.1, glass, side * 1.02, 1.83, -0.95);
  box(car, 0.035, 0.58, 1.25, glass, side * 1.02, 1.83, 0.65);

  // Door handles
  box(car, 0.045, 0.06, 0.24, chrome, side * 1.045, 1.35, -0.45);
  box(car, 0.045, 0.06, 0.24, chrome, side * 1.045, 1.35, 1.05);

  // Side mirrors
  const mirror = box(
    car, 0.22, 0.18, 0.25,
    black, side * 1.2, 1.68, -1.48
  );
}

// Front bumper
box(car, 2.12, 0.2, 0.16, black, 0, 0.72, -2.04);

// Rear bumper
box(car, 2.12, 0.2, 0.16, black, 0, 0.72, 2.04);

// Front grille
box(car, 0.85, 0.24, 0.045, black, 0, 1.12, -2.03);

// Headlights
for (const side of [-1, 1]) {
  const headlight = box(
    car, 0.43, 0.27, 0.07,
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.08
    }),
    side * 0.72, 1.46, -2.04
  );
}

// Rear lights
for (const side of [-1, 1]) {
  box(car, 0.27, 0.42, 0.07, new THREE.MeshStandardMaterial({
    color: 0xb21d1d,
    emissive: 0x440000
  }), side * 0.82, 1.35, 2.04);
}

// ===================================
// WHEELS
// ===================================

const wheels = [];
const frontWheels = [];

function createWheel(x, z, isFront) {
  const group = new THREE.Group();

  group.position.set(x, 0.48, z);

  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.43, 0.43, 0.23, 32),
    rubber
  );

  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  group.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.23, 0.245, 24),
    chrome
  );

  rim.rotation.z = Math.PI / 2;
  group.add(rim);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.26, 20),
    black
  );

  hub.rotation.z = Math.PI / 2;
  group.add(hub);

  car.add(group);
  wheels.push(group);

  if (isFront) frontWheels.push(group);
}

createWheel(-1.04, -1.35, true);
createWheel(1.04, -1.35, true);
createWheel(-1.04, 1.35, false);
createWheel(1.04, 1.35, false);

// ===================================
// INTERIOR
// ===================================

// Dashboard
box(car, 1.8, 0.22, 0.5, black, 0, 1.35, -1.38);

// Dashboard screen
box(car, 0.5, 0.18, 0.04, chrome, 0, 1.5, -1.55);

// Seats
for (const x of [-0.55, 0.55]) {
  box(car, 0.72, 0.16, 0.7, black, x, 0.78, -0.15);
  box(car, 0.72, 0.8, 0.16, black, x, 1.2, 0.12);
}

// Steering wheel
const steeringWheel = new THREE.Group();

const wheelRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.27, 0.035, 12, 32),
  black
);

steeringWheel.add(wheelRing);

const steeringCenter = new THREE.Mesh(
  new THREE.CylinderGeometry(0.075, 0.075, 0.08, 20),
  chrome
);

steeringCenter.rotation.x = Math.PI / 2;
steeringWheel.add(steeringCenter);

steeringWheel.position.set(0.52, 1.35, -0.85);
steeringWheel.rotation.x = -0.25;
car.add(steeringWheel);

// ===================================
// CAMERA SYSTEM
// ===================================

let cameraMode = "exterior";

function updateCamera() {
  if (cameraMode === "exterior") {
    const target = new THREE.Vector3(
      car.position.x + 5,
      car.position.y + 3.3,
      car.position.z + 6
    );

    camera.position.lerp(target, 0.09);

    camera.lookAt(
      car.position.x,
      1.1,
      car.position.z
    );
  } else {
    const interiorPosition = new THREE.Vector3(
      car.position.x,
      1.57,
      car.position.z - 0.1
    );

    camera.position.lerp(interiorPosition, 0.15);

    camera.lookAt(
      car.position.x,
      1.45,
      car.position.z - 8
    );
  }
}

document.getElementById("exteriorBtn").onclick = () => {
  cameraMode = "exterior";
};

document.getElementById("interiorBtn").onclick = () => {
  cameraMode = "interior";
};

// ===================================
// MOBILE CONTROLS
// ===================================

let gas = false;
let brake = false;
let steering = 0;
let speed = 0;
let velocity = 0;

function holdButton(id, callback) {
  const element = document.getElementById(id);

  element.addEventListener("pointerdown", e => {
    e.preventDefault();
    element.setPointerCapture(e.pointerId);
    callback(true);
  });

  element.addEventListener("pointerup", () => callback(false));
  element.addEventListener("pointercancel", () => callback(false));
  element.addEventListener("lostpointercapture", () => callback(false));
}

holdButton("gasBtn", v => gas = v);
holdButton("brakeBtn", v => brake = v);
holdButton("leftBtn", v => steering = v ? -1 : 0);
holdButton("rightBtn", v => steering = v ? 1 : 0);

// ===================================
// PHYSICS
// ===================================

let steeringAngle = 0;

function physics(delta) {
  const acceleration = 4.0;
  const braking = 8.0;
  const maxSpeed = 24;

  if (gas) {
    velocity += acceleration * delta;
  }

  if (brake) {
    velocity -= braking * delta;
  }

  if (!gas && !brake) {
    velocity *= Math.pow(0.985, delta * 60);
  }

  velocity = THREE.MathUtils.clamp(velocity, 0, maxSpeed);

  speed = velocity * 3.6;

  steeringAngle += (steering - steeringAngle) * Math.min(1, delta * 5);

  frontWheels.forEach(wheel => {
    wheel.rotation.y = steeringAngle * 0.42;
  });

  steeringWheel.rotation.z = -steeringAngle * 0.65;

  wheels.forEach(wheel => {
    wheel.children[0].rotation.x -= velocity * delta * 2;
    wheel.children[1].rotation.x -= velocity * delta * 2;
  });

  if (velocity > 0.1) {
    car.rotation.y += steeringAngle * velocity * delta * 0.018;
  }

  car.position.x += Math.sin(car.rotation.y) * velocity * delta;
  car.position.z -= Math.cos(car.rotation.y) * velocity * delta;

  document.getElementById("speed").textContent =
    Math.round(speed) + " KM/H";
}

// ===================================
// RESIZE
// ===================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===================================
// MAIN LOOP
// ===================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);

  physics(delta);
  updateCamera();

  renderer.render(scene, camera);
}

camera.position.set(5, 4, 7);
camera.lookAt(0, 1, 0);

document.getElementById("loading").style.display = "none";
document.getElementById("dashboard").style.display = "block";

animate();
      
