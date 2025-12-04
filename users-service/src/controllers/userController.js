/*

APENAS PARA TESTE DOS CONTAINERS - APENAS PARA TESTE DOS CONTAINERS

*/

import userService from "../services/userService.js";

export default {
    async register(req, res) {
        const result = await userService.register(req.body);
        res.status(result.status).json(result);
    },

    async login(req, res) {
        const result = await userService.login(req.body);
        res.status(result.status).json(result);
    }
};
