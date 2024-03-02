const test = require('ava').default;
const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const { addUser, getUsers, getSingleUser, updateUser, deleteUser } = require('../controllers/user');
const User = require('../models/user');
const utils = require('../helpers/utils');
const UserValidator = require('../helpers/UserValidator');


test.before(async (t) => {
    t.context.mongod = await MongoMemoryServer.create();
    process.env.MONGOURI = t.context.mongod.getUri('itiUnitTesting');
    await mongoose.connect(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true });
});

test.after.always(async (t) => {
    if (t.context.mongod) {
        await mongoose.disconnect();
        await t.context.mongod.stop();
    }
});

const hashedPassword = '$2b$10$FAeAlrYr9VcMrjzDL2BD/.qKY.Ky2C2GxFQ00gqGz7wfl7ZU7nIrC';

test('User creation should succeed', async (t) => {
    const fullName = 'menna hamdy';
    const request = {
        body: {
            "firstName": "menna",
            "lastName": "hamdy",
            "age": 30,
            "job": "developer",
            "email": "menna.hamdy@gmail.com",
            "password": "12345678Aa" // Plain text password
        }
    };
    const expectedResult = {
        fullName,
        age: 30,
        job: "developer",
        email: 'menna.hamdy@gmail.com',
        password: hashedPassword // Using hashed password instead of plain text password
    };

    // Stub bcrypt.hash to return the mock hashed password
    const bcryptHashStub = sinon.stub(bcrypt, 'hash').resolves(hashedPassword);

    // Stub utils.getFullName to return the mock full name
    const stub1 = sinon.stub(utils, 'getFullName').callsFake((fname, lname) => {
        expect(fname).to.equal(request.body.firstName);
        expect(lname).to.equal(request.body.lastName);
        return fullName;
    });

    // Teardown function to clean up after the test
    t.teardown(async () => {
        await User.deleteMany({
            fullName: request.body.fullName,
        });
        stub1.restore();
        bcryptHashStub.restore();
    });

    // Execute the addUser function
    const actualResult = await addUser(request);

    // Verify
    t.is(actualResult.fullName, expectedResult.fullName);
    t.is(actualResult.age, expectedResult.age);
    t.is(actualResult.job, expectedResult.job);
    t.is(actualResult.email, expectedResult.email);
    t.is(actualResult.password, expectedResult.password);
});

test('Retrieving all users should succeed', async (t) => {
    // Setup
    const mockUsers = [
        {
            fullName: 'John Doe',
            age: 30,
            job: 'Engineer',
            email: 'john.doe@example.com',
            password: '12345678Aa'
        },
        {
            fullName: 'Jane Smith',
            age: 35,
            job: 'Designer',
            email: 'jane.smith@example.com',
            password: '12345678Aa'
        }
    ];
    const findStub = sinon.stub(User, 'find').resolves(mockUsers);
    t.teardown(() => findStub.restore());

    // Exercise
    const result = await getUsers();

    // Verify
    t.deepEqual(result, mockUsers);
});

test.serial('Error handling when getting users should work', async (t) => {
    // Setup
    const errorMessage = 'Error fetching users';
    const error = new Error(errorMessage);
    const findStub = sinon.stub(User, 'find').rejects(error);
    t.teardown(() => findStub.restore());

    // Exercise and Verify
    const errorResult = await t.throwsAsync(getUsers());
    t.is(errorResult.message, errorMessage);
});

test('should return the single user if found', async (t) => {
    // Stub the findById method of the User model
    const user = { _id: 'user_id', name: "menna hamdy" };
    const findByIdStub = sinon.stub(User, 'findById').resolves(user);

    // Mock request object
    const request = { params: { id: 'user_id' } };

    // Call the getSingleUser function
    const result = await getSingleUser(request);

    // Assertions
    t.deepEqual(result, user);

    // Restore the stub
    findByIdStub.restore();
});

