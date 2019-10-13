var canvas = document.getElementById("renderCanvas");

function createScene() {

	let scene = new BABYLON.Scene(engine);
	scene.clearColor = new BABYLON.Color3(0, 0, 0);

	var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 6, 1.3, 100, new BABYLON.Vector3(0, -3, 0), scene);
	camera.attachControl(canvas);
	camera.keysDown = [];
	camera.keysUp = [];
	camera.keysLeft = [];
	camera.keysRight = [];

	var light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0.2), scene);
	light.groundColor = new BABYLON.Color3(.2, .2, .2);
	light.intensity = 0.25;

	var light2 = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0, -1, 0), scene);
	light2.diffuse = new BABYLON.Color3(.25, 0, 0);
	light2.specular = new BABYLON.Color3(0, 1, 0);
	let shadowMap = new BABYLON.ShadowGenerator(1024, light2);

	var ground = BABYLON.MeshBuilder.CreateGround("ground", {
		width: 400,
		height: 400
	}, scene);
	ground.position.y = -7;
	ground.receiveShadows = true;

	var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);

	ground.material = groundMaterial;

	var skyMaterial = new BABYLON.StandardMaterial("skyMaterial", scene);

	//car
	var rad = 5;
	var h = 4;
	var w = 5;
	var d = 10;
	var holderSize = 2;

	var body = BABYLON.MeshBuilder.CreateBox("body", {
		width: (w + 2) * 1.5,
		height: h,
		depth: (d + 4) * 1.5
	}, scene);

	//wheel-holders (for slider joints)
	var holder1 = BABYLON.MeshBuilder.CreateBox("holder1", {
		height: holderSize, width: holderSize / 2, depth: holderSize / 2
	}, scene);
	holder1.position.copyFromFloats(-w, -2, -d);

	var holder2 = BABYLON.MeshBuilder.CreateBox("holder2", {
		height: holderSize, width: holderSize / 2, depth: holderSize / 2
	}, scene);
	holder2.position.copyFromFloats(w, -2, -d);

	var holder3 = BABYLON.MeshBuilder.CreateBox("holder3", {
		height: holderSize, width: holderSize / 2, depth: holderSize / 2
	}, scene);
	holder3.position.copyFromFloats(-w, -2, d);

	var holder4 = BABYLON.MeshBuilder.CreateBox("holder4", {
		height: holderSize, width: holderSize / 2, depth: holderSize / 2
	}, scene);
	holder4.position.copyFromFloats(w, -2, d);
	//Wheels
	var wheel1 = BABYLON.MeshBuilder.CreateSphere("wheel1", {
		diameterY: rad,
		diameterX: rad / 2,
		diameterZ: rad,
		segments: 5
	}, scene);
	wheel1.position.copyFromFloats(-(w + 3), -2, -d);

	var wheel2 = BABYLON.MeshBuilder.CreateSphere("wheel2", {
		diameterY: rad,
		diameterX: rad / 2,
		diameterZ: rad,
		segments: 5
	}, scene);
	wheel2.position.copyFromFloats((w + 3), -2, -d);

	var wheel3 = BABYLON.MeshBuilder.CreateSphere("wheel3", {
		diameterY: rad,
		diameterX: rad / 2,
		diameterZ: rad,
		segments: 5
	}, scene);
	wheel3.position.copyFromFloats(-(w + 3), -2, d);

	var wheel4 = BABYLON.MeshBuilder.CreateSphere("wheel4", {
		diameterY: rad,
		diameterX: rad / 2,
		diameterZ: rad,
		segments: 5
	}, scene);
	wheel4.position.copyFromFloats((w + 3), -2, d);

	function rand(mult) {
		return Math.random() * (Math.random() < 0.5 ? -1 : 1) * mult;
	}

	//physics
	scene.enablePhysics(null, new BABYLON.OimoJSPlugin(100));
	ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, {
		mass: 0
	});
	body.physicsImpostor = new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.BoxImpostor, {
		mass: 1,
		friction: 0.5,
		restitution: 0.5,
		nativeOptions: {
			noSleep: true,
			move: true
		}
	});

	[holder1, holder2, holder3, holder4].forEach(function (h) {
		h.isVisible = false;
		h.physicsImpostor = new BABYLON.PhysicsImpostor(h, BABYLON.PhysicsImpostor.SphereImpostor, {
			mass: 1,
			friction: 4,
			restitution: 0.5
		});
		h.physicsImpostor.physicsBody.collidesWith = ~1;
	});

	[wheel1, wheel2, wheel3, wheel4].forEach(function (w) {
		w.physicsImpostor = new BABYLON.PhysicsImpostor(w, BABYLON.PhysicsImpostor.SphereImpostor, {
			mass: 1,
			friction: 4,
			restitution: 0.5,
			nativeOptions: {
				move: true
			}
		});
	});

	//Joints

	//slider joints

	var sJoint1 = new BABYLON.MotorEnabledJoint(BABYLON.PhysicsJoint.SliderJoint, {
		mainPivot: new BABYLON.Vector3(-w, -2, -d),
		mainAxis: new BABYLON.Vector3(0, -1, 0),
		connectedAxis: new BABYLON.Vector3(0, -1, 0),
		nativeParams: {
			limit: [0, 0],
			spring: [100, 2],
			min: 5,
			max: 30
		}
	});
	body.physicsImpostor.addJoint(holder1.physicsImpostor, sJoint1);

	var sJoint2 = new BABYLON.MotorEnabledJoint(BABYLON.PhysicsJoint.SliderJoint, {
		mainPivot: new BABYLON.Vector3(w, -2, -d),
		mainAxis: new BABYLON.Vector3(0, -1, 0),
		connectedAxis: new BABYLON.Vector3(0, -1, 0),
		nativeParams: {
			limit: [0, 0],
			spring: [100, 2],
			min: 5,
			max: 30
		}
	});
	body.physicsImpostor.addJoint(holder2.physicsImpostor, sJoint2);

	var sJoint3 = new BABYLON.MotorEnabledJoint(BABYLON.PhysicsJoint.SliderJoint, {
		mainPivot: new BABYLON.Vector3(-w, -2, d),
		mainAxis: new BABYLON.Vector3(0, -1, 0),
		connectedAxis: new BABYLON.Vector3(0, -1, 0),
		nativeParams: {
			limit: [0, 0],
			spring: [100, 2],
			min: 5,
			max: 30
		}
	});
	body.physicsImpostor.addJoint(holder3.physicsImpostor, sJoint3);

	var sJoint4 = new BABYLON.MotorEnabledJoint(BABYLON.PhysicsJoint.SliderJoint, {
		mainPivot: new BABYLON.Vector3(w, -2, d),
		mainAxis: new BABYLON.Vector3(0, -1, 0),
		connectedAxis: new BABYLON.Vector3(0, -1, 0),
		nativeParams: {
			limit: [0, 0],
			spring: [100, 2],
			min: 5,
			max: 30
		}
	});
	body.physicsImpostor.addJoint(holder4.physicsImpostor, sJoint4);

	//wheel joints	
	var joint1 = new BABYLON.HingeJoint({
		mainPivot: new BABYLON.Vector3(0, -2, 0),
		connectedPivot: new BABYLON.Vector3(3, 0, 0),
		mainAxis: new BABYLON.Vector3(-1, 0, 0),
		connectedAxis: new BABYLON.Vector3(-1, 0, 0),
		nativeParams: {
			limit: [0, 0]
		}
	});
	holder1.physicsImpostor.addJoint(wheel1.physicsImpostor, joint1);

	var joint2 = new BABYLON.HingeJoint({
		mainPivot: new BABYLON.Vector3(0, -2, 0),
		connectedPivot: new BABYLON.Vector3(-3, 0, 0),
		mainAxis: new BABYLON.Vector3(-1, 0, 0),
		connectedAxis: new BABYLON.Vector3(-1, 0, 0),
		nativeParams: {
			limit: [0, 0]
		}
	});
	holder2.physicsImpostor.addJoint(wheel2.physicsImpostor, joint2);

	var joint3 = new BABYLON.HingeJoint({
		mainPivot: new BABYLON.Vector3(0, -2, 0),
		connectedPivot: new BABYLON.Vector3(3, 0, 0),
		mainAxis: new BABYLON.Vector3(-1, 0, 0),
		connectedAxis: new BABYLON.Vector3(-1, 0, 0),
		nativeParams: {
			limit: [0, 0]
		}
	});
	holder3.physicsImpostor.addJoint(wheel3.physicsImpostor, joint3);

	var joint4 = new BABYLON.HingeJoint({
		mainPivot: new BABYLON.Vector3(0, -2, 0),
		connectedPivot: new BABYLON.Vector3(-3, 0, 0),
		mainAxis: new BABYLON.Vector3(-1, 0, 0),
		connectedAxis: new BABYLON.Vector3(-1, 0, 0),
		nativeParams: {
			limit: [0, 0]
		}
	});
	holder4.physicsImpostor.addJoint(wheel4.physicsImpostor, joint4);

	document.addEventListener('keydown', keyDown);
	document.addEventListener('keyup', keyUp);

	var Control = {};

	var deg45 = Math.PI / 4;
	var angle = 0

	function keyUp(event) {

		var key = event.keyCode;

		switch (key) {
			case 37:
				Control.Steering = 0;
				break;
			case 38:
				Control.Velocity = 0;
				break;
			case 39:
				Control.Steering = 0;
				break;
			case 40:
				Control.Velocity = 0;
				break;
		}

		updating = false;
	}

	function keyDown(event) {

		var key = event.keyCode;

		switch (key) {
			case 37:
				Control.Steering = 1;
				break;
			case 38:
				Control.Velocity = 1; //direction changed
				break;
			case 39:
				Control.Steering = -1;
				break;
			case 40:
				Control.Velocity = -1; // direction changed
				break;
		}
		updating = true;
	}

	scene.onDispose = function () {
		document.removeEventListener('keydown', keyDown);
		document.removeEventListener('keyup', keyUp);
	}

	var steeringLimit = Math.PI / 6;
	var updating = false;
	function update() {
		//if (!updating) return;
		var steering = Control.Steering || 0;

		angle += steering * 0.1;
		angle = angle = angle > steeringLimit ? steeringLimit : angle < -steeringLimit ? -steeringLimit : angle;

		sJoint3.setLimit(angle, angle);
		sJoint4.setLimit(angle, angle);
		sJoint1.setLimit(0, 0);
		sJoint2.setLimit(0, 0);
		sJoint3.setMotor(steering, 1);
		sJoint4.setMotor(steering, 1);

		var velocity = Control.Velocity || 0;
		var wheelVelocity = 10 * Math.PI * velocity;
		joint1.setMotor(wheelVelocity, 6000);
		joint2.setMotor(wheelVelocity, 6000);
		joint3.setMotor(wheelVelocity, 6000);
		joint4.setMotor(wheelVelocity, 6000);
	}

	for (i = 0; i < scene.meshes.length; i++) { shadowMap.addShadowCaster(scene.meshes[i]); scene.meshes[i].receiveShadows = true; }
	shadowMap.removeShadowCaster(ground);

	scene.registerBeforeRender(update);

	return scene;

};

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