'use strict';
const path = require('path');

const app = require('../app')({

});

const PORT = config.port;

app.listen(PORT);

console.log(`listen on port:${PORT}`);
