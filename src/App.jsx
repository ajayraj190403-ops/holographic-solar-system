import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Line, Trail } from '@react-three/drei';
import * as THREE from 'three';
import './index.css';

// --- PLANETARY DATA ---
const PLANETS = [
  { name: "Mercury", color: "#00ffff", size: 0.4, radius: 6, speed: 0.02, type: "Terrestrial", period: "88 Days", facts: ["Smallest planet in our solar system.", "Closest planet to the Sun.", "Experiences extreme temperature swings (-173°C to 427°C)."] },
  { name: "Venus", color: "#ff00ff", size: 0.6, radius: 9, speed: 0.015, type: "Terrestrial", period: "225 Days", facts: ["Hottest planet in the solar system (around 465°C).", "Rotates backward (retrograde).", "Clouds are made of toxic sulfuric acid."] },
  { name: "Earth", color: "#0055ff", size: 0.7, radius: 12, speed: 0.01, type: "Terrestrial", period: "365 Days", facts: ["The only known planet to harbor life.", "Surface is approximately 71% water.", "Atmosphere is mostly nitrogen (78%) and oxygen (21%)."] },
  { name: "Mars", color: "#ff3300", size: 0.5, radius: 15, speed: 0.008, type: "Terrestrial", period: "687 Days", facts: ["Known as the Red Planet due to iron oxide (rust).", "Home to Olympus Mons, the tallest volcano.", "Currently inhabited entirely by human-made robots."] },
  { name: "Jupiter", color: "#ffaa00", size: 1.5, radius: 22, speed: 0.004, type: "Gas Giant", period: "12 Years", facts: ["The largest planet in our solar system.", "The Great Red Spot is a giant storm.", "Has the shortest day in the solar system (10 hours)."] },
  { name: "Saturn", color: "#ffff00", size: 1.2, radius: 28, speed: 0.003, type: "Gas Giant", period: "29 Years", hasRing: true, facts: ["Famous for its complex ring system made of ice and rock.", "The least dense planet.", "Experiences incredibly fast winds, reaching 1,800 km/h."] },
  { name: "Uranus", color: "#00ffaa", size: 0.9, radius: 34, speed: 0.002, type: "Ice Giant", period: "84 Years", hasRing: true, facts: ["Rotates on its side with a 98-degree axial tilt.", "Has the coldest planetary atmosphere (-224°C).", "Gets its pale blue-green color from methane gas."] },
  { name: "Neptune", color: "#0000ff", size: 0.8, radius: 39, speed: 0.001, type: "Ice Giant", period: "165 Years", facts: ["The most distant major planet.", "Has the strongest winds in the solar system.", "Its largest moon, Triton, orbits backward."] },
  { name: "Pluto", color: "#aaaaaa", size: 0.2, radius: 45, speed: 0.0005, type: "Dwarf Planet", period: "248 Years", facts: ["Reclassified as a dwarf planet in 2006.", "Has a massive heart-shaped nitrogen-ice glacier.", "Visited by the New Horizons spacecraft in 2015."] }
];

const SUN_DATA = { 
  name: "Sun", type: "Yellow Dwarf Star", period: "N/A", color: "#ffcc00", size: 3,
  facts: ["Accounts for 99.86% of the mass in the entire solar system.", "Core temperature reaches 15 million degrees Celsius.", "Produces energy through nuclear fusion in its core."]
};

