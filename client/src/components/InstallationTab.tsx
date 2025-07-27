import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, ExternalLink, Check, Code2, Globe, Smartphone } from 'lucide-react';
import { generateEmbedCode, generateInstallationInstructions } from '@/utils/chatbotEmbed';
import type { Chatbot } from '@shared/schema';

interface InstallationTabProps {
  chatbot: Chatbot;
}

export default function InstallationTab({ chatbot }: InstallationTabProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [embedType, setEmbedType] = useState<'standard' | 'advanced' | 'custom'>('standard');

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const embedConfig = {
    chatbotId: chatbot.id,
    businessName: chatbot.name,
    primaryColor: chatbot.config.ui?.theme?.primaryColor || '#3b82f6',
    position: (chatbot.config.ui?.position || 'bottom-right') as 'bottom-right' | 'bottom-left' | 'center',
    animation: (chatbot.config.ui?.entryAnimation || 'slide-up') as 'slide-up' | 'fade-in' | 'bounce',
    delay: 3,
    apiEndpoint: `${window.location.origin}/api/chat/${chatbot.id}`
  };

  const embedCode = generateEmbedCode(embedConfig);
  const installationInstructions = generateInstallationInstructions(embedCode);

  const codeExamples = {
    html: `<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <!-- Your website content -->
    <h1>Welcome to my website!</h1>
    
    <!-- WWWWW.AI Chatbot - Place before closing </body> tag -->
    ${embedCode}
</body>
</html>`,
    wordpress: `<?php
// Add this to your theme's functions.php file
function add_wwwwwai_chatbot() {
    ?>
    ${embedCode}
    <?php
}
add_action('wp_footer', 'add_wwwwwai_chatbot');`,
    react: `// Add to your React component or main App.js
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // WWWWW.AI Chatbot Integration
    ${embedCode.replace('<script>', '').replace('</script>', '')}
  }, []);

  return (
    <div className="App">
      {/* Your app content */}
    </div>
  );
}`,
    shopify: `<!-- In your Shopify theme's theme.liquid file, before </body> -->
${embedCode}`
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Installation Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 size={20} />
              Installation Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                variant={embedType === 'standard' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setEmbedType('standard')}
              >
                <Globe size={16} className="mr-2" />
                Standard Embed
              </Button>
              <Button
                variant={embedType === 'advanced' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setEmbedType('advanced')}
              >
                <Code2 size={16} className="mr-2" />
                Advanced Integration
              </Button>
              <Button
                variant={embedType === 'custom' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setEmbedType('custom')}
              >
                <Smartphone size={16} className="mr-2" />
                Custom Implementation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chatbot Status */}
        <Card>
          <CardHeader>
            <CardTitle>Deployment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Chatbot Status</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Ready to Deploy
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Configuration</span>
              <Badge variant="secondary">Complete</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>AI Model</span>
              <Badge variant="outline">{chatbot.config.ai.initialModel}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>5W Framework</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Enabled
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleCopy(embedCode, 'embed')}
            >
              {copiedField === 'embed' ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
              Copy Embed Code
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
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
              Download Code
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open(`/preview/${chatbot.id}`, '_blank')}
            >
              <ExternalLink size={16} className="mr-2" />
              Test Chatbot
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="wordpress">WordPress</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
              <TabsTrigger value="shopify">Shopify</TabsTrigger>
            </TabsList>

            <TabsContent value="instructions" className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
                  {installationInstructions}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="html" className="space-y-4">
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => handleCopy(codeExamples.html, 'html')}
                >
                  {copiedField === 'html' ? <Check size={16} /> : <Copy size={16} />}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  <code>{codeExamples.html}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="wordpress" className="space-y-4">
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => handleCopy(codeExamples.wordpress, 'wordpress')}
                >
                  {copiedField === 'wordpress' ? <Check size={16} /> : <Copy size={16} />}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  <code>{codeExamples.wordpress}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="react" className="space-y-4">
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => handleCopy(codeExamples.react, 'react')}
                >
                  {copiedField === 'react' ? <Check size={16} /> : <Copy size={16} />}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  <code>{codeExamples.react}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="shopify" className="space-y-4">
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => handleCopy(codeExamples.shopify, 'shopify')}
                >
                  {copiedField === 'shopify' ? <Check size={16} /> : <Copy size={16} />}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  <code>{codeExamples.shopify}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Business Name</span>
              <p className="font-semibold">{chatbot.name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Primary Color</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: chatbot.config.ui.theme.primaryColor }}
                />
                <span className="font-mono text-xs">{chatbot.config.ui.theme.primaryColor}</span>
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Position</span>
              <p className="font-semibold capitalize">{chatbot.config.ui.position.replace('-', ' ')}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Animation</span>
              <p className="font-semibold capitalize">{chatbot.config.ui.entryAnimation.replace('-', ' ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}