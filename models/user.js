const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    age: Number,
    job: String,
});

module.exports = mongoose.model('User', userSchema);