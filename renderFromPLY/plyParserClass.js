class plyParser {
    file; //not using right now
    binFile;
    textFile; textData = "";
    fileData;
    vertexData;
    rgbData;
    format = ""; version;
    numVertices; numFaces;
    hasColors; hasFaces;
    
    //Custom event to ensure files are loaded
    // loadedEvent = new Event('loadedEvent', {
    //     bubbles: true,
    //     cancelable: false,
    //     composed: true
    // })


    constructor(file) {
        this.hasColors = false;
        this.hasFaces = false;
        this.format = "";
    }

    setFile = function(file) { 
        console.log("Beginning plyParser.setFile...");

        if (file) {
            var binr = new FileReader(file);
            var textr = new FileReader(file);

            //Get binary file
            binr.readAsArrayBuffer(file);
            binr.onload = function() {
                console.log("Binary file loaded", binr.readyState);
                console.log("Result: ", binr.result);

                this.binFile = new Uint8Array(binr.result);
            }

            //Get text file for header
            textr.readAsText(file);
            textr.onload = function() {
                console.log("Text file loaded", textr.readyState);
                console.log("Result: ", textr.result);
                this.textFile = file;
                this.textData = textr.result;
            }

        } else {
            console.error("Failed to load file");
        }

        console.log("Finished plyParser.setFile!");
    }

    //Reads PLY header for formatting data. Callback function
    parseHeader = function() {
        console.log("Starting plyParser.parseHeader...");

        //Read header
        var curVal, newline, line;
        //var hasNormals = false;
        //text = String(text);

        console.log("TEXT DATA: " + this.textData);

        while(this.textData.length) {
            newline = this.textData.indexOf("\n") + 1;
            line = this.textData.substring(0, newline - 1).trim();
            text = this.textData.substring(newline);

            //Get format
            curVal = this.textData.match(/format (\w+) (\d+)\.(\d+)/);
            if(curVal) {
                this.format = curVal[1];
                this.version = curVal[2];
            }

            //Get elements
            curVal = this.textData.match(/element (\w+) (\d+)/); //find first element line
            if(curVal) {
                if(curVal[1] == "vertex") this.numVertices = parseInt(curVal[2]);
                if(curVal[1] == "face") {
                    this.numFaces = parseInt(curVal[2]);
                    this.hasFaces = true;
                }   
            }

            //Get properties
            curVal = this.textData.match(/property (\w+) (\w+)/);
            if(curVal) {
                if(curVal[2] == "red" || curVal[2] == "green" || curVal[2] == "blue") {
                    this.hasColors = true;
                }
            }

            //if(line == "property float nx") hasNormals = true;
            if(line == "end_header") break;
        }

        console.log("Format: " + this.format);
        console.log("Version: " + this.version);
        console.log("Number of vertices: " + this.numVertices);
        console.log("Number of faces" + this.numFaces); 
        console.log("Has colors? " + this.hasColors); 

        console.log("Finished plyParser.parseHeader!");

        //Callback to parseBinary 
        // binaryCallback();
        //return new Promise(this.parseAscii);
    }

    //Only works without color data right now, should be easy to implement though
    parseAscii = function() {
        if(this.format == "ascii") {
            this.vertexData = new Float32Array(numVerts * 3);
            this.rgbData = new Float32Array(numVerts * 4);

            var curVal, newline, line;
    
            //Reads points in ply ascii format
            for(let i = 0; i < this.numVertices; i += 3) {
                newline = this.fileData.indexOf("\n") + 1;
                line = this.fileData.substring(0, newline - 1).trim();
                this.fileData = this.fileData.substring(newline);
    
                curVal = line.split(" ");
                
                let x = i * 3;
                let y = i * 3 + 1;
                let z = i * 3 + 2;

                let r = i * 4;
                let g = i * 4 + 1;
                let b = i * 4 + 2;
                let a = i * 4 + 3;
    
                //Grab vertex coords
                this.vertexData[x] = parseFloat(curVal[0]);
                this.vertexData[y] = parseFloat(curVal[1]);
                this.vertexData[z] = parseFloat(curVal[2]);

                //Grab rgba values (Skip normal values - indices 3,4,5)
                this.rgbData[r] = parseInt(curVal[6]);
                this.rgbData[g] = parseInt(curVal[7]);
                this.rgbData[b] = parseInt(curVal[8]);
                this.rgbData[a] = parseInt(curVal[9]);

            }
        }
        console.log(this.vertexData);
        console.log(this.rgbData);
        
    }

    

    parseBinary() {
        console.log("Starting plyParser.parseBinary...");

        //Check compatibility
        if(this.testEndian() != "Compatible")  {
            console.error("Your system endian is incompatible with this file!");
            throw "Incompatible Endian";
        }
        
        /** var type        size (bytes)
         * ------------------------
         * char / uchar     - 1 
         * short / ushort   - 2
         * int / uint       - 4
         * float            - 4
         * double           - 8
         */

        //Get vertices
        this.vertexData = new Float32Array(this.numVertices * 3);
        this.rgbData = new Float32Array(this.numVertices * 3);

        //First get past the header
        let onHeader = true;
        let i = 0;
        while(onHeader) {
            //If we see the "end_header" bits, break loop
            if(this.binFile[0] == 97 && this.binFile[1] == 100
                && this.binFile[2] == 101 && this.binFile[3] == 114) {
                    onHeader = false;
                    this.binFile.splice(0, 4);
            } else {
                this.binFile.shift(); //Move one bit if we haven't found the end
            }
        }
        this.binFile.shift(); //one extra shift for newline

        //Reduces Uint8Array to binary string
        const toBinString = (bytes) =>
            bytes.reduce((str, byte) => str + byte.toString(2).padStart(8, '0'), '');
        
        binString = toBinString(view);
        console.log(binString);

        //Now start filling arrays
        for(let i = 0; i < this.vertexData.size(); i += 3) {
            //First three values are vertex coords
            //Each coord is a 8-byte double
            let xCoord = "";
            let yCoord = "";
            let zCoord = "";

            for(let i = 0; i < 32; i++) {
                xCoord += this.binString[i];
            }

            for(let i = 0; i < 32; i++) {
                yCoord += this.binString[i];
            }

            for(let i = 0; i < 32; i++) {
                zCoord += this.binString[i];
            }

            break;
            
        }
        console.log(xCoord);
        console.log(Number(xCoord));
    }

    //Test that system endian matches file endian, they must be compatible
    testEndian() {
        //Test endianness
        let uInt32 = new Uint32Array([0x11223344]);
        let uInt8 = new Uint8Array(uInt32.buffer);
        
        if(uInt8[0] === 0x44) {
            if(format != "binary_little_endian") return("Incompatible");
        } else if (uInt8[0] === 0x11) {
            if(format != "binary_big_endian") return("Incompatible");
        }
        return("Compatible");
    }

    getVertexArray() {
        return this.vertexData;
    }

    getColorArray() {
        return this.rgbData;
    }
}
