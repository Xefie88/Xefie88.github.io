//http-server -c-1
//http-server -c-1 -S -C cert.pem -K key.pem
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false,
});
const scene = new BABYLON.Scene(engine);

// XR Setup - Simple and stable configuration
scene.createDefaultXRExperienceAsync({
    floorMeshes: [],
    disableTeleportation: true,
    inputOptions: {
        doNotLoadControllerMeshes: false  // Enable controller meshes
    }
}).then(xrHelper => {
    console.log("WebXR initialized.");
    window.xrHelper = xrHelper; // Global reference
    window.leftThumbstick = null;

    // Simple controller setup
    xrHelper.input.onControllerAddedObservable.add((controller) => {
        console.log("Controller added:", controller.inputSource.handedness);
        
        controller.onMotionControllerInitObservable.add((motionController) => {
            console.log("Motion controller initialized for:", motionController.handness);
            
            // Ensure controller mesh is visible with enhanced materials
            if (motionController.rootMesh) {
                motionController.rootMesh.setEnabled(true);
                motionController.rootMesh.isVisible = true;
                
                // Make controller meshes glow
                motionController.rootMesh.getChildMeshes().forEach(mesh => {
                    mesh.setEnabled(true);
                    mesh.isVisible = true;
                    if (mesh.material) {
                        mesh.material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                        mesh.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
                    }
                });
            }
        });
    });

    // Enhanced controller setup with better pointer visibility
    xrHelper.input.onControllerAddedObservable.add((controller) => {
        console.log("Controller added:", controller.inputSource.handedness);
        
        controller.onMotionControllerInitObservable.add((motionController) => {
            console.log("Motion controller initialized for:", motionController.handness);
            
            // Ensure controller mesh is visible with enhanced materials
            if (motionController.rootMesh) {
                motionController.rootMesh.setEnabled(true);
                motionController.rootMesh.isVisible = true;
                
                // Make controller meshes glow with different colors for left/right
                const isLeft = motionController.handness === 'left';
                const emissiveColor = isLeft ? new BABYLON.Color3(0, 0.8, 0) : new BABYLON.Color3(0.8, 0, 0);
                
                motionController.rootMesh.getChildMeshes().forEach(mesh => {
                    mesh.setEnabled(true);
                    mesh.isVisible = true;
                    if (mesh.material) {
                        mesh.material.emissiveColor = emissiveColor;
                        mesh.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
                    }
                });
            }
            
            // Force pointer ray creation for this controller
            setTimeout(() => {
                createControllerPointer(controller, motionController);
            }, 100);
        });
    });

    // Function to create/enhance controller pointers
    function createControllerPointer(controller, motionController) {
        console.log("Creating pointer for controller:", motionController.handness);
        
        // Create a custom pointer ray if none exists
        if (!controller.pointer || !controller.pointer.isVisible) {
            const isLeft = motionController.handness === 'left';
            const rayColor = isLeft ? new BABYLON.Color3(0, 0.3, 0) : new BABYLON.Color3(0.3, 0, 0);
            
            // Create ray mesh - invisible but functional
            const ray = BABYLON.MeshBuilder.CreateCylinder("controllerRay_" + motionController.handness, {
                height: 10,
                diameterTop: 0.002,
                diameterBottom: 0.008,
                tessellation: 6
            }, scene);
            
            // Create transparent material
            const rayMaterial = new BABYLON.StandardMaterial("rayMat_" + motionController.handness, scene);
            rayMaterial.emissiveColor = rayColor;
            rayMaterial.disableLighting = true;
            rayMaterial.alpha = 0.0; // Completely transparent
            ray.material = rayMaterial;
            
            // Position ray relative to controller
            if (motionController.rootMesh) {
                ray.parent = motionController.rootMesh;
                ray.position = new BABYLON.Vector3(0, 0, 5);
                ray.rotation.x = Math.PI / 2;
                
                console.log("Custom pointer ray created for", motionController.handness, "controller");
            }
        }
    }

    // XR legend panel setup (hidden by default)

    // XR scale slider panel setup (hidden by default)
    if (typeof BABYLON.GUI !== "undefined") {
        if (scene.xrScalePanel) {
            scene.xrScalePanel.dispose();
        }
        const xrScalePanel = new BABYLON.GUI.StackPanel();
        xrScalePanel.width = "500px";
        xrScalePanel.height = "120px";
        xrScalePanel.background = "rgba(0,0,0,0.8)";
        xrScalePanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        xrScalePanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        xrScalePanel.isVisible = false;
        xrScalePanel.zIndex = 2000;

        const sliderLabel = new BABYLON.GUI.TextBlock();
        sliderLabel.text = "Scale: 1.00";
        sliderLabel.height = "40px";
        sliderLabel.color = "white";
        sliderLabel.fontSize = 24;
        sliderLabel.marginBottom = "10px";
        xrScalePanel.addControl(sliderLabel);

        const scaleSlider = new BABYLON.GUI.Slider();
        scaleSlider.minimum = -1;
        scaleSlider.maximum = 1;
        scaleSlider.value = 0;
        scaleSlider.height = "40px";
        scaleSlider.width = "400px";
        scaleSlider.color = "#00ff00";
        scaleSlider.background = "#333";
        scaleSlider.thumbWidth = "30px";
        scaleSlider.barOffset = "10px";
        xrScalePanel.addControl(scaleSlider);

        // n is the scale factor range (e.g., 10)
        const n = 10;
        let currentScale = 1;

        scaleSlider.onValueChangedObservable.add(value => {
            // Map slider value: -1 -> 1/n, 0 -> 1, 1 -> n
            let scale;
            if (value < 0) {
                scale = 1 / (1 + Math.abs(value) * (n - 1));
            } else if (value > 0) {
                scale = 1 + value * (n - 1);
            } else {
                scale = 1;
            }
            currentScale = scale;
            sliderLabel.text = "Scale: " + scale.toFixed(2);

        });

        if (!scene.xrScaleTexture) {
            scene.xrScaleTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("XRScaleUI");
        }
        scene.xrScaleTexture.addControl(xrScalePanel);
        scene.xrScalePanel = xrScalePanel;
        
        // L'indicateur VR 3D sera créé plus tard dans le code
        scene.vrTargetIndicator = null; // Sera initialisé plus tard

        // XR: Toggle scale panel with right A button
        xrHelper.input.onControllerAddedObservable.add(ctrl => {
            ctrl.onMotionControllerInitObservable.add(motionController => {
                if (motionController.handness === 'right') {
                    const aButton = motionController.getComponent("a-button");
                    if (aButton) {
                        aButton.onButtonStateChangedObservable.add(() => {
                            if (aButton.pressed) {
                                xrScalePanel.isVisible = !xrScalePanel.isVisible;
                            }
                        });
                    }
                }
            });
        });
    }
    if (typeof BABYLON.GUI !== "undefined") {
        if (scene.xrLegendPanel) {
            scene.xrLegendPanel.dispose();
        }
        const xrLegendPanel = new BABYLON.GUI.StackPanel();
        xrLegendPanel.width = "400px";
        xrLegendPanel.height = "600px";
        xrLegendPanel.background = "rgba(0,0,0,0.7)";
        xrLegendPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        xrLegendPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        xrLegendPanel.isVisible = false; // Hidden by default
        xrLegendPanel.paddingTop = "20px";
        xrLegendPanel.paddingLeft = "20px";
        xrLegendPanel.zIndex = 1000;
        scene.xrLegendPanel = xrLegendPanel;

        // Attach to fullscreen UI
        if (!scene.xrLegendTexture) {
            scene.xrLegendTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("XRLegendUI");
        }
        scene.xrLegendTexture.addControl(xrLegendPanel);

        // Toggle legend with right B button
        xrHelper.input.onControllerAddedObservable.add(ctrl => {
            ctrl.onMotionControllerInitObservable.add(motionController => {
                if (motionController.handness === 'right') {
                    const bButton = motionController.getComponent("b-button");
                    if (bButton) {
                        bButton.onButtonStateChangedObservable.add(() => {
                            if (bButton.pressed) {
                                xrLegendPanel.isVisible = !xrLegendPanel.isVisible;
                            }
                        });
                    }
                }
            });
        });
    }

    // Enable only MOVEMENT feature
    xrHelper.baseExperience.featuresManager.enableFeature(
        BABYLON.WebXRFeatureName.MOVEMENT, 'latest', {
            xrInput: xrHelper.input,
            movementSpeed: 0.4,
            rotationSpeed: 0.1,
            movementOrientationFollowsViewerPose: true
    });

    // UI Setup
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("SearchUI");
    const searchPanel = new BABYLON.GUI.StackPanel();
    Object.assign(searchPanel, {
        width: "400px",
        paddingTop: "20px",
        background: "rgba(255,255,255,0.7)",
        isVisible: false
    });
    advancedTexture.addControl(searchPanel);

    // Header
    const header = new BABYLON.GUI.TextBlock();
    Object.assign(header, {
        text: "Recherche de particule",
        height: "40px",
        color: "black",
        fontSize: 20
    });
    searchPanel.addControl(header);

    // Input
    const inputText = new BABYLON.GUI.InputText();
    Object.assign(inputText, {
        width: 0.8,
        maxWidth: 0.8,
        height: "40px",
        color: "black",
        background: "white",
        placeholderText: "Nom de particule..."
    });
    searchPanel.addControl(inputText);

    // Search Button
    const searchBtn = BABYLON.GUI.Button.CreateSimpleButton("searchBtn", "Rechercher");
    Object.assign(searchBtn, {
        width: 0.5,
        height: "40px",
        color: "white",
        background: "#007bff",
        cornerRadius: 5,
        thickness: 0,
        paddingTop: "10px"
    });
    searchPanel.addControl(searchBtn);

    // Search Result
    const searchResultText = new BABYLON.GUI.TextBlock();
    Object.assign(searchResultText, {
        height: "30px",
        color: "black",
        text: ""
    });
    searchPanel.addControl(searchResultText);

    // Keep panel facing camera
    scene.onBeforeRenderObservable.add(() => {
        if (searchPanel.isVisible) {
            const cam = scene.activeCamera;
            advancedTexture.layer.layerMask = cam.layerMask;
            searchPanel.linkWithMesh(null);
            searchPanel.isVertical = true;
        }
    });

    // Search action
    searchBtn.onPointerUpObservable.add(() => {
        const query = inputText.text.trim();
        if (query) {
            moveCameraToSprite(query);
            searchResultText.text = "Recherche : " + query;
        } else {
            searchResultText.text = "Entrer un nom valide.";
        }
    });

    // Toggle panel with X button (Quest 3) and handle trigger interactions
    xrHelper.input.onControllerAddedObservable.add(ctrl => {
        ctrl.onMotionControllerInitObservable.add(motionController => {
            if (motionController.handness === 'left') {
                // Debug: log all available components for this controller
                console.log("Left controller components:", Object.keys(motionController.components));
                const xButtonComponent = motionController.getComponent("x-button");
                if (xButtonComponent) {
                    xButtonComponent.onButtonStateChangedObservable.add(() => {
                        if (xButtonComponent.pressed) {
                            searchPanel.isVisible = !searchPanel.isVisible;
                            if (searchPanel.isVisible) {
                                inputText.text = "";
                                searchResultText.text = "";
                            }
                        }
                    });
                }
                
                // Mode démo avec bouton Y (contrôleur gauche)
                const yButtonComponent = motionController.getComponent("y-button");
                if (yButtonComponent) {
                    yButtonComponent.onButtonStateChangedObservable.add(() => {
                        if (yButtonComponent.pressed) {
                            toggleDemoModeVR();
                        }
                    });
                    console.log("Y button configured for demo mode on left controller");
                }
                
                // Trigger interaction pour navigation vers les étoiles (contrôleur gauche)
                const leftTrigger = motionController.getComponent("xr-standard-trigger");
                if (leftTrigger) {
                    leftTrigger.onButtonStateChangedObservable.add(() => {
                        if (leftTrigger.pressed) {
                            handleVRTriggerInteractionNew(ctrl, 'left');
                        }
                    });
                    console.log("Left trigger configured for star navigation");
                }
            }
            
            // Contrôleur droit
            if (motionController.handness === 'right') {
                // Trigger interaction pour navigation vers les étoiles (contrôleur droit)
                const rightTrigger = motionController.getComponent("xr-standard-trigger");
                if (rightTrigger) {
                    rightTrigger.onButtonStateChangedObservable.add(() => {
                        if (rightTrigger.pressed) {
                            handleVRTriggerInteractionNew(ctrl, 'right');
                        }
                    });
                    console.log("Right trigger configured for star navigation");
                }
            }
            
            // Add left joystick up/down to z translation
            const thumbstick = motionController.getComponent("xr-standard-thumbstick");
            if (thumbstick) {
                window.leftThumbstick = thumbstick;
            }
        });
    });

    // Enable POINTER_SELECTION for controller pointer ray selection
    try {
        const pointerFeature = xrHelper.baseExperience.featuresManager.enableFeature(
            BABYLON.WebXRFeatureName.POINTER_SELECTION, 'latest', {
                xrInput: xrHelper.input,
                enablePointerSelectionOnAllControllers: true
            }
        );
        
        console.log("Pointer selection feature enabled");
        
        // Store reference to the pointer feature for accessing selection data
        window.vrPointerFeature = pointerFeature;
        
        // Enhance existing pointer rays when they become available
        setTimeout(() => {
            xrHelper.input.controllers.forEach(controller => {
                if (controller.pointer) {
                    console.log("Enhancing pointer for controller:", controller.inputSource.handedness);
                    
                    // Make pointer ray more visible
                    if (controller.pointer.material) {
                        const isLeft = controller.inputSource.handedness === 'left';
                        controller.pointer.material.emissiveColor = isLeft ?
                            new BABYLON.Color3(0, 0.8, 0) : new BABYLON.Color3(0.8, 0, 0);
                        controller.pointer.material.alpha = 0.8; // Semi-transparent
                        controller.pointer.material.disableLighting = true;
                    }
                    
                    // Ensure pointer is visible
                    controller.pointer.setEnabled(true);
                    controller.pointer.isVisible = true;
                }
            });
        }, 2000);
        
    } catch (error) {
        console.log("Pointer selection feature not available:", error);
    }
});


scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

// Enhanced movement: left joystick controls Y (up/down) - SIMPLIFIED VERSION
let debugLogCount = 0;
const MAX_DEBUG_LOGS = 10; // Limit debug logs to avoid console spam

// Variable globale pour stocker la particule actuellement visée
let currentTargetedSprite = null;

scene.onBeforeRenderObservable.add(() => {
    // Détecter la particule visée en continu (fonction définie plus bas)
    if (typeof detectTargetedSprite === 'function') {
        detectTargetedSprite();
    }
    
    // Check if we're in VR mode and have controllers
    if (window.xrHelper && window.xrHelper.input && window.xrHelper.input.controllers.length > 0) {
        
        debugLogCount++;
        if (debugLogCount <= MAX_DEBUG_LOGS) {
            console.log("XR Controllers found:", window.xrHelper.input.controllers.length);
        }
        
        // Find left controller
        const leftController = window.xrHelper.input.controllers.find(c =>
            c.inputSource && c.inputSource.handedness === "left"
        );
        
        if (leftController) {
            if (debugLogCount <= MAX_DEBUG_LOGS) {
                console.log("Left controller found, checking for motion controller...");
            }
            
            // Method 1: Try motion controller components
            if (leftController.motionController) {
                const componentNames = ["xr-standard-thumbstick", "thumbstick", "trackpad"];
                
                for (const name of componentNames) {
                    const component = leftController.motionController.getComponent(name);
                    if (component && component.axes && component.axes.length >= 2) {
                        const yAxis = component.axes[1]; // Y axis (up/down)
                        
                        if (Math.abs(yAxis) > 0.1) { // Deadzone
                            const movementSpeed = 0.15;
                            const yDelta = -yAxis * movementSpeed; // Inverted for intuitive control
                            scene.activeCamera.position.y += yDelta;
                            
                            console.log(`VR VERTICAL MOVEMENT - Component: ${name}, Y-axis: ${yAxis.toFixed(2)}, Camera Y: ${scene.activeCamera.position.y.toFixed(2)}`);
                        }
                        break; // Found working component, stop searching
                    }
                }
                
                // Debug: Log available components (limited times)
                if (debugLogCount <= 3) {
                    const components = Object.keys(leftController.motionController.components);
                    console.log("Available motion controller components:", components);
                }
            }
            
            // Method 2: Direct gamepad access
            if (leftController.inputSource.gamepad) {
                const gamepad = leftController.inputSource.gamepad;
                if (gamepad.axes && gamepad.axes.length >= 4) {
                    const leftStickY = gamepad.axes[3]; // Standard left stick Y
                    
                    if (Math.abs(leftStickY) > 0.1) {
                        const movementSpeed = 0.15;
                        const yDelta = -leftStickY * movementSpeed;
                        scene.activeCamera.position.y += yDelta;
                        
                        console.log(`VR VERTICAL MOVEMENT - Gamepad Y: ${leftStickY.toFixed(2)}, Camera Y: ${scene.activeCamera.position.y.toFixed(2)}`);
                    }
                }
                
                // Debug: Log gamepad info (limited times)
                if (debugLogCount <= 3) {
                    console.log("Gamepad axes count:", gamepad.axes ? gamepad.axes.length : 0);
                    console.log("Gamepad buttons count:", gamepad.buttons ? gamepad.buttons.length : 0);
                }
            }
        } else if (debugLogCount <= MAX_DEBUG_LOGS) {
            console.log("No left controller found");
        }
    } else {
        // Not in VR mode - show this message only a few times
        if (debugLogCount <= 3) {
            console.log("Not in VR mode or no controllers available");
        }
        debugLogCount++;
    }
    
    // Alternative: Keyboard controls for testing on desktop
    if (!window.xrHelper || window.xrHelper.input.controllers.length === 0) {
        // Add keyboard controls for testing vertical movement
        if (scene.actionManager) {
            // This will be handled by keyboard events if we add them
        }
    }
});

