const bcrypt = require('bcrypt');
const utils = require('../helpers/utils');
const User = require('../models/user');
const UserValidator = require('../helpers/UserValidator');


const addUser = async (request, reply) => {
    try {
        const userBody = request.body;
        
        // Validate user input using UserValidator class
        await UserValidator.validate(userBody);
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(userBody.password, 10); // 10 is the salt rounds
        
        userBody.fullName = utils.getFullName(userBody.firstName, userBody.lastName);
        
        // Remove firstName and lastName from the userBody object
        delete userBody.firstName;
        delete userBody.lastName;
        
        // Update the password field with the hashed password
        userBody.password = hashedPassword;
        
        // Create a new User instance with the modified userBody
        const user = new User(userBody);
        
        // Save the user to the database
        const addedUser = await user.save();
        
        return addedUser;
        
    } catch (error) {
        // Handle validation errors or any other errors
        throw new Error(error.message);
    }
};



const getUsers = async (request, reply) => {
    try {
        const users = await User.find();
        return users;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getSingleUser = async (request, reply) => {
    try {
        const userId = request.params.id;
        const user = await User.findById(userId);
        if (!user) {
            reply.code(404);
            throw new Error('User not found');
        }
        return user;
    } catch (error) {
        throw new Error(error.message);
    }
};

const updateUser = async (request, reply) => {
    try {
        const userId = request.params.id;
        const userBody = request.body;

        // Validate user input using UserValidator class
        await UserValidator.validate(userBody, isupdate = true);

        userBody.fullName = utils.getFullName(userBody.firstName, userBody.lastName);
        delete userBody.firstName;
        delete userBody.lastName;

        const updatedUser = await User.findByIdAndUpdate(userId, userBody, { new: true });
        if (!updatedUser) {
            reply.code(404);
            throw new Error('User not found');
        }
        return updatedUser;
    } catch (error) {
        throw new Error(error.message);
    }
};

const deleteUser = async (request, reply) => {
    try {
        const userId = request.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            reply.code(404);
            throw new Error('User not found');
        }
        return deletedUser;
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = {
    addUser,
    getUsers,
    getSingleUser,
    updateUser,
    deleteUser
};
