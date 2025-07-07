#!/usr/bin/env node
require('dotenv').config({ quiet: true });
const { main } = require('./dist/main.js');
main();
