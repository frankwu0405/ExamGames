// Downloads a public MIT-licensed handwriting model. Ink images are processed
// in this worker on the student's device; no writing is uploaded for inference.
let engine,RawImage,loading;
async function init(){
 if(engine)return engine;
 if(!loading)loading=(async()=>{
  const lib=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
  RawImage=lib.RawImage;lib.env.allowLocalModels=false;lib.env.useBrowserCache=true;
  lib.env.backends.onnx.wasm.numThreads=1;lib.env.backends.onnx.wasm.proxy=false;
  engine=await lib.pipeline('image-to-text','Xenova/trocr-small-handwritten',{
   dtype:'q8',device:'wasm',
   progress_callback:p=>postMessage({type:'progress',file:p.file,status:p.status,progress:p.progress})
  });
  postMessage({type:'ready'});return engine;
 })().catch(error=>{loading=null;throw error;});
 return loading;
}
onmessage=async event=>{
 const message=event.data;
 try{
  const pipe=await init();
  if(message.type==='load')return;
  if(message.type!=='read')return;
  // Deliberately receives pixels only. No target word, spelling list, context,
  // lexicon or expected answer is supplied to the recognition model.
  const image=new RawImage(new Uint8ClampedArray(message.pixels),message.width,message.height,4);
  const result=await pipe(image,{max_new_tokens:24,num_beams:1,do_sample:false});
  postMessage({type:'result',id:message.id,text:result?.[0]?.generated_text||''});
 }catch(error){postMessage({type:'error',id:message.id,message:error.message||'Reader unavailable'});}
};
