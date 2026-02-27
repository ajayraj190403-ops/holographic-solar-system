import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Line, Trail } from '@react-three/drei';
import * as THREE from 'three';
import './styles.css';

// --- EXPANDED PLANET DATA WITH FACTS ---
const PLANETS = [
  { 
    name: "Mercury", color: "#00ffff", size: 0.4, radius: 6, speed: 0.02, type: "Terrestrial", period: "88 Days",
    facts: [
      "Smallest planet in our solar system.",
      "Closest planet to the Sun.",
      "Has no moons or rings.",
      "Despite being closest to the Sun, Venus is hotter.",
      "Experiences extreme temperature swings (-173°C to 427°C).",
      "Has a very thin exosphere instead of a true atmosphere.",
      "Travels through space at nearly 47 kilometers per second.",
      "Heavily cratered surface resembling Earth's Moon."
    ]
  },
  { 
    name: "Venus", color: "#ff00ff", size: 0.6, radius: 9, speed: 0.015, type: "Terrestrial", period: "225 Days",
    facts: [
      "Hottest planet in the solar system (around 465°C).",
      "Rotates backward (retrograde) compared to most planets.",
      "A day on Venus is longer than its year.",
      "Has a crushing atmosphere filled with carbon dioxide.",
      "Clouds are made of toxic sulfuric acid.",
      "Often called Earth's 'sister planet' due to similar size.",
      "The brightest natural object in Earth's night sky after the Moon.",
      "Surface is dominated by volcanic features."
    ]
  },
  { 
    name: "Earth", color: "#0055ff", size: 0.7, radius: 12, speed: 0.01, type: "Terrestrial", period: "365 Days",
    facts: [
      "The only known planet to harbor life.",
      "Surface is approximately 71% water.",
      "Has one large natural satellite (The Moon).",
      "The densest major body in the solar system.",
      "Possesses a powerful magnetic field that deflects solar radiation.",
      "Atmosphere is mostly nitrogen (78%) and oxygen (21%).",
      "Only planet with active plate tectonics.",
      "Formed approximately 4.5 billion years ago."
    ]
  },
  { 
    name: "Mars", color: "#ff3300", size: 0.5, radius: 15, speed: 0.008, type: "Terrestrial", period: "687 Days",
    facts: [
      "Known as the Red Planet due to iron oxide (rust) on its surface.",
      "Home to Olympus Mons, the tallest volcano in the solar system.",
      "Features Valles Marineris, a canyon system far larger than the Grand Canyon.",
      "Has two tiny, potato-shaped moons: Phobos and Deimos.",
      "Atmosphere is incredibly thin and mostly carbon dioxide.",
      "Shows extensive evidence of ancient liquid water.",
      "Currently inhabited entirely by human-made robots.",
      "Average surface temperature is a frigid -60°C."
    ]
  },
  { 
    name: "Jupiter", color: "#ffaa00", size: 1.5, radius: 22, speed: 0.004, type: "Gas Giant", period: "12 Years",
    facts: [
      "The largest planet in our solar system.",
      "More than twice as massive as all other planets combined.",
      "The Great Red Spot is a giant storm that has raged for centuries.",
      "Has a very faint, dark ring system.",
      "Possesses 95 recognized moons, including Ganymede (larger than Mercury).",
      "Has the shortest day in the solar system (spins once every 10 hours).",
      "Made mostly of hydrogen and helium, like a star.",
      "Acts as a 'vacuum cleaner' protecting inner planets from asteroids."
    ]
  },
  { 
    name: "Saturn", color: "#ffff00", size: 1.2, radius: 28, speed: 0.003, type: "Gas Giant", period: "29 Years", hasRing: true,
    facts: [
      "Famous for its spectacular, complex ring system made of ice and rock.",
      "The least dense planet (it would float in a giant bathtub of water).",
      "Has 146 known moons, more than any other planet.",
      "Its moon Titan has a thick atmosphere and lakes of liquid methane.",
      "Features a bizarre hexagonal-shaped storm at its north pole.",
      "A gas giant composed primarily of hydrogen and helium.",
      "Experiences incredibly fast winds, reaching 1,800 km/h.",
      "Cannot support life as we know it."
    ]
  },
  { 
    name: "Uranus", color: "#00ffaa", size: 0.9, radius: 34, speed: 0.002, type: "Ice Giant", period: "84 Years", hasRing: true,
    facts: [
      "Rotates on its side with a 98-degree axial tilt.",
      "Classified as an 'Ice Giant' rather than a Gas Giant.",
      "Has the coldest planetary atmosphere in the solar system (-224°C).",
      "Gets its pale blue-green color from methane gas in its atmosphere.",
      "Has 27 known moons, named after characters from Shakespeare and Pope.",
      "Possesses a faint system of 13 inner and outer rings.",
      "First planet discovered using a telescope (by William Herschel in 1781).",
      "Experiences extreme seasons lasting 21 Earth years each."
    ]
  },
  { 
    name: "Neptune", color: "#0000ff", size: 0.8, radius: 39, speed: 0.001, type: "Ice Giant", period: "165 Years",
    facts: [
      "The most distant major planet in our solar system.",
      "Has the strongest winds in the solar system (up to 2,100 km/h).",
      "A dark, cold, and supersonic 'Ice Giant'.",
      "Its vivid blue color comes from an unknown atmospheric component and methane.",
      "Was mathematically predicted before it was actually observed.",
      "Has 14 known moons; the largest, Triton, orbits backward.",
      "Features transient, massive storms like the 'Great Dark Spot'.",
      "Only one spacecraft (Voyager 2) has ever visited it."
    ]
  }
];

