const fs = require('fs');
const _ = require('lodash');
const parse = require('csv-parse');
const uuid = require('node-uuid');
const moment = require('moment');
const { handleBackPressure } = require('../../../job-utils');
const regions = require('../../../../components/regions');

const parseDate = value => new Date(moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD') + 'Z');

class KairosAccountImporter {

    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }

    async _buildAccount(data) {
        const { findCodeRegionByName } = regions(this.db);
        const siret = parseInt(data['SIRET'], 10);
        let region = data['Nouvelle région'];
        let email = data['mail RGC'];

        return {
            _id: siret,
            SIRET: siret,
            raisonSociale: data['LIBELLE'],
            courriel: email,
            token: uuid.v4(),
            creationDate: new Date(),
            sources: ['kairos'],
            codeRegion: await findCodeRegionByName(region),
            meta: {
                siretAsString: data['SIRET'],
                kairosData: {
                    libelle: data['LIBELLE'],
                    region: region,
                    nomRGC: data['Nom RGC'],
                    prenomRGC: data['Prénom RGC'],
                    emailRGC: email,
                    telephoneRGC: data['Téléphone RGC'],
                    assedic: data['ASSEDIC'],
                    convention: data['convention'],
                    dateDebut: parseDate(data['date début']),
                    dateFin: parseDate(data['date fin']),
                },
            }
        };
    }

    _createNewAccount(account) {
        return this.db.collection('organismes').insertOne(account);
    }

    _updateAccount(previous, newAccount) {
        return this.db.collection('organismes').updateOne({ SIRET: newAccount.SIRET }, {
            $addToSet: {
                courrielsSecondaires: newAccount.meta.kairosData.emailRGC,
                sources: 'kairos'
            },
            $set: {
                ...(previous.courriel ? {} : { courriel: newAccount.courriel }),
                'updateDate': new Date(),
                'codeRegion': newAccount.codeRegion,
                'meta': _.merge({}, previous.meta, newAccount.meta),
            }
        });
    }

    async importAccounts(file) {
        let results = {
            total: 0,
            created: 0,
            updated: 0,
            invalid: 0,
        };

        await this.db.collection('departements').createIndex({ region: 'text' });

        return new Promise((resolve, reject) => {
            fs.createReadStream(file)
            .pipe(parse({
                delimiter: '|',
                quote: '',
                columns: [
                    'SIRET',
                    'LIBELLE',
                    'REGION',
                    'Nouvelle région',
                    'Nom RGC',
                    'Prénom RGC',
                    'mail RGC',
                    'Téléphone RGC',
                    'ASSEDIC',
                    'convention',
                    'date début',
                    'date fin',
                ],
            }))
            .pipe(handleBackPressure(async data => {
                try {
                    let newAccount = await this._buildAccount(data);

                    let previous = await this.db.collection('organismes').findOne({ SIRET: newAccount.SIRET });
                    if (!previous) {
                        await this._createNewAccount(newAccount);
                        return { status: 'created', account: newAccount };

                    } else {
                        await this._updateAccount(previous, newAccount);
                        return { status: 'updated', account: newAccount };
                    }
                } catch (e) {
                    return { status: 'invalid', account: data, error: e };
                }
            }))
            .on('data', ({ account, status, error }) => {
                results.total++;
                results[status]++;

                if (status === 'updated') {
                    this.logger.debug(`Account ${account.SIRET} updated`);
                } else if (status === 'invalid') {
                    this.logger.error(`Account cannot be imported`, account, error);
                } else {
                    this.logger.debug(`New Account created ${account.SIRET}`);
                }
            })
            .on('finish', async () => {
                return results.invalid === 0 ? resolve(results) : reject(results);
            });
        });

    }
}

module.exports = KairosAccountImporter;
