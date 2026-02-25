import { useState, useRef, useEffect } from "react";

// ============================================================
// 🔑 PASTE YOUR ANTHROPIC API KEY BELOW (between the quotes)
// Get it free at: https://console.anthropic.com
// ============================================================
const ANTHROPIC_API_KEY = "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";
// ============================================================

const SYSTEM_PROMPT = `You are an expert Pabbly Connect automation specialist. You help users build workflows for ANY of the 2000+ apps supported by Pabbly Connect.

When a user describes an automation, respond with ONLY a valid JSON object — no markdown, no backticks, no explanation outside the JSON:

{
  "summary": "One line describing what this workflow does",
  "workflow_name": "Short descriptive name",
  "trigger_app": "Name of the app that starts the workflow",
  "estimated_setup_minutes": 15,
  "difficulty": "Easy",
  "steps": [
    {
      "step_number": 1,
      "type": "trigger",
      "app": "App Name",
      "event": "Event Name",
      "description": "What this trigger does.",
      "setup_notes": "In Pabbly Connect: 1) Click Create Workflow 2) Search for this app 3) Select event 4) Connect your account",
      "fields": ["Field 1: description", "Field 2: description"]
    },
    {
      "step_number": 2,
      "type": "action",
      "app": "App Name",
      "event": "Action Name",
      "description": "What this action does.",
      "setup_notes": "In Pabbly Connect: 1) Click + to add action 2) Search app 3) Map fields from previous step",
      "fields": ["Field 1: map from trigger", "Field 2: value"]
    }
  ],
  "pabbly_tips": ["Tip 1", "Tip 2", "Tip 3"]
}

Rules:
- Support ANY app (Vapi, WhatsApp, FB Messenger, Gmail, Notion, Airtable, OpenAI, etc.)
- Always exactly 1 trigger step, rest are actions or conditions
- setup_notes must be detailed beginner-friendly Pabbly Connect instructions
- Return ONLY the JSON object, absolutely nothing else`;

function getEmoji(appName = "") {
  const a = appName.toLowerCase();
  if (a.includes("gmail") || a.includes("email")) return "📧";
  if (a.includes("sheet")) return "📊";
  if (a.includes("woocommerce")) return "🛍️";
  if (a.includes("messenger")) return "💬";
  if (a.includes("facebook") || a.includes("fb")) return "📣";
  if (a.includes("whatsapp") || a.includes("wati")) return "💬";
  if (a.includes("telegram")) return "📱";
  if (a.includes("razorpay")) return "⚡";
  if (a.includes("airtable")) return "📋";
  if (a.includes("notion")) return "🗂️";
  if (a.includes("twilio") || a.includes("sms")) return "📞";
  if (a.includes("shopify")) return "🛒";
  if (a.includes("stripe")) return "💳";
  if (a.includes("slack")) return "🔔";
  if (a.includes("hubspot")) return "💼";
  if (a.includes("mailchimp")) return "🎯";
  if (a.includes("typeform") || a.includes("form")) return "📝";
  if (a.includes("calendly")) return "📅";
  if (a.includes("drive")) return "📁";
  if (a.includes("vapi") || a.includes("voice")) return "🎙️";
  if (a.includes("openai") || a.includes("gpt") || a.includes("ai")) return "🤖";
  if (a.includes("discord")) return "📢";
  if (a.includes("zoom")) return "🎥";
  if (a.includes("paypal")) return "💰";
  if (a.includes("formatter") || a.includes("filter")) return "🔧";
  if (a.includes("delay") || a.includes("wait")) return "⏰";
  if (a.includes("google")) return "🔷";
  return "⚙️";
}

