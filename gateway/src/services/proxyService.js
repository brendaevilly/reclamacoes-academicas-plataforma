import axios from "axios";

export default async function proxyService(req, res, baseUrl) {
    try {
        const url = `${baseUrl}${req.originalUrl.replace(/^\/[^\/]+/, "")}`;
        
        const { data } = await axios({
            method: req.method,
            url,
            data: req.body,
            headers: req.headers,
        });

        res.json(data);

    } catch (error) {
        console.error("Erro no proxy:", error.message);
        res.status(error.response?.status || 500).json({
            error: "Erro ao comunicar com o microserviço",
        });
    }
}
