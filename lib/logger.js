export function logInfo(message, meta = {}) {
    console.log(
        JSON.stringify({
            level: "info",
            timestamp: new Date().toISOString(),
            message,
            ...meta,
        })
    );
}

export function logError(message, error = null, meta = {}) {
    console.error(
        JSON.stringify({
            level: "error",
            timestamp: new Date().toISOString(),
            message,
            ...(error && {
                error: error instanceof Error ? error.message : String(error),
            }),
            ...meta,
        })
    );
}