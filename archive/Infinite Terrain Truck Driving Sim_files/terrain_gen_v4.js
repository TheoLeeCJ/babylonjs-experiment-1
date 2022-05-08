// TRUCK TERRAIN GENERATOR REWRITE
// Not yet implemented: dynamic render distance
// Current issues:
// - if the player travels too fast, ground generation may mess up
// 	 - possible cause: race condition
//   - either track down and fix it or workaround by making each tile larger
//
// Strings:
// Generated Ground - PHYSICS ONLY
// Generated Ground - DISPLAY ONLY
let terrain_size = 128;
let terrain_height = 5;
let terrain_variations = 2;
let terrain_subdivs = 48;
// let terrain_subdivs = 24;
let terrain_misc1 = 0;
let terrain_misc3 = 0;
let terrain_misc2 = [];
let terrain_terrainMap = [];
let terrain_tileOffsets = [
	[-1, -1], [0, -1], [1, -1],
	[-1, 0], [0, 0], [1, 0],
	[-1, 1], [0, 1], [1, 1]
];

let spherePos;

function terrain_makeInitialGround() {
	// Populate initial terrain map
	for (i = 0; i < 9; i++) {
		let mapIndex = terrain_random(0, terrain_variations);
		let terrainMaps = terrain_terrainMap.length;

		terrain_terrainMap[terrainMaps] = BABYLON.MeshBuilder.CreateGroundFromHeightMap("Generated Ground - PHYSICS ONLY", heightmaps[mapIndex],
			{
				width: terrain_size, height: terrain_size, subdivisions: terrain_subdivs, maxHeight: terrain_height, onReady: (terrain_mesh) => {
					// Shift, add material, and scale
					terrain_terrainMap[terrainMaps].position = new BABYLON.Vector3(
						terrain_tileOffsets[terrainMaps][0] * terrain_size,
						0,
						terrain_tileOffsets[terrainMaps][1] * terrain_size
					);
					terrain_terrainMap[terrainMaps].physicsImpostor = new BABYLON.PhysicsImpostor(terrain_mesh, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 0.5, restitution: 0.1 }, carScene);
					terrain_terrainMap[terrainMaps].scaling = new BABYLON.Vector3(-1, 1, 1);
					terrain_terrainMap[terrainMaps].visibility = 0;

					if (terrain_terrainMap[8]) sceneReady = true;
				}
			}, carScene
		);

		terrain_terrainMap[terrainMaps]._fakeMesh = BABYLON.MeshBuilder.CreateGroundFromHeightMap("Generated Ground - DISPLAY ONLY", heightmaps[mapIndex],
			{
				width: terrain_size, height: terrain_size, subdivisions: terrain_subdivs, maxHeight: terrain_height, onReady: (terrain_mesh) => {
					// Shift
					terrain_terrainMap[terrainMaps]._fakeMesh.position = new BABYLON.Vector3(
						terrain_tileOffsets[terrainMaps][0] * (terrain_size * -1),
						0,
						terrain_tileOffsets[terrainMaps][1] * terrain_size
					);

					// Material
					terrain_terrainMap[terrainMaps]._fakeMesh.material = terrainMaterials[mapIndex];
					terrain_terrainMap[terrainMaps]._fakeMesh.receiveShadows = true;

					// Scale
					terrain_terrainMap[terrainMaps]._fakeMesh.scaling = new BABYLON.Vector3(-1, 1, 1);
				}
			}, carScene
		);
	}

	terrain_registerRenderEvent();
}

