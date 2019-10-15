let terrain_tileSize = 64;
let terrain_map = [];
let tileOffsets = [
	[-1, -1], [0, -1], [1, -1],
	[-1, 0], [0, 0], [1, 0],
	[-1, 1], [0, 1], [1, 1]
];
let i2_b = 0;
let i2_bank_rand = [];
let clips = 0;

function qj_random(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setupGround() {
	// Populate initial terrain map
	for (i = 0; i < 9; i++) {
		let mapIndex = qj_random(0, 2);
		let terrainMaps = terrain_map.length;

		terrain_map[terrainMaps] = new BABYLON.Mesh.CreateGroundFromHeightMap("Ground " + terrainMaps, "/assets/textures/heightMap" + mapIndex + ".png", terrain_tileSize, terrain_tileSize, 48, 0, 10 / 2, carScene, false, (mesh) => {
			terrain_map[terrainMaps].position = new BABYLON.Vector3(
				tileOffsets[terrainMaps][0] * terrain_tileSize,
				0,
				tileOffsets[terrainMaps][1] * terrain_tileSize
			);
			terrain_map[terrainMaps].physicsImpostor = new BABYLON.PhysicsImpostor(terrain_map[terrainMaps], BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 0.5, restitution: 0.1 }, carScene);
			terrain_map[terrainMaps].scaling = new BABYLON.Vector3(-1, 1, 1);
			terrain_map[terrainMaps].material = terrainMaterials[mapIndex];

			if (terrain_map[8]) sceneReady = true;
		});
	}

	registerTerrainEvent();
}

