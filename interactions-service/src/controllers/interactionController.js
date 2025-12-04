/*

APENAS PARA TESTE DOS CONTAINERS - APENAS PARA TESTE DOS CONTAINERS

*/

import interactionService from "../services/interactionService.js";

export default {
    async create(req, res) {
        const result = await interactionService.create(req.body);
        res.status(201).json(result);
    },

    async list(req, res) {
        const result = await interactionService.list();
        res.json(result);
    }
};
