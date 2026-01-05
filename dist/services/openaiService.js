"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeReview = analyzeReview;
const openai_1 = __importDefault(require("openai"));
const reviewAnalysis_js_1 = require("../prompts/reviewAnalysis.js");
let openaiClient = null;
function getOpenAIClient() {
    if (openaiClient) {
        return openaiClient;
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set');
    }
    openaiClient = new openai_1.default({ apiKey });
    return openaiClient;
}
function validateSentiment(sentiment) {
    const normalized = sentiment.trim();
    if (normalized === '긍정' || normalized === '부정' || normalized === '중립') {
        return normalized;
    }
    return '중립';
}
function parseAIResponse(content) {
    try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return {
            sentiment: validateSentiment(parsed.sentiment || '중립'),
            summary: parsed.summary || '',
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        };
    }
    catch {
        return {
            sentiment: '중립',
            summary: '',
            keywords: [],
        };
    }
}
async function analyzeReview(review) {
    const client = getOpenAIClient();
    const prompt = (0, reviewAnalysis_js_1.buildPrompt)({
        brandName: review.brandName,
        storeName: review.storeName,
        platform: review.platform,
        rating: review.rating,
        reviewText: review.reviewText,
    });
    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
    });
    const content = response.choices[0]?.message?.content || '';
    const analysis = parseAIResponse(content);
    const weeklyData = {
        sentiment: analysis.sentiment,
        keywords: analysis.keywords,
        brand: review.brandName,
        store: review.storeName,
        summary: analysis.summary,
        rating: parseInt(review.rating, 10) || 0,
    };
    if (analysis.sentiment === '부정') {
        weeklyData.original_text = review.reviewText;
    }
    return {
        p1Sentiment: analysis.sentiment,
        p2Summary: analysis.summary,
        p3Keywords: analysis.keywords.join(', '),
        p4WeeklyData: JSON.stringify(weeklyData),
    };
}
//# sourceMappingURL=openaiService.js.map