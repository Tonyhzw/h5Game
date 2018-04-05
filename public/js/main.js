// 参数配置
//COLORS
var Colors = {
    red:0xf25346,
    white:0xd8d0d1,
    brown:0x59332e,
    brownDark:0x23190f,
    pink:0xF5986E,
    yellow:0xf4ce93,
    blue:0x68c3c0,

};
//rotate  environment
var floorRotation = 0,delta = 0,clock, speed = 6;
///////////////

// GAME VARIABLES
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];
// 设置游戏初始化参数
function resetGame(){
  game = {speed:0,
          initSpeed:.00035,
          baseSpeed:.00035,
          targetBaseSpeed:.00035,
          incrementSpeedByTime:.0000025,
          incrementSpeedByLevel:.000005,
          distanceForSpeedUpdate:100,
          speedLastUpdate:0,

          distance:0,
          ratioSpeedDistance:50,
          energy:100,
          ratioSpeedEnergy:3,

          level:1,
          levelLastUpdate:0,
          distanceForLevelUpdate:1000,

          modelDefaultHeight:300,
          modelAmpHeight:80,
          modelAmpWidth:75,
          modelMoveSensivity:0.005,
          modelRotXSensivity:0.0008,
          modelRotZSensivity:0.0004,
          modelFallSpeed:.001,
          modelMinSpeed:1.2,
          modelMaxSpeed:1.6,
          modelSpeed:0,
          modelCollisionDisplacementX:0,
          modelCollisionSpeedX:0,

          modelCollisionDisplacementY:0,
          modelCollisionSpeedY:0,

          seaRadius:100,

          cameraFarPos:500,
          cameraNearPos:150,
          cameraSensivity:0.002,

          coinDistanceTolerance:15,
          coinValue:3,
          coinsSpeed:.5,
          coinLastSpawn:0,
          distanceForCoinsSpawn:100,

          ennemyDistanceTolerance:10,
          ennemyValue:10,
          ennemiesSpeed:.6,
          ennemyLastSpawn:0,
          distanceForEnnemiesSpawn:50,

          status : "playing",
         };
  if(ambientLight) ambientLight.intensity = 0.5;
  fieldLevel.innerHTML = Math.floor(game.level);
}

//THREEJS RELATED VARIABLES

var scene,
    camera, fieldOfView, aspectRatio, nearmodel, farmodel,
    renderer,
    container,
    controls;

//SCREEN & MOUSE VARIABLES

var HEIGHT, WIDTH,
    mousePos = { x: 0, y: 0 };

//INIT THREE JS, SCREEN AND MOUSE EVENTS

function createScene() {

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearmodel = .1;
  farmodel = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearmodel,
    farmodel
    );
  scene.fog = new THREE.Fog(0xf7d9aa, 100,950);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = game.modelDefaultHeight;
  camera.lookAt(new THREE.Vector3(0, game.modelDefaultHeight, 200));

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);

  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);


}

// MOUSE AND SCREEN EVENTS

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH)*2;
  var ty = 1 - (event.clientY / HEIGHT)*2;
  mousePos = {x:tx, y:ty};
}

function handleTouchMove(event) {
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX / WIDTH)*2;
    var ty = 1 - (event.touches[0].pageY / HEIGHT)*2;
    mousePos = {x:tx, y:ty};
}

function handleMouseUp(event){
  if (game.status == "waitingReplay"){
    resetGame();
    hideReplay();
  }
}


function handleTouchEnd(event){
  if (game.status == "waitingReplay"){
    resetGame();
    hideReplay();
  }
}

// 灯光效果 环境光  半球光  平行光

var ambientLight, hemisphereLight, shadowLight;

function createLights() {

  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)

  ambientLight = new THREE.AmbientLight(0xdc8874, .5);

  shadowLight = new THREE.DirectionalLight(0xffffff, .3);
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

  //var ch = new THREE.CameraHelper(shadowLight.shadow.camera);

  //scene.add(ch);
  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);

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
            // if (xhr.lengthComputable) {
            //     var percentComplete = xhr.loaded / xhr.total * 100;
            //     console.log(Math.round(percentComplete, 2) + '% downloaded');
            // }
        }, function(xhr) {
            //onError
            reject();
        });
    });
}

