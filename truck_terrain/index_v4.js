var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

var vehicle, scene, chassisMesh, redMaterial, blueMaterial, greenMaterial, blackMaterial;
var wheelMeshes = [];
var actions = { accelerate: false, brake: false, right: false, left: false };

// var keysActions = {
// 	"KeyW": 'acceleration',
// 	"KeyS": 'braking',
// 	"KeyA": 'left',
// 	"KeyD": 'right'
// };

// SWAPPED DUE TO PRIMITIVE ROTATIONS
var keysActions = {
	"KeyW": 'acceleration',
	"KeyS": 'braking',
	"KeyD": 'left',
	"KeyA": 'right',
	"KeyZ": 'fullBrake'
};

var vehicleReady = false;

var ZERO_QUATERNION = new BABYLON.Quaternion();

var chassisWidth = 1.8;
var chassisHeight = 1;
var chassisLength = 4;
var massVehicle = 500;

var wheelAxisPositionBack = -1.25;
var wheelRadiusBack = .4;
var wheelWidthBack = .3;
var wheelHalfTrackBack = 1;
var wheelAxisHeightBack = 0.4;

var wheelAxisFrontPosition = 1.55;
var wheelHalfTrackFront = 1;
var wheelAxisHeightFront = 0.4;
var wheelRadiusFront = .4;
var wheelWidthFront = .3;

var friction = 5;
var suspensionStiffness = 10;
var suspensionDamping = 0.3;
var suspensionCompression = 4.4;
var suspensionRestLength = 0.65;
var rollInfluence = 0.0;

var steeringIncrement = .01;
var steeringClamp = 0.4;
var maxEngineForce = 600;
var maxBreakingForce = 20;
var incEngine = 10.0;

var FRONT_LEFT = 0;
var FRONT_RIGHT = 1;
var BACK_LEFT = 2;
var BACK_RIGHT = 3;

var wheelDirectionCS0;
var wheelAxleCS;

let sceneReady = false;
let currentScene = false;
let carScene = false;
let sunShadowMap;
let ground;
let skysphere;
let shadowMapPopulated = false;
let followCamera;

let forceBrake = false;
let sun;

