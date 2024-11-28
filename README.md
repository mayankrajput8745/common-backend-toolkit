
# Common Backend Toolkit

[![npm version](https://img.shields.io/npm/v/common-backend-toolkit.svg)](https://www.npmjs.com/package/common-backend-toolkit)  
[![downloads](https://img.shields.io/npm/dm/common-backend-toolkit.svg)](https://www.npmjs.com/package/common-backend-toolkit)  
[![license](https://img.shields.io/npm/l/common-backend-toolkit.svg)](https://www.npmjs.com/package/common-backend-toolkit)

**Common Backend Toolkit** provides a collection of reusable utilities and tools for building backend applications in Node.js. Simplify your development process with commonly needed functionalities, including error handling, logging, and middleware utilities.

---

## Features

- 📦 **Ready-to-use utilities** for common backend tasks.  
- ⚙️ **Plug-and-play middleware** for Express.js applications.  
- 📜 **Structured error handling** with enhanced debugging information.  
- 📈 **Integrated logging system** with configurable output.  
- 🛠️ **Easy-to-extend and customizable** for specific project needs.  

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

## Usage

### 1. Import the toolkit:

```javascript
const { logger, errorHandler, middleware } = require('common-backend-toolkit');
```

### 2. Logging example:

```javascript
logger.info('This is an informational log');
logger.error('An error occurred');
```

### 3. Error Handling:

Use the `errorHandler` middleware for structured error responses in Express:

```javascript
const express = require('express');
const { errorHandler } = require('common-backend-toolkit');

const app = express();

// Define your routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Use the error handler
app.use(errorHandler);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 4. Middleware Utilities:

```javascript
const { someMiddleware } = require('common-backend-toolkit');

// Apply middleware in your routes
app.use(someMiddleware);
```

---

## API Documentation

### `logger`
A logging utility with multiple levels of logging (`info`, `warn`, `error`, etc.).  
Configuration can be customized as needed.

### `errorHandler`
An Express.js middleware to handle and format API errors gracefully.  

### `middleware`
A collection of reusable middleware functions to enhance your application logic.

---

## Contributing

We welcome contributions! Please follow the steps below:

1. Fork the repository.  
2. Create a feature branch (`git checkout -b feature-name`).  
3. Commit your changes (`git commit -m 'Add feature'`).  
4. Push to the branch (`git push origin feature-name`).  
5. Open a pull request.

---

## License

This package is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Questions or Feedback?

Feel free to open an issue on [GitHub](https://github.com/mayankrajput8745/common-backend-toolkit) or contact us at [mayankrajput8745@gmail.com].
