const preventiveRuleService = require('../services/preventiveRuleService');

const getAll = async (req, res, next) => {
  try { res.json({ success: true, data: await preventiveRuleService.list(req.organizationId, req.query) }); } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try { res.json({ success: true, data: await preventiveRuleService.getById(req.params.id, req.organizationId) }); } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await preventiveRuleService.create(req.body, req.user.id, req.organizationId) }); } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try { res.json({ success: true, data: await preventiveRuleService.update(req.params.id, req.body, req.user.id, req.organizationId) }); } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try { res.json({ success: true, data: await preventiveRuleService.remove(req.params.id, req.organizationId) }); } catch (error) { next(error); }
};

const setEnabled = async (req, res, next) => {
  try { res.json({ success: true, data: await preventiveRuleService.setEnabled(req.params.id, req.body.enabled, req.organizationId) }); } catch (error) { next(error); }
};

const test = async (req, res, next) => {
  try { res.json({ success: true, data: await preventiveRuleService.test(req.params.id, req.organizationId) }); } catch (error) { next(error); }
};

const trigger = async (req, res, next) => {
  try { res.json({ success: true, data: await preventiveRuleService.trigger(req.params.id, req.user.id, req.organizationId) }); } catch (error) { next(error); }
};

const history = async (req, res, next) => {
  try { res.json({ success: true, data: await preventiveRuleService.history(req.params.id, req.organizationId) }); } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove, setEnabled, test, trigger, history };
