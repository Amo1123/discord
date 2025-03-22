const requestCounts = new Map();  // IPごとのリクエスト回数を管理
const LIMIT = 10;                 // 上限回数
const DURATION = 5 * 60 * 1000;   // 5分 (ミリ秒換算)

// レートリミットをチェックするミドルウェア関数
export default function rateLimit(req, res, next) {
    // POSTかつ /api もしくはそのサブディレクトリへのリクエストのみ制限対象
    if (req.method !== 'POST' || !req.path.startsWith('/api')) {
        return next();  // 次の処理へ
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;  // クライアントIP取得
    const now = Date.now();

    if (!requestCounts.has(clientIp)) {
        // 初回アクセスなら記録作成
        requestCounts.set(clientIp, { count: 1, startTime: now });
        return next();  // 許可して次の処理へ
    }

    const userData = requestCounts.get(clientIp);

    // 指定時間を過ぎたらカウントをリセット
    if (now - userData.startTime > DURATION) {
        requestCounts.set(clientIp, { count: 1, startTime: now });
        return next();  // 許可して次の処理へ
    }

    // 上限超えたらアクセス禁止
    if (userData.count >= LIMIT) {
        return res.status(429).json({ error: 'アクセス制限: しばらく待ってから再試行してください' });
    }

    // カウントを増やして許可
    userData.count++;
    next();  // 許可して次の処理へ
}
