import { writeFileSync } from 'node:fs';
import { matrixFor, TransformSchema, reviewAuthoring } from '@webprodigies/flute';

const orientation = {rotateX: 12, rotateY: 40, rotateZ: 10};
const basis = matrixFor(TransformSchema.parse(orientation));
const tangent = (x,y,z=0) => [0,1,2].map(row => basis[row*4]*x + basis[row*4+1]*y + basis[row*4+2]*z);
// Camera xyz precedes the stage rotation. Each target follows the page's own plane.
const cameraAt = (x,y,distance) => { const p=tangent(x-800,y-500); return {x:p[0],y:p[1],z:p[2]+distance-1400}; };
const shots = [
  [0,160,215,600], [1400,180,225,600],
  [3900,895,285,1020], [5500,895,285,1020],
  [6350,1220,895,950], [6700,1220,895,950],
  [7700,895,285,1020], [9000,895,285,1020],
  [10100,810,475,1100], [11300,950,420,1150], [14500,950,420,1150],
];
const ids = ['exam-header','exam-warning','map-title','map-legend',...Array.from({length:10},(_,i)=>`number-${i}`),'question-heading','option-a','option-b','option-c','option-d','exam-navigation','exam-confirmation','exam-completion','exam-pointer','exam-click'];
const scene = {version:3,camera:{...cameraAt(160,215,600),...orientation,perspective:1400},focus:{distance:600,fStop:8,focalLength:100,maxBlur:3},nodes:[{id:'exam-shell'},...ids.map(id=>({id,parentId:'exam-shell'}))]};
const motion = {durationMs:14500,speed:0.65,tracks:[]};
const track = (target,property,values) => motion.tracks.push({target,property,keyframes:values.map(([timeMs,value])=>({timeMs,value,easing:'cinematic'}))});
const surface = (id,property,values) => track({kind:'surface',id},property,values);
for (const property of ['x','y','z']) track({kind:'camera'},property,shots.map(([t,x,y,d])=>[t,cameraAt(x,y,d)[property]]));
track({kind:'focus'},'distance',shots.map(([t,x,y,d])=>[t,t===6350 || t===6700 ? 1120 : d]));
for (const id of ['exam-header','exam-warning']) surface(id,'opacity',[[0,1],[10700,1],[11100,0]]);
for (let i=0;i<10;i++) {
  surface(`number-${i}`,'z',[[0,75+i*4],[80+i*65,75+i*4],[950+i*65,0]]);
  surface(`number-${i}`,'opacity',[[0,i===0?0.6:0],[80+i*65,i===0?0.6:0],[650+i*65,1]]);
}
for (const [i,id] of ['question-heading','option-a','option-b','option-c','option-d'].entries()) {
  const start=1900+i*170;
  surface(id,'z',[[0,95+i*12],[start,95+i*12],[start+1350,0],[6600,0],[6700,45],[7400,0]]);
  surface(id,'opacity',[[0,0],[start,0],[start+700,1],[6500,1],[6640,0],[6750,0],[7100,1],[10700,1],[10900,0]]);
}
surface('exam-navigation','opacity',[[0,1],[10700,1],[10900,0]]);
surface('exam-confirmation','opacity',[[0,0],[9650,0],[9900,1],[10650,1],[10800,0]]);
surface('exam-confirmation','z',[[0,50]]);
surface('exam-completion','opacity',[[0,0],[10900,0],[11500,1]]);
surface('exam-completion','z',[[0,60],[10900,60],[12200,0]]);
const cursor=[[0,630,340],[4450,630,340],[4900,610,297],[5450,610,297],[6000,1490,965],[6500,1490,965],[6900,640,230],[8050,610,218],[8550,610,218],[9350,1520,32],[9750,1520,32],[10250,900,616],[10700,900,616]];
surface('exam-pointer','x',cursor.map(([t,x])=>[t,x]));
surface('exam-pointer','y',cursor.map(([t,x,y])=>[t,y]));
surface('exam-pointer','z',[[0,4],[9750,4],[9950,80]]);
surface('exam-pointer','opacity',[[0,0],[4400,0],[4700,1],[10700,1],[10900,0]]);
surface('exam-click','x',[[0,610],[5100,610],[6200,1490],[6700,1490],[7800,610],[8400,610],[9400,1520],[9800,1520],[10200,900]]);
surface('exam-click','y',[[0,297],[5100,297],[6200,965],[6700,965],[7800,218],[8400,218],[9400,32],[9800,32],[10200,616]]);
surface('exam-click','z',[[0,6],[9750,6],[9950,82]]);
surface('exam-click','opacity',[[0,0],...[5100,6500,8200,9700,10600].flatMap(t=>[[t-120,0],[t,0.8],[t+180,0]])]);
const review=reviewAuthoring({scene,motion});
if(!review.valid) throw new Error(JSON.stringify(review));
writeFileSync(new URL('./scenes/exam-journey.scene.json',import.meta.url),JSON.stringify({version:1,id:'exam-journey',title:'Exam / From Question to Result',description:'A close oblique entrance through the question map, travelling along the exam surface into answer selection, the next question, submission and the verified 2/10 score.',definition:{scene,motion,width:1920,height:1080}},null,2)+'\n');
console.log(JSON.stringify(review));
