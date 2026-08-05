const QualityTest = require('../models/QualityTest');
const MilkLot = require('../models/MilkLot');
const getPagination = require('../utils/pagination');

const qualityTestService = {
  create: async (data, organizationId) => {
    const testId = `QT-${Date.now()}`;
    
    // Determine grade logic
    let grade = 'rejected';
    const { fat, snf } = data;
    if (fat >= 4.5 && snf >= 8.5) {
      grade = 'A';
    } else if (fat >= 3.5 && snf >= 8.0) {
      grade = 'B';
    } else if (fat >= 3.0 && snf >= 7.5) {
      grade = 'C';
    }

    const test = new QualityTest({ ...data, testId, grade, organization: organizationId });
    await test.save();

    if (data.milkLot) {
      await MilkLot.findOneAndUpdate(
        { _id: data.milkLot, organization: organizationId },
        { quality: test._id, status: grade === 'rejected' ? 'rejected' : 'tested' }
      );
    }

    return test;
  },

  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10, grade } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const query = { organization: organizationId };
    if (grade) query.grade = grade;

    const items = await QualityTest.find(query).populate('milkLot').skip(skip).limit(limitNum);
    const total = await QualityTest.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await QualityTest.findOne({ _id: id, organization: organizationId }).populate('milkLot');
  },

  update: async (id, data, organizationId) => {
    if (data.fat || data.snf) {
       // Re-calculate grade if quality params are updated
       const fat = data.fat !== undefined ? data.fat : 0;
       const snf = data.snf !== undefined ? data.snf : 0;
       if (fat >= 4.5 && snf >= 8.5) data.grade = 'A';
       else if (fat >= 3.5 && snf >= 8.0) data.grade = 'B';
       else if (fat >= 3.0 && snf >= 7.5) data.grade = 'C';
       else data.grade = 'rejected';
    }
    return await QualityTest.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
  }
};

module.exports = qualityTestService;
