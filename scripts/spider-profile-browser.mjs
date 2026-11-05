/** Repeatable real-browser navigation profiling. No project dependencies added.
 * SPIDER_PLAYWRIGHT_MODULE points to an existing playwright-core/index.mjs.
 * SPIDER_BASE_URL, SPIDER_PROFILE_LABEL, SPIDER_PROFILE_MODE=baseline|matrix|regression.
 * Headless results describe this host/browser, not physical mobile GPU performance.
 */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import ts from "typescript";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = process.env.SPIDER_PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : "playwright-core");
const base = process.env.SPIDER_BASE_URL || "http://localhost:3000";
const label = process.env.SPIDER_PROFILE_LABEL || "profile";
const mode = process.env.SPIDER_PROFILE_MODE || "baseline";
const output = path.resolve("artifacts/spider-performance");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.SPIDER_BROWSER_EXECUTABLE ? { executablePath: process.env.SPIDER_BROWSER_EXECUTABLE } : {}),
});
const report = { label, mode, base, date: new Date().toISOString(), browser: browser.version(), environment: "Headless Chromium on the development host; viewport/DPR emulation, not physical device benchmarks", navigations: [], checks: [], errors: [], networkFailures: [] };
const round = n => Math.round(n * 100) / 100;
const percentile = (arr, quantile) => arr.length ? [...arr].sort((a,b) => a-b)[Math.min(arr.length-1, Math.floor(arr.length*quantile))] : 0;

function instrumentation() {
  const p = window.__spiderProfile = { frames: [], callbacks: [], longTasks: [], phases: [], routes: [], captures: [], starts: [], ends: [], contexts: [], clicks: [], operations: [], resourceStats: [], layouts: 0, styles: 0 };
  const now = () => performance.now();
  const phase = () => document.documentElement?.dataset.spiderTransition || "idle";
  const originalRAF = window.requestAnimationFrame;
  window.requestAnimationFrame = function(callback) {
    return originalRAF.call(window, stamp => {
      const began = now(), state = phase();
      try { return callback(stamp); }
      finally { if (state !== "idle") p.callbacks.push({ at: began, duration: now()-began, phase: state }); }
    });
  };
  let previous;
  function sample(stamp) {
    const state = phase();
    if (previous !== undefined && state !== "idle") p.frames.push({ at: stamp, duration: stamp-previous, phase: state });
    previous = stamp;
    originalRAF.call(window, sample);
  }
  originalRAF.call(window, sample);
  try { new PerformanceObserver(list => { p.longTasks.push(...list.getEntries().map(e => ({at:e.startTime,duration:e.duration,phase:phase()}))); }).observe({ type:"longtask", buffered:true }); } catch {}
  const originalStyle = window.getComputedStyle;
  window.getComputedStyle = function(...args) { if (phase() === "capturing") p.styles++; return originalStyle.apply(this,args); };
  const originalBounds = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function(...args) { if (phase() === "capturing") p.layouts++; return originalBounds.apply(this,args); };
  const originalContext = HTMLCanvasElement.prototype.getContext;
  for (const [prototype, key] of [[HTMLCanvasElement.prototype,"toDataURL"],[CanvasRenderingContext2D.prototype,"drawImage"],[XMLSerializer.prototype,"serializeToString"]]) {
    const original = prototype[key];
    prototype[key] = function(...args) { const at=now(),state=phase(); try { return original.apply(this,args); } finally { if(state==="capturing")p.operations.push({at,name:key,duration:now()-at}); } };
  }
  const recorded = new WeakSet();
  HTMLCanvasElement.prototype.getContext = function(type, ...args) {
    const context = originalContext.call(this,type,...args);
    if (context && type.includes("webgl") && !recorded.has(context)) {
      recorded.add(context);
      p.contexts.push({ type, at:now(), transition: this.classList.contains("spider-transition__canvas") });
      const resources={transition:this.classList.contains("spider-transition__canvas"),textures:0,buffers:0,programs:0}; p.resourceStats.push(resources);
      for(const [name,key] of [["Texture","textures"],["Buffer","buffers"],["Program","programs"]]) {
        const create=context[`create${name}`],remove=context[`delete${name}`];
        context[`create${name}`]=function(...args){const value=create.apply(this,args);if(value)resources[key]++;return value;};
        context[`delete${name}`]=function(value){if(value)resources[key]--;return remove.call(this,value);};
      }
    }
    return context;
  };
  for (const key of ["pushState","replaceState"]) {
    const fn = history[key];
    history[key] = function(...args) { const value = fn.apply(this,args); p.routes.push({ at:now(),url:location.pathname+location.search,kind:key }); return value; };
  }
  window.addEventListener("portfolio:capture-frame", () => p.captures.push({at:now(),layouts:p.layouts,styles:p.styles}));
  window.addEventListener("portfolio:transition-start", () => p.starts.push({at:now(),layouts:p.layouts,styles:p.styles,previewNodes:document.querySelector(".spider-transition__freeze")?.shadowRoot?.querySelectorAll("*").length}));
  window.addEventListener("portfolio:transition-end", () => p.ends.push({at:now()}));
  document.addEventListener("click", e => { const anchor=e.composedPath().find(n=>n instanceof HTMLAnchorElement); if(anchor) p.clicks.push({at:now(),href:anchor.getAttribute("href")}); },true);
  new MutationObserver(() => {
    const value = phase();
    if(p.phases.at(-1)?.phase !== value) p.phases.push({at:now(),phase:value});
  }).observe(document,{subtree:true,attributes:true,attributeFilter:["data-spider-transition"]});
}

