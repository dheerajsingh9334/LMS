"use client";

import { useEffect, useState } from 'react';

export const HydrationTest = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check for hydration mismatches in DOM
    const checkForHydrationIssues = () => {
      // Find all elements with invalid nesting patterns
      const paragraphs = document.querySelectorAll('p');
      const invalidNesting: Array<{ element: Element; issue: string }> = [];

      paragraphs.forEach(p => {
        // Check for div inside p (common cause of hydration errors)
        const divs = p.querySelectorAll('div');
        if (divs.length > 0) {
          invalidNesting.push({
            element: p,
            issue: `Found ${divs.length} div element(s) inside p tag`
          });
        }

        // Check for other block elements inside p
        const blockElements = p.querySelectorAll('h1, h2, h3, h4, h5, h6, section, article, aside, nav, header, footer, main');
        if (blockElements.length > 0) {
          invalidNesting.push({
            element: p,
            issue: `Found block elements inside p tag: ${Array.from(blockElements).map(el => el.tagName.toLowerCase()).join(', ')}`
          });
        }
      });

      if (invalidNesting.length > 0) {
        console.error('🚨 HYDRATION ISSUE DETECTED - Invalid HTML Nesting:');
        invalidNesting.forEach((item, index) => {
          console.error(`${index + 1}. ${item.issue}`);
          console.error('Element:', item.element);
          console.error('Parent classes:', item.element.className);
          console.error('Content preview:', item.element.textContent?.substring(0, 100) + '...');
          console.error('---');
        });
        
        // Also show in UI for debugging
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          background: red;
          color: white;
          padding: 10px;
          border-radius: 5px;
          z-index: 9999;
          max-width: 300px;
          font-size: 12px;
        `;
        debugDiv.innerHTML = `
          <strong>Hydration Issues Found:</strong><br/>
          ${invalidNesting.map(item => item.issue).join('<br/>')}
        `;
        document.body.appendChild(debugDiv);

        // Auto-remove after 10 seconds
        setTimeout(() => {
          debugDiv.remove();
        }, 10000);
      } else {
        console.log('✅ No hydration-causing invalid HTML nesting detected');
      }
    };

    // Run check after a short delay to allow DOM to settle
    setTimeout(checkForHydrationIssues, 1000);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        background: 'blue',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '3px',
        fontSize: '10px',
        zIndex: 9998
      }}
    >
      Hydration Debugger Active
    </div>
  );
};