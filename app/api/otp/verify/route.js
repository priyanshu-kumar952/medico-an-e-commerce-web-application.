import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { phone, otp_code } = body;

        if (!phone || !otp_code) {
            return NextResponse.json({ error: 'Phone and OTP code are required' }, { status: 400 });
        }

        const db = getDb();
        const phoneTrimmed = phone.trim();

        // Find the OTP record
        const record = db.prepare('SELECT * FROM otps WHERE phone = ?').get(phoneTrimmed);

        if (!record) {
            return NextResponse.json({ error: 'No OTP generated for this number. Please request a new one.' }, { status: 400 });
        }

        // Check expiration
        const now = new Date();
        const expiresAt = new Date(record.expires_at);

        if (now > expiresAt) {
            db.prepare('DELETE FROM otps WHERE phone = ?').run(phoneTrimmed);
            return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
        }

        // Verify code
        if (record.otp_code !== otp_code.trim()) {
            return NextResponse.json({ error: 'Incorrect OTP. Please try again.' }, { status: 400 });
        }

        // OTP is valid! Delete it so it can't be reused
        db.prepare('DELETE FROM otps WHERE phone = ?').run(phoneTrimmed);

        return NextResponse.json({ success: true, message: 'Phone number verified successfully' });
    } catch (error) {
        console.error('OTP Verify Error:', error);
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
    }
}
