const aiOrchestrator = require('../services/ai-orchestrator.service');
const BusinessIdea = require('../models/business-idea.model');
const { BusinessIdeaResponseDTO } = require('../dtos/business-idea.dto');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');
const { businessIdeaInputSchema } = require('../validations/business-idea.validation');

class IdeaController {
  /**
   * Generate business ideas from real data
   * @route POST /api/v1/business/ideas/generate
   */
  generateIdeas = asyncHandler(async (req, res) => {
    const userProfile = req.body;
    const userId = req.user.id;

    // Validate input
    const { error } = businessIdeaInputSchema.validate(userProfile);
    if (error) {
      return ApiResponse.error(res, { message: error.details[0].message, statusCode: 400 });
    }

    // Generate ideas with real AI and market data
    const result = await aiOrchestrator.generateCompleteBusinessIdea(userProfile);

    // Save to database
    const businessIdea = new BusinessIdea({
      userId,
      input: userProfile,
      ideas: result.ideas,
      economicContext: result.economicContext,
      regulatoryContext: result.regulatoryContext,
      marketTrends: result.marketTrends,
      status: 'completed',
    });

    await businessIdea.save();

    return ApiResponse.success(
      res,
      BusinessIdeaResponseDTO.fromDocument(businessIdea),
      'Business ideas generated successfully with real market data'
    );
  });

  /**
   * Get user's generated ideas
   * @route GET /api/v1/business/ideas
   */
  getUserIdeas = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const ideas = await BusinessIdea.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await BusinessIdea.countDocuments({ userId });

    return ApiResponse.paginated(
      res,
      ideas.map(i => BusinessIdeaResponseDTO.fromDocument(i)),
      page,
      limit,
      total,
      'User ideas retrieved successfully'
    );
  });

  /**
   * Get specific idea details
   * @route GET /api/v1/business/ideas/:id
   */
  getIdeaDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const idea = await BusinessIdea.findOne({ _id: id, userId });

    if (!idea) {
      return ApiResponse.error(res, { message: 'Idea not found', statusCode: 404 });
    }

    return ApiResponse.success(
      res,
      idea,
      'Idea details retrieved successfully'
    );
  });

  /**
   * Get market validation for idea
   * @route GET /api/v1/business/ideas/:id/validate
   */
  validateIdea = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const idea = await BusinessIdea.findOne({ _id: id, userId });

    if (!idea) {
      return ApiResponse.error(res, { message: 'Idea not found', statusCode: 404 });
    }

    // Get real-time validation
    const validation = await aiOrchestrator.validateIdea(idea.ideas[0]);

    return ApiResponse.success(
      res,
      validation,
      'Idea validation completed'
    );
  });
}

module.exports = new IdeaController();