const { GoogleGenAI } = require('@google/genai');
const Listing = require('../models/Listing');

/**
 * Recommend listings using Google Gen AI SDK (gemini-2.5-flash)
 * POST /api/ai/recommend
 * Body: { query: string }
 */
exports.recommend = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        reply: "Please tell me what you're looking for, and I'll find the best local options for you!",
        items: []
      });
    }

    const cleanQuery = query.trim();

    // 1. Run MongoDB $text search or regex search against active listings (up to 5 items)
    let matchedListings = [];
    try {
      matchedListings = await Listing.find({ $text: { $search: cleanQuery } })
        .limit(5)
        .select('title name price category description listingType type imageUrl images location sellerPhone sellerUpiId');
    } catch (textErr) {
      // Handled by regex fallback below if text search encounters an index/syntax issue
    }

    // Regex fallback if $text yielded no results
    if (!matchedListings || matchedListings.length === 0) {
      const STOPWORDS = new Set(['with', 'and', 'the', 'for', 'from', 'this', 'that', 'have', 'need', 'want', 'buy', 'are', 'was', 'some']);
      const rawWords = cleanQuery.split(/\s+/).map(w => w.replace(/[^a-zA-Z0-9]/g, '')).filter(w => w.length > 1);
      const meaningfulWords = rawWords.filter(w => !STOPWORDS.has(w.toLowerCase()));
      const keywords = meaningfulWords.length > 0 ? meaningfulWords : rawWords;

      if (keywords.length > 0) {
        const regex = new RegExp(keywords.join('|'), 'i');
        matchedListings = await Listing.find({
          $or: [
            { title: regex },
            { name: regex },
            { description: regex },
            { category: regex }
          ]
        })
          .limit(5)
          .select('title name price category description listingType type imageUrl images location sellerPhone sellerUpiId');
      }
    }

    // 2. Graceful fallback if no items match
    if (!matchedListings || matchedListings.length === 0) {
      return res.json({
        reply: `I couldn't find any listings currently matching "${cleanQuery}". Try checking broader categories or post a community request so neighbors nearby can help!`,
        items: []
      });
    }

    // 3. Graceful fallback if GEMINI_API_KEY is not present or invalid
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('CHANGE_') || apiKey.includes('your_')) {
      const topItems = matchedListings.slice(0, 2).map(item => item.title || item.name).join(' and ');
      return res.json({
        reply: `Here are the top matches I found for "${cleanQuery}", including ${topItems}. Check them out below for great local value!`,
        items: matchedListings
      });
    }

    // 4. Send query and retrieved item summary to gemini-2.5-flash with system instructions
    const itemSummaries = matchedListings.map(item => {
      const title = item.title || item.name;
      const type = item.listingType || item.type || 'SELL';
      return `- Title: ${title}, Price: ₹${item.price}, Category: ${item.category}, Type: ${type}, Description: ${item.description || 'N/A'}`;
    }).join('\n');

    const systemInstruction = "You are LocalMarket's AI shopping guide. Recommend from these listings based on the user's intent. Keep your response friendly, concise (2 sentences), and highlight key benefits.";
    const userPrompt = `User Query: "${cleanQuery}"\n\nAvailable Listings:\n${itemSummaries}\n\nRecommend from these listings based on the user's intent.`;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction
        }
      });

      const reply = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "Here are the top local options matching your search!";
      return res.json({
        reply,
        items: matchedListings
      });
    } catch (aiError) {
      console.error('Gemini API call error (falling back):', aiError.message);
      const topItems = matchedListings.slice(0, 2).map(item => item.title || item.name).join(' and ');
      return res.json({
        reply: `I found ${matchedListings.length} great option(s) for "${cleanQuery}", featuring ${topItems}. They offer reliable quality right in your neighborhood!`,
        items: matchedListings
      });
    }
  } catch (err) {
    console.error('Error in aiController.recommend:', err);
    return res.status(500).json({
      reply: 'Something went wrong while retrieving recommendations. Please try again shortly.',
      items: [],
      error: err.message
    });
  }
};
