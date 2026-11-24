import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from "date-fns";
import Html from 'react-pdf-html';
import { marked } from 'marked';

Font.register({
  family: 'Geist',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/geist@1.3.0/dist/fonts/geist-sans/Geist-Regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/geist@1.3.0/dist/fonts/geist-sans/Geist-Bold.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: '40 40 100 40', backgroundColor: '#ffffff', fontFamily: 'Geist' },
  header: { borderBottom: '3 solid #4f46e5', paddingBottom: 15, marginBottom: 20 },
  branding: { fontSize: 10, color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 5 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 5 },
  riskScoreBox: { position: 'absolute', right: 0, top: 0, textAlign: 'right', backgroundColor: '#eef2ff', padding: 10, borderRadius: 8, border: '1 solid #4f46e5' },
  riskScoreValue: { fontSize: 28, fontWeight: 'bold', color: '#4f46e5' },
  riskScoreLabel: { fontSize: 10, color: '#4f46e5', textTransform: 'uppercase', fontWeight: 'bold' },
  
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase', marginBottom: 10, borderBottom: '1 solid #e5e7eb', paddingBottom: 5 },
  
  text: { fontSize: 10, color: '#374151', lineHeight: 1.5, marginBottom: 10 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  gridItem: { width: '48%', backgroundColor: '#f9fafb', padding: 10, borderRadius: 4, border: '1 solid #f3f4f6' },
  gridLabel: { fontSize: 9, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  gridValue: { fontSize: 11, color: '#111827', fontWeight: 'bold' },

  findingCard: { backgroundColor: '#fef2f2', padding: 12, borderRadius: 4, borderLeft: '4 solid #ef4444', marginBottom: 10 },
  findingTitle: { fontSize: 12, fontWeight: 'bold', color: '#991b1b', marginBottom: 4 },
  findingDesc: { fontSize: 10, color: '#7f1d1d', marginBottom: 4 },
  findingRemediation: { fontSize: 10, color: '#7f1d1d', fontWeight: 'bold' },

  tableRow: { flexDirection: 'row', borderBottom: '1 solid #e5e7eb', paddingVertical: 6 },
  tableCellLeft: { width: '70%', fontSize: 10, color: '#374151' },
  tableCellRight: { width: '30%', fontSize: 10, color: '#6b7280', textAlign: 'right' },

  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '1 solid #e5e7eb', paddingTop: 10 },
  disclaimerTitle: { fontSize: 9, fontWeight: 'bold', color: '#9ca3af', marginBottom: 2 },
  disclaimer: { fontSize: 8, color: '#9ca3af', lineHeight: 1.4 }
});

const htmlStyles = {
  h1: { fontSize: 14, color: '#4f46e5', marginBottom: 5, fontWeight: 'bold' },
  h2: { fontSize: 12, color: '#4f46e5', marginBottom: 5, fontWeight: 'bold' },
  h3: { fontSize: 11, color: '#111827', marginBottom: 5, fontWeight: 'bold' },
  p: { fontSize: 10, color: '#374151', marginBottom: 8, lineHeight: 1.4 },
  ul: { marginBottom: 8 },
  li: { fontSize: 10, color: '#374151', marginBottom: 3 },
  strong: { fontWeight: 'bold', color: '#111827' },
  em: { fontStyle: 'normal', fontWeight: 'bold', color: '#4f46e5' },
  i: { fontStyle: 'normal', fontWeight: 'bold', color: '#4f46e5' },
  blockquote: { backgroundColor: '#eff6ff', borderLeft: '4 solid #3b82f6', padding: '8 10', marginBottom: 10, color: '#1e3a8a', borderRadius: 2 },
  '.code-block': { backgroundColor: '#111827', color: '#f3f4f6', padding: 10, borderRadius: 4, fontSize: 8, marginBottom: 10, lineHeight: 1.3, fontFamily: 'Courier' }
};

