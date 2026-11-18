/* Single-letter EMNIST classifier. No spelling correction, lexicon or target input. */
importScripts('letter-core.js?v=1');
let session,loading;
const runtime='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/';
const modelURL='https://raw.githubusercontent.com/BryanDhaniel/Handwriting-Recognition-with-EMNIST-and-CNN/6f3456cad42cd56c987d367fa225285619c92e47/model.onnx';
async function modelBytes(){
 let cache;try{cache=await caches.open('gate-letter-model-v1');const hit=await cache.match(modelURL);if(hit)return hit.arrayBuffer();}catch{}
 const response=await fetch(modelURL,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Letter model download failed');
 if(cache)try{await cache.put(modelURL,response.clone());}catch{}
 return response.arrayBuffer();
}
async function init(){
 if(session)return session;
 if(!loading)loading=(async()=>{
  postMessage({type:'progress',progress:10});
  importScripts(runtime+'ort.wasm.min.js');ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;ort.env.wasm.wasmPaths=runtime;
  const bytes=await modelBytes();postMessage({type:'progress',progress:65});
  session=await ort.InferenceSession.create(bytes,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
  // Warm the actual inference path before inviting the child to write.
  await session.run({[session.inputNames[0]]:new ort.Tensor('float32',new Float32Array(784),[1,28,28,1])});
  postMessage({type:'ready'});return session;
 })().catch(e=>{loading=null;session=null;throw e;});return loading;
}
onmessage=async({data:m})=>{
 try{
  const s=await init();if(m.type!=='read')return;
  if(m.width!==28||m.height!==28||m.pixels.byteLength!==784*4)throw Error('Invalid letter image');
  const started=performance.now(),input=new Float32Array(m.pixels);
  const output=await s.run({[s.inputNames[0]]:new ort.Tensor('float32',input,[1,28,28,1])});
  const prediction=AirdropLetters.rank(output[s.outputNames[0]].data);
  postMessage({type:'result',id:m.id,prediction,inferenceMs:performance.now()-started});
 }catch(e){postMessage({type:'error',id:m.id,message:e.message||'Letter reader unavailable'});}
};