// --- DEEP SPACE PHENOMENA DATA ---
const DEEP_SPACE_OBJECTS = [
  { 
    name: "BlackHole", displayName: "Sagittarius A*", color: "#000000", glowColor: "#ff4400", size: 1.5, radius: 65, speed: 0.0002, type: "Supermassive Black Hole", period: "N/A", style: "blackhole",
    facts: [
      "Located at the very center of the Milky Way galaxy.",
      "Has a mass 4 million times greater than our Sun.",
      "Its gravitational pull is so strong that not even light can escape.",
      "Surrounded by a superheated accretion disk of glowing gas.",
      "Time actively slows down the closer you get to its event horizon."
    ]
  },
  { 
    name: "WhiteHole", displayName: "White Hole", color: "#ffffff", glowColor: "#ffffff", size: 1.2, radius: 80, speed: 0.00015, type: "Hypothetical Phenomenon", period: "N/A", style: "whitehole",
    facts: [
      "A theoretical cosmic object that functions as the reverse of a black hole.",
      "Matter and light can exit a white hole, but nothing can enter it from the outside.",
      "Predicted by the mathematics of Einstein's Theory of General Relativity.",
      "Some scientists theorize the Big Bang was a massive white hole event.",
      "No white hole has ever been observed in reality."
    ]
  },
  { 
    name: "NeutronStar", displayName: "Pulsar RX J0806", color: "#00ffff", glowColor: "#00ffff", size: 0.3, radius: 95, speed: 0.0001, type: "Neutron Star", period: "N/A", style: "neutronstar",
    facts: [
      "The collapsed core of a massive supergiant star that exploded in a supernova.",
      "Incredibly dense: a single teaspoon of neutron star material weighs a billion tons.",
      "Spins hundreds of times per second, emitting massive beams of radiation.",
      "Has a magnetic field trillions of times stronger than Earth's.",
      "The crust is estimated to be 10 billion times stronger than steel."
    ]
  },
  { 
    name: "MilkyWay", displayName: "Milky Way", color: "#aa55ff", glowColor: "#aa55ff", size: 2.5, radius: 115, speed: 0.00005, type: "Spiral Galaxy", period: "250 Million Yrs", style: "galaxy",
    facts: [
      "Our home galaxy, containing an estimated 100 to 400 billion stars.",
      "Spans approximately 100,000 light-years across.",
      "Our Solar System is located in the Orion Arm, far from the galactic center.",
      "It takes our Sun 250 million years to orbit the galaxy once (a Galactic Year).",
      "Contains vast nebulae, star clusters, and billions of exoplanets."
    ]
  },
  { 
    name: "Andromeda", displayName: "Andromeda", color: "#ff00ff", glowColor: "#ff00ff", size: 3.0, radius: 135, speed: 0.00003, type: "Spiral Galaxy", period: "N/A", style: "galaxy",
    facts: [
      "The closest major galaxy to the Milky Way.",
      "Contains an estimated one trillion stars (more than double the Milky Way).",
      "Currently moving toward us at 110 kilometers per second.",
      "Expected to collide and merge with the Milky Way in about 4.5 billion years.",
      "Can be seen with the naked eye from Earth on very dark nights."
    ]
  }
];

