import { validateUploadMeta, inspectFileHead, storageObjectName, extensionChain } from "./upload-policy";
const slots = new Set(["yt.export"]);
const cases: [string, unknown, boolean][] = [
  ["csv ok", validateUploadMeta({slot:"yt.export",name:"export.csv",mime:"text/csv",size:100}, slots), true],
  ["slot inconnu", validateUploadMeta({slot:"x",name:"a.csv",mime:"text/csv",size:10}, slots), false],
  ["mime refusé", validateUploadMeta({slot:"yt.export",name:"a.exe",mime:"application/x-msdownload",size:10}, slots), false],
  ["double extension", validateUploadMeta({slot:"yt.export",name:"rapport.pdf.exe",mime:"application/pdf",size:10}, slots), false],
  ["ext incohérente", validateUploadMeta({slot:"yt.export",name:"a.png",mime:"application/pdf",size:10}, slots), false],
  ["trop gros", validateUploadMeta({slot:"yt.export",name:"a.csv",mime:"text/csv",size:21*1024*1024}, slots), false],
  ["vide", validateUploadMeta({slot:"yt.export",name:"a.csv",mime:"text/csv",size:0}, slots), false],
  ["traversal", validateUploadMeta({slot:"yt.export",name:"../../a.csv",mime:"text/csv",size:100}, slots), false],
  ["pdf magic ok", inspectFileHead(new TextEncoder().encode("%PDF-1.7 ..."), "application/pdf"), true],
  ["pdf magic ko", inspectFileHead(new TextEncoder().encode("hello"), "application/pdf"), false],
  ["exe déguisé", inspectFileHead(new Uint8Array([0x4d,0x5a,0,0]), "text/csv"), false],
  ["csv script", inspectFileHead(new TextEncoder().encode("<script>x</script>"), "text/csv"), false],
  ["csv ok", inspectFileHead(new TextEncoder().encode("date,vues\n"), "text/csv"), true],
  ["png ok", inspectFileHead(new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), "image/png"), true],
];
let fail = 0;
for (const [name, result, shouldPass] of cases) {
  const passed = (result === null) === shouldPass;
  if (!passed) { fail++; console.log("FAIL", name, result); } else console.log("ok  ", name, result ?? "");
}
console.log("nom serveur:", storageObjectName("text/csv","uuid-1"), "| chaîne ext:", extensionChain("a.pdf.exe").join(","));
console.log(fail === 0 ? "TOUS LES TESTS PASSENT" : `${fail} ÉCHECS`);
