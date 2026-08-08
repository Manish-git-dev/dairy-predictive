const mongoose = require('mongoose');
const connectDB = require('../../config/database');
const Farmer = require('../../models/Farmer');
const Product = require('../../models/Product');
const Permission = require('../../models/Permission');
const KpiSnapshot = require('../../models/KpiSnapshot');
const Organization = require('../../models/Organization');
const MilkLot = require('../../models/MilkLot');
const QualityTest = require('../../models/QualityTest');
const Batch = require('../../models/Batch');
const Inventory = require('../../models/Inventory');
const User = require('../../models/User');

const duplicateCheck = async (Model, groupBy, label) => {
  const duplicates = await Model.aggregate([
    { $group: { _id: groupBy, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 20 }
  ]);
  if (duplicates.length) {
    console.warn(`[migration] ${label}: ${duplicates.length} duplicate groups detected; no unique index will be created.`);
  }
  return duplicates;
};

const orphanCount = async (Model, field, RefModel, label) => {
  const refs = await Model.aggregate([
    { $match: { [field]: { $ne: null } } },
    { $lookup: { from: RefModel.collection.name, localField: field, foreignField: '_id', as: '_ref' } },
    { $match: { _ref: { $size: 0 } } },
    { $count: 'count' }
  ]);
  const count = refs[0]?.count || 0;
  if (count) console.warn(`[migration] ${label}: ${count} orphaned references detected.`);
  return count;
};

async function audit() {
  console.log('[migration] Running read-only database audit...');

  await duplicateCheck(Farmer, { organization: '$organization', farmerId: '$farmerId' }, 'Farmer organization/farmerId');
  await duplicateCheck(Product, { organization: '$organization', productId: '$productId' }, 'Product organization/productId');
  await duplicateCheck(Permission, { resource: '$resource', action: '$action' }, 'Permission resource/action');
  await duplicateCheck(KpiSnapshot, { organization: '$organization', period: '$period', date: '$date' }, 'KPI organization/period/date');

  await orphanCount(MilkLot, 'farmer', Farmer, 'MilkLot.farmer');
  await orphanCount(MilkLot, 'tanker', require('../../models/Tanker'), 'MilkLot.tanker');
  await orphanCount(MilkLot, 'batch', Batch, 'MilkLot.batch');
  await orphanCount(QualityTest, 'milkLot', MilkLot, 'QualityTest.milkLot');
  await orphanCount(QualityTest, 'tester', User, 'QualityTest.tester');
  await orphanCount(Batch, 'product', Product, 'Batch.product');
  await orphanCount(Inventory, 'product', Product, 'Inventory.product');
  await orphanCount(Inventory, 'batch', Batch, 'Inventory.batch');

  const invalidDateSamples = await Promise.all([
    MilkLot.countDocuments({ collectionDate: { $type: 'string' } }),
    QualityTest.countDocuments({ testDate: { $type: 'string' } }),
    KpiSnapshot.countDocuments({ date: { $type: 'string' } })
  ]);
  console.log('[migration] String-date counts:', invalidDateSamples);
}

async function applyIndexes() {
  console.log('[migration] Applying non-destructive performance indexes...');

  await Product.collection.createIndex({ organization: 1, isActive: 1, createdAt: -1 }, { name: 'org_active_createdAt' });
  await Product.collection.createIndex({ organization: 1, category: 1, isActive: 1 }, { name: 'org_category_active' });
  await Permission.collection.createIndex({ resource: 1, action: 1 }, { name: 'resource_action' });
  await Organization.collection.createIndex({ isActive: 1, createdAt: -1 }, { name: 'active_createdAt' });
  await KpiSnapshot.collection.createIndex({ organization: 1, period: 1, date: -1 }, { name: 'org_period_date_desc' });

  console.log('[migration] Index application complete. No documents were deleted or rewritten.');
}

async function main() {
  const apply = process.argv.includes('--apply');
  await connectDB();

  // connectDB retries asynchronously, so wait for a ready mongoose connection.
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve, reject) => {
      const onConnected = () => { cleanup(); resolve(); };
      const onError = (error) => { cleanup(); reject(error); };
      const cleanup = () => {
        mongoose.connection.off('connected', onConnected);
        mongoose.connection.off('error', onError);
      };
      mongoose.connection.once('connected', onConnected);
      mongoose.connection.once('error', onError);
    });
  }

  await audit();
  if (apply) await applyIndexes();
  else console.log('[migration] Dry run only. Re-run with --apply to create the listed indexes.');

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('[migration] Failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
