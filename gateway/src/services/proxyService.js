import axios from "axios";

export default async function proxyService(req, res, baseUrl, basePath) {
    try {
        // Remove o basePath do início da URL original para evitar duplicação
        let path = req.originalUrl;
        if (basePath && path.startsWith(basePath)) {
            path = path.substring(basePath.length);
        }
        
        // Se o path estiver vazio, adicionar /
        if (!path || path === '') {
            path = '/';
        }
        
        const url = `${baseUrl}${basePath}${path}`;
        
        console.log(`[Gateway] ${req.method} ${req.originalUrl} -> ${url}`);
        
        const response = await axios({
            method: req.method,
            url,
            data: req.body,
            headers: {
                ...req.headers,
                host: new URL(baseUrl).host // Atualizar o header host
            },
            params: req.query,
            validateStatus: () => true // Aceitar qualquer status code
        });

        // Encaminhar o status e os dados da resposta
        res.status(response.status).json(response.data);

    } catch (error) {
        console.error("[Gateway] Erro no proxy:", error.message);
        
        if (error.response) {
            // O serviço respondeu com erro
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            // Requisição foi feita mas não houve resposta
            res.status(503).json({
                error: "Serviço indisponível",
                message: "O microserviço não está respondendo"
            });
        } else {
            // Erro na configuração da requisição
            res.status(500).json({
                error: "Erro no gateway",
                message: error.message
            });
        }
    }
}
