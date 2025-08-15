"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColorPicker } from "@/components/ui/color-picker";

interface PagesTabProps {
  template: any;
  selectedPageId: string;
  onSelectPage: (pageId: string) => void;
  onUpdatePage: (pageId: string, updates: any) => void;
  onAddPage: (templateType?: string) => void;
  onDeletePage: (pageId: string) => void;
}

export function PagesTab({
  template,
  selectedPageId,
  onSelectPage,
  onUpdatePage,
  onAddPage,
  onDeletePage,
}: PagesTabProps) {
  const selectedPage = template.pages.find((p: any) => p.id === selectedPageId);

  return (
    <div className="space-y-4 mt-0">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-foreground">Pages</CardTitle>
            <Button size="sm" onClick={() => onAddPage()}>
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {template.pages.map((page: any, index: number) => (
            <div
              key={page.id}
              className={cn(
                "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group",
                selectedPageId === page.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted/50"
              )}
              onClick={() => onSelectPage(page.id)}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {index + 1}
                </Badge>
                <span className="text-sm font-medium text-foreground">
                  {page.name}
                </span>
              </div>
              {template.pages.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePage(page.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedPage && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-foreground">
              Page Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-foreground">Page Name</Label>
              <Input
                value={selectedPage.name}
                onChange={(e) =>
                  onUpdatePage(selectedPage.id, { name: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-foreground">Show Header</Label>
                <Switch
                  checked={selectedPage.showHeader}
                  onCheckedChange={(checked) =>
                    onUpdatePage(selectedPage.id, { showHeader: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-foreground">Show Footer</Label>
                <Switch
                  checked={selectedPage.showFooter}
                  onCheckedChange={(checked) =>
                    onUpdatePage(selectedPage.id, { showFooter: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-foreground">
                  Show Page Number
                </Label>
                <Switch
                  checked={selectedPage.showPageNumber}
                  onCheckedChange={(checked) =>
                    onUpdatePage(selectedPage.id, { showPageNumber: checked })
                  }
                />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block text-foreground">
                Page Background Color
              </Label>
              <ColorPicker
                value={
                  selectedPage.backgroundColor ||
                  template.theme.colors.pageBackground ||
                  "#ffffff"
                }
                onChange={(color) =>
                  onUpdatePage(selectedPage.id, { backgroundColor: color })
                }
              />
              {selectedPage.backgroundColor && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() =>
                    onUpdatePage(selectedPage.id, {
                      backgroundColor: undefined,
                    })
                  }
                >
                  Reset to theme color
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
