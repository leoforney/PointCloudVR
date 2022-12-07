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
        for(let i = 0; i < numVertices; i += 3) {
            newline = textData.indexOf("\n") + 1;
            line = textData.substring(0, newline - 1).trim();
            fileData = textData.substring(newline);

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
            rgbData[r] = parseInt(curVal[6]);
            rgbData[g] = parseInt(curVal[7]);
            rgbData[b] = parseInt(curVal[8]);
            rgbData[a] = parseInt(curVal[9]);

        }
    }
    console.log("VRTX", vertexData);
    console.log("RGB", rgbData);
}

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
}
