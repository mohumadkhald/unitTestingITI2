const { addUser, getUsers, getSingleUser, updateUser, deleteUser } = require("../controllers/user");

const routes = [
    {
        method: 'POST',
        url: '/api/users',
        handler: addUser
    },
    {
        method: 'GET',
        url: '/api/users',
        handler: getUsers
    },
    {
        method: 'GET',
        url: '/api/users/:id',
        handler: getSingleUser
    },
    {
        method: 'PUT',
        url: '/api/users/:id',
        handler: updateUser
    },
    {
        method: 'DELETE',
        url: '/api/users/:id',
        handler: deleteUser
    }
];

module.exports = routes;