// --- ASTEROID BELT ---
const AsteroidBelt = ({ timeScale, count = 2500 }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const asteroids = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 17 + Math.random() * 3.5; 
      const y = (Math.random() - 0.5) * 1.5;
      temp.push({ x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius, rotX: Math.random() * Math.PI, rotY: Math.random() * Math.PI, rotZ: Math.random() * Math.PI, scale: 0.03 + Math.random() * 0.08 });
    }
    return temp;
  }, [count]);

  useEffect(() => {
    if (!meshRef.current) return;
    asteroids.forEach((ast, i) => {
      dummy.position.set(ast.x, ast.y, ast.z);
      dummy.rotation.set(ast.rotX, ast.rotY, ast.rotZ);
      dummy.scale.set(ast.scale, ast.scale, ast.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [asteroids, dummy]);

  useFrame(() => { if (meshRef.current) meshRef.current.rotation.y += 0.002 * timeScale; });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#5588aa" wireframe={true} emissive="#224466" emissiveIntensity={0.5} transparent opacity={0.6} />
    </instancedMesh>
  );
};

// --- CAMERA TRACKER ---
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
const OrbitPath = ({ radius, color, dashed = false }) => {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * 2 * Math.PI;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);
  return <Line points={points} color={color} lineWidth={1} transparent opacity={dashed ? 0.15 : 0.3} dashed={dashed} dashScale={5} />;
};

const Planet = ({ data, onSelect, timeScale, targetUrl }) => {
  const groupRef = useRef();
  const meshRef = useRef();
  
  useEffect(() => {
    if (targetUrl === data.name.toLowerCase()) onSelect({ ...data, objectRef: meshRef });
  }, [targetUrl, data, onSelect]);

  useFrame(() => { if (groupRef.current) groupRef.current.rotation.y += data.speed * timeScale; });

  return (
    <group ref={groupRef}>
      <OrbitPath radius={data.radius} color={data.color} />
      <group position={[data.radius, 0, 0]}>
        <Trail width={data.size * 3} length={data.size * 20} color={new THREE.Color(data.color)} attenuation={(t) => t * t} transparent opacity={0.8}>
          <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onSelect({ ...data, objectRef: meshRef }); }}>
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

// Custom Component for Exotic Space Phenomena
const ExoticPhenomenon = ({ data, onSelect, timeScale, targetUrl }) => {
  const groupRef = useRef();
  const meshRef = useRef();
  
  useEffect(() => {
    if (targetUrl === data.name.toLowerCase()) onSelect({ ...data, objectRef: meshRef });
  }, [targetUrl, data, onSelect]);

  useFrame(() => { 
    if (groupRef.current) {
      groupRef.current.rotation.y += data.speed * timeScale;
      if (data.style === 'neutronstar' && meshRef.current) meshRef.current.rotation.y += 0.5 * timeScale;
      if (data.style === 'galaxy' && meshRef.current) meshRef.current.rotation.z += 0.005 * timeScale;
    }
  });

  return (
    <group ref={groupRef}>
      <OrbitPath radius={data.radius} color={data.color} dashed={true} />
      <group position={[data.radius, 0, 0]}>
        <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onSelect({ ...data, objectRef: meshRef }); }}>
          {data.style === 'galaxy' ? (
             <sphereGeometry args={[data.size * 0.5, 16, 16]} />
          ) : (
             <sphereGeometry args={[data.size, 32, 32]} />
          )}
          {data.style === 'blackhole' && <meshBasicMaterial color="black" />}
          {data.style === 'whitehole' && <meshStandardMaterial color="white" emissive="white" emissiveIntensity={5} />}
          {data.style === 'neutronstar' && <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={3} wireframe />}
          {data.style === 'galaxy' && <meshStandardMaterial color={data.glowColor} emissive={data.glowColor} emissiveIntensity={2} wireframe />}
        </mesh>
        {data.style === 'blackhole' && (
          <mesh rotation={[Math.PI / 2.2, 0, 0]}>
            <torusGeometry args={[data.size * 1.8, 0.15, 16, 100]} />
            <meshStandardMaterial color={data.glowColor} emissive={data.glowColor} emissiveIntensity={2} wireframe />
          </mesh>
        )}
        {data.style === 'neutronstar' && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, data.size * 8, 16]} />
            <meshStandardMaterial color={data.glowColor} emissive={data.glowColor} emissiveIntensity={4} />
          </mesh>
        )}
        {data.style === 'galaxy' && (
          <mesh rotation={[Math.PI / 2.5, 0, 0]}>
            <torusGeometry args={[data.size * 2, data.size * 0.4, 16, 64]} />
            <meshStandardMaterial color={data.glowColor} emissive={data.glowColor} emissiveIntensity={0.8} wireframe transparent opacity={0.4} />
          </mesh>
        )}
      </group>
    </group>
  );
};

