const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Organization = require('../../src/models/Organization');
const Role = require('../../src/models/Role');
const User = require('../../src/models/User');
const app = require('../../src/app');

const mongoUri = process.env.TEST_MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;

if (!mongoUri) {
  throw new Error('TEST_MONGODB_URI is required for integration tests');
}
if (!jwtSecret) {
  throw new Error('JWT_SECRET is required for integration tests');
}

const testDbName = `dairy_predictive_test_${process.pid}`;
let server;
let baseUrl;
let organization;
let adminUser;
let managerUser;
let fieldUser;

const request = (method, path, body, token) => new Promise((resolve, reject) => {
  const url = new URL(path, baseUrl);
  const payload = body === undefined ? null : JSON.stringify(body);

  const req = http.request(url, {
    method,
    headers: {
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }, (res) => {
    let data = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      let parsed;
      try { parsed = data ? JSON.parse(data) : null; } catch { parsed = data; }
      resolve({ status: res.statusCode, body: parsed });
    });
  });

  req.on('error', reject);
  if (payload) req.write(payload);
  req.end();
});

const tokenFor = (user) => jwt.sign(
  { id: user._id, role: user.role, organization: user.organization },
  jwtSecret,
  { expiresIn: '15m' }
);

test.before(async () => {
  process.env.NODE_ENV = 'test';
  await mongoose.connect(mongoUri, { dbName: testDbName });

  organization = await Organization.create({
    name: `Integration Test ${process.pid}`,
    code: `TEST-${process.pid}-${Date.now()}`,
    contactEmail: 'integration-test@example.invalid'
  });

  const permissions = [
    { resource: '*', actions: ['create', 'read', 'update', 'delete'] }
  ];
  const readOnlyUsers = [
    { resource: 'users', actions: ['read'] }
  ];

  await Role.create([
    {
      name: 'ops_admin',
      displayName: 'Operations Administrator',
      organization: organization._id,
      isSystem: true,
      permissions
    },
    {
      name: 'manager',
      displayName: 'Manager',
      organization: organization._id,
      permissions: readOnlyUsers
    },
    {
      name: 'field_staff',
      displayName: 'Field Staff',
      organization: organization._id,
      permissions: []
    }
  ]);

  adminUser = await User.create({
    firstName: 'Integration',
    lastName: 'Admin',
    email: `admin-${process.pid}@example.invalid`,
    password: 'AdminTest123',
    role: 'ops_admin',
    organization: organization._id
  });

  managerUser = await User.create({
    firstName: 'Integration',
    lastName: 'Manager',
    email: `manager-${process.pid}@example.invalid`,
    password: 'ManagerTest123',
    role: 'manager',
    organization: organization._id
  });

  fieldUser = await User.create({
    firstName: 'Integration',
    lastName: 'Field',
    email: `field-${process.pid}@example.invalid`,
    password: 'FieldTest123',
    role: 'field_staff',
    organization: organization._id
  });

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (organization) {
    await Promise.all([
      User.deleteMany({ organization: organization._id }),
      Role.deleteMany({ organization: organization._id })
    ]);
    await Organization.deleteOne({ _id: organization._id });
  }
  await mongoose.disconnect();
});

test('rejects unauthenticated access to protected APIs', async () => {
  const response = await request('GET', '/api/v1/users');
  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('allows an ops_admin to read users through the database-backed permission', async () => {
  const response = await request('GET', '/api/v1/users', undefined, tokenFor(adminUser));
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.data.items));
});

test('denies a manager when route authorization allows the role but its permission does not allow the operation', async () => {
  const response = await request('POST', '/api/v1/users', {
    firstName: 'Should',
    lastName: 'Fail',
    email: `blocked-${process.pid}@example.invalid`,
    password: 'BlockedTest123',
    role: 'field_staff'
  }, tokenFor(managerUser));

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

test('denies a role with no permissions before the controller is reached', async () => {
  const response = await request('GET', '/api/v1/users', undefined, tokenFor(fieldUser));
  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
});

test('rejects a token for a nonexistent user', async () => {
  const token = jwt.sign({ id: new mongoose.Types.ObjectId(), role: 'ops_admin', organization: organization._id }, jwtSecret, { expiresIn: '15m' });
  const response = await request('GET', '/api/v1/users', undefined, token);
  assert.equal(response.status, 401);
});

test('rejects an inactive user', async () => {
  await User.updateOne({ _id: managerUser._id }, { isActive: false });
  const response = await request('GET', '/api/v1/users', undefined, tokenFor(managerUser));
  assert.equal(response.status, 401);
  await User.updateOne({ _id: managerUser._id }, { isActive: true });
});

test('enforces organization isolation for user administration', async () => {
  const otherOrganization = await Organization.create({
    name: `Other Integration Test ${process.pid}`,
    code: `OTHER-${process.pid}-${Date.now()}`
  });
  const otherUser = await User.create({
    firstName: 'Other',
    lastName: 'Organization',
    email: `other-${process.pid}@example.invalid`,
    password: 'OtherTest123',
    role: 'manager',
    organization: otherOrganization._id
  });

  const response = await request('GET', `/api/v1/users/${otherUser._id}`, undefined, tokenFor(adminUser));
  assert.equal(response.status, 404);

  await User.deleteOne({ _id: otherUser._id });
  await Organization.deleteOne({ _id: otherOrganization._id });
});

test('rejects invalid user creation payloads', async () => {
  const response = await request('POST', '/api/v1/users', {
    firstName: 'A',
    lastName: 'B',
    email: 'not-an-email',
    password: 'weak',
    role: 'not-a-role'
  }, tokenFor(adminUser));

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});
