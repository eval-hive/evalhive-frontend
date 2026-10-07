import { matrixFor, multiply, TransformSchema, reviewAuthoring } from '@webprodigies/flute';
import { writeFileSync } from 'node:fs';

const rotation = { rotateX: 18, rotateY: 32, rotateZ: 14 };
const cameraRotation = matrixFor(TransformSchema.parse(rotation));
const pageRotation = matrixFor(TransformSchema.parse({}));
const railMatrix = multiply(cameraRotation, pageRotation);
const point = (x, y, z = 0) => [0, 1, 2].map(row =>
  railMatrix[row * 4] * x + railMatrix[row * 4 + 1] * y + railMatrix[row * 4 + 2] * z);
// Camera translation precedes stage rotation. Use the installed matrix convention
// to follow the page's local Y tangent while holding framing, pose and standoff.
const focusPoint = point(144 - 720, 160 - 450);
const start = { x: focusPoint[0] + 20, y: focusPoint[1] - 25, z: focusPoint[2] - 980 };
const tangent = point(0, 640);
const camera = { ...start, ...rotation, perspective: 1400 };
const rows = ['brand','role','nav-0','nav-1','nav-1-0','nav-1-1','nav-1-2','nav-1-3','nav-2','nav-2-0','nav-2-1','nav-2-2','nav-3','nav-4','profile','logout'];
const ids = ['page-paint', 'sidebar-paint', ...rows, 'workspace'];
const scene = {
  version: 3, camera,
  focus: { distance: 395, fStop: 6.3, focalLength: 75, maxBlur: 5 },
  nodes: [{id:'dashboard'}, ...ids.map(id => ({id, parentId:'dashboard'}))],
};
const motion = { durationMs: 7000, speed: 0.5, tracks: [] };
if (process.argv.includes('--animate')) {
  for (const [i, property] of ['x','y','z'].entries()) {
    motion.tracks.push({target:{kind:'camera'},property,keyframes:[
      {timeMs:0,value:start[property],easing:'cinematic'},
      {timeMs:7000,value:start[property]+tangent[i],easing:'cinematic'},
    ]});
  }
  for (const [i,id] of rows.entries()) {
    const delay = i < 14 ? i * 315 : 4850 + (i - 14) * 500;
    for (const [property,value] of [['z',55 + i*2], ['y',28]]) {
      motion.tracks.push({target:{kind:'surface',id},property,keyframes:[
        {timeMs:0,value,easing:'cinematic'},
        ...(delay ? [{timeMs:delay,value,easing:'cinematic'}] : []),
        {timeMs:delay+1250,value:0,easing:'cinematic'},
      ]});
    }
  }
}
const recipe = {version:1,id:'sidebar-descent',title:'Sidebar / Descent',description:'A close oblique rail down the live school dashboard. Navigation lifts from the page and settles row by row into its original slots.',definition:{scene,motion,width:1920,height:1080}};
const review = reviewAuthoring({scene, motion});
console.log(JSON.stringify(review));
if (!review.valid) throw new Error('Scene authoring validation failed');
writeFileSync(new URL('./scenes/sidebar-descent.scene.json',import.meta.url),JSON.stringify(recipe,null,2)+'\n');
