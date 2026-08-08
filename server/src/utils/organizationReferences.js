const ApiError = require('./ApiError');

const assertOrganizationReference = async (Model, id, organizationId, label) => {
  if (!id) return null;

  const document = await Model.findOne({ _id: id, organization: organizationId }).select('_id');
  if (!document) {
    throw new ApiError(400, `${label} is not available in this organization`);
  }

  return document;
};

const assertOrganizationReferences = async (Model, ids, organizationId, label) => {
  const values = Array.isArray(ids) ? ids.filter(Boolean) : [];
  if (!values.length) return [];

  const documents = await Model.find({
    _id: { $in: values },
    organization: organizationId
  }).select('_id');

  if (documents.length !== new Set(values.map(String)).size) {
    throw new ApiError(400, `One or more ${label} are not available in this organization`);
  }

  return documents;
};

module.exports = {
  assertOrganizationReference,
  assertOrganizationReferences
};
