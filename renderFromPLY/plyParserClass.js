class plyParser {
    fileName;
    fileData;
    vertexData;
    rgbData;
    format; version;
    numVertices; numFaces;


    constructor(modelPath) {
        this.modelPath = modelPath;
    }

    setFileData(filePath) {
        this.fileName = filePath;
        jQuery.get(filePath, function(data) {
            fileData = data;
            fileData = String(plyData);
        });
    }

    parseHeader() {
        //Read header
        var curVal, newline, line;
        //var hasNormals = false;

        while(this.fileData.length) {
            newline = this.fileData.indexOf("\n")+1;
            line = this.fileData.substring(0, newline - 1).trim();
            this.fileData = this.fileData.substring(newline);

            //Get format
            curVal = this.fileData.match(/format (\w+) (\d+)\.(\d+)/);
            if(curVal) {
                this.format = curVal[1];
                this.version = curVal[2];
            }

            //Get elements
            curVal = this.fileData.match(/element (\w+) (\d+)/); //find first element line
            if(curVal) {
                if(curVal[1] == "vertex") this.numVertices = parseInt(curVal[2]);
                if(curVal[1] == "face") this.numFaces = parseInt(curVal[2]);
                
            }

            //if(line == "property float nx") hasNormals = true;
            if(line == "end_header") break;
        }
    }

    //Only works without color data right now, should be easy to implement though
    parseAscii() {
        if(this.format == "ascii") {
            this.vertexData = new Float32Array(numVerts * 3);
            var curVal, newline, line;
    
            //Reads points in ply ascii format
            for(let i = 0; i < this.numVertices; i++) {
                newline = this.fileData.indexOf("\n") + 1;
                line = this.fileData.substring(0, newline - 1).trim();
                this.fileData = this.fileData.substring(newline);
    
                curVal = line.split(" ");
                
                let x = i * 3;
                let y = i * 3 + 1;
                let z = i * 3 + 2;
    
                this.vertexData[x] = parseFloat(curVal[0]);
                this.vertexData[y] = parseFloat(curVal[1]);
                this.vertexData[z] = parseFloat(curVal[2]);
            }
        }
    }

    parseBinary() {
        if(testEndian != "Compatible")  {
            console.error("Your system endian is incompatible with this file!");
            throw "Incompatible Endian";
        }

        //Convert ascii string to binary
        plyData = plyData.replace(/\s+/g, ''); //Strip all whitespace
        var binData = "";

        //Convert data from hex to ascii representation -- not working :(
        for(var i = 0; i < plyData.length; i++) {
            hexValue = plyData[i].charCodeAt(0);
            //console.log(plyData[i]);
            hexValue = parseFloat(hexValue);
            hexValue = hexValue.toString(16);
            binData += hexValue + " ";
        }
        console.log(binData);

        let temp = plyData[1].charCodeAt(0);
        console.log("Char Code: " + temp);
        console.log(parseFloat(temp));
        
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
