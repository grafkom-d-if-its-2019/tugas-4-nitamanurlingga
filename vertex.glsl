precision mediump float;

// Attribute Huruf
attribute vec2 vPosition;
attribute vec3 vColor;

// Attribute Cube
attribute vec3 vPositionCubePlane;      // Position
attribute vec3 vColorCubePlane;         // Warna
attribute vec3 vNormalCubePlane;        // Normal
attribute vec2 vTexCoordCubePlane;      // Teksture

// Variabel yang menangani semua tranformasi
uniform float scaleX;
uniform float constant;
uniform float jalanX;
uniform float jalanY;
uniform float jalanZ;

// Attribute untuk kamera
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

uniform vec3 diffusePosition;
varying vec3 fdiffusePosition;

// Variabel Flag
uniform int gambarCube;

// Variabel varying ke fragment.glsl
varying vec3 fColor;
varying vec3 fNormal;
varying vec3 fPosition;
varying vec2 fTexCoord;

void main() {
  mat4 translasi = mat4
    (constant, 0.0, 0.0, 0.0,
     0.0, constant, 0.0, 0.0,
     0.0, 0.0, 1.0, 0.0,
     jalanX, jalanY, jalanZ, 1.0 
  );

  mat4 scalationMatrix = mat4(
    scaleX, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  );

  fdiffusePosition = vec3(translasi  * scalationMatrix * vec4(diffusePosition, 1.0));

  if(gambarCube==0) {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * translasi  * scalationMatrix * vec4(vPosition, 0.0, 1.0);
    fColor = vColor;
    fNormal = vec3(translasi  * scalationMatrix * vec4(0.0, 0.0, 0.0, 1.0));
    fPosition = vec3(vPosition, 0.0);
  }
  else if(gambarCube==2)
  {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vPositionCubePlane, 1.0);
    fColor = vColorCubePlane;
    fNormal = vNormalCubePlane;
    fPosition = vPositionCubePlane;
    fTexCoord = vTexCoordCubePlane;
  }
}