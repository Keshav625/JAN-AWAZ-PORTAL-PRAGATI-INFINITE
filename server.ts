import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client Lazily to prevent startup crash if API Key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. Using mock AI simulation for local development.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Pre-seeded high-quality Indian community issues representing diverse locations and community needs
let communityIssues: any[] = [
  {
    id: "issue-1",
    category: "sanitation",
    title: "Open Drains and Persistent Waterlogging in Sigra Wards",
    description: "Sigra residential sectors suffer from open sewage drains that overflow during minor rains. This leads to heavy waterlogging, severe mosquito breeding (dengue cases rose by 25%), and foul odor. The local school pathway is flooded, preventing kids from attending classes safely.",
    location: {
      locality: "Sigra Ward 12",
      constituency: "Varanasi",
      state: "Uttar Pradesh"
    },
    reportedBy: "Amit Srivastava (Sigra Residents Association)",
    reportedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    impactScale: 5,
    status: "detected",
    aiAnalysis: {
      recurringFrequency: "high",
      broaderImpact: "Resolving Sigra's drainage protects child safety/health and turns a stagnant waterlogged zone into clean paved community walkways. It prevents school absenteeism and transforms public hygiene, building civic pride.",
      actionPriority: "immediate",
      safetyHazardLevel: "critical",
      estimatedCostRange: "Medium Capital Investment",
      tags: ["Public Health", "Drainage Cover", "Clean Sigra"]
    }
  },
  {
    id: "issue-2",
    category: "road_accidents",
    title: "Accident-Prone Intersection at Thiruvanmiyur Beach Bypass",
    description: "The sharp blind curve joining Thiruvanmiyur Beach Road and the East Coast Road lacks speed humps, high-visibility warning signs, and street lighting. We've witnessed 4 major two-wheeler accidents here in the past month. Pedestrians, especially seniors walking to the beach, are at extreme risk.",
    location: {
      locality: "Thiruvanmiyur beach margin",
      constituency: "Chennai South",
      state: "Tamil Nadu"
    },
    reportedBy: "Laxmi Ramakrishnan",
    reportedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    impactScale: 4,
    status: "detected",
    aiAnalysis: {
      recurringFrequency: "high",
      broaderImpact: "Adding traffic calmers and solar lighting secures a popular public seaside walkway. It turns a hazardous black spot into a safe space for community wellness, enabling seniors and children to walk freely.",
      actionPriority: "immediate",
      safetyHazardLevel: "critical",
      estimatedCostRange: "Low Cost / Self-Help",
      tags: ["Road Safety", "Solar Lighting", "Senior Safety"]
    }
  },
  {
    id: "issue-3",
    category: "electricity",
    title: "Unstable Voltage and 4-Hour Blackouts in Dhayari Small-Scale Zone",
    description: "Dhayari's mixed residential/micro-industrial zone experiences high-voltage fluctuations and unannounced 4-hour daily power cuts. This burns household appliances and halts small cottage loom units, causing daily wage losses. Local students are forced to study under kerosene lamps.",
    location: {
      locality: "Dhayari Industrial Lane",
      constituency: "Pune",
      state: "Maharashtra"
    },
    reportedBy: "Sanjay Dhayarkar (Weavers Coop)",
    reportedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    impactScale: 4,
    status: "detected",
    aiAnalysis: {
      recurringFrequency: "high",
      broaderImpact: "Stable electricity powers local livelihoods (cottage industries) and allows youth uninterrupted study hours. It generates economic resilience and unlocks local community progress instead of daily survival struggles.",
      actionPriority: "medium_term",
      safetyHazardLevel: "moderate",
      estimatedCostRange: "Medium Capital Investment",
      tags: ["Power Grid", "Livelihoods", "Youth Study"]
    }
  },
  {
    id: "issue-4",
    category: "infrastructure",
    title: "Raniganj Pedestrian Crossing Hazard Near Railway Level Crossing",
    description: "Over 500 daily wage workers and school children cross the active railway tracks near the Raniganj level crossing because there is no foot-overbridge (FOB). Due to high train frequency, several fatal accidents and minor injuries have happened. It splits the colony into two isolated, high-risk halves.",
    location: {
      locality: "Raniganj Ward 4",
      constituency: "Asansol",
      state: "West Bengal"
    },
    reportedBy: "Rajesh Bauri",
    reportedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    impactScale: 5,
    status: "detected",
    aiAnalysis: {
      recurringFrequency: "high",
      broaderImpact: "A pedestrian foot-overbridge saves human lives and reunites an economically active community. It boosts daily safe labor mobility and connects local students with their schools safely, serving as a pillar of community wealth.",
      actionPriority: "long_term",
      safetyHazardLevel: "critical",
      estimatedCostRange: "High State Project",
      tags: ["Railway Safety", "Pedestrian Bridge", "Colony Unity"]
    }
  },
  {
    id: "issue-5",
    category: "garbage",
    title: "Toxic Smoke from Garbage Accumulation Near Bellandur Border",
    description: "Uncontrolled dumping of commercial plastic and dry organic waste along the ring road near Bellandur's swamp border. Frequent late-night burning of this garbage fills the residential air with toxic plastic smoke. Citizens suffer from chronic respiratory issues, especially children.",
    location: {
      locality: "Bellandur Ring Road",
      constituency: "Bengaluru Central",
      state: "Karnataka"
    },
    reportedBy: "Priya Hegde (Clean Bengaluru Coalition)",
    reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    impactScale: 5,
    status: "detected",
    aiAnalysis: {
      recurringFrequency: "high",
      broaderImpact: "Setting up a systematic garbage clearance/fencing system stops open burning and purifies common breathing air. It converts a hazardous health liability into a healthy public corridor, sparking community green drives.",
      actionPriority: "immediate",
      safetyHazardLevel: "critical",
      estimatedCostRange: "Low Cost / Self-Help",
      tags: ["Air Quality", "Waste Management", "Swachh Bharat"]
    }
  },
  {
    id: "issue-6",
    category: "sanitation",
    title: "Absence of Public Hygiene Facilities in Sabzibagh Market",
    description: "The highly congested wholesale vegetable market at Sabzibagh Patna has zero public restrooms. Over 300 vegetable sellers and 1000+ daily visitors (including women sellers) have no access to clean toilets, leading to extreme public unhygiene and safety hazards for women.",
    location: {
      locality: "Sabzibagh Wholesale Bazaar",
      constituency: "Patna Sahib",
      state: "Bihar"
    },
    reportedBy: "Kiran Devi (Market Union)",
    reportedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    impactScale: 5,
    status: "detected",
    aiAnalysis: {
      recurringFrequency: "high",
      broaderImpact: "Providing a community toilet block preserves human dignity and safeguards health. It especially empowers women marketplace sellers to operate comfortably, directly boosting local trade and cooperative working environments.",
      actionPriority: "medium_term",
      safetyHazardLevel: "critical",
      estimatedCostRange: "Medium Capital Investment",
      tags: ["Public Restroom", "Women Dignity", "Market Hygiene"]
    }
  }
];

