const it = require('ava').default;
const chai = require('chai');
const expect = chai.expect;
const startDB = require('../helpers/DB');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { addUser } = require('../controllers/user');
const sinon = require('sinon');
const utils = require('../helpers/utils');
const User = require('../models/user');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing i can't test with bcrypt what i do 

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
    const expectedResult = {
        fullName,
        age: 30,
        job: "developer",
        email: 'menna.hamdy@gmail.com',
        password: '12345678Aa' // Plain text password
    };

    // Exercise
    const stub1 = sinon.stub(utils, 'getFullName').callsFake((fname, lname) => {
        expect(fname).to.equal(request.body.firstName);
        expect(lname).to.equal(request.body.lastName);
        return fullName;
    });

    t.teardown(async () => {
        await User.deleteMany({
            fullName: request.body.fullName,
        });
        stub1.restore();
    });

    const actualResult = await addUser(request);
    
    // Verify
    expect(actualResult.fullName).to.equal(expectedResult.fullName);
    expect(actualResult.age).to.equal(expectedResult.age);
    expect(actualResult.job).to.equal(expectedResult.job);
    expect(actualResult.email).to.equal(expectedResult.email);
    expect(actualResult.password).to.equal(expectedResult.password); // Validate password (plain text comparison)
    t.pass();
}, { timeout: 1000 });