const SUGGESTIONS = [
  { icon: "🛒", title: "WooCommerce → Sheets + WhatsApp", desc: "Track orders, notify customers", prompt: "When a new order is placed on WooCommerce, add customer details to Google Sheets and send a WhatsApp confirmation to the customer" },
  { icon: "📣", title: "FB Leads → Gmail + HubSpot", desc: "Capture leads, follow up instantly", prompt: "When a Facebook Lead Ad form is submitted, add the lead to Google Sheets, send a welcome email via Gmail, and add as contact in HubSpot CRM" },
  { icon: "💰", title: "Razorpay → SMS + Sheets", desc: "Automate payment confirmations", prompt: "When a payment is received on Razorpay, send a thank you SMS via Twilio and add payment details to Google Sheets" },
  { icon: "💬", title: "FB Messenger → Vapi Reply", desc: "AI-powered message responses", prompt: "When a message comes in on Facebook Messenger, use Vapi to generate a response and send it back via Facebook Messenger" },
];

const POPULAR_APPS = ["Gmail","Google Sheets","WooCommerce","FB Leads","WhatsApp","Telegram","Razorpay","Airtable","Notion","Twilio","Shopify","Calendly","HubSpot","Typeform","Mailchimp","Slack","Stripe","Vapi","OpenAI","Discord","Zoom","Shiprocket","Zoho CRM","Jotform"];

