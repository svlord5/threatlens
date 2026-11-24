"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function OsintPdfExport({ results }: { results: any }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        const primaryColor: [number, number, number] = [31, 41, 55]; // zinc-800
        const accentColor: [number, number, number] = [79, 70, 229]; // indigo-600

        // Helper to format date
        const formatDate = (dateString: string) => {
          try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString;
            return d.toLocaleDateString();
          } catch {
            return dateString;
          }
        };

        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("THREAT INTELLIGENCE REPORT", 14, 25);
        
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 33);
        
        // Reset Text Color
        doc.setTextColor(0, 0, 0);

        let currentY = 50;

        // Target Overview
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...accentColor);
        doc.text("1. Target Overview", 14, currentY);
        currentY += 5;

        autoTable(doc, {
          startY: currentY,
          head: [['Field', 'Value']],
          body: [
            ['Indicator', results.indicator],
            ['Type', results.type.toUpperCase()]
          ],
          theme: 'striped',
          headStyles: { fillColor: primaryColor },
          styles: { font: 'helvetica', fontSize: 10 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;

        // IP Geolocation
        if (results.ipInfo && !results.ipInfo.error) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...accentColor);
          doc.text("IP Geolocation & Security Profile", 14, currentY);
          currentY += 5;

          const ipBody = [
            ['IP Address', results.ipInfo.ip || 'Unknown'],
            ['Location', `${results.ipInfo.city || ''}, ${results.ipInfo.country || ''}`],
            ['ASN', results.ipInfo.asn || 'Unknown'],
            ['Organization', results.ipInfo.org || 'Unknown'],
            ['Coordinates', `${results.ipInfo.latitude}, ${results.ipInfo.longitude}`]
          ];

          if (results.ipInfo.security) {
            ipBody.push(['VPN Detected', results.ipInfo.security.is_vpn ? 'Yes' : 'No']);
            ipBody.push(['Proxy Detected', results.ipInfo.security.is_proxy ? 'Yes' : 'No']);
            ipBody.push(['Tor Node', results.ipInfo.security.is_tor ? 'Yes' : 'No']);
            ipBody.push(['Datacenter/Hosting', results.ipInfo.security.is_hosting ? 'Yes' : 'No']);
          }

          autoTable(doc, {
            startY: currentY,
            head: [['Property', 'Details']],
            body: ipBody,
            theme: 'striped',
            headStyles: { fillColor: primaryColor },
            styles: { font: 'helvetica', fontSize: 10 }
          });
          currentY = (doc as any).lastAutoTable.finalY + 15;
        }

        // Email Intelligence (HIBP)
        if (results.hibpInfo && !results.hibpInfo.error) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...accentColor);
          doc.text("Email Breaches (HaveIBeenPwned)", 14, currentY);
          currentY += 5;

          if (results.hibpInfo.breaches.length === 0) {
            doc.setFontSize(10);
            doc.setTextColor(0, 150, 0);
            doc.text("No data breaches found for this email.", 14, currentY);
            currentY += 15;
          } else {
            const breachBody = results.hibpInfo.breaches.map((b: any) => [
              b.Title || b.Name,
              formatDate(b.BreachDate),
              b.DataClasses.join(", ")
            ]);

            autoTable(doc, {
              startY: currentY,
              head: [['Breach Name', 'Date', 'Compromised Data']],
              body: breachBody,
              theme: 'striped',
              headStyles: { fillColor: [225, 29, 72] }, // Rose color for breaches
              styles: { font: 'helvetica', fontSize: 9 }
            });
            currentY = (doc as any).lastAutoTable.finalY + 15;
          }
        }

        // SSL Certificate
        if (results.sslInfo && !results.sslInfo.error) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...accentColor);
          doc.text("SSL/TLS Certificate", 14, currentY);
          currentY += 5;

          autoTable(doc, {
            startY: currentY,
            head: [['Property', 'Details']],
            body: [
              ['Issuer', results.sslInfo.issuer || 'Unknown'],
              ['Status', results.sslInfo.expired ? 'Expired' : 'Valid'],
              ['Expires On', formatDate(results.sslInfo.valid_to)],
              ['Subject', results.sslInfo.subject || 'Unknown']
            ],
            theme: 'striped',
            headStyles: { fillColor: primaryColor },
            styles: { font: 'helvetica', fontSize: 10 }
          });
          currentY = (doc as any).lastAutoTable.finalY + 15;
        }

        // AlienVault OTX (Hash / Domain / IP)
        if (results.otxInfo && !results.otxInfo.error && results.otxInfo.pulse_info?.count > 0) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...accentColor);
          doc.text("AlienVault OTX Pulses", 14, currentY);
          currentY += 5;

          const otxBody = results.otxInfo.pulse_info.pulses.slice(0, 10).map((p: any) => [
            p.name.substring(0, 50) + (p.name.length > 50 ? '...' : ''),
            p.author_name,
            formatDate(p.created),
            (p.malware_families || []).join(", ") || "None"
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [['Pulse Name', 'Author', 'Created', 'Malware Families']],
            body: otxBody,
            theme: 'striped',
            headStyles: { fillColor: [20, 184, 166] }, // Teal color for OTX
            styles: { font: 'helvetica', fontSize: 9 }
          });
          currentY = (doc as any).lastAutoTable.finalY + 15;
        }

        // VirusTotal
        if (results.vtInfo && !results.vtInfo.error) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...accentColor);
          doc.text("VirusTotal Detection", 14, currentY);
          currentY += 5;

          autoTable(doc, {
            startY: currentY,
            head: [['Metric', 'Count']],
            body: [
              ['Malicious', results.vtInfo.malicious],
              ['Suspicious', results.vtInfo.suspicious],
              ['Total Vendors', results.vtInfo.total]
            ],
            theme: 'striped',
            headStyles: { fillColor: primaryColor },
            styles: { font: 'helvetica', fontSize: 10 }
          });
          currentY = (doc as any).lastAutoTable.finalY + 15;
        }

        // Save PDF
        doc.save(`OSINT_Report_${results.indicator.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      } catch (error) {
        console.error("PDF Generation failed", error);
        alert("Failed to generate PDF. Check console for details.");
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  return (
    <button 
      onClick={generateReport}
      disabled={isGenerating}
      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md"
    >
      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {isGenerating ? "Generating..." : "Export as PDF"}
    </button>
  );
}
