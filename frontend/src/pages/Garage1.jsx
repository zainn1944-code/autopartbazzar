'use client';

import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Navbar from '@/components/ui/navbar';
import Footer from '@/components/ui/footer';

export default function Garage() {
  const [selectedParts, setSelectedParts] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [dropdowns, setDropdowns] = useState({});
  const [selectedBumperType, setSelectedBumperType] = useState(null);
  const [carModel, setCarModel] = useState(null);
  const [selectedColorName, setSelectedColorName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      function createGradientCanvas() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 256;
      
        // Grayscale gradient — dark but with contrast and depth
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#e5e5e5');  // Light Gray (near white)
        gradient.addColorStop(0.4, '#4b5563'); // Medium-dark Gray (Tailwind Gray-600)
        gradient.addColorStop(1, '#111827');  // Very dark gray (Tailwind Gray-900)
      
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      
        return canvas;
      }                
      let car;
      const scene = new THREE.Scene();
      const gradientTexture = new THREE.CanvasTexture(createGradientCanvas());
      scene.background = gradientTexture;


      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
      camera.position.set(0, 2, 6);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      const container = document.getElementById('garage');
      if (container) {
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
      }

// Brighter ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

// White spotlight from above
const spotLight = new THREE.SpotLight(0xffffff, 2, 50, Math.PI / 6, 0.2, 1.5);
spotLight.position.set(5, 10, 5);
spotLight.castShadow = true;
scene.add(spotLight);

// Stronger back light
const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
backLight.position.set(-5, 5, -5);
scene.add(backLight);

const loader = new GLTFLoader();

loader.load(
  '/CarModels/bmw.glb',
  (gltf) => {
    car = gltf.scene;
    car.scale.set(0.6, 0.6, 0.6);
    car.position.set(0, -0.3, 0);
    car.rotation.y = Math.PI; // <<< Rotate car to face the camera

    car.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Optional: log mesh names
        // console.log('Mesh:', child.name);
      }
    });                          
      
          scene.add(car);
          setCarModel(car);
        },
        undefined,
        (error) => {
          console.error('Error loading model:', error);
        }
      );      

      const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.8;
controls.enableZoom = false;  // Disable zoom
controls.maxPolarAngle = (1.5 * Math.PI) / 4; // Restrict upward view
controls.maxPolarAngle = Math.PI / 2; // Restrict downward view

      function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
      animate();
    }
  }, []);

  const loadTires = (tireModelPath) => {
    if (!carModel || !tireModelPath) return;

    const loader = new GLTFLoader();
    loader.load(tireModelPath, (gltf) => {
        const tireModel = gltf.scene;

        // Default scale and positions for generic tires
        let scale = { x: 1.9, y: 1.9, z: 1.9};
        let wheelPositions = [
            { x: 2.2, y: 0.9, z: 2.5 },  // Front Right
            { x: 2.2, y: 0.9, z: -5 }, // Rear Right
        ];
        let customRotation = { x: 0, y: Math.PI / 2, z: 0 }; // Default rotation (Y-axis)

        // Adjust for tire1.glb
        if (tireModelPath.includes("tire1.glb")) {
            scale = { x: 1.6, y: 1.6, z: 1.6 }; // Slightly larger tires
            wheelPositions = [
              { x: 2.4, y: 0.85, z: 2.5 },  // Front Right
              { x: 2.4, y: 0.85, z: -4.95 }, // Rear Right
            ];
            customRotation = { x: 0, y: Math.PI, z: 0 }; // Rotate **90° on Y-axis**
        }

        // Apply scale
        tireModel.scale.set(scale.x, scale.y, scale.z);

        // Remove old tires
        carModel.children = carModel.children.filter(child => !child.name.includes("tire"));

        // Clone and position tires
        wheelPositions.forEach((pos, index) => {
            const tireClone = tireModel.clone();
            tireClone.position.set(pos.x, pos.y, pos.z);
            tireClone.rotation.set(customRotation.x, customRotation.y, customRotation.z); // Apply Y-axis rotation
            tireClone.name = `tire_${index}`;
            carModel.add(tireClone);
        });
    });
};


  const loadBumper = (bumperModelPath) => {
    if (!carModel) return;

    const loader = new GLTFLoader();
    loader.load(bumperModelPath, (gltf) => {
        const bumperModel = gltf.scene;
        
        bumperModel.scale.set(0.69, 0.69, 0.69); // Maintain scaling

        bumperModel.position.set(0, 0.172, 0.82); // Adjust positioning
        
        bumperModel.rotation.set(0, -Math.PI / 2, 0); // Rotate -90 degrees to align with the car correctly
        
        
        
        
        // Remove old bumper if already added
        const oldBumper = carModel.getObjectByName("bumper");
        if (oldBumper) {
            carModel.remove(oldBumper);
        }

        // Set name and attach to car model
        bumperModel.name = "bumper";
        carModel.add(bumperModel);
    });
};

