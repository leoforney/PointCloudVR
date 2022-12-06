//
// Colored rotating cube. Illustrates perspective projection.
// See definition of view and projection matrices below.
// See animation loop for transformations.
//
// Code to actually make the cube model has been moved into
// cs336util.js as function makeCube


// vertex shader
const vshaderSource = `
uniform mat4 transform;
attribute vec4 a_Position;
attribute vec4 a_Color;
varying vec4 color;
void main()
{
  color = a_Color;
  gl_Position = transform * a_Position;
  gl_PointSize = 10.0;
}
`;

// fragment shader
const fshaderSource = `
precision mediump float;
varying vec4 color;
void main()
{
  gl_FragColor = color;
}
`;

var axisVertices = new Float32Array([
0.0, 0.0, 0.0,
1.5, 0.0, 0.0,
0.0, 0.0, 0.0,
0.0, 1.5, 0.0,
0.0, 0.0, 0.0,
0.0, 0.0, 1.5]);

var axisColors = new Float32Array([
1.0, 0.0, 0.0, 1.0,
1.0, 0.0, 0.0, 1.0,
0.0, 1.0, 0.0, 1.0,
0.0, 1.0, 0.0, 1.0,
0.0, 0.0, 1.0, 1.0,
0.0, 0.0, 1.0, 1.0]);

// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexColorBuffer;
var indexBuffer;
var axisBuffer;
var axisColorBuffer;

// handle to the compiled shader program on the GPU
var shader;

// transformation matrices
var model = new THREE.Matrix4();

//view matrix
var view;

// Alternatively, use the LookAt function, specifying the view (eye) point,
// a point at which to look, and a direction for "up".
// Approximate view point (1.77, 3.54, 3.06) corresponds to the view
// matrix described above
view = createLookAtMatrix(
               new THREE.Vector3(1.77, 3.54, 3.06),   // eye
               new THREE.Vector3(0.0, 0.0, 0.0),      // at - looking at the origin
               new THREE.Vector3(0.0, 1.0, 0.0));    // up vector - y axis


// Using a perspective matrix
var projection;

// try the same numbers as before, with aspect ratio 1.5
projection = new THREE.Matrix4().makePerspective(-1.5, 1.5, 1, -1, 4, 6);

var axis = 'y';
var paused = false;


//translate keypress events to strings
//from http://javascript.info/tutorial/keyboard-events
function getChar(event) {
    if (event.which == null) {
        return String.fromCharCode(event.keyCode) // IE
    } else if (event.which!=0 && event.charCode!=0) {
        return String.fromCharCode(event.which)   // the rest
    } else {
        return null // special key
    }
}

//handler for key press events will choose which axis to
// rotate around
function handleKeyPress(event)
{
	var ch = getChar(event);
	switch(ch) {
        // rotation controls
        case ' ':
            paused = !paused;
            break;
        case 'x':
            axis = 'x';
            break;
        case 'y':
            axis = 'y';
            break;
        case 'z':
            axis = 'z';
            break;
        case 'o':
            model.identity();
            axis = 'x';
            break;
	}
}

// code to actually render our geometry
function draw()
{
    // clear the framebuffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

    // bind the shader
    gl.useProgram(shader);

    // get the index for the a_Position attribute defined in the vertex shader
    var positionIndex = gl.getAttribLocation(shader, 'a_Position');
    if (positionIndex < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    var colorIndex = gl.getAttribLocation(shader, 'a_Color');
    if (colorIndex < 0) {
        console.log('Failed to get the storage location of a_');
        return;
    }

    // "enable" the a_position attribute
    gl.enableVertexAttribArray(positionIndex);
    gl.enableVertexAttribArray(colorIndex);

    // bind buffers for points
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // set uniform in shader for projection * view * model transformation
    var transform = new THREE.Matrix4().multiply(projection).multiply(view).multiply(model);
    var transformLoc = gl.getUniformLocation(shader, "transform");
    gl.uniformMatrix4fv(transformLoc, false, transform.elements);

    gl.drawArrays(gl.POINTS, 0, 36);

    // draw axes (not transformed by model transformation)
    gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
    gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, axisColorBuffer);
    gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // set transformation to projection * view only
    transform = new THREE.Matrix4().multiply(projection).multiply(view);
    gl.uniformMatrix4fv(transformLoc, false, transform.elements);

    // draw axes
    gl.drawArrays(gl.LINES, 0, 6);

    // unbind shader and "disable" the attribute indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(positionIndex);
    gl.disableVertexAttribArray(colorIndex);
    gl.useProgram(null);
}

// entry point when page is loaded
function main() {
    // get graphics context
    gl = getGraphicsContext("theCanvas");

    // key handlers
    window.onkeypress = handleKeyPress;

    // create model data
    var cube = makeCube();

    // load and compile the shader pair
    shader = createShaderProgram(gl, vshaderSource, fshaderSource);

    // load the vertex data into GPU memory
    vertexBuffer = createAndLoadBuffer(cube.vertices);
    vertexColorBuffer = createAndLoadBuffer(cube.colors);

    // axes
    axisBuffer = createAndLoadBuffer(axisVertices);
    axisColorBuffer = createAndLoadBuffer(axisColors);

    gl.clearColor(0.9, 0.9, 0.9, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //Bring in plyParser class
    plyParse = new plyParser();

    //Make sure browser can support files
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        //Get file from document and pass it to parser
        var fileElement = document.getElementById('fileinput');

        //All parser code should go in the onchange event handler
        fileElement.onchange = function() {
            selectedFile = fileElement.files[0];
            plyParse.setFile(selectedFile, plyParse.parseHeader.bind(plyParse));
            //console.log(plyParse.file);
            //plyParse.parseHeader();
        }
    } else {
        console.error('The File APIs are not fully supported by your browser.');
    }

    // define an animation loop
    var animate = function() {
	    draw();

        if (!paused) {
            // "extrinsic" coordinate axis rotations
            switch(axis) {
                case 'x':
                    model.premultiply(new THREE.Matrix4().makeRotationX(toRadians(1)));
                    break;
                case 'y':
                    model.premultiply(new THREE.Matrix4().makeRotationY(toRadians(1)));
                    break;
                case 'z':
                    model.premultiply(new THREE.Matrix4().makeRotationZ(toRadians(1)));
                    break;
                default:
            }
        }

        // request that the browser calls animate() again "as soon as it can"
        requestAnimationFrame(animate);
    };

  animate();
}
