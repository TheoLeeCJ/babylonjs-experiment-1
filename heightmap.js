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

	var ground = BABYLON.Mesh.CreateGroundFromHeightMap("ground", "/assets/heightmap1.png", 200, 200, 250, 0, 100, scene, false);
	ground.position.y = -7;
	ground.receiveShadows = true;

	var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
	ground.material = groundMaterial;

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