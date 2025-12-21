
import React, { useEffect } from 'react';
import { useApp } from '../App';

export const Analytics: React.FC = () => {
  const { settings } = useApp();
  const gaId = settings.googleAnalyticsId;

  useEffect(() => {
    if (!gaId) return;

    // Check if script already exists
    const scriptId = 'google-analytics-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    
    document.head.appendChild(script);

    const inlineScript = document.createElement('script');
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
    document.head.appendChild(inlineScript);

  }, [gaId]);

  return null;
};
