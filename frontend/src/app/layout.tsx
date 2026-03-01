import { Providers } from '../components/Providers'; // Relative path from app/ folder
import './globals.css';
export const metadata = {
  title: 'KrishiLink | Blockchain Agriculture',
  description: 'Secure escrow for farmers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}