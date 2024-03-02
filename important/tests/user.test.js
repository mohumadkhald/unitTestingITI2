const it = require('ava').default;
const chai = require('chai');
const expect = chai.expect;
const startDB = require('../helpers/DB');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { addUser } = require('../controllers/user');
const sinon = require('sinon');
const utils = require('../helpers/utils');
const User = require('../models/user');
const bcrypt = require('bcrypt');

it.before(async (t) => {
    t.context.mongod = await MongoMemoryServer.create();
    process.env.MONGOURI = t.context.mongod.getUri('itiUnitTesting');
    await startDB();
});

it.after.always(async (t) => {
    if (t.context.mongod) {
        await t.context.mongod.stop({ doCleanUp: true });
    }
});

it('should create one user', async (t) => {
    // Setup
    const fullName = 'menna hamdy';
    const request = {
        body: {
            "firstName": "menna",
            "lastName": "hamdy",
            "age": 30,
            "job": "developer",
            "email": 'menna.hamdy@gmail.com',
            "password": '12345678Aa' // Plain text password
        }
    };

    const expectedUser = {
        fullName,
        age: 30,
        job: "developer",
        email: 'menna.hamdy@gmail.com',
        password: request.body.password // Plain text password
    };

    // Mocking the bcrypt.hash function
    sinon.stub(bcrypt, 'hash').resolves(expectedUser.password);

    // Mocking the utils.getFullName function
    sinon.stub(utils, 'getFullName').returns(fullName);

    // Teardown to clean up the database after the test
    t.teardown(async () => {
        await User.deleteMany({ email: request.body.email });
        bcrypt.hash.restore();
        utils.getFullName.restore();
    });

    // Exercise
    const actualUser = await addUser(request);

    // Verify
    expect(actualUser.fullName).to.equal(expectedUser.fullName);
    expect(actualUser.age).to.equal(expectedUser.age);
    expect(actualUser.job).to.equal(expectedUser.job);
    expect(actualUser.email).to.equal(expectedUser.email);
    expect(actualUser.password).to.equal(expectedUser.password); // Validate password (plain text comparison)

    // Check if user is present in the database
    const userInDB = await User.findOne({ email: request.body.email });
    expect(userInDB).to.exist; // Ensure user exists in the database

    t.pass();
});
