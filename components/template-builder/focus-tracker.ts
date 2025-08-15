// Focus tracker for layout columns, headers, and footers
let currentlyFocusedColumn: HTMLElement | null = null;
let currentlyFocusedHeader: HTMLElement | null = null;
let currentlyFocusedFooter: HTMLElement | null = null;

export function setFocusedColumn(element: HTMLElement | null) {
  currentlyFocusedColumn = element;
}

export function getFocusedColumn(): HTMLElement | null {
  return currentlyFocusedColumn;
}

// Get the currently focused text in header
export function getFocusedHeaderText(): string | null {
  if (currentlyFocusedHeader) {
    return currentlyFocusedHeader.textContent || null;
  }
  return null;
}

// Get the currently focused text in footer
export function getFocusedFooterText(): string | null {
  if (currentlyFocusedFooter) {
    return currentlyFocusedFooter.textContent || null;
  }
  return null;
}

export function setFocusedHeader(element: HTMLElement | null) {
  currentlyFocusedHeader = element;
}

export function getFocusedHeader(): HTMLElement | null {
  return currentlyFocusedHeader;
}

export function setFocusedFooter(element: HTMLElement | null) {
  currentlyFocusedFooter = element;
}

export function getFocusedFooter(): HTMLElement | null {
  return currentlyFocusedFooter;
}

export function getFocusedFooterContainer(): HTMLElement | null {
  // If currentlyFocusedFooter is set, return its parent footer container
  if (currentlyFocusedFooter) {
    // Assuming the footer container has a class or tag, e.g. 'footer-container'
    return currentlyFocusedFooter.closest(".footer-container");
  }
  return null;
}

// Make functions available globally for inline HTML event handlers
if (typeof window !== "undefined") {
  (window as any).setFocusedColumn = setFocusedColumn;
  (window as any).getFocusedColumn = getFocusedColumn;
  (window as any).setFocusedHeader = setFocusedHeader;
  (window as any).getFocusedHeader = getFocusedHeader;
  (window as any).setFocusedFooter = setFocusedFooter;
  (window as any).getFocusedFooter = getFocusedFooter;
  (window as any).handleColumnBlur = (element: HTMLElement) => {
    if (element === currentlyFocusedColumn) {
      currentlyFocusedColumn = null;
    }
  };
  (window as any).handleHeaderBlur = (element: HTMLElement) => {
    if (element === currentlyFocusedHeader) {
      currentlyFocusedHeader = null;
    }
  };
  (window as any).handleFooterBlur = (element: HTMLElement) => {
    if (element === currentlyFocusedFooter) {
      currentlyFocusedFooter = null;
    }
  };
}
