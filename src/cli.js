import {readFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import {index} from './search.js';import {serve} from './http.js';import {mcp} from './mcp.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const command=process.argv[2]||'status';
try{
 if(command==='test'){const r=spawnSync(process.execPath,['--test'],{cwd:root,stdio:'inherit',timeout:30000});process.exit(r.status??1);}
 const corpus=readFileSync(process.env.SEARCH_CORPUS||new URL('../fixtures/corpus.json',import.meta.url));if(corpus.length>17*1024*1024)throw Error('Corpus too large');const engine=index(JSON.parse(corpus));
 if(command==='mcp')await mcp(engine);
 else if(command==='serve'){const server=serve(engine,process.env.SEARCH_TOKEN);server.on('listening',()=>console.log(JSON.stringify({address:server.address()})));}
 else if(command==='search')console.log(JSON.stringify(engine.search(process.argv[3])));
 else if(command==='benchmark'){const timings=[];for(let i=0;i<1000;i++){const start=performance.now();engine.search('signed federation');timings.push(performance.now()-start);}timings.sort((a,b)=>a-b);console.log(JSON.stringify({fixtureDocuments:engine.size,iterations:1000,p50ms:timings[500],p95ms:timings[950],productionClaim:false}));}
 else if(command==='status')console.log(JSON.stringify({documents:engine.size,version:2}));else throw Error('Unknown command');
}catch(e){console.error(e.message);process.exitCode=1;}
