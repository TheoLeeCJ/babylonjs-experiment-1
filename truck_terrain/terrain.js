for (i = 0; i < 3; i++) {
	var terrainMaterial = new BABYLON.TerrainMaterial("Terrain Material " + i, carScene);
	terrainMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
	terrainMaterial.specularPower = 64;

	// Set the mix texture (represents the RGB values)
	terrainMaterial.mixTexture = new BABYLON.Texture("../assets/mixMap" + i + ".png", carScene);

	// Diffuse textures following the RGB values of the mix map
	// diffuseTexture1: Red
	// diffuseTexture2: Green
	// diffuseTexture3: Blue
	terrainMaterial.diffuseTexture1 = new BABYLON.Texture("../assets/floor.png", carScene);
	terrainMaterial.diffuseTexture2 = new BABYLON.Texture("../assets/rock.png", carScene);
	terrainMaterial.diffuseTexture3 = new BABYLON.Texture("../assets/grass.png", carScene);

	// Bump textures according to the previously set diffuse textures
	terrainMaterial.bumpTexture1 = new BABYLON.Texture("../assets/floor_bump.png", carScene);
	terrainMaterial.bumpTexture2 = new BABYLON.Texture("../assets/rockn.png", carScene);
	terrainMaterial.bumpTexture3 = new BABYLON.Texture("../assets/grassn.png", carScene);

	// Rescale textures according to the terrain
	terrainMaterial.diffuseTexture1.uScale = terrainMaterial.diffuseTexture1.vScale = 10;
	terrainMaterial.diffuseTexture2.uScale = terrainMaterial.diffuseTexture2.vScale = 10;
	terrainMaterial.diffuseTexture3.uScale = terrainMaterial.diffuseTexture3.vScale = 10;

	terrainMaterials.push(terrainMaterial);
}