// Load and setup basic scene
// BABYLON.SceneLoader.Load("/assets/test_scene/", "nicer truck _rotations.glb", engine, (loadedScene) => {
BABYLON.SceneLoader.Load("../assets/", "toyota_dyna_compressed.glb", engine, (loadedScene) => {
	// Assign
	carScene = loadedScene;

	{ // SCENE DEFINITION + LIGHTING
		// Init
		carScene.getNodeByName("__root__").position = new BABYLON.Vector3(0, 0, 0);

		// Enable physics
		carScene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.AmmoJSPlugin());

		// Fix truck material
		carScene.getMaterialByName("Truck Windshield").alpha = 0.5;

		// Camera required for now, a FollowCamera will replace it later
		var cameraArc = new BABYLON.ArcRotateCamera("camera1", 0, 0, 10, new BABYLON.Vector3(0, 1, 0), carScene);
		cameraArc.setTarget(BABYLON.Vector3.Zero());
		cameraArc.attachControl(canvas, true);

		// LIGHTING

		// Environment
		var hdrTexture = new BABYLON.CubeTexture.CreateFromPrefilteredData("../assets/environment-out.env", carScene);
		hdrTexture.gammaSpace = false;
		hdrTexture.intensity = 0.25;
		carScene.environmentTexture = hdrTexture;

		// Skysphere
		skysphere = BABYLON.Mesh.CreateSphere("Skysphere", 16, 8192, carScene);
		skysphere.rotation.z = Math.PI;
		let skysphereMtl = new BABYLON.PBRMaterial("Skysphere Material", carScene);
		skysphereMtl.lightmapTexture = new BABYLON.Texture("../assets/environment-out.png");
		skysphereMtl.backFaceCulling = false;
		skysphere.material = skysphereMtl;

		// Hemispheric Light
		var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), carScene);
		light.intensity = .6;

		// Sunlight
		sun = new BABYLON.DirectionalLight("Sun", new BABYLON.Vector3(-.5, -.75, -.5), carScene);
		sun.intensity = 2;
		sun.position = new BABYLON.Vector3(10, 8, 10);
		sunShadowMap = new BABYLON.ShadowGenerator(1024, sun);
		// sunShadowMap.usePercentageCloserFiltering = true;
		sunShadowMap.useBlurExponentialShadowMap = true;
	}

	{ // PHYSICS + CAR SETUP
		wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
		wheelAxleCS = new Ammo.btVector3(-1, 0, 0);
		terrain_makeInitialGround();
	}

	// Some registerBeforeRender stuff to maintain control of the car
	carScene.registerBeforeRender(function () {
		var dt = engine.getDeltaTime().toFixed() / 1000;

		if (vehicleReady) {
			var speed = vehicle.getCurrentSpeedKmHour();
			var maxSteerVal = 0.2;
			breakingForce = 0;
			engineForce = 0;

			if (actions.acceleration) {
				if (speed < -1) {
					breakingForce = maxBreakingForce;
				} else {
					engineForce = maxEngineForce;
				}

			} else if (actions.braking) {
				if (speed > 1) {
					breakingForce = maxBreakingForce;
				} else {
					engineForce = -maxEngineForce;
				}
			} else if (actions.fullBrake || forceBrake) {
				breakingForce = maxBreakingForce;
			}

			if (actions.right) {
				if (vehicleSteering < steeringClamp) {
					vehicleSteering += steeringIncrement;
				}

			} else if (actions.left) {
				if (vehicleSteering > -steeringClamp) {
					vehicleSteering -= steeringIncrement;
				}

			} else {
				vehicleSteering = 0;
			}

			vehicle.applyEngineForce(engineForce, FRONT_LEFT);
			vehicle.applyEngineForce(engineForce, FRONT_RIGHT);

			vehicle.setBrake(breakingForce / 2, FRONT_LEFT);
			vehicle.setBrake(breakingForce / 2, FRONT_RIGHT);
			vehicle.setBrake(breakingForce, BACK_LEFT);
			vehicle.setBrake(breakingForce, BACK_RIGHT);

			vehicle.setSteeringValue(vehicleSteering, FRONT_LEFT);
			vehicle.setSteeringValue(vehicleSteering, FRONT_RIGHT);

			var tm, p, q, i;
			var n = vehicle.getNumWheels();
			for (i = 0; i < n; i++) {
				vehicle.updateWheelTransform(i, true);
				tm = vehicle.getWheelTransformWS(i);
				p = tm.getOrigin();
				q = tm.getRotation();
				wheelMeshes[i].position.set(p.x(), p.y(), p.z());
				wheelMeshes[i].rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
				wheelMeshes[i].rotate(BABYLON.Axis.Z, Math.PI / 2);
			}

			tm = vehicle.getChassisWorldTransform();
			p = tm.getOrigin();
			q = tm.getRotation();
			chassisMesh.position.set(p.x(), p.y(), p.z());
			chassisMesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
			chassisMesh.rotate(BABYLON.Axis.X, Math.PI);
		}
	});

	// Keyboard inputs
	window.addEventListener('keydown', keydown);
	window.addEventListener('keyup', keyup);

	// Declare scene to be ready
	// sceneReady = true;
});