const loadXenonLights = (modelPath) => {
  if (!carModel || !modelPath) return;

  const loader = new GLTFLoader();
  loader.load(modelPath, (gltf) => {
      const rightLight = gltf.scene;

      // Set default values for Xenon Lights
      let scale = { x: 0.25, y: 0.2, z: 0.27 };
      let rightPosition = { x: 0.27, y: 0.285, z: 0.82 };
      let rightRotation = { x: 0.1, y: Math.PI / 1.4, z: 0.05 };

      // Check if it's the Civic Light model and adjust values
      if (modelPath.includes("civiclight.glb")) {
          scale = { x: 0.31, y: 0.25, z: 0.27 };
          rightPosition = { x: 0.265, y: 0.282, z: 0.78 }; 
          rightRotation = { x: 0.15, y: Math.PI / 1.4, z: 0.05 };
      }

      // Apply transformations
      rightLight.scale.set(scale.x, scale.y, scale.z);
      rightLight.position.set(rightPosition.x, rightPosition.y, rightPosition.z);
      rightLight.rotation.set(rightRotation.x, rightRotation.y, rightRotation.z);

      rightLight.name = "xenon_light_right";

      // Mirror for left light
      const leftLight = rightLight.clone();
      leftLight.position.set(-rightPosition.x, rightPosition.y, rightPosition.z);
      leftLight.rotation.set(rightRotation.x, -rightRotation.y, rightRotation.z);

      leftLight.name = "xenon_light_left";

      // Remove old lights before adding new ones
      carModel.children = carModel.children.filter(child => 
          child.name !== "xenon_light_right" && child.name !== "xenon_light_left"
      );

      carModel.add(rightLight);
      carModel.add(leftLight);
  });
};

