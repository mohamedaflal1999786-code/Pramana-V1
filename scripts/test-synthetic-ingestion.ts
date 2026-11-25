import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { executeDocumentExtraction } from "../src/lib/extraction/engine";
async function main(){
 const pdf=await PDFDocument.create();
 const page=pdf.addPage();
 const lines=["SYNTHETIC TEST ONLY","Warfarin 5 mg daily","Ibuprofen 400 mg daily","INR: 3.2","Allergy: Penicillin"];
 lines.forEach((line,i)=>page.drawText(line,{x:40,y:700-i*25,size:12}));
 const buffer=Buffer.from(await pdf.save());
 const run=(b:Buffer,name:string,mime:string)=>executeDocumentExtraction(b,name,mime,createHash("sha256").update(b).digest("hex"));
 const result=await run(buffer,"synthetic.pdf","application/pdf");
 assert.equal(result.success,true,JSON.stringify(result.errors));
 assert.equal(result.totalPages,1);
 for(const name of ["Warfarin","Ibuprofen","INR","Penicillin"]) assert.ok(result.entities.some(e=>e.normalizedName?.toLowerCase()===name.toLowerCase()),name);
 for(const e of result.entities){const p=result.pages.find(p=>p.pageNumber===e.sourceLocation.pageNumber);assert.equal(p?.text.slice(e.sourceLocation.charStart,e.sourceLocation.charEnd),e.rawText);assert.equal(e.isVerified,false);}
 assert.equal((await run(Buffer.from(""),"empty.txt","text/plain")).success,false);
 assert.equal((await run(Buffer.from("invalid PDF"),"invalid.pdf","application/pdf")).success,false);
 console.log("Synthetic PDF, entity grounding, empty and invalid document checks passed");
}
main().catch(e=>{console.error(e);process.exitCode=1});
