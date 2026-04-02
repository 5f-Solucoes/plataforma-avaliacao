import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

export const metadata = {
  title: {
    default: "Plataforma Avaliação",
    template: "%s - Plataforma Avaliação",
  },
  description: "Sistema de Certificação",
  icons: {
    icon: "/images/logop.png",
  },
};

// Layout raiz da aplicação, configurando o tema e provendo o contexto para notificações
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <ColorSchemeScript /> 
      </head>
      <body>
        <MantineProvider defaultColorScheme="light">
          <Notifications />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}