// 1. GET initial issues
app.get("/api/issues", (req, res) => {
  res.json(communityIssues);
});

// 2. POST submit a new issue with optional instant AI analysis
app.post("/api/issues", async (req, res) => {
  try {
    const { category, title, description, location, reportedBy, impactScale } = req.body;

    if (!category || !title || !description || !location || !reportedBy) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const newIssue = {
      id: "issue-" + Math.random().toString(36).substr(2, 9),
      category,
      title,
      description,
      location,
      reportedBy,
      reportedAt: new Date().toISOString(),
      impactScale: Number(impactScale) || 3,
      status: "pending_analysis" as const
    };

    // Add to local server state
    communityIssues.unshift(newIssue);

    res.status(201).json(newIssue);
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({ error: "Failed to create community issue." });
  }
});

// 3. POST trigger AI analysis for a specific issue
app.post("/api/issues/:id/analyze", async (req, res) => {
  const { id } = req.params;
  const issueIndex = communityIssues.findIndex(i => i.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ error: "Issue not found." });
  }

  const issue = communityIssues[issueIndex];
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Return high quality simulated fallback analysis if key is missing
    console.log("No GEMINI_API_KEY found, simulating analysis...");
    const simulatedAnalysis = {
      recurringFrequency: issue.description.length > 150 ? "high" as const : "medium" as const,
      broaderImpact: `Resolving this in ${issue.location.constituency} secures essential infrastructure. By organizing a community monitoring group, citizens can prevent future problems, creating resilient, shared social wealth and improving public safety.`,
      actionPriority: issue.impactScale >= 4 ? "immediate" as const : "medium_term" as const,
      safetyHazardLevel: issue.category === "road_accidents" || issue.impactScale === 5 ? "critical" as const : "moderate" as const,
      estimatedCostRange: issue.category === "road_accidents" ? "Low Cost / Self-Help" : "Medium Capital Investment",
      tags: ["Community Action", "Safety First", `${issue.location.locality} Lead`]
    };

    issue.status = "detected";
    issue.aiAnalysis = simulatedAnalysis;
    return res.json(issue);
  }

  try {
    const client = getGeminiClient();
    
    const prompt = `
      You are an advanced AI urban planner and public administration advisor for Indian constituencies.
      Analyze the following community issue reported in India:
      
      Title: "${issue.title}"
      Category: "${issue.category}"
      Description: "${issue.description}"
      Location: Locality "${issue.location.locality}", Constituency "${issue.location.constituency}", State "${issue.location.state}"
      Impact Scale: ${issue.impactScale}/5 (where 1 is single family, 5 is whole neighborhood/ward)
      
      Generate a professional analysis. Crucially:
      - Determine how resolving this issue acts as "broaderImpact": Describe why resolving this is "optimistic wealth" for the progressing Indian community (e.g. enabling women's safety, encouraging kids to study, avoiding loss of daily wages, building volunteer citizen teams) rather than just a basic need of a single individual. Frame it as collective progression.
      - Extract tags.
      - Estimate action priority (immediate, medium_term, long_term) and cost range.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "Corrected or validated category of the issue" },
            recurringFrequency: { type: Type.STRING, enum: ["high", "medium", "low"] },
            broaderImpact: { type: Type.STRING, description: "Why resolving this acts as community progression / social asset instead of just single-individual comfort." },
            actionPriority: { type: Type.STRING, enum: ["immediate", "medium_term", "long_term"] },
            safetyHazardLevel: { type: Type.STRING, enum: ["critical", "moderate", "low"] },
            estimatedCostRange: { type: Type.STRING, description: "Estimated budget range, e.g. 'Low Cost / Self-Help', 'Medium Capital Investment', 'High State Project'" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 short tags (e.g. 'Air Quality', 'Livelihoods')" }
          },
          required: ["category", "recurringFrequency", "broaderImpact", "actionPriority", "safetyHazardLevel", "tags"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      const parsedAnalysis = JSON.parse(resultText);
      issue.status = "detected";
      issue.aiAnalysis = parsedAnalysis;
      res.json(issue);
    } else {
      throw new Error("Empty response from Gemini.");
    }
  } catch (err: any) {
    console.error("Gemini analysis error:", err);
    // Fallback if AI fails
    issue.status = "detected";
    issue.aiAnalysis = {
      recurringFrequency: "medium",
      broaderImpact: `Resolving this issue in ${issue.location.constituency} helps secure essential livelihoods and community unity. Citizens will lead maintenance, representing true collective capital.`,
      actionPriority: "medium_term",
      safetyHazardLevel: "moderate",
      tags: ["Local Issue", "Community Support"]
    };
    res.json(issue);
  }
});

// 4. POST generate MP feedback and prioritized action briefings
app.post("/api/briefings", async (req, res) => {
  try {
    const { category, constituency, state, issueIds } = req.body;

    if (!category || !constituency || !state || !issueIds || issueIds.length === 0) {
      return res.status(400).json({ error: "Missing category, constituency, state, or issueIds." });
    }

    // Find the issues belonging to this cluster
    const clusterIssues = communityIssues.filter(issue => issueIds.includes(issue.id));

    if (clusterIssues.length === 0) {
      return res.status(404).json({ error: "No matching issues found for this briefing." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Plausible MP names for Indian constituencies to make the prototype incredibly realistic
    const mpDatabase: { [key: string]: string } = {
      "Varanasi": "Hon'ble Prime Minister & MP Shri Narendra Modi",
      "Chennai South": "Smt. Dr. J. Jayavardhan / MP Representative",
      "Pune": "Shri Murlidhar Mohol (MP, Pune)",
      "Asansol": "Shri Shatrughan Sinha (MP, Asansol)",
      "Bengaluru Central": "Shri P. C. Mohan (MP, Bengaluru Central)",
      "Patna Sahib": "Shri Ravi Shankar Prasad (MP, Patna Sahib)"
    };

    const mpName = mpDatabase[constituency] || `Hon'ble Member of Parliament (MP), ${constituency} Constituency`;

    if (!apiKey) {
      // Simulate High Quality MP Briefing and Formal Letter
      const simulatedBriefing = {
        id: "briefing-" + Math.random().toString(36).substr(2, 9),
        clusterId: `cluster-${category}-${constituency}`,
        mpName,
        constituency,
        state,
        date: new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }),
        title: `Community Priority Briefing: Overcoming ${category.toUpperCase()} Bottlenecks in ${constituency}`,
        executiveSummary: `This briefing collates ${clusterIssues.length} high-impact community complaints regarding persistent ${category} hazards in ${constituency}. Citizens have organized themselves to partner with municipal authorities to solve these recurring constraints.`,
        formalLetter: `
### FORMAL CONSULTATION LETTER

**To,**
**${mpName}**
Member of Parliament, Lok Sabha
Constituency Office, ${constituency}, ${state}

**Subject: Citizen-Partnered Appeal to Resolve Recurring ${category.toUpperCase()} Needs at ${clusterIssues.map(i => i.location.locality).join(", ")}**

Respected Sir/Ma'am,

We write to your esteemed office on behalf of the integrated resident associations and community team members of ${constituency}. 

Through our collective citizen platform, we have detected a highly critical, recurring ${category} need that threatens the basic safety, hygiene, and developmental progress of our families. Specifically, the following issues are causing severe disruption:
${clusterIssues.map(i => `- **${i.title}** in ${i.location.locality}: ${i.description}`).join("\n")}

These problems are no longer isolated individual complaints. Resolving these serves as **optimistic community wealth**—enabling children to walk safely to local public schools, preserving the health of informal wage-earners, and securing daily trade activities.

**Citizen Commitment:**
Our community is not merely asking for intervention; we have formed a **Volunteer Maintenance Squad** pledged to contribute weekend labor, manage localized waste segmentation, and oversee safety watch points in collaboration with municipal wards.

We request your kind office to prioritize instant administrative action on this matter under the MPLAD (Member of Parliament Local Area Development) scheme or by advising local administrative bodies. 

We look forward to an opportunity to present this community plan to your local representative.

With High Regards,
**The Citizens & Community Action Committee of ${constituency}**
        `.trim(),
        actionPlan: [
          {
            step: `Immediate field inspection of the affected areas in ${clusterIssues[0]?.location.locality || "the ward"} by administrative engineers.`,
            priority: "High" as const,
            timeline: "7 Days",
            citizenRole: "Provide guided field support and share real-time water/hazard logging maps with the inspection team."
          },
          {
            step: `Release of emergency localized ward budgets under MPLADS for immediate repairs.`,
            priority: "High" as const,
            timeline: "15 Days",
            citizenRole: "Form a Citizens' Auditing Committee to ensure transparent execution of civil repairs."
          },
          {
            step: `Setup of a regular weekly cleaning/patrolling cycle in joint collaboration with volunteer resident associations.`,
            priority: "Medium" as const,
            timeline: "Ongoing",
            citizenRole: "Organize weekend citizen drives to support secondary maintenance and plant local native trees."
          }
        ],
        communityContribution: "Citizens of Varanasi/Pune/Bengaluru Central are offering 100+ hours of collective weekly labor to co-maintain the resolved public space.",
        status: "draft" as const
      };

      return res.json(simulatedBriefing);
    }

    const client = getGeminiClient();
    const prompt = `
      You are an expert Chief Policy Advisor and Administrative Strategist for Members of Parliament (MPs) of India.
      We have compiled community-reported issues for:
      Category: "${category}"
      Constituency: "${constituency}", State: "${state}"
      
      Here are the individual reports compiled by the community:
      ${clusterIssues.map((i, idx) => `
        Report ${idx + 1}:
        - Title: ${i.title}
        - Locality: ${i.location.locality}
        - Description: ${i.description}
        - Broader Societal Impact: ${i.aiAnalysis?.broaderImpact || "A critical community hazard"}
      `).join("\n")}

      Generate a comprehensive and highly polished "MP Briefing" and an elegant, professional "Formal Administrative Letter" in Markdown format.
      The output must follow this strict JSON format:
      {
        "title": "A compelling title emphasizing public partnership, e.g., 'Civic Action Plan for Street Safety'",
        "executiveSummary": "A concise, high-impact summary of how resolving this recurring concern transitions from basic comfort to productive community progress",
        "formalLetter": "A complete, elegantly worded administrative letter (Markdown) addressed to ${mpName}. Frame the arguments using Indian bureaucratic/political courtesy (e.g., Lok Sabha office, MPLADS, Swachh Bharat context), and strongly emphasize how resolving this creates 'Optimistic Community Wealth' (e.g. safe commutes, livelihood stability, cooperative living). End with a citizen's team pledge.",
        "actionPlan": [
          {
            "step": "Specific administrative or civil engineering step",
            "priority": "High" or "Medium" or "Normal",
            "timeline": "Plausible time, e.g., '10 Days'",
            "citizenRole": "A specific, highly active cooperative role the citizens volunteer to undertake to partner in this success"
          }
        ],
        "communityContribution": "Summarize how the diverse community is uniting to offer labor, safety watches, or maintenance to work as a team."
      }
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            formalLetter: { type: Type.STRING, description: "A formal Markdown-formatted letter addressed to the MP." },
            actionPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["High", "Medium", "Normal"] },
                  timeline: { type: Type.STRING },
                  citizenRole: { type: Type.STRING, description: "How the community volunteers to help achieve this step." }
                },
                required: ["step", "priority", "timeline", "citizenRole"]
              }
            },
            communityContribution: { type: Type.STRING }
          },
          required: ["title", "executiveSummary", "formalLetter", "actionPlan", "communityContribution"]
        }
      }
    });

    const textResult = response.text;
    if (textResult) {
      const parsed = JSON.parse(textResult);
      const fullBriefing = {
        id: "briefing-" + Math.random().toString(36).substr(2, 9),
        clusterId: `cluster-${category}-${constituency}`,
        mpName,
        constituency,
        state,
        date: new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }),
        ...parsed,
        status: "draft" as const
      };
      res.json(fullBriefing);
    } else {
      throw new Error("No briefing generated by Gemini.");
    }
  } catch (error: any) {
    console.error("Briefing generator error:", error);
    res.status(500).json({ error: "Failed to generate MP briefing briefing." });
  }
});

// Update an issue status (e.g. prioritizing an action or resolving)
app.patch("/api/issues/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const issue = communityIssues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found." });
  }
  if (status) {
    issue.status = status;
  }
  res.json(issue);
});

// Serve Vite dev server or static distribution files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
