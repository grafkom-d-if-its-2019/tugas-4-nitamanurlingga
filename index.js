(function(){
    var canvas, 
        gl, 
        program, 
        nWord, 
        pindahX =   0.0059, 
        pindahY =   0.0059, 
        pindahZ =   0.0059, 
        nCube;

    glUtils.SL.init({ callback:function() { main(); } });

    function main() {
        // Get canvas element and check if WebGL enabled
        canvas = document.getElementById("glcanvas");
        gl = glUtils.checkWebGL(canvas);

        initGlSize();

        // Initialize the shaders and program
        var vertexShader = glUtils.getShader(gl, gl.VERTEX_SHADER, glUtils.SL.Shaders.v1.vertex),
        fragmentShader = glUtils.getShader(gl, gl.FRAGMENT_SHADER, glUtils.SL.Shaders.v1.fragment);
        program = glUtils.createProgram(gl, vertexShader, fragmentShader);
        gl.useProgram(program);

        nWord = initWordVertices();
        nCube = initCubeVertices();

        // Definisi untuk matriks model
        var mmLoc = gl.getUniformLocation(program, 'modelMatrix');
        var mm = glMatrix.mat4.create();
        glMatrix.mat4.translate(mm, mm, [0.0, 0.0, -2.0]);
        gl.uniformMatrix4fv(mmLoc, false, mm);  

        // Definisi untuk matrix view dan projection(kamera)
        var vmLoc = gl.getUniformLocation(program, 'viewMatrix');
        var vm = glMatrix.mat4.create();
        glMatrix.mat4.lookAt(vm,
            [0.0, 0.0, 0.0], // di mana posisi kamera (posisi)
            [0.0, 0.0, -1.0], // ke mana kamera menghadap (vektor)
            [0.0, 1.0, 0.0]  // ke mana arah atas kamera (vektor)
          );
          gl.uniformMatrix4fv(vmLoc, false, vm);
        var pmLoc = gl.getUniformLocation(program, 'projectionMatrix');
        var pm = glMatrix.mat4.create();
        var camera = {x: 0.0, y: 0.0, z:0.0};
        glMatrix.mat4.perspective(pm,
        glMatrix.glMatrix.toRadian(90), // fovy dalam radian
        canvas.width/canvas.height,     // aspect ratio
        0.5,  // near
        10.0, // far  
        );
        gl.uniformMatrix4fv(pmLoc, false, pm);

        // Pencahayaan
        var dcLoc = gl.getUniformLocation(program, 'diffuseColor');
        var dc = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);  // rgb
        gl.uniform3fv(dcLoc, dc);
        var ddLoc = gl.getUniformLocation(program, 'diffusePosition');
        var dd = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);  // xyz
        gl.uniform3fv(ddLoc, dd);
        var acLoc = gl.getUniformLocation(program, 'ambientColor');
        var ac = glMatrix.vec3.fromValues(0.17, 0.40, 0.59); 
        gl.uniform3fv(acLoc, ac);

        // Variabel translasi
        var scaleXUniformLocation = gl.getUniformLocation(program, 'scaleX');
        var scaleX = 1.0;
        gl.uniform1f(scaleXUniformLocation, scaleX);

        var constantUniformLocation = gl.getUniformLocation(program, 'constant');
        var constant = 0.5;
        gl.uniform1f(constantUniformLocation, constant);

        var jalanXUniformLocation = gl.getUniformLocation(program, 'jalanX');
        var jalanX = 0.00;
        gl.uniform1f(jalanXUniformLocation, jalanX);

        var jalanYUniformLocation = gl.getUniformLocation(program, 'jalanY');
        var jalanY = 0.00;
        gl.uniform1f(jalanYUniformLocation, jalanY);

        var jalanZUniformLocation = gl.getUniformLocation(program, 'jalanZ');
        var jalanZ = 0.00;
        gl.uniform1f(jalanZUniformLocation, jalanZ);

        var gambarCubeUniformLocation = gl.getUniformLocation(program, 'gambarCube');
        var gambarCube = 1;
        gl.uniform1i(gambarCubeUniformLocation, gambarCube);

        var fgambarCubeUniformLocation = gl.getUniformLocation(program, 'fgambarCube');
        var fgambarCube = 1;
        gl.uniform1i(fgambarCubeUniformLocation, fgambarCube);

        // Uniform untuk texture
        var sampler0Loc = gl.getUniformLocation(program, 'sampler0');
        gl.uniform1i(sampler0Loc, 0);

        // Create a texture.
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

        // Asynchronously load an image
        var image = new Image();
        image.src = "images/CubeTexture.png";
        // image.src = "images/grid.png"; //nama file tekstur
        image.addEventListener('load', function() {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
        });

        render();
        window.addEventListener('resize', resizer);

        //Mouse event
        var AMORTIZATION = 0.95;
        var drag = false;
        var old_x, old_y;
        var dX = 0, dY = 0;
        var tetha=0, phi=0;

        var mouseDown = function(e) {
            drag = true;
            old_x = e.pageX, old_y = e.pageY;
            console.log(old_x);
            console.log(old_y);
            e.preventDefault();
            return false;
        };

        var mouseUp = function(e){
            drag = false;
        };

        var mouseMove = function(e) {
            if (!drag) return false;
            dX = (e.pageX-old_x)*2*Math.PI/canvas.width,
            dY = (e.pageY-old_y)*2*Math.PI/canvas.height;
            tetha+=dX;
            phi+=dY;
            old_x = e.pageX, old_y = e.pageY;
            e.preventDefault();
        };

        document.addEventListener("mousedown", mouseDown, false);
        document.addEventListener("mouseup", mouseUp, false);
        document.addEventListener("mouseout", mouseUp, false);
        document.addEventListener("mousemove", mouseMove, false);

        function rotateX(m, angle) {
            var c = Math.cos(angle);
            var s = Math.sin(angle);
            var mv1 = m[1], mv5 = m[5], mv9 = m[9];

            m[1] = m[1]*c-m[2]*s;
            m[5] = m[5]*c-m[6]*s;
            m[9] = m[9]*c-m[10]*s;

            m[2] = m[2]*c+mv1*s;
            m[6] = m[6]*c+mv5*s;
            m[10] = m[10]*c+mv9*s;
        }

        function rotateY(m, angle) {
            var c = Math.cos(angle);
            var s = Math.sin(angle);
            var mv0 = m[0], mv4 = m[4], mv8 = m[8];

            m[0] = c*m[0]+s*m[2];
            m[4] = c*m[4]+s*m[6];
            m[8] = c*m[8]+s*m[10];

            m[2] = c*m[2]-s*mv0;
            m[6] = c*m[6]-s*mv4;
            m[10] = c*m[10]-s*mv8;
        }

        var vertexKiriTerjauh  = -0.30; 
        var vertexKananTerjauh = 0.30; 
        var vertexAtasTerjauh  = 0.50; 
        var vertexBawahTerjauh = -0.50; 
        var ukuranTerjauh = 0.8;
        
        function bounceChecking(){
            // Checking X koordinat
            if(constant*scaleX*vertexKiriTerjauh+jalanX>=ukuranTerjauh)
            {
                jalanX = ukuranTerjauh - constant*scaleX*vertexKiriTerjauh;
                pindahX = -1*pindahX;
            }
            else if(constant*scaleX*vertexKananTerjauh+jalanX>=ukuranTerjauh)
            {
                jalanX = ukuranTerjauh - constant*scaleX*vertexKananTerjauh;
                pindahX = -1*pindahX;
            }
            else if(constant*scaleX*vertexKiriTerjauh+jalanX<= -1*ukuranTerjauh)
            {
                jalanX = (-1 * ukuranTerjauh - constant*scaleX*vertexKiriTerjauh);
                pindahX = -1*pindahX;
            }
            else if(constant*scaleX*vertexKananTerjauh+jalanX<= -1*ukuranTerjauh)
            {
                jalanX = (-1 * ukuranTerjauh - constant*scaleX*vertexKananTerjauh);
                pindahX = -1*pindahX;
            }

            // Checking Y koordinat
            if(constant * vertexAtasTerjauh +jalanY>=ukuranTerjauh)
            {
                jalanY = ukuranTerjauh - constant*vertexAtasTerjauh;
                pindahY = -1*pindahY;
            }
            else if(constant * vertexBawahTerjauh+jalanY<= -1*ukuranTerjauh)
            {
                jalanY = (-1 * ukuranTerjauh - constant*vertexBawahTerjauh);
                pindahY = -1*pindahY;
            }

            // Checking Z koordinat
            if(jalanZ>=ukuranTerjauh)
            {
                jalanZ = ukuranTerjauh;
                pindahZ = -1*pindahZ;
            }
            else if(jalanZ<= -1*ukuranTerjauh)
            {
                jalanZ = (-1 * ukuranTerjauh);
                pindahZ = -1*pindahZ;
            }
        }

        function render(){

            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            if (!drag) {
                dX *= AMORTIZATION, dY*=AMORTIZATION;
                tetha+=dX, phi+=dY;
            }

            //set model matrix to I4

            mm[0] = 1, mm[1] = 0, mm[2] = 0,
            mm[3] = 0,

            mm[4] = 0, mm[5] = 1, mm[6] = 0,
            mm[7] = 0,

            mm[8] = 0, mm[9] = 0, mm[10] = 1,
            mm[11] = 0,

            mm[12] = 0, mm[13] = 0, mm[14] = 0,
            mm[15] = 1;

            
            glMatrix.mat4.translate(mm, mm, [0.0, 0.0, -2.0]);

            rotateY(mm, tetha);
            rotateX(mm, phi);

            gl.uniformMatrix4fv(mmLoc, false, mm);

            if (scaleX >= 1.0) melebar = -1.0;
            else if (scaleX <= -1.0) melebar = 1.0;
            scaleX += 0.0059 * melebar;

            jalanX += pindahX;
            jalanY += pindahY;
            jalanZ += pindahZ;

            bounceChecking();

            gl.uniform1f(jalanYUniformLocation, jalanY);
            gl.uniform1f(jalanXUniformLocation, jalanX);
            gl.uniform1f(jalanZUniformLocation, jalanZ);

            gl.uniform1f(scaleXUniformLocation, scaleX);

            gambarCube=2;
            gl.uniform1i(gambarCubeUniformLocation, gambarCube);
            gl.uniform1i(fgambarCubeUniformLocation, gambarCube);
            gl.drawArrays(gl.TRIANGLES, 0, nCube);

            gambarCube=0;
            gl.uniform1i(gambarCubeUniformLocation, gambarCube);
            gl.uniform1i(fgambarCubeUniformLocation, gambarCube);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, nWord);

            gl.enable(gl.DEPTH_TEST);
    
            requestAnimationFrame(render);
        }
    
        function initGlSize() {
            var width = canvas.getAttribute("width"), height = canvas.getAttribute("height");
            // Fullscreen if not set
            if (width) {
                gl.maxWidth = width;
            }
            if (height) {
                gl.maxHeight = height;
            }
        }

        function initWordVertices() {
            var vertices=[];
            var huruf=[
                // Depan Tengah
                -0.1, 0.5, 0.33, 0.33, 0.33,   //B
                -0.1, 0.1, 0.33, 0.33, 0.33,  //E
                0.1, -0.5, 0.33, 0.33, 0.33,   //I
                0.1, -0.1, 0.33, 0.33, 0.33,    //F
                -0.1, 0.5, 0.33, 0.33, 0.33,   //B
                
                // Depan Kiri
                -0.3, 0.5,  0.33, 0.33, 0.33,    //A
                -0.3, -0.5,  0.33, 0.33, 0.33,   //C
                -0.1, -0.5,  0.33, 0.33, 0.33,   //D
                -0.1, 0.5, 0.33, 0.33, 0.33,    //B
                -0.3, 0.5,  0.33, 0.33, 0.33,    //A

                // Depan Kanan2
                0.1, -0.5, 0.33, 0.33, 0.33,   //I
                0.3, -0.5, 0.33, 0.33, 0.33,  //J
                0.3, 0.5, 0.33, 0.33, 0.33,    //H
                0.1, 0.5, 0.33, 0.33, 0.33,    //G
                0.1, -0.5, 0.33, 0.33, 0.33,   //I
            ];
            
            var vertexBuffer = gl.createBuffer();
            
            vertices = vertices.concat(huruf);
            
            var n = vertices.length / 5;
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            
            var vPosition = gl.getAttribLocation(program, 'vPosition');
            var vColor = gl.getAttribLocation(program, 'vColor');
            gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
            gl.vertexAttribPointer(vColor, 3, gl.FLOAT, gl.FALSE,
                5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
            gl.enableVertexAttribArray(vPosition);
            gl.enableVertexAttribArray(vColor);
            
            return n;
        }

        function initCubeVertices() {
            var verticesCubePlane = [];
            var cubePoints = [
                [ -0.8, -0.8,  0.8 ],
                [ -0.8,  0.8,  0.8 ],
                [  0.8,  0.8,  0.8 ],
                [  0.8, -0.8,  0.8 ],
                [ -0.8, -0.8, -0.8 ],
                [ -0.8,  0.8, -0.8 ],
                [  0.8,  0.8, -0.8 ],
                [  0.8, -0.8, -0.8 ]
              ];
              var cubeColors = [
                [],
                [1.0, 0.0, 0.0],
                [0.0, 1.0, 0.0],
                [0.0, 0.0, 1.0],
                [1.0, 0.0, 0.0],
                [1.0, 0.5, 0.0],
                [1.0, 1.0, 0.0],
                []
              ];
              var cubeNormals = [
                [],
                [  0.0,  0.0,  1.0 ], // depan
                [  1.0,  0.0,  0.0 ], // kanan
                [  0.0, -1.0,  0.0 ], // bawah
                [  0.0,  0.0, -1.0 ], // belakang
                [ -1.0,  0.0,  0.0 ], // kiri
                [  0.0,  1.0,  0.0 ], // atas
                []
              ];

              function quad(a, b, c, d) {
                var indices = [a, b, c, a, c, d];
                for (var i=0; i < indices.length; i++) {
                    for (var j=0; j < 3; j++) {
                        verticesCubePlane.push(cubePoints[indices[i]][j]);
                    }
                    for (var j=0; j < 3; j++) {
                        verticesCubePlane.push(cubeColors[a][j]);
                    }
                    for (var j=0; j < 3; j++) {
                        verticesCubePlane.push(-1*cubeNormals[a][j]);
                    }
                    switch (indices[i]) {
                        case a:
                            verticesCubePlane.push( (a-2)*0.125 );        // X
                            verticesCubePlane.push(0.0);        // Y
                        break;
                        case b:
                            verticesCubePlane.push( (a-2)*0.125 );
                            verticesCubePlane.push(1.0);
                        break;
                        case c:
                            verticesCubePlane.push( (a-1)*0.125 );
                            verticesCubePlane.push(1.0);
                        break;
                        case d:
                            verticesCubePlane.push( (a-1)*0.125 );
                            verticesCubePlane.push(0.0);
                        break;
                    
                        default:
                        break;
                    }
                }
            }

            // quad(1, 0, 3, 2);
            quad(2, 3, 7, 6);
            quad(3, 0, 4, 7);
            quad(4, 5, 6, 7);
            quad(5, 4, 0, 1);
            quad(6, 5, 1, 2);

            // Membuat vertex buffer object (CPU Memory <==> GPU Memory)
            var vertexBufferObject = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesCubePlane), gl.STATIC_DRAW);

            // Membuat sambungan untuk attribute
            var vPosition = gl.getAttribLocation(program, 'vPositionCubePlane');
            var vColor = gl.getAttribLocation(program, 'vColorCubePlane');
            var vNormal = gl.getAttribLocation(program, 'vNormalCubePlane');
            var vTexCoord = gl.getAttribLocation(program, 'vTexCoordCubePlane');
            gl.vertexAttribPointer(
            vPosition,                              // variabel yang memegang posisi attribute di shader
            3,                                      // jumlah elemen per atribut
            gl.FLOAT,                               // tipe data atribut
            gl.FALSE, 
            11 * Float32Array.BYTES_PER_ELEMENT,    // ukuran byte tiap verteks (overall) 
            0                                       // offset dari posisi elemen di array
            );
            gl.vertexAttribPointer(vColor, 3, gl.FLOAT, gl.FALSE,
              11 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
            gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, gl.FALSE,
            11 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);
            gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, gl.FALSE,
            11 * Float32Array.BYTES_PER_ELEMENT, 9 * Float32Array.BYTES_PER_ELEMENT);
            gl.enableVertexAttribArray(vPosition);
            gl.enableVertexAttribArray(vColor);
            gl.enableVertexAttribArray(vNormal);
            gl.enableVertexAttribArray(vTexCoord);

            var n = verticesCubePlane.length / 11;

            return n;
        }
    
        function resizer() {
            var width = canvas.getAttribute("width"), height = canvas.getAttribute("height");
            if (!width || width < 0) {
                canvas.width = window.innerWidth;
                gl.maxWidth = window.innerWidth;
            }
            if (!height || height < 0) {
                canvas.height = window.innerHeight;
                gl.maxHeight = window.innerHeight;
            }
            
            var min = Math.min.apply( Math, [gl.maxWidth, gl.maxHeight, window.innerWidth, window.innerHeight]);
            canvas.width = min;
            canvas.height = min;
            
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
    }   
}) ();