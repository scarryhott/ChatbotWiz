import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Chatbot } from "@shared/schema";

interface UICustomizationProps {
  chatbot: Chatbot;
}

export default function UICustomization({ chatbot }: UICustomizationProps) {
  const [config, setConfig] = useState(chatbot.config.ui);

  const updateConfig = (key: keyof typeof config, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    // TODO: Implement actual config update
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">UI Customization</h3>
        <p className="text-gray-600">Customize the appearance and behavior of your chatbot</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chatbot-size">Chatbot Size</Label>
              <Select
                value={config.size}
                onValueChange={(value) => updateConfig('size', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (90% width, 70% height)</SelectItem>
                  <SelectItem value="medium">Medium (90% width, 80% height)</SelectItem>
                  <SelectItem value="large">Large (95% width, 85% height)</SelectItem>
                  <SelectItem value="fullscreen">Full Screen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="transparent-bg">Transparent Background</Label>
              <Switch
                id="transparent-bg"
                checked={config.transparentBackground}
                onCheckedChange={(checked) => updateConfig('transparentBackground', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="scroll-mode">Scroll Mode (vs Bubbles)</Label>
              <Switch
                id="scroll-mode"
                checked={config.scrollMode}
                onCheckedChange={(checked) => updateConfig('scrollMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Animation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Animation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entry-animation">Entry Animation</Label>
              <Select
                value={config.entryAnimation}
                onValueChange={(value) => updateConfig('entryAnimation', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slide-up">Slide Up</SelectItem>
                  <SelectItem value="fade-in">Fade In</SelectItem>
                  <SelectItem value="bounce">Bounce</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="typing-indicator">Typing Indicator</Label>
              <Select
                value={config.typingIndicator}
                onValueChange={(value) => updateConfig('typingIndicator', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dots">Dots</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                  <SelectItem value="wave">Wave</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Position & Triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Position & Triggers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={config.position}
                onValueChange={(value) => updateConfig('position', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-start">Auto-start Trigger</Label>
              <Select
                value={config.autoStartTrigger}
                onValueChange={(value) => updateConfig('autoStartTrigger', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page-load">Page Load</SelectItem>
                  <SelectItem value="5-second-delay">5 Second Delay</SelectItem>
                  <SelectItem value="scroll-50">Scroll 50%</SelectItem>
                  <SelectItem value="exit-intent">Exit Intent</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