export default function ReportTemplate({ scan }: { scan: any }) {
  const domainName = Array.isArray(scan.threatlens_domains) 
    ? scan.threatlens_domains[0]?.domain 
    : scan.threatlens_domains?.domain || "Unknown Domain";

  // Pre-process markdown to handle GitHub alerts and code blocks properly in PDF
  const processMarkdown = (md: string) => {
    if (!md) return "";
    const withAlerts = md
      .replace(/> \[!NOTE\]/gi, '> **NOTE:**')
      .replace(/> \[!WARNING\]/gi, '> **WARNING:**')
      .replace(/> \[!TIP\]/gi, '> **TIP:**')
      .replace(/> \[!IMPORTANT\]/gi, '> **IMPORTANT:**')
      .replace(/> \[!CAUTION\]/gi, '> **CAUTION:**');
    
    let rawHtml = marked(withAlerts) as string;
    
    // react-pdf-html collapses whitespace in divs, so we must manually preserve code block formatting
    rawHtml = rawHtml.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (match, codeContent) => {
      // Decode any HTML entities the markdown parser added (like &quot;) so we don't double encode
      let preservedCode = codeContent;
      // Replace leading spaces of each line with &nbsp;
      preservedCode = preservedCode.replace(/^ +/gm, (spaces: string) => '&nbsp;'.repeat(spaces.length));
      // Replace newlines
      preservedCode = preservedCode.replace(/\n/g, '<br/>');
      return `<div class="code-block">${preservedCode}</div>`;
    });
    
    // Strip inline codes and replace with bold so they don't break
    rawHtml = rawHtml.replace(/<code>(.*?)<\/code>/g, '<strong>$1</strong>');
    return rawHtml;
  };

  const execSummaryHtml = processMarkdown(scan.ai_executive_summary);
  const techSummaryHtml = processMarkdown(scan.ai_technical_summary);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        
        {/* Main Header (First Page Only) */}
        <View style={styles.header}>
          <Text style={styles.branding}>{domainName} SECURITY REPORT</Text>
          <Text style={styles.title}>Automated Posture Report</Text>
          <Text style={styles.subtitle}>Target: {domainName}  |  Date: {format(new Date(scan.created_at), "PPP")}</Text>
          <View style={styles.riskScoreBox}>
            <Text style={styles.riskScoreLabel}>Risk Score</Text>
            <Text style={styles.riskScoreValue}>{scan.risk_score}/100</Text>
          </View>
        </View>

        {/* Executive Summary */}
        {execSummaryHtml && (
          <View style={styles.section}>
            <Html stylesheet={htmlStyles}>{execSummaryHtml as string}</Html>
          </View>
        )}

        {/* Technical Summary */}
        {techSummaryHtml && (
          <View style={styles.section}>
            <Html stylesheet={htmlStyles}>{techSummaryHtml as string}</Html>
          </View>
        )}

        {/* Intelligence Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Infrastructure Intelligence</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Hosting Provider (ISP)</Text>
              <Text style={styles.gridValue}>{scan.dns_data?.geolocation?.isp || 'Unknown'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Physical Location</Text>
              <Text style={styles.gridValue}>
                {scan.dns_data?.geolocation?.city ? `${scan.dns_data.geolocation.city}, ${scan.dns_data.geolocation.country}` : 'Unknown'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>HTTP Status</Text>
              <Text style={styles.gridValue}>{scan.ssl_data?.status_code || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>TLS Enforced</Text>
              <Text style={styles.gridValue}>{scan.ssl_data?.tls_enforced ? 'Yes' : 'No'}</Text>
            </View>
          </View>
        </View>

        {/* Security Findings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identified Vulnerabilities</Text>
          {(!scan.threatlens_findings || scan.threatlens_findings.length === 0) ? (
            <Text style={styles.text}>No critical vulnerabilities found during this scan.</Text>
          ) : (
            scan.threatlens_findings.map((finding: any, i: number) => (
              <View key={i} style={styles.findingCard} wrap={false}>
                <Text style={styles.findingTitle}>[{finding.severity.toUpperCase()}] {finding.title}</Text>
                <Text style={styles.findingDesc}>{finding.description}</Text>
                <Text style={styles.findingRemediation}>Fix: {finding.remediation}</Text>
              </View>
            ))
          )}
        </View>

        {/* Attack Surface */}
        {scan.dns_data?.subdomains && scan.dns_data.subdomains.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attack Surface (Discovered Subdomains)</Text>
            {scan.dns_data.subdomains.slice(0, 100).map((sub: any, i: number) => (
              <View key={i} style={styles.tableRow} wrap={false}>
                <Text style={styles.tableCellLeft}>{sub.host}</Text>
                <Text style={styles.tableCellRight}>{sub.ip}</Text>
              </View>
            ))}
            {scan.dns_data.subdomains.length > 100 && (
              <Text style={{...styles.text, marginTop: 10, color: '#6b7280'}}>
                ... and {scan.dns_data.subdomains.length - 100} more subdomains omitted for brevity.
              </Text>
            )}
          </View>
        )}

        {/* Repeating Footer Disclaimer */}
        <View style={styles.footer} fixed>
          <Text style={styles.disclaimerTitle}>CONFIDENTIAL & PROPRIETARY</Text>
          <Text style={styles.disclaimer}>
            This document is generated automatically by ThreatLens Security Intelligence for the authorized recipient. 
            This point-in-time analysis does not guarantee the complete absence of vulnerabilities. For official remediation, always consult certified professionals.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
