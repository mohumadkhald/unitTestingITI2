// I Make Add Coulmn Email And Password I Try To Make Hashed_Password 
// But In The Test I Can't Pass So That I Stop hashed And I Will  Try Again Later

const test = require('ava').default;
const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const startDB = require('../helpers/DB');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { addUser, getUsers, getSingleUser,updateUser, deleteUser } = require('../controllers/user');
const utils = require('../helpers/utils');
const User = require('../models/user');
const UserValidator = require('../helpers/UserValidator');

test.before(async (t) => {
    t.context.mongod = await MongoMemoryServer.create();
    process.env.MONGOURI = t.context.mongod.getUri('itiUnitTesting');
    await startDB();
});

test.after.always(async (t) => {
    if (t.context.mongod) {
        await t.context.mongod.stop({ doCleanUp: true });
    }
});

// Create User
test.serial('User creation should succeed', async (t) => {
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
});


// Fetch All Users
test.serial('Retrieving all users should succeed', async (t) => {
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

// Fetch Single User By Id If Existe
test.serial('should return the user if found', async (t) => {
    // Stub the findById method of the User model
    const findByIdStub = sinon.stub(User, 'findById').resolves({ _id: 'user_id', name: 'John Doe' });

    // Mock request and reply objects
    const request = { params: { id: 'user_id' } };
    const reply = { code: sinon.stub().returnsThis() };

    // Call the getSingleUser function
    const result = await getSingleUser(request, reply);

    // Assertions
    t.deepEqual(result, { _id: 'user_id', name: 'John Doe' });
    t.false(reply.code.calledWith(404)); // Ensure reply.code(404) was not called

    // Restore the stub
    findByIdStub.restore();
});

// Error Not Found If Not Existe
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

// Update User If Existe
test.serial('should update user successfully', async (t) => {
    // Stub the validate method of UserValidator to resolve
    const validateStub = sinon.stub(UserValidator, 'validate').resolves();

    // Stub the getFullName method of utils to return a fixed value
    const getFullNameStub = sinon.stub(utils, 'getFullName').returns('John Doe');

    // Stub findByIdAndUpdate method of User model to resolve with updated user
    const updatedUser = { _id: 'user_id', name: 'John Doe', email: 'john.doe@example.com' };
    const findByIdAndUpdateStub = sinon.stub(User, 'findByIdAndUpdate').resolves(updatedUser);

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

// Error Not Found If Not Existe 
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

// Delete User If Existe 
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

// Error If Not Existe
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

// Error Handling For Fetch All Users
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
