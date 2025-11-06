const dotenv = require("dotenv");
dotenv.config();

// Set AWS profile if specified in environment
if (process.env.AWS_PROFILE) {
    process.env.AWS_PROFILE = process.env.AWS_PROFILE;
    console.log(`Using AWS Profile: ${process.env.AWS_PROFILE}`);
}

const http = require('http');
const serverless = require("serverless-http");
const express = require('express');
const cors = require('cors');
const config = require('./config');

require('express-async-errors');
const app = express();
const bodyParser = require('body-parser');
const { superadminRouter, authRouter, adminRouter } = require('./utility/routes');
const { validateAWSToken, checkToken } = require('./controller/auth-controller');


app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
app.use(cors());
app.use(bodyParser.json({ strict: false }));

// Mount API routes under the configured base path
app.use('/v1/auth', authRouter);
app.use('/v1/superadmin', superadminRouter);
app.use('/v1/admin', adminRouter);
// Retailer, rider, LSP, and public routes removed - add them back when controllers are created
//app.use(API_BASE_PATH, router);  // Root router with minimal endpoints

// Add a redirect from root to API base path for convenience
/* app.get('/', (req, res) => {
    res.redirect(API_BASE_PATH);
});*/

app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

app.use((err, req, res, next) => {
    console.error(err);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Something went wrong!',
    });
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// This function is called by Cognito before token generation to add custom claims
const preTokenGenerationHandler = async (event) => {
    console.log('preTokenGenerationHandler event:', event);
    const userAttributes = event.request.userAttributes;
    
    event.response = {
        claimsOverrideDetails: {
            claimsToAddOrOverride: {
                'custom:isVerified': userAttributes['custom:isVerified'] || userAttributes.isVerified,
                'custom:organizationType': userAttributes['custom:organizationType'] || userAttributes.organizationType,
                'custom:role': userAttributes['custom:role'] || userAttributes.role,
                'custom:organizationId': userAttributes['custom:organizationId'] || userAttributes.organizationId
            }
        }
    };
    return event;
};

// Start the server if PORT is defined (either from environment or config default)
if(config.PORT){
    const httpServer = http.createServer(app);
    httpServer.listen(config.PORT, () => {
        console.log(`Server is running on port ${config.PORT}`);
    });
}

// For Lambda functions
module.exports.handler = serverless(app);
module.exports.preTokenGenerationHandler = preTokenGenerationHandler;