async function makePage(viewport, extras={}) {
  const page = await browser.newPage({viewport,...extras});
  await page.addInitScript(instrumentation);
  page.on("pageerror", e => report.errors.push({viewport,error:e.message}));
  page.on("console", m => { if (m.type() === "error" || /\[Spider transition\]|WebGL.*(error|warning)|CONTEXT_LOST/i.test(m.text())) report.errors.push({viewport,console:m.text()}); });
  page.on("requestfailed", request=>report.networkFailures.push({url:request.url(),type:request.resourceType(),error:request.failure()?.errorText}));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  return {page,cdp};
}
async function metrics(cdp) {
  return Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(m=>[m.name,m.value]));
}
async function settled(page) {
  await page.waitForFunction(() => document.querySelector(".spider-transition__freeze")?.shadowRoot && !document.documentElement.dataset.spiderTransition && !document.querySelector(".site-preloader"),null,{timeout:25000});
  assert.equal(await page.locator("[data-transition-page]").evaluate(n=>n.inert),false);
  assert.equal(await page.locator(".spider-transition").evaluate(n=>n.hidden),true);
}
async function navigate(page,cdp,to,detail={}) {
  await settled(page);
  const from = new URL(page.url()).pathname;
  const before = await metrics(cdp);
  const begin = await page.evaluate(() => performance.now());
  // Use an actual existing anchor. Dispatching its click also exercises the
  // document capture handler on narrow viewports where menu links are collapsed.
  const click = await page.evaluate(to => {
    const anchor=[...document.querySelectorAll("a[href]")].find(a=>a.getAttribute("href")===to);
    if(!anchor) throw new Error(`No existing navigation anchor to ${to}`);
    const start=performance.now(); anchor.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,composed:true})); return performance.now()-start;
  },to);
  await page.waitForURL(u => u.pathname === (to === "/experience" ? "/about" : to), {timeout:25000});
  await settled(page);
  // Allow long-task observer delivery without including an extra capture.
  await page.waitForTimeout(100);
  const end = await page.evaluate(() => performance.now());
  const data = await page.evaluate(({begin,end})=>{
    const p=window.__spiderProfile;
    return Object.fromEntries(Object.entries(p).map(([k,v])=>[k,Array.isArray(v)?v.filter(e=>e.at>=begin&&e.at<=end):v]));
  },{begin,end});
  const after = await metrics(cdp);
  const activeFrames=data.frames.filter(f=>["swinging","holding","pulling"].includes(f.phase)).map(f=>f.duration);
  const captured = data.captures[0], started=data.starts[0];
  const swung=data.phases.find(p=>p.phase==="swinging"||p.phase==="pulling");
  const sample = {
    ...detail,from,to,clickHandlerMs:round(click),totalMs:round(end-begin),
    synchronousCaptureMs:captured&&started?round(started.at-captured.at):null,
    clickToSwingMs:swung&&data.clicks[0]?round(swung.at-data.clicks[0].at):null,
    clickToRouteCommitMs:data.routes.find(r=>r.url===to)&&data.clicks[0]?round(data.routes.find(r=>r.url===to).at-data.clicks[0].at):null,
    captureStyleReads:started&&captured?started.styles-captured.styles:null,
    captureBoundsReads:started&&captured?started.layouts-captured.layouts:null,
    previewNodes:started?.previewNodes,
    frames:{count:activeFrames.length,medianMs:round(percentile(activeFrames,.5)),p95Ms:round(percentile(activeFrames,.95)),maxMs:round(Math.max(0,...activeFrames)),over25ms:activeFrames.filter(n=>n>25).length},
    rafCallbackMs:{p95:round(percentile(data.callbacks.map(c=>c.duration),.95)),max:round(Math.max(0,...data.callbacks.map(c=>c.duration)))},
    longTasks:data.longTasks.map(t=>({...t,at:round(t.at-begin),duration:round(t.duration)})),
    phases:data.phases.map(p=>({...p,at:round(p.at-begin)})),
    counters:{scriptMs:round((after.ScriptDuration-before.ScriptDuration)*1000),layoutMs:round((after.LayoutDuration-before.LayoutDuration)*1000),styleMs:round((after.RecalcStyleDuration-before.RecalcStyleDuration)*1000),layouts:after.LayoutCount-before.LayoutCount,styleRecalculations:after.RecalcStyleCount-before.RecalcStyleCount,heapUsedMB:round(after.JSHeapUsedSize/1048576),domNodes:after.Nodes,documents:after.Documents},
    contextsCreated:data.contexts,
    captureOperations:data.operations.map(entry=>({...entry,at:round(entry.at-begin),duration:round(entry.duration)})),
    cleanup: await page.evaluate(()=>({inert:document.querySelector("[data-transition-page]").inert,hidden:document.querySelector(".spider-transition").hidden,previewNodes:document.querySelector(".spider-transition__freeze").shadowRoot.childNodes.length,canvases:document.querySelectorAll("canvas").length,totalWebGLContexts:window.__spiderProfile.contexts.length,totalTransitionContexts:window.__spiderProfile.contexts.filter(c=>c.transition).length,resources:window.__spiderProfile.resourceStats})),
  };
  report.navigations.push(sample);
  await writeFile(path.join(output,`${label}.json`),JSON.stringify(report,null,2));
  console.log(JSON.stringify({from,to,...detail,captureMs:sample.synchronousCaptureMs,clickMs:sample.clickHandlerMs,swingMs:sample.clickToSwingMs,frames:sample.frames,longTasks:sample.longTasks.length,heapMB:sample.counters.heapUsedMB}));
  return sample;
}

try {
  if(mode === "capture") {
    const captureSource=await readFile(new URL("../components/animations/spider-transition/capture.ts",import.meta.url),"utf8");
    const {outputText}=ts.transpileModule(captureSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
    for(const route of ["/about","/projects"]) {
      const {page,cdp}=await makePage({width:1440,height:900});
      await page.goto(`${base}${route}`,{waitUntil:"domcontentloaded",timeout:45000});
      await page.waitForTimeout(2500); await settled(page);
      await page.evaluate(code=>{const exports={};new Function("exports",code)(exports);window.__captureViewport=exports.freezeViewport;},outputText);
      await page.evaluate(()=>{
        window.dispatchEvent(new Event("portfolio:capture-frame"));
        window.dispatchEvent(new Event("portfolio:transition-start"));
        document.getAnimations().forEach(animation=>animation.pause());
        document.querySelectorAll("nextjs-portal").forEach(n=>n.style.display="none");
      });
      const name=route.slice(1);
      await page.screenshot({path:path.join(output,`${label}-${name}-original.png`)});
      if(process.env.SPIDER_PROFILE_CAPTURE_CPU) { await cdp.send("Profiler.enable");await cdp.send("Profiler.start"); }
      const capture=await page.evaluate(()=>{
        const started=performance.now();
        const snapshot=window.__captureViewport(document.querySelector("[data-transition-page]"),1);
        const ms=performance.now()-started;
        const host=document.createElement("div");host.style.cssText="position:fixed;inset:0;z-index:2147483647;pointer-events:none";
        host.attachShadow({mode:"open"}).append(snapshot.preview); document.body.append(host);
        window.__visualSnapshot=snapshot;window.__visualHost=host;
        return {freezeMs:ms,nodes:snapshot.preview.querySelectorAll("*").length};
      });
      if(process.env.SPIDER_PROFILE_CAPTURE_CPU) {
        const {profile}=await cdp.send("Profiler.stop");await writeFile(path.join(output,`${label}-${name}.cpuprofile`),JSON.stringify(profile));
        const samples=new Map();profile.samples?.forEach((id,index)=>samples.set(id,(samples.get(id)||0)+(profile.timeDeltas?.[index]||0)));
        capture.cpuSelfTime=profile.nodes.map(node=>({name:node.callFrame.functionName,line:node.callFrame.lineNumber+1,ms:round((samples.get(node.id)||0)/1000)})).sort((a,b)=>b.ms-a.ms).slice(0,15);
      }
      await page.screenshot({path:path.join(output,`${label}-${name}-preview.png`)});
      const raster=await page.evaluate(async()=>{
        const started=performance.now();const canvas=await window.__visualSnapshot.render(new AbortController().signal);
        canvas.style.cssText="width:100%;height:100%;display:block"; window.__visualHost.shadowRoot.replaceChildren(canvas);
        return {renderMs:performance.now()-started,width:canvas.width,height:canvas.height};
      });
      await page.screenshot({path:path.join(output,`${label}-${name}-raster.png`)});
      report.checks.push({route,...capture,...raster});console.log(JSON.stringify(report.checks.at(-1)));
      await page.close();
    }
  } else if(mode === "cpu") {
    const {page,cdp}=await makePage({width:1440,height:900});
    await page.goto(`${base}/about`,{waitUntil:"networkidle"});
    await page.waitForTimeout(2500);
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.start");
    await navigate(page,cdp,"/contact",{width:1440,height:900,dpr:1});
    const {profile}=await cdp.send("Profiler.stop");
    await writeFile(path.join(output,`${label}.cpuprofile`),JSON.stringify(profile));
    const samples=new Map();
    profile.samples?.forEach((id,index)=>samples.set(id,(samples.get(id)||0)+(profile.timeDeltas?.[index]||0)));
    report.cpuSelfTime=profile.nodes.map(node=>({name:node.callFrame.functionName,url:node.callFrame.url,line:node.callFrame.lineNumber+1,ms:round((samples.get(node.id)||0)/1000)})).sort((a,b)=>b.ms-a.ms).slice(0,30);
    console.log(JSON.stringify(report.cpuSelfTime));
    await page.close();
  } else if(mode === "baseline") {
    const {page,cdp}=await makePage({width:1440,height:900});
    await page.goto(`${base}/about`,{waitUntil:"networkidle"});
    await page.waitForTimeout(2500);
    report.hardware=await page.evaluate(()=>({cores:navigator.hardwareConcurrency,memoryGB:navigator.deviceMemory,dpr:devicePixelRatio,userAgent:navigator.userAgent}));
    for(const to of ["/contact","/about","/","/projects","/about","/contact"]) {
      await navigate(page,cdp,to,{width:1440,height:900,dpr:1});
      await page.waitForTimeout(500);
    }
    await page.close();
  } else if(mode === "matrix") {
    for(const [width,height,dpr] of [[320,640,2],[375,812,3],[430,932,3],[768,1024,2],[1024,768,1],[1440,900,1],[1920,1080,1.5],[2560,1440,2]]) {
      const {page,cdp}=await makePage({width,height},{deviceScaleFactor:dpr});
      await page.goto(`${base}/about`,{waitUntil:"networkidle"});
      await page.waitForTimeout(1800);
      const sample=await navigate(page,cdp,"/contact",{width,height,dpr});
      assert(sample.phases.some(p=>p.phase==="pulling"),`No cloth flight at ${width}`);
      await page.screenshot({path:path.join(output,`${label}-${width}-destination.png`)});
      // Separate visual flight: screenshot readback is excluded from timings.
      await page.evaluate(()=>document.querySelector('a[href="/about"]').dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,composed:true})));
      await page.waitForFunction(()=>document.documentElement.dataset.spiderTransition==="pulling",null,{timeout:25000});
      await page.screenshot({path:path.join(output,`${label}-${width}-cloth.png`)});
      await settled(page);
      await page.close();
    }
  } else if(mode === "regression") {
    const {page,cdp}=await makePage({width:1440,height:900});
    await page.goto(`${base}/about`,{waitUntil:"networkidle"});
    await page.waitForTimeout(2000);
    for(const to of ["/contact","/about","/","/projects","/hackathons","/hackshastra","/about","/contact","/about","/contact"]) {
      await navigate(page,cdp,to,{width:1440,height:900,dpr:1});
      await cdp.send("HeapProfiler.collectGarbage");
      report.navigations.at(-1).retainedHeapMB=round((await metrics(cdp)).JSHeapUsedSize/1048576);
    }
    for(const [method,to] of [["goBack","/about"],["goForward","/contact"]]) { await page[method](); await page.waitForURL(u=>u.pathname===to); await settled(page); report.checks.push(`${method}: ${to}`); }
    await page.evaluate(()=>{ for(const to of ["/about","/projects","/hackathons"]) document.querySelector(`a[href="${to}"]`).dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,composed:true})); });
    await page.waitForURL("**/hackathons",{timeout:30000}); await settled(page); report.checks.push("rapid navigation: last request wins and overlay clears");
    await page.evaluate(()=>document.querySelector('a[href="/about"]').dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,composed:true})));
    await page.setViewportSize({width:768,height:430}); await page.waitForURL("**/about"); await settled(page); report.checks.push("resize during navigation: landscape viewport released");
    const ordinaryLinks=await page.evaluate(()=>{
      const cases=[{href:"https://example.com/"},{href:"/contact",target:"_blank"},{href:"/contact",ctrlKey:true},{href:"/contact",metaKey:true},{href:"/contact",shiftKey:true},{href:"/contact",download:true},{href:"#main"}];
      return cases.map(test=>{
        const anchor=document.createElement("a");anchor.href=test.href;if(test.target)anchor.target=test.target;if(test.download)anchor.download="file";document.body.append(anchor);
        let intercepted;
        const observe=event=>{intercepted=event.defaultPrevented;event.preventDefault();};
        document.addEventListener("click",observe,{once:true});
        anchor.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,composed:true,ctrlKey:!!test.ctrlKey,metaKey:!!test.metaKey,shiftKey:!!test.shiftKey}));anchor.remove();return {...test,intercepted};
      });
    });
    assert(ordinaryLinks.every(test=>!test.intercepted));report.checks.push({ordinaryLinks});
    await page.close();
    const reduced=await makePage({width:375,height:812},{reducedMotion:"reduce"});
    await reduced.page.goto(`${base}/about`,{waitUntil:"networkidle"});
    const sample=await navigate(reduced.page,reduced.cdp,"/contact",{reducedMotion:true});
    assert.equal(sample.cleanup.totalTransitionContexts,0); report.checks.push("reduced motion: native navigation, no transition context"); await reduced.page.close();
    const noGL=await makePage({width:375,height:812});
    await noGL.page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes("webgl")?null:original.call(this,type,...args);};});
    await noGL.page.goto(`${base}/about`,{waitUntil:"networkidle"});await noGL.page.waitForTimeout(1800);
    await navigate(noGL.page,noGL.cdp,"/contact",{unavailableWebGL:true});report.checks.push("unavailable WebGL: native navigation released");await noGL.page.close();
    const lost=await makePage({width:1024,height:768});
    await lost.page.goto(`${base}/about`,{waitUntil:"networkidle"});await lost.page.waitForTimeout(1800);await settled(lost.page);
    await lost.page.evaluate(()=>document.querySelector('a[href="/contact"]').dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,composed:true})));
    await lost.page.waitForFunction(()=>document.documentElement.dataset.spiderTransition==="swinging",null,{timeout:25000});
    const lossAvailable=await lost.page.evaluate(()=>{const extension=document.querySelector(".spider-transition__canvas").getContext("webgl2").getExtension("WEBGL_lose_context");extension?.loseContext();return !!extension;});
    assert(lossAvailable);await lost.page.waitForURL("**/contact");await settled(lost.page);report.checks.push("lost WebGL context: navigation released");await lost.page.close();
    const limited=await makePage({width:1920,height:1080},{deviceScaleFactor:2});
    await limited.page.addInitScript(()=>{Object.defineProperty(navigator,"hardwareConcurrency",{get:()=>2});Object.defineProperty(navigator,"deviceMemory",{get:()=>2});});
    await limited.page.goto(`${base}/about`,{waitUntil:"networkidle"});await limited.page.waitForTimeout(1800);
    const light=await navigate(limited.page,limited.cdp,"/contact",{emulatedCores:2,emulatedMemoryGB:2,width:1920,dpr:2});
    assert(light.phases.some(phase=>phase.phase==="pulling"));
    const buffer=await limited.page.locator(".spider-transition__canvas").evaluate(canvas=>({width:canvas.width,height:canvas.height}));
    report.checks.push({capabilityFallback:"Large viewport, 2 cores/2 GB; cinematic flight retained",buffer});await limited.page.close();
  }
} catch(error) { report.failure=error.stack; throw error; }
finally { await writeFile(path.join(output,`${label}.json`),JSON.stringify(report,null,2)); await browser.close(); console.log(`Saved ${path.join(output,`${label}.json`)}`); }