// Add keyboard controls for testing vertical movement on desktop
document.addEventListener('keydown', (event) => {
    if (!window.xrHelper || window.xrHelper.input.controllers.length === 0) {
        const movementSpeed = 0.1;
        
        switch(event.key.toLowerCase()) {
            case 'q': // Q key for up
                scene.activeCamera.position.y += movementSpeed;
                console.log("KEYBOARD UP - Camera Y:", scene.activeCamera.position.y.toFixed(2));
                break;
            case 'e': // E key for down
                scene.activeCamera.position.y -= movementSpeed;
                console.log("KEYBOARD DOWN - Camera Y:", scene.activeCamera.position.y.toFixed(2));
                break;
        }
    }
});

var camera = new BABYLON.UniversalCamera("MyCamera", new BABYLON.Vector3(0, 1, 0), scene);
camera.minZ = 0.0001;
camera.attachControl(canvas, true);
camera.speed = 0.9;
camera.angularSpeed = 0.05;
camera.angle = Math.PI / 2;
camera.direction = new BABYLON.Vector3(Math.cos(camera.angle), 0, Math.sin(camera.angle));

// Create simulated VR controllers for desktop viewing
function createSimulatedControllers() {
    console.log("Creating simulated VR controllers for desktop viewing");
    
    try {
        // Left controller - green sphere
        const leftController = BABYLON.MeshBuilder.CreateSphere("leftController", {diameter: 0.2}, scene);
        leftController.position = new BABYLON.Vector3(-1.5, 1.2, 2);
        
        const leftMat = new BABYLON.StandardMaterial("leftControllerMat", scene);
        leftMat.diffuseColor = new BABYLON.Color3(0, 0.8, 0); // Green
        leftMat.emissiveColor = new BABYLON.Color3(0, 0.5, 0); // Bright glow
        leftMat.alpha = 0.0; // Completely transparent
        leftController.material = leftMat;
        
        // Right controller - red sphere
        const rightController = BABYLON.MeshBuilder.CreateSphere("rightController", {diameter: 0.2}, scene);
        rightController.position = new BABYLON.Vector3(1.5, 1.2, 2);
        
        const rightMat = new BABYLON.StandardMaterial("rightControllerMat", scene);
        rightMat.diffuseColor = new BABYLON.Color3(0.8, 0, 0); // Red
        rightMat.emissiveColor = new BABYLON.Color3(0.5, 0, 0); // Bright glow
        rightMat.alpha = 0.0; // Completely transparent
        rightController.material = rightMat;
        
        // Create static pointer rays using boxes (more stable than lines)
        const leftRay = BABYLON.MeshBuilder.CreateBox("leftRay", {
            width: 0.02,
            height: 0.02,
            depth: 8
        }, scene);
        leftRay.position = leftController.position.add(new BABYLON.Vector3(0, 0, 4));
        
        const leftRayMat = new BABYLON.StandardMaterial("leftRayMat", scene);
        leftRayMat.emissiveColor = new BABYLON.Color3(0, 0.3, 0); // Dimmed green
        leftRayMat.disableLighting = true;
        leftRayMat.alpha = 0.0; // Completely transparent
        leftRay.material = leftRayMat;
        
        const rightRay = BABYLON.MeshBuilder.CreateBox("rightRay", {
            width: 0.02,
            height: 0.02,
            depth: 8
        }, scene);
        rightRay.position = rightController.position.add(new BABYLON.Vector3(0, 0, 4));
        
        const rightRayMat = new BABYLON.StandardMaterial("rightRayMat", scene);
        rightRayMat.emissiveColor = new BABYLON.Color3(0.3, 0, 0); // Dimmed red
        rightRayMat.disableLighting = true;
        rightRayMat.alpha = 0.0; // Completely transparent
        rightRay.material = rightRayMat;
        
        // Parent rays to controllers for synchronized movement
        leftRay.parent = leftController;
        leftRay.position = new BABYLON.Vector3(0, 0, 4);
        
        rightRay.parent = rightController;
        rightRay.position = new BABYLON.Vector3(0, 0, 4);
        
        // Store references
        window.simulatedControllers = {
            left: leftController,
            right: rightController,
            leftRay: leftRay,
            rightRay: rightRay
        };
        
        // Simple floating animation - only move controllers, rays follow automatically
        let animTime = 0;
        const leftBasePos = leftController.position.clone();
        const rightBasePos = rightController.position.clone();
        
        scene.onBeforeRenderObservable.add(() => {
            if (window.simulatedControllers) {
                animTime += 0.02;
                
                // Gentle floating motion
                leftController.position.y = leftBasePos.y + Math.sin(animTime) * 0.15;
                rightController.position.y = rightBasePos.y + Math.sin(animTime + Math.PI) * 0.15;
                
                // Gentle rotation for visibility
                leftController.rotation.y = Math.sin(animTime * 0.5) * 0.3;
                rightController.rotation.y = Math.sin(animTime * 0.5 + Math.PI) * 0.3;
                
                // Keep transparent - no pulsing effect
                leftRayMat.alpha = 0.0;
                rightRayMat.alpha = 0.0;
            }
        });
        
        console.log("Simulated controllers created successfully with stable rays");
    } catch (error) {
        console.error("Error creating simulated controllers:", error);
    }
}

// Create simulated controllers for desktop viewing
createSimulatedControllers();


scene.onPointerObservable.add((pointerInfo) => {
  switch (pointerInfo.type) {
    case BABYLON.PointerEventTypes.POINTERPICK:
      if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedSprite) {
        // Select the picked sprite (particle)
        const pickedName = pointerInfo.pickInfo.pickedSprite.name;
        searchInput.value = pickedName;
        moveCameraToSprite(pickedName);
      }
      break;
	 }
});


//const cameraDirection = camera.getForwardRay().direction.normalize();
//const fov = camera.fov; // Champs de vision de la caméra
//const cameraPosition = camera.position;
//const cameraGetTarget = camera.getTarget();

const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 1;

let time = 0;
let blinkCount = 0;

// Initialise le compteur et le seuil
let frameCounter = 0;
const frameThreshold = 20; // Ajustez ce nombre pour changer la fréquence

// Variables pour le mode démo VR
let demoModeActive = false;
let demoInterval = null;
let currentDemoGroupIndex = 0;
let demoGroups = [];
const demoPauseDuration = 3000; // 3 secondes de pause à chaque groupe

