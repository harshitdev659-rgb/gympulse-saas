import{r as v,j as t}from"./vendor-react-Ds7D3P6J.js";import{b as _,a as $,M as S,B as z,f as m}from"./index-BNnd_3Ks.js";import{a2 as C,E as D,C as M}from"./vendor-icons-DKFQgAtj.js";function T({gym:i,payment:s,member:a}){const l=(i==null?void 0:i.name)||"GymPulse Fitness Facility",o=(i==null?void 0:i.email)||"",e=(i==null?void 0:i.phone)||"",d=(i==null?void 0:i.address)||"",x=(i==null?void 0:i.currency)||"INR",p=(s==null?void 0:s.receipt_number)||`INV-${String((s==null?void 0:s.id)||"0").padStart(6,"0")}`,n=s!=null&&s.payment_date?new Date(s.payment_date).toLocaleString():new Date().toLocaleString(),u=a?`${a.first_name||""} ${a.last_name||""}`.trim():(s==null?void 0:s.member_name)||"Valued Member",g=(a==null?void 0:a.phone)||(s==null?void 0:s.member_phone)||"N/A",b=(a==null?void 0:a.email)||(s==null?void 0:s.member_email)||"N/A",h=Number((s==null?void 0:s.amount)||0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2}),f=((s==null?void 0:s.payment_method)||"Cash").toUpperCase(),N=((s==null?void 0:s.status)||"Completed").toUpperCase(),k=(s==null?void 0:s.notes)||"Gym Membership & Facility Access",w=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${p}</title>
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
        <h1>${l}</h1>
        ${d?`<p>${d}</p>`:""}
        ${e||o?`<p>${[e,o].filter(Boolean).join(" • ")}</p>`:""}
      </div>
      <div class="invoice-meta">
        <span class="receipt-badge">${N}</span>
        <h2>${p}</h2>
        <p>Date: ${n}</p>
      </div>
    </div>

    <div class="details-grid">
      <div class="details-box">
        <h3>Billed To (Member)</h3>
        <p>${u}</p>
        <p class="subtext">Phone: ${g}</p>
        ${b!=="N/A"?`<p class="subtext">Email: ${b}</p>`:""}
      </div>
      <div class="details-box">
        <h3>Payment Information</h3>
        <p>Method: ${f}</p>
        <p class="subtext">Transaction Status: ${N}</p>
        <p class="subtext">Issued by: ${l} Management</p>
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
            <span style="font-size: 12px; color: #64748b;">${k}</span>
          </td>
          <td>${f}</td>
          <td class="text-right" style="font-weight: 700;">${x} ${h}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <table class="total-table">
        <tr>
          <td>Subtotal:</td>
          <td class="text-right">${x} ${h}</td>
        </tr>
        <tr>
          <td>Tax (Included):</td>
          <td class="text-right">${x} 0.00</td>
        </tr>
        <tr class="grand-total">
          <td>Total Paid:</td>
          <td class="text-right">${x} ${h}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <p>Thank you for training with <strong>${l}</strong>!</p>
      <p style="margin-top: 4px; font-size: 11px;">Computer generated receipt • No physical signature required</p>
    </div>
  </div>
