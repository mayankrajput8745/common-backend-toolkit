# Common Backend Toolkit

[![npm version](https://img.shields.io/npm/v/common-backend-toolkit.svg)](https://www.npmjs.com/package/common-backend-toolkit)
[![downloads](https://img.shields.io/npm/dm/common-backend-toolkit.svg)](https://www.npmjs.com/package/common-backend-toolkit)
[![license](https://img.shields.io/npm/l/common-backend-toolkit.svg)](https://www.npmjs.com/package/common-backend-toolkit)

**Common Backend Toolkit** is a comprehensive Node.js library that provides reusable utilities, wrappers, and middleware for building backend applications. It simplifies common backend development tasks by offering ready-to-use integrations with popular third-party services, structured error handling, logging systems, and Express.js middleware.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
  - [Error Handling](#error-handling)
  - [Response Utilities](#response-utilities)
  - [Helpers](#helpers)
  - [Middleware](#middleware)
  - [AWS Wrappers](#aws-wrappers)
  - [Redis Wrappers](#redis-wrappers)
  - [Email Wrappers](#email-wrappers)
  - [Communication Services](#communication-services)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Authentication & Authorization** - JWT-based authentication with middleware
- **Error Handling** - Comprehensive error classes with automatic HTTP responses
- **Logging** - API request/response and error logging with Winston
- **Validation** - Joi schema validation middleware for Express
- **Cloud Storage** - AWS S3 integration with multi-bucket support
- **Email Services** - Gmail, SendGrid, and AWS SES integrations
- **SMS & Voice** - Twilio and Plivo support for communication
- **Message Queuing** - Bull/Redis job queue management
- **Message Streaming** - Apache Kafka producer/consumer wrapper
- **Caching & Pub/Sub** - Redis with advanced Pub/Sub patterns
- **Serverless** - AWS Lambda client management with multi-region support
- **Geolocation** - IP-based location detection
- **ID Generation** - CUID2-based unique ID generator

---

## Installation

Install the package using npm or yarn:

```bash
npm install common-backend-toolkit
```

or

```bash
yarn add common-backend-toolkit
```

---

## Quick Start

### Basic Express App with Toolkit

```javascript
const express = require('express');
const {
  logger,
  apiLogger,
  errorLogger,
  authentication,
  validator,
  ValidationSource,
  joi,
  successResponse,
  BadRequestError,
  GenericError
} = require('common-backend-toolkit');

const app = express();

// Middleware setup
app.use(express.json());
app.use(apiLogger);

// Public route
app.get('/health', (req, res) => {
  successResponse(res, 'Server is healthy', { uptime: process.uptime() });
});

// Protected route with authentication
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;
app.get('/profile',
  authentication(JWT_PUBLIC_KEY),
  (req, res) => {
    successResponse(res, 'Profile data', {
      userId: req.payload.userId,
      data: req.payload.data
    });
  }
);

// Route with validation
const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(6).required()
});

app.post('/login',
  validator(loginSchema, ValidationSource.BODY),
  (req, res) => {
    // Your login logic here
    successResponse(res, 'Login successful', { token: 'jwt-token' });
  }
);

// Error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
  GenericError.handle(err, res);
});

app.listen(3000, () => {
  logger.info('Server running on port 3000');
});
```

---

## API Documentation

### Error Handling

The toolkit provides a comprehensive set of error classes for different HTTP scenarios:

#### Available Error Classes

```javascript
const {
  GenericError,           // Base error class
  AuthFailureError,       // 401 - Invalid credentials
  AccessTokenError,       // 401 - Invalid access token
  BadTokenError,          // 401 - Token validation errors
  TokenExpiredError,      // 401 - Expired tokens
  InternalError,          // 500 - Server errors
  BadRequestError,        // 400 - Bad request
  NotFoundError,          // 404 - Resource not found
  NoEntryError,           // 404 - Entry doesn't exist
  NoDataError,            // 404 - No data available
  ForbiddenError,         // 403 - Permission denied
  RequestValidationError  // 400 - Validation failures
} = require('common-backend-toolkit');
```

#### Usage Example

```javascript
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await findUser(req.params.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    successResponse(res, 'User found', user);
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use((err, req, res, next) => {
  GenericError.handle(err, res);
});
```

---

### Response Utilities

Standardized HTTP response helpers for Express.js:

#### Available Response Functions

```javascript
const {
  successResponse,                    // 200 - Success with data
  successMsgResponse,                 // 200 - Success message only
  createdResponse,                    // 201 - Created
  paginatedResponse,                  // 200 - With pagination
  customResponse,                     // 200 - Custom data spread
  multiStatusResponse,                // 207 - Multi-status
  badRequestResponse,                 // 400 - Bad request
  authenticationFailureResponse,      // 401 - Authentication failed
  authorizationFailureResponse,       // 401 - Unauthorized
  forbiddenResponse,                  // 403 - Forbidden
  notFoundResponse,                   // 404 - Not found
  tooManyRequestResponse,             // 429 - Rate limit
  internalServerErrorResponse,        // 500 - Server error
  accessTokenErrorResponse,           // 401 - With refresh instruction
  noContentFoundErrorResponse,        // 204 - No content
  failureMsgResponse,                 // 500 - Generic failure
  ResponseStatusCode                  // Object with all HTTP status codes
} = require('common-backend-toolkit');
```

#### Usage Examples

```javascript
// Success response
successResponse(res, 'Data retrieved successfully', { users: [] });

// Created response
createdResponse(res, 'User created', { userId: 123 });

// Paginated response
paginatedResponse(res, 'Users list', users, {
  page: 1,
  limit: 10,
  totalPages: 5,
  totalItems: 50
});

// Error responses
notFoundResponse(res, [{ message: 'Resource not found' }]);
badRequestResponse(res, [{ field: 'email', message: 'Invalid email' }]);
```

---

### Helpers

#### JWT Helper

JWT token generation and validation utilities:

```javascript
const { JWT, JwtPayload } = require('common-backend-toolkit');

// Encode (create) a JWT token
const privateKey = process.env.JWT_PRIVATE_KEY;
const payload = new JwtPayload({
  iss: 'your-issuer',
  aud: 'your-audience',
  userId: 'user123',
  data: { role: 'admin' }
});

const token = JWT.encode(payload, privateKey, {
  expiresIn: '7d',
  algorithm: 'RS256'
});

// Decode without verification
const decoded = JWT.decode(token);

// Verify and validate
const publicKey = process.env.JWT_PUBLIC_KEY;
const validations = {
  validateAudience: true,
  validateIssuer: true
};

const verified = JWT.verify(token, publicKey, validations);
console.log(verified.userId); // 'user123'
```

#### Logger

Winston-based logging system with customizable output:

```javascript
const { logger } = require('common-backend-toolkit');

logger.info('Application started');
logger.debug('Debug information', { context: 'startup' });
logger.warn('Warning message');
logger.error('Error occurred', { error: new Error('Something went wrong') });
logger.verbose('Verbose logging');
```

#### ID Generator

Generate unique CUID2 identifiers:

```javascript
const { generateId } = require('common-backend-toolkit');

const uniqueId = generateId(); // Returns 19-character CUID2
console.log(uniqueId); // e.g., "clh2k3j4n0000qz8z"
```

#### Queue Manager

Bull queue wrapper for Redis-based job queues:

```javascript
const { getQueue, getAllQueues, removeQueue } = require('common-backend-toolkit');

// Get or create a queue
const emailQueue = getQueue('email-queue', {
  redis: {
    host: 'localhost',
    port: 6379
  }
});

// Add job to queue
await emailQueue.add('send-email', {
  to: 'user@example.com',
  subject: 'Welcome',
  body: 'Hello!'
});

// Process jobs
emailQueue.process('send-email', async (job) => {
  console.log('Processing job:', job.data);
  // Send email logic
});

// Get all queues
const allQueues = getAllQueues();

// Remove a queue
await removeQueue('email-queue');
```

#### Validator

Joi-based validation middleware for Express:

```javascript
const { validator, ValidationSource, joi, JoiCUID } = require('common-backend-toolkit');

// Define schema
const userSchema = joi.object({
  name: joi.string().min(2).max(50).required(),
  email: joi.string().email().required(),
  age: joi.number().min(18).max(120),
  userId: JoiCUID().required() // Custom CUID validator
});

// Use as middleware
app.post('/users',
  validator(userSchema, ValidationSource.BODY),
  (req, res) => {
    // req.body is validated
    successResponse(res, 'User data is valid', req.body);
  }
);

// Validation sources
// ValidationSource.BODY - req.body
// ValidationSource.HEADER - req.headers
// ValidationSource.QUERY - req.query
// ValidationSource.PARAM - req.params
```

---

### Middleware

#### API Logger

Express-winston middleware for API request/response logging:

```javascript
const { apiLogger } = require('common-backend-toolkit');

app.use(apiLogger);

// Automatically logs:
// - Request method, URL, headers, body
// - Response status code, body
// - Timestamp and duration
```

#### Error Logger

Express-winston error logging middleware with enhanced context:

```javascript
const { errorLogger } = require('common-backend-toolkit');

// Use after routes but before error handler
app.use(errorLogger);

// Captures:
// - User context (username, tokenId, city)
// - Error details with stack trace
// - Request/response metadata
```

#### Authentication

JWT authentication middleware:

```javascript
const { authentication } = require('common-backend-toolkit');

const publicKey = process.env.JWT_PUBLIC_KEY;

// Apply to protected routes
app.get('/protected',
  authentication(publicKey, {
    validateAudience: true,
    validateIssuer: true
  }),
  (req, res) => {
    // req.payload contains verified JWT data
    console.log(req.payload.userId);
    console.log(req.payload.data);
    successResponse(res, 'Protected data', req.payload);
  }
);
```

#### Session Location

GeoIP lookup middleware for extracting client location from IP:

```javascript
const { getRequestIpAddress, setSessionLocation } = require('common-backend-toolkit');

app.use(getRequestIpAddress);
app.use(setSessionLocation);

app.get('/location', (req, res) => {
  // res.locals.sessionLocation contains geo data
  const location = res.locals.sessionLocation;
  successResponse(res, 'Your location', {
    city: location.city,
    country: location.country,
    region: location.region,
    timezone: location.timezone
  });
});
```

---

### AWS Wrappers

#### S3 Wrapper

AWS S3 client management with multi-bucket support:

```javascript
const { S3Wrapper } = require('common-backend-toolkit');

const s3 = new S3Wrapper();

// Connect to multiple buckets
await s3.connect(
  {
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  },
  ['bucket1', 'bucket2'], // or { bucket1: {}, bucket2: {} }
  30000 // max wait time
);

// Get client for specific bucket
const bucket1Client = s3.getClient('bucket1');

// Use AWS SDK operations
const { PutObjectCommand } = s3.gets3Library();
await bucket1Client.send(new PutObjectCommand({
  Bucket: 'bucket1',
  Key: 'file.txt',
  Body: 'Hello World'
}));

// Disconnect
await s3.disconnect(['bucket1', 'bucket2']);
```

#### SES Wrapper

AWS SES email service via SESv2Client:

```javascript
const { SESWrapper } = require('common-backend-toolkit');

const ses = new SESWrapper();

// Connect to SES
await ses.connect({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Send email
await ses.sendMail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello from SES',
  text: 'Plain text content',
  html: '<h1>HTML content</h1>'
});

// Disconnect
await ses.disconnect();
```

#### Lambda Wrapper

AWS Lambda client management with multi-region support:

```javascript
const { LambdaWrapper } = require('common-backend-toolkit');

const lambda = new LambdaWrapper();

// Connect to Lambda in multiple regions
await lambda.connect(
  {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  },
  ['us-east-1', 'eu-west-1']
);

// Get client for specific region
const usEastClient = lambda.getClient('us-east-1');

// Invoke Lambda function
const { InvokeCommand } = lambda.getLambdaLibrary();
const result = await usEastClient.send(new InvokeCommand({
  FunctionName: 'my-function',
  Payload: JSON.stringify({ key: 'value' })
}));

// Cleanup
await lambda.destroy(['us-east-1', 'eu-west-1']);
```

---

### Redis Wrappers

#### Redis Wrapper

Basic Redis client with Pub/Sub support:

```javascript
const { RedisWrapper } = require('common-backend-toolkit');

const redis = new RedisWrapper();

// Connect
await redis.connect({
  host: 'localhost',
  port: 6379,
  password: 'your-password'
});

// Use client
const client = redis.client;
await client.set('key', 'value');
const value = await client.get('key');

// Subscribe to channel
await redis.subscribe('notifications', (message) => {
  console.log('Received:', message);
});

// Disconnect
await redis.disconnect();
```

#### Redis Pub/Sub Wrapper

Advanced singleton Pub/Sub manager with auto-reconnection:

```javascript
const { RedisPubSubWrapper } = require('common-backend-toolkit');

// Get singleton instance
const pubsub = RedisPubSubWrapper.getInstance();

// Connect
await pubsub.connect({
  host: 'localhost',
  port: 6379
});

// Subscribe with callback
const unsubscribe = await pubsub.subscribe('events', (message) => {
  console.log('Event received:', message);
});

// Publish message (auto-stringifies objects)
await pubsub.publish('events', { type: 'user.created', userId: 123 });

// Unsubscribe
await unsubscribe();

// Check connection
console.log(pubsub.isConnected); // true

// Disconnect
await pubsub.disconnect();
```

---

### Email Wrappers

#### Gmail Wrapper

Gmail SMTP integration using nodemailer:

```javascript
const { GmailEmailWrapper } = require('common-backend-toolkit');

const gmail = new GmailEmailWrapper();

// Connect with Gmail credentials
await gmail.connect('your-email@gmail.com', 'your-app-password');

// Send email
await gmail.sendEmail(
  'recipient@example.com',
  'Subject Line',
  'Plain text content',
  '<h1>HTML content</h1>'
);

// Disconnect
await gmail.disconnect();
```

#### SendGrid Wrapper

SendGrid API integration:

```javascript
const { sendGridEmailWrapper } = require('common-backend-toolkit');

const sendgrid = new sendGridEmailWrapper(process.env.SENDGRID_API_KEY);

// Connect
await sendgrid.connect();

// Send email
await sendgrid.sendEmail(
  'recipient@example.com',
  'sender@example.com',
  'Subject Line',
  'Plain text content',
  '<h1>HTML content</h1>'
);
```

---

### Communication Services

#### Twilio Wrapper

SMS and Voice calling via Twilio with multi-tenant support:

```javascript
const { TwilioWrapper } = require('common-backend-toolkit');

const twilio = new TwilioWrapper();

// Setup default client
await twilio.connectDefault(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  process.env.TWILIO_PHONE_NUMBER
);

// Send SMS with balance check
await twilio.sendDefaultSMS(
  '+1234567890',
  'Hello from Twilio!',
  5.00 // minimum balance required
);

// Make voice call
await twilio.makeDefaultCall(
  '+1234567890',
  'https://your-server.com/twiml',
  {
    statusCallback: 'https://your-server.com/status',
    record: true
  },
  5.00 // minimum balance
);

// Check balance
const balance = await twilio.getDefaultClientBalance();

// Multi-tenant: Setup user-specific client
await twilio.connectUser('user123', {
  accountSid: 'user-account-sid',
  authToken: 'user-auth-token',
  phoneNumber: '+1234567890'
});

// Send SMS from user's account
await twilio.sendUserSMS('user123', '+1234567890', 'Message');

// Disconnect user
await twilio.disconnectUser('user123');
```

#### Kafka Wrapper

Apache Kafka producer/consumer wrapper:

```javascript
const { KafkaWrapper } = require('common-backend-toolkit');

const kafka = new KafkaWrapper();

// Connect as producer and consumer
await kafka.connect({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
  groupId: 'my-consumer-group', // Optional, for consumer
  topic: 'my-topic' // Optional, for consumer
});

// Send message
await kafka.sendMessage('my-topic', {
  event: 'user.created',
  userId: 123
}, 'optional-key');

// Subscribe to topic
await kafka.subscribe('my-topic', async (message) => {
  console.log('Received:', message);
  // Process message
});

// Check connection
console.log(kafka.isConnected()); // true

// Disconnect
await kafka.disconnect();
```

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature-name`)
5. Open a pull request

---

## License

This package is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Questions or Feedback?

Feel free to open an issue on [GitHub](https://github.com/mayankrajput8745/common-backend-toolkit) or contact us at mayankrajput8745@gmail.com.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.
