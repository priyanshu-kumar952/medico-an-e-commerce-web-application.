import getDb from '@/lib/db';
import bcryptjs from 'bcryptjs';
import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { staff_id, password } = body;

        if (!staff_id || !password) {
            return NextResponse.json({ error: 'Staff ID and password are required' }, { status: 400 });
        }

        const staff = db.prepare('SELECT * FROM staff WHERE staff_id = ?').get(staff_id.toUpperCase());

        if (!staff) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const valid = bcryptjs.compareSync(password, staff.password_hash);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create JWT payload
        const payload = {
            staff_id: staff.staff_id,
            name: staff.name,
            role: staff.role,
        };

        const token = await signToken(payload);

        // Set httpOnly cookie
        const cookieStore = await cookies();
        cookieStore.set('medico_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return NextResponse.json({
            staff_id: staff.staff_id,
            name: staff.name,
            role: staff.role,
            authenticated: true,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
