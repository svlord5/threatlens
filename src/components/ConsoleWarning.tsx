"use client";

import { useEffect } from "react";

export function ConsoleWarning() {
  useEffect(() => {
    setTimeout(() => {
      // Only run in production or if explicitly desired, but since it's a security feature,
      // running it always is fine (except maybe it annoys during dev, but let's add it).
    
      const asciiArt = `
  _____ _                    _   _                     
 |_   _| |__  _ __ ___  __ _| |_| |    ___ _ __  ___ 
   | | | '_ \\| '__/ _ \\/ _\` | __| |   / _ \\ '_ \\/ __|
   | | | | | | | |  __/ (_| | |_| |__|  __/ | | \\__ \\
   |_| |_| |_|_|  \\___|\\__,_|\\__|_____\\___|_| |_|___/
`;

      console.log(
        `%c${asciiArt}`,
        "color: #ef4444; font-family: monospace; font-weight: bold;"
      );

      console.log(
        "%cSTOP!",
        "color: red; font-family: sans-serif; font-size: 60px; font-weight: bold; text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000;"
      );
      
      console.log(
        "%cThis is a browser feature intended for developers.",
        "color: white; font-family: sans-serif; font-size: 20px;"
      );
      
      console.log(
        "%cIf someone told you to copy and paste something here to enable a feature or 'hack' someone's account, it is a scam and will give them access to your ThreatLens/OneRiki account.",
        "color: white; font-family: sans-serif; font-size: 16px; font-weight: bold;"
      );

      console.log(
        "%cSee https://en.wikipedia.org/wiki/Self-XSS for more information.",
        "color: #3b82f6; font-family: sans-serif; font-size: 14px;"
      );

      console.log(
        "%cIf you are a security researcher, please contact us at hello@surajv5.in before performing any testing.",
        "color: #10b981; font-family: sans-serif; font-size: 14px; font-weight: bold; padding: 4px 0;"
      );

      console.log(
        "%cNotice: Unauthorized access, injection attempts, or malicious activities are logged and actively monitored.",
        "color: #ef4444; font-family: sans-serif; font-size: 12px; font-style: italic; padding-top: 10px;"
      );
      
      // Optionally override console to prevent basic script execution (though this is easily bypassed)
      // but we will just print the warning.
    }, 1000);
  }, []);

  return null;
}
