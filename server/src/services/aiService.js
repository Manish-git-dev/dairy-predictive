const AiRun = require('../models/AiRun');
const Approval = require('../models/Approval');
const AnomalyEvent = require('../models/AnomalyEvent');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const aiService = {
  callGemini: async (prompt) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new ApiError(500, 'GEMINI_API_KEY is not configured');

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(502, `Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
  },

  getExplanation: async (entityType, entityId, context, organizationId, userId) => {
    const prompt = `You are a dairy operations analyst. Explain the following ${entityType} (ID: ${entityId}) and its implications. Context: ${context || 'none'}. Provide a clear, concise analysis.`;

    let explanation;
    try {
      explanation = await aiService.callGemini(prompt);
    } catch (err) {
      explanation = `Unable to generate AI explanation at this time. ${err.message}`;
    }

    const aiRun = new AiRun({
      organization: organizationId,
      runId: `AIR-${Date.now()}`,
      type: 'explanation',
      modelVersion: '1.0.0',
      input: { type: 'quality_explanation', snapshot: { entityType, entityId, context } },
      output: { result: { explanation }, confidence: 0.9, reasoning: 'Generated from Gemini API analysis' },
      status: 'completed',
      user: userId
    });
    await aiRun.save();

    return { explanation, runId: aiRun._id };
  },

  getRecommendation: async (body, organizationId, userId) => {
    const { entityType, entityId, context } = body;
    const prompt = `You are a dairy operations advisor. Based on this ${entityType} (ID: ${entityId}). Context: ${context || 'none'}. Recommend specific preventive actions. Format: 1) Action 2) Rationale 3) Expected Impact 4) Priority (low/medium/high/critical). Remember this is decision support only.`;

    let recommendation;
    try {
      recommendation = await aiService.callGemini(prompt);
    } catch (err) {
      recommendation = `Unable to generate AI recommendation at this time. ${err.message}`;
    }

    const aiRun = new AiRun({
      organization: organizationId,
      runId: `AIR-${Date.now()}`,
      type: 'recommendation',
      modelVersion: '1.0.0',
      input: { type: 'preventive_action', snapshot: { entityType, entityId, context } },
      output: { result: { recommendation }, confidence: 0.85, reasoning: 'Generated from Gemini API analysis' },
      status: 'completed',
      user: userId
    });
    await aiRun.save();

    const approval = new Approval({
      organization: organizationId,
      approvalId: `APR-${Date.now()}`,
      type: 'ai_recommendation',
      title: `AI recommendation for ${entityType}`,
      description: recommendation.substring(0, 200),
      requester: userId,
      status: 'pending',
      aiRecommendation: {
        action: recommendation,
        confidence: 0.85,
        reasoning: 'Generated from Gemini API analysis',
        modelVersion: '1.0.0'
      },
      relatedEntity: { type: entityType, id: entityId }
    });
    await approval.save();

    return { recommendation, approvalId: approval._id, runId: aiRun._id };
  },

  getAiRuns: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10, type } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId };
    if (type) query.type = type;

    const items = await AiRun.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
    const total = await AiRun.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getAiRunById: async (id, organizationId) => {
    const run = await AiRun.findOne({ _id: id, organization: organizationId });
    if (!run) throw new ApiError(404, 'AI run not found');
    return run;
  }
};

module.exports = aiService;
