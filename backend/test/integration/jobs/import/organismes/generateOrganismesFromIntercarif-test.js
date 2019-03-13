const assert = require('assert');
const { withMongoDB } = require('../../../../helpers/test-database');
const logger = require('../../../../helpers/test-logger');
const generateOrganismesFromIntercarif = require('../../../../../src/jobs/import/organismes/generateOrganismesFromIntercarif');

describe(__filename, withMongoDB(({ getTestDatabase, insertDepartements, importIntercarif }) => {

    it('should generate organismes collections', async () => {

        let db = await getTestDatabase();
        await Promise.all([importIntercarif(), insertDepartements()]);

        let results = await generateOrganismesFromIntercarif(db, logger);

        assert.deepEqual(results, {
            responsable: 1,
            formateurs: 1,
        });
        assert.deepEqual(await db.collection('intercarif_organismes_responsables').countDocuments(), 1);
        assert.deepEqual(await db.collection('intercarif_organismes_formateurs').countDocuments(), 1);
    });

}));