function terrain_registerRenderEvent() {
	// Principle: ensure that the chosen mesh (sphere in this case) is always in the center tile (#4 in the array)
	carScene.registerAfterRender(() => {
		if (sceneReady) {
			spherePos = carScene.getNodeByName("Cube").position;
			sphere = carScene.getNodeByName("Cube");

			if ( // if the sphere is above the x-coordinate of the center tile
				(spherePos.x > ((terrain_tileOffsets[4][0] + .5) * (terrain_size / 1)))
			) {
				for (i = 0; i < 7; i += 3) { terrain_terrainMap[i].dispose(); terrain_terrainMap[i]._fakeMesh.dispose(); }

				terrain_tileOffsets[0] = terrain_tileOffsets[1];
				terrain_tileOffsets[1] = terrain_tileOffsets[2];

				terrain_tileOffsets[3] = terrain_tileOffsets[4];
				terrain_tileOffsets[4] = terrain_tileOffsets[5];

				terrain_tileOffsets[6] = terrain_tileOffsets[7];
				terrain_tileOffsets[7] = terrain_tileOffsets[8];

				terrain_terrainMap[0] = terrain_terrainMap[1];
				terrain_terrainMap[1] = terrain_terrainMap[2];

				terrain_terrainMap[3] = terrain_terrainMap[4];
				terrain_terrainMap[4] = terrain_terrainMap[5];

				terrain_terrainMap[6] = terrain_terrainMap[7];
				terrain_terrainMap[7] = terrain_terrainMap[8];

				terrain_tileOffsets[2] = [terrain_tileOffsets[2][0] + 1, terrain_tileOffsets[2][1]];
				terrain_tileOffsets[5] = [terrain_tileOffsets[5][0] + 1, terrain_tileOffsets[5][1]];
				terrain_tileOffsets[8] = [terrain_tileOffsets[8][0] + 1, terrain_tileOffsets[8][1]];

				terrain_misc1 = 2;
				terrain_misc3 = 2;
				for (i2 = 2; i2 < 9; i2 += 3) {
					let mapIndex = terrain_misc2[i2] = terrain_random(0, 2);

					terrain_terrainMap[i2] = BABYLON.MeshBuilder.CreateGroundFromHeightMap("Generated Ground - PHYSICS ONLY", heightmaps[mapIndex],
						{ width: terrain_size, height: terrain_size, subdivisions: terrain_subdivs, maxHeight: terrain_height, onReady: terrain_executePhysicsAddThree }, carScene
					);

					terrain_terrainMap[i2]._fakeMesh = BABYLON.MeshBuilder.CreateGroundFromHeightMap("Generated Ground - DISPLAY ONLY", heightmaps[mapIndex],
						{ width: terrain_size, height: terrain_size, subdivisions: terrain_subdivs, maxHeight: terrain_height, onReady: terrain_executeDisplayAddThree }, carScene
					);
				}
			}
			else if ( // if the sphere is below the x-coordinate of the center tile
				spherePos.x < ((terrain_tileOffsets[4][0] + .5) * terrain_size - terrain_size)
			) {
				for (i = 2; i < 9; i += 3) { terrain_terrainMap[i].dispose(); terrain_terrainMap[i]._fakeMesh.dispose(); }

				terrain_tileOffsets[2] = terrain_tileOffsets[1];
				terrain_tileOffsets[1] = terrain_tileOffsets[0];

				terrain_tileOffsets[5] = terrain_tileOffsets[4];
				terrain_tileOffsets[4] = terrain_tileOffsets[3];

				terrain_tileOffsets[8] = terrain_tileOffsets[7];
				terrain_tileOffsets[7] = terrain_tileOffsets[6];

				terrain_terrainMap[2] = terrain_terrainMap[1];
				terrain_terrainMap[1] = terrain_terrainMap[0];

				terrain_terrainMap[5] = terrain_terrainMap[4];
				terrain_terrainMap[4] = terrain_terrainMap[3];

				terrain_terrainMap[8] = terrain_terrainMap[7];
				terrain_terrainMap[7] = terrain_terrainMap[6];

				terrain_tileOffsets[0] = [terrain_tileOffsets[0][0] - 1, terrain_tileOffsets[0][1]];
				terrain_tileOffsets[3] = [terrain_tileOffsets[3][0] - 1, terrain_tileOffsets[3][1]];
				terrain_tileOffsets[6] = [terrain_tileOffsets[6][0] - 1, terrain_tileOffsets[6][1]];

				terrain_misc1 = 0;
				terrain_misc3 = 0;
				for (i2 = 0; i2 < 7; i2 += 3) {
					let mapIndex = terrain_misc2[i2] = terrain_random(0, 2);

					terrain_terrainMap[i2] = BABYLON.MeshBuilder.CreateGroundFromHeightMap("Generated Ground - PHYSICS ONLY", heightmaps[mapIndex],
						{ width: terrain_size, height: terrain_size, subdivisions: terrain_subdivs, maxHeight: terrain_height, onReady: terrain_executePhysicsAddThree }, carScene
					);

					terrain_terrainMap[i2]._fakeMesh = BABYLON.MeshBuilder.CreateGroundFromHeightMap("Generated Ground - DISPLAY ONLY", heightmaps[mapIndex],
						{ width: terrain_size, height: terrain_size, subdivisions: terrain_subdivs, maxHeight: terrain_height, onReady: terrain_executeDisplayAddThree }, carScene
					);
				}
			}

			if ( // if the sphere is above the y-coordinate of the center tile
				(spherePos.z > ((terrain_tileOffsets[4][1] + .5) * (terrain_size / 1)))
			) { // shift the entire offset map and terrain map by +1 on the 2D y axis?
				for (i = 0; i < 3; i++) { terrain_terrainMap[i]._fakeMesh.dispose(); terrain_terrainMap[i].dispose(); }
				for (i = 0; i < 6; i++) { terrain_terrainMap[i] = terrain_terrainMap[i + 3]; terrain_tileOffsets[i] = terrain_tileOffsets[i + 3]; }

				// generate the new offsets
				for (i = 6; i < 9; i++) terrain_tileOffsets[i] = [terrain_tileOffsets[i][0], terrain_tileOffsets[i][1] + 1];

				// generate new tiles for 6, 7, 8
				terrain_misc1 = 6;
				terrain_misc3 = 6;
				for (i2 = 6; i2 < 9; i2++) {
					let mapIndex = terrain_misc2[i2] = terrain_random(0, 2);

					terrain_terrainMap[i2] = BABYLON.MeshBuilder.CreateGroundFromHeightMap("Generated Ground - PHYSICS ONLY", heightmaps[mapIndex],
						{ width: terrain_size, height: terrain_size, subdivisions: terrain_subdivs, maxHeight: terrain_height, onReady: terrain_executePhysicsAddOne }, carScene
					);

					terrain_terrainMap[i2]._fakeMesh = BABYLON.MeshBuilder.CreateGroundFromHeightMap("Generated Ground - DISPLAY ONLY", heightmaps[mapIndex],
						{
							width: terrain_size, height: terrain_size, subdivisions: terrain_subdivs, maxHeight: terrain_height, onReady: terrain_executeDisplayAddOne
						}, carScene
					);
				}
			}
			else if ( // if the sphere is below the y-coordinate of the center tile
				spherePos.z < ((terrain_tileOffsets[4][1] + .5) * terrain_size - terrain_size)
			) { // shift the entire offset map and terrain map by -1 on the 2D y axis?
				for (i = 6; i < 9; i++) { terrain_terrainMap[i]._fakeMesh.dispose(); terrain_terrainMap[i].dispose(); }
				for (i = 8; i > 2; i--) { terrain_terrainMap[i] = terrain_terrainMap[i - 3]; terrain_tileOffsets[i] = terrain_tileOffsets[i - 3]; }

				// generate the new offsets
				for (i = 0; i < 3; i++) terrain_tileOffsets[i] = [terrain_tileOffsets[i][0], terrain_tileOffsets[i][1] - 1];

				// generate new tiles for 0, 1, 2
				terrain_misc1 = 0;
				terrain_misc3 = 0;
				for (i2 = 0; i2 < 3; i2++) {
					let mapIndex = terrain_misc2[i2] = terrain_random(0, 2);

					terrain_terrainMap[i2] = BABYLON.MeshBuilder.CreateGroundFromHeightMap("Generated Ground - PHYSICS ONLY", heightmaps[mapIndex],
						{ width: terrain_size, height: terrain_size, subdivisions: terrain_subdivs, maxHeight: terrain_height, onReady: terrain_executePhysicsAddOne }, carScene
					);

					terrain_terrainMap[i2]._fakeMesh = BABYLON.MeshBuilder.CreateGroundFromHeightMap("Generated Ground - DISPLAY ONLY", heightmaps[mapIndex],
						{ width: terrain_size, height: terrain_size, subdivisions: terrain_subdivs, maxHeight: terrain_height, onReady: terrain_executeDisplayAddOne }, carScene
					);
				}
			}

			skysphere.position = new BABYLON.Vector3(spherePos.x * -1, spherePos.y, spherePos.z);
			sun.position = new BABYLON.Vector3((spherePos.x * -1) + 10, 8, spherePos.z + 10);
		}
	});
}

