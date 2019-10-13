var canvas = document.getElementById("renderCanvas");

var vehicle, scene, chassisMesh, redMaterial, blueMaterial, greenMaterial, blackMaterial;
var wheelMeshes = [];
var actions = { accelerate: false, brake: false, right: false, left: false };

var keysActions = {
	"KeyW": 'acceleration',
	"KeyS": 'braking',
	"KeyA": 'left',
	"KeyD": 'right'
};

var vehicleReady = false;

var ZERO_QUATERNION = new BABYLON.Quaternion();

var chassisWidth = 1.8;
var chassisHeight = .6;
var chassisLength = 4;
var massVehicle = 200;

var wheelAxisPositionBack = -1;
var wheelRadiusBack = .4;
var wheelWidthBack = .3;
var wheelHalfTrackBack = 1;
var wheelAxisHeightBack = 0.4;

var wheelAxisFrontPosition = 1.0;
var wheelHalfTrackFront = 1;
var wheelAxisHeightFront = 0.4;
var wheelRadiusFront = .4;
var wheelWidthFront = .3;

var friction = 5;
var suspensionStiffness = 10;
var suspensionDamping = 0.3;
var suspensionCompression = 4.4;
var suspensionRestLength = 0.6;
var rollInfluence = 0.0;

var steeringIncrement = .01;
var steeringClamp = 0.2;
var maxEngineForce = 500;
var maxBreakingForce = 10;
var incEngine = 10.0;

var FRONT_LEFT = 0;
var FRONT_RIGHT = 1;
var BACK_LEFT = 2;
var BACK_RIGHT = 3;

var wheelDirectionCS0;
var wheelAxleCS;


