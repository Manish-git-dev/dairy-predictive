require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('./config/database');

// Import all models
const Organization = require('./models/Organization');
const User = require('./models/User');
const Role = require('./models/Role');
const Farmer = require('./models/Farmer');
const CollectionCentre = require('./models/CollectionCentre');
const MilkLot = require('./models/MilkLot');
const QualityTest = require('./models/QualityTest');
const Tanker = require('./models/Tanker');
const Batch = require('./models/Batch');
const Product = require('./models/Product');
const Inventory = require('./models/Inventory');
const Payment = require('./models/Payment');
const Task = require('./models/Task');
const SlaRule = require('./models/SlaRule');
const Alert = require('./models/Alert');
const AnomalyEvent = require('./models/AnomalyEvent');
const Approval = require('./models/Approval');
const AiRun = require('./models/AiRun');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');
const Configuration = require('./models/Configuration');
const OperationalEvent = require('./models/OperationalEvent');
const KpiSnapshot = require('./models/KpiSnapshot');

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Clearing existing data...');
    
    // Clear all collections
    await Promise.all([
      Organization.deleteMany({}),
      User.deleteMany({}),
      Role.deleteMany({}),
      Farmer.deleteMany({}),
      CollectionCentre.deleteMany({}),
      MilkLot.deleteMany({}),
      QualityTest.deleteMany({}),
      Tanker.deleteMany({}),
      Batch.deleteMany({}),
      Product.deleteMany({}),
      Inventory.deleteMany({}),
      Payment.deleteMany({}),
      Task.deleteMany({}),
      SlaRule.deleteMany({}),
      Alert.deleteMany({}),
      AnomalyEvent.deleteMany({}),
      Approval.deleteMany({}),
      AiRun.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      Configuration.deleteMany({}),
      OperationalEvent.deleteMany({}),
      KpiSnapshot.deleteMany({})
    ]);
    
    console.log('Creating organization...');
    const org = await Organization.create({
      name: 'Amul Dairy Cooperative',
      code: 'AMUL',
      address: { street: 'Amul Dairy Road', city: 'Anand', state: 'Gujarat', pincode: '388001', country: 'India' },
      contactEmail: 'ops@amuldairy.coop',
      contactPhone: '+91-2692-258506',
      subscriptionTier: 'premium',
      settings: { currency: 'INR', timezone: 'Asia/Kolkata', milkPricePerLitre: 35, fatBonusRate: 0.5, snfBonusRate: 0.3 }
    });
    
    console.log('Creating users...');
    const users = await User.create([
      { firstName: 'Rajesh', lastName: 'Patel', email: 'admin@dairyops.com', password: 'Admin@123', phone: '+91-9876543210', role: 'ops_admin', organization: org._id },
      { firstName: 'Priya', lastName: 'Sharma', email: 'manager@dairyops.com', password: 'Manager@123', phone: '+91-9876543211', role: 'manager', organization: org._id },
      { firstName: 'Amit', lastName: 'Kumar', email: 'analyst@dairyops.com', password: 'Analyst@123', phone: '+91-9876543212', role: 'analyst', organization: org._id },
      { firstName: 'Suresh', lastName: 'Yadav', email: 'field@dairyops.com', password: 'Field@123', phone: '+91-9876543213', role: 'field_staff', organization: org._id },
      { firstName: 'Kavita', lastName: 'Desai', email: 'manager2@dairyops.com', password: 'Manager@123', phone: '+91-9876543214', role: 'manager', organization: org._id },
      { firstName: 'Vikram', lastName: 'Singh', email: 'field2@dairyops.com', password: 'Field@123', phone: '+91-9876543215', role: 'field_staff', organization: org._id }
    ]);
    const [admin, manager, analyst, fieldStaff, manager2, fieldStaff2] = users;
    
    console.log('Creating roles...');
    await Role.create([
      { name: 'ops_admin', displayName: 'Operations Admin', description: 'Full system access', permissions: [{ resource: '*', actions: ['create','read','update','delete'] }], organization: org._id, isSystem: true },
      { name: 'manager', displayName: 'Manager', description: 'Operations management access', permissions: [{ resource: 'farmers', actions: ['create','read','update'] },{ resource: 'milkLots', actions: ['create','read','update'] },{ resource: 'tasks', actions: ['create','read','update','delete'] },{ resource: 'reports', actions: ['read'] }], organization: org._id, isSystem: true },
      { name: 'analyst', displayName: 'Analyst', description: 'Analytics and reporting access', permissions: [{ resource: 'reports', actions: ['create','read'] },{ resource: 'forecasts', actions: ['create','read'] },{ resource: 'anomalies', actions: ['read'] }], organization: org._id, isSystem: true },
      { name: 'field_staff', displayName: 'Field Staff', description: 'Field operations access', permissions: [{ resource: 'milkLots', actions: ['create','read'] },{ resource: 'tasks', actions: ['read','update'] }], organization: org._id, isSystem: true }
    ]);
    
    console.log('Creating farmers (15)...');
    const farmerNames = [
      { first: 'Ramesh', last: 'Chaudhary', village: 'Vidyanagar', district: 'Anand' },
      { first: 'Bharat', last: 'Patel', village: 'Mogar', district: 'Anand' },
      { first: 'Sunil', last: 'Desai', village: 'Bakrol', district: 'Anand' },
      { first: 'Kiran', last: 'Solanki', village: 'Borsad', district: 'Anand' },
      { first: 'Mahesh', last: 'Parmar', village: 'Petlad', district: 'Anand' },
      { first: 'Dinesh', last: 'Shah', village: 'Tarapur', district: 'Anand' },
      { first: 'Jitendra', last: 'Thakor', village: 'Umreth', district: 'Anand' },
      { first: 'Pravin', last: 'Gohel', village: 'Khambhat', district: 'Anand' },
      { first: 'Ashok', last: 'Rathod', village: 'Sojitra', district: 'Anand' },
      { first: 'Naresh', last: 'Vaghela', village: 'Anklav', district: 'Anand' },
      { first: 'Jagdish', last: 'Mistry', village: 'Nadiad', district: 'Kheda' },
      { first: 'Harish', last: 'Panchal', village: 'Mahemdabad', district: 'Kheda' },
      { first: 'Gopal', last: 'Trivedi', village: 'Kapadvanj', district: 'Kheda' },
      { first: 'Mukesh', last: 'Chauhan', village: 'Thasra', district: 'Kheda' },
      { first: 'Satish', last: 'Bhatt', village: 'Kathlal', district: 'Kheda' }
    ];
    
    const farmers = await Farmer.create(farmerNames.map((f, i) => ({
      farmerId: `FRM${String(i+1).padStart(4, '0')}`,
      firstName: f.first,
      lastName: f.last,
      phone: `+91-98765${String(43200 + i).padStart(5, '0')}`,
      email: `${f.first.toLowerCase()}.${f.last.toLowerCase()}@farmers.coop`,
      address: { village: f.village, district: f.district, state: 'Gujarat', pincode: '388001' },
      bankDetails: { accountNumber: `${10000000000 + i}`, ifscCode: 'SBIN0001234', bankName: 'State Bank of India' },
      cattleCount: Math.floor(Math.random() * 8) + 3,
      avgDailyYield: Math.floor(Math.random() * 30) + 10,
      registrationDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      rating: Math.floor(Math.random() * 3) + 3,
      assignedCollectionCentre: i < 8 ? 'CC001' : 'CC002',
      organization: org._id
    })));
    
    console.log('Creating collection centres (3)...');
    const centres = await CollectionCentre.create([
      {
        centreId: 'CC001', name: 'Anand Main Collection Centre',
        location: { village: 'Anand', district: 'Anand', state: 'Gujarat', coordinates: { lat: 22.5645, lng: 72.9289 } },
        capacityLitres: 5000, currentUtilization: 3200, chillingCapacity: 5000, chillingTemperature: 4,
        manager: manager._id, contactPhone: '+91-2692-258501',
        equipment: [{ name: 'Bulk Cooler 5000L', status: 'operational', lastMaintenance: new Date(2026, 6, 15) }, { name: 'Fat Analyzer', status: 'operational', lastMaintenance: new Date(2026, 6, 20) }, { name: 'Weighing Scale', status: 'operational', lastMaintenance: new Date(2026, 7, 1) }],
        organization: org._id
      },
      {
        centreId: 'CC002', name: 'Kheda District Centre',
        location: { village: 'Nadiad', district: 'Kheda', state: 'Gujarat', coordinates: { lat: 22.6916, lng: 72.8634 } },
        capacityLitres: 3000, currentUtilization: 1800, chillingCapacity: 3000, chillingTemperature: 4,
        manager: manager2._id, contactPhone: '+91-2692-258502',
        equipment: [{ name: 'Bulk Cooler 3000L', status: 'operational', lastMaintenance: new Date(2026, 6, 10) }, { name: 'Fat Analyzer', status: 'maintenance', lastMaintenance: new Date(2026, 5, 15) }],
        organization: org._id
      },
      {
        centreId: 'CC003', name: 'Petlad Sub-Centre',
        location: { village: 'Petlad', district: 'Anand', state: 'Gujarat', coordinates: { lat: 22.4697, lng: 72.8005 } },
        capacityLitres: 2000, currentUtilization: 900, chillingCapacity: 2000, chillingTemperature: 4.2,
        manager: manager._id, contactPhone: '+91-2692-258503',
        equipment: [{ name: 'Bulk Cooler 2000L', status: 'operational', lastMaintenance: new Date(2026, 7, 1) }, { name: 'Weighing Scale', status: 'faulty', lastMaintenance: new Date(2026, 4, 20) }],
        organization: org._id
      }
    ]);
    
    console.log('Creating products (7)...');
    const products = await Product.create([
      { productId: 'PRD001', name: 'Full Cream Milk', category: 'milk', unit: 'litre', pricePerUnit: 60, shelfLifeDays: 5, storageTemperature: 4, organization: org._id },
      { productId: 'PRD002', name: 'Toned Milk', category: 'milk', unit: 'litre', pricePerUnit: 50, shelfLifeDays: 5, storageTemperature: 4, organization: org._id },
      { productId: 'PRD003', name: 'Amul Butter', category: 'butter', unit: 'kg', pricePerUnit: 550, shelfLifeDays: 90, storageTemperature: 5, organization: org._id },
      { productId: 'PRD004', name: 'Paneer', category: 'cheese', unit: 'kg', pricePerUnit: 350, shelfLifeDays: 7, storageTemperature: 4, organization: org._id },
      { productId: 'PRD005', name: 'Amul Yogurt', category: 'yogurt', unit: 'kg', pricePerUnit: 120, shelfLifeDays: 14, storageTemperature: 4, organization: org._id },
      { productId: 'PRD006', name: 'Cream', category: 'cream', unit: 'litre', pricePerUnit: 280, shelfLifeDays: 10, storageTemperature: 4, organization: org._id },
      { productId: 'PRD007', name: 'Amul Ghee', category: 'ghee', unit: 'litre', pricePerUnit: 650, shelfLifeDays: 270, storageTemperature: 25, organization: org._id }
    ]);
    
    console.log('Creating tankers (4)...');
    const tankers = await Tanker.create([
      { tankerId: 'TNK001', registrationNumber: 'GJ-19-AB-1234', capacityLitres: 5000, currentLoad: 3500, driver: { name: 'Raju Patel', phone: '+91-9876500001', licenseNumber: 'GJ19-20240001' }, status: 'in_transit', currentLocation: { lat: 22.5645, lng: 72.9289 }, temperature: 4.5, route: { origin: 'CC001', destination: 'Main Plant', estimatedArrival: new Date(Date.now() + 2*60*60*1000), actualArrival: null }, assignedCentres: ['CC001'], organization: org._id },
      { tankerId: 'TNK002', registrationNumber: 'GJ-19-CD-5678', capacityLitres: 3000, currentLoad: 0, driver: { name: 'Vijay Kumar', phone: '+91-9876500002', licenseNumber: 'GJ19-20240002' }, status: 'available', currentLocation: { lat: 22.6916, lng: 72.8634 }, temperature: 4.0, route: { origin: 'CC002', destination: 'Main Plant' }, assignedCentres: ['CC002'], organization: org._id },
      { tankerId: 'TNK003', registrationNumber: 'GJ-19-EF-9012', capacityLitres: 4000, currentLoad: 2800, driver: { name: 'Mohan Singh', phone: '+91-9876500003', licenseNumber: 'GJ19-20240003' }, status: 'loading', currentLocation: { lat: 22.4697, lng: 72.8005 }, temperature: 4.2, route: { origin: 'CC003', destination: 'Main Plant', estimatedArrival: new Date(Date.now() + 3*60*60*1000) }, assignedCentres: ['CC003', 'CC001'], organization: org._id },
      { tankerId: 'TNK004', registrationNumber: 'GJ-19-GH-3456', capacityLitres: 5000, currentLoad: 0, driver: { name: 'Kamlesh Rao', phone: '+91-9876500004', licenseNumber: 'GJ19-20240004' }, status: 'maintenance', currentLocation: { lat: 22.5645, lng: 72.9289 }, temperature: null, route: {}, assignedCentres: ['CC001', 'CC002'], organization: org._id }
    ]);
    
    console.log('Creating milk lots (60 over 30 days)...');
    const milkLots = [];
    const statuses = ['collected', 'tested', 'chilled', 'in_transit', 'at_plant', 'processed', 'rejected'];
    for (let day = 0; day < 30; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      // 2 lots per farmer per day (morning + evening) for random subset
      const selectedFarmers = farmers.slice(0, Math.floor(Math.random() * 5) + 8);
      for (const farmer of selectedFarmers) {
        for (const shift of ['morning', 'evening']) {
          const fat = parseFloat((Math.random() * 3 + 3).toFixed(1)); // 3.0 - 6.0
          const snf = parseFloat((Math.random() * 2.5 + 7).toFixed(1)); // 7.0 - 9.5
          const qty = parseFloat((Math.random() * 15 + 5).toFixed(1)); // 5 - 20 litres
          const temp = parseFloat((Math.random() * 10 + 25).toFixed(1)); // 25 - 35 C
          const isRejected = fat < 3.0 || snf < 7.5 || Math.random() < 0.03;
          const grade = fat >= 4.5 && snf >= 8.5 ? 'A' : fat >= 3.5 && snf >= 8.0 ? 'B' : fat >= 3.0 && snf >= 7.5 ? 'C' : 'rejected';
          
          let status;
          if (isRejected) status = 'rejected';
          else if (day === 0) status = ['collected', 'tested', 'chilled'][Math.floor(Math.random() * 3)];
          else if (day <= 2) status = ['chilled', 'in_transit', 'at_plant'][Math.floor(Math.random() * 3)];
          else status = 'processed';
          
          const pricePerLitre = 35 + (fat - 3.5) * 0.5 + (snf - 8.0) * 0.3;
          
          milkLots.push({
            lotId: `LOT${String(milkLots.length + 1).padStart(6, '0')}`,
            farmer: farmer._id,
            collectionCentre: farmer.assignedCollectionCentre,
            collectionDate: date,
            shift,
            quantityLitres: qty,
            temperature: temp,
            quality: { fat, snf, clr: parseFloat((Math.random() * 4 + 26).toFixed(1)), pH: parseFloat((Math.random() * 1 + 6).toFixed(1)), adulteration: Math.random() < 0.02, grade },
            status,
            rejectionReason: isRejected ? 'Quality parameters below threshold' : undefined,
            pricePerLitre: parseFloat(pricePerLitre.toFixed(2)),
            totalAmount: parseFloat((pricePerLitre * qty).toFixed(2)),
            tanker: day <= 2 && !isRejected ? tankers[Math.floor(Math.random() * 3)]._id : undefined,
            organization: org._id
          });
        }
      }
    }
    const createdMilkLots = await MilkLot.insertMany(milkLots);
    
    console.log(`Created ${createdMilkLots.length} milk lots`);
    
    console.log('Creating quality tests...');
    const qualityTests = createdMilkLots.slice(0, 100).map((lot, i) => ({
      testId: `QT${String(i+1).padStart(5, '0')}`,
      milkLot: lot._id,
      collectionCentre: lot.collectionCentre,
      tester: [fieldStaff._id, fieldStaff2._id][Math.floor(Math.random() * 2)],
      testDate: lot.collectionDate,
      parameters: {
        fat: lot.quality.fat,
        snf: lot.quality.snf,
        clr: lot.quality.clr,
        pH: lot.quality.pH,
        temperature: lot.temperature,
        density: parseFloat((1.028 + Math.random() * 0.006).toFixed(3)),
        acidity: parseFloat((0.12 + Math.random() * 0.06).toFixed(2)),
        adulteration: { detected: lot.quality.adulteration, type: lot.quality.adulteration ? 'Water addition suspected' : null }
      },
      result: lot.quality.grade === 'rejected' ? 'fail' : lot.quality.grade === 'C' ? 'borderline' : 'pass',
      grade: lot.quality.grade,
      notes: lot.quality.grade === 'rejected' ? 'Sample failed quality check' : null,
      organization: org._id
    }));
    await QualityTest.insertMany(qualityTests);
    
    console.log('Creating batches (10)...');
    const processedLots = createdMilkLots.filter(l => l.status === 'processed');
    const batches = [];
    for (let i = 0; i < 10; i++) {
      const batchLots = processedLots.slice(i * 20, (i + 1) * 20);
      if (batchLots.length === 0) break;
      const totalQty = batchLots.reduce((s, l) => s + l.quantityLitres, 0);
      const avgFat = batchLots.reduce((s, l) => s + l.quality.fat, 0) / batchLots.length;
      const avgSnf = batchLots.reduce((s, l) => s + l.quality.snf, 0) / batchLots.length;
      const statusOpts = ['created', 'processing', 'processed', 'packaged', 'dispatched'];
      
      batches.push({
        batchId: `BATCH${String(i+1).padStart(4, '0')}`,
        milkLots: batchLots.map(l => l._id),
        totalQuantity: parseFloat(totalQty.toFixed(1)),
        averageFat: parseFloat(avgFat.toFixed(1)),
        averageSnf: parseFloat(avgSnf.toFixed(1)),
        processingDate: new Date(Date.now() - i * 3 * 24*60*60*1000),
        status: statusOpts[Math.min(i, 4)],
        product: products[Math.floor(Math.random() * products.length)]._id,
        plantYield: parseFloat((85 + Math.random() * 12).toFixed(1)),
        wastage: parseFloat((1 + Math.random() * 4).toFixed(1)),
        processingNotes: `Batch processed at standard conditions. Yield within acceptable range.`,
        organization: org._id
      });
    }
    const createdBatches = await Batch.insertMany(batches);
    
    console.log('Creating inventory items...');
    const inventoryItems = createdBatches.filter(b => ['packaged','dispatched'].includes(b.status)).map((batch, i) => ({
      product: batch.product,
      batch: batch._id,
      quantity: Math.floor(Math.random() * 500) + 100,
      unit: 'units',
      location: 'Cold Storage A',
      expiryDate: new Date(Date.now() + (Math.floor(Math.random() * 30) + 5) * 24*60*60*1000),
      status: Math.random() > 0.8 ? 'low_stock' : 'in_stock',
      minimumStock: 50,
      reorderPoint: 100,
      lastRestocked: new Date(),
      organization: org._id
    }));
    // Add some standalone inventory
    for (const product of products) {
      inventoryItems.push({
        product: product._id,
        quantity: Math.floor(Math.random() * 300) + 20,
        unit: product.unit,
        location: 'Main Warehouse',
        expiryDate: new Date(Date.now() + product.shelfLifeDays * 24*60*60*1000),
        status: Math.random() > 0.7 ? 'low_stock' : 'in_stock',
        minimumStock: 30,
        reorderPoint: 60,
        lastRestocked: new Date(Date.now() - Math.floor(Math.random() * 7) * 24*60*60*1000),
        organization: org._id
      });
    }
    await Inventory.insertMany(inventoryItems);
    
    console.log('Creating payments...');
    const payments = farmers.slice(0, 10).map((farmer, i) => {
      const farmerLots = createdMilkLots.filter(l => l.farmer.toString() === farmer._id.toString() && l.status !== 'rejected');
      const totalQty = farmerLots.reduce((s, l) => s + l.quantityLitres, 0);
      const avgFat = farmerLots.length ? farmerLots.reduce((s, l) => s + l.quality.fat, 0) / farmerLots.length : 0;
      const avgSnf = farmerLots.length ? farmerLots.reduce((s, l) => s + l.quality.snf, 0) / farmerLots.length : 0;
      const baseAmount = totalQty * 35;
      const fatBonus = totalQty * Math.max(0, avgFat - 3.5) * 0.5;
      const snfBonus = totalQty * Math.max(0, avgSnf - 8.0) * 0.3;
      const deductions = Math.floor(Math.random() * 100);
      const payStatuses = ['pending', 'calculated', 'approved', 'disbursed', 'disputed'];
      
      return {
        paymentId: `PAY${String(i+1).padStart(5, '0')}`,
        farmer: farmer._id,
        period: { startDate: new Date(Date.now() - 30*24*60*60*1000), endDate: new Date() },
        milkLots: farmerLots.slice(0, 20).map(l => l._id),
        totalQuantity: parseFloat(totalQty.toFixed(1)),
        averageFat: parseFloat(avgFat.toFixed(1)),
        averageSnf: parseFloat(avgSnf.toFixed(1)),
        baseAmount: parseFloat(baseAmount.toFixed(2)),
        fatBonus: parseFloat(fatBonus.toFixed(2)),
        snfBonus: parseFloat(snfBonus.toFixed(2)),
        deductions,
        netAmount: parseFloat((baseAmount + fatBonus + snfBonus - deductions).toFixed(2)),
        status: payStatuses[Math.min(i, 4)],
        approvedBy: i >= 2 ? manager._id : undefined,
        disbursedDate: i >= 3 ? new Date(Date.now() - 2*24*60*60*1000) : undefined,
        transactionReference: i >= 3 ? `TXN${Date.now()}${i}` : undefined,
        organization: org._id
      };
    });
    await Payment.insertMany(payments);
    
    console.log('Creating SLA rules...');
    const slaRules = await SlaRule.create([
      { name: 'Collection to Chilling', description: 'Milk must be chilled within 2 hours of collection', stage: 'collection', metric: 'chilling_time', threshold: 120, unit: 'minutes', escalationTime: 30, escalationRole: 'manager', notifyRoles: ['manager', 'field_staff'], organization: org._id },
      { name: 'Quality Test Completion', description: 'Quality test must be completed within 30 minutes', stage: 'testing', metric: 'test_completion_time', threshold: 30, unit: 'minutes', escalationTime: 15, escalationRole: 'manager', notifyRoles: ['manager'], organization: org._id },
      { name: 'Transport Temperature', description: 'Tanker temperature must stay below 6°C', stage: 'transport', metric: 'temperature', threshold: 6, unit: 'celsius', escalationTime: 10, escalationRole: 'ops_admin', notifyRoles: ['manager', 'ops_admin'], organization: org._id },
      { name: 'Payment Processing', description: 'Payments must be processed within 7 days of period end', stage: 'settlement', metric: 'processing_time', threshold: 7, unit: 'days', escalationTime: 1440, escalationRole: 'ops_admin', notifyRoles: ['manager', 'ops_admin'], organization: org._id },
      { name: 'Plant Processing Time', description: 'Batch must be processed within 8 hours', stage: 'processing', metric: 'processing_time', threshold: 480, unit: 'minutes', escalationTime: 60, escalationRole: 'manager', notifyRoles: ['manager'], organization: org._id }
    ]);
    
    console.log('Creating tasks (20)...');
    const taskTypes = ['collection_pickup', 'quality_check', 'tanker_dispatch', 'payment_review', 'equipment_maintenance', 'farmer_visit', 'inventory_check', 'batch_processing'];
    const tasks = [];
    for (let i = 0; i < 20; i++) {
      const taskStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'escalated'];
      const priorities = ['low', 'medium', 'high', 'critical'];
      const stages = ['collection', 'testing', 'chilling', 'transport', 'processing', 'packaging', 'distribution', 'settlement', 'farmer_support'];
      const daysOffset = Math.floor(Math.random() * 10) - 5;
      
      tasks.push({
        taskId: `TSK${String(i+1).padStart(5, '0')}`,
        title: `${taskTypes[i % taskTypes.length].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} #${i+1}`,
        description: `${taskTypes[i % taskTypes.length].replace(/_/g, ' ')} task for operational workflow`,
        type: taskTypes[i % taskTypes.length],
        stage: stages[i % stages.length],
        assignedTo: [fieldStaff._id, fieldStaff2._id, manager._id, manager2._id][i % 4],
        assignedBy: [admin._id, manager._id][i % 2],
        priority: priorities[i % 4],
        status: taskStatuses[Math.min(i % 5, 4)],
        dueDate: new Date(Date.now() + daysOffset * 24*60*60*1000),
        completedAt: i % 5 === 3 ? new Date() : undefined,
        slaRule: slaRules[i % slaRules.length]._id,
        slaBreached: i % 7 === 0,
        escalatedTo: i % 5 === 4 ? admin._id : undefined,
        escalatedAt: i % 5 === 4 ? new Date() : undefined,
        escalationReason: i % 5 === 4 ? 'SLA threshold exceeded' : undefined,
        notes: [{ text: 'Task created and assigned', author: admin._id, createdAt: new Date(Date.now() - 2*24*60*60*1000) }],
        organization: org._id
      });
    }
    await Task.insertMany(tasks);
    
    console.log('Creating alerts (12)...');
    const alerts = [];
    const alertTypes = ['sla_breach', 'anomaly', 'threshold', 'system'];
    const severities = ['low', 'medium', 'high', 'critical'];
    for (let i = 0; i < 12; i++) {
      alerts.push({
        alertId: `ALT${String(i+1).padStart(5, '0')}`,
        type: alertTypes[i % 4],
        severity: severities[i % 4],
        title: [
          'Temperature threshold exceeded in CC001',
          'Unusual fat content detected in batch',
          'Tanker TNK001 delayed beyond SLA',
          'System: Database backup completed',
          'Chilling time exceeded for 3 lots',
          'Payment processing delayed',
          'Low stock alert: Full Cream Milk',
          'Quality test failure rate spike',
          'Farmer collection volume drop',
          'Transport temperature warning',
          'Equipment maintenance overdue',
          'High rejection rate at CC002'
        ][i],
        message: `Alert generated at ${new Date().toISOString()}. Requires immediate attention.`,
        relatedEntity: { type: ['CollectionCentre', 'Batch', 'Tanker', 'System'][i % 4], id: centres[0]._id },
        acknowledged: i < 4,
        acknowledgedBy: i < 4 ? manager._id : undefined,
        acknowledgedAt: i < 4 ? new Date() : undefined,
        resolvedAt: i < 2 ? new Date() : undefined,
        organization: org._id
      });
    }
    await Alert.insertMany(alerts);
    
    console.log('Creating anomaly events (8)...');
    const anomalies = [
      { type: 'quality_deviation', severity: 'high', description: 'Fat content 40% below average for farmer FRM0003', metrics: { expected: 4.5, actual: 2.7, deviation: 40 }, riskScore: 78, factors: [{ name: 'fat_deviation', weight: 0.6, value: 40 }, { name: 'historical_trend', weight: 0.4, value: 25 }], status: 'detected' },
      { type: 'volume_anomaly', severity: 'medium', description: 'Collection volume dropped 35% at CC002', metrics: { expected: 1800, actual: 1170, deviation: 35 }, riskScore: 62, factors: [{ name: 'volume_drop', weight: 0.7, value: 35 }, { name: 'seasonal_adjustment', weight: 0.3, value: 10 }], status: 'investigating' },
      { type: 'temperature_alert', severity: 'critical', description: 'Tanker TNK003 temperature exceeded 6°C during transit', metrics: { expected: 4.0, actual: 7.2, deviation: 80 }, riskScore: 92, factors: [{ name: 'temp_deviation', weight: 0.8, value: 80 }, { name: 'duration', weight: 0.2, value: 45 }], status: 'detected' },
      { type: 'adulteration_suspected', severity: 'critical', description: 'Possible water adulteration detected in lot from FRM0008', metrics: { expected: 1.030, actual: 1.024, deviation: 18 }, riskScore: 88, factors: [{ name: 'density_deviation', weight: 0.5, value: 18 }, { name: 'snf_drop', weight: 0.3, value: 12 }, { name: 'history', weight: 0.2, value: 5 }], status: 'detected' },
      { type: 'yield_anomaly', severity: 'medium', description: 'Plant yield dropped below 85% for batch BATCH0005', metrics: { expected: 92, actual: 81, deviation: 12 }, riskScore: 55, factors: [{ name: 'yield_drop', weight: 0.7, value: 12 }, { name: 'input_quality', weight: 0.3, value: 8 }], status: 'resolved' },
      { type: 'payment_discrepancy', severity: 'low', description: 'Payment calculation mismatch for farmer FRM0005', metrics: { expected: 12500, actual: 12200, deviation: 2.4 }, riskScore: 30, factors: [{ name: 'amount_diff', weight: 0.8, value: 2.4 }, { name: 'frequency', weight: 0.2, value: 1 }], status: 'resolved' },
      { type: 'spoilage_risk', severity: 'high', description: '3 inventory items approaching expiry within 48 hours', metrics: { expected: 14, actual: 2, deviation: 85 }, riskScore: 75, factors: [{ name: 'days_to_expiry', weight: 0.7, value: 85 }, { name: 'quantity', weight: 0.3, value: 60 }], status: 'detected' },
      { type: 'collection_pattern', severity: 'low', description: 'Farmer FRM0012 showing consistent decline over 2 weeks', metrics: { expected: 18, actual: 12, deviation: 33 }, riskScore: 40, factors: [{ name: 'trend_decline', weight: 0.6, value: 33 }, { name: 'cattle_health', weight: 0.4, value: 20 }], status: 'investigating' }
    ];
    await AnomalyEvent.insertMany(anomalies.map((a, i) => ({
      ...a,
      anomalyId: `ANM${String(i+1).padStart(5, '0')}`,
      detectedAt: new Date(Date.now() - i * 4*60*60*1000),
      entity: { type: 'MilkLot', id: createdMilkLots[i]._id },
      explanation: `Anomaly detected based on statistical analysis of historical data. ${a.description}`,
      resolvedBy: a.status === 'resolved' ? manager._id : undefined,
      resolvedAt: a.status === 'resolved' ? new Date() : undefined,
      resolution: a.status === 'resolved' ? 'Issue investigated and resolved. Root cause identified and corrective action taken.' : undefined,
      organization: org._id
    })));
    
    console.log('Creating approvals (5)...');
    await Approval.insertMany([
      { approvalId: 'APR00001', type: 'ai_recommendation', title: 'Increase collection frequency at CC002', description: 'AI recommends increasing morning collection runs', requester: analyst._id, status: 'pending', aiRecommendation: { action: 'Increase morning collection frequency from 1 to 2 runs at CC002', confidence: 0.85, reasoning: 'Volume analysis shows 30% of morning milk is delayed, causing quality degradation', modelVersion: '1.0.0' }, relatedEntity: { type: 'CollectionCentre', id: centres[1]._id }, organization: org._id },
      { approvalId: 'APR00002', type: 'payment', title: 'Approve payment batch for July 2026', description: 'Monthly payment approval for 10 farmers', requester: manager._id, reviewer: admin._id, reviewedAt: new Date(), status: 'approved', relatedEntity: { type: 'Payment', id: null }, organization: org._id },
      { approvalId: 'APR00003', type: 'anomaly_action', title: 'Suspend collection from FRM0008', description: 'AI detected possible adulteration, recommends temporary suspension', requester: analyst._id, status: 'pending', aiRecommendation: { action: 'Temporarily suspend collection from farmer FRM0008 pending investigation', confidence: 0.78, reasoning: 'Density and SNF values indicate possible water adulteration in 3 consecutive lots', modelVersion: '1.0.0' }, relatedEntity: { type: 'Farmer', id: farmers[7]._id }, organization: org._id },
      { approvalId: 'APR00004', type: 'quality_override', title: 'Override quality rejection for lot LOT000045', description: 'Manager requests override of automated quality rejection', requester: manager._id, reviewer: admin._id, reviewedAt: new Date(), status: 'overridden', overrideReason: 'Border-line values within acceptable seasonal variation range', relatedEntity: { type: 'MilkLot', id: createdMilkLots[44] ? createdMilkLots[44]._id : createdMilkLots[0]._id }, organization: org._id },
      { approvalId: 'APR00005', type: 'ai_recommendation', title: 'Reroute Tanker TNK003 via Petlad', description: 'AI recommends route change to optimize delivery time', requester: analyst._id, status: 'rejected', aiRecommendation: { action: 'Reroute TNK003 to pick up from CC003 before CC001', confidence: 0.72, reasoning: 'Traffic analysis suggests 25% time saving with alternate route', modelVersion: '1.0.0' }, relatedEntity: { type: 'Tanker', id: tankers[2]._id }, organization: org._id }
    ]);
    
    console.log('Creating AI runs (4)...');
    await AiRun.insertMany([
      { runId: 'AIR00001', type: 'risk_score', modelVersion: '1.0.0', input: { type: 'anomaly_detection', snapshot: { period: 'daily', entityCount: 15 } }, output: { result: { anomaliesDetected: 8, avgRiskScore: 65 }, confidence: 0.82, reasoning: 'Analyzed 15 entities across quality, volume and temperature parameters' }, status: 'completed', executionTimeMs: 1250, tokenUsage: { prompt: 450, completion: 320 }, user: analyst._id, organization: org._id },
      { runId: 'AIR00002', type: 'forecast', modelVersion: '1.0.0', input: { type: 'demand_forecast', snapshot: { period: 'daily', horizon: 7, historicalDays: 30 } }, output: { result: { avgPredicted: 4200, trend: 'increasing' }, confidence: 0.78, reasoning: 'Based on 30-day moving average with seasonal adjustment' }, status: 'completed', executionTimeMs: 890, tokenUsage: { prompt: 380, completion: 250 }, user: analyst._id, organization: org._id },
      { runId: 'AIR00003', type: 'explanation', modelVersion: '1.0.0', input: { type: 'quality_explanation', snapshot: { entityType: 'QualityTest', entityId: 'QT00001' } }, output: { result: { explanation: 'The quality test shows above-average fat content suggesting well-fed cattle and proper handling.' }, confidence: 0.9, reasoning: 'Analysis based on historical quality data for this farmer and regional averages' }, status: 'completed', executionTimeMs: 2100, tokenUsage: { prompt: 520, completion: 410 }, user: analyst._id, organization: org._id },
      { runId: 'AIR00004', type: 'recommendation', modelVersion: '1.0.0', input: { type: 'preventive_action', snapshot: { entityType: 'CollectionCentre', entityId: 'CC002' } }, output: { result: { recommendation: 'Increase morning collection frequency and schedule equipment maintenance for fat analyzer' }, confidence: 0.85, reasoning: 'CC002 showing declining quality test accuracy correlated with equipment maintenance schedule' }, status: 'completed', executionTimeMs: 1800, tokenUsage: { prompt: 480, completion: 350 }, user: analyst._id, organization: org._id }
    ]);
    
    console.log('Creating notifications...');
    const notifications = [];
    const notifTypes = ['alert', 'task', 'approval', 'anomaly', 'sla_breach', 'system'];
    for (let i = 0; i < 15; i++) {
      notifications.push({
        type: notifTypes[i % 6],
        title: [
          'New alert: Temperature threshold exceeded',
          'New task assigned to you',
          'Approval request: Payment batch',
          'Anomaly detected: Quality deviation',
          'SLA Breach: Collection to chilling time',
          'System update: Backup completed',
          'Alert resolved: Tanker delay',
          'Task completed: Quality check',
          'Approval approved: Route change',
          'New anomaly: Volume drop',
          'SLA Warning: Processing time',
          'System: New user registered',
          'Alert: Low stock warning',
          'Task escalated: Equipment maintenance',
          'Payment disbursed successfully'
        ][i],
        message: `Notification generated at ${new Date(Date.now() - i * 2*60*60*1000).toISOString()}`,
        recipient: [admin._id, manager._id, analyst._id, fieldStaff._id][i % 4],
        read: i < 5,
        readAt: i < 5 ? new Date() : undefined,
        priority: ['low', 'medium', 'high'][i % 3],
        organization: org._id
      });
    }
    await Notification.insertMany(notifications);
    
    console.log('Creating operational events...');
    const opEvents = [];
    for (let i = 0; i < 20; i++) {
      const stages = ['collection', 'testing', 'chilling', 'transport', 'processing', 'packaging', 'distribution', 'settlement', 'farmer_support'];
      opEvents.push({
        eventType: ['milk_collected', 'quality_tested', 'milk_chilled', 'tanker_dispatched', 'batch_started', 'batch_packaged', 'order_dispatched', 'payment_processed', 'farmer_query'][i % 9],
        stage: stages[i % 9],
        description: `Operational event #${i+1}`,
        entity: { type: 'MilkLot', id: createdMilkLots[i % createdMilkLots.length]._id },
        metrics: { quantity: Math.floor(Math.random() * 100) + 10, duration: Math.floor(Math.random() * 120) + 10 },
        user: [fieldStaff._id, fieldStaff2._id, manager._id][i % 3],
        organization: org._id
      });
    }
    await OperationalEvent.insertMany(opEvents);
    
    console.log('Creating KPI snapshots (30 days)...');
    const kpiSnapshots = [];
    for (let day = 0; day < 30; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(23, 59, 59, 0);
      
      kpiSnapshots.push({
        date,
        period: 'daily',
        metrics: {
          collectionVolume: Math.floor(3500 + Math.random() * 1500 + day * 10),
          avgFat: parseFloat((3.8 + Math.random() * 0.8).toFixed(1)),
          avgSnf: parseFloat((8.0 + Math.random() * 0.8).toFixed(1)),
          rejectionRate: parseFloat((2 + Math.random() * 5).toFixed(1)),
          avgChillingTime: Math.floor(60 + Math.random() * 60),
          plantYield: parseFloat((87 + Math.random() * 8).toFixed(1)),
          spoilageRate: parseFloat((0.5 + Math.random() * 3).toFixed(1)),
          deliverySlaCompliance: parseFloat((85 + Math.random() * 13).toFixed(1)),
          paymentAccuracy: parseFloat((94 + Math.random() * 5).toFixed(1)),
          activeFarmers: Math.floor(10 + Math.random() * 5),
          activeRoutes: Math.floor(2 + Math.random() * 3)
        },
        organization: org._id
      });
    }
    await KpiSnapshot.insertMany(kpiSnapshots);
    
    console.log('Creating configurations...');
    await Configuration.insertMany([
      { key: 'milk_price_per_litre', value: 35, category: 'pricing', description: 'Base price per litre of milk (INR)', updatedBy: admin._id, organization: org._id },
      { key: 'fat_bonus_rate', value: 0.5, category: 'pricing', description: 'Bonus rate per unit fat above 3.5%', updatedBy: admin._id, organization: org._id },
      { key: 'snf_bonus_rate', value: 0.3, category: 'pricing', description: 'Bonus rate per unit SNF above 8.0%', updatedBy: admin._id, organization: org._id },
      { key: 'min_fat_threshold', value: 3.0, category: 'quality', description: 'Minimum acceptable fat percentage', updatedBy: admin._id, organization: org._id },
      { key: 'min_snf_threshold', value: 7.5, category: 'quality', description: 'Minimum acceptable SNF percentage', updatedBy: admin._id, organization: org._id },
      { key: 'max_chilling_temp', value: 6.0, category: 'quality', description: 'Maximum acceptable chilling temperature (°C)', updatedBy: admin._id, organization: org._id },
      { key: 'payment_cycle_days', value: 15, category: 'general', description: 'Payment cycle duration in days', updatedBy: admin._id, organization: org._id },
      { key: 'sla_alert_threshold', value: 80, category: 'sla', description: 'SLA compliance percentage threshold for alerts', updatedBy: admin._id, organization: org._id },
      { key: 'notification_email_enabled', value: false, category: 'notification', description: 'Enable email notifications', updatedBy: admin._id, organization: org._id },
      { key: 'anomaly_detection_sensitivity', value: 2.0, category: 'system', description: 'Standard deviation threshold for anomaly detection', updatedBy: admin._id, organization: org._id }
    ]);
    
    console.log('Creating audit logs...');
    await AuditLog.insertMany([
      { action: 'CREATE', resource: 'Organization', resourceId: org._id, user: admin._id, changes: { before: null, after: { name: org.name } }, ipAddress: '127.0.0.1', userAgent: 'Seed Script', organization: org._id },
      { action: 'CREATE', resource: 'User', resourceId: admin._id, user: admin._id, changes: { before: null, after: { email: 'admin@dairyops.com', role: 'ops_admin' } }, ipAddress: '127.0.0.1', userAgent: 'Seed Script', organization: org._id },
      { action: 'UPDATE', resource: 'Configuration', resourceId: null, user: admin._id, changes: { before: { milk_price_per_litre: 32 }, after: { milk_price_per_litre: 35 } }, ipAddress: '127.0.0.1', userAgent: 'Seed Script', organization: org._id }
    ]);
    
    console.log('\n========================================');
    console.log('SEED DATA CREATED SUCCESSFULLY!');
    console.log('========================================');
    console.log(`\nOrganization: ${org.name} (${org.code})`);
    console.log(`\nTest Login Credentials:`);
    console.log('  Ops Admin:   admin@dairyops.com    / Admin@123');
    console.log('  Manager:     manager@dairyops.com   / Manager@123');
    console.log('  Analyst:     analyst@dairyops.com   / Analyst@123');
    console.log('  Field Staff: field@dairyops.com     / Field@123');
    console.log(`\nData Created:`);
    console.log(`  Farmers: ${farmers.length}`);
    console.log(`  Collection Centres: ${centres.length}`);
    console.log(`  Milk Lots: ${createdMilkLots.length}`);
    console.log(`  Quality Tests: ${qualityTests.length}`);
    console.log(`  Tankers: ${tankers.length}`);
    console.log(`  Batches: ${createdBatches.length}`);
    console.log(`  Products: ${products.length}`);
    console.log(`  Inventory Items: ${inventoryItems.length}`);
    console.log(`  Payments: ${payments.length}`);
    console.log(`  Tasks: 20`);
    console.log(`  SLA Rules: ${slaRules.length}`);
    console.log(`  Alerts: 12`);
    console.log(`  Anomaly Events: 8`);
    console.log(`  Approvals: 5`);
    console.log(`  AI Runs: 4`);
    console.log(`  Notifications: 15`);
    console.log(`  KPI Snapshots: 30`);
    console.log(`  Configurations: 10`);
    console.log(`  Audit Logs: 3`);
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