test.serial('should return 404 if user is not found', async (t) => {
    // Stub the findById method of the User model to return null
    const findByIdStub = sinon.stub(User, 'findById').resolves(null);

    // Mock request and reply objects
    const request = { params: { id: 'user_id' } };
    const reply = { code: sinon.stub().returnsThis() };

    // Call the getSingleUser function
    try {
        await getSingleUser(request, reply);
        // If the function call does not throw an error, fail the test
        t.fail('Expected an error to be thrown');
    } catch (error) {
        // Assertions
        t.is(error.message, 'User not found');
        t.true(reply.code.calledWith(404)); // Ensure reply.code(404) was called
    }

    // Restore the stub
    findByIdStub.restore();
});


test.serial('should update user successfully', async (t) => {
    // Stub the validate method of UserValidator to resolve
    const validateStub = sinon.stub(UserValidator, 'validate').resolves();

    // Stub the getFullName method of utils to return a fixed value
    const getFullNameStub = sinon.stub(utils, 'getFullName').returns('John Doe');

    // Stub findByIdAndUpdate method of User model to resolve with updated user
    const updatedUser = { _id: 'user_id', name: 'John Doe', email: 'john.doe@example.com' };
    const findByIdAndUpdateStub = sinon.stub(User, 'findByIdAndUpdate').callsFake(async (userId, updateData) => {
        // Hash the new password before updating the user
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        return updatedUser;
    });

    // Mock request and reply objects
    const request = { params: { id: 'user_id' }, body: { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', password: 'newpassword' } };
    const reply = { code: sinon.stub().returnsThis() };

    // Call the updateUser function
    const result = await updateUser(request, reply);

    // Assertions
    t.deepEqual(result, updatedUser);
    t.false(reply.code.calledWith(404)); // Ensure reply.code(404) was not called

    // Restore the stubs
    validateStub.restore();
    getFullNameStub.restore();
    findByIdAndUpdateStub.restore();
});

test.serial('should return 404 if user to update is not found', async (t) => {
    // Stub the findByIdAndUpdate method of the User model to resolve with null
    const findByIdAndUpdateStub = sinon.stub(User, 'findByIdAndUpdate').resolves(null);

    // Mock request and reply objects
    const request = { params: { id: 'user_id' }, body: { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', password: '12345678Aa' } };
    const reply = { code: sinon.stub().returnsThis() };

    // Call the updateUser function
    try {
        await updateUser(request, reply);
        // If the function call does not throw an error, fail the test
        t.fail('Expected an error to be thrown');
    } catch (error) {
        // Assertions
        t.is(error.message, 'User not found');
        t.true(reply.code.calledWith(404)); // Ensure reply.code(404) was called
    }

    // Restore the stub
    findByIdAndUpdateStub.restore();
});



test.serial('should delete user successfully', async (t) => {
    // Stub the findByIdAndDelete method of the User model to resolve with deleted user
    const deletedUser = { _id: 'user_id', name: 'John Doe' };
    const findByIdAndDeleteStub = sinon.stub(User, 'findByIdAndDelete').resolves(deletedUser);

    // Mock request and reply objects
    const request = { params: { id: 'user_id' } };
    const reply = { code: sinon.stub().returnsThis() };

    // Call the deleteUser function
    const result = await deleteUser(request, reply);

    // Assertions
    t.deepEqual(result, deletedUser);
    t.false(reply.code.calledWith(404)); // Ensure reply.code(404) was not called

    // Restore the stub
    findByIdAndDeleteStub.restore();
});


test.serial('should return 404 if user to delete is not found', async (t) => {
    // Stub the findByIdAndDelete method of the User model to resolve with null
    const findByIdAndDeleteStub = sinon.stub(User, 'findByIdAndDelete').resolves(null);

    // Mock request and reply objects
    const request = { params: { id: 'user_id' } };
    const reply = { code: sinon.stub().returnsThis() };

    // Call the deleteUser function
    try {
        await deleteUser(request, reply);
        // If the function call does not throw an error, fail the test
        t.fail('Expected an error to be thrown');
    } catch (error) {
        // Assertions
        t.is(error.message, 'User not found');
        t.true(reply.code.calledWith(404)); // Ensure reply.code(404) was called
    }

    // Restore the stub
    findByIdAndDeleteStub.restore();
});