//3d model3  小人、地球

var model, environment;
//加载模型
function createModelAndEnvironment(){
  var promiseModel = resourceFectch('resource/modelFly.mtl', 'resource/modelFly.obj');
  var promiseEnvironment = resourceFectch('resource/environment.mtl', 'resource/environment.obj');
  Promise.all([promiseModel, promiseEnvironment]).then(function(values) {
     console.log(values);
     model = values[0];
     model.scale.set(.1,.1,.1);
     model.castShadow = true;
     model.receiveShadow = true;
     scene.add(model);

     environment = values[1];
     environment.scale.set(.5,.5,.5);
     environment.position.y = game.modelDefaultHeight -200;
     environment.position.z = -10;
     scene.add(environment);

     //创建金币、障碍物、障碍物分解物
     createCoins();
     createEnnemies();
     createParticles();
     //循环游戏
     loop();
 });
}
Ennemy = function(){
  var geom = new THREE.TetrahedronGeometry(3,2);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.red,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

EnnemiesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.ennemiesInUse = [];
}

EnnemiesHolder.prototype.spawnEnnemies = function(){
  var nEnnemies = game.level;

  for (var i=0; i<nEnnemies; i++){
    var ennemy;
    if (ennemiesPool.length) {
      ennemy = ennemiesPool.pop();
    }else{
      ennemy = new Ennemy();
    }

    ennemy.angle = - (i*0.1);
    ennemy.distance = game.seaRadius + game.modelDefaultHeight + (-1 + Math.random() * 2) * (game.modelAmpHeight-20);
    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;

    this.mesh.add(ennemy.mesh);
    this.ennemiesInUse.push(ennemy);
  }
}

EnnemiesHolder.prototype.rotateEnnemies = function(){
  for (var i=0; i<this.ennemiesInUse.length; i++){
    var ennemy = this.ennemiesInUse[i];
    ennemy.angle += game.speed*deltaTime*game.ennemiesSpeed;

    if (ennemy.angle > Math.PI*2) ennemy.angle -= Math.PI*2;

    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
    ennemy.mesh.rotation.z += Math.random()*.1;
    ennemy.mesh.rotation.y += Math.random()*.1;

    //var globalEnnemyPosition =  ennemy.mesh.localToWorld(new THREE.Vector3());
    var diffPos = model.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.ennemyDistanceTolerance){
      particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.red, 3);

      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      game.modelCollisionSpeedX = 100 * diffPos.x / d;
      game.modelCollisionSpeedY = 100 * diffPos.y / d;
      //ambientLight.intensity = 1;

      removeEnergy();
      i--;
    }else if (ennemy.angle > Math.PI){
      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
}

Particle = function(){
  var geom = new THREE.TetrahedronGeometry(1,0);
  var mat = new THREE.MeshPhongMaterial({
    color:0x009999,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
}

Particle.prototype.explode = function(pos, color, scale){
  var _this = this;
  var _p = this.mesh.parent;
  this.mesh.material.color = new THREE.Color( color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  var targetX = pos.x + (-1 + Math.random()*2)*50;
  var targetY = pos.y + (-1 + Math.random()*2)*50;
  var speed = .6+Math.random()*.2;
  TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12});
  TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
  TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, delay:Math.random() *.1, ease:Power2.easeOut, onComplete:function(){
      if(_p) _p.remove(_this.mesh);
      _this.mesh.scale.set(1,1,1);
      particlesPool.unshift(_this);
    }});
}

ParticlesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale){

  var nPArticles = density;
  for (var i=0; i<nPArticles; i++){
    var particle;
    if (particlesPool.length) {
      particle = particlesPool.pop();
    }else{
      particle = new Particle();
    }
    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    var _this = this;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.explode(pos,color, scale);
  }
}

