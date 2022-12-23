import * as THREE from 'three'
import StatsVR from 'statsvr'
import {VRButton} from 'three/examples/jsm/webxr/VRButton';
import TeleportVR from './teleportvr'
import {Points} from "three";

const scene: THREE.Scene = new THREE.Scene()

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(0, 1.6, 3)

const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.xr.enabled = true

document.body.appendChild(renderer.domElement)

document.body.appendChild(VRButton.createButton(renderer))

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20, 10, 10),
    new THREE.MeshBasicMaterial({
        color: 0x008800,
        wireframe: true,
    })
)
floor.rotation.x = Math.PI / -2
floor.position.y = -0.001
scene.add(floor)

let spotLight: THREE.SpotLight, lightHelper: THREE.SpotLightHelper;

let p: Points;
let hasColors = false;
let format: String;
let version: String;
let numVertices: number;
let numFaces: number;
let hasFaces = false;
let adjustedVerticiesAmount: number;
let verticesPercent = 0.85;
let rgbData: any;
let vertexData: any;
let model: any;

function percentScaledFunction (percent: number) {
    return Math.pow(200, percent - 1)
}

function formArrayFromSegmentedBuffer(buf: any, vertAmounts: number, sizeOfSublist: number) {
    var amtVertsCalculatedReduced = Math.ceil(vertAmounts * percentScaledFunction(verticesPercent));
    var step = Math.ceil(vertAmounts / amtVertsCalculatedReduced);
    adjustedVerticiesAmount = Math.floor(vertAmounts / step)
    var arr: number[] = [];

    var counter = 0;

    buf.forEach((vert: number[], index: number) => {
        if (index % step === 0) {
            vert.forEach(coord => {
                arr[counter] = coord;
                counter++;
            })
        }
    })

    return arr;
}

function loadPly(textData: String) {

    var modifiedVerticies = [];
    var verticies = [];
    var rgbTexture = [];
    var lowestYCoord = Number.MAX_SAFE_INTEGER;

    var geometry = new THREE.BufferGeometry();

    var color = new THREE.Color();

    var curVal, newline, line;

    for (let i = 0; i < numVertices; i++) {
        newline = textData.indexOf("\n") + 1;
        line = textData.substring(0, newline - 1).trim();
        textData = textData.substring(newline);

        curVal = line.split(" ");

        var vertexInfoCurrent = [parseFloat(curVal[0]), parseFloat(curVal[1]), parseFloat(curVal[2])];
        verticies.push(vertexInfoCurrent)

        color.setRGB(parseInt(curVal[6]) / 255.0, parseInt(curVal[7]) / 255.0, parseInt(curVal[8]) / 255.0);

        var rgbTextureCurrent = [color.r, color.g, color.b]
        rgbTexture.push(rgbTextureCurrent)

    }

    vertexData = formArrayFromSegmentedBuffer(verticies, numVertices, 3);
    rgbData = formArrayFromSegmentedBuffer(rgbTexture, numVertices, 4);

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertexData, 3)
    );
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(rgbData, 3));

    geometry.computeBoundingSphere();

    // @ts-ignore
    var material = new THREE.PointsMaterial({
        size: 0.01,
        vertexColors: true
    });

    model = new THREE.Points(geometry, material);
    scene.add(model);

}

