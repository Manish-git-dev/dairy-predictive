const AiRun = require('../models/AiRun');
const Approval = require('../models/Approval');
const getPagination = require('../utils/pagination');

// Using standard fetch available in Node.js 18+
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const aiService = {
  callGemini: async (prompt) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
  },

  getExplanation: async (entityType, entityId, context, organizationId, userId) => {
    const entityData = `Data for ${entityType} ${entityId}`; // Simplified, real implementation would fetch from DB
    
    const prompt = `You are a dairy operations analyst. Explain the following ${entityType} data and its implications: ${entityData}. Context: ${context}. Provide a clear, concise analysis.`;
    
    const explanation = await aiService.callGemini(prompt);
    
    const aiRun = new AiRun({
      organization: organizationId,
      type: 'explanation',
      input: { entityType, entityId, context },
      output: explanation,
      user: userId
    });
    await aiRun.save();
    
    return { explanation, runId: aiRun._id };
  },

  getRecommendation: async (entityType, entityId, context, organizationId, userId) => {
    const entityData = `Data for ${entityType} ${entityId}`; 
    
    const prompt = `You are a dairy operations advisor. Based on this ${entityType} data: ${entityData}. Context: ${context}. Recommend specific preventive actions. Format: 1) Action 2) Rationale 3) Expected Impact 4) Priority (low/medium/high/critical)`;
    
    const recommendation = await aiService.callGemini(prompt);
    
    const approval = new Approval({
      organization: organizationId,
      type: 'ai_recommendation',
      entityId,
      status: 'pending',
      requestedBy: userId,
      details: { recommendation }
    });
    await approval.save();

    const aiRun = new AiRun({
      organization: organizationId,
      type: 'recommendation',
      input: { entityType, entityId, context },
      output: recommendation,
      user: userId
    });
    await aiRun.save();
    
    return { recommendation, approvalId: approval._id, runId: aiRun._id };
  },

  getAiRuns: async (organizationId, filters) => {
    const { page = 1, limit = 10 } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    const query = { organization: organizationId };
    
    const items = await AiRun.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
    const total = await AiRun.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getAiRunById: async (id, organizationId) => {
    return await AiRun.findOne({ _id: id, organization: organizationId });
  }
};

module.exports = aiService;
