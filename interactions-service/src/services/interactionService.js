/*

APENAS PARA TESTE DOS CONTAINERS - APENAS PARA TESTE DOS CONTAINERS

*/

export default {
    async create(data) {
        return {
            message: "Interação registrada!",
        };
    },

    async list() {
        return [
            { id: 1, text: "Resposta da ouvidoria" }
        ];
    }
};