// SUN DATA
const SUN_DATA = { 
  name: "Sun", type: "Yellow Dwarf Star", period: "N/A", color: "#ffcc00", size: 3,
  facts: [
    "Accounts for 99.86% of the mass in the entire solar system.",
    "A massive, glowing sphere of hot gas (plasma).",
    "Composed roughly of 73% hydrogen and 25% helium.",
    "Core temperature reaches a staggering 15 million degrees Celsius.",
    "About 4.6 billion years old, halfway through its main-sequence life.",
    "Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.",
    "Its gravity holds the entire solar system together.",
    "Produces energy through nuclear fusion in its core."
  ]
};

// --- ASTEROID BELT (INSTANCED MESH) ---
const AsteroidBelt = ({ timeScale, count = 2500 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const asteroids = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 17 + Math.random() * 3.5; 
      const y = (Math.random() - 0.5) * 1.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const rotX = Math.random() * Math.PI;
      const rotY = Math.random() * Math.PI;
      const rotZ = Math.random() * Math.PI;
      const scale = 0.03 + Math.random() * 0.08;
      temp.push({ x, y, z, rotX, rotY, rotZ, scale });
    }
    return temp;
  }, [count]);

  useEffect(() => {
    if (!meshRef.current) return;
    asteroids.forEach((asteroid, i) => {
      dummy.position.set(asteroid.x, asteroid.y, asteroid.z);
      dummy.rotation.set(asteroid.rotX, asteroid.rotY, asteroid.rotZ);
      dummy.scale.set(asteroid.scale, asteroid.scale, asteroid.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroids, dummy]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002 * timeScale;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#5588aa" wireframe={true} emissive="#224466" emissiveIntensity={0.5} transparent opacity={0.6} />
    </instancedMesh>
  );
};

// --- CAMERA TRACKER CONTROLLER ---
const CameraTracker = ({ selectedBody, controlsRef }) => {
  const { camera } = useThree();
  const targetPos = new THREE.Vector3();
  const cameraOffset = new THREE.Vector3();

  useFrame(() => {
    if (!controlsRef.current) return;
    if (selectedBody && selectedBody.objectRef?.current) {
      selectedBody.objectRef.current.getWorldPosition(targetPos);
      controlsRef.current.target.lerp(targetPos, 0.08);
      const distance = selectedBody.size * 6;
      cameraOffset.set(targetPos.x + distance, targetPos.y + distance * 0.5, targetPos.z + distance);
      camera.position.lerp(cameraOffset, 0.05);
    } else {
      controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
      cameraOffset.set(0, 20, 30);
      camera.position.lerp(cameraOffset, 0.05);
    }
    controlsRef.current.update();
  });

  return null;
};

// --- COMPONENTS ---
const OrbitPath = ({ radius, color }) => {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * 2 * Math.PI;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);
  return <Line points={points} color={color} lineWidth={1} transparent opacity={0.3} />;
};

const Planet = ({ data, onSelect, timeScale }) => {
  const groupRef = useRef();
  const meshRef = useRef();
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += data.speed * timeScale;
    }
  });

  return (
    <group ref={groupRef}>
      <OrbitPath radius={data.radius} color={data.color} />
      <group position={[data.radius, 0, 0]}>
        <Trail width={data.size * 3} length={data.size * 20} color={new THREE.Color(data.color)} attenuation={(t) => t * t} transparent opacity={0.8}>
          <mesh 
            ref={meshRef}
            onClick={(e) => {
              e.stopPropagation();
              onSelect({ ...data, objectRef: meshRef });
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'default'}
          >
            <sphereGeometry args={[data.size, 32, 32]} />
            <meshStandardMaterial color={data.color} wireframe={true} emissive={data.color} emissiveIntensity={0.8} />
          </mesh>
        </Trail>

        {data.hasRing && (
          <mesh rotation={[Math.PI / 2.2, 0, 0]}>
            <torusGeometry args={[data.size * 1.5, 0.05, 16, 100]} />
            <meshStandardMaterial color={data.color} wireframe={true} emissive={data.color} emissiveIntensity={1} />
          </mesh>
        )}
      </group>
    </group>
  );
};

