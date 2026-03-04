"use client";

import { useState } from "react";
import { Button, Group } from "@mantine/core";
import { IconPrinter, IconArrowLeft, IconDownload } from "@tabler/icons-react";
import Link from "next/link";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CertificateControlsProps {
  nomeUsuario: string;
  nomeProva: string;
  dataEmissao: Date;
}

export function CertificateControls({ nomeUsuario, nomeProva, dataEmissao }: CertificateControlsProps) {
  const [loading, setLoading] = useState(false);

  const handleDownloadPdf = async () => {
    const element = document.getElementById('certificado-content');
    if (!element) return;

    setLoading(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.75);
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      const dataStr = new Date(dataEmissao).toISOString().split('T')[0];
      
      const userSafe = nomeUsuario.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
      const provaSafe = nomeProva.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
      
      const fileName = `${dataStr}_${provaSafe}_${userSafe}.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar o PDF. Tente usar a opção de Imprimir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Group justify="space-between">
      <Button 
        variant="subtle" 
        leftSection={<IconArrowLeft size={16}/>} 
        onClick={() => window.close()} 
      >
        Voltar
      </Button>
      
      <Group>
        <Button 
          variant="default" 
          leftSection={<IconPrinter size={16} />} 
          onClick={() => window.print()}
        >
          Imprimir
        </Button>

        <Button 
          leftSection={<IconDownload size={16} />} 
          onClick={handleDownloadPdf}
          loading={loading}
        >
          Baixar PDF
        </Button>
      </Group>
    </Group>
  );
}