"use client";

import { useState, useMemo } from "react";
import { Terminal, Lock, Globe, HardDrive, Search, Code, Key, Image as ImageIcon, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import exifr from 'exifr';

function rot13(str: string) {
  return str.replace(/[a-zA-Z]/g, function (chr) {
    const start = chr <= "Z" ? 65 : 97;
    return String.fromCharCode(start + ((chr.charCodeAt(0) - start + 13) % 26));
  });
}

export default function CTFToolkitPage() {
  const [cryptoInput, setCryptoInput] = useState("");
  const [cryptoOp, setCryptoOp] = useState("base64_decode");

  // Process cryptography operation (derived from the input, so no effect is needed)
  const { cryptoOutput, cryptoError } = useMemo(() => {
    if (!cryptoInput) {
      return { cryptoOutput: "", cryptoError: "" };
    }

    try {
      let result = "";
      
      switch (cryptoOp) {
        case "base64_decode":
          result = atob(cryptoInput);
          break;
        case "base64_encode":
          result = btoa(cryptoInput);
          break;
        case "hex_decode":
          result = cryptoInput.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || "";
          break;
        case "hex_encode":
          result = Array.from(cryptoInput).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
          break;
        case "url_decode":
          result = decodeURIComponent(cryptoInput);
          break;
        case "url_encode":
          result = encodeURIComponent(cryptoInput);
          break;
        case "rot13":
          result = rot13(cryptoInput);
          break;
        default:
          result = cryptoInput;
      }
      return { cryptoOutput: result, cryptoError: "" };
    } catch (err: any) {
      return { cryptoOutput: "", cryptoError: "Invalid input for this operation" };
    }
  }, [cryptoInput, cryptoOp]);

  // Web Tab (JWT)
  const [jwtInput, setJwtInput] = useState("");

  // Decoded from the input, so it is derived rather than stored.
  const { jwtHeader, jwtPayload, jwtError } = useMemo(() => {
    if (!jwtInput) {
      return { jwtHeader: "", jwtPayload: "", jwtError: "" };
    }
    try {
      const parts = jwtInput.split('.');
      if (parts.length < 2) throw new Error("Invalid JWT format (requires at least Header and Payload)");
      // Function to safely decode base64url to JSON
      const decodeBase64Url = (str: string) => {
        let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        return decodeURIComponent(atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      };
      
      const h = JSON.stringify(JSON.parse(decodeBase64Url(parts[0])), null, 2);
      const p = JSON.stringify(JSON.parse(decodeBase64Url(parts[1])), null, 2);
      return { jwtHeader: h, jwtPayload: p, jwtError: "" };
    } catch (e) {
      return { jwtHeader: "", jwtPayload: "", jwtError: "Invalid or malformed JWT" };
    }
  }, [jwtInput]);

  // Log Parser
  const [logInput, setLogInput] = useState("");
  const [logResults, setLogResults] = useState<{ips: string[], sqlis: string[], agents: string[]}>({ips: [], sqlis: [], agents: []});

  const parseLogs = () => {
    if (!logInput) {
      setLogResults({ips: [], sqlis: [], agents: []});
      return;
    }
    // Extract unique IPs
    const ips = Array.from(new Set(logInput.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || []));
    // Very basic SQLi/XSS payload detection
    const sqlis = Array.from(new Set(logInput.match(/(UNION.+SELECT|SELECT.+FROM|INSERT.+INTO|UPDATE.+SET|DELETE.+FROM|DROP.+TABLE|--\s|1=1|<script>|alert\()/gi) || []));
    // Extract common user agents
    const agents = Array.from(new Set(logInput.match(/"(Mozilla|curl|wget|python-requests|Go-http-client)[^"]*"/gi) || []));
    
    setLogResults({ ips, sqlis, agents: agents.map(a => a.replace(/"/g, '')) });
  };



  // YARA Generator
  const [yaraName, setYaraName] = useState("SuspiciousFile");
  const [yaraAuthor, setYaraAuthor] = useState("Operator");
  const [yaraDesc, setYaraDesc] = useState("Detects anomalies");
  const [yaraStrings, setYaraStrings] = useState<{type: string, value: string}[]>([]);
  const [yaraCondition, setYaraCondition] = useState("any of them");
  const [newStringVal, setNewStringVal] = useState("");
  const [newStringType, setNewStringType] = useState("ascii");

  const addYaraString = () => {
    if (!newStringVal) return;
    setYaraStrings([...yaraStrings, { type: newStringType, value: newStringVal }]);
    setNewStringVal("");
  };

  const removeYaraString = (index: number) => {
    setYaraStrings(yaraStrings.filter((_, i) => i !== index));
  };

  const generateYaraRule = () => {
    let rule = `rule ${yaraName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')} {\n`;
    rule += `  meta:\n`;
    rule += `    author = "${yaraAuthor}"\n`;
    rule += `    description = "${yaraDesc}"\n`;
    
    if (yaraStrings.length > 0) {
      rule += `  strings:\n`;
      yaraStrings.forEach((s, i) => {
        if (s.type === 'hex') {
          rule += `    $s${i} = { ${s.value} }\n`;
        } else {
          rule += `    $s${i} = "${s.value}" ${s.type === 'wide' ? 'wide ' : ''}ascii\n`;
        }
      });
    }
    
    rule += `  condition:\n`;
    rule += `    ${yaraCondition}\n`;
    rule += `}`;
    return rule;
  };

  // OSINT Tab
  const [osintTarget, setOsintTarget] = useState("");
  const [osintType, setOsintType] = useState("ip"); 
  const [osintResult, setOsintResult] = useState("");
  const [osintLoading, setOsintLoading] = useState(false);

  const runOsint = async () => {
    if (!osintTarget) return;
    setOsintLoading(true);
    setOsintResult("Querying intelligence sources...");
    try {
      if (osintType === "ip") {
        const res = await fetch(`https://free.freeipapi.com/api/json/${osintTarget}`);
        const data = await res.json();
        setOsintResult(JSON.stringify(data, null, 2));
      } else if (osintType === "dns") {
        const res = await fetch(`https://dns.google/resolve?name=${osintTarget}`);
        const data = await res.json();
        setOsintResult(JSON.stringify(data, null, 2));
      }
    } catch (e: any) {
      setOsintResult(`Error performing lookup: ${e.message}`);
    } finally {
      setOsintLoading(false);
    }
  };

  // VirusTotal Hash Scanner
  const [vtHash, setVtHash] = useState("");
  const [vtResult, setVtResult] = useState<any>(null);
  const [vtLoading, setVtLoading] = useState(false);
  const [vtError, setVtError] = useState("");

  const scanHash = async () => {
    if (!vtHash) return;
    setVtLoading(true);
    setVtError("");
    setVtResult(null);
    try {
      const res = await fetch('/api/virustotal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: vtHash })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scan hash");
      setVtResult(data);
    } catch (e: any) {
      setVtError(e.message);
    } finally {
      setVtLoading(false);
    }
  };

  // Forensics Tab
  const [fileMagic, setFileMagic] = useState<string>("");
  const [fileAnalysis, setFileAnalysis] = useState<any>(null);
  const [exifData, setExifData] = useState<any>(null);
  const [stegoLoading, setStegoLoading] = useState(false);
  const [stegoOutput, setStegoOutput] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedFile(file);
    setStegoOutput("");
    setFileAnalysis({
      name: file.name,
      size: file.size,
      type: file.type || "Unknown",
    });

    // Extract Magic Number (First 16 bytes)
    const reader = new FileReader();
    reader.onload = function(evt) {
      if (evt.target?.result) {
        const buffer = evt.target.result as ArrayBuffer;
        const uint8 = new Uint8Array(buffer).subarray(0, 16);
        const hex = Array.from(uint8).map(b => b.toString(16).padStart(2, '0')).join(' ').toUpperCase();
        setFileMagic(hex);
      }
    };
    reader.readAsArrayBuffer(file.slice(0, 16)); 

    // Extract EXIF data if image
    if (file.type.startsWith('image/')) {
      try {
        const exif = await exifr.parse(file);
        setExifData(exif || { error: "No EXIF metadata found." });
      } catch (err) {
        setExifData({ error: "Unsupported image format for EXIF." });
      }
    } else {
      setExifData(null);
    }
  };

  const extractLSB = async () => {
    if (!uploadedFile || !uploadedFile.type.startsWith('image/')) return;
    setStegoLoading(true);
    setStegoOutput("");
    
    try {
      const bitmap = await createImageBitmap(uploadedFile);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas not supported");
      
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      let binaryStr = "";
      // Extract the Least Significant Bit from RGB values
      for (let i = 0; i < imageData.length && binaryStr.length < 8000; i += 4) {
        binaryStr += (imageData[i] & 1).toString();   // Red
        binaryStr += (imageData[i+1] & 1).toString(); // Green
        binaryStr += (imageData[i+2] & 1).toString(); // Blue
        // Skip Alpha channel (i+3) as it's rarely used in simple LSB
      }
      
      // Convert binary to ASCII text
      let ascii = "";
      for (let i = 0; i < binaryStr.length; i += 8) {
        const byte = binaryStr.slice(i, i+8);
        if (byte.length === 8) {
          const charCode = parseInt(byte, 2);
          // Only show printable ASCII characters to reduce noise
          if (charCode >= 32 && charCode <= 126) {
             ascii += String.fromCharCode(charCode);
          } else {
             ascii += '.'; // Non-printable noise
          }
        }
      }
      setStegoOutput(ascii);
    } catch (e: any) {
      setStegoOutput("Error extracting LSB: " + e.message);
    } finally {
      setStegoLoading(false);
    }
  };

  const getMagicDescription = (hex: string) => {
    if (!hex) return "";
    const h = hex.replace(/ /g, '');
    if (h.startsWith('89504E47')) return 'PNG Image File';
    if (h.startsWith('FFD8FF')) return 'JPEG Image File';
    if (h.startsWith('504B0304')) return 'ZIP Archive / Office XML (DOCX, XLSX)';
    if (h.startsWith('4D5A')) return 'Windows PE Executable (EXE/DLL)';
    if (h.startsWith('7F454C46')) return 'Linux ELF Executable';
    if (h.startsWith('25504446')) return 'PDF Document';
    if (h.startsWith('52617221')) return 'RAR Archive';
    if (h.startsWith('1F8B')) return 'GZIP Compressed File';
    if (h.startsWith('53514C69')) return 'SQLite 3 Database';
    if (h.startsWith('D0CF11E0')) return 'Microsoft Office (Legacy DOC, XLS)';
    if (h.startsWith('47494638')) return 'GIF Image File';
    if (h.startsWith('89484446')) return 'HDF Document';
    return 'Unknown Signature - Copy hex and search online!';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Terminal className="w-6 h-6 text-indigo-500" />
          CTF Toolkit
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Integrated CyberChef, OSINT, and Forensics tools for solving Capture The Flag challenges.</p>
      </div>

      {/* Main Tabs UI */}
      <Tabs defaultValue="crypto" className="w-full">
        <div className="bg-[#020202] border border-border rounded-lg p-1.5 mb-6 shadow-sm overflow-x-auto">
          <TabsList className="flex w-full min-w-max bg-transparent">
            <TabsTrigger value="crypto" className="flex-1 rounded-md py-2.5 data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400 data-[state=active]:border data-[state=active]:border-indigo-500/20 border border-transparent transition-all text-muted-foreground flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Cryptography & Encodings
            </TabsTrigger>
            <TabsTrigger value="web" className="flex-1 rounded-md py-2.5 data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400 data-[state=active]:border data-[state=active]:border-indigo-500/20 border border-transparent transition-all text-muted-foreground flex items-center justify-center gap-2">
              <Globe className="w-4 h-4" />
              Web Exploitation
            </TabsTrigger>
            <TabsTrigger value="osint" className="flex-1 rounded-md py-2.5 data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400 data-[state=active]:border data-[state=active]:border-indigo-500/20 border border-transparent transition-all text-muted-foreground flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              OSINT Engine
            </TabsTrigger>
            <TabsTrigger value="forensics" className="flex-1 rounded-md py-2.5 data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400 data-[state=active]:border data-[state=active]:border-indigo-500/20 border border-transparent transition-all text-muted-foreground flex items-center justify-center gap-2">
              <HardDrive className="w-4 h-4" />
              Forensics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Cryptography Tab */}
        <TabsContent value="crypto" className="space-y-6">
          <div className="bg-[#020202] border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-indigo-500" />
              Data Encoder / Decoder
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">Input Data</label>
                <textarea 
                  value={cryptoInput}
                  onChange={(e) => setCryptoInput(e.target.value)}
                  className="w-full h-64 bg-background border border-border rounded-lg p-4 text-foreground font-mono text-sm focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
                  placeholder="Paste your ciphertext, base64, or raw data here..."
                />
              </div>

              {/* Output */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                    Output Result
                    {cryptoError && <span className="text-rose-400 text-xs font-normal bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">{cryptoError}</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <select 
                      value={cryptoOp}
                      onChange={(e) => setCryptoOp(e.target.value)}
                      className="bg-background border border-border rounded-md text-xs py-1 px-2 text-foreground focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="base64_decode">Base64 Decode</option>
                      <option value="base64_encode">Base64 Encode</option>
                      <option value="hex_decode">Hex Decode</option>
                      <option value="hex_encode">Hex Encode</option>
                      <option value="url_decode">URL Decode</option>
                      <option value="url_encode">URL Encode</option>
                      <option value="rot13">ROT13</option>
                    </select>
                  </div>
                </div>
                <textarea 
                  value={cryptoOutput}
                  readOnly
                  className="w-full h-64 bg-background border border-border rounded-lg p-4 text-emerald-400 font-mono text-sm focus:outline-none resize-none"
                  placeholder="Result will appear here..."
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Web Exploitation Tab */}
        <TabsContent value="web" className="space-y-6">
          <div className="bg-[#020202] border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-indigo-500" />
              JWT Debugger
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* JWT Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">Encoded Token</label>
                <textarea 
                  value={jwtInput}
                  onChange={(e) => setJwtInput(e.target.value)}
                  className="w-full h-80 bg-background border border-border rounded-lg p-4 text-rose-400 font-mono text-sm focus:outline-none focus:border-indigo-500/50 resize-none break-all"
                  placeholder="Paste a JSON Web Token (ey...) here..."
                />
              </div>

              {/* JWT Output */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                  Decoded Result
                  {jwtError && <span className="text-rose-400 text-xs font-normal bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">{jwtError}</span>}
                </label>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-xs text-rose-400 font-medium mb-1 px-1">HEADER: ALGORITHM & TOKEN TYPE</div>
                    <textarea 
                      value={jwtHeader}
                      readOnly
                      className="w-full h-24 bg-background border border-border rounded-lg p-4 text-emerald-400 font-mono text-sm focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-indigo-400 font-medium mb-1 px-1">PAYLOAD: DATA</div>
                    <textarea 
                      value={jwtPayload}
                      readOnly
                      className="w-full h-44 bg-background border border-border rounded-lg p-4 text-emerald-400 font-mono text-sm focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Log Parser */}
          <div className="bg-[#020202] border border-border rounded-lg p-6 shadow-sm mt-6">
            <h2 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-indigo-500" />
              Advanced Log Parser
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">Raw Access Logs (Apache / Nginx)</label>
                <textarea 
                  value={logInput}
                  onChange={(e) => setLogInput(e.target.value)}
                  className="w-full h-80 bg-background border border-border rounded-lg p-4 text-foreground font-mono text-sm focus:outline-none focus:border-indigo-500/50 resize-none break-all whitespace-pre"
                  placeholder='192.168.1.1 - - [10/Oct/2026:13:55:36 -0700] "GET /index.php?id=1 UNION SELECT 1,2,3-- HTTP/1.1" 200 2326 "http://example.com/" "Mozilla/5.0..."'
                />
                <button 
                  onClick={parseLogs}
                  disabled={!logInput}
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Extract Intelligence
                </button>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-foreground">Extracted Threat Intelligence</label>
                <div className="bg-background border border-border rounded-lg p-5 min-h-[360px] space-y-6">
                  
                  <div>
                    <div className="text-xs text-rose-400 font-medium mb-2 uppercase tracking-wider flex items-center justify-between">
                      <span>Potential Payloads (SQLi / XSS)</span>
                      <span className="bg-rose-500/10 text-rose-400 px-2 rounded-full border border-rose-500/20">{logResults.sqlis.length}</span>
                    </div>
                    {logResults.sqlis.length > 0 ? (
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {logResults.sqlis.map((sqli, i) => (
                          <div key={i} className="text-xs font-mono text-foreground bg-muted p-1 rounded">{sqli}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">No obvious payloads detected.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-indigo-400 font-medium mb-2 uppercase tracking-wider flex items-center justify-between">
                      <span>Unique IP Addresses</span>
                      <span className="bg-indigo-500/10 text-indigo-400 px-2 rounded-full border border-indigo-500/20">{logResults.ips.length}</span>
                    </div>
                    {logResults.ips.length > 0 ? (
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {logResults.ips.map((ip, i) => (
                          <span key={i} className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded">{ip}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">No IPs found.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-emerald-400 font-medium mb-2 uppercase tracking-wider flex items-center justify-between">
                      <span>Unique User Agents</span>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 rounded-full border border-emerald-500/20">{logResults.agents.length}</span>
                    </div>
                    {logResults.agents.length > 0 ? (
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {logResults.agents.map((agent, i) => (
                          <div key={i} className="text-xs font-mono text-foreground bg-muted p-1 rounded truncate">{agent}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">No User-Agents found.</div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* OSINT Tab */}
        <TabsContent value="osint" className="space-y-6">
          <div className="bg-[#020202] border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium text-foreground flex items-center gap-2 mb-2">
              <Search className="w-5 h-5 text-indigo-500" />
              OSINT Engine
            </h2>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 mb-6">
              <p className="text-xs text-amber-400 font-medium">Compliance Notice: 100% Passive Lookups</p>
              <p className="text-[11px] text-amber-500/80 mt-1">
                The tools in this engine only query public, legal APIs (like Google DNS) to retrieve public records. No active probing, port scanning (e.g., Nmap), or illegal exploitation of remote infrastructure is performed by this platform.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Search Controls */}
              <div className="space-y-4 lg:col-span-1">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Target Scope</label>
                  <select 
                    value={osintType}
                    onChange={(e) => setOsintType(e.target.value)}
                    className="w-full bg-card border border-border rounded-md h-10 px-3 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                  >
                    <option value="ip">IP Geolocation</option>
                    <option value="dns">DNS Over HTTPS Lookup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Target Value</label>
                  <input 
                    type="text"
                    value={osintTarget}
                    onChange={(e) => setOsintTarget(e.target.value)}
                    placeholder={osintType === 'ip' ? 'e.g. 8.8.8.8' : 'e.g. example.com'}
                    className="w-full bg-background border border-border rounded-md py-2 px-3 text-foreground focus:outline-none focus:border-indigo-500/50 text-sm font-mono"
                  />
                </div>
                <button 
                  onClick={runOsint}
                  disabled={osintLoading || !osintTarget}
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {osintLoading ? "Running Search..." : "Execute Scan"}
                </button>
              </div>

              {/* Output Result */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="json" className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-foreground">OSINT Results</label>
                    <TabsList className="bg-background border border-border rounded-md p-1 h-9">
                      <TabsTrigger value="json" className="text-xs px-3 py-1 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400">Raw JSON</TabsTrigger>
                      {osintType === "ip" && (
                        <TabsTrigger value="map" className="text-xs px-3 py-1 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400">Satellite Map</TabsTrigger>
                      )}
                    </TabsList>
                  </div>
                  
                  <TabsContent value="json" className="m-0">
                    <textarea 
                      value={osintResult}
                      readOnly
                      className="w-full h-80 bg-background border border-border rounded-lg p-4 text-amber-400 font-mono text-sm focus:outline-none resize-none"
                      placeholder="Query results will appear here in JSON format..."
                    />
                  </TabsContent>
                  
                  {osintType === "ip" && (
                    <TabsContent value="map" className="m-0">
                      {(() => {
                        try {
                          if (osintResult && !osintResult.startsWith("Error") && osintResult !== "Querying intelligence sources...") {
                            const parsed = JSON.parse(osintResult);
                            const lat = parsed.latitude || parsed.lat;
                            const lon = parsed.longitude || parsed.lon;
                            if (lat && lon) {
                              return (
                                <div className="w-full h-80 bg-background border border-border rounded-lg overflow-hidden animate-in fade-in">
                                  <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    style={{ border: 0 }}
                                    src={`https://maps.google.com/maps?q=${lat},${lon}&z=12&output=embed`}
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              );
                            }
                          }
                        } catch (e) {
                          // Ignore parsing errors
                        }
                        return (
                          <div className="w-full h-80 bg-background border border-border rounded-lg p-4 flex items-center justify-center text-muted-foreground text-sm">
                            Map data is not available. Please run an IP Geolocation scan first.
                          </div>
                        );
                      })()}
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </div>

            {/* VirusTotal Integration */}
            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-indigo-400" />
                VirusTotal Malware Analysis
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Hash Input */}
                <div className="space-y-4 lg:col-span-1">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">File Hash (MD5, SHA1, SHA256)</label>
                    <input 
                      type="text"
                      value={vtHash}
                      onChange={(e) => setVtHash(e.target.value.trim())}
                      placeholder="e.g. 44d88612fea8a8f36de82e1278abb02f"
                      className="w-full bg-background border border-border rounded-md py-2 px-3 text-foreground focus:outline-none focus:border-indigo-500/50 text-sm font-mono"
                    />
                  </div>
                  <button 
                    onClick={scanHash}
                    disabled={vtLoading || !vtHash}
                    className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-500 text-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {vtLoading ? "Scanning VirusTotal..." : "Analyze Hash"}
                  </button>
                  {vtError && <div className="text-xs text-rose-400 mt-2">{vtError}</div>}
                </div>

                {/* VT Results */}
                <div className="lg:col-span-2">
                  <div className="bg-background border border-border rounded-lg p-5 min-h-[140px]">
                    {vtResult ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase">Detection Ratio</div>
                            <div className="text-2xl font-bold text-foreground flex items-center gap-2 mt-1">
                              <span className={vtResult.data?.attributes?.last_analysis_stats?.malicious > 0 ? "text-rose-500" : "text-emerald-500"}>
                                {vtResult.data?.attributes?.last_analysis_stats?.malicious || 0}
                              </span>
                              <span className="text-muted-foreground text-base">/</span>
                              <span className="text-muted-foreground text-base">
                                {(vtResult.data?.attributes?.last_analysis_stats?.malicious || 0) + 
                                 (vtResult.data?.attributes?.last_analysis_stats?.undetected || 0)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground uppercase">Reputation</div>
                            <div className="text-lg font-medium text-foreground mt-1">
                              {vtResult.data?.attributes?.reputation}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Names:</span> {vtResult.data?.attributes?.names?.slice(0, 3).join(', ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">File Type:</span> {vtResult.data?.attributes?.type_description}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm h-full pt-10">
                        Enter a hash to pull a live VirusTotal report...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </TabsContent>

        {/* Forensics Tab */}
        <TabsContent value="forensics" className="space-y-6">
          <div className="bg-[#020202] border border-border rounded-lg p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-500" />
                Digital Forensics & Steganography
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Upload a file to identify its true Magic Number. If it&apos;s an image, we will automatically extract its hidden EXIF metadata and allow you to perform Least Significant Bit (LSB) steganography extraction.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Upload Zone */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-full min-h-[16rem] border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center z-10">
                    <HardDrive className="w-10 h-10 mb-3 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
                    <p className="mb-2 text-sm text-foreground"><span className="font-medium text-indigo-400">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-muted-foreground">Magic Number Analysis supports ANY file format.</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Steganography & EXIF tools only support JPG/PNG/GIF/BMP.</p>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                  {uploadedFile && uploadedFile.type.startsWith('image/') && (
                    <div className="absolute inset-0 opacity-10 blur-sm pointer-events-none">
                      <img src={URL.createObjectURL(uploadedFile)} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </label>
              </div>

              {/* Analysis Result */}
              <div className="space-y-6">
                
                {/* General File Info */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Magic Number Signature</label>
                  {fileAnalysis ? (
                    <div className="bg-background border border-border rounded-lg p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
                        <div>
                          <div className="text-xs text-muted-foreground">Filename</div>
                          <div className="text-sm text-foreground font-medium truncate">{fileAnalysis.name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Claimed MIME Type</div>
                          <div className="text-sm text-foreground font-medium truncate">{fileAnalysis.type}</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-indigo-400 font-medium mb-1">RAW HEX HEADER (FIRST 16 BYTES)</div>
                        <div className="font-mono text-base bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-3 rounded break-all tracking-wider">
                          {fileMagic}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-emerald-400 font-medium mb-1">IDENTIFIED FILE FORMAT</div>
                        <div className="text-sm font-medium text-foreground flex items-center gap-2">
                          {getMagicDescription(fileMagic) === 'Unknown Signature - Copy hex and search online!' ? (
                            <span className="text-amber-400">{getMagicDescription(fileMagic)}</span>
                          ) : (
                            <span className="text-emerald-400">{getMagicDescription(fileMagic)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-background border border-border rounded-lg p-4 flex items-center justify-center text-muted-foreground text-sm text-center">
                      Awaiting file upload...
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Advanced Image Forensics (Stego & Exif) */}
            {fileAnalysis && uploadedFile?.type.startsWith('image/') && (
              <div className="mt-8 pt-8 border-t border-border grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                
                {/* EXIF Data */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Hidden EXIF Metadata
                  </h3>
                  <div className="bg-background border border-border rounded-lg p-4 h-64 overflow-y-auto">
                    {exifData ? (
                      <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                        {JSON.stringify(exifData, null, 2)}
                      </pre>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Parsing metadata...</div>
                    )}
                  </div>
                </div>

                {/* LSB Steganography */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-rose-400" />
                      LSB Steganography Extractor
                    </h3>
                    <button 
                      onClick={extractLSB}
                      disabled={stegoLoading}
                      className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      {stegoLoading ? "Extracting..." : "Extract LSB Strings"}
                    </button>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-4 h-64 overflow-y-auto">
                    {stegoOutput ? (
                      <div className="text-xs text-amber-400 font-mono whitespace-pre-wrap break-all leading-relaxed">
                        {stegoOutput}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center">
                        Click Extract to scan the image&apos;s Least Significant Bits for hidden ASCII text flags.<br/>(Warning: Output may contain heavy noise)
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
            
          </div>

          {/* YARA Rule Generator */}
          <div className="bg-[#020202] border border-border rounded-lg p-6 shadow-sm mt-6">
            <h2 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-indigo-500" />
              YARA Rule Generator
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Rule Name</label>
                    <input type="text" value={yaraName} onChange={e => setYaraName(e.target.value)} className="w-full bg-background border border-border rounded py-1.5 px-3 text-sm text-foreground focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Author</label>
                    <input type="text" value={yaraAuthor} onChange={e => setYaraAuthor(e.target.value)} className="w-full bg-background border border-border rounded py-1.5 px-3 text-sm text-foreground focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                  <input type="text" value={yaraDesc} onChange={e => setYaraDesc(e.target.value)} className="w-full bg-background border border-border rounded py-1.5 px-3 text-sm text-foreground focus:outline-none focus:border-indigo-500" />
                </div>
                
                <div className="pt-2 border-t border-border">
                  <label className="block text-sm font-medium text-foreground mb-2">Identification Strings</label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <select value={newStringType} onChange={e => setNewStringType(e.target.value)} className="bg-background border border-border rounded px-2 py-1.5 sm:py-0 text-sm text-foreground focus:outline-none focus:border-indigo-500">
                      <option value="ascii">ASCII</option>
                      <option value="wide">Wide</option>
                      <option value="hex">Hex</option>
                    </select>
                    <input 
                      type="text" 
                      value={newStringVal} 
                      onChange={e => setNewStringVal(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && addYaraString()}
                      placeholder="e.g. cmd.exe or 4D 5A" 
                      className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-sm text-foreground font-mono focus:outline-none focus:border-indigo-500" 
                    />
                    <button onClick={addYaraString} className="px-3 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded text-sm transition-colors">Add</button>
                  </div>
                  
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {yaraStrings.map((s, i) => (
                      <div key={i} className="flex justify-between items-center bg-muted px-3 py-1.5 rounded text-sm font-mono">
                        <span className="text-emerald-400 truncate"><span className="text-muted-foreground mr-2">${i}:</span>{s.type === 'hex' ? `{ ${s.value} }` : `"${s.value}"`}</span>
                        <button onClick={() => removeYaraString(i)} className="text-rose-400 hover:text-rose-300 ml-2">✕</button>
                      </div>
                    ))}
                    {yaraStrings.length === 0 && <div className="text-xs text-muted-foreground italic">No strings added yet.</div>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Match Condition</label>
                  <select value={yaraCondition} onChange={e => setYaraCondition(e.target.value)} className="w-full bg-background border border-border rounded py-1.5 px-3 text-sm text-foreground focus:outline-none focus:border-indigo-500">
                    <option value="any of them">Any of them (OR logic)</option>
                    <option value="all of them">All of them (AND logic)</option>
                    <option value="$s0 and $s1">Custom Expression (Edit below)</option>
                  </select>
                  {yaraCondition === "$s0 and $s1" && (
                    <input type="text" value={yaraCondition} onChange={e => setYaraCondition(e.target.value)} className="w-full bg-background border border-border rounded py-1.5 px-3 text-sm text-foreground font-mono mt-2 focus:outline-none focus:border-indigo-500" placeholder="$s0 and ($s1 or $s2)" />
                  )}
                </div>
              </div>

              <div className="h-full">
                <label className="block text-sm font-medium text-foreground mb-2">Generated .YAR Rule</label>
                <textarea 
                  readOnly
                  value={generateYaraRule()}
                  className="w-full h-full min-h-[300px] bg-background border border-border rounded-lg p-4 text-emerald-400 font-mono text-xs focus:outline-none resize-none whitespace-pre"
                />
              </div>

            </div>
          </div>

        </TabsContent>
      </Tabs>
    </div>
  );
}