Coin = function(){
  var geom = new THREE.TetrahedronGeometry(3,0);
  var mat = new THREE.MeshPhongMaterial({
    color:0x009999,
    shininess:0,
    specular:0xffffff,

    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

CoinsHolder = function (nCoins){
  this.mesh = new THREE.Object3D();
  this.coinsInUse = [];
  this.coinsPool = [];
  for (var i=0; i<nCoins; i++){
    var coin = new Coin();
    this.coinsPool.push(coin);
  }
}

CoinsHolder.prototype.spawnCoins = function(){

  var nCoins = 1 + Math.floor(Math.random()*10);
  var d = game.seaRadius + game.modelDefaultHeight + (-1 + Math.random() * 2) * (game.modelAmpHeight-20);
  var amplitude = 10 + Math.round(Math.random()*10);
  for (var i=0; i<nCoins; i++){
    var coin;
    if (this.coinsPool.length) {
      coin = this.coinsPool.pop();
    }else{
      coin = new Coin();
    }
    this.mesh.add(coin.mesh);
    this.coinsInUse.push(coin);
    coin.angle = - (i*0.02);
    coin.distance = d + Math.cos(i*.5)*amplitude;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
  }
}

CoinsHolder.prototype.rotateCoins = function(){
  for (var i=0; i<this.coinsInUse.length; i++){
    var coin = this.coinsInUse[i];
    if (coin.exploding) continue;
    coin.angle += game.speed*deltaTime*game.coinsSpeed;
    if (coin.angle>Math.PI*2) coin.angle -= Math.PI*2;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
    coin.mesh.rotation.z += Math.random()*.1;
    coin.mesh.rotation.y += Math.random()*.1;

    //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
    var diffPos = model.position.clone().sub(coin.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.coinDistanceTolerance){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, .8);
      addEnergy();
      i--;
    }else if (coin.angle > Math.PI){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      i--;
    }
  }
}

function createCoins(){

  coinsHolder = new CoinsHolder(20);
  scene.add(coinsHolder.mesh)
}

function createEnnemies(){
  for (var i=0; i<10; i++){
    var ennemy = new Ennemy();
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(ennemiesHolder.mesh)
}

function createParticles(){
  for (var i=0; i<10; i++){
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(particlesHolder.mesh)
}
//循环，游戏
function loop(){

  newTime = new Date().getTime();
  deltaTime = newTime-oldTime;
  oldTime = newTime;
  //console.log(deltaTime);

  if (game.status=="playing"){

    // Add energy coins every 100m;
    if (Math.floor(game.distance)%game.distanceForCoinsSpawn == 0 && Math.floor(game.distance) > game.coinLastSpawn){
      game.coinLastSpawn = Math.floor(game.distance);
      coinsHolder.spawnCoins();
    }

    if (Math.floor(game.distance)%game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate){
      game.speedLastUpdate = Math.floor(game.distance);
      game.targetBaseSpeed += game.incrementSpeedByTime*deltaTime;
    }


    if (Math.floor(game.distance)%game.distanceForEnnemiesSpawn == 0 && Math.floor(game.distance) > game.ennemyLastSpawn){
      game.ennemyLastSpawn = Math.floor(game.distance);
      ennemiesHolder.spawnEnnemies();
    }

    if (Math.floor(game.distance)%game.distanceForLevelUpdate == 0 && Math.floor(game.distance) > game.levelLastUpdate){
      game.levelLastUpdate = Math.floor(game.distance);
      game.level++;
      fieldLevel.innerHTML = Math.floor(game.level);

      game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel*game.level
    }


    updateModel();
    delta = clock.getDelta();
    updateEnvironment();
    updateDistance();
    updateEnergy();
    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    game.speed = game.baseSpeed * game.modelSpeed;

  }else if(game.status=="gameover"){
    game.speed *= .99;
    model.rotation.z += (-Math.PI/2 - model.rotation.z)*.0002*deltaTime;
    model.rotation.x += 0.0003*deltaTime;
    game.modelFallSpeed *= 1.05;
    model.position.y -= game.modelFallSpeed*deltaTime;

    if (model.position.y <-200){
      showReplay();
      game.status = "waitingReplay";

    }
  }else if (game.status=="waitingReplay"){

  }
  //ambientLight.intensity += (.5 - ambientLight.intensity)*deltaTime*0.005;
  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();
  ambientLight.intensity-=0.0002;
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
//更新距离，并显示
function updateDistance(){
  game.distance += game.speed*deltaTime*game.ratioSpeedDistance;
  fieldDistance.innerHTML = Math.floor(game.distance);
  var d = 502*(1-(game.distance%game.distanceForLevelUpdate)/game.distanceForLevelUpdate);
  levelCircle.setAttribute("stroke-dashoffset", d);
}

var blinkEnergy=false;
//更新能量及状态
function updateEnergy(){
  game.energy -= game.speed*deltaTime*game.ratioSpeedEnergy;
  game.energy = Math.max(0, game.energy);
  energyBar.style.right = (100-game.energy)+"%";
  energyBar.style.backgroundColor = (game.energy<50)? "#f25346" : "#68c3c0";

  if (game.energy<30){
    energyBar.style.animationName = "blinking";
  }else{
    energyBar.style.animationName = "none";
  }

  if (game.energy <1){
    game.status = "gameover";
  }
}

function addEnergy(){
  game.energy += game.coinValue;
  game.energy = Math.min(game.energy, 100);
}

function removeEnergy(){
  game.energy -= game.ennemyValue;
  game.energy = Math.max(0, game.energy);
}
//更新小人状态
function updateModel(){

  game.modelSpeed = normalize(mousePos.x,-.5,.5,game.modelMinSpeed, game.modelMaxSpeed);
  var targetY = normalize(mousePos.y,-.75,.75,game.modelDefaultHeight-game.modelAmpHeight, game.modelDefaultHeight+game.modelAmpHeight);
  var targetX = normalize(mousePos.x,-1,1,-game.modelAmpWidth*.7, -game.modelAmpWidth);

  game.modelCollisionDisplacementX += game.modelCollisionSpeedX;
  targetX += game.modelCollisionDisplacementX;


  game.modelCollisionDisplacementY += game.modelCollisionSpeedY;
  targetY += game.modelCollisionDisplacementY;

  model.position.y += (targetY-model.position.y)*deltaTime*game.modelMoveSensivity;
  model.position.x += (targetX-model.position.x)*deltaTime*game.modelMoveSensivity;

  model.rotation.z = (targetY-model.position.y)*deltaTime*game.modelRotXSensivity;
  model.rotation.x = (model.position.y-targetY)*deltaTime*game.modelRotZSensivity;
  // var targetCameraZ = normalize(game.modelSpeed, game.modelMinSpeed, game.modelMaxSpeed, game.cameraNearPos, game.cameraFarPos);
  // camera.fov = normalize(mousePos.x,-1,1,40, 80);
  // camera.updateProjectionMatrix ()
  // camera.position.y += (model.position.y - camera.position.y)*deltaTime*game.cameraSensivity;
  game.modelCollisionSpeedX += (0-game.modelCollisionSpeedX)*deltaTime * 0.03;
  game.modelCollisionDisplacementX += (0-game.modelCollisionDisplacementX)*deltaTime *0.01;
  game.modelCollisionSpeedY += (0-game.modelCollisionSpeedY)*deltaTime * 0.03;
  game.modelCollisionDisplacementY += (0-game.modelCollisionDisplacementY)*deltaTime *0.01;

}

function showReplay(){
  replayMessage.style.display="block";
}

function hideReplay(){
  replayMessage.style.display="none";
}

function normalize(v,vmin,vmax,tmin, tmax){
  var nv = Math.max(Math.min(v,vmax), vmin);
  var dv = vmax-vmin;
  var pc = (nv-vmin)/dv;
  var dt = tmax-tmin;
  var tv = tmin + (pc*dt);
  return tv;
}

var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;
//初始化
function init(event){

  //绑定显示
  fieldDistance = document.getElementById("distValue");
  energyBar = document.getElementById("energyBar");
  replayMessage = document.getElementById("replayMessage");
  fieldLevel = document.getElementById("levelValue");
  levelCircle = document.getElementById("levelCircleStroke");
  //初始化游戏参数、场景、灯光，加载模型及地球
  resetGame();
  createScene();
  createLights();
  createModelAndEnvironment();
  //绑定鼠标操作
  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('mouseup', handleMouseUp, false);
  document.addEventListener('touchend', handleTouchEnd, false);
  //获取时钟，便于后期做随机
  clock = new THREE.Clock();

}
// 旋转地球
function updateEnvironment(){

  floorRotation += delta*.03 * speed;
  floorRotation = floorRotation%(Math.PI*2);
  environment.rotation.z = floorRotation;
}


window.addEventListener('load', init, false);
