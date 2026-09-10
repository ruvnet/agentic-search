import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
export function serve(engine,token,port=0){
 if(typeof token!=='string'||token.length<32)throw Error('SEARCH_TOKEN requires at least 32 characters');
 const server=http.createServer(async(req,res)=>{
 const reply=(status,data)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data));};
 const got=Buffer.from(req.headers.authorization||''),want=Buffer.from('Bearer '+token);
 if(req.headers.origin||!/^127\.0\.0\.1:\d+$/.test(req.headers.host||'')||got.length!==want.length||!timingSafeEqual(got,want)){reply(403,{error:'Forbidden'});return;}
 if(req.method!=='POST'||req.url!=='/search'){reply(404,{error:'Not found'});return;}
 let bytes=0,chunks=[]; const timer=setTimeout(()=>req.destroy(),5000);
 try{for await(const chunk of req){bytes+=chunk.length;if(bytes>8192){reply(413,{error:'Too large'});req.destroy();return;}chunks.push(chunk);}const input=JSON.parse(Buffer.concat(chunks));reply(200,{results:engine.search(input.query,input.k)});}catch{if(!res.headersSent)reply(400,{error:'Invalid request'});}finally{clearTimeout(timer);}
 });server.requestTimeout=5000;server.headersTimeout=5000;server.maxConnections=16;server.listen(port,'127.0.0.1');return server;
}