function terrain_executePhysicsAddOne(terrain_mesh) {
	// Shift
	terrain_terrainMap[terrain_misc1].position = new BABYLON.Vector3(
		terrain_tileOffsets[terrain_misc1][0] * terrain_size,
		0,
		terrain_tileOffsets[terrain_misc1][1] * terrain_size
	);

	// Physics ONLY
	terrain_terrainMap[terrain_misc1].physicsImpostor = new BABYLON.PhysicsImpostor(terrain_mesh, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 0.5, restitution: 0.1 }, carScene);

	// Scale
	terrain_terrainMap[terrain_misc1].scaling = new BABYLON.Vector3(-1, 1, 1);

	terrain_terrainMap[terrain_misc1].visibility = 0;
	terrain_misc1++;
}

function terrain_executeDisplayAddOne(terrain_mesh) {
	// Shift
	terrain_terrainMap[terrain_misc3]._fakeMesh.position = new BABYLON.Vector3(
		terrain_tileOffsets[terrain_misc3][0] * (terrain_size * -1),
		0,
		terrain_tileOffsets[terrain_misc3][1] * terrain_size
	);

	// Material
	terrain_terrainMap[terrain_misc3]._fakeMesh.material = terrainMaterials[terrain_misc2[terrain_misc3]];
	terrain_terrainMap[terrain_misc3]._fakeMesh.receiveShadows = true;

	// Scale
	terrain_terrainMap[terrain_misc3]._fakeMesh.scaling = new BABYLON.Vector3(-1, 1, 1);

	terrain_misc3++;
}

