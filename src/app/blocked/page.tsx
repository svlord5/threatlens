"use client";

import { ShieldX, RefreshCw, Headphones, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function BlockedPage() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Generated once per page load (lazy initializer keeps render pure).
  const [refId] = useState(
    () => "RAY-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + new Date().getTime().toString().substring(8)
  );

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-rose-100 flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center px-6 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-foreground font-bold text-lg">b</span>
          </div>
          <span className="font-bold text-xl text-blue-600 tracking-tight">boomerang</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center pt-24 px-4 pb-12">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-8 relative">
          <ShieldX className="w-10 h-10 text-rose-500" strokeWidth={2} />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-center text-zinc-900">
          Your request was blocked to protect our service
        </h1>
        <p className="text-muted-foreground mb-12 text-center max-w-xl text-[15px]">
          This can happen if your network, browser configuration, or request looked unusual.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-8">
          {/* Card 1 */}
          <div className="border border-zinc-200 rounded-xl p-6 shadow-sm bg-white flex flex-col">
            <h3 className="font-bold text-[15px] mb-3 text-zinc-900">Retry your request</h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">
              The block may have been triggered by a temporary issue. Try refreshing the page, <a href="#" className="text-blue-600 hover:underline">clearing your browser cache</a>, or attempting to sign in again.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-2.5 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>
          </div>

          {/* Card 2 */}
          <div className="border border-zinc-200 rounded-xl p-6 shadow-sm bg-white flex flex-col">
            <h3 className="font-bold text-[15px] mb-3 text-zinc-900">Check your connection</h3>
            <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
              If you&apos;re using a VPN, proxy server, or Tor browser, try disabling it temporarily. Some IP addresses used by third-party providers may be blocked due to abuse by other users.
            </p>
          </div>

          {/* Card 3 */}
          <div className="border border-zinc-200 rounded-xl p-6 shadow-sm bg-white flex flex-col">
            <h3 className="font-bold text-[15px] mb-3 text-zinc-900">Try a different network</h3>
            <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
              If you&apos;re on a shared network like a coffee shop or office, another user may have triggered security measures. Try switching networks.
            </p>
          </div>
        </div>

        {/* Support Banner */}
        <div className="max-w-5xl w-full bg-zinc-50 border border-zinc-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <Headphones className="w-6 h-6 text-zinc-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[15px] text-zinc-900 mb-1">Still having trouble?</h3>
              <p className="text-sm text-muted-foreground">Contact our support team and provide the reference ID below.</p>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-background text-foreground text-sm font-semibold rounded-lg shadow-md transition-colors whitespace-nowrap">
            Contact Support
          </button>
        </div>

        {/* Technical Details Accordion */}
        <div className="max-w-5xl w-full border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <button 
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-zinc-50 transition-colors text-left"
          >
            <span className="font-semibold text-sm text-zinc-900">Technical Details</span>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
          </button>
          
          {detailsOpen && (
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 font-mono text-xs text-muted-foreground space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference ID:</span>
                <span className="font-semibold text-zinc-800">{refId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IP Address:</span>
                <span className="font-semibold text-zinc-800">CLIENT_IP_HIDDEN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timestamp:</span>
                <span className="font-semibold text-zinc-800">{new Date().toUTCString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ray ID:</span>
                <span className="font-semibold text-zinc-800">{refId.split('-')[1]}</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
