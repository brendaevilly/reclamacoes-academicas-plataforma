import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Proxy server-to-server para os microsserviços internos.
 *
 * Pontos importantes:
 *   1. Remove headers tóxicos para proxy (host, accept-encoding,
 *      content-length, connection) que podem fazer o axios receber
 *      bodies gzipped e quebrar o forward de Set-Cookie / JSON.
 *   2. TA1: converte o cookie HttpOnly `token` em
 *      `Authorization: Bearer ...` para que os microsserviços
 *      (que validam por header) continuem funcionando.
 *   3. Encaminha `Set-Cookie` usando `res.append` (e não setHeader),
 *      preservando múltiplos cookies caso existam.
 */
export default async function proxyService(req, res, baseUrl, basePath) {
    try {
        const path = req.url;
        const url = `${baseUrl}${basePath}${path}`;

        // Limpa headers que não devem ser propagados num proxy
        const {
            host: _host,
            "content-length": _cl,
            "accept-encoding": _ae,
            connection: _conn,
            "transfer-encoding": _te,
            ...safeHeaders
        } = req.headers;

        const headers = {
            ...safeHeaders,
            host: new URL(baseUrl).host,
            // Garante resposta NÃO comprimida — assim axios não precisa
            // descomprimir nada e o forward sai limpo
            "accept-encoding": "identity"
        };

        // TA1: cookie HttpOnly -> Authorization Bearer
        const tokenCookie = req.cookies?.token;
        if (tokenCookie && !headers.authorization) {
            headers.authorization = `Bearer ${tokenCookie}`;
        }

        const response = await axios({
            method: req.method,
            url,
            data: req.body,
            headers,
            withCredentials: true,
            // Aceita qualquer status para repassar fielmente ao client
            validateStatus: () => true
        });

        // Forward de Set-Cookie de forma robusta (pode ser string ou array)
        const setCookies = response.headers?.["set-cookie"];
        if (setCookies) {
            const list = Array.isArray(setCookies) ? setCookies : [setCookies];
            for (const c of list) {
                res.append("Set-Cookie", c);
            }
        }

        // Forward de tipo de conteúdo (caso não seja JSON)
        const contentType = response.headers?.["content-type"];
        if (contentType) res.setHeader("Content-Type", contentType);

        res.status(response.status);

        // axios com responseType:json devolve objeto/array/null em response.data;
        // se for string (ex.: serviço caiu) usamos send para não duplicar JSON.stringify
        if (response.data && typeof response.data === "object") {
            return res.json(response.data);
        }
        return res.send(response.data ?? "");

    } catch (error) {
        console.error("[Gateway] Erro no proxy:", error.message);

        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            res.status(503).json({
                error: "Serviço indisponível",
                message: "O microserviço não está respondendo"
            });
        } else {
            res.status(500).json({
                error: "Erro no gateway",
                message: error.message
            });
        }
    }
}
