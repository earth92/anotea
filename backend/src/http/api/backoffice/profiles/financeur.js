const _ = require('lodash');
const Joi = require('joi');
const moment = require('moment');
const { isPoleEmploi, getFinanceurs } = require('../../../../core/utils/financeurs');
const { arrayOf } = require('../../../utils/validators-utils');

module.exports = (db, regions, user) => {

    let region = regions.findRegionByCodeRegion(user.codeRegion);

    return {
        type: 'financeur',
        getUser: () => user,
        getShield: () => {
            return {
                'codeRegion': user.codeRegion,
                'formation.action.organisme_financeurs.code_financeur': user.codeFinanceur,
            };
        },
        validators: {
            form: () => {
                return {
                    debut: Joi.number(),
                    fin: Joi.number(),
                    numeroFormation: Joi.string(),
                    departement: Joi.string().valid(region.departements.map(d => d.code)),
                    siren: Joi.string().min(9).max(9),
                    siret: Joi.string(),
                    codeFinanceur: isPoleEmploi(user.codeFinanceur) ?
                        Joi.string().valid(getFinanceurs().map(f => f.code)) : Joi.any().forbidden(),
                    dispositifFinancement: isPoleEmploi(user.codeFinanceur) ?
                        Joi.string() : Joi.any().forbidden(),
                };
            },
            filters: () => {
                return {
                    statuses: arrayOf(Joi.string().valid(['validated', 'rejected', 'reported', 'archived'])),
                    reponseStatuses: arrayOf(Joi.string().valid(['none', 'validated', 'rejected'])),
                    qualification: Joi.string().valid(['all', 'négatif', 'positif']),
                    commentaires: Joi.bool(),
                    sortBy: Joi.string().allow(['date', 'lastStatusUpdate']),
                };
            },
            pagination: () => {
                return {
                    page: Joi.number().min(0).default(0),
                };
            },
        },
        queries: {
            fieldsToExclude: () => {
                return {
                    commentReport: 0,
                };
            },
            buildStagiaireQuery: async parameters => {
                let { departement, codeFinanceur, siren, siret, numeroFormation, debut, fin, dispositifFinancement } = parameters;
                let financeur = isPoleEmploi(user.codeFinanceur) ? (codeFinanceur || { $exists: true }) : user.codeFinanceur;

                return {
                    'codeRegion': user.codeRegion,
                    'formation.action.organisme_financeurs.code_financeur': financeur,
                    ...(siret || siren ? { 'formation.action.organisme_formateur.siret': new RegExp(`^${siret || siren}`) } : {}),
                    ...(codeFinanceur ? { 'formation.action.organisme_financeurs.code_financeur': codeFinanceur } : {}),
                    ...(departement ? { 'formation.action.lieu_de_formation.code_postal': new RegExp(`^${departement}`) } : {}),
                    ...(numeroFormation ? { 'formation.numero': numeroFormation } : {}),
                    ...(debut ? { 'formation.action.session.periode.debut': { $gte: moment(debut).toDate() } } : {}),
                    ...(fin ? { 'formation.action.session.periode.fin': { $lte: moment(fin).toDate() } } : {}),
                    ...(dispositifFinancement ? { 'dispositifFinancement': dispositifFinancement } : {}),
                };
            },
            buildAvisQuery: async parameters => {
                let {
                    departement, codeFinanceur, siren, siret, numeroFormation, debut, fin,
                    commentaires, qualification, statuses = ['validated', 'rejected', 'reported', 'archived'],
                    dispositifFinancement,
                } = parameters;

                let financeur = isPoleEmploi(user.codeFinanceur) ? (codeFinanceur || { $exists: true }) : user.codeFinanceur;

                return {
                    'codeRegion': user.codeRegion,
                    'formation.action.organisme_financeurs.code_financeur': financeur,
                    ...(siret || siren ? { 'formation.action.organisme_formateur.siret': new RegExp(`^${siret || siren}`) } : {}),
                    ...(departement ? { 'formation.action.lieu_de_formation.code_postal': new RegExp(`^${departement}`) } : {}),
                    ...(numeroFormation ? { 'formation.numero': numeroFormation } : {}),
                    ...(debut ? { 'formation.action.session.periode.debut': { $gte: moment(debut).toDate() } } : {}),
                    ...(fin ? { 'formation.action.session.periode.fin': { $lte: moment(fin).toDate() } } : {}),
                    ...(qualification ? { qualification } : {}),
                    ...(_.isBoolean(commentaires) ? { commentaire: { $exists: commentaires } } : {}),
                    ...(statuses ? { status: { $in: statuses } } : {}),
                    ...(dispositifFinancement ? { 'dispositifFinancement': dispositifFinancement } : {}),
                };
            },
        },
    };
};