function terrain_executePhysicsAddThree(terrain_mesh) {
	// Shift
	terrain_terrainMap[terrain_misc1].position = new BABYLON.Vector3(
		terrain_tileOffsets[terrain_misc1][0] * terrain_size,
		0,
		terrain_tileOffsets[terrain_misc1][1] * terrain_size
	);

	// Physics ONLY
	terrain_terrainMap[terrain_misc1].physicsImpostor = new BABYLON.PhysicsImpostor(terrain_mesh, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 0.5, restitution: 0.1 }, carScene);

	// Scale
	// terrain_terrainMap[terrain_misc1].scaling = new BABYLON.Vector3(-1, 1, 1);

	terrain_terrainMap[terrain_misc1].visibility = 0;
	terrain_misc1 += 3;
}

function terrain_executeDisplayAddThree(terrain_mesh) {
	// Shift
	terrain_mesh.position = new BABYLON.Vector3(
		terrain_tileOffsets[terrain_misc3][0] * (terrain_size * -1),
		0,
		terrain_tileOffsets[terrain_misc3][1] * (terrain_size)
	);

	// Material
	terrain_terrainMap[terrain_misc3]._fakeMesh.material = terrainMaterials[terrain_misc2[terrain_misc3]];
	terrain_terrainMap[terrain_misc3]._fakeMesh.receiveShadows = true;

	// Scale
	terrain_terrainMap[terrain_misc3]._fakeMesh.scaling = new BABYLON.Vector3(-1, 1, 1);

	terrain_misc3 += 3;
}

function terrain_prettyPrint() {
	let stringA = "";
	let stringB = "";

	for (i = 0; i < 3; i++) {
		stringA += "[" + terrain_tileOffsets[i][0] + " " + terrain_tileOffsets[i][1] + "], ";
		stringB += "[" + terrain_terrainMap[i].name + "], ";
	}
	stringA += "\n";
	stringB += "\n";

	for (i = 3; i < 6; i++) {
		stringA += "[" + terrain_tileOffsets[i][0] + " " + terrain_tileOffsets[i][1] + "], ";
		stringB += "[" + terrain_terrainMap[i].name + "], ";
	}
	stringA += "\n";
	stringB += "\n";

	for (i = 6; i < 9; i++) {
		stringA += "[" + terrain_tileOffsets[i][0] + " " + terrain_tileOffsets[i][1] + "], ";
		stringB += "[" + terrain_terrainMap[i].name + "], ";
	}
	stringA += "\n";
	stringB += "\n";

	console.log(stringA);
	console.log(stringB);
}

function terrain_random(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }