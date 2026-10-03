import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const plannerPage=read("app/plan/page.tsx"),plannerModel=read("lib/stack-planner.ts"),tracking=read("components/StackPlanTracking.tsx"),homepage=read("app/page.tsx"),pricing=read("app/pricing/page.tsx"),checkoutButton=read("components/CheckoutButton.tsx"),checkoutRoute=read("app/api/checkout/route.ts"),sitemap=read("app/sitemap.ts");
const requiredGoals=["research","ship-software","automate-ops","analyze-data","agent-memory"];
for(const goal of requiredGoals)assert.ok(plannerModel.includes(`id: "${goal}"`),`Missing goal ${goal}`);
assert.ok((plannerModel.match(/slug: "/g)||[]).length>=requiredGoals.length*3);
for(const value of ["sortedMcps.find","mcp.category === slug","buildStackBrief","First integration sequence:"])assert.ok(plannerModel.includes(value),value);
for(const value of ['action="/plan"','name="goal"',"getStackRecommendations","Inspect listing","CopyStackBrief","Take the shortlist with you"])assert.ok(plannerPage.includes(value),value);
for(const value of ['<NativeSelect','<NativeSelectOption','<Button','type="submit"'])assert.ok(plannerPage.includes(value),value);
assert.ok(!/<(?:select|button)\b/.test(plannerPage),'Planner controls use the prescribed shadcn primitives');
assert.ok(!/<button\b/.test(tracking),'Copy and handoff actions use the prescribed Button primitive');
for(const value of ['track("stack_plan_generated"','track("stack_plan_starter_kit_clicked"','track("stack_plan_brief_copied"',"navigator.clipboard.writeText","source=stack-planner","#starter-kit","Clipboard access is unavailable"])assert.ok(tracking.includes(value),value);
for(const value of ['requestedSource === "stack-planner"',"source={source}","goal={goal}"])assert.ok(pricing.includes(value),value);
for(const value of ['body: JSON.stringify({ plan, email, source, goal })','track("checkout_started", { plan, ...attribution })'])assert.ok(checkoutButton.includes(value),value);
for(const value of ["acquisition_source: source","acquisition_goal: goal","attributionValuePattern"])assert.ok(checkoutRoute.includes(value),value);
assert.ok(homepage.includes('href="/plan"')&&homepage.includes("Build my free stack"));
assert.ok(sitemap.includes('"/plan"'));

function load(file,dependencies){
 const compiled=ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const context={exports:{},require:name=>{assert.ok(name in dependencies,`Unexpected dependency ${name}`);return dependencies[name];},URL};
 runInNewContext(compiled,context);return context.exports;
}
// Exercise the real catalog: category-shaped fixtures concealed dead source
// links and irrelevant featured entries in the previous recommendations.
const catalog=JSON.parse(read('data/mcps.json'));
const categoryModule=load('data/categories.ts',{});
const mcps=load('lib/mcps.ts',{'@/data/mcps.json':{default:catalog},'@/data/categories':categoryModule});
const model=load('lib/stack-planner.ts',{'@/lib/mcps':mcps,'@/lib/site':{siteUrl:'https://everymcp.com'}});
const kit=load('lib/starter-kit.ts',{'@/lib/stack-planner':model});
const expectedStacks={
 research:['brave-search','fetch','memory'],
 'ship-software':['github-official','filesystem','context7'],
 'automate-ops':['github-official','playwright-mcp-official','filesystem'],
 'analyze-data':['motherduck-mcp','grafana','filesystem'],
 'agent-memory':['memory','filesystem','chroma']
};
// Canonical publisher sources checked 2026-10-03. Availability is checked
// separately during release review; no network request belongs in this test.
const expectedSources={
 'brave-search':'https://github.com/brave/brave-search-mcp-server',
 fetch:'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
 memory:'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
 'github-official':'https://github.com/github/github-mcp-server',
 filesystem:'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
 context7:'https://github.com/upstash/context7',
 'playwright-mcp-official':'https://github.com/microsoft/playwright-mcp',
 'motherduck-mcp':'https://github.com/motherduckdb/mcp-server-motherduck',
 grafana:'https://github.com/grafana/mcp-grafana',
 chroma:'https://github.com/chroma-core/chroma-mcp'
};
function verifyKitSelection(body,expectedIds){
 const matrix=body.split('## 2. Current catalog selection matrix\n')[1].split('## 3. Source and permission review')[0];
 const rows=matrix.split('\n').filter(line=>line.startsWith('| ')&&line.includes('https://github.com/'));
 const matrixSources=rows.map(line=>line.split('|')[4].trim());
 const expected=expectedIds.map(id=>expectedSources[id]);
 assert.deepEqual(matrixSources,expected,'The paid matrix must match the reviewed selected records');
 assert.equal(new Set(matrixSources).size,matrixSources.length,'Paid selection rows must not duplicate a server');
 const notes=matrix.split('\n').filter(line=>line.startsWith('- **'));
 assert.equal(notes.length,expectedIds.length,'Each selected record has one matching catalog note');
 for(const id of expectedIds){
  const mcp=mcps.sortedMcps.find(record=>record.id===id);
  assert.ok(notes.some(note=>note.startsWith(`- **${mcp.name}**`)),`Missing selected note for ${id}`);
 }
 const emittedSources=Array.from(body.matchAll(/https:\/\/github\.com\/[^\s|)]+/g),match=>match[0]);
 assert.ok(emittedSources.length>=expected.length);
 for(const source of emittedSources)assert.ok(expected.includes(source),`Unreviewed source in paid packet: ${source}`);
}
for(const goal of requiredGoals){
 const selected=model.getStackRecommendations(goal);
 assert.equal(selected.length,3);assert.equal(new Set(selected.map(value=>value.mcp.id)).size,3);
 assert.deepEqual(Array.from(selected,value=>value.mcp.id),expectedStacks[goal]);
 assert.equal(new Set(selected.map(value=>value.mcp.repo)).size,3,'Each role must add a distinct server');
 const brief=model.buildStackBrief(goal);
 for(const {mcp} of selected){
  assert.equal(mcp.repo,expectedSources[mcp.id],`${goal}: use the reviewed publisher source for ${mcp.id}`);
  assert.ok(brief.includes(`EveryMCP: https://everymcp.com/mcp/${mcp.slug}`),'Copied listing links must work outside this site');
  assert.ok(brief.includes(`Source: ${mcp.repo}`));
 }
 for(const marker of ['Task:','Success:','Stop:'])assert.ok(brief.includes(marker));
 const paidKit=kit.buildStarterKit(goal);
 assert.ok(paidKit.includes(brief));
 verifyKitSelection(paidKit,expectedStacks[goal]);
}
assert.equal(kit.buildStarterKit('unknown-goal'),kit.starterKit);
verifyKitSelection(kit.starterKit,[...expectedStacks.research,...expectedStacks['ship-software']]);
let verified={status:'paid',session:{metadata:{acquisition_goal:'ship-software'}}};
class Result {constructor(body,options={}){this.body=body;this.options=options;}static json(body,options){return new Result(body,options);}}
const handler=load('app/api/fulfillment/starter-kit/route.ts',{'next/server':{NextResponse:Result},'@/lib/starter-kit':kit,'@/lib/stripe-fulfillment':{verifyPaidSession:async()=>verified}});
const delivered=await handler.GET({url:'https://everymcp.com/api/fulfillment/starter-kit?session_id=cs_fixture&goal=research'});
assert.equal(delivered.body,kit.buildStarterKit('ship-software'),'Paid metadata, not the query, owns the delivered goal');
assert.equal(delivered.options.headers['Cache-Control'],'private, no-store');
verified={status:'paid',session:{metadata:{}}};
assert.equal((await handler.GET({url:'https://everymcp.com/api/fulfillment/starter-kit?session_id=cs_fixture'})).body,kit.starterKit);
for(const [status,code] of [['missing',400],['unavailable',503],['invalid',403],['not_paid',403]]){
 verified={status};const result=await handler.GET({url:'https://everymcp.com/api/fulfillment/starter-kit'});assert.equal(result.options.status,code);assert.equal(typeof result.body,'object');
}
console.log('Stack planner: all five real-catalog stacks, ten publisher sources, goal-matched paid matrices, deduplicated legacy matrix, portable links, and verified paid-goal fulfillment behavior passed');
