// test script
import { buildTemplateParams } from "./dist/utils/templateParamsBuilder.js";
import { getEmailTemplate } from "./dist/templates/twilioemailTemplates.js";
import { renderHtmlToPdf } from "./dist/utils/reportRenderer.js";
const tpl = getEmailTemplate("ns_temp_Notification_temp2");
const accts = [];
for (let i = 0; i < 10; i++) accts.push({ Id: "act_591297849880582", Name: "Bhoj Masale FbAd " + i, Roas: "3.36", Revenue: "88367.47", Spend: "26304.74" });
const params = buildTemplateParams("ns_temp_Notification_temp2", {
  StoreName: "Celebrity Drapes", PrevDate: "H2 2026", GrossRevenue: "12,45,541.34", NetSales: "17,232.06",
  Orders: "4", AOV: "5,308", LTV: "3815.76", LTVCACRatio: "1.8", NewVsRepeat: "91/50", OrderFrequency: "1.14",
  TotalDiscountRate: "28,159.13", OrderFulfillmentRate: "65.00", GA4Sessions: "2,863", GA4Users: "2687",
  BlendedSpend: "41,391.84", BlendedROAS: "2.8", BlendedRevenue: "11,28,977.52", MetaSpend: "36,772.80",
  MetaROAS: "2.96", MetaRevenue: "1,08,846.47", Googleadsspend: "4,619.04", GoogleROAS: "1.57", GoogleRevenue: "7,265.47",
  metaAccounts: accts, googleAccounts: [{Id:"act_1234",Name:"Bhoj Search",Roas:"1.57",Revenue:"7265.47",Spend:"4619.04"}],
  InventoryHealth: "5 SKUs below reorder level\n2 products out of stock",
  PositiveChanges: "Shopify revenue surged 100% vs prev day\nMeta ROAS +11% vs prev day",
  RequiresReviews: "Monitor campaign performance and store funnel.", Url: "r/x", ScaleUrl: "r/x"
});
let html = tpl.html.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (m,k)=>{const t=k.trim();return t in params?String(params[t]||""):m;});
html = html.replace(/\\n/g, "\n");
const r = await renderHtmlToPdf(html);
console.log("OK:" + r.ok + " FILE:" + r.filePath + (r.error?(" ERR:"+r.error):""));
process.exit(0);