var createScene = function () {
	// Setup basic scene
	scene = new BABYLON.Scene(engine);
	var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
	camera.setTarget(BABYLON.Vector3.Zero());
	camera.attachControl(canvas, true);
	var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
	light.intensity = 0.7;

	redMaterial = new BABYLON.StandardMaterial("RedMaterial", scene);
	redMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.4, 0.5);
	redMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.4, 0.5);

	blueMaterial = new BABYLON.StandardMaterial("RedMaterial", scene);
	blueMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.4, 0.8);
	blueMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0.8);

	greenMaterial = new BABYLON.StandardMaterial("RedMaterial", scene);
	greenMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.8, 0.5);
	greenMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.8, 0.5);

	blackMaterial = new BABYLON.StandardMaterial("RedMaterial", scene);
	blackMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
	blackMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
	// Enable physics
	scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.AmmoJSPlugin());

	wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
	wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

	var ground = BABYLON.Mesh.CreateGround("ground", 460, 460, 2, scene);
	ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.7 }, scene);
	ground.material = new BABYLON.GridMaterial("groundMaterial", scene);

	createBox(new BABYLON.Vector3(4, 1, 12), new BABYLON.Vector3(0, 0, 25), new BABYLON.Vector3(-Math.PI / 8, 0, 0), 0);
	createBox(new BABYLON.Vector3(4, 1, 12), new BABYLON.Vector3(25, 0, 0), new BABYLON.Vector3(-Math.PI / 8, Math.PI / 2, 0), 0);
	createBox(new BABYLON.Vector3(4, 1, 12), new BABYLON.Vector3(0, 0, -25), new BABYLON.Vector3(Math.PI / 8, 0, 0), 0);
	createBox(new BABYLON.Vector3(4, 1, 12), new BABYLON.Vector3(-25, 0, 0), new BABYLON.Vector3(Math.PI / 8, Math.PI / 2, 0), 0);

	let s = new BABYLON.Vector3();
	let p = new BABYLON.Vector3();
	let r = new BABYLON.Vector3();
	for (let i = 0; i < 20; i++) {
		let m = Math.random() * 300 - 150 + 5;
		let m3 = Math.random() * 300 - 150 + 5;
		let m2 = Math.random() * 10;
		s.set(m2, m2, m2);
		p.set(m3, 0, m);
		r.set(m, m, m);
		createBox(s, p, r, 0);
	}

	for (let i = 0; i < 30; i++) {
		let m = Math.random() * 300 - 150 + 5;
		let m3 = Math.random() * 300 - 150 + 5;
		let m2 = Math.random() * 3;
		s.set(m2, m2, m2);
		p.set(m3, 0, m);
		r.set(m, m, m);
		createBox(s, p, r, 5);
	}



	function loadTriangleMesh() {
		var physicsWorld = scene.getPhysicsEngine().getPhysicsPlugin().world;
		BABYLON.SceneLoader.ImportMesh("Loft001", "https://raw.githubusercontent.com/RaggarDK/Baby/baby/", "ramp.babylon", scene, function (newMeshes) {
			for (let x = 0; x < newMeshes.length; x++) {
				let mesh = newMeshes[x];
				mesh.position.y -= 2.5;
				mesh.material = redMaterial;
				let positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
				let normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
				let colors = mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);
				let uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
				let indices = mesh.getIndices();

				mesh.updateFacetData();
				var localPositions = mesh.getFacetLocalPositions();
				var triangleCount = localPositions.length;

				let mTriMesh = new Ammo.btTriangleMesh();
				let removeDuplicateVertices = true;
				let tmpPos1 = new Ammo.btVector3(0, 0, 0);
				let tmpPos2 = new Ammo.btVector3(0, 0, 0);
				let tmpPos3 = new Ammo.btVector3(0, 0, 0);

				var _g = 0;
				while (_g < triangleCount) {
					var i = _g++;
					var index0 = indices[i * 3];
					var index1 = indices[i * 3 + 1];
					var index2 = indices[i * 3 + 2];
					var vertex0 = new Ammo.btVector3(positions[index0 * 3], positions[index0 * 3 + 1], positions[index0 * 3 + 2]);
					var vertex1 = new Ammo.btVector3(positions[index1 * 3], positions[index1 * 3 + 1], positions[index1 * 3 + 2]);
					var vertex2 = new Ammo.btVector3(positions[index2 * 3], positions[index2 * 3 + 1], positions[index2 * 3 + 2]);
					mTriMesh.addTriangle(vertex0, vertex1, vertex2);
				}

				let shape = new Ammo.btBvhTriangleMeshShape(mTriMesh, true, true);
				let localInertia = new Ammo.btVector3(0, 0, 0);
				let transform = new Ammo.btTransform;

				transform.setIdentity();
				transform.setOrigin(new Ammo.btVector3(mesh.position.x, mesh.position.y, mesh.position.z));
				transform.setRotation(new Ammo.btQuaternion(
					mesh.rotationQuaternion.x, mesh.rotationQuaternion.y, mesh.rotationQuaternion.z, mesh.rotationQuaternion.w));

				let motionState = new Ammo.btDefaultMotionState(transform);
				let rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, localInertia);
				let body = new Ammo.btRigidBody(rbInfo);
				physicsWorld.addRigidBody(body);
			}

		});

	}

	loadTriangleMesh();

	createVehicle(new BABYLON.Vector3(0, 4, -20), ZERO_QUATERNION);

	window.addEventListener('keydown', keydown);
	window.addEventListener('keyup', keyup);

	scene.registerBeforeRender(function () {

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

	return scene;
};

function createBox(size, position, rotation, mass) {

	var box = new BABYLON.MeshBuilder.CreateBox("box", { width: size.x, depth: size.z, height: size.y }, scene);
	box.position.set(position.x, position.y, position.z);
	box.rotation.set(rotation.x, rotation.y, rotation.z);
	if (!mass) {
		mass = 0;
		box.material = redMaterial;
	} else {
		box.position.y += 5;
		box.material = blueMaterial;

	}
	box.physicsImpostor = new BABYLON.PhysicsImpostor(box, BABYLON.PhysicsImpostor.BoxImpostor, { mass: mass, friction: 0.5, restitution: 0.7 }, scene);

}


function createVehicle(pos, quat) {
	//Going Native
	var physicsWorld = scene.getPhysicsEngine().getPhysicsPlugin().world;

	var geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .5, chassisHeight * .5, chassisLength * .5));
	var transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin(new Ammo.btVector3(0, 5, 0));
	transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
	var motionState = new Ammo.btDefaultMotionState(transform);
	var localInertia = new Ammo.btVector3(0, 0, 0);
	geometry.calculateLocalInertia(massVehicle, localInertia);

	chassisMesh = createChassisMesh(chassisWidth, chassisHeight, chassisLength);

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


function createChassisMesh(w, l, h) {
	var mesh = new BABYLON.MeshBuilder.CreateBox("box", { width: w, depth: h, height: l }, scene);
	mesh.rotationQuaternion = new BABYLON.Quaternion();

	var camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10), scene);
	camera.radius = 10;
	camera.heightOffset = 4;
	camera.rotationOffset = 0;
	camera.cameraAcceleration = 0.05;
	camera.maxCameraSpeed = 400;
	camera.attachControl(canvas, true);
	camera.lockedTarget = mesh; //version 2.5 onwards
	scene.activeCamera = camera;

	return mesh;
}


function createWheelMesh(radius, width) {
	//var mesh = new BABYLON.MeshBuilder.CreateBox("wheel", {width:.82, height:.82, depth:.82}, scene);
	var mesh = new BABYLON.MeshBuilder.CreateCylinder("Wheel", { diameter: 1, height: 0.5, tessellation: 6 }, scene);
	mesh.rotationQuaternion = new BABYLON.Quaternion();
	mesh.material = blackMaterial;

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

__createScene = createScene;

var engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
var scene = createScene();

engine.runRenderLoop(function () {
	if (scene) {
		scene.render();
	}
});

// Resize
window.addEventListener("resize", function () {
	engine.resize();
});