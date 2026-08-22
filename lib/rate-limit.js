const rateLimit = new Map();

export function rateLimitCheck(ip, limit = 5, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;

    let requestData = rateLimit.get(ip);

    if (!requestData) {
        requestData = { count: 1, timestamps: [now] };
        rateLimit.set(ip, requestData);
        return true;
    }

    // Filter out old timestamps
    requestData.timestamps = requestData.timestamps.filter(time => time > windowStart);

    if (requestData.timestamps.length >= limit) {
        return false; // Rate limit exceeded
    }

    requestData.timestamps.push(now);
    rateLimit.set(ip, requestData);

    return true;
}
