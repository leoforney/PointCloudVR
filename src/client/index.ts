// @ts-nocheck
import * as THREE from 'three'
import StatsVR from 'statsvr'
import {VRButton} from 'three/examples/jsm/webxr/VRButton';
import { fetchProfile, MotionController } from '@webxr-input-profiles/motion-controllers'
import TeleportVR from './teleportvr'
import {Points} from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass";
import { BadTVShader } from './BadTVShader.js';
import {XRControllerModel} from "three/examples/jsm/webxr/XRControllerModelFactory";

const scene: THREE.Scene = new THREE.Scene()

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(0, 1.6, 2.25)
camera.rotation.x -= degrees_to_radians(15)

const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.xr.enabled = true

var composer = new EffectComposer( renderer);
var renderPass = new RenderPass( scene, camera );
var badTVPass = new ShaderPass( BadTVShader );
composer.addPass( renderPass );
composer.addPass( badTVPass );
badTVPass.renderToScreen = true;

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

var gltfLoader = new GLTFLoader();

let spotLight: THREE.SpotLight, lightHelper: THREE.SpotLightHelper;

let p: Points;
let hasColors = false;
let format: String;
let version: String;
let numVertices: number;
let numFaces: number;
let hasFaces = false;
let adjustedVerticiesAmount: number;
let verticesPercent = 0.95;
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
        size: 0.007,
        vertexColors: true
    });

    model = new THREE.Points(geometry, material);
    scene.add(model);

}

function parseHeader(textData: String) {
    console.log("Starting plyParser.parseHeader...");

    //Read header
    var curVal, newline, line;

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

/*    lightHelper = new THREE.SpotLightHelper( spotLight );
    scene.add( lightHelper );*/
}

fetch("models/leo_chair.ply")
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

//const teleportVR = new TeleportVR(scene, camera)

/*const lefthand = new THREE.Mesh(
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
    new THREE.CylinderGeometry(0.05, 0.05, 0.2, 16, 1, true),
    new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        wireframe: true,
    })
)
const controllerGrip1 = renderer.xr.getControllerGrip(1)
controllerGrip1.addEventListener('connected', (e: any) => {
    controllerGrip1.add(righthand)
    teleportVR.add(1, controllerGrip1, e.data.gamepad)
})*/

const motionControllers: {} = {};

function xrSessionStart() {
    // @ts-ignore
    let xrSession: XRSession = renderer.xr.getSession();

    const uri = 'webxr-profiles/profiles/';


    function addTouchPointDots(motionController: MotionController, asset: any) {
        Object.values(motionController.components).forEach((component) => {
            if (component.touchPointNodeName) {
                const touchPointRoot = asset.getChildByName(component.touchPointNodeName, true);

                const sphereGeometry = new THREE.SphereGeometry(0.001);
                const material = new THREE.MeshBasicMaterial({ color: 0x0000FF });
                const touchPointDot = new THREE.Mesh(sphereGeometry, material);
                touchPointRoot.add(touchPointDot);
            }
        });
    }

    async function addMotionControllerToScene(motionController: MotionController) {
        console.log(motionController.assetUrl)
        gltfLoader.load(motionController.assetUrl, function( gltf ) {
            var asset = gltf.scene
            //addTouchPointDots(motionController, asset);
            scene.add(asset)
        })
    }

    async function createMotionController(xrInputSource: XRInputSource) {
        const { profile, assetPath } = await fetchProfile(xrInputSource, uri);
        // @ts-ignore
        const motionController = new MotionController(xrInputSource, profile, assetPath);
        // @ts-ignore
        motionControllers[xrInputSource] = motionController;
        addMotionControllerToScene(motionController);
    }

    xrSession.addEventListener('inputsourceschange', onInputSourcesChange);

    function onInputSourcesChange(event: XRInputSourceChangeEvent) {
        event.added.forEach((xrInputSource) => {
            createMotionController(xrInputSource);
        });
    };

}

renderer.xr.addEventListener( 'sessionstart', xrSessionStart);


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


function updateMotionControllerModel(motionController: any) {

    // Update the 3D model to reflect the button, thumbstick, and touchpad state
    const motionControllerRoot = scene.getObjectByName(motionController.rootNodeName);
    Object.values(motionController.components).forEach((component) => {
        // @ts-ignore
        component.visualResponses.forEach((visualResponse) => {
            // Find the topmost node in the visualization
            const valueNode = motionControllerRoot.getChildByName(visualResponse.valueNodeName);

            // Calculate the new properties based on the weight supplied
            if (visualResponse.valueNodeProperty === 'visibility') {
                valueNode.visible = visualResponse.value;
            } else if (visualResponse.valueNodeProperty === 'transform') {
                // @ts-ignore
                const minNode = motionControllerRoot.getObjectByName(visualResponse.minNodeName);
                // @ts-ignore
                const maxNode = motionControllerRoot.getObjectByName(visualResponse.maxNodeName);

                // @ts-ignore
                THREE.Quaternion.slerp(
                    minNode.quaternion,
                    maxNode.quaternion,
                    valueNode.quaternion,
                    visualResponse.value
                );

                valueNode.position.lerpVectors(
                    minNode.position,
                    maxNode.position,
                    visualResponse.value
                );
            }
        });
    });
}

var shaderTime = 0;

function render() {
    const time = performance.now() / 3000;

    statsVR.update()

    //teleportVR.update()

    shaderTime += 0.1;
    badTVPass.uniforms['time'].value = shaderTime;

    composer.render(0.1);

    if (model != null) {
        model.rotation.x = degrees_to_radians(-90)

        //model.rotation.x += 0.001;
        model.rotation.z += 0.001;

        model.position.y = 1;

    }

    spotLight.position.x = Math.cos( time ) * 25;
    spotLight.position.z = Math.sin( time ) * 25;

    Object.keys(motionControllers).forEach((motionController) => {
        // @ts-ignore
        motionController.updateFromGamepad();
        // @ts-ignore
        updateMotionControllerModel(motionController);
    });

    renderer.render(scene, camera)
}

renderer.setAnimationLoop(render)
