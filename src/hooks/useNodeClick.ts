
import { useCallback } from 'react';

/**
 * A hook to safely handle node clicks in the JourneyMap
 */
export const useNodeClick = () => {
  /**
   * Safely triggers a click event on an element
   * @param element The DOM element to click
   */
  const safeClick = useCallback((element: Element | null) => {
    if (!element) return;
    
    // Check if the element has a click method (like an HTMLElement)
    if ('click' in element && typeof (element as HTMLElement).click === 'function') {
      (element as HTMLElement).click();
    } else {
      // Fallback to dispatching a custom click event
      const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(event);
    }
  }, []);

  return { safeClick };
};

export default useNodeClick;
