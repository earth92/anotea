#!/usr/bin/env node
'use strict';
const { execute } = require('../../job-utils');
const cli = require('commander');

cli.parse(process.argv);

execute(async ({ db }) => {
    let stats = {};
    stats.dropCollections = require('./tasks/dropCollections')(db);
    stats.cleanSiretProperties = require('./tasks/cleanSiretProperties')(db);
    return stats;
});
