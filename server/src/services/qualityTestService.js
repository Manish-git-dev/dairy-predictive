const QualityTest = require('../models/QualityTest');
const MilkLot = require('../models/MilkLot');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const determineGrade = (fat, snf) => {
  if (fat >= 4.5 && snf >= 8.5) return 'A';
  if (fat >= 3.5 && snf >= 8.0) return 'B';
  if (fat >= 3.0 && snf >= 7.5) return 'C';
  return 'rejected';
};

const qualityTestService = {
  create: async (data, organizationId) => {
    const testId = `QT-${Date.now()}`;
    const fat = (data.parameters && data.parameters.fat) || 0;
    const snf = (data.parameters && data.parameters.snf) || 0;
    const grade = data.grade || determineGrade(fat, snf);
    const result = grade === 'rejected' ? 'fail' : (grade === 'C' ? 'borderline' : 'pass');

    const test = new QualityTest({ ...data, testId, grade, result, organization: organizationId });
    await test.save();

    if (data.milkLot) {
      await MilkLot.findOneAndUpdate(
        { _id: data.milkLot, organization: organizationId },
        {
          'quality.fat': fat,
          'quality.snf': snf,
          'quality.grade': grade,
          status: grade === 'rejected' ? 'rejected' : 'tested'
        }
      );
    }

    return test;
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10, grade, result } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId };
    if (grade) query.grade = grade;
    if (result) query.result = result;

    const items = await QualityTest.find(query).populate('milkLot').skip(skip).limit(limitNum).sort({ createdAt: -1 });
    const total = await QualityTest.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    const test = await QualityTest.findOne({ _id: id, organization: organizationId }).populate('milkLot');
    if (!test) throw new ApiError(404, 'Quality test not found');
    return test;
  },

  update: async (id, data, organizationId) => {
    if (data.parameters && (data.parameters.fat !== undefined || data.parameters.snf !== undefined)) {
      const existing = await QualityTest.findOne({ _id: id, organization: organizationId });
      if (existing) {
        const fat = data.parameters.fat !== undefined ? data.parameters.fat : (existing.parameters && existing.parameters.fat) || 0;
        const snf = data.parameters.snf !== undefined ? data.parameters.snf : (existing.parameters && existing.parameters.snf) || 0;
        data.grade = determineGrade(fat, snf);
        data.result = data.grade === 'rejected' ? 'fail' : (data.grade === 'C' ? 'borderline' : 'pass');
      }
    }
    const test = await QualityTest.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
    if (!test) throw new ApiError(404, 'Quality test not found');
    return test;
  }
};

module.exports = qualityTestService;