function registerTerrainEvent() {
	// Principle: ensure that the chosen mesh (sphere in this case) is always in the center tile (#4 in the array)
	carScene.registerAfterRender(() => {
		if (sceneReady) {
			let spherePos = carScene.getNodeByName("Cube").position;
			sphere = carScene.getNodeByName("Cube");

			// if ( // if the sphere is above the x-coordinate of the center tile
			// 	spherePos.x > ((tileOffsets[4][0] + .5) * (terrain_tileSize / 1))
			// ) {
			// 	for (i = 0; i < 7; i += 3) terrain_map[i].dispose();

			// 	terrain_map[0] = terrain_map[1];
			// 	terrain_map[1] = terrain_map[2];
			// 	terrain_map[3] = terrain_map[4];
			// 	terrain_map[4] = terrain_map[5];
			// 	terrain_map[6] = terrain_map[7];
			// 	terrain_map[7] = terrain_map[8];

			// 	tileOffsets[0] = tileOffsets[1];
			// 	tileOffsets[1] = tileOffsets[2];
			// 	tileOffsets[3] = tileOffsets[4];
			// 	tileOffsets[4] = tileOffsets[5];
			// 	tileOffsets[6] = tileOffsets[7];
			// 	tileOffsets[7] = tileOffsets[8];

			// 	tileOffsets[2] = [tileOffsets[2][0] + 1, tileOffsets[2][1]];
			// 	tileOffsets[5] = [tileOffsets[5][0] + 1, tileOffsets[5][1]];
			// 	tileOffsets[8] = [tileOffsets[8][0] + 1, tileOffsets[8][1]];

			// 	// generate new tiles for 2, 5, 8
			// 	i2_b = 2;
			// 	for (i2 = 2; i2 < 8; i2 += 3) {
			// 		let mapIndex = qj_random(0, 2);
			// 		i2_bank_rand[i2] = mapIndex;

			// 		terrain_map[i2] = new BABYLON.Mesh.CreateGroundFromHeightMap("Ground - Generated Dynamically", "/assets/textures/heightMap" + mapIndex + ".png", terrain_tileSize, terrain_tileSize, 48, 0, 10 / 2, carScene, false, (mesh) => {
			// 			terrain_map[i2_b].position = new BABYLON.Vector3(
			// 				tileOffsets[i2_b][0] * terrain_tileSize,
			// 				0,
			// 				tileOffsets[i2_b][1] * terrain_tileSize
			// 			);
			// 			terrain_map[i2_b].physicsImpostor = new BABYLON.PhysicsImpostor(terrain_map[i2_b], BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 0.5, restitution: 0.1 }, carScene);
			// 			terrain_map[i2_b].scaling = new BABYLON.Vector3(-1, 1, 1);
			// 			terrain_map[i2_b].material = terrainMaterials[i2_bank_rand[i2_b]];
			// 			terrain_map[i2_b].receiveShadows = true;

			// 			i2_b += 3;
			// 		});
			// 	}
			// }
			// else if ( // if the sphere is below the x-coordinate of the center tile
			// 	spherePos.x < ((tileOffsets[4][0] + .5) * terrain_tileSize - terrain_tileSize)
			// ) { // shift the entire offset map and terrain map by -1 on the 2D y axis?
			// 	for (i = 2; i < 9; i += 3) terrain_map[i].dispose();

			// 	terrain_map[2] = terrain_map[1];
			// 	terrain_map[1] = terrain_map[0];
			// 	terrain_map[5] = terrain_map[4];
			// 	terrain_map[4] = terrain_map[3];
			// 	terrain_map[8] = terrain_map[7];
			// 	terrain_map[7] = terrain_map[6];

			// 	tileOffsets[2] = tileOffsets[1];
			// 	tileOffsets[1] = tileOffsets[0];
			// 	tileOffsets[5] = tileOffsets[4];
			// 	tileOffsets[4] = tileOffsets[3];
			// 	tileOffsets[8] = tileOffsets[7];
			// 	tileOffsets[7] = tileOffsets[6];

			// 	tileOffsets[0] = [tileOffsets[0][0] - 1, tileOffsets[0][1]];
			// 	tileOffsets[3] = [tileOffsets[3][0] - 1, tileOffsets[3][1]];
			// 	tileOffsets[6] = [tileOffsets[6][0] - 1, tileOffsets[6][1]];

			// 	// generate new tiles for 0, 3, 6
			// 	i2_b = 0;
			// 	for (i2 = 0; i2 < 7; i2 += 3) {
			// 		let mapIndex = qj_random(0, 2);
			// 		i2_bank_rand[i2] = mapIndex;

			// 		terrain_map[i2] = new BABYLON.Mesh.CreateGroundFromHeightMap("Ground - Generated Dynamically", "/assets/textures/heightMap" + mapIndex + ".png", terrain_tileSize, terrain_tileSize, 48, 0, 10 / 2, carScene, false, (mesh) => {
			// 			terrain_map[i2_b].position = new BABYLON.Vector3(
			// 				tileOffsets[i2_b][0] * terrain_tileSize,
			// 				0,
			// 				tileOffsets[i2_b][1] * terrain_tileSize
			// 			);
			// 			terrain_map[i2_b].physicsImpostor = new BABYLON.PhysicsImpostor(terrain_map[i2_b], BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 0.5, restitution: 0.1 }, carScene);
			// 			terrain_map[i2_b].scaling = new BABYLON.Vector3(-1, 1, 1);
			// 			terrain_map[i2_b].material = terrainMaterials[i2_bank_rand[i2_b]];
			// 			terrain_map[i2_b].receiveShadows = true;

			// 			i2_b += 3;
			// 		});
			// 	}
			// }

			if ( // if the sphere is above the y-coordinate of the center tile
				(spherePos.z > ((tileOffsets[4][1] + .5) * (terrain_tileSize / 1)))
			) { // shift the entire offset map and terrain map by +1 on the 2D y axis?
				for (i = 0; i < 3; i++) terrain_map[i].dispose();
				for (i = 0; i < 6; i++) {
					terrain_map[i] = terrain_map[i + 3];
					tileOffsets[i] = tileOffsets[i + 3];
				}

				tileOffsets[6] = [tileOffsets[6][0], tileOffsets[6][1] + 1];
				tileOffsets[7] = [tileOffsets[7][0], tileOffsets[7][1] + 1];
				tileOffsets[8] = [tileOffsets[8][0], tileOffsets[8][1] + 1];

				// generate new tiles for 6, 7, 8
				i2_b = 6;
				for (i2 = 6; i2 < 9; i2++) {
					let mapIndex = qj_random(0, 2);
					i2_bank_rand[i2] = mapIndex;

					terrain_map[i2] = new BABYLON.Mesh.CreateGroundFromHeightMap("Ground - Generated Dynamically", "/assets/textures/heightMap" + mapIndex + ".png", terrain_tileSize, terrain_tileSize, 48, 0, 10 / 2, carScene, false, (mesh) => {
						terrain_map[i2_b].position = new BABYLON.Vector3(
							tileOffsets[i2_b][0] * terrain_tileSize,
							0,
							tileOffsets[i2_b][1] * terrain_tileSize
						);
						terrain_map[i2_b].physicsImpostor = new BABYLON.PhysicsImpostor(terrain_map[i2_b], BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 0.5, restitution: 0.1 }, carScene);
						terrain_map[i2_b].scaling = new BABYLON.Vector3(-1, 1, 1);
						terrain_map[i2_b].material = terrainMaterials[i2_bank_rand[i2_b]];
						terrain_map[i2_b].receiveShadows = true;

						i2_b++;
					});
				}
			}
			else if ( // if the sphere is below the y-coordinate of the center tile
				spherePos.z < ((tileOffsets[4][1] + .5) * terrain_tileSize - terrain_tileSize)
			) { // shift the entire offset map and terrain map by -1 on the 2D y axis?
				for (i = 6; i < 9; i++) terrain_map[i].dispose();

				for (i = 8; i > 2; i--) {
					terrain_map[i] = terrain_map[i - 3];
					tileOffsets[i] = tileOffsets[i - 3];
				}

				tileOffsets[0] = [tileOffsets[0][0], tileOffsets[0][1] - 1];
				tileOffsets[1] = [tileOffsets[1][0], tileOffsets[1][1] - 1];
				tileOffsets[2] = [tileOffsets[2][0], tileOffsets[2][1] - 1];

				// generate new tiles for 0, 1, 2
				i2_b = 0;
				for (i2 = 0; i2 < 3; i2++) {
					let mapIndex = qj_random(0, 2);
					i2_bank_rand[i2] = mapIndex;

					terrain_map[i2] = new BABYLON.Mesh.CreateGroundFromHeightMap("Ground - Generated Dynamically", "/assets/textures/heightMap" + mapIndex + ".png", terrain_tileSize, terrain_tileSize, 48, 0, 10 / 2, carScene, false, (mesh) => {
						terrain_map[i2_b].position = new BABYLON.Vector3(
							tileOffsets[i2_b][0] * terrain_tileSize,
							0,
							tileOffsets[i2_b][1] * terrain_tileSize
						);
						terrain_map[i2_b].physicsImpostor = new BABYLON.PhysicsImpostor(terrain_map[i2_b], BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 0.5, restitution: 0.1 }, carScene);
						terrain_map[i2_b].scaling = new BABYLON.Vector3(-1, 1, 1);
						terrain_map[i2_b].material = terrainMaterials[i2_bank_rand[i2_b]];
						terrain_map[i2_b].receiveShadows = true;

						i2_b++;
					});
				}
			}

			if (spherePos.y < -1) {
				sphere.position.y = 10; // deal with the sphere falling through the ground
			}

			skysphere.position = spherePos;
			sun.position = new BABYLON.Vector3(spherePos.x + 100, 8, spherePos.z + 100);
		}
	});
}