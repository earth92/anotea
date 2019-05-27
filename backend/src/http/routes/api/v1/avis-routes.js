const express = require('express');
const Joi = require('joi');
const _ = require('lodash');
const Boom = require('boom');
const ObjectID = require('mongodb').ObjectID;
const { tryAndCatch } = require('../../routes-utils');
const { paginationValidator, notesDecimalesValidator } = require('./utils/validators');
const createAvisDTO = require('./dto/createAvisDTO');
const createPaginationDTO = require('./dto/createPaginationDTO');

const buildAvisQuery = filters => {

    let queries = (filters.constructor === Array ? filters : [filters]).map(filter => {
        let query = {};
        const FORMACODE_LENGTH = 5;

        if (filter.organisme_formateur) {
            query['training.organisation.siret'] = filter.organisme_formateur;
        }

        if (filter.lieu_de_formation) {
            query['training.place.postalCode'] = filter.lieu_de_formation;
        }

        if (filter.certif_info) {
            query['training.certifInfo.id'] = filter.certif_info;
        }

        if (filter.formacode) {
            let code = filter.formacode;
            query['formacode'] = code.length < FORMACODE_LENGTH ? new RegExp(code) : code;
        }

        if (filter.avec_commentaires_uniquement) {
            query['$and'] = [
                { comment: { $exists: filter.avec_commentaires_uniquement } },
                { rejected: false },
            ];
        }

        return query;
    });

    return {
        '$and': [
            queries.length === 0 ? {} : { '$or': queries },
            {
                '$or': [
                    { 'comment': { $exists: false } },
                    { 'comment': null },
                    { 'published': true },
                    { 'rejected': true },
                ]
            }
        ],
    };
};

module.exports = ({ db, middlewares }) => {

    let router = express.Router();// eslint-disable-line new-cap
    let { createHMACAuthMiddleware } = middlewares;
    let checkAuth = createHMACAuthMiddleware(['esd', 'maformation'], { allowNonAuthenticatedRequests: true });

    router.get('/v1/avis', checkAuth, tryAndCatch(async (req, res) => {

        const parameters = await Joi.validate(req.query, {
            organisme_formateur: Joi.string().min(9).max(15),
            lieu_de_formation: Joi.string().regex(/^(([0-8][0-9])|(9[0-5])|(2[ab])|(97))[0-9]{3}$/),
            certif_info: Joi.string(),
            formacode: Joi.string(),
            avec_commentaires_uniquement: Joi.boolean(),
            ...paginationValidator(),
            ...notesDecimalesValidator(),
        }, { abortEarly: false });

        let pagination = _.pick(parameters, ['page', 'items_par_page']);
        let filters = _.pick(parameters,
            ['organisme_formateur', 'lieu_de_formation', 'certif_info', 'formacode', 'avec_commentaires_uniquement']);
        let limit = pagination.items_par_page;
        let skip = pagination.page * limit;
        let query = buildAvisQuery(filters);


        let cursor = await db.collection('comment')
        .find(query)
        .sort({ date: -1 })
        .limit(limit)
        .skip(skip);

        let [total, avis] = await Promise.all([cursor.count(), cursor.toArray()]);

        res.json({
            avis: avis.map(a => createAvisDTO(a, { notes_decimales: parameters.notes_decimales })),
            meta: {
                pagination: createPaginationDTO(pagination, total)
            },
        });
    }));

    router.get('/v1/avis/:id', checkAuth, tryAndCatch(async (req, res) => {

        const parameters = await Joi.validate(Object.assign({}, req.query, req.params), {
            id: Joi.string().required(),
            ...notesDecimalesValidator(),
        }, { abortEarly: false });

        if (!ObjectID.isValid(parameters.id)) {
            throw Boom.badRequest('Identifiant invalide');
        }

        let avis = await db.collection('comment').findOne({ _id: new ObjectID(parameters.id) });

        if (!avis) {
            throw Boom.notFound('Identifiant inconnu');
        }
        res.json(createAvisDTO(avis, { notes_decimales: parameters.notes_decimales }));
    }));

    return router;
};