function parseHeader(textData: String) {
    console.log("Starting plyParser.parseHeader...");

    //Read header
    var curVal, newline, line;
    //var hasNormals = false;
    //text = String(text);

    //console.log("TEXT DATA: " + textData);

    while(textData.length) {
        newline = textData.indexOf("\n") + 1;
        line = textData.substring(0, newline - 1).trim();
        textData = textData.substring(newline);

        //Get format
        curVal = textData.match(/format (\w+) (\d+)\.(\d+)/);
        if(curVal) {
            format = curVal[1];
            version = curVal[2];
        }

        //Get elements
        curVal = textData.match(/element (\w+) (\d+)/); //find first element line
        if(curVal) {
            if(curVal[1] == "vertex") numVertices = parseInt(curVal[2]);
            if(curVal[1] == "face") {
                numFaces = parseInt(curVal[2]);
                hasFaces = true;
            }
        }

        //Get properties
        curVal = textData.match(/property (\w+) (\w+)/);
        if(curVal) {
            if(curVal[2] == "red" || curVal[2] == "green" || curVal[2] == "blue") {
                hasColors = true;
            }
        }

        //if(line == "property float nx") hasNormals = true;
        if(line == "end_header") break;
    }

    console.log("Format: " + format);
    console.log("Version: " + version);
    console.log("Number of vertices: " + numVertices);
    console.log("Number of faces" + numFaces);
    console.log("Has colors? " + hasColors);

    console.log("Finished plyParser.parseHeader!");
    loadPly(textData);
}

function loadLight() {
    spotLight = new THREE.SpotLight( 0xffffff, 5 );
    spotLight.position.set( 25, 50, 25 );
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 1;
    spotLight.decay = 2;
    spotLight.distance = 100;

    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 200;
    spotLight.shadow.focus = 1;
    scene.add( spotLight );

    lightHelper = new THREE.SpotLightHelper( spotLight );
    scene.add( lightHelper );
}

function points() {
    var particles = 10000;

    var geometry = new THREE.BufferGeometry();

    var positions = [];
    var colors = [];

    var color = new THREE.Color();

    var n = 1.5,
        n2 = n / 2; // particles spread in the cube

    for (var i = 0; i < particles; i++) {
        // positions

        var x = (Math.random() * n - n2);
        var y = (Math.random() * n - n2);
        var z = Math.random() * n - n2;

        positions.push(x, y, z);

        // colors

        var vx = x / n + 0.25;
        var vy = y / n + 0.25;
        var vz = z / n + 0.25;

        color.setRGB(vx, vy, vz);

        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    geometry.computeBoundingSphere();

    // @ts-ignore
    var material = new THREE.PointsMaterial({
        size: 0.01,
        vertexColors: true
    });

    p = new THREE.Points(geometry, material);
    scene.add(p);
}

//points()

fetch("models/brad.ply")
    .then((response) => response.text())
    .then((text) => {
        parseHeader(text)
    })
    .catch(function () {
        // handle the error
    });


// Add items

window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

const teleportVR = new TeleportVR(scene, camera)

const lefthand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16, 1, true),
    new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        wireframe: true,
    })
)

const controllerGrip0 = renderer.xr.getControllerGrip(0)
controllerGrip0.addEventListener('connected', (e: any) => {
    controllerGrip0.add(lefthand)
    teleportVR.add(0, controllerGrip0, e.data.gamepad)
})

const righthand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16, 1, true),
    new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        wireframe: true,
    })
)
const controllerGrip1 = renderer.xr.getControllerGrip(1)
controllerGrip1.addEventListener('connected', (e: any) => {
    controllerGrip1.add(righthand)
    teleportVR.add(1, controllerGrip1, e.data.gamepad)
})

const statsVR = new StatsVR(scene, camera)
statsVR.setX(0)
statsVR.setY(0)
statsVR.setZ(-6)
statsVR.setEnabled(false)

loadLight()

function degrees_to_radians(degrees: number)
{
    var pi = Math.PI;
    return degrees * (pi / 180);
}

function render() {
    const time = performance.now() / 3000;

    statsVR.update()

    teleportVR.update()

    if (model != null) {
        model.rotation.x = degrees_to_radians(-90)

        //model.rotation.x += 0.001;
        model.rotation.z += 0.001;

        model.position.y = 1;

    }

    spotLight.position.x = Math.cos( time ) * 25;
    spotLight.position.z = Math.sin( time ) * 25;

    renderer.render(scene, camera)
}

renderer.setAnimationLoop(render)