// vehicle is based off BabylonJS AmmoJS Vehicle Demo on BabylonJS Playground
// https://playground.babylonjs.com/#609QKP#2
function createVehicle(pos, quat) {
	// Going Native
	var physicsWorld = carScene.getPhysicsEngine().getPhysicsPlugin().world;

	var geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .5, chassisHeight * .5, chassisLength * .5));
	var transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin(new Ammo.btVector3(0, 5, 0));
	transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
	var motionState = new Ammo.btDefaultMotionState(transform);
	var localInertia = new Ammo.btVector3(0, 0, 0);
	geometry.calculateLocalInertia(massVehicle, localInertia);

	// chassisMesh = createChassisMesh(chassisWidth, chassisHeight, chassisLength);
	chassisMesh = carScene.getNodeByName("Cube");
	chassisMesh.scaling = new BABYLON.Vector3(1.2, 1.1, 1.1);

	// FOLLOWCAMERA
	followCamera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10), carScene);
	followCamera.radius = 10;
	followCamera.heightOffset = 4;
	followCamera.rotationOffset = 0;
	followCamera.lowerRadiusLimit = 2; followCamera.upperRadiusLimit = 20;
	followCamera.lowerHeightOffsetLimit = 2; followCamera.upperHeightOffsetLimit = 90;
	followCamera.cameraAcceleration = 0.05;
	followCamera.maxCameraSpeed = 400;
	followCamera.attachControl(canvas, true);
	followCamera.lockedTarget = chassisMesh; //version 2.5 onwards
	carScene.activeCamera = followCamera;
	// END FOLLOWCAMERA

	var massOffset = new Ammo.btVector3(0, 0.4, 0);
	var transform2 = new Ammo.btTransform();
	transform2.setIdentity();
	transform2.setOrigin(massOffset);
	var compound = new Ammo.btCompoundShape();
	compound.addChildShape(transform2, geometry);

	var body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, compound, localInertia));
	body.setActivationState(4);

	physicsWorld.addRigidBody(body);

	var engineForce = 0;
	var vehicleSteering = 0;
	var breakingForce = 0;
	var tuning = new Ammo.btVehicleTuning();
	var rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
	vehicle = new Ammo.btRaycastVehicle(tuning, body, rayCaster);
	vehicle.setCoordinateSystem(0, 1, 2);
	physicsWorld.addAction(vehicle);

	var trans = vehicle.getChassisWorldTransform();

	function addWheel(isFront, pos, radius, width, index) {
		var wheelInfo = vehicle.addWheel(
			pos,
			wheelDirectionCS0,
			wheelAxleCS,
			suspensionRestLength,
			radius,
			tuning,
			isFront);

		wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
		wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
		wheelInfo.set_m_wheelsDampingCompression(suspensionCompression);
		wheelInfo.set_m_maxSuspensionForce(600000);
		wheelInfo.set_m_frictionSlip(40);
		wheelInfo.set_m_rollInfluence(rollInfluence);

		wheelMeshes[index] = createWheelMesh(radius, width);
	}

	addWheel(true, new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_LEFT);
	addWheel(true, new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition), wheelRadiusFront, wheelWidthFront, FRONT_RIGHT);
	addWheel(false, new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_LEFT);
	addWheel(false, new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisPositionBack), wheelRadiusBack, wheelWidthBack, BACK_RIGHT);

	vehicleReady = true;
}

let wheelsCreated = 0;
let wheelNames = ["wheel", "wheel.001", "wheel.002", "wheel.003"];
function createWheelMesh(radius, width) {
	// var mesh = new BABYLON.MeshBuilder.CreateCylinder("Wheel", { diameter: 1, height: 0.5, tessellation: 6 }, carScene);
	let mesh = carScene.getNodeByName(wheelNames[wheelsCreated]);
	mesh.position = BABYLON.Vector3.Zero();
	mesh.rotationQuaternion = new BABYLON.Quaternion();
	wheelsCreated++;

	return mesh;
}

function keyup(e) {
	if (keysActions[e.code]) {
		actions[keysActions[e.code]] = false;
	}
}

function keydown(e) {
	if (keysActions[e.code]) {
		actions[keysActions[e.code]] = true;
	}
}

engine.runRenderLoop(function () {
	if (sceneReady) {
		// scene preparation
		if (!shadowMapPopulated) {
			shadowMapPopulated = true;
			createVehicle(new BABYLON.Vector3(0, 200, -20), ZERO_QUATERNION);

			// Add shadow casters
			for (i = 0; i < carScene.meshes.length; i++) {
				if (!carScene.meshes[i].name.includes("Ground") && !carScene.meshes[i].name.includes("root")) sunShadowMap.getShadowMap().renderList.push(carScene.meshes[i]);
				carScene.meshes[i].receiveShadows = true;
			}

			sunShadowMap.removeShadowCaster(skysphere);

			// Also perform the PRIMITIVE TRANSFORMATIONS!
			let truckBodyRotation = new BABYLON.Vector3(Math.PI, 0, 0);
			let truckBodyPosition = new BABYLON.Vector3(0, -1, 0);
			for (i = 0; i < 7; i++) {
				carScene.getMeshByName("Cube_primitive" + i).rotation = truckBodyRotation;
				carScene.getMeshByName("Cube_primitive" + i).position = truckBodyPosition;
			}

			carScene.getMeshByName("wheel_primitive0").rotation = new BABYLON.Vector3(Math.PI, 0, 0);
			carScene.getMeshByName("wheel.001_primitive0").rotation = new BABYLON.Vector3(Math.PI, 0, 0);
		}

		// update overlays
		document.getElementById("fpsLabel").innerText = engine.getFps().toFixed() + " FPS";
		document.getElementById("box").innerText = Math.round(vehicle.getCurrentSpeedKmHour()) + " km/h";

		carScene.render();
	}
});

// Resize
window.addEventListener("resize", function () {
	engine.resize();
});

function shadowMapDebug() {
	let a = sunShadowMap.getShadowMap().renderList;
	for (i = 0; i < a.length; i++) console.log(a[i].name);
}