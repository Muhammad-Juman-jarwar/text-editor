"use client";

import { useEffect, useState } from "react";
import { TemplateBuilderPreview } from "@/components/template-builder/template-builder-preview";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { Variable } from "lucide-react";

export default function TemplateFullPreview() {
  const [template, setTemplate] = useState<any>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    // Try to get template data from localStorage (set by builder page)
    const stored = localStorage.getItem("template-full-preview");
    if (stored) {
      const { template, zoom } = JSON.parse(stored);
      setTemplate(template);
      setZoom(zoom || 100);
    }
  }, []);

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div>Loading preview...</div>
      </div>
    );
  }

  // console.log("Template Full Preview", template);

  return (
    <div className="h-dvh w-full bg-black overflow-y-auto relative">
      <div className="flex justify-center mt-4 absolute right-10 top-5">
        <Badge variant="secondary">Preview • "A4" • {zoom}%</Badge>
      </div>
      {template.pages.map((page: any, idx: number) => (
        <React.Fragment key={page.id || idx}>
          {/* Main page */}
          <div className="flex justify-center w-full">
            <TemplateBuilderPreview
              template={{
                footer: template.footer,
                header: template.header,
                page: page,
                pageIndex: idx,
                theme: template.theme,
                variables:
                  template.variables.length !== 0 ? template.variables : null,
              }}
              zoom={zoom}
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
