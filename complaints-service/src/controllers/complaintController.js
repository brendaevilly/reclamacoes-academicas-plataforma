/*

APENAS PARA TESTE DOS CONTAINERS - APENAS PARA TESTE DOS CONTAINERS

*/

import complaintService from "../services/complaintService.js";

export default {
    async create(req, res) {
        const result = await complaintService.create(req.body);
        res.status(201).json(result);
    },

    async list(req, res) {
        const result = await complaintService.list();
        res.json(result);
    }
};