//var font = "Calibri 20px monospace";

const scatter = new BABYLON.PointsCloudSystem("scatter", 0, scene);

const labelSprites = [];
const originalPositions = [];

// Create scatter mesh and label sprites
//const imageUrl = 'bubble12.png';
//const imageSize = 5000;

const imageUrl = 'etoile2.png';
const imageSize = 640;
const spriteRatio = 1;


function main(currentData, ratio) {
    // Prepare data with scaled positions and color
    const data = currentData.map(d => ({
        ...d,
        x: d.x * ratio,
        y: d.y * ratio,
        z: d.z * ratio,
        color: getColor(d.subType),
        metadata: { subType: d.subType }
    }));

    // Sprite manager
    const labelSpriteManager = new BABYLON.SpriteManager('labelSpriteManager', imageUrl, data.length, imageSize, scene);
    labelSpriteManager.isPickable = true;

    // Helper to create a sprite and attach actions
    function createLabelSprite(point, idx) {
        const position = new BABYLON.Vector3(point.x, point.y, point.z);
        originalPositions.push(position.clone());

        const sprite = new BABYLON.Sprite(point.prefLabel, labelSpriteManager);
        Object.assign(sprite, {
            isPickable: true,
            position,
            originalPosition: originalPositions[idx],
            size: spriteRatio,
            color: new BABYLON.Color4(point.color.r, point.color.g, point.color.b, 1),
            metadata: { subType: point.subType },
            isVisible: true
        });

        sprite.actionManager = new BABYLON.ActionManager(scene);

        // Mouse over: update nearest list and search input
        sprite.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            evt => {
                const spriteName = evt.source.name;
                const sprites = scene.spriteManagers[0].sprites;
                const targetSprite = sprites.find(s => s.name === spriteName);
                const distances = sprites.filter(s => s.isVisible).map(s => ({
                    name: s.name,
                    distance: BABYLON.Vector3.Distance(targetSprite.originalPosition, s.originalPosition)
                })).sort((a, b) => a.distance - b.distance);
                updateNearestList(distances, spriteName, targetSprite.metadata.subType);
                searchInput.value = spriteName;
            }
        ));

        // Click: move camera to sprite
        sprite.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickUpTrigger,
            evt => {
                searchInput.value = evt.source.name;
                moveCameraToSprite(evt.source.name);
            }
        ));

        labelSprites.push(sprite);
    }

    scatter.addPoints(data.length, (particle) => {
        createLabelSprite(data[particle.idx], particle.idx);
        particle.position = originalPositions[particle.idx];
    });

scene.onBeforeRenderObservable.add(() => {
	
	updateSpritePositions();
	
	frameCounter++;
    if (frameCounter > frameThreshold) {
        frameCounter = 0;  // Réinitialise le compteur
		
    var names = [];

    // CETTE ligne-ci est critique :
    const camera = scene.activeCamera; 
	
		const cameraDirection = camera.getForwardRay().direction.normalize();
		const fov = camera.fov; // Champs de vision de la caméra
		const cameraPosition = camera.position;
	
    scene.spriteManagers[0].sprites.map(s => {
        var width = engine.getRenderWidth();
        var height = engine.getRenderHeight();
        var identityMatrix = BABYLON.Matrix.Identity();
        var getTransformMatrix = scene.getTransformMatrix();
        var toGlobal = camera.viewport.toGlobal(width, height);
        const projectedPosition = BABYLON.Vector3.Project(
            s.position,
            identityMatrix,
            getTransformMatrix,
            toGlobal
        );
		
		const spriteDirection = s.position.subtract(cameraPosition).normalize();
		const angle = Math.acos(BABYLON.Vector3.Dot(cameraDirection, spriteDirection));
		
        const distance = BABYLON.Vector3.Distance(camera.position, s.position);
		
        if (distance > 2 && distance < 12 && angle < fov && s.isVisible) {
            names.push({
                "name": s.name + '_layer',
                "meshName": s.name + '_whoz_mesh',
                "matName": s.name + '_whoz_mat',
                "textureName": s.name,
				"color": s.color,
                "position": s.position
            });
        }
    });

    // Dispose of unused meshes
    scene.meshes
        .filter(mesh => mesh.name.endsWith('_whoz_mesh') && !names.some(n => n.meshName === mesh.name))
        .forEach(mesh => {
            if (mesh.material) {
                if (mesh.material.emissiveTexture) {
                    mesh.material.emissiveTexture.dispose(); // Dispose the emissive texture
                }
                mesh.material.dispose(); // Dispose the material
            }
            scene.removeMesh(mesh);
            mesh.dispose(); // Dispose the mesh
        });

    // Dispose of unused materials
    scene.materials
        .filter(material => material.name.endsWith('_whoz_mat') && !names.some(n => n.matName === material.name))
        .forEach(material => {
            if (material.emissiveTexture) {
                material.emissiveTexture.dispose(); // Dispose the emissive texture
            }
            scene.removeMaterial(material);
            material.dispose(); // Dispose the material
        });

    names.forEach(n => {
        if (!scene.meshes.some(l => l.name === n.meshName)) {
            const font_size = 12
            const planeTexture = new BABYLON.DynamicTexture("dynamic texture", font_size*100, scene, true, BABYLON.DynamicTexture.TRILINEAR_SAMPLINGMODE);
			
			var textureContext = planeTexture.getContext();
			
			//Draw on canvas
			textureContext.lineWidth = 2;
			textureContext.beginPath();
			textureContext.arc(font_size*50, font_size*50, 30, -Math.PI/5, Math.PI/5);
			textureContext.strokeStyle = "rgba("+255*n.color.r+", "+255*n.color.g+", "+255*n.color.b+", 0.7)";
			textureContext.stroke();
			
			textureContext.beginPath();
			textureContext.arc(font_size*50, font_size*50, 30, -Math.PI/5 + Math.PI, Math.PI/5 + Math.PI);
			textureContext.stroke();
			
			planeTexture.update();
			
			
            planeTexture.drawText(n.textureName, null, (font_size*53), "" + font_size + "px system-ui", "white", "transparent", true, true);
            var material = new BABYLON.StandardMaterial(n.textureName + '_whoz_mat', scene);
            material.emissiveTexture = planeTexture;
            material.opacityTexture = planeTexture;
            material.backFaceCulling = true;
            material.disableLighting = true;
            material.freeze();

			var outputplane = BABYLON.Mesh.CreatePlane(n.textureName + '_whoz_mesh', font_size, scene, false);
            outputplane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
            outputplane.isVisible = true;
            outputplane.position = n.position;
            outputplane.material = material;
        }
    });
	}
});

scatter.buildMeshAsync().then(mesh => {
    mesh.material = new BABYLON.StandardMaterial('scatterMaterial', scene);
    mesh.material.pointSize = 10;
    mesh.material.usePointSizing = true;
    mesh.material.disableLighting = true;
    mesh.material.pointColor = new BABYLON.Color3(1, 1, 1);
});

engine.runRenderLoop(renderLoop);

// Resize the engine on window resize
    window.addEventListener('resize', function () {
        engine.resize();
    });


    createLegend(data);
 updateParticleList();
 
 // Créer l'indicateur VR 3D après le chargement des données
 if (!scene.vrTargetIndicator) {
  scene.vrTargetIndicator = createVRTargetIndicator(scene);
 }
 
}

const showPasswordModal = () => {
    return new Promise((resolve) => {
        const passwordModal = document.getElementById('passwordModal');
        const passwordInput = document.getElementById('passwordInput');
        const submitPasswordButton = document.getElementById('submitPasswordButton');

        passwordModal.style.display = 'block'; 
        passwordInput.value = ''; 
        passwordInput.focus(); 

        const submitHandler = () => {
            const password = passwordInput.value;
            passwordModal.style.display = 'none';
            submitPasswordButton.removeEventListener('click', submitHandler);
            resolve(password);
        };

        submitPasswordButton.addEventListener('click', submitHandler);
    });
};

const loadFileButton = document.getElementById('loadFileButton');

