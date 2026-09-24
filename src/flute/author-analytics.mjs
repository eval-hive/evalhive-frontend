import { matrixFor, multiply, TransformSchema, reviewAuthoring } from '@webprodigies/flute';
import { analyticsTimings } from './analytics-timing.ts';
import { writeFileSync } from 'node:fs';

const orientation = {rotateX:12, rotateY:50, rotateZ:10};
const basis = multiply(matrixFor(TransformSchema.parse(orientation)), matrixFor(TransformSchema.parse({})));
const direction = (x,y,z=0) => [0,1,2].map(row => basis[row*4]*x + basis[row*4+1]*y + basis[row*4+2]*z);
const subject = direction(650-800, 300-950);
const start = {x:subject[0], y:subject[1]+30, z:subject[2]-720};
const rail = direction(330,1000);
const sidebarIds = ['page-paint','sidebar-paint','brand','role','nav-0','nav-1','nav-1-0','nav-1-1','nav-1-2','nav-1-3','nav-2','nav-2-0','nav-2-1','nav-2-2','nav-3','nav-4','profile','logout','workspace'];
const scene = {
  version:3,
  camera:{...start,...orientation,perspective:1600},
  focus:{distance:835,fStop:6.3,focalLength:105,maxBlur:5},
  nodes:[{id:'dashboard'},...sidebarIds.map(id=>({id,parentId:'dashboard'})),
    ...['header',...Object.keys(analyticsTimings)].map(id=>({id,parentId:'workspace'}))],
};
const motion = {durationMs:10000,speed:0.5,tracks:[]};
if (process.argv.includes('--animate')) {
  for (const [i,property] of ['x','y','z'].entries()) motion.tracks.push({
    target:{kind:'camera'},property,keyframes:[
      {timeMs:0,value:start[property],easing:'cinematic'},
      {timeMs:10000,value:start[property]+rail[i],easing:'cinematic'},
    ],
  });
  for (const [i,[id,time]] of Object.entries(analyticsTimings).entries()) {
    for (const [property,from,to,duration] of [['z',90+(i%3)*16,0,1450],['y',24,0,1450],['opacity',0,1,750]]) {
      motion.tracks.push({target:{kind:'surface',id},property,keyframes:[
        {timeMs:0,value:from,easing:'cinematic'},
        ...(time?[{timeMs:time,value:from,easing:'cinematic'}]:[]),
        {timeMs:time+duration,value:to,easing:'cinematic'},
      ]});
    }
  }
}
const review = reviewAuthoring({scene,motion});
console.log(JSON.stringify(review));
if (!review.valid) throw new Error('Analytics scene validation failed.');
writeFileSync(new URL('./scenes/analytics-reveal.scene.json',import.meta.url),JSON.stringify({
  version:1,id:'analytics-reveal',title:'Analytics / In Motion',
  description:'A close oblique journey from live summary cards into animated trends, score distributions and school performance. Cards lift, fade and settle as values count up.',
  definition:{scene,motion,width:1600,height:1000},
},null,2)+'\n');