const loadBackLights = (modelPath) => {
  if (!carModel || !modelPath) return;

  const loader = new GLTFLoader();
  loader.load(modelPath, (gltf) => {
    // Remove old custom lights first
    carModel.children = carModel.children.filter(child => 
      !child.name.includes("back_light")
    );

    // Create right light
    const rightLight = gltf.scene;
    rightLight.scale.set(0.25, 0.25, 0.25); // Increased scale for better visibility
    rightLight.position.set(0.45, 0.3, -0.78); // Adjusted X position to align with car body
    rightLight.rotation.set(0, Math.PI, 0);
    rightLight.name = "back_light_right";
    
    // Create left light (clone and mirror)
    const leftLight = rightLight.clone();
    leftLight.position.set(-0.35, 0.36, -0.85); // Mirror position on X axis
    leftLight.name = "back_light_left";
    
    // Add both lights to car model
    carModel.add(rightLight);
    carModel.add(leftLight);
    
    // Enhance visibility with emissive materials
    [rightLight, leftLight].forEach(light => {
      light.traverse((child) => {
        if (child.isMesh) {
          if (child.material) {
            // Clone the material to avoid affecting other objects
            child.material = child.material.clone();
            
            // Add emissive properties to make lights glow
            if (child.name.includes("glass") || child.name.includes("lens")) {
              child.material.emissive = new THREE.Color(0xff0000);
              child.material.emissiveIntensity = 0.8;
            }
          }
        }
      });
    });
  });
};

  const colorNames = {
    '#FF0000': 'Rallye Red',
    '#003E7E': 'Aegean Blue Metallic',
    '#C5C5C5': 'Sonic Gray Pearl',
    '#6C6F70': 'Urban Gray Pearl',
    '#F6F6F6': 'Platinum White Pearl',
    '#BCC5D3': 'Meteorite Gray Metallic',
    '#5A5A5F': 'Canyon River Blue Metallic'
  };

  const colors = Object.keys(colorNames);

  const handleColorSelection = (color) => {
    setSelectedColorName(colorNames[color]);

    if (carModel) {
      carModel.traverse((child) => {
          if (child.isMesh && child.name) {
            const bodyParts = [
              "hood", "door", "trumk", "fender", "frontfender", "rear", "rearpanel",
              "rearquarter", "quarterpanel", "quarter", "pillar", "sidepanel", "side",
              "apron", "panel", "shell", "chassis", "skirt", "cabin", "frame", "bumper","body"
            ];                   
  
              const blackParts = [
                  "grill", "splitter", "diffuser", "spoiler", "mirror", "vent", "lip", "wing", "scoop",,"front"
              ];
  
              const partName = child.name.toLowerCase();
              const isBodyPart = bodyParts.some(part => partName.includes(part));
              const isBlackPart = blackParts.some(part => partName.includes(part));
  
              // Debug: See what's getting matched
              // console.log(child.name, '->', isBodyPart ? 'body' : isBlackPart ? 'black' : 'other');
  
              if (isBodyPart) {
                  child.material = child.material.clone(); // Important: avoid sharing materials
                  child.material.color.set(new THREE.Color(color)); // Set selected color
                  child.material.needsUpdate = true;
              } else if (isBlackPart) {
                  child.material = child.material.clone();
                  child.material.color.set(new THREE.Color(0x000000)); // Black for accents
                  child.material.needsUpdate = true;
              }
          }
      });
  }  
};

  
  const parts = {
    tyres: [
      { name: 'Sport Tyres', price: 1200, img: '/Images/truck.png', model: '/models/tire.glb' },
      { name: 'Alloy rims', price: 1400, img: '/Images/car1.jpg', model: '/models/tire1.glb' },
    ],
    frontBumpers: [
      { name: 'Front Bumper', price: 1500, img: '/Images/car1.jpg', model: '/models/civicfbumper.glb' },
      { name: 'Front Bumper V2', price: 1700, img: '/Images/car2.jpg', model: '/models/civicfbumper1.glb' },
  ],  
    rearBumpers: [
      { name: 'Rear Bumper', price: 1300, img: '/Images/car1.jpg' },
      { name: 'Rear Bumper V2', price: 1500, img: '/Images/car2.jpg' },
      { name: 'Rear Bumper V3', price: 1700, img: '/Images/updated.jpg' }
    ],
    frontLights: [
      { name: 'Xenon Lights', price: 1350, img: '/Images/latest.jpg', model: '/models/civicrightlight.glb' },
      { name: 'Black Sports Lights', price: 1350, img: '/Images/background.jpg', model: '/models/civiclight.glb' }
    ],
    rearLights: [
      { name: 'Strip Lights', price: 1350, img: '/Images/latest.jpg', model: '/models/backlight.glb' },
    ]
  };
  

  const toggleDropdown = (category) => {
    setDropdowns((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handlePartSelection = (category, part, type = null) => {
    setSelectedParts((prev) => {
        let updatedParts = { ...prev };

        if (category === 'bumpers') {
            updatedParts[`${category}-${type}`] = part;
        } else {
            updatedParts[category] = part;
        }

        // Load tires if selected
        if (category === 'tyres') {
            loadTires(part.model);
        }

        // Load and overlap bumper if selected
        if (category === 'frontBumpers') {
            loadBumper(part.model);
        }

        // Load Xenon Lights if selected
        if (category === 'frontLights') {
            loadXenonLights(part.model);
        }

        // Load and overlap backlight.glb when Strip Lights are selected
        if (category === 'rearLights' && part.name === 'Strip Lights') {
            loadBackLights('/models/backlight.glb');
        }

        return updatedParts;
    });
};



  return (
    <div className="w-full h-screen flex flex-col bg-neutral-900/50 text-white">
      <Navbar />
      <div className="flex flex-grow w-full p-6 gap-6">
        {/* 3D Car Viewer */}
        <div className="flex-1 bg-gray-900 shadow-lg rounded-lg p-6 border border-gray-700 flex items-center justify-center">
          <div id="garage" className="w-full h-[500px]" />
        </div>

        {/* Customization Panel */}
        <div className="relative w-1/3 bg-gray-900 shadow-lg rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">BMW E46 Msport 2021</h2>
          <h3 className="text-md font-semibold text-red-500">Customization Options</h3>

          {/* Color Options */}
         {/* Color Options */}
         <div className="mt-4">
            <h4 className="text-white font-semibold">Choose Color:</h4>
            <div className="flex gap-2 mt-2">
              {colors.map((color) => (
                <div
                  key={color}
                  className="w-8 h-8 rounded-full border-2 cursor-pointer hover:scale-110 transition-all"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelection(color)}
                />
              ))}
            </div>

            {/* Display Selected Color Name */}
            {selectedColorName && (
              <p className="mt-2 text-sm text-gray-300 italic">
                Selected Color: <span className="font-semibold text-white">{selectedColorName}</span>
              </p>
            )}
             </div>
          {/* Parts Selection */}
          {Object.keys(parts).map((category) => (
  <div key={category} className="mt-4">
    <button
      className={`w-full p-2 rounded-lg transition-all ${
        dropdowns[category] ? 'bg-red-700/90' : 'bg-gray-700 hover:bg-red-600/80'
      }`}
      onClick={() => toggleDropdown(category)}
    >
      {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} {/* Converts camelCase to Title Case */}
    </button>

    {dropdowns[category] && (
      <div className="mt-2 p-2 bg-gray-800 rounded-lg">
        {parts[category].map((part) => (
          <button key={part.name} className="p-2 w-full bg-gray-700 hover:bg-red-600/80" onClick={() => handlePartSelection(category, part)}>
            {part.name}
          </button>
        ))}
      </div>
    )}
  </div>
))}
{/* Engine Control Buttons */}
<div className="absolute bottom-6 right-6 flex flex-row gap-4">
  {/* Start Engine Button */}
  <div>
    <button
      onClick={() => {
        const audio = document.getElementById('engine-audio');
        const btn = document.getElementById('engine-btn');

        if (audio.paused) {
          audio.play();
          btn.classList.add('ring-4', 'ring-yellow-400', 'shadow-xl');
        } else {
          audio.pause();
          audio.currentTime = 0;
          btn.classList.remove('ring-4', 'ring-yellow-400', 'shadow-xl');
        }

        audio.onended = () => {
          btn.classList.remove('ring-4', 'ring-yellow-400', 'shadow-xl');
        };
      }}
      id="engine-btn"
      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-full transition-all"
    >
      Start Engine
    </button>
    <audio id="engine-audio" src="/bmwstart.mp3" preload="auto" />
  </div>

  {/* Rev Engine Button */}
  <div>
    <button
      onClick={() => {
        const audio = document.getElementById('rev-audio');
        const btn = document.getElementById('rev-btn');

        if (audio.paused) {
          audio.play();
          btn.classList.add('ring-4', 'ring-yellow-400', 'shadow-xl');
        } else {
          audio.pause();
          audio.currentTime = 0;
          btn.classList.remove('ring-4', 'ring-yellow-400', 'shadow-xl');
        }

        audio.onended = () => {
          btn.classList.remove('ring-4', 'ring-yellow-400', 'shadow-xl');
        };
      }}
      id="rev-btn"
      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-full transition-all"
    >
      Rev Engine
    </button>
    <audio id="rev-audio" src="/bmwrev.mp3" preload="auto" />
  </div>
</div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
