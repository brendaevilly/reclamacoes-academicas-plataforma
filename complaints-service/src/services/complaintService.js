/*

APENAS PARA TESTE DOS CONTAINERS - APENAS PARA TESTE DOS CONTAINERS

*/

export default {
    async create(data) {
        return {
            message: "Denúncia registrada!",
        };
    },

    async list() {
        return [
            { id: 1, description: "Exemplo de denúncia" }
        ];
    }
};
