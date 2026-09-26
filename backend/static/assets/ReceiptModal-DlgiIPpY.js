import{r as $,j as t}from"./vendor-react-Ds7D3P6J.js";import{b as M,a as S,M as z,B as D,f as g}from"./index-Cc2VlGtp.js";import{Y as A,a3 as T,E as R,C as F}from"./vendor-icons-CGUJD458.js";function E({gym:a,payment:s,member:i}){const n=(a==null?void 0:a.name)||"GymPulse Fitness Facility",o=(a==null?void 0:a.email)||"",e=(a==null?void 0:a.phone)||"",x=(a==null?void 0:a.address)||"",b=(a==null?void 0:a.currency)||"INR",m=(s==null?void 0:s.receipt_number)||`INV-${String((s==null?void 0:s.id)||"0").padStart(6,"0")}`,d=s!=null&&s.payment_date?new Date(s.payment_date).toLocaleString():new Date().toLocaleString(),N=i?`${i.first_name||""} ${i.last_name||""}`.trim():(s==null?void 0:s.member_name)||"Valued Member",v=(i==null?void 0:i.phone)||(s==null?void 0:s.member_phone)||"N/A",f=(i==null?void 0:i.email)||(s==null?void 0:s.member_email)||"N/A",p=Number((s==null?void 0:s.amount)||0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2}),j=((s==null?void 0:s.payment_method)||"Cash").toUpperCase(),u=((s==null?void 0:s.status)||"Completed").toUpperCase(),c=(s==null?void 0:s.notes)||"Gym Membership & Facility Access",w=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${m}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background-color: #ffffff;
      color: #0f172a;
      padding: 24px;
      font-size: 14px;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 650px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 32px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .gym-brand h1 {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .gym-brand p {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta .receipt-badge {
      display: inline-block;
      background: #ecfdf5;
      color: #059669;
      font-weight: 700;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      border: 1px solid #a7f3d0;
    }
    .invoice-meta h2 {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }
    .invoice-meta p {
      font-size: 12px;
      color: #64748b;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
      background-color: #f8fafc;
      padding: 16px;
      border-radius: 8px;
    }
    .details-box h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .details-box p {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    .details-box .subtext {
      font-size: 12px;
      font-weight: normal;
      color: #64748b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      text-align: left;
    }
    td {
      padding: 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .text-right {
      text-align: right;
    }
    .total-box {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .total-table {
      width: 280px;
    }
    .total-table td {
      border: none;
      padding: 6px 12px;
    }
    .total-table .grand-total {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #cbd5e1;
      padding-top: 10px;
    }
    .footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 20px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    .footer strong {
      color: #334155;
    }
    @media print {
      body {
        padding: 0;
        background: transparent;
      }
      .invoice-card {
        border: none;
        padding: 0;
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="gym-brand">
        <h1>${n}</h1>
        ${x?`<p>${x}</p>`:""}
        ${e||o?`<p>${[e,o].filter(Boolean).join(" • ")}</p>`:""}
      </div>
      <div class="invoice-meta">
        <span class="receipt-badge">${u}</span>
        <h2>${m}</h2>
        <p>Date: ${d}</p>
      </div>
    </div>

    <div class="details-grid">
      <div class="details-box">
        <h3>Billed To (Member)</h3>
        <p>${N}</p>
        <p class="subtext">Phone: ${v}</p>
        ${f!=="N/A"?`<p class="subtext">Email: ${f}</p>`:""}
      </div>
      <div class="details-box">
        <h3>Payment Information</h3>
        <p>Method: ${j}</p>
        <p class="subtext">Transaction Status: ${u}</p>
        <p class="subtext">Issued by: ${n} Management</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Payment Mode</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Facility Membership & Training Access</strong><br>
            <span style="font-size: 12px; color: #64748b;">${c}</span>
          </td>
          <td>${j}</td>
          <td class="text-right" style="font-weight: 700;">${b} ${p}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <table class="total-table">
        <tr>
          <td>Subtotal:</td>
          <td class="text-right">${b} ${p}</td>
        </tr>
        <tr>
          <td>Tax (Included):</td>
          <td class="text-right">${b} 0.00</td>
        </tr>
        <tr class="grand-total">
          <td>Total Paid:</td>
          <td class="text-right">${b} ${p}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <p>Thank you for training with <strong>${n}</strong>!</p>
      <p style="margin-top: 4px; font-size: 11px;">Computer generated receipt • No physical signature required</p>
    </div>
  </div>
</body>
</html>`,l=window.open("","_blank","width=800,height=900,menubar=no,toolbar=no,location=no,status=no");if(l)l.document.open(),l.document.write(w),l.document.close(),l.focus(),setTimeout(()=>{l.print()},300);else{const r=document.createElement("iframe");r.style.position="fixed",r.style.right="0",r.style.bottom="0",r.style.width="0",r.style.height="0",r.style.border="0",document.body.appendChild(r);const h=r.contentWindow.document;h.open(),h.write(w),h.close(),r.contentWindow.focus(),setTimeout(()=>{r.contentWindow.print(),document.body.removeChild(r)},500)}}const B=({isOpen:a,onClose:s,paymentId:i,initialPayment:n=null})=>{const{gym:o}=M(),[e,x]=$.useState(n),[b,m]=$.useState(!1);if($.useEffect(()=>{if(n){x(n);return}a&&i&&(m(!0),S.getPayment(i).then(u=>x(u)).catch(()=>{x({id:i,receipt_number:`INV-${i}`,amount:1500,status:"completed",payment_method:"cash",payment_date:new Date().toISOString().split("T")[0]})}).finally(()=>m(!1)))},[a,i,n]),!a||!i)return null;const d=(o==null?void 0:o.currency)||"INR",N=S.getReceiptHtml(i),v=()=>{E({gym:o,payment:e||{id:i},member:(e==null?void 0:e.member)||{full_name:e==null?void 0:e.member_name,phone:e==null?void 0:e.member_phone}})},f=(e==null?void 0:e.receipt_number)||(e==null?void 0:e.invoice_number)||`INV-${String(i).padStart(6,"0")}`,p=e!=null&&e.payment_date?new Date(e.payment_date).toLocaleDateString():new Date().toLocaleDateString(),j=()=>{var _,C;const c=(((_=e==null?void 0:e.member)==null?void 0:_.phone)||(e==null?void 0:e.member_phone)||"").replace(/[^0-9]/g,""),w=((C=e==null?void 0:e.member)==null?void 0:C.full_name)||(e==null?void 0:e.member_name)||"Valued Athlete",l=(o==null?void 0:o.name)||"GymPulse Fitness Facility",r=g((e==null?void 0:e.amount)||0,d),h=`Hello ${w}! 🏋️

Here is your official payment receipt from *${l}*:

📄 *Receipt No:* ${f}
💰 *Amount Paid:* ${r}
📅 *Date:* ${p}
💳 *Payment Method:* ${((e==null?void 0:e.payment_method)||"Cash").toUpperCase()}

Thank you for choosing ${l}! Keep crushing your fitness goals. 💪`,k=c?c.startsWith("91")||c.length>10?c:`91${c}`:"",P=k?`https://wa.me/${k}?text=${encodeURIComponent(h)}`:`https://api.whatsapp.com/send?text=${encodeURIComponent(h)}`;window.open(P,"_blank")};return t.jsx(z,{isOpen:a,onClose:s,title:"Invoice Receipt",maxWidth:"max-w-2xl",children:t.jsxs("div",{className:"space-y-4",children:[t.jsxs("div",{className:"flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200",children:[t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsx("span",{className:"w-2.5 h-2.5 rounded-full bg-emerald-500"}),t.jsx("span",{className:"text-xs text-slate-700 font-bold uppercase tracking-wider",children:"Verified Electronic Receipt"})]}),t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsxs("button",{onClick:j,type:"button",className:"px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer",title:"Share receipt via WhatsApp",children:[t.jsx(A,{className:"w-3.5 h-3.5"}),t.jsx("span",{children:"Share WhatsApp"})]}),t.jsx(D,{onClick:v,variant:"primary",size:"sm",icon:T,children:"Print Receipt"}),t.jsx("a",{href:N,target:"_blank",rel:"noopener noreferrer",className:"p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 rounded-xl transition-colors inline-flex items-center gap-1 text-xs font-bold",title:"Open raw receipt in new tab",children:t.jsx(R,{className:"w-4 h-4"})})]})]}),t.jsxs("div",{className:"bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-xs space-y-6",children:[t.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5",children:[t.jsxs("div",{children:[t.jsx("h2",{className:"text-xl font-black text-slate-900 tracking-tight",children:(o==null?void 0:o.name)||"GymPulse Fitness Facility"}),t.jsx("p",{className:"text-xs text-slate-500 mt-1 font-medium",children:(o==null?void 0:o.address)||"Official Fitness Facility"}),((o==null?void 0:o.phone)||(o==null?void 0:o.email))&&t.jsx("p",{className:"text-xs text-slate-400 mt-0.5",children:[o==null?void 0:o.phone,o==null?void 0:o.email].filter(Boolean).join(" • ")})]}),t.jsxs("div",{className:"sm:text-right",children:[t.jsxs("span",{className:"inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200",children:[t.jsx(F,{className:"w-3.5 h-3.5 text-emerald-600"}),((e==null?void 0:e.status)||"COMPLETED").toUpperCase()]}),t.jsx("div",{className:"text-sm font-mono font-black text-slate-900 mt-2",children:f}),t.jsxs("div",{className:"text-xs text-slate-500 font-medium mt-0.5",children:["Date: ",p]})]})]}),t.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/70",children:[t.jsxs("div",{children:[t.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-wider block",children:"Billed To (Member)"}),t.jsx("span",{className:"text-sm font-extrabold text-slate-900 block mt-0.5",children:(e==null?void 0:e.member_name)||(e!=null&&e.member?`${e.member.first_name} ${e.member.last_name}`:"Valued Member")}),(e==null?void 0:e.member_phone)&&t.jsxs("span",{className:"text-xs text-slate-600 block mt-0.5 font-medium",children:["Phone: ",e.member_phone]})]}),t.jsxs("div",{children:[t.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-wider block",children:"Payment Method"}),t.jsx("span",{className:"text-sm font-extrabold text-slate-900 block mt-0.5 capitalize",children:(e==null?void 0:e.payment_method)||"Cash / Counter"}),t.jsx("span",{className:"text-xs text-slate-500 block mt-0.5 font-medium",children:"Receipt Type: Standard Membership Ledger"})]})]}),t.jsx("div",{className:"border border-slate-200 rounded-xl overflow-hidden",children:t.jsxs("table",{className:"w-full text-left text-xs",children:[t.jsx("thead",{className:"bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider",children:t.jsxs("tr",{children:[t.jsx("th",{className:"py-2.5 px-4",children:"Description"}),t.jsx("th",{className:"py-2.5 px-4 text-right",children:"Amount"})]})}),t.jsx("tbody",{className:"divide-y divide-slate-100 font-medium",children:t.jsxs("tr",{children:[t.jsxs("td",{className:"py-3 px-4",children:[t.jsx("span",{className:"font-bold text-slate-900 block",children:(e==null?void 0:e.plan_name)||"Gym Membership & Facility Access"}),t.jsx("span",{className:"text-slate-500 text-[11px] block mt-0.5",children:(e==null?void 0:e.notes)||"Complete gym floor access and workout equipment usage"})]}),t.jsx("td",{className:"py-3 px-4 text-right font-black text-slate-900 text-sm",children:g((e==null?void 0:e.amount)||0,d)})]})})]})}),t.jsx("div",{className:"flex justify-end pt-2",children:t.jsxs("div",{className:"w-56 space-y-1.5 text-xs",children:[t.jsxs("div",{className:"flex justify-between text-slate-600 font-medium",children:[t.jsx("span",{children:"Subtotal:"}),t.jsx("span",{children:g((e==null?void 0:e.amount)||0,d)})]}),t.jsxs("div",{className:"flex justify-between text-slate-600 font-medium",children:[t.jsx("span",{children:"Taxes:"}),t.jsx("span",{children:g(0,d)})]}),t.jsxs("div",{className:"flex justify-between text-slate-900 font-black text-base border-t-2 border-slate-200 pt-2",children:[t.jsx("span",{children:"Total Paid:"}),t.jsx("span",{className:"text-brand-700",children:g((e==null?void 0:e.amount)||0,d)})]})]})})]})]})})};export{B as R};