document.addEventListener("DOMContentLoaded", function() {

    //createLegend(data);
	//updateParticleList();

    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function(event) {
            event.preventDefault();
			 const spriteName = document.getElementById('searchInput').value;
            moveCameraToSprite(spriteName);
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // This prevents any default form submitting
    const spriteName = document.getElementById('searchInput').value;
    searchInput.blur();
                moveCameraToSprite(spriteName);
            }
        });
  
  searchInput.addEventListener('focus', function(event) {
            searchInput.value = '';
        });

        searchInput.addEventListener('change', function(event) {
   const spriteName = document.getElementById('searchInput').value;
            moveCameraToSprite(spriteName);
        });
    }

});

loadFileButton.addEventListener('click', async () => {
    const fileSelect = document.getElementById('fileSelect');
    const selectedFile = fileSelect.value;

    if (selectedFile) {
        try {
            if (selectedFile === 'encrypted_PSO_0.json') {
                // Handle encrypted file
                const password = await showPasswordModal();
                const response = await fetch('./' + selectedFile);
                const encryptedData = await response.text();
                const decryptedData = decryptData(encryptedData, password);
                
                if (decryptedData) {
                    main(decryptedData, 20);
                    document.getElementById('fileInputContainer').style.display = 'none';
                }
            } else {
                // Handle regular JSON file
                const response = await fetch('./' + selectedFile);
                const data = await response.json();
                main(data, 20);
                document.getElementById('fileInputContainer').style.display = 'none';
            }
        } catch (error) {
            alert('Erreur lors du chargement du fichier: ' + error.message);
            console.error(error);
        }
    } else {
        try {
            // Use test data as default
            const response = await fetch('./test_particles.json');
            const data = await response.json();
            main(data, 20);
            document.getElementById('fileInputContainer').style.display = 'none';
        } catch (error) {
            console.error("Failed to load default JSON:", error);
        }
    }
});

const generatedColors = {};
function getColor(type) {
    // No hardcoded colors, all subTypes get random colors

    if (generatedColors[type]) {
        return generatedColors[type];
    }
    // Generate and store a random color for this subType
    const randColor = {
        r: Math.random(),
        g: Math.random(),
        b: Math.random()
    };
    generatedColors[type] = randColor;
    return randColor;
}

// Update sprite positions to add small movements
function updateSpritePositions() {
    time += 0.004;
	const camera = scene.activeCamera; 
	const cameraDirection = camera.getForwardRay().direction.normalize();
	const fov = camera.fov; // Champs de vision de la caméra
	const cameraPosition = camera.position;
	const cameraGetTarget = camera.getTarget();

	labelSprites.forEach((sprite, idx) => {
		const distance = BABYLON.Vector3.Distance(cameraPosition, sprite.position);
		
		if (distance < 150) {
			const spriteDirection = sprite.position.subtract(cameraPosition).normalize();
			const angle = Math.acos(BABYLON.Vector3.Dot(cameraDirection, spriteDirection));
			if( angle < fov) {
				const originalPosition = originalPositions[idx];
				sprite.position.x = originalPosition.x + 0.8 * Math.sin(time + idx);
				sprite.position.y = originalPosition.y + 0.8 * Math.cos(time + idx);
				sprite.position.z = originalPosition.z + 0.8 * Math.sin(time + idx);
				sprite.angle = 0.01*idx;
			}
		}
    });
}

// Start rendering the scene on each animation frame
function renderLoop() {
    scene.render();
}

function blinkSprite(sprite) {
    let isDefaultColor = true; // État du sprite, vrai si la couleur par défaut est affichée
    const defaultColor = sprite.color
    const highlightColor = new BABYLON.Color4(1, 1, 1, 1);
	const mediumMediumlightColor = new BABYLON.Color4((sprite.color.r+1)/2, (sprite.color.g+1)/2, (sprite.color.b+1)/2, (sprite.color.a+1)/2);
	const mediumLowlightColor = new BABYLON.Color4((3*sprite.color.r+1)/4, (3*sprite.color.g+1)/4, (3*sprite.color.b+1)/4, (3*sprite.color.a+1)/4);
	const mediumHighlightColor = new BABYLON.Color4((sprite.color.r+3)/4, (sprite.color.g+3)/4, (sprite.color.b+3)/4, (sprite.color.a+3)/4);

    // Configure l'intervalle de clignotement
    setInterval(() => {
		blinkCount+=1
		
		var moduloBlink = blinkCount % 8;
		
        if (moduloBlink == 0) {
            sprite.color = defaultColor;
            isDefaultColor = true;
        } else if (moduloBlink == 1 || moduloBlink == 7) {
            sprite.color = mediumLowlightColor;
            isDefaultColor = false;
        } else if (moduloBlink == 2 || moduloBlink == 6) {
            sprite.color = mediumMediumlightColor;
            isDefaultColor = false;
        } else if (moduloBlink == 3 || moduloBlink == 5) {
            sprite.color = mediumHighlightColor;
            isDefaultColor = false;
        } else {
            sprite.color = highlightColor;
            isDefaultColor = false;
        }
    }, 200); // Durée du clignotement en millisecondes
}

