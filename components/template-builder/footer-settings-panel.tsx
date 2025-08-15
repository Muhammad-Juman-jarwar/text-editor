"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "@/components/ui/color-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface FooterSettingsPanelProps {
  template: any;
  onUpdate: (updates: any) => void;
  onClose: () => void;
}

interface FooterSettings {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  height: number;
  borderColor: string;
  borderWidth: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

const defaultFooterSettings: FooterSettings = {
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  textColor: "#000000",
  fontSize: 10,
  fontFamily: "Arial",
  height: 40,
  borderColor: "#c0c0c0",
  borderWidth: 1,
  padding: {
    top: 0,
    right: 24,
    bottom: 0,
    left: 24,
  },
};

const fontOptions = [
  "Arial",
  "Times New Roman",
  "Helvetica",
  "Georgia",
  "Verdana",
  "Calibri",
  "Inter",
  "Roboto",
];

export function FooterSettingsPanel({
  template,
  onUpdate,
  onClose,
}: FooterSettingsPanelProps) {
  const [settings, setSettings] = useState<FooterSettings>(
    defaultFooterSettings
  );

  // Load current footer settings from template
  useEffect(() => {
    if (template?.footer) {
      setSettings({
        backgroundColor:
          template.footer.backgroundColor ||
          defaultFooterSettings.backgroundColor,
        textColor: template.footer.textColor || defaultFooterSettings.textColor,
        fontSize: template.footer.fontSize || defaultFooterSettings.fontSize,
        fontFamily:
          template.footer.fontFamily || defaultFooterSettings.fontFamily,
        height: template.footer.height || defaultFooterSettings.height,
        borderColor:
          template.footer.borderColor || defaultFooterSettings.borderColor,
        borderWidth:
          template.footer.borderWidth || defaultFooterSettings.borderWidth,
        padding: {
          top:
            template.footer.padding?.top || defaultFooterSettings.padding.top,
          right:
            template.footer.padding?.right ||
            defaultFooterSettings.padding.right,
          bottom:
            template.footer.padding?.bottom ||
            defaultFooterSettings.padding.bottom,
          left:
            template.footer.padding?.left || defaultFooterSettings.padding.left,
        },
      });
    }
  }, [template]);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Update template immediately
    onUpdate({
      ...template,
      footer: {
        ...template.footer,
        ...newSettings,
      },
    });
  };

  const handlePaddingChange = (
    side: keyof FooterSettings["padding"],
    value: number
  ) => {
    const newPadding = { ...settings.padding, [side]: value };
    const newSettings = { ...settings, padding: newPadding };
    setSettings(newSettings);

    onUpdate({
      ...template,
      footer: {
        ...template.footer,
        ...newSettings,
      },
    });
  };

  return (
    <div className="settings-panel-container fixed right-0 top-0 z-50 w-80 h-full bg-background border-l border-border flex flex-col">
      <Card className="h-full border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Footer Settings
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <ScrollArea className="flex-1">
            <div className="space-y-6">
              {/* Background Color */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Color</Label>
                <ColorPicker
                  value={settings.backgroundColor}
                  onChange={(color) =>
                    handleSettingChange("backgroundColor", color)
                  }
                />
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Text Color</Label>
                <ColorPicker
                  value={settings.textColor}
                  onChange={(color) => handleSettingChange("textColor", color)}
                />
              </div>

              {/* Font Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Font Family</Label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) =>
                      handleSettingChange("fontFamily", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {fontOptions.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Font Size: {settings.fontSize}px
                  </Label>
                  <Slider
                    value={[settings.fontSize]}
                    onValueChange={(value) =>
                      handleSettingChange("fontSize", value[0])
                    }
                    min={8}
                    max={24}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Height */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Height: {settings.height}px
                </Label>
                <Slider
                  value={[settings.height]}
                  onValueChange={(value) =>
                    handleSettingChange("height", value[0])
                  }
                  min={20}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Border Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Border Color</Label>
                  <ColorPicker
                    value={settings.borderColor}
                    onChange={(color) =>
                      handleSettingChange("borderColor", color)
                    }
                  />
                </div>

                {/* <div className='space-y-2'>
                  <Label className='text-sm font-medium'>
                    Border Width: {settings.borderWidth}px
                  </Label>
                  <Slider
                    value={[settings.borderWidth]}
                    onValueChange={(value) =>
                      handleSettingChange('borderWidth', value[0])
                    }
                    min={0}
                    max={5}
                    step={1}
                    className='w-full'
                  />
                </div> */}
              </div>

              {/* Padding Settings */}
              {/* <div className='space-y-4'>
                <Label className='text-sm font-medium'>Padding</Label>

                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <Label className='text-xs text-gray-600'>
                      Top: {settings.padding.top}px
                    </Label>
                    <Slider
                      value={[settings.padding.top]}
                      onValueChange={(value) =>
                        handlePaddingChange('top', value[0])
                      }
                      min={0}
                      max={50}
                      step={1}
                      className='w-full'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-xs text-gray-600'>
                      Right: {settings.padding.right}px
                    </Label>
                    <Slider
                      value={[settings.padding.right]}
                      onValueChange={(value) =>
                        handlePaddingChange('right', value[0])
                      }
                      min={0}
                      max={50}
                      step={1}
                      className='w-full'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-xs text-gray-600'>
                      Bottom: {settings.padding.bottom}px
                    </Label>
                    <Slider
                      value={[settings.padding.bottom]}
                      onValueChange={(value) =>
                        handlePaddingChange('bottom', value[0])
                      }
                      min={0}
                      max={50}
                      step={1}
                      className='w-full'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-xs text-gray-600'>
                      Left: {settings.padding.left}px
                    </Label>
                    <Slider
                      value={[settings.padding.left]}
                      onValueChange={(value) =>
                        handlePaddingChange('left', value[0])
                      }
                      min={0}
                      max={50}
                      step={1}
                      className='w-full'
                    />
                  </div>
                </div>
              </div> */}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
