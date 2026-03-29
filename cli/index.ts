#!/usr/bin/env node
import { run } from './cli.js';

run().then((code) => {
  process.exitCode = code;
});
