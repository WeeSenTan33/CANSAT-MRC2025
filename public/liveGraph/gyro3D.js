window.addEventListener('DOMContentLoaded', function () {
  const canvas = document.getElementById('gyroCanvas');
  const engine = new BABYLON.Engine(canvas, true);

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0.2, 0.2, 0.3);

  const camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2.5, 5, BABYLON.Vector3.Zero(), scene);
  camera.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);

  // Load the soda can model from public assets
  BABYLON.SceneLoader.ImportMesh("", "Cansat/public/assets/", "soda_can3.glb", scene, function (meshes) {
    const model = meshes[0];
    model.scaling = new BABYLON.Vector3(1, 1, 1);
    model.rotation = new BABYLON.Vector3(0, 0, 0);
    window.cylinder = model;  // Make accessible for updateGraphs rotation
  });

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });
});
