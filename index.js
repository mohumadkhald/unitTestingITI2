const fastify = require('fastify')({ logger: true });
const formbody = require('@fastify/formbody');
const startDB = require('./helpers/DB');
const userRoutes = require('./routes/user');
const multer = require('fastify-multer');

// Register plugins
fastify.register(formbody);
fastify.register(multer.contentParser);

// Register database connection
fastify.register(startDB);

// Register routes
userRoutes.forEach((route) => {
    fastify.route(route);
});




// Start the server
fastify.listen(5000, (err) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    fastify.log.info(`Server listening on port ${fastify.server.address().port}`);
});
