"use client";

import { useEffect } from 'react';

export function HydrationDebugger() {
  useEffect(() => {
    // Check for any elements that might be causing hydration issues
    const checkInvalidNesting = () => {
      const paragraphs = document.querySelectorAll('p');
      paragraphs.forEach((p, index) => {
        const divs = p.querySelectorAll('div');
        if (divs.length > 0) {
          console.warn(`Hydration issue found: div inside p at index ${index}`, {
            paragraph: p,
            divs: Array.from(divs),
            parentClasses: p.className,
            content: p.textContent?.substring(0, 100)
          });
        }
      });
    };

    // Run after a short delay to let React finish hydration
    setTimeout(checkInvalidNesting, 1000);
  }, []);

  return null;
}