function moveCameraToSprite(spriteName) {
	console.log('move to',spriteName);

    const camera = scene.activeCamera; 

    const sprites = scene.spriteManagers[0].sprites; // Assuming the first sprite manager
    let targetSprite = sprites.find(s => s.name === spriteName);

    if (targetSprite) {
        const targetPosition = new BABYLON.Vector3(targetSprite.position.x, targetSprite.position.y, targetSprite.position.z);
        const cameraStartPosition = camera.position.clone();
        const cameraStartTarget = camera.getTarget().clone();

        const bufferDistance = 9; // Adjust the distance from sprite
        const directionVector = targetPosition.subtract(camera.position).normalize();
        const adjustedTargetPosition = targetPosition.subtract(directionVector.scale(bufferDistance));


		const moveDistance = BABYLON.Vector3.Distance(cameraStartPosition, adjustedTargetPosition);
		const numberOfFrames = Math.min(300,Math.max(60,Math.round(moveDistance * 4)));
		
		// Create animation for camera position (ralenti pour VR)
		      const animCamPosition = new BABYLON.Animation("animCamPosition", "position", 15, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
		      animCamPosition.setKeys([{frame: 0, value: cameraStartPosition},{frame: numberOfFrames, value: adjustedTargetPosition}]);

		      // Create animation for camera target (ralenti pour VR)
		      const animCamTarget = new BABYLON.Animation("animCamTarget", "target", 15, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
		      animCamTarget.setKeys([{frame: 0, value: cameraStartTarget},{  frame: numberOfFrames, value: targetPosition}]);

		      // Démarrer l'animation et attendre qu'elle se termine avant la pause
		      const animationGroup = scene.beginDirectAnimation(camera, [animCamPosition, animCamTarget], 0, numberOfFrames, false);

		      blinkSprite(targetSprite);
		      
		      // Retourner la promesse d'animation pour pouvoir attendre sa fin
		      return new Promise((resolve) => {
		          animationGroup.onAnimationEndObservable.addOnce(() => {
		              resolve();
		          });
		      });

        // Find the nearest particles
        let distances = sprites.filter(s => s.isVisible).map(sprite => {
            return {
                name: sprite.name,
                distance: BABYLON.Vector3.Distance(targetSprite.originalPosition, sprite.originalPosition)
            };
        });
        distances.sort((a, b) => a.distance - b.distance);
		
		updateNearestList(distances, spriteName, targetSprite.metadata.subType)
		
    } else {
        console.log("Sprite not found: " + spriteName);
    }
}

function updateNearestList(distances, spriteName, subType) {
		// Get top 100 nearest particles
        let nearestParticles = distances.slice(1, 101);

        // Update the nearest list
		const nearestList = document.getElementById('nearestList');
			nearestList.innerHTML = '';
			let i=0
			
			
		let listItem = document.createElement('li');
			listItem.className = 'nearest-item first-item';
			listItem.textContent = `${spriteName} (${subType})`;
		
		nearestList.appendChild(listItem);
		
		nearestParticles.forEach(particle => {
			i=i+1;
			let listItem = document.createElement('li');
				listItem.className = 'nearest-item';
				listItem.textContent = `${i} : ${particle.name} (${particle.distance.toFixed(2)})`;

				// Ajouter un écouteur d'événements click à chaque élément de la liste
				listItem.addEventListener('click', function() {
					searchInput.value = particle.name;
					moveCameraToSprite(particle.name);
				});

			nearestList.appendChild(listItem);
		});
}

function createLegend(data) {
    const uniqueTypes = [...new Set(data.map(item => item.subType))];
    const legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = '';

    // Fill XR legend panel if it exists
    if (scene.xrLegendPanel) {
        scene.xrLegendPanel.clearControls();
        uniqueTypes.sort().forEach(type => {
            const color = getColor(type);
            const legendItem = new BABYLON.GUI.StackPanel();
            legendItem.isVertical = false;
            legendItem.height = "30px";
            legendItem.paddingBottom = "5px";

            const colorBox = new BABYLON.GUI.Rectangle();
            colorBox.width = "30px";
            colorBox.height = "30px";
            colorBox.color = "white";
            colorBox.thickness = 1;
            // Set initial opacity based on state
            if (!window.xrLegendActiveTypes) window.xrLegendActiveTypes = {};
            const isActive = window.xrLegendActiveTypes[type] !== false;
            colorBox.background = `rgba(${Math.round(color.r*255)},${Math.round(color.g*255)},${Math.round(color.b*255)},${isActive ? 1 : 0.3})`;

            const label = new BABYLON.GUI.TextBlock();
            label.text = type;
            label.color = "white";
            label.height = "30px";
            label.width = "320px";
            label.paddingLeft = "20px";
            label.fontSize = 22;
            label.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            label.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            label.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

            legendItem.addControl(colorBox);
            legendItem.addControl(label);
            scene.xrLegendPanel.addControl(legendItem);

            // XR: Click to filter by subType using existing function
            legendItem.onPointerClickObservable.add(() => {
                filterByType(type);
                // Toggle state and update colorBox opacity
                window.xrLegendActiveTypes[type] = !window.xrLegendActiveTypes[type];
                const active = window.xrLegendActiveTypes[type] !== false;
                colorBox.background = `rgba(${Math.round(color.r*255)},${Math.round(color.g*255)},${Math.round(color.b*255)},${active ? 0.3 : 1})`;
            });
        });
    }

	//const totalLinesElement = document.createElement('div');
	//totalLinesElement.className = 'legend-total';
    //totalLinesElement.textContent = `Count: ${data.length}`;
    //legendContainer.appendChild(totalLinesElement);
	
	console.log('count:', data.length);
	
    uniqueTypes.sort().forEach(type => {
        const color = `rgb(${getColor(type).r * 255}, ${getColor(type).g * 255}, ${getColor(type).b * 255})`;
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.dataset.type = type;
        legendItem.dataset.active = 'true'; // By default, all items are active

        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = color;

        const label = document.createElement('span');
        label.textContent = type;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);

        // Add event listener for click
        legendItem.addEventListener('click', function() {
            filterByType(type);
            toggleLegendItemColor(legendItem);
        });
    });
}

// Function to filter sprites by type
function filterByType(type) {
    scene.spriteManagers[0].sprites.forEach(sprite => {
		if (sprite.metadata && sprite.metadata.subType === type) {
            sprite.isVisible = !sprite.isVisible;
        }
    });
	
	updateParticleList();
}

// Function to toggle the legend item color
function toggleLegendItemColor(legendItem) {
    const isActive = legendItem.dataset.active === 'true';
    if (isActive) {
        legendItem.style.opacity = 0.5; // Make the color lighter
    } else {
        legendItem.style.opacity = 1.0; // Restore the original color
    }
    legendItem.dataset.active = (!isActive).toString();
}

// Function to update the datalist options based on particle visibility
function updateParticleList() {
	
    const dataList = document.getElementById('particlesList');
    dataList.innerHTML = ''; // Clear existing items

    const particleNames = scene.spriteManagers[0].sprites
        .filter(sprite => sprite.isVisible)
        .map(sprite => sprite.name);
    
    particleNames.forEach(name => {
        let option = document.createElement('option');
        option.value = name;
        dataList.appendChild(option);
    });
}

function decryptData(encryptedData, password) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, password);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        return decryptedData;
    } catch (e) {
        alert('Le mot de passe est incorrect ou les données sont invalides.');
        console.error(e);
        return null;
    }
}

// Fonctions pour le mode démo VR
function toggleDemoModeVR() {
    if (demoModeActive) {
        stopDemoModeVR();
    } else {
        startDemoModeVR();
    }
}

function startDemoModeVR() {
    if (!scene.spriteManagers[0] || !scene.spriteManagers[0].sprites.length) {
        console.log('Aucune étoile disponible pour le mode démo VR');
        return;
    }

    demoModeActive = true;
    console.log('Mode démo VR démarré - Contrôle: Bouton Y pour arrêter');

    createDemoGroupsVR();
    currentDemoGroupIndex = 0;
    nextDemoGroupVR();
}

function stopDemoModeVR() {
    demoModeActive = false;
    console.log('Mode démo VR arrêté');

    if (demoInterval) {
        clearTimeout(demoInterval);
        demoInterval = null;
    }
    
    currentDemoGroupIndex = 0;
}

function createDemoGroupsVR() {
    // Créer des groupes d'étoiles basés sur les types (subType)
    const sprites = scene.spriteManagers[0].sprites.filter(s => s.isVisible);
    const groupsByType = {};
    
    sprites.forEach(sprite => {
        const subType = sprite.metadata ? sprite.metadata.subType : 'DEFAULT';
        if (!groupsByType[subType]) {
            groupsByType[subType] = [];
        }
        groupsByType[subType].push(sprite);
    });

    // Convertir en tableau de groupes et prendre quelques étoiles représentatives de chaque type
    demoGroups = [];
    Object.keys(groupsByType).forEach(subType => {
        const spritesOfType = groupsByType[subType];
        // Prendre jusqu'à 3 étoiles par type pour éviter trop de longueur
        const selectedSprites = spritesOfType.slice(0, Math.min(3, spritesOfType.length));
        
        selectedSprites.forEach(sprite => {
            demoGroups.push({
                sprite: sprite,
                groupName: subType
            });
        });
    });

    console.log(`Mode démo VR créé avec ${demoGroups.length} étoiles dans ${Object.keys(groupsByType).length} groupes`);
}

async function nextDemoGroupVR() {
    if (!demoModeActive || currentDemoGroupIndex >= demoGroups.length) {
        stopDemoModeVR();
        return;
    }

    const currentGroup = demoGroups[currentDemoGroupIndex];
    const spriteName = currentGroup.sprite.name;
    const groupName = currentGroup.groupName;
    
    console.log(`Mode démo VR: Navigation vers ${spriteName} (groupe: ${groupName}) - ${currentDemoGroupIndex + 1}/${demoGroups.length}`);
    
    // Déplacer la caméra vers l'étoile et attendre que l'animation soit terminée
    await moveCameraToSprite(spriteName);
    
    currentDemoGroupIndex++;
    
    // Attendre la pause de 3 secondes APRÈS que l'animation soit terminée
    demoInterval = setTimeout(() => {
        if (demoModeActive) {
            nextDemoGroupVR();
        }
    }, demoPauseDuration);
}

