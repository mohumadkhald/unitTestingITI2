module.exports = {
    files: [
        'tests/**/*.js', // Specify the file pattern for your test files
    ],
    sources: [
        '**/*.js', // Specify the file pattern for your source files
    ],
    failFast: true, // Abort the test run on first failure
    concurrency: 4, // Limit the number of concurrent test files
    timeout: '10s', // Set a timeout of 10 seconds for each test
    // Add any other Ava configuration options here
};



// I Try Make This File To Solve Time Out But I Faild