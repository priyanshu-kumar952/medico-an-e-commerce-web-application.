import './globals.css';

export const metadata = {
  title: 'Mithila Medico — Trusted Pharmacy in Gardanibagh, Patna Since 1994',
  description: 'Order medicines online from Mithila Medico, Gardanibagh, Patna. Cash discounts, free home delivery, and real-time order tracking. Serving Patna since 1994.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