// Fonction pour gérer l'interaction trigger en VR (équivalent du clic souris)
function handleVRTriggerInteraction(controller, handness) {
    console.log(`VR Trigger pressed on ${handness} controller`);
    
    try {
        // Méthode 1: Utiliser le système de pointer selection de Babylon.js
        if (controller.pointer && controller.pointer.isVisible) {
            // Obtenir la direction du pointer ray
            const rayOrigin = controller.pointer.absolutePosition || controller.pointer.position;
            const rayDirection = controller.pointer.getDirection(BABYLON.Vector3.Forward());
            
            console.log(`VR Debug: Ray origin: ${rayOrigin.toString()}, direction: ${rayDirection.toString()}`);
            
            // Créer un ray précis depuis le pointer
            const ray = new BABYLON.Ray(rayOrigin, rayDirection, 1000);
            
            // Variables pour trouver la particule la plus proche
            let closestSprite = null;
            let closestDistance = Infinity;
            
            // Vérifier toutes les particules visibles
            if (scene.spriteManagers[0] && scene.spriteManagers[0].sprites) {
                scene.spriteManagers[0].sprites.forEach(sprite => {
                    if (sprite.isVisible) {
                        // Utiliser la méthode intersectsMesh pour la détection précise
                        const spritePosition = sprite.position;
                        
                        // Calculer la distance minimale entre le ray et la position de l'étoile
                        const rayToSprite = spritePosition.subtract(rayOrigin);
                        const projectionLength = BABYLON.Vector3.Dot(rayToSprite, rayDirection);
                        
                        if (projectionLength > 0) { // L'étoile est devant le ray
                            const closestPointOnRay = rayOrigin.add(rayDirection.scale(projectionLength));
                            const distanceToRay = BABYLON.Vector3.Distance(spritePosition, closestPointOnRay);
                            
                            // Seuil de sélection plus serré pour plus de précision
                            const selectionRadius = 1.5;
                            
                            if (distanceToRay < selectionRadius && projectionLength < closestDistance) {
                                closestSprite = sprite;
                                closestDistance = projectionLength;
                                console.log(`VR Debug: Candidat trouvé: ${sprite.name}, distance: ${distanceToRay.toFixed(2)}, projection: ${projectionLength.toFixed(2)}`);
                            }
                        }
                    }
                });
            }
            
            // Si une particule a été trouvée, naviguer vers elle
            if (closestSprite) {
                console.log(`VR: ✅ Particule précise trouvée: ${closestSprite.name}`);
                moveCameraToSprite(closestSprite.name);
                return;
            }
        }
        
        // Méthode 2: Fallback - utiliser la position du contrôleur directement
        let controllerPosition, controllerForward;
        
        // Essayer d'obtenir la position du contrôleur par différentes méthodes
        if (controller.grip && controller.grip.position) {
            controllerPosition = controller.grip.position;
            controllerForward = controller.grip.getDirection ?
                controller.grip.getDirection(BABYLON.Vector3.Forward()) :
                new BABYLON.Vector3(0, 0, 1);
        } else if (controller.motionController && controller.motionController.rootMesh) {
            controllerPosition = controller.motionController.rootMesh.position;
            controllerForward = controller.motionController.rootMesh.getDirection ?
                controller.motionController.rootMesh.getDirection(BABYLON.Vector3.Forward()) :
                new BABYLON.Vector3(0, 0, 1);
        } else {
            console.log("VR: Impossible d'obtenir la position du contrôleur");
            return;
        }
        
        console.log(`VR Debug Fallback: Position: ${controllerPosition.toString()}, Direction: ${controllerForward.toString()}`);
        
        // Variables pour la sélection
        let closestSprite = null;
        let closestScreenDistance = Infinity;
        
        // Méthode alternative: trouver l'étoile la plus proche visuellement
        if (scene.spriteManagers[0] && scene.spriteManagers[0].sprites) {
            const camera = scene.activeCamera;
            scene.spriteManagers[0].sprites.forEach(sprite => {
                if (sprite.isVisible) {
                    // Calculer la distance 3D au contrôleur
                    const distance3D = BABYLON.Vector3.Distance(controllerPosition, sprite.position);
                    
                    // Vérifier si l'étoile est dans une zone raisonnable
                    if (distance3D < 50) { // Dans un rayon de 50 unités
                        // Calculer l'angle entre la direction du contrôleur et l'étoile
                        const toSprite = sprite.position.subtract(controllerPosition).normalize();
                        const angle = Math.acos(BABYLON.Vector3.Dot(controllerForward, toSprite));
                        
                        // Seuil d'angle (plus petit = plus précis)
                        const maxAngle = Math.PI / 12; // 15 degrés
                        
                        if (angle < maxAngle && distance3D < closestScreenDistance) {
                            closestSprite = sprite;
                            closestScreenDistance = distance3D;
                            console.log(`VR Debug Fallback: Candidat ${sprite.name}, angle: ${(angle * 180 / Math.PI).toFixed(1)}°, distance: ${distance3D.toFixed(2)}`);
                        }
                    }
                }
            });
        }
        
        // Naviguer vers la particule trouvée
        if (closestSprite) {
            console.log(`VR: ✅ Particule trouvée (fallback): ${closestSprite.name}`);
            moveCameraToSprite(closestSprite.name);
        } else {
            console.log(`VR: ❌ Aucune particule trouvée dans la direction du ${handness} contrôleur`);
        }
        
    } catch (error) {
        console.error("Erreur dans handleVRTriggerInteraction:", error);
    }
}

// Cette fonction a été supprimée car dupliquée - voir la version corrigée plus bas

// Fonction pour détecter la particule visée en continu
function detectTargetedSprite() {
    try {
        // Reset previous target
        if (currentTargetedSprite) {
            // Restaurer la couleur originale
            if (currentTargetedSprite.originalColor) {
                currentTargetedSprite.color = currentTargetedSprite.originalColor;
            }
            currentTargetedSprite = null;
        }
        
        let targetedSprite = null;
        
        // Méthode 1: Utiliser le système de pointer selection si disponible
        if (window.xrHelper && window.xrHelper.input && window.xrHelper.input.controllers.length > 0) {
            for (const controller of window.xrHelper.input.controllers) {
                if (controller.pointer) {
                    const rayOrigin = controller.pointer.absolutePosition || controller.pointer.position;
                    const rayDirection = controller.pointer.getDirection ?
                        controller.pointer.getDirection(BABYLON.Vector3.Forward()) :
                        new BABYLON.Vector3(0, 0, 1);
                    
                    // Trouver la particule la plus proche du ray
                    let closestSprite = null;
                    let closestDistance = Infinity;
                    
                    if (scene.spriteManagers[0] && scene.spriteManagers[0].sprites) {
                        scene.spriteManagers[0].sprites.forEach(sprite => {
                            if (sprite.isVisible) {
                                const spritePosition = sprite.position;
                                const rayToSprite = spritePosition.subtract(rayOrigin);
                                const projectionLength = BABYLON.Vector3.Dot(rayToSprite, rayDirection);
                                
                                if (projectionLength > 0 && projectionLength < 100) {
                                    const closestPointOnRay = rayOrigin.add(rayDirection.scale(projectionLength));
                                    const distanceToRay = BABYLON.Vector3.Distance(spritePosition, closestPointOnRay);
                                    
                                    if (distanceToRay < 2.0 && projectionLength < closestDistance) {
                                        closestSprite = sprite;
                                        closestDistance = projectionLength;
                                    }
                                }
                            }
                        });
                    }
                    
                    if (closestSprite) {
                        targetedSprite = closestSprite;
                        break; // Prendre la première trouvée
                    }
                }
            }
        }
        
        // Méthode 2: Fallback - sprite le plus proche du centre de l'écran
        if (!targetedSprite && scene.activeCamera) {
            const camera = scene.activeCamera;
            const width = engine.getRenderWidth();
            const height = engine.getRenderHeight();
            const centerX = width / 2;
            const centerY = height / 2;
            
            let closestSprite = null;
            let smallestDistance = Infinity;
            
            if (scene.spriteManagers[0] && scene.spriteManagers[0].sprites) {
                scene.spriteManagers[0].sprites.forEach(sprite => {
                    if (sprite.isVisible) {
                        const identityMatrix = BABYLON.Matrix.Identity();
                        const transformMatrix = scene.getTransformMatrix();
                        const viewport = camera.viewport.toGlobal(width, height);
                        
                        const projectedPosition = BABYLON.Vector3.Project(
                            sprite.position,
                            identityMatrix,
                            transformMatrix,
                            viewport
                        );
                        
                        // Calculer la distance au centre de l'écran
                        const screenDistance = Math.sqrt(
                            Math.pow(projectedPosition.x - centerX, 2) +
                            Math.pow(projectedPosition.y - centerY, 2)
                        );
                        
                        // Vérifier si dans l'écran et proche du centre
                        if (projectedPosition.x >= 0 && projectedPosition.x <= width &&
                            projectedPosition.y >= 0 && projectedPosition.y <= height &&
                            projectedPosition.z > 0 && projectedPosition.z < 1 &&
                            screenDistance < 100) { // Seuil de 100 pixels du centre
                            
                            if (screenDistance < smallestDistance) {
                                closestSprite = sprite;
                                smallestDistance = screenDistance;
                            }
                        }
                    }
                });
            }
            
            targetedSprite = closestSprite;
        }
        
        // Mettre à jour l'affichage
        if (targetedSprite) {
            // Sauvegarder la couleur originale si pas déjà fait
            if (!targetedSprite.originalColor) {
                targetedSprite.originalColor = targetedSprite.color.clone();
            }
            
            // Changer la couleur pour indiquer la visée
            targetedSprite.color = new BABYLON.Color4(1, 1, 0, 1); // Jaune vif
            
            currentTargetedSprite = targetedSprite;
            
            // Mettre à jour l'indicateur 3D VR avec vérification de sécurité
            if (scene.vrTargetIndicator && scene.vrTargetIndicator.show) {
                scene.vrTargetIndicator.show(targetedSprite.name);
            }
        } else {
            // Aucune cible
            currentTargetedSprite = null;
            if (scene.vrTargetIndicator && scene.vrTargetIndicator.hide) {
                scene.vrTargetIndicator.hide();
            }
        }
        
        // L'indicateur VR simple n'a plus besoin de mise à jour de position
        
    } catch (error) {
        // Erreur silencieuse pour éviter le spam
    }
}

