export const config = {
    api: {
        bodyParser: true,
    },
};

import { FormData } from 'formdata-node';
import { fetch } from 'undici';

export default async function handler(req, res) {
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!webhookUrl) {
        return res.status(500).json({ error: 'Webhook URLが設定されていません' });
    }

    if (req.method === 'POST') {
        try {
            const { image: base64Data } = req.body;
            if (!base64Data) {
                return res.status(400).json({ error: 'Base64データが送信されていません' });
            }

            // Base64 のプレフィックスを除去 (もし含まれている場合)
            const base64Image = base64Data.replace(/^data:image\/png;base64,/, '');

            // Base64 を Buffer に変換
            const buffer = Buffer.from(base64Image, 'base64');

            // FormData を作成し、バイナリデータをセット
            const formData = new FormData();
            formData.set('file', new Blob([buffer], { type: 'image/png' }), 'image.png');

            // Discord Webhook に送信
            const discordRes = await fetch(webhookUrl, {
                method: 'POST',
                body: formData,
                headers: formData.headers,
            });

            const resultText = await discordRes.text();

            if (!discordRes.ok) {
                throw new Error(`画像送信失敗: ${discordRes.statusText} - ${resultText}`);
            }

            res.status(200).json({ success: true });
        } catch (error) {
            console.error('エラー:', error);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
