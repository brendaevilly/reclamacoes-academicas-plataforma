import axios from "axios";
//import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export default async function proxyService(req, res, baseUrl, basePath) {
    try {
        // Remove o basePath do início da URL original para evitar duplicação
        let path = req.url;

        const url = `${baseUrl}${basePath}${path}`;

        console.log(`[Gateway] ${req.method} ${req.originalUrl} -> ${url}`);

        const headers = {
            ...req.headers,
            host: new URL(baseUrl).host
        };

        const tokenCookie = req.cookies?.token;
        if (tokenCookie) {
            headers["authorization"] = `Bearer ${tokenCookie}`;
        }


        const response = await axios({
            method: req.method,
            url,
            data: req.body,
            headers,
            //params: req.query,
            withCredentials: true,
            validateStatus: () => true // Aceitar qualquer status code
        });

        // Encaminhar o status e os dados da resposta

        if (response.headers["set-cookie"]) {
            res.setHeader("set-cookie", response.headers["set-cookie"]);
        }
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