const Sun = ({ onSelect, targetUrl }) => {
  const meshRef = useRef();
  useEffect(() => {
    if (targetUrl === 'sun') onSelect({ ...SUN_DATA, objectRef: meshRef });
  }, [targetUrl, onSelect]);

  return (
    <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onSelect({ ...SUN_DATA, objectRef: meshRef }); }}>
      <sphereGeometry args={[3, 32, 32]} />
      <meshStandardMaterial color="#ffcc00" wireframe={true} emissive="#ffcc00" emissiveIntensity={2} />
      <pointLight color="#ffffff" intensity={2} distance={200} />
    </mesh>
  );
};

const SolarSystemScene = ({ selectedBody, onSelect, timeScale, targetUrl }) => {
  const controlsRef = useRef();
  return (
    <>
      <ambientLight intensity={0.1} />
      <Stars radius={150} depth={50} count={7000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={['#020205', 40, 200]} />

      <OrbitControls ref={controlsRef} enablePan={true} enableZoom={true} enableRotate={true} maxDistance={150} />
      <CameraTracker selectedBody={selectedBody} controlsRef={controlsRef} />

      <Sun onSelect={onSelect} targetUrl={targetUrl} />
      <AsteroidBelt timeScale={timeScale} count={2500} />

      {PLANETS.map((planet) => (
        <Planet key={planet.name} data={planet} onSelect={onSelect} timeScale={timeScale} targetUrl={targetUrl} />
      ))}
      {DEEP_SPACE_OBJECTS.map((obj) => (
        <ExoticPhenomenon key={obj.name} data={obj} onSelect={onSelect} timeScale={timeScale} targetUrl={targetUrl} />
      ))}
    </>
  );
};

// --- APP ROOT ---
export default function App() {
  const [selectedBody, setSelectedBody] = useState(null);
  const [systemStarted, setSystemStarted] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [targetUrl, setTargetUrl] = useState(null);
  
  const ambientAudio = useRef(new Audio('/gravity-falls.mp3'));
  const clickAudio = useRef(new Audio('/ui-beep.mp3'));

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const lastSegment = pathParts[pathParts.length - 1];
    if (lastSegment) {
      setTargetUrl(lastSegment.toLowerCase());
    }
  }, []);

  const handleStart = () => {
    setSystemStarted(true);
    ambientAudio.current.loop = true;
    ambientAudio.current.volume = 0.5; 
    ambientAudio.current.play().catch(e => console.log("Audio requires user interaction."));
  };

  const handleSelectBody = (bodyData) => {
    if (bodyData) {
      clickAudio.current.currentTime = 0;
      clickAudio.current.play().catch(e => console.log("Audio error"));
      window.history.pushState({}, '', `/explore/${bodyData.name.toLowerCase()}`);
    } else {
      window.history.pushState({}, '', `/`);
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
              <h2 style={{ textShadow: `0 0 10px ${selectedBody.glowColor || selectedBody.color}`, color: selectedBody.glowColor || selectedBody.color, borderBottomColor: selectedBody.glowColor || selectedBody.color }}>
                {selectedBody.displayName || selectedBody.name}
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
                <div className="facts-title" style={{ color: selectedBody.glowColor || selectedBody.color }}>Scan Data</div>
                <ul className="fact-list">
                  {selectedBody.facts.map((fact, index) => (
                    <li key={index} className="fact-item">
                      <span style={{ color: selectedBody.glowColor || selectedBody.color, position: 'absolute', left: 0 }}>{'>'}</span> 
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                className="close-btn" 
                style={{ borderColor: selectedBody.glowColor || selectedBody.color, color: selectedBody.glowColor || selectedBody.color }}
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
        <input type="range" className="time-slider" min="0" max="10" step="0.1" value={timeScale} onChange={(e) => setTimeScale(parseFloat(e.target.value))} />
        <span className="time-label">{timeScale.toFixed(1)}x</span>
      </div>

      <Canvas camera={{ position: [0, 20, 30], fov: 60 }}>
        {systemStarted && (
          <SolarSystemScene selectedBody={selectedBody} onSelect={handleSelectBody} timeScale={timeScale} targetUrl={targetUrl} />
        )}
      </Canvas>
    </>
  );
}
