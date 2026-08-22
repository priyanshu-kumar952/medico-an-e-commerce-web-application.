import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { phone } = body;

        const phoneTrimmed = (phone || '').trim();
        const phoneRegex = /^[6-9]\d{9}$/;
        const hasManyRepeats = /(.)\1{5,}/.test(phoneTrimmed);
        const isSequential = ['1234567890', '0987654321', '9876543210'].includes(phoneTrimmed);

        if (!phoneRegex.test(phoneTrimmed) || hasManyRepeats || isSequential) {
            return NextResponse.json({ error: 'Please provide a valid, real mobile number' }, { status: 400 });
        }

        // Generate 4 digit OTP
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Expiration time: 5 minutes from now
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        const db = getDb();

        // Clean up old OTPs for this phone if any
        db.prepare('DELETE FROM otps WHERE phone = ?').run(phoneTrimmed);

        // Insert new OTP
        db.prepare(
            'INSERT INTO otps (phone, otp_code, expires_at) VALUES (?, ?, ?)'
        ).run(phoneTrimmed, otpCode, expiresAt);

        // TODO: In production, integrate with MSG91, Twilio, or Fast2SMS here.
        // For development, we log it clearly to the console so the user can type it in.
        console.log(`\n================================`);
        console.log(`📡 DEV MODE SMS SIMULATOR`);
        console.log(`To: +91 ${phoneTrimmed}`);
        console.log(`Message: Your Mithila Medico verification code is: ${otpCode}. It is valid for 5 minutes.`);
        console.log(`================================\n`);

        return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('OTP Send Error:', error);
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }
}
