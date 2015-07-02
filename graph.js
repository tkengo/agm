var camera;
var controls;
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();

window.onload = function() {
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var wwh = Math.floor(ww / 2);
  var whh = Math.floor(wh / 2);

  camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0, 10000);
  //camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
  controls = new THREE.TrackballControls(camera);
  renderer.setSize( window.innerHeight, window.innerHeight );
  renderer.setClearColor(0xffffff);
  document.body.appendChild( renderer.domElement );

  var geometry = new THREE.BoxGeometry( 1, 1, 1 );
  var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  var cube = new THREE.Mesh( geometry, material );
//  scene.add( cube );
  var axes = buildAxes();
  for (var i = 0; i < axes.length; i++) {
    scene.add(axes[i]);
  }

  camera.position.x = 15;
  camera.position.y = 10;
  camera.position.z = 15;
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  var render = function () {
    requestAnimationFrame( render );
    controls.update();
    renderer.render(scene, camera);
  };

  render();
};

controls.rotateSpeed = 5.0;
controls.zoomSpeed = 0.2;
controls.panSpeed = 0.8;

controls.noZoom = false;
controls.noPan = false;

controls.staticMoving = true;
controls.dynamicDampingFactor = 0.3;

function buildAxes() {
  var axes = [];

  var mainMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
  var subMaterial  = new THREE.LineBasicMaterial({ color: 0xdddddd });

  var mainGeo = new THREE.Geometry();
  var subGeo  = new THREE.Geometry();

  mainGeo.vertices.push(
    // x軸
    new THREE.Vector3(0,  0, 0),
    new THREE.Vector3(10, 0, 0),

    // y軸
    new THREE.Vector3(0,  0, 0),
    new THREE.Vector3(0, 10, 0),

    // z軸
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 10)
  );

  for (var i = 1; i <= 10; i++) {
    subGeo.vertices.push(
      // x-z 平面
      new THREE.Vector3(0,  0, i),
      new THREE.Vector3(10, 0, i),
      new THREE.Vector3(i,  0, 0),
      new THREE.Vector3(i,  0, 10),

      // x-y 平面
      new THREE.Vector3(0,  i, 0),
      new THREE.Vector3(10, i, 0),
      new THREE.Vector3(i,  0, 0),
      new THREE.Vector3(i, 10, 0),

      // y-z 平面
      new THREE.Vector3(0,  0, i),
      new THREE.Vector3(0, 10, i),
      new THREE.Vector3(0,  i, 0),
      new THREE.Vector3(0,  i, 10)
    );
  }

  axes.push(new THREE.Line(mainGeo, mainMaterial, THREE.LinePieces));
  axes.push(new THREE.Line(subGeo,  subMaterial,  THREE.LinePieces));

  return axes;
}
