//This will interpret PLY files, starting with binary

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
    var elementVal, newline, line;
    var hasNormals = false;
    plyData = String(plyData);

    while(plyData.length) {
        newline = plyData.indexOf("\n")+1;
        line = plyData.substring(0, newline - 1).trim();
        plyData = plyData.substring(newline);
        //console.log(plyData);
        
        elementVal = plyData.match(/element (\w+) (\d+)/); //find first element line
        if(elementVal) {
            if(elementVal[1] == "vertex") {
                var numVerts = parseInt(elementVal[2]);
                console.log(numVerts);
                break;
            }
        } else {
            //console.log("element line not found");
        }

        if(line == "property float nx") hasNormals = true;
        if(line == "end_header") {
            console.log("End of header reached");
            break;
        }
    }
}


