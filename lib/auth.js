import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

 // JWT secret is loaded from the environment.
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function signToken(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // Set reasonable expiration
        .sign(SECRET_KEY);
}

export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('medico_session')?.value;
    if (!token) return null;
    return await verifyToken(token);
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete('medico_session');
}
