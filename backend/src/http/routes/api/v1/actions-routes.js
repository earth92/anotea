const express = require('express');
const Boom = require('boom');
const Joi = require('joi');
const _ = require('lodash');
const { tryAndCatch } = require('../../routes-utils');
const { paginationValidator, arrayOfValidator, notesDecimalesValidator, commentairesValidator } = require('./utils/validators');
const buildProjection = require('./utils/buildProjection');
const { createActionDTO, createPaginationDTO } = require('./utils/dto');

module.exports = ({ db, middlewares }) => {

    let router = express.Router();// eslint-disable-line new-cap
    let collection = db.collection('actionsReconciliees');
    let { createHMACAuthMiddleware } = middlewares;
    let checkAuth = createHMACAuthMiddleware(['esd', 'maformation'], { allowNonAuthenticatedRequests: true });

    router.get('/v1/actions', checkAuth, tryAndCatch(async (req, res) => {

        const parameters = await Joi.validate(req.query, {
            id: arrayOfValidator(Joi.string()),
            numero: arrayOfValidator(Joi.string()),
            region: arrayOfValidator(Joi.string()),
            nb_avis: Joi.number(),
            fields: arrayOfValidator(Joi.string().required()).default([]),
            ...paginationValidator(),
            ...notesDecimalesValidator(),
        }, { abortEarly: false });

        let pagination = _.pick(parameters, ['page', 'items_par_page']);
        let limit = pagination.items_par_page;
        let skip = pagination.page * limit;
        let query = {
            ...(parameters.id ? { '_id': { $in: parameters.id } } : {}),
            ...(parameters.numero ? { 'numero': { $in: parameters.numero } } : {}),
            ...(parameters.region ? { 'region': { $in: parameters.region } } : {}),
            ...(parameters.nb_avis ? { 'score.nb_avis': { $gte: parameters.nb_avis } } : {}),
        };

        let cursor = await collection.find(query)
        .project(buildProjection(parameters.fields))
        .limit(limit)
        .skip(skip);

        let [total, actions] = await Promise.all([cursor.count(), cursor.toArray()]);

        res.json({
            actions: actions.map(action => {
                return createActionDTO(action, { notes_decimales: parameters.notes_decimales });
            }) || [],
            meta: {
                pagination: createPaginationDTO(pagination, total)
            },
        });
    }));

    router.get('/v1/actions/:id', checkAuth, tryAndCatch(async (req, res) => {

        const parameters = await Joi.validate(Object.assign({}, req.query, req.params), {
            id: Joi.string().required(),
            ...notesDecimalesValidator(),
        }, { abortEarly: false });

        let action = await collection.findOne({ _id: parameters.id });

        if (!action) {
            throw Boom.notFound('Numéro d\'action inconnu ou action expirée');
        }

        res.json(createActionDTO(action, { notes_decimales: parameters.notes_decimales }));

    }));

    router.get('/v1/actions/:id/avis', checkAuth, tryAndCatch(async (req, res) => {

        const parameters = await Joi.validate(Object.assign({}, req.query, req.params), {
            id: Joi.string().required(),
            ...paginationValidator(),
            ...notesDecimalesValidator(),
            ...commentairesValidator(),
        }, { abortEarly: false });

        let pagination = _.pick(parameters, ['page', 'items_par_page']);
        let limit = pagination.items_par_page;
        let skip = pagination.page * limit;

        let action = await collection.findOne({ _id: parameters.id }, { projection: { avis: 1 } });

        if (!action) {
            throw Boom.notFound('Numéro d\'action inconnu ou action expirée');
        }

        let avis = action.avis;
        if (parameters.commentaires !== null) {
            avis = avis.filter(avis => parameters.commentaires ? avis.commentaire : !avis.commentaire);
        }

        res.json({
            avis: avis.slice(skip, skip + limit),
            meta: {
                pagination: createPaginationDTO(pagination, avis.length)
            },
        });

    }));

    return router;
};