// Version améliorée de la fonction trigger qui utilise le contrôleur spécifique
function handleVRTriggerInteractionNew(controller, handness) {
    console.log(`VR Trigger NEW pressed on ${handness} controller`);
    
    try {
        // Trouver la particule visée spécifiquement par CE contrôleur
        let targetedSprite = null;
        
        // Utiliser uniquement le contrôleur qui a déclenché le trigger
        if (controller.pointer) {
            const rayOrigin = controller.pointer.absolutePosition || controller.pointer.position;
            const rayDirection = controller.pointer.getDirection ?
                controller.pointer.getDirection(BABYLON.Vector3.Forward()) :
                new BABYLON.Vector3(0, 0, 1);
            
            console.log(`VR ${handness}: Ray origin: ${rayOrigin.toString()}, direction: ${rayDirection.toString()}`);
            
            // Trouver la particule la plus proche du ray de CE contrôleur
            let closestSprite = null;
            let closestDistance = Infinity;
            
            if (scene.spriteManagers[0] && scene.spriteManagers[0].sprites) {
                scene.spriteManagers[0].sprites.forEach(sprite => {
                    if (sprite.isVisible) {
                        const spritePosition = sprite.position;
                        const rayToSprite = spritePosition.subtract(rayOrigin);
                        const projectionLength = BABYLON.Vector3.Dot(rayToSprite, rayDirection);
                        
                        if (projectionLength > 0 && projectionLength < 100) {
                            const closestPointOnRay = rayOrigin.add(rayDirection.scale(projectionLength));
                            const distanceToRay = BABYLON.Vector3.Distance(spritePosition, closestPointOnRay);
                            
                            if (distanceToRay < 2.0 && projectionLength < closestDistance) {
                                closestSprite = sprite;
                                closestDistance = projectionLength;
                            }
                        }
                    }
                });
            }
            
            targetedSprite = closestSprite;
        }
        
        // Naviguer vers la particule trouvée par CE contrôleur
        if (targetedSprite) {
            console.log(`VR ${handness}: ✅ Navigation vers: ${targetedSprite.name}`);
            moveCameraToSprite(targetedSprite.name);
        } else {
            console.log(`VR ${handness}: ❌ Aucune cible trouvée pour ce contrôleur`);
            
            // Flash de l'indicateur pour montrer qu'il n'y a pas de cible
            if (scene.xrTargetPanel) {
                scene.xrTargetPanel.isVisible = true;
                if (scene.xrTargetName) {
                    scene.xrTargetName.text = `❌ Aucune cible ${handness}!`;
                    scene.xrTargetName.color = "red";
                }
                
                setTimeout(() => {
                    if (scene.xrTargetPanel) {
                        scene.xrTargetPanel.isVisible = false;
                    }
                }, 2000);
            }
        }
        
    } catch (error) {
        console.error(`Erreur trigger ${handness}:`, error);
    }
}

// Fonction pour créer un indicateur textuel accroché à la caméra VR
function createVRTargetIndicator(scene) {
    const indicatorSystem = {};
    
    // Créer un panneau 3D pour afficher l'indicateur de particule visée
    const targetInfoPlane = BABYLON.MeshBuilder.CreatePlane("vrTargetInfoPlane", {width: 2.5, height: 1.2}, scene);
    
    // Position relative à la caméra (HUD style) - centré plus bas
    targetInfoPlane.position = new BABYLON.Vector3(0, -0.8, 3); // Plus bas dans le champ de vision
    targetInfoPlane.isVisible = false;
    
    // Créer une texture dynamique pour le texte
    let infoTexture = new BABYLON.DynamicTexture("vrTargetInfoTexture", {width: 600, height: 300}, scene);
    const infoMaterial = new BABYLON.StandardMaterial("vrTargetInfoMat", scene);
    infoMaterial.diffuseTexture = infoTexture;
    infoMaterial.emissiveTexture = infoTexture;
    infoMaterial.disableLighting = true;
    infoMaterial.hasAlpha = true;
    targetInfoPlane.material = infoMaterial;
    
    // Fonction pour dessiner l'affichage sur la texture
    function updateInfoTexture(particleName) {
        infoTexture.clear();
        const context = infoTexture.getContext();
        
        // Fond semi-transparent avec bordure plus compacte
        context.fillStyle = "rgba(0, 0, 0, 0.8)";
        context.fillRect(0, 0, 600, 300);
        
        // Bordure plus proche du contenu
        context.strokeStyle = "white";
        context.lineWidth = 2;
        context.strokeRect(30, 30, 540, 240);
        
        // Titre "Particule visée"
        context.font = "bold 32px Arial";
        context.fillStyle = "yellow";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("Particule visée", 300, 100);
        
        // Ligne de séparation plus compacte
        context.strokeStyle = "yellow";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(80, 140);
        context.lineTo(520, 140);
        context.stroke();
        
        // Nom de la particule
        context.font = "bold 38px Arial";
        context.fillStyle = "white";
        context.strokeStyle = "black";
        context.lineWidth = 2;
        
        // Contour du nom
        context.strokeText(particleName, 300, 200);
        // Texte principal du nom
        context.fillText(particleName, 300, 200);
        
        infoTexture.update();
    }
    
    // Fonction pour attacher le panneau à la caméra
    function attachToCamera() {
        const camera = scene.activeCamera;
        if (camera) {
            // Attacher le panneau à la caméra comme enfant
            targetInfoPlane.parent = camera;
            console.log("VR: Panneau attaché à la caméra");
        }
    }
    
    // Fonction pour mettre à jour la position du panneau relativement à la caméra
    function updatePanelPosition() {
        const camera = scene.activeCamera;
        if (camera && targetInfoPlane.isVisible) {
            // Si pas encore attaché, l'attacher
            if (!targetInfoPlane.parent) {
                attachToCamera();
            }
        }
    }
    
    // Ajouter l'observateur pour maintenir la position
    scene.onBeforeRenderObservable.add(() => {
        if (targetInfoPlane.isVisible) {
            updatePanelPosition();
        }
    });
    
    // Stocker les références
    indicatorSystem.infoPane = targetInfoPlane;
    indicatorSystem.infoTexture = infoTexture;
    indicatorSystem.infoMaterial = infoMaterial;
    
    // Fonctions
    indicatorSystem.show = function(particleName) {
        console.log("VR: Showing particle target info for", particleName);
        targetInfoPlane.isVisible = true;
        updateInfoTexture(particleName);
        attachToCamera(); // S'assurer que c'est attaché
    };
    
    indicatorSystem.hide = function() {
        console.log("VR: Hiding particle target info");
        targetInfoPlane.isVisible = false;
    };
    
    indicatorSystem.dispose = function() {
        if (infoTexture) infoTexture.dispose();
        if (infoMaterial) infoMaterial.dispose();
        if (targetInfoPlane) targetInfoPlane.dispose();
    };
    
    console.log("Camera-attached VR text indicator created");
    return indicatorSystem;
}

//scene.debugLayer.show()