export default function PabblyCopilot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [recent, setRecent] = useState([]);
  const [copied, setCopied] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(ANTHROPIC_API_KEY === "YOUR_API_KEY_HERE");
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  async function sendMessage(text) {
    if (apiKeyMissing) { alert("Please add your Anthropic API key in src/App.js first!"); return; }
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", content: msg, display: msg };
    const newHistory = [...history, { role: "user", content: msg }];
    setMessages(prev => [...prev, userMsg]);
    setHistory(newHistory);
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-calls": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newHistory,
        }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawText = data.content.filter(b => b.type === "text").map(b => b.text).join("");
      const clean = rawText.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```\s*$/i,"").trim();
      const s = clean.indexOf("{"), e2 = clean.lastIndexOf("}");
      if (s === -1) throw new Error("No JSON returned");
      const wf = JSON.parse(clean.slice(s, e2 + 1));

      setStats({
        steps: wf.steps.length,
        trigger: wf.trigger_app || wf.steps[0]?.app,
        actions: wf.steps.filter(s => s.type === "action").length,
        setup: (wf.estimated_setup_minutes || 15) + " min",
        diff: wf.difficulty || "Medium",
      });
      setRecent(prev => [wf.workflow_name, ...prev.filter(r => r !== wf.workflow_name)].slice(0, 4));
      setHistory(h => [...h, { role: "assistant", content: JSON.stringify(wf) }].slice(-12));
      setMessages(prev => [...prev, { role: "assistant", workflow: wf }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", error: err.message || "Unknown error" }]);
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadWorkflow(wf) {
    let t = `PABBLY CONNECT WORKFLOW\n${"=".repeat(40)}\nName: ${wf.workflow_name}\nSummary: ${wf.summary}\nSetup: ~${wf.estimated_setup_minutes}min | ${wf.difficulty}\n\nSTEPS:\n`;
    wf.steps.forEach((s, i) => {
      t += `\n${i+1}. [${s.type.toUpperCase()}] ${s.app} — ${s.event}\n${s.description}\nSetup: ${s.setup_notes}\n`;
      if (s.fields?.length) t += `Fields: ${s.fields.join(", ")}\n`;
    });
    if (wf.pabbly_tips?.length) { t += `\nTIPS:\n`; wf.pabbly_tips.forEach(tip => t += `• ${tip}\n`); }
    const blob = new Blob([t], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${wf.workflow_name.replace(/\s+/g,"_")}_pabbly.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  const showHero = messages.length === 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#0a0d14", color:"#e8eaf6", fontFamily:"'Segoe UI',system-ui,sans-serif", overflow:"hidden" }}>

      {/* API KEY WARNING BANNER */}
      {apiKeyMissing && (
        <div style={{ background:"linear-gradient(135deg,rgba(245,158,11,0.15),rgba(239,68,68,0.1))", border:"1px solid rgba(245,158,11,0.4)", padding:"10px 20px", fontSize:"0.82rem", color:"#fcd34d", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          ⚠️ <strong>API Key Missing!</strong> Open <code style={{background:"rgba(255,255,255,0.1)",padding:"1px 6px",borderRadius:4}}>src/App.js</code> and replace <code style={{background:"rgba(255,255,255,0.1)",padding:"1px 6px",borderRadius:4}}>YOUR_API_KEY_HERE</code> with your key from <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{color:"#60a5fa"}}>console.anthropic.com</a> (free to get!)
        </div>
      )}

      {/* HEADER */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderBottom:"1px solid #1e2740", background:"rgba(10,13,20,0.95)", backdropFilter:"blur(10px)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, background:"linear-gradient(135deg,#4f6ef7,#7c3aed)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
          <span style={{ fontWeight:800, fontSize:"1.1rem" }}>Pabbly Copilot</span>
          <span style={{ background:"linear-gradient(135deg,#4f6ef7,#7c3aed)", color:"#fff", fontSize:"0.6rem", padding:"2px 7px", borderRadius:20, fontWeight:700, letterSpacing:"0.05em" }}>AI POWERED</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {messages.length > 0 && <button onClick={() => { setMessages([]); setHistory([]); setStats(null); }} style={{ padding:"6px 14px", borderRadius:7, background:"transparent", color:"#6b7a9e", border:"1px solid #1e2740", cursor:"pointer", fontSize:"0.78rem" }}>🗑️ Clear</button>}
          <a href="https://connect.pabbly.com" target="_blank" rel="noreferrer" style={{ padding:"6px 14px", borderRadius:7, background:"linear-gradient(135deg,#4f6ef7,#7c3aed)", color:"#fff", border:"none", cursor:"pointer", fontSize:"0.78rem", textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>🚀 Open Pabbly</a>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        {/* SIDEBAR */}
        <div style={{ width:220, borderRight:"1px solid #1e2740", padding:"14px 0", overflowY:"auto", flexShrink:0 }}>
          <div style={{ padding:"0 12px 6px", fontSize:"0.6rem", fontWeight:700, color:"#6b7a9e", letterSpacing:"0.1em", textTransform:"uppercase" }}>Quick Triggers</div>
          {[["🛍️","WooCommerce Order","new order placed on WooCommerce"],["📣","Facebook Lead","new Facebook Lead Ad submitted"],["⚡","Razorpay Payment","payment received on Razorpay"],["📊","Google Sheets Row","new row added to Google Sheets"],["📝","Typeform Submit","new Typeform form submitted"],["📅","Calendly Booking","new appointment booked on Calendly"],["💳","Stripe Payment","payment received on Stripe"],["📧","Gmail Received","new email received in Gmail"]].map(([ico,label,prompt]) => (
            <div key={label} onClick={() => sendMessage(`When ${prompt}, build me a complete Pabbly workflow`)} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px", cursor:"pointer", fontSize:"0.78rem", color:"#6b7a9e" }} onMouseEnter={e => { e.currentTarget.style.background="#161c2d"; e.currentTarget.style.color="#e8eaf6"; }} onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#6b7a9e"; }}>
              <span>{ico}</span><span>{label}</span>
            </div>
          ))}
          <div style={{ height:1, background:"#1e2740", margin:"8px 12px" }} />
          <div style={{ padding:"0 12px 6px", fontSize:"0.6rem", fontWeight:700, color:"#6b7a9e", letterSpacing:"0.1em", textTransform:"uppercase" }}>Quick Actions</div>
          {[["💬","Send WhatsApp"],["📧","Send Gmail"],["📊","Add to Sheets"],["📱","Send Telegram"],["📞","Twilio SMS"],["🔔","Slack Message"],["🤖","OpenAI Process"],["🗂️","Notion Page"]].map(([ico,label]) => (
            <div key={label} onClick={() => { setInput(prev => prev + (prev ? " and " : "") + label.toLowerCase()); inputRef.current?.focus(); }} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px", cursor:"pointer", fontSize:"0.78rem", color:"#6b7a9e" }} onMouseEnter={e => { e.currentTarget.style.background="#161c2d"; e.currentTarget.style.color="#e8eaf6"; }} onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#6b7a9e"; }}>
              <span>{ico}</span><span>{label}</span>
            </div>
          ))}
          {recent.length > 0 && <>
            <div style={{ height:1, background:"#1e2740", margin:"8px 12px" }} />
            <div style={{ padding:"0 12px 6px", fontSize:"0.6rem", fontWeight:700, color:"#6b7a9e", letterSpacing:"0.1em", textTransform:"uppercase" }}>Recent</div>
            {recent.map(r => (
              <div key={r} style={{ display:"flex", alignItems:"flex-start", gap:6, padding:"6px 14px", fontSize:"0.75rem", color:"#6b7a9e" }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:"#4f6ef7", marginTop:5, flexShrink:0, display:"block" }} /><span>{r}</span>
              </div>
            ))}
          </>}
        </div>

        {/* MAIN CHAT */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>
            {showHero && (
              <div style={{ textAlign:"center", padding:"20px 16px 10px" }}>
                <div style={{ fontSize:"1.9rem", fontWeight:800, lineHeight:1.2, marginBottom:10, background:"linear-gradient(135deg,#e8eaf6,#4f6ef7,#7c3aed)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                  Build Any Pabbly Workflow<br />with Plain English
                </div>
                <div style={{ color:"#6b7a9e", fontSize:"0.88rem", marginBottom:20 }}>Supports all 2000+ Pabbly Connect apps. Describe your automation and get the full workflow instantly.</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, maxWidth:580, margin:"0 auto" }}>
                  {SUGGESTIONS.map(s => (
                    <div key={s.title} onClick={() => sendMessage(s.prompt)} style={{ background:"#111520", border:"1px solid #1e2740", borderRadius:12, padding:"13px 15px", cursor:"pointer", textAlign:"left", transition:"all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor="#4f6ef7"; e.currentTarget.style.background="#161c2d"; }} onMouseLeave={e => { e.currentTarget.style.borderColor="#1e2740"; e.currentTarget.style.background="#111520"; }}>
                      <div style={{ fontSize:"1.2rem", marginBottom:5 }}>{s.icon}</div>
                      <div style={{ fontSize:"0.82rem", fontWeight:600, color:"#e8eaf6", marginBottom:2 }}>{s.title}</div>
                      <div style={{ fontSize:"0.72rem", color:"#6b7a9e" }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              if (msg.role === "user") return (
                <div key={i} style={{ display:"flex", flexDirection:"row-reverse", gap:10 }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background:"#161c2d", border:"1px solid #1e2740", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>👤</div>
                  <div style={{ maxWidth:"75%", background:"linear-gradient(135deg,rgba(79,110,247,0.15),rgba(124,58,237,0.1))", border:"1px solid rgba(79,110,247,0.3)", borderRadius:14, padding:"12px 15px", fontSize:"0.86rem", lineHeight:1.6 }}>{msg.display}</div>
                </div>
              );
              if (msg.error) return (
                <div key={i} style={{ display:"flex", gap:10 }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#4f6ef7,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>⚡</div>
                  <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:12, padding:"13px 16px", fontSize:"0.84rem", color:"#fca5a5", maxWidth:"75%" }}>
                    <strong>⚠️ {msg.error}</strong><br /><br />Try: <em>"When [App A] gets [event], then [App B] does [action]"</em>
                  </div>
                </div>
              );
              if (msg.workflow) {
                const wf = msg.workflow;
                return (
                  <div key={i} style={{ display:"flex", gap:10 }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#4f6ef7,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>⚡</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ background:"#111520", border:"1px solid #1e2740", borderRadius:12, padding:"11px 14px", fontSize:"0.84rem", marginBottom:10 }}>
                        ✅ <strong>{wf.workflow_name}</strong> — {wf.steps.length} steps · ~{wf.estimated_setup_minutes}min · <span style={{ color:"#f59e0b" }}>{wf.difficulty}</span>
                      </div>
                      <div style={{ background:"#111520", border:"1px solid #1e2740", borderRadius:14, overflow:"hidden" }}>
                        <div style={{ padding:"12px 16px", borderBottom:"1px solid #1e2740", display:"flex", alignItems:"center", justifyContent:"space-between", background:"linear-gradient(135deg,rgba(79,110,247,0.06),rgba(124,58,237,0.04))" }}>
                          <div>
                            <div style={{ fontWeight:700, fontSize:"0.9rem" }}>⚡ {wf.workflow_name}</div>
                            <div style={{ fontSize:"0.72rem", color:"#6b7a9e", marginTop:2 }}>{wf.summary}</div>
                          </div>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={() => copyText(JSON.stringify(wf, null, 2))} style={{ padding:"4px 10px", borderRadius:6, background:"#161c2d", color:"#6b7a9e", border:"1px solid #1e2740", cursor:"pointer", fontSize:"0.7rem" }}>📋 Copy</button>
                            <button onClick={() => downloadWorkflow(wf)} style={{ padding:"4px 10px", borderRadius:6, background:"linear-gradient(135deg,#4f6ef7,#7c3aed)", color:"#fff", border:"none", cursor:"pointer", fontSize:"0.7rem" }}>⬇️ Export</button>
                          </div>
                        </div>
                        <div style={{ padding:14 }}>
                          {wf.steps.map((step, si) => {
                            const typeColor = step.type==="trigger" ? "#10b981" : step.type==="condition" ? "#f59e0b" : "#4f6ef7";
                            const typeBg = step.type==="trigger" ? "rgba(16,185,129,0.12)" : step.type==="condition" ? "rgba(245,158,11,0.12)" : "rgba(79,110,247,0.1)";
                            return (
                              <div key={si} style={{ display:"flex", gap:11, background:"#0a0d14", border:"1px solid #1e2740", borderRadius:10, padding:12, marginBottom:si<wf.steps.length-1?8:0, position:"relative" }}>
                                {si<wf.steps.length-1 && <div style={{ position:"absolute", left:24, top:"100%", width:2, height:8, background:"linear-gradient(#4f6ef7,transparent)", zIndex:1 }} />}
                                <div style={{ width:28, height:28, borderRadius:7, background:typeBg, color:typeColor, border:`1px solid ${typeColor}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:700, flexShrink:0 }}>
                                  {step.type==="trigger" ? "▶" : step.step_number}
                                </div>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:"0.67rem", color:"#6b7a9e", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:2 }}>
                                    {getEmoji(step.app)} {step.app}
                                    <span style={{ background:typeBg, color:typeColor, fontSize:"0.6rem", padding:"1px 6px", borderRadius:10, marginLeft:5, fontWeight:600 }}>{step.type}</span>
                                  </div>
                                  <div style={{ fontWeight:600, fontSize:"0.85rem", marginBottom:3 }}>{step.event}</div>
                                  <div style={{ fontSize:"0.76rem", color:"#9ca3c9", lineHeight:1.4 }}>{step.description}</div>
                                  {step.setup_notes && <div style={{ fontSize:"0.73rem", color:"#7c8db5", fontStyle:"italic", marginTop:5, lineHeight:1.4 }}>🛠️ {step.setup_notes}</div>}
                                  {step.fields?.length>0 && <div style={{ fontSize:"0.72rem", color:"#6b7a9e", marginTop:5 }}><span style={{color:"#4f6ef7"}}>📌 </span>{step.fields.join(" · ")}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {wf.pabbly_tips?.length>0 && (
                          <div style={{ padding:"10px 14px", borderTop:"1px solid #1e2740" }}>
                            <div style={{ fontSize:"0.68rem", color:"#6b7a9e", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>💡 Setup Tips</div>
                            {wf.pabbly_tips.map((t,ti) => <div key={ti} style={{ fontSize:"0.74rem", color:"#6b7a9e", marginBottom:3 }}>• {t}</div>)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}

            {loading && (
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#4f6ef7,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>⚡</div>
                <div style={{ display:"flex", alignItems:"center", gap:8, color:"#6b7a9e", fontSize:"0.82rem" }}>
                  <div style={{ display:"flex", gap:4 }}>
                    {[0,1,2].map(j => <span key={j} style={{ width:7, height:7, borderRadius:"50%", background:"#4f6ef7", display:"inline-block", animation:`bounce 1.2s ${j*0.2}s infinite` }} />)}
                  </div>
                  Building your Pabbly workflow...
                </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div style={{ padding:"12px 24px 16px", borderTop:"1px solid #1e2740", background:"rgba(10,13,20,0.9)", flexShrink:0 }}>
            <div style={{ background:"#111520", border:"1px solid #1e2740", borderRadius:12, overflow:"hidden" }}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder="Describe your automation... e.g. 'WooCommerce order → WhatsApp + Sheets' or 'FB Messenger → Vapi response'"
                rows={2} style={{ width:"100%", padding:"13px 15px", background:"transparent", border:"none", outline:"none", color:"#e8eaf6", fontFamily:"inherit", fontSize:"0.88rem", resize:"none", lineHeight:1.5 }} />
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px 8px" }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {["🛒 Orders","📣 Leads","💰 Payments","📅 Bookings"].map(chip => (
                    <span key={chip} onClick={() => { setInput(chip.split(" ").slice(1).join(" ") + " automation → "); inputRef.current?.focus(); }} style={{ fontSize:"0.69rem", color:"#6b7a9e", background:"#0a0d14", border:"1px solid #1e2740", padding:"3px 9px", borderRadius:20, cursor:"pointer" }}>{chip}</span>
                  ))}
                </div>
                <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#4f6ef7,#7c3aed)", border:"none", color:"#fff", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", opacity:loading||!input.trim()?0.4:1, flexShrink:0 }}>➤</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ width:220, borderLeft:"1px solid #1e2740", padding:"14px 12px", overflowY:"auto", flexShrink:0 }}>
          <div style={{ fontWeight:700, fontSize:"0.8rem", marginBottom:10 }}>📊 Stats</div>
          <div style={{ background:"#111520", border:"1px solid #1e2740", borderRadius:10, padding:12, marginBottom:12 }}>
            {[["Steps",stats?.steps||"—"],["Trigger",stats?.trigger||"—"],["Actions",stats?.actions||"—"],["Setup",stats?.setup||"—"],["Level",stats?.diff||"—"]].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #1e2740", fontSize:"0.74rem" }}>
                <span style={{color:"#6b7a9e"}}>{k}</span><span style={{color:"#4f6ef7",fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ fontWeight:700, fontSize:"0.8rem", marginBottom:8 }}>⚡ Popular Apps</div>
          <div style={{ display:"flex", flexWrap:"wrap" }}>
            {POPULAR_APPS.map(app => (
              <span key={app} onClick={() => { setInput(prev => prev ? prev+" and "+app : app+" → "); inputRef.current?.focus(); }} style={{ display:"inline-flex", alignItems:"center", background:"#161c2d", border:"1px solid #1e2740", borderRadius:20, padding:"2px 8px", margin:2, fontSize:"0.67rem", color:"#6b7a9e", cursor:"pointer" }}>{getEmoji(app)} {app}</span>
            ))}
          </div>
          <div style={{ background:"#111520", border:"1px solid #1e2740", borderRadius:10, padding:11, marginTop:10 }}>
            <div style={{ fontSize:"0.73rem", fontWeight:600, marginBottom:5 }}>💡 Tips</div>
            <div style={{ fontSize:"0.69rem", color:"#6b7a9e", lineHeight:1.7 }}>✅ Name exact apps<br/>✅ Describe trigger<br/>✅ List all actions<br/>✅ Add conditions<br/>✅ Any 2000+ app works</div>
          </div>
        </div>
      </div>

      {copied && <div style={{ position:"fixed", bottom:24, right:24, background:"#10b981", color:"#fff", padding:"9px 16px", borderRadius:9, fontSize:"0.83rem", zIndex:999 }}>✓ Copied!</div>}
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.5);opacity:0.3}40%{transform:scale(1);opacity:1}} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:#0a0d14} ::-webkit-scrollbar-thumb{background:#1e2740;border-radius:4px}`}</style>
    </div>
  );
}
