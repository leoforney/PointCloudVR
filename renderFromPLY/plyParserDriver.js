//
// Colored rotating cube. Illustrates perspective projection.
// See definition of view and projection matrices below.
// See animation loop for transformations.
//
// Code to actually make the cube model has been moved into
// cs336util.js as function makeCube


//PLY PARSER

var binr, textr;
var binFile, textData;
var vertexData, rgbData;
var numVertices, numFaces;
var hasColors, hasFaces;
var format, version;


setFile = function(file) { 
    console.log("Beginning plyParser.setFile...");

    if (file) {
        // var binr = new FileReader(file);
        var textr = new FileReader(file);

        //Get binary file
        // binr.readAsArrayBuffer(file);
        // binr.onload = function() {
        //     console.log("Binary file loaded", binr.readyState);
        //     console.log("Result: ", binr.result);

        //     binFile = new Uint8Array(binr.result);
        // }

        //Get text file for header
        textr.readAsText(file);
        textr.onload = function() {
            console.log("Text file loaded", textr.readyState);
            //console.log("Result: ", textr.result);
            textData = textr.result;
            parseHeader();
        }

    } else {
        console.error("Failed to load file");
    }

    console.log("Finished plyParser.setFile!");
}

parseHeader = function() {
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
    parseAscii();
}

parseAscii = function() {
    if(format == "ascii") {
        vertexData = new Float32Array(numVertices * 3);
        rgbData = new Float32Array(numVertices * 4);

        var curVal, newline, line;

        //Reads points in ply ascii format
        for(let i = 0; i < numVertices; i++) {
            newline = textData.indexOf("\n") + 1;
            line = textData.substring(0, newline - 1).trim();
            textData = textData.substring(newline);

            curVal = line.split(" ");

            let x = i * 3;
            let y = i * 3 + 1;
            let z = i * 3 + 2;

            let r = i * 4;
            let g = i * 4 + 1;
            let b = i * 4 + 2;
            let a = i * 4 + 3;

            //Grab vertex coords
            vertexData[x] = parseFloat(curVal[0]);
            vertexData[y] = parseFloat(curVal[1]);
            vertexData[z] = parseFloat(curVal[2]);

            //Grab rgba values (Skip normal values - indices 3,4,5)
            rgbData[r] = parseInt(curVal[6]) / 255;
            rgbData[g] = parseInt(curVal[7]) / 255;
            rgbData[b] = parseInt(curVal[8]) / 255;
            rgbData[a] = parseInt(curVal[9]) / 255;

        }
    }
    console.log("VRTX", vertexData);
    console.log("RGB", rgbData);

    vertexBuffer = createAndLoadBuffer(vertexData);
    vertexColorBuffer = createAndLoadBuffer(rgbData);
}


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
  gl_PointSize = 5.0;
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

    gl.drawArrays(gl.POINTS, 0, numVertices);

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
    //Make sure browser can support files
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        //Get file from document and pass it to parser
        var fileElement = document.getElementById('fileinput');

        //All parser code should go in the onchange event handler
        fileElement.onchange = function() {
            selectedFile = fileElement.files[0];
            setFile(selectedFile); //I chained all the parsing methods into this one
        }
    } else {
        console.error('The File APIs are not fully supported by your browser.');
    }

    // get graphics context
    gl = getGraphicsContext("theCanvas");

    // key handlers
    window.onkeypress = handleKeyPress;

    // create model data
    var cube = makeCube();

    // load and compile the shader pair
    shader = createShaderProgram(gl, vshaderSource, fshaderSource);

    // load the vertex data into GPU memory
    vertexBuffer = createAndLoadBuffer(vertexData);
    vertexColorBuffer = createAndLoadBuffer(rgbData);

    // axes
    axisBuffer = createAndLoadBuffer(axisVertices);
    axisColorBuffer = createAndLoadBuffer(axisColors);

    gl.clearColor(0.9, 0.9, 0.9, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //Bring in plyParser class
    //plyParse = new plyParser();

    

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



