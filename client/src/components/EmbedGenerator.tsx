import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Check, Settings, Code, Globe } from 'lucide-react';
import { generateEmbedCode } from '@/utils/chatbotEmbed';
import type { Chatbot } from '@shared/schema';

interface EmbedGeneratorProps {
  chatbot: Chatbot;
}

export default function EmbedGenerator({ chatbot }: EmbedGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [customConfig, setCustomConfig] = useState({
    position: chatbot.config.ui.position,
    animation: chatbot.config.ui.entryAnimation || 'slide-up',
    delay: 3,
    primaryColor: chatbot.config.ui.theme.primaryColor
  });

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const embedConfig = {
    chatbotId: chatbot.id,
    businessName: chatbot.name,
    primaryColor: customConfig.primaryColor,
    position: customConfig.position as 'bottom-right' | 'bottom-left' | 'center',
    animation: customConfig.animation as 'slide-up' | 'fade-in' | 'bounce',
    delay: customConfig.delay,
    apiEndpoint: `${window.location.origin}/api/chat/${chatbot.id}`
  };

  const embedCode = generateEmbedCode(embedConfig);

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={20} />
            Embed Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Select 
              value={customConfig.position} 
              onValueChange={(value) => setCustomConfig(prev => ({ ...prev, position: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="animation">Animation</Label>
            <Select 
              value={customConfig.animation || 'slide-up'} 
              onValueChange={(value) => setCustomConfig(prev => ({ ...prev, animation: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slide-up">Slide Up</SelectItem>
                <SelectItem value="fade-in">Fade In</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delay">Delay (seconds)</Label>
            <Input
              id="delay"
              type="number"
              min="0"
              max="30"
              value={customConfig.delay}
              onChange={(e) => setCustomConfig(prev => ({ ...prev, delay: parseInt(e.target.value) || 3 }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={customConfig.primaryColor}
                onChange={(e) => setCustomConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-16"
              />
              <Input
                value={customConfig.primaryColor}
                onChange={(e) => setCustomConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embed Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code size={20} />
            Embed Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Ready to Deploy</Badge>
              <Badge variant="outline">{embedCode.length} characters</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(embedCode)}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const blob = new Blob([embedCode], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `wwwwwai-chatbot-${chatbot.id}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download size={16} className="mr-2" />
                Download
              </Button>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm max-h-96">
              <code>{embedCode}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe size={20} />
            Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
            <div className="flex items-center justify-center text-gray-500 min-h-32">
              <div className="text-center">
                <Globe size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Chatbot Preview</p>
                <p className="text-sm">Position: {customConfig.position.replace('-', ' ')}</p>
                <p className="text-sm">Animation: {customConfig.animation.replace('-', ' ')}</p>
                <p className="text-sm">Delay: {customConfig.delay}s</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}