const Sun = ({ onSelect }) => {
  const meshRef = useRef();
  return (
    <mesh 
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect({ ...SUN_DATA, objectRef: meshRef });
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'default'}
    >
      <sphereGeometry args={[3, 32, 32]} />
      <meshStandardMaterial color="#ffcc00" wireframe={true} emissive="#ffcc00" emissiveIntensity={2} />
      <pointLight color="#ffffff" intensity={2} distance={100} />
    </mesh>
  );
};

const SolarSystemScene = ({ selectedBody, onSelect, timeScale }) => {
  const controlsRef = useRef();
  return (
    <>
      <ambientLight intensity={0.1} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={['#020205', 30, 100]} />

      <OrbitControls ref={controlsRef} enablePan={true} enableZoom={true} enableRotate={true} />
      <CameraTracker selectedBody={selectedBody} controlsRef={controlsRef} />

      <Sun onSelect={onSelect} />
      <AsteroidBelt timeScale={timeScale} count={2500} />

      {PLANETS.map((planet) => (
        <Planet key={planet.name} data={planet} onSelect={onSelect} timeScale={timeScale} />
      ))}
    </>
  );
};

// --- APP ROOT ---
export default function App() {
  const [selectedBody, setSelectedBody] = useState(null);
  const [systemStarted, setSystemStarted] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  
  // NOTE: Ensure these files exist in your public/ folder!
  const ambientAudio = useRef(new Audio('/gravity-falls.mp3'));
  const clickAudio = useRef(new Audio('/ui-beep.mp3'));

  const handleStart = () => {
    setSystemStarted(true);
    ambientAudio.current.loop = true;
    ambientAudio.current.volume = 0.5; // Epic volume for epic music!
    ambientAudio.current.play().catch(e => console.log("Audio requires user interaction."));
  };

  const handleSelectBody = (bodyData) => {
    if (bodyData) {
      clickAudio.current.currentTime = 0;
      clickAudio.current.play().catch(e => console.log("Audio error"));
    }
    setSelectedBody(bodyData);
  };

  return (
    <>
      <div className={`start-screen ${systemStarted ? 'hidden' : ''}`}>
        <button className="start-btn" onClick={handleStart}>Initialize System</button>
      </div>

      <div className="ui-container">
        <div className={`info-panel ${selectedBody ? 'visible' : ''}`}>
          {selectedBody && (
            <>
              <h2 style={{ textShadow: `0 0 10px ${selectedBody.color}`, color: selectedBody.color, borderBottomColor: selectedBody.color }}>
                {selectedBody.name}
              </h2>
              <div className="info-row">
                <span className="info-label">Classification:</span>
                <span className="info-value">{selectedBody.type}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Orbit Period:</span>
                <span className="info-value">{selectedBody.period}</span>
              </div>
              
              <div className="facts-container" style={{ borderColor: `rgba(${selectedBody.color}, 0.3)` }}>
                <div className="facts-title" style={{ color: selectedBody.color }}>Scan Data</div>
                <ul className="fact-list">
                  {selectedBody.facts.map((fact, index) => (
                    <li key={index} className="fact-item">
                      <span style={{ color: selectedBody.color, position: 'absolute', left: 0 }}>{'>'}</span> 
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                className="close-btn" 
                style={{ borderColor: selectedBody.color, color: selectedBody.color }}
                onClick={() => handleSelectBody(null)}
              >
                Close Connection
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`time-control-panel ${!systemStarted ? 'hidden' : ''}`}>
        <span className="time-label">Time Dilator</span>
        <input 
          type="range" 
          className="time-slider" 
          min="0" 
          max="10" 
          step="0.1" 
          value={timeScale} 
          onChange={(e) => setTimeScale(parseFloat(e.target.value))} 
        />
        <span className="time-label">{timeScale.toFixed(1)}x</span>
      </div>

      <Canvas camera={{ position: [0, 20, 30], fov: 60 }}>
        {systemStarted && (
          <SolarSystemScene 
            selectedBody={selectedBody} 
            onSelect={handleSelectBody} 
            timeScale={timeScale} 
          />
        )}
      </Canvas>
    </>
  );
}