</body>
</html>`,c=window.open("","_blank","width=800,height=900,menubar=no,toolbar=no,location=no,status=no");if(c)c.document.open(),c.document.write(w),c.document.close(),c.focus(),setTimeout(()=>{c.print()},300);else{const r=document.createElement("iframe");r.style.position="fixed",r.style.right="0",r.style.bottom="0",r.style.width="0",r.style.height="0",r.style.border="0",document.body.appendChild(r);const j=r.contentWindow.document;j.open(),j.write(w),j.close(),r.contentWindow.focus(),setTimeout(()=>{r.contentWindow.print(),document.body.removeChild(r)},500)}}const R=({isOpen:i,onClose:s,paymentId:a,initialPayment:l=null})=>{const{gym:o}=_(),[e,d]=v.useState(l),[x,p]=v.useState(!1);if(v.useEffect(()=>{if(l){d(l);return}i&&a&&(p(!0),$.getPayment(a).then(f=>d(f)).catch(()=>{d({id:a,receipt_number:`INV-${a}`,amount:1500,status:"completed",payment_method:"cash",payment_date:new Date().toISOString().split("T")[0]})}).finally(()=>p(!1)))},[i,a,l]),!i||!a)return null;const n=(o==null?void 0:o.currency)||"INR",u=$.getReceiptHtml(a),g=()=>{T({gym:o,payment:e||{id:a},member:(e==null?void 0:e.member)||{full_name:e==null?void 0:e.member_name,phone:e==null?void 0:e.member_phone}})},b=(e==null?void 0:e.receipt_number)||(e==null?void 0:e.invoice_number)||`INV-${String(a).padStart(6,"0")}`,h=e!=null&&e.payment_date?new Date(e.payment_date).toLocaleDateString():new Date().toLocaleDateString();return t.jsx(S,{isOpen:i,onClose:s,title:"Invoice Receipt",maxWidth:"max-w-2xl",children:t.jsxs("div",{className:"space-y-4",children:[t.jsxs("div",{className:"flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200",children:[t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsx("span",{className:"w-2.5 h-2.5 rounded-full bg-emerald-500"}),t.jsx("span",{className:"text-xs text-slate-700 font-bold uppercase tracking-wider",children:"Verified Electronic Receipt"})]}),t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsx(z,{onClick:g,variant:"primary",size:"sm",icon:C,children:"Print Receipt"}),t.jsx("a",{href:u,target:"_blank",rel:"noopener noreferrer",className:"p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 rounded-xl transition-colors inline-flex items-center gap-1 text-xs font-bold",title:"Open raw receipt in new tab",children:t.jsx(D,{className:"w-4 h-4"})})]})]}),t.jsxs("div",{className:"bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-xs space-y-6",children:[t.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5",children:[t.jsxs("div",{children:[t.jsx("h2",{className:"text-xl font-black text-slate-900 tracking-tight",children:(o==null?void 0:o.name)||"GymPulse Fitness Facility"}),t.jsx("p",{className:"text-xs text-slate-500 mt-1 font-medium",children:(o==null?void 0:o.address)||"Official Fitness Facility"}),((o==null?void 0:o.phone)||(o==null?void 0:o.email))&&t.jsx("p",{className:"text-xs text-slate-400 mt-0.5",children:[o==null?void 0:o.phone,o==null?void 0:o.email].filter(Boolean).join(" • ")})]}),t.jsxs("div",{className:"sm:text-right",children:[t.jsxs("span",{className:"inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200",children:[t.jsx(M,{className:"w-3.5 h-3.5 text-emerald-600"}),((e==null?void 0:e.status)||"COMPLETED").toUpperCase()]}),t.jsx("div",{className:"text-sm font-mono font-black text-slate-900 mt-2",children:b}),t.jsxs("div",{className:"text-xs text-slate-500 font-medium mt-0.5",children:["Date: ",h]})]})]}),t.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/70",children:[t.jsxs("div",{children:[t.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-wider block",children:"Billed To (Member)"}),t.jsx("span",{className:"text-sm font-extrabold text-slate-900 block mt-0.5",children:(e==null?void 0:e.member_name)||(e!=null&&e.member?`${e.member.first_name} ${e.member.last_name}`:"Valued Member")}),(e==null?void 0:e.member_phone)&&t.jsxs("span",{className:"text-xs text-slate-600 block mt-0.5 font-medium",children:["Phone: ",e.member_phone]})]}),t.jsxs("div",{children:[t.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-wider block",children:"Payment Method"}),t.jsx("span",{className:"text-sm font-extrabold text-slate-900 block mt-0.5 capitalize",children:(e==null?void 0:e.payment_method)||"Cash / Counter"}),t.jsx("span",{className:"text-xs text-slate-500 block mt-0.5 font-medium",children:"Receipt Type: Standard Membership Ledger"})]})]}),t.jsx("div",{className:"border border-slate-200 rounded-xl overflow-hidden",children:t.jsxs("table",{className:"w-full text-left text-xs",children:[t.jsx("thead",{className:"bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider",children:t.jsxs("tr",{children:[t.jsx("th",{className:"py-2.5 px-4",children:"Description"}),t.jsx("th",{className:"py-2.5 px-4 text-right",children:"Amount"})]})}),t.jsx("tbody",{className:"divide-y divide-slate-100 font-medium",children:t.jsxs("tr",{children:[t.jsxs("td",{className:"py-3 px-4",children:[t.jsx("span",{className:"font-bold text-slate-900 block",children:(e==null?void 0:e.plan_name)||"Gym Membership & Facility Access"}),t.jsx("span",{className:"text-slate-500 text-[11px] block mt-0.5",children:(e==null?void 0:e.notes)||"Complete gym floor access and workout equipment usage"})]}),t.jsx("td",{className:"py-3 px-4 text-right font-black text-slate-900 text-sm",children:m((e==null?void 0:e.amount)||0,n)})]})})]})}),t.jsx("div",{className:"flex justify-end pt-2",children:t.jsxs("div",{className:"w-56 space-y-1.5 text-xs",children:[t.jsxs("div",{className:"flex justify-between text-slate-600 font-medium",children:[t.jsx("span",{children:"Subtotal:"}),t.jsx("span",{children:m((e==null?void 0:e.amount)||0,n)})]}),t.jsxs("div",{className:"flex justify-between text-slate-600 font-medium",children:[t.jsx("span",{children:"Taxes:"}),t.jsx("span",{children:m(0,n)})]}),t.jsxs("div",{className:"flex justify-between text-slate-900 font-black text-base border-t-2 border-slate-200 pt-2",children:[t.jsx("span",{children:"Total Paid:"}),t.jsx("span",{className:"text-brand-700",children:m((e==null?void 0:e.amount)||0,n)})]})]})})]})]})})};export{R};
