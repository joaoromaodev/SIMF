import "./globals.css";

export const metadata = {
  title: "SIMF SIAFE Imports",
  description: "Minimal operational flow for uploading and importing SIAFE CSV reports."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

