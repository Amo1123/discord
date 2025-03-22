export default async function handler(req, res) {
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!webhookUrl) {
        return res.status(500).json({ error: 'Webhook URLが設定されていません' });
    }

    if (req.method === 'POST') {
        const { content } = req.body;
        
        // IPv4形式のバリデーション（xxx.xxx.xxx.xxx のみ許可）
        const ipv4Pattern = /^(?:\d{1,3}\.){3}\d{1,3}$/;
        if (!ipv4Pattern.test(content)) {
            return res.status(400).json({ error: 'fail' });
        }
        
        // 各オクテットが 0-255 の範囲内かチェック
        const octets = content.split('.').map(Number);
        if (octets.some(octet => octet < 0 || octet > 255)) {
            return res.status(400).json({ error: 'fail' });
        }

        try {
            const discordRes = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (!discordRes.ok) throw new Error('Discord送信失敗');

            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
