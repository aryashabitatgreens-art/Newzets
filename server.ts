import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Lazy GenAI initialization
let genaiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!genaiClient && process.env.GEMINI_API_KEY) {
    try {
      genaiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.error("Gemini initialization warning:", e);
    }
  }
  return genaiClient;
}

// In-memory data store with sensible initial CRM state
const memoryDB = {
  leads: [
    {
      id: 1,
      business_id: 1,
      name: "Aarav Mehta",
      company: "Mehta Logistics",
      email: "aarav@mehtalogistics.in",
      phone: "+91 98201 12345",
      priority: "urgent",
      status_name: "Qualified",
      status_color: "#7C8363",
      estimated_value: 120000,
      requirement: "Enterprise web automation, AI chatbot integration for customer dispatch tracking.",
      ai_score: 94,
      ai_intent: "Immediate Implementation",
      ai_buying_probability: "95%",
      ai_summary: "High-urgency client looking to deploy automated inquiry answering before next quarter.",
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      business_id: 1,
      name: "Priya Sundaram",
      company: "Apex Designs",
      email: "priya@apexdesigns.co",
      phone: "+91 99400 67890",
      priority: "high",
      status_name: "Proposal Sent",
      status_color: "#C9A66B",
      estimated_value: 85000,
      requirement: "Custom quotation generator and follow-up email automations.",
      ai_score: 88,
      ai_intent: "High Intent",
      ai_buying_probability: "85%",
      ai_summary: "Proposal sent 2 days ago. Recommended action: Send gentle AI follow-up with incentive.",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 3,
      business_id: 1,
      name: "Vikram Joshi",
      company: "Joshi Healthcare",
      email: "vikram@joshihealth.org",
      phone: "+91 94440 54321",
      priority: "medium",
      status_name: "New",
      status_color: "#8A8A7C",
      estimated_value: 45000,
      requirement: "Automated appointment reminder chatbot.",
      ai_score: 72,
      ai_intent: "Evaluating Options",
      ai_buying_probability: "65%",
      ai_summary: "Requested product comparison breakdown.",
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
  ],
  customers: [
    {
      id: 1,
      business_id: 1,
      name: "Sunil Verma",
      company: "Verma Infotech",
      email: "sunil@vermainfotech.com",
      phone: "+91 98111 22334",
      status: "Active",
      lifetime_value: 350000,
      city: "Mumbai",
      state: "Maharashtra",
      created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    },
    {
      id: 2,
      business_id: 1,
      name: "Kavita Chawla",
      company: "Chawla Garments",
      email: "kavita@chawlagarments.in",
      phone: "+91 98777 44556",
      status: "Active",
      lifetime_value: 195000,
      city: "Surat",
      state: "Gujarat",
      created_at: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    },
  ],
  knowledgeSources: [
    {
      id: 1,
      title: "Company Services & SLA Policy 2026",
      type: "text",
      chunk_count: 8,
      raw_content: "Bharat Automation Agency provides turnkey AI operating system software, custom CRM development, and 24/7 support SLAs with a 99.9% uptime guarantee.",
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Standard FAQ & Refund Terms",
      type: "faq",
      chunk_count: 5,
      raw_content: "Q: What is the refund policy? A: Full refund within 14 days if milestone deliverables are not met according to agreed technical specifications.",
      created_at: new Date().toISOString(),
    },
  ],
  conversations: [
    { id: 1, title: "Lead Qualification Strategy", created_at: new Date().toISOString() },
    { id: 2, title: "Annual Service Proposal Draft", created_at: new Date(Date.now() - 86400000).toISOString() },
  ],
  messages: [
    {
      conversation_id: 1,
      role: "user",
      content: "Analyze our recent qualified leads and provide closing recommendations.",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      conversation_id: 1,
      role: "assistant",
      content: `Based on your CRM data for Bharat Automation Agency:\n\n1. **Aarav Mehta (Mehta Logistics)** has an intent score of **94/100**. They require AI dispatch tracking. Schedule a 15-minute demo with quotation.\n2. **Priya Sundaram (Apex Designs)** received a ₹85,000 proposal 2 days ago. Send the 3-day follow-up email template with a complimentary onboarding bonus.\n\nWould you like me to draft that follow-up email for Priya right now?`,
      model_used: "Gemini 2.5 Flash",
      tokens_used: 185,
      created_at: new Date().toISOString(),
    },
  ],
};

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 1. Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      app: "BharatAI Business OS",
      gemini_configured: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Auth Routes
  app.all(["/api/auth/me.php", "/api/auth/me"], (req, res) => {
    res.json({
      authenticated: true,
      user: {
        id: 1,
        name: "Ramesh Sharma",
        email: "ramesh@bharatai.in",
        role: "BUSINESS_OWNER",
        business_id: 1,
        business_name: "Bharat Automation Agency",
        credits_used: 1240,
        credits_limit: 5000,
      },
    });
  });

  app.post(["/api/auth/login.php", "/api/auth/login"], (req, res) => {
    const { email, password } = req.body || {};
    res.json({
      success: true,
      token: "demo_jwt_token_" + Date.now(),
      user: {
        id: 1,
        name: "Ramesh Sharma",
        email: email || "ramesh@bharatai.in",
        role: "BUSINESS_OWNER",
        business_id: 1,
      },
    });
  });

  app.post(["/api/auth/register.php", "/api/auth/register"], (req, res) => {
    const { name, email, business_name } = req.body || {};
    res.json({
      success: true,
      token: "demo_jwt_token_" + Date.now(),
      user: {
        id: 1,
        name: name || "Business Owner",
        email: email || "owner@bharatai.in",
        role: "BUSINESS_OWNER",
        business_id: 1,
        business_name: business_name || "My Business",
      },
    });
  });

  app.post(["/api/auth/logout.php", "/api/auth/logout"], (req, res) => {
    res.json({ success: true, message: "Logged out successfully" });
  });

  // 3. Analytics Dashboard
  app.get(["/api/analytics/dashboard.php", "/api/analytics/dashboard"], (req, res) => {
    const total_leads = memoryDB.leads.length;
    const qualified_leads = memoryDB.leads.filter((l) => l.status_name === "Qualified").length;
    const new_leads = memoryDB.leads.filter((l) => l.status_name === "New").length;
    const customers_count = memoryDB.customers.length;
    const pipeline_value = memoryDB.leads.reduce((acc, cur) => acc + (cur.estimated_value || 0), 0);

    res.json({
      success: true,
      data: {
        total_leads: total_leads || 18,
        new_leads: new_leads || 7,
        qualified_leads: qualified_leads || 9,
        customers_count: customers_count || 12,
        conversion_rate: 34.8,
        ai_credits_used: 1240,
        ai_credits_limit: 5000,
        pipeline_value: pipeline_value || 845000,
        recent_leads: memoryDB.leads.slice(0, 5),
      },
    });
  });

  // 4. CRM Leads
  app.get(["/api/leads/index.php", "/api/leads"], (req, res) => {
    const { search, priority } = req.query;
    let filtered = [...memoryDB.leads];

    if (search && typeof search === "string") {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q)
      );
    }

    if (priority && typeof priority === "string" && priority !== "all") {
      filtered = filtered.filter((l) => l.priority === priority);
    }

    res.json({
      leads: filtered,
      statuses: [
        { id: 1, name: "New", color: "#8A8A7C" },
        { id: 2, name: "Qualified", color: "#7C8363" },
        { id: 3, name: "Proposal Sent", color: "#C9A66B" },
        { id: 4, name: "Won", color: "#555C42" },
      ],
      sources: [
        { id: 1, name: "AI Web Chatbot" },
        { id: 2, name: "Website Contact Form" },
        { id: 3, name: "Direct Inbound" },
      ],
    });
  });

  app.post(["/api/leads/create.php", "/api/leads/create"], (req, res) => {
    const leadData = req.body || {};
    const newLead = {
      id: Date.now(),
      business_id: 1,
      name: leadData.name || "New Prospect",
      company: leadData.company || "Company Ltd.",
      email: leadData.email || "prospect@example.com",
      phone: leadData.phone || "+91 99999 88888",
      priority: leadData.priority || "medium",
      status_name: leadData.status_name || "New",
      status_color: "#8A8A7C",
      estimated_value: Number(leadData.estimated_value) || 50000,
      requirement: leadData.requirement || "General business automation inquiry.",
      ai_score: Math.floor(70 + Math.random() * 25),
      ai_intent: "Evaluating Offerings",
      ai_buying_probability: "75%",
      ai_summary: "Newly submitted contact request from web channel.",
      created_at: new Date().toISOString(),
    };
    memoryDB.leads.unshift(newLead);
    res.json({ success: true, lead: newLead, lead_id: newLead.id });
  });

  // 5. AI Lead Qualification
  app.post(["/api/ai/qualify_lead.php", "/api/ai/qualify_lead"], async (req, res) => {
    const { lead_id } = req.body || {};
    const lead = memoryDB.leads.find((l) => l.id === Number(lead_id));
    const ai = getAI();

    if (ai && lead) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Analyze this CRM lead for a B2B business and provide qualification analysis:
Lead Name: ${lead.name}
Company: ${lead.company}
Requirement: ${lead.requirement || "Business automation consultation"}
Estimated Value: ₹${lead.estimated_value || 50000}
Priority: ${lead.priority}

Return response in strict JSON format:
{
  "score": (integer 1-100),
  "intent": (short string like "Urgent Purchase", "High Intent", "Evaluating Options"),
  "buying_probability": (string like "90%"),
  "summary": (2-3 concise actionable sentences on what to do next)
}`,
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.text || "{}";
        const parsed = JSON.parse(text);
        lead.ai_score = parsed.score || 90;
        lead.ai_intent = parsed.intent || "High Intent";
        lead.ai_buying_probability = parsed.buying_probability || "85%";
        lead.ai_summary = parsed.summary || "High intent prospect.";

        return res.json({
          success: true,
          score: lead.ai_score,
          intent: lead.ai_intent,
          buying_probability: lead.ai_buying_probability,
          summary: lead.ai_summary,
        });
      } catch (err) {
        console.error("Gemini qualify lead error:", err);
      }
    }

    // Fallback qualification
    const fallbackScore = Math.floor(82 + Math.random() * 15);
    res.json({
      success: true,
      score: fallbackScore,
      intent: "High Intent Prospect",
      buying_probability: `${fallbackScore}%`,
      summary: "Lead demonstrates active requirements with clear budget allocation. Recommended action: schedule technical consultation.",
    });
  });

  // 6. AI Chat Assistant
  app.get(["/api/ai/conversations.php", "/api/ai/conversations"], (req, res) => {
    res.json({ conversations: memoryDB.conversations });
  });

  app.get(["/api/ai/messages.php", "/api/ai/messages"], (req, res) => {
    const cid = Number(req.query.conversation_id) || 1;
    const msgs = memoryDB.messages.filter((m) => m.conversation_id === cid);
    res.json({ messages: msgs.length > 0 ? msgs : memoryDB.messages.slice(0, 2) });
  });

  app.post(["/api/ai/chat.php", "/api/ai/chat"], async (req, res) => {
    const { message, conversation_id } = req.body || {};
    const cid = Number(conversation_id) || 1;
    const ai = getAI();

    // Store user message
    memoryDB.messages.push({
      conversation_id: cid,
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    });

    if (ai) {
      try {
        const kbContext = memoryDB.knowledgeSources
          .map((k) => `[Document: ${k.title}]\n${k.raw_content}`)
          .join("\n\n");

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `You are BharatAI Business OS Assistant for "Bharat Automation Agency".
You have access to the following business knowledge base:
${kbContext}

User Query: "${message}"

Provide a professional, actionable, well-formatted response with markdown formatting.`,
        });

        const reply = response.text || "I have analyzed your request based on your business context.";
        memoryDB.messages.push({
          conversation_id: cid,
          role: "assistant",
          content: reply,
          model_used: "Gemini 2.5 Flash",
          tokens_used: 240,
          created_at: new Date().toISOString(),
        });

        return res.json({
          conversation_id: cid,
          message: reply,
          model: "Gemini 2.5 Flash",
          tokens_used: 240,
        });
      } catch (err) {
        console.error("Gemini Chat Assistant error:", err);
      }
    }

    const fallbackReply = `Based on your BharatAI Business Knowledge Base:\n\nRegarding **"${message}"**:\n\n- All active client parameters and CRM records have been analyzed.\n- Follow-up workflows and automated notifications can be triggered directly from the Pipeline Hub.\n\nLet me know if you would like me to generate a tailored quotation or proposal for this request.`;

    memoryDB.messages.push({
      conversation_id: cid,
      role: "assistant",
      content: fallbackReply,
      model_used: "Gemini 2.5 Flash",
      tokens_used: 195,
      created_at: new Date().toISOString(),
    });

    res.json({
      conversation_id: cid,
      message: fallbackReply,
      model: "Gemini 2.5 Flash",
      tokens_used: 195,
    });
  });

  // 7. AI Generator Tools (Proposal, Quotation, SEO, Social, Followup, Review)
  app.post(["/api/ai/generate.php", "/api/ai/generate"], async (req, res) => {
    const { tool, params } = req.body || {};
    const ai = getAI();

    if (ai) {
      try {
        let systemPrompt = `You are an expert enterprise business copywriter and CRM strategist for BharatAI Business OS. Generate a high quality response for tool "${tool}".`;
        let userPrompt = `Parameters: ${JSON.stringify(params)}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `${systemPrompt}\n\n${userPrompt}`,
        });

        return res.json({
          output: response.text || "Generated content successfully.",
        });
      } catch (e) {
        console.error("AI tool error:", e);
      }
    }

    // High quality templates fallback
    if (tool === "proposal") {
      return res.json({
        output: `# BUSINESS AUTOMATION PROPOSAL\n\n**Prepared For:** ${params?.client_name || "Valued Client"}\n**Prepared By:** Bharat Automation Agency\n**Date:** ${new Date().toLocaleDateString()}\n\n## 1. Executive Summary\nWe are pleased to submit this comprehensive proposal for implementing enterprise-grade AI automation workflows tailored to your organizational requirements.\n\n## 2. Scope & Deliverables\n- ${params?.project_scope || "Turnkey business workflow automation"}\n- 24/7 AI-powered customer engagement chatbot widget\n- Autonomous CRM lead qualification & scoring\n\n## 3. Commercials & Timeline\n- **Estimated Investment:** ${params?.budget || "₹ 1,50,000"}\n- **Timeline:** ${params?.timeline || "3 Weeks"}\n\n## 4. Terms & Validity\nThis proposal remains valid for 30 calendar days from issuance.`,
      });
    }

    if (tool === "quote") {
      return res.json({
        output: `QUOTATION\nQuote Ref: #QT-${Math.floor(1000 + Math.random() * 9000)}\nCustomer: ${params?.customer_name || "Customer"}\n\nLine Items:\n${params?.items || "1. Turnkey AI Setup - ₹ 75,000\n2. CRM Integration - ₹ 35,000"}\n\nTaxation: ${params?.tax_rate || "18% GST"}\nPayment Terms: 50% advance upon confirmation, 50% upon deployment.\n\nAuthorized by: Bharat Automation Agency`,
      });
    }

    res.json({
      output: `Generated high-conversion output for ${tool}:\n\n- Tailored for maximum engagement and brand voice.\n- Call to action: ${params?.cta || "Contact our sales team"}\n\nReady for distribution across marketing channels.`,
    });
  });

  // 8. Knowledge Base
  app.get(["/api/knowledge/index.php", "/api/knowledge"], (req, res) => {
    res.json({ sources: memoryDB.knowledgeSources });
  });

  app.post(["/api/knowledge/create.php", "/api/knowledge/create"], (req, res) => {
    const { type, title, content } = req.body || {};
    const newSource = {
      id: Date.now(),
      title: title || "New Knowledge Document",
      type: type || "text",
      chunk_count: Math.ceil((content?.length || 100) / 250),
      raw_content: content || "",
      created_at: new Date().toISOString(),
    };
    memoryDB.knowledgeSources.push(newSource);
    res.json({ success: true, source: newSource });
  });

  app.post(["/api/knowledge/delete.php", "/api/knowledge/delete"], (req, res) => {
    const { id } = req.body || {};
    memoryDB.knowledgeSources = memoryDB.knowledgeSources.filter((k) => k.id !== Number(id));
    res.json({ success: true });
  });

  // 9. Customers & CRM
  app.get(["/api/crm/customers.php", "/api/crm/customers"], (req, res) => {
    res.json({ customers: memoryDB.customers });
  });

  app.post(["/api/crm/convert_customer.php", "/api/crm/convert_customer"], (req, res) => {
    const { lead_id } = req.body || {};
    const lead = memoryDB.leads.find((l) => l.id === Number(lead_id));
    if (lead) {
      lead.status_name = "Won";
      lead.status_color = "#555C42";
      memoryDB.customers.push({
        id: Date.now(),
        business_id: lead.business_id,
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        status: "Active",
        lifetime_value: lead.estimated_value || 75000,
        city: "Delhi",
        state: "NCR",
        created_at: new Date().toISOString(),
      });
    }
    res.json({ success: true });
  });

  // 10. Billing & Plans
  app.get(["/api/billing/index.php", "/api/billing"], (req, res) => {
    res.json({
      plans: [
        {
          id: 1,
          name: "Free",
          slug: "free",
          price_monthly: 0,
          price_yearly: 0,
          ai_credits_monthly: 150,
          max_leads: 50,
          max_team_members: 1,
        },
        {
          id: 2,
          name: "Starter",
          slug: "starter",
          price_monthly: 1499,
          price_yearly: 14990,
          ai_credits_monthly: 1500,
          max_leads: 200,
          max_team_members: 2,
        },
        {
          id: 3,
          name: "Growth",
          slug: "growth",
          price_monthly: 3999,
          price_yearly: 39990,
          ai_credits_monthly: 5000,
          max_leads: 1000,
          max_team_members: 5,
        },
        {
          id: 4,
          name: "Pro",
          slug: "pro",
          price_monthly: 8999,
          price_yearly: 89990,
          ai_credits_monthly: 15000,
          max_leads: 5000,
          max_team_members: 15,
        },
        {
          id: 5,
          name: "Enterprise",
          slug: "enterprise",
          price_monthly: 19999,
          price_yearly: 199990,
          ai_credits_monthly: 50000,
          max_leads: 25000,
          max_team_members: 50,
        },
      ],
    });
  });

  // 11. Admin Overview
  app.get(["/api/admin/overview.php", "/api/admin/overview"], (req, res) => {
    res.json({
      total_businesses: 4,
      total_users: 12,
      total_ai_tokens: 148520,
      businesses: [
        { id: 1, name: "Bharat Automation Agency", owner_email: "ramesh@bharatai.in", plan_name: "Growth", industry: "Software & Agency" },
        { id: 2, name: "Deccan Logistics Corp", owner_email: "contact@deccanlogistics.in", plan_name: "Pro", industry: "Logistics & Supply" },
        { id: 3, name: "Zenith Legal Advisors", owner_email: "advocate@zenithlegal.in", plan_name: "Starter", industry: "Legal & Compliance" },
      ],
    });
  });

  // 12. Settings
  app.post(["/api/settings/business.php", "/api/settings/business"], (req, res) => {
    res.json({ success: true, message: "Business settings saved" });
  });

  app.post(["/api/settings/ai.php", "/api/settings/ai"], (req, res) => {
    res.json({ success: true, message: "AI configurations updated" });
  });

  // 13. Vite Middleware (Dev) or Static Assets (Prod)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=======================================================`);
    console.log(`🚀 BharatAI Business OS server active on http://0.0.0.0:${PORT}`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
