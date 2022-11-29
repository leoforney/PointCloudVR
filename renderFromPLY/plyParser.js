//This will interpret PLY files and convert into Float32Arrays

/** var type        size (bytes)
 * ------------------------
 * char / uchar     - 1 
 * short / ushort   - 2
 * int / uint       - 4
 * float            - 4
 * double           - 8
 */

plyFile = "models/axle_shaft_ply/Axle shaft.ply";
var plyData;

//Use jQuery to get file data
jQuery.get(plyFile, function(data) {
    plyData = data;
    console.log("Data retreived");
    //console.log(plyData);
    readFile();
});

function readFile() {
    //Read header
    var curVal, newline, line;
    var hasNormals = false;
    plyData = String(plyData);
    var format;

    var numNormals, numFaces;

    while(plyData.length) {
        newline = plyData.indexOf("\n")+1;
        line = plyData.substring(0, newline - 1).trim();
        plyData = plyData.substring(newline);
        //console.log(plyData);
        
        curVal = plyData.match(/element (\w+) (\d+)/); //find first element line
        if(curVal) {
            if(curVal[0] == "format") {
                format = curVal[1];
            }

            if(curVal[1] == "vertex") {
                numVerts = parseInt(curVal[2]);
                console.log("Verticies: " + numVerts);
            }

            if(curVal[1] == "face") {
                numFaces = parseInt(curVal[2]);
                console.log("Faces: " + numFaces);
            }
        }

        if(line == "property float nx") hasNormals = true;
        if(line == "end_header") {
            console.log("End of header reached");
            break;
        }
    }

    //Read points
    var verticies = new Float32Array(numVerts);

    //Reads points in ply ascii format
    if(format == "ascii") {
        for(let i = 0; i < numVerts; i++) {
            newline = plyData.indexOf("\n")+1;
            line = plyData.substring(0, newline - 1).trim();
            plyData = plyData.substring(newline);

            curVal = line.split(" ");
            
            let x = i * 3;
            let y = i * 3 + 1;
            let z = i * 3 + 2;

            verticies[x] = parseFloat(curVal[0]);
            verticies[y] = parseFloat(curVal[1]);
            verticies[z] = parseFloat(curVal[2]);

        }
    }

    if(format == "binary_little_endian") {
        //not done yet
    }
}


