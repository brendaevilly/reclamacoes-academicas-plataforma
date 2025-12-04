/*

APENAS PARA TESTE DOS CONTAINERS - APENAS PARA TESTE DOS CONTAINERS

*/

export default {
    async register(data) {
        return {
            status: 201,
            message: "Usuário registrado com sucesso!",
        };
    },

    async login(data) {
        return {
            status: 200,
            message: "Login realizado",
            token: "jwt-mock",
        };
    }
};
