var container, stats;

var camera, scene, renderer,clock;
var model,environment;

var mouseX = 0,
    mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var delta = 0;
var floorRadius = 200;
var speed = 6;
var distance = 0;
var level = 1;
var levelInterval;
var levelUpdateFreq = 3000;
var initSpeed = 5;
var maxSpeed = 48;
var monsterPos = .65;
var monsterPosTarget = .65;
var floorRotation = 0;
var collisionObstacle = 10;
var collisionBonus = 20;
var gameStatus = "play";
var cameraPosGame = 160;
var cameraPosGameOver = 260;
var monsterAcceleration = 0.004;
var malusClearColor = 0xb44b39;
var malusClearAlpha = 0;
var audio = new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/264161/Antonio-Vivaldi-Summer_01.mp3');
// LIGHTS

var ambientLight, hemisphereLight, shadowLight;

function createLights() {

  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)

  ambientLight = new THREE.AmbientLight(0xdc8874, .5);

  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;

  var ch = new THREE.CameraHelper(shadowLight.shadow.camera);

  //scene.add(ch);
  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);

}

init();
animate();

function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 100, 10000);
    //camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 10, 5000 );
    //camera.position.x =5000;
    camera.position.y = 0;
    camera.position.z = -1000;
    camera.lookAt({
        x: 0,
        y: 0,
        z: 1000
    });

    scene = new THREE.Scene();
  //  scene.fog = new THREE.Fog(0xf7d9aa, 100,950);

    // var ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    // scene.add(ambientLight);
    //
    // var pointLight = new THREE.PointLight(0xffffff, 0.4);
    // camera.add(pointLight);

    scene.add(camera);

    //light
    createLights();
    //create model
    var promiseModel = resourceFectch('source/model2.mtl', 'source/model2.obj');
    promiseModel.then(function(object) {
        //object.position.x = 200;
        //object.position.y = -300;
        object.position.z = -200;
        object.rotation.
        scene.add(object);
        model = object;
    });
    var promiseEnvironment = resourceFectch('resource/environment.mtl', 'resource/environment.obj');
    promiseEnvironment.then(function(object) {
        object.position.y = -300;
        object.position.z = -600;
        scene.add(object);
        environment = object;
    });
    // Promise.all([promiseModal, promiseEnvironment]).then(function(values) {
    //     console.log(values);
    //     values.forEach(function(value) {
    //         scene.add(value);
    //     })
    // });

    //createCoins();
    //createEnnemies();
    //createParticles();

    THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader());




    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    document.addEventListener('mousemove', onDocumentMouseMove, false);

    window.addEventListener('resize', onWindowResize, false);

    clock = new THREE.Clock();

}

function resourceFectch(mtlStr, objStr) {
    var mtlLoader = new THREE.MTLLoader();
    //mtlLoader.setPath('resource/');
    return new Promise(function(resolve, reject) {
        mtlLoader.load(mtlStr, function(materials) {
            materials.preload();
            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            //objLoader.setPath('resource/');
            objLoader.load(objStr, function(object) {
                //object.position.y = - 95;
                //console.dir(object);
                resolve(object);
                //scene.add( object );
            });
        }, function(xhr) {
            if (xhr.lengthComputable) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log(Math.round(percentComplete, 2) + '% downloaded');
            }
        }, function(xhr) {
            //onError
            reject();
        });
    });
}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onDocumentMouseMove(event) {

    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);

}

function animate() {


    //  renderer.render( scene, camera );
    //after
    delta = clock.getDelta();

    if(model)  updateModel();
    if(environment) updateEnvironment();

    //before
    requestAnimationFrame(animate);
    render();
}

 function render() {
    //radious =100;
    //camera.position.x += (mouseX - camera.position.x);
    //camera.position.y += (-mouseY - camera.position.y)
    // theta = - ( ( mouseX - camera.position.x ) * 0.5 );
    // phi = ( ( - mouseY - camera.position.y ) * 0.5 );
    //
    // phi = Math.min( 180, Math.max( 0, phi ) );
    //
    // camera.position.x = radious * Math.sin( theta * Math.PI / 360 )
    //                     * Math.cos( phi * Math.PI / 360 );
    // camera.position.y = radious * Math.sin( phi * Math.PI / 360 );
    // camera.position.z = radious * Math.cos( theta * Math.PI / 360 )
    //                     * Math.cos( phi * Math.PI / 360 );
    //camera.updateMatrix();
    camera.lookAt(scene.position);

    renderer.render(scene, camera);

}


function updateEnvironment(){
  floorRotation += delta*.03 * speed;
  floorRotation = floorRotation%(Math.PI*2);
  environment.rotation.z = floorRotation;
}

function updateModel(){
  //
  // floorRotation += delta*.03 * speed;
  // floorRotation = floorRotation%(Math.PI*2);
  // model.rotation.z = floorRotation;
}
