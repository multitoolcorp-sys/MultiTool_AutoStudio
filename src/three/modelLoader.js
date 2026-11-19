import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { TDSLoader } from 'three/examples/jsm/loaders/TDSLoader.js';

export const SUPPORTED_MODEL_EXTENSIONS = [
  '.glb',
  '.gltf',
  '.obj',
  '.fbx',
  '.stl',
  '.dae',
  '.ply',
  '.3ds',
  '.blend'
];

export function getFileExtension(filename = '') {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
}

function wrapGeometryAsGroup(geometry, defaultMat) {
  if (!geometry.attributes.normal) {
    geometry.computeVertexNormals();
  }
  const mesh = new THREE.Mesh(geometry, defaultMat);
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}

const VALID_OBJ_PREFIXES = new Set([
  'v',
  'vt',
  'vn',
  'vp',
  'f',
  'l',
  'p',
  'g',
  'o',
  's',
  'usemtl',
  'mtllib'
]);

function sanitizeObjText(rawText) {
  const lines = rawText.split(/\r?\n/);
  const cleaned = [];
  let vertexCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const token = trimmed.split(/\s+/)[0];
    if (!VALID_OBJ_PREFIXES.has(token)) continue;

    if (token === 'v') {
      const parts = trimmed.split(/\s+/);
      const x = parseFloat(parts[1]);
      const y = parseFloat(parts[2]);
      const z = parseFloat(parts[3]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        continue;
      }
      vertexCount += 1;
    }
    cleaned.push(trimmed);
  }

  return { text: cleaned.join('\n'), vertexCount };
}

/**
 * Loads a 3D car model from a Blob/Object URL in any supported format.
 */
export function loadCustomCarModel(url, fileName, defaultMat) {
  const ext = getFileExtension(fileName);

  return new Promise((resolve, reject) => {
    switch (ext) {
      case '.glb':
      case '.gltf': {
        const loader = new GLTFLoader();
        loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
        break;
      }
      case '.obj': {
        fetch(url)
          .then((res) => res.text())
          .then((rawText) => {
            const { text, vertexCount } = sanitizeObjText(rawText);
            if (vertexCount === 0) {
              throw new Error(
                'El archivo .obj no contiene vértices 3D válidos (puede ser un archivo de otro formato o simulador).'
              );
            }
            const loader = new OBJLoader();
            resolve(loader.parse(text));
          })
          .catch(reject);
        break;
      }
      case '.fbx': {
        const loader = new FBXLoader();
        loader.load(url, (fbx) => resolve(fbx), undefined, reject);
        break;
      }
      case '.stl': {
        const loader = new STLLoader();
        loader.load(
          url,
          (geometry) => resolve(wrapGeometryAsGroup(geometry, defaultMat)),
          undefined,
          reject
        );
        break;
      }
      case '.dae': {
        const loader = new ColladaLoader();
        loader.load(url, (collada) => resolve(collada.scene), undefined, reject);
        break;
      }
      case '.ply': {
        const loader = new PLYLoader();
        loader.load(
          url,
          (geometry) => resolve(wrapGeometryAsGroup(geometry, defaultMat)),
          undefined,
          reject
        );
        break;
      }
      case '.3ds': {
        const loader = new TDSLoader();
        loader.load(url, (obj) => resolve(obj), undefined, reject);
        break;
      }
      case '.blend': {
        reject(
          new Error(
            'Los archivos .blend nativos de Blender no se pueden leer directo en el navegador. En Blender ve a Archivo → Exportar → glTF 2.0 (.glb) o .obj/.fbx.'
          )
        );
        break;
      }
      default:
        reject(new Error(`Formato no soportado: ${ext || 'desconocido'}`));
    }
  });
}
