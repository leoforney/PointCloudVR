const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 3000 );
import { VRButton } from './VRButton.js';

const renderer = new THREE.WebGLRenderer({
    alpha: true
});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

document.body.appendChild( VRButton.createButton( renderer ) );

renderer.xr.enabled = true;

var p = null

function points() {
    var particles = 100;

    var geometry = new THREE.BufferGeometry();

    var positions = [];
    var colors = [];

    var color = new THREE.Color();

    var n = 1000,
    n2 = n / 2; // particles spread in the cube

    for (var i = 0; i < particles; i++) {
        // positions

        var x = Math.random() * n - n2;
        var y = Math.random() * n - n2;
        var z = Math.random() * n - n2;

        positions.push(x, y, z);

        // colors

        var vx = x / n + 0.5;
        var vy = y / n + 0.5;
        var vz = z / n + 0.5;

        color.setRGB(vx, vy, vz);

        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    geometry.computeBoundingSphere();

    var material = new THREE.PointsMaterial({
        size: 3,
        vertexColors: THREE.VertexColors
    });

    p = new THREE.Points(geometry, material);
    scene.add(p);
}

points()

camera.position.z = 1200;

renderer.setAnimationLoop( function () {
    p.rotation.x += 0.001;
    p.rotation.y += 0.002;
    renderer.render( scene, camera );

} );
