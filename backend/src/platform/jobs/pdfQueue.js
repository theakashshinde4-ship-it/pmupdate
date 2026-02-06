const { createQueue } = require('./queue');

const pdfQueue = createQueue('pdf');

module.exports = { pdfQueue };
