import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Layout, Settings, Eye, Save, RotateCcw, Monitor, Smartphone, Maximize2, Minimize2, X } from 'lucide-react';
import { ToggleableChatbot } from './ToggleableChatbot';
import { adaptChatbotConfig } from '@/utils/configAdapter';
import type { Chatbot } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// Removed unused apiRequest import
import { useToast } from '@/hooks/use-toast';

interface EnhancedUICustomizationProps {
  chatbot: Chatbot;
}

const defaultUIConfig = {
  size: "medium" as const,
  position: "bottom-right" as const,
  transparentBackground: false,
  scrollMode: false,
  entryAnimation: "slide-up" as const,
  typingIndicator: "dots" as const,
  autoStartTrigger: "5-second-delay" as const,
  theme: {
    primaryColor: "#3b82f6",
    secondaryColor: "#f3f4f6",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    borderRadius: 12,
  },
};

export default function EnhancedUICustomization({ chatbot }: EnhancedUICustomizationProps) {
  const [uiConfig, setUIConfig] = useState(() => ({
    ...defaultUIConfig,
    ...chatbot.config.ui,
    theme: {
      ...defaultUIConfig.theme,
      ...chatbot.config.ui?.theme,
    }
  }));

  // Update local state when chatbot prop changes (after save)
  useEffect(() => {
    setUIConfig({
      ...defaultUIConfig,
      ...chatbot.config.ui,
      theme: {
        ...defaultUIConfig.theme,
        ...chatbot.config.ui?.theme,
      }
    });
  }, [chatbot.config.ui]);

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateChatbotMutation = useMutation({
    mutationFn: (data: Partial<Chatbot>) => 
      fetch(`/api/chatbots/${chatbot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      // Invalidate both the list and individual chatbot queries
      queryClient.invalidateQueries({ queryKey: ['/api/chatbots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chatbots', chatbot.id] });
      toast({
        title: 'Success',
        description: 'UI customization updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update UI customization',
        variant: 'destructive',
      });
    },
  });

  const updateConfig = (key: string, value: any) => {
    if (key.startsWith('theme.')) {
      const themeKey = key.split('.')[1];
      setUIConfig(prev => ({
        ...prev,
        theme: {
          ...prev.theme,
          [themeKey]: value
        }
      }));
    } else {
      setUIConfig(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSave = () => {
    const updatedConfig = {
      ...chatbot.config,
      ui: uiConfig
    };

    updateChatbotMutation.mutate({
      config: updatedConfig
    });
  };

  const handleReset = () => {
    setUIConfig(defaultUIConfig);
  };

  const previewConfig = adaptChatbotConfig({
    ...chatbot,
    config: {
      ...chatbot.config,
      ui: uiConfig
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">UI Customization</h3>
          <p className="text-gray-600">
            Customize the appearance and behavior of your chatbot widget
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={previewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('desktop')}
          >
            <Monitor size={16} />
          </Button>
          <Button
            variant={previewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('mobile')}
          >
            <Smartphone size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
              <TabsTrigger value="position">Position</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-4">
              {/* Theme Colors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette size={16} />
                    Colors & Theme
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={uiConfig.theme.primaryColor}
                          onChange={(e) => updateConfig('theme.primaryColor', e.target.value)}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          type="text"
                          value={uiConfig.theme.primaryColor}
                          onChange={(e) => updateConfig('theme.primaryColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={uiConfig.theme.backgroundColor}
                          onChange={(e) => updateConfig('theme.backgroundColor', e.target.value)}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          type="text"
                          value={uiConfig.theme.backgroundColor}
                          onChange={(e) => updateConfig('theme.backgroundColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Text Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={uiConfig.theme.textColor}
                          onChange={(e) => updateConfig('theme.textColor', e.target.value)}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          type="text"
                          value={uiConfig.theme.textColor}
                          onChange={(e) => updateConfig('theme.textColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Border Radius</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[uiConfig.theme.borderRadius]}
                          onValueChange={([value]) => updateConfig('theme.borderRadius', value)}
                          max={30}
                          step={1}
                          className="w-full"
                        />
                        <div className="text-sm text-gray-500 text-center">
                          {uiConfig.theme.borderRadius}px
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Size & Layout */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layout size={16} />
                    Size & Layout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Widget Size</Label>
                    <Select
                      value={uiConfig.size}
                      onValueChange={(value) => updateConfig('size', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (30% of preview)</SelectItem>
                        <SelectItem value="medium">Medium (40% of preview)</SelectItem>
                        <SelectItem value="large">Large (50% of preview)</SelectItem>
                        <SelectItem value="fullscreen">Full Screen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Transparent Background</Label>
                    <Switch
                      checked={uiConfig.transparentBackground}
                      onCheckedChange={(checked) => updateConfig('transparentBackground', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Scroll Mode</Label>
                    <Switch
                      checked={uiConfig.scrollMode}
                      onCheckedChange={(checked) => updateConfig('scrollMode', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4">
              {/* Animation Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Animation & Effects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Entry Animation</Label>
                    <Select
                      value={uiConfig.entryAnimation}
                      onValueChange={(value) => updateConfig('entryAnimation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slide-up">Slide Up</SelectItem>
                        <SelectItem value="fade-in">Fade In</SelectItem>
                        <SelectItem value="bounce">Bounce</SelectItem>
                        <SelectItem value="none">No Animation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Typing Indicator</Label>
                    <Select
                      value={uiConfig.typingIndicator}
                      onValueChange={(value) => updateConfig('typingIndicator', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dots">Animated Dots</SelectItem>
                        <SelectItem value="pulse">Pulse</SelectItem>
                        <SelectItem value="wave">Wave</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Auto Start Trigger</Label>
                    <Select
                      value={uiConfig.autoStartTrigger}
                      onValueChange={(value) => updateConfig('autoStartTrigger', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="page-load">Page Load</SelectItem>
                        <SelectItem value="5-second-delay">5 Second Delay</SelectItem>
                        <SelectItem value="scroll-50">50% Scroll</SelectItem>
                        <SelectItem value="exit-intent">Exit Intent</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="position" className="space-y-4">
              {/* Position Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Widget Position</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select
                      value={uiConfig.position}
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Reset to Defaults
            </Button>

            <Button
              onClick={handleSave}
              disabled={updateChatbotMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {updateChatbotMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={16} />
              <h4 className="font-medium">Live Preview</h4>
              <span className="text-sm text-gray-500">({previewMode})</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreenPreview(true)}
              className="flex items-center gap-2"
            >
              <Maximize2 size={16} />
              Fullscreen
            </Button>
          </div>
          
          <Card className="relative overflow-hidden bg-gray-50">
            <CardContent className="p-0">
              <div 
                className={`relative ${
                  previewMode === 'mobile' 
                    ? 'w-80 h-96 mx-auto bg-gray-100 rounded-lg p-4' 
                    : 'w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50'
                } overflow-hidden`}
                style={{
                  backgroundImage: previewMode === 'desktop' 
                    ? 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="3"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                    : undefined
                }}
              >
                <ToggleableChatbot
                  config={previewConfig}
                  position={uiConfig.position as any}
                  autoOpen={false}
                  className="relative"
                  previewMode={previewMode}
                />
                
                {previewMode === 'desktop' && (
                  <div className="absolute top-4 left-4 text-sm text-gray-600 bg-white/80 backdrop-blur-sm rounded px-2 py-1">
                    Desktop Preview
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Fullscreen Preview Modal */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50">
            {/* Close Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreenPreview(false)}
              className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm flex items-center gap-2"
            >
              <X size={16} />
              Exit Fullscreen
            </Button>
            
            {/* Fullscreen Preview */}
            <div className="relative w-full h-full overflow-hidden">
              <ToggleableChatbot
                config={previewConfig}
                position={uiConfig.position as any}
                autoOpen={true}
                className="relative"
                previewMode="fullscreen"
              />
              
              <div className="absolute top-4 left-4 text-sm text-gray-600 bg-white/80 backdrop-blur-sm rounded px-3 py-2">
                Fullscreen Preview - {previewConfig.businessName}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}