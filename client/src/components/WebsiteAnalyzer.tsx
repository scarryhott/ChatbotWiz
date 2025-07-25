import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Sparkles, Check, Copy } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Chatbot } from "@shared/schema";

interface WebsiteAnalyzerProps {
  onChatbotCreated?: (chatbot: Chatbot) => void;
}

export default function WebsiteAnalyzer({ onChatbotCreated }: WebsiteAnalyzerProps) {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [chatbotName, setChatbotName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (url: string) => {
      return apiRequest('/api/analyze-website', {
        method: 'POST',
        body: JSON.stringify({ url })
      });
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setConfig(data.config);
      setChatbotName(`${data.analysis.company} AI Assistant`);
      toast({
        title: "Website analyzed successfully!",
        description: "AI has generated your chatbot configuration."
      });
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "Unable to analyze website. Please check the URL and try again.",
        variant: "destructive"
      });
    }
  });

  const createChatbotMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/chatbots', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (chatbot) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots"] });
      onChatbotCreated?.(chatbot);
      toast({
        title: "Chatbot created successfully!",
        description: "Your AI chatbot is ready to deploy."
      });
      
      // Reset form
      setWebsiteUrl("");
      setAnalysis(null);
      setConfig(null);
      setChatbotName("");
    }
  });

  const handleAnalyze = () => {
    if (!websiteUrl.trim()) return;
    
    // Add protocol if missing
    let url = websiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    analyzeMutation.mutate(url);
  };

  const handleCreateChatbot = () => {
    if (!config || !chatbotName) return;

    const chatbotData = {
      userId: "demo-user-1", // TODO: Use actual user ID
      name: chatbotName,
      domain: websiteUrl,
      config: {
        ...config,
        company: {
          ...config.company,
          website: websiteUrl
        }
      },
      isActive: true
    };

    createChatbotMutation.mutate(chatbotData);
  };

  const generateEmbedCode = () => {
    if (!config) return "";
    
    return `<!-- wwwwwai Chatbot -->
<script>
  window.wwwwwaiConfig = {
    chatbotId: "your-chatbot-id",
    domain: "${websiteUrl}"
  };
</script>
<script src="https://cdn.wwwwwai.com/embed.js" async></script>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    toast({
      title: "Embed code copied!",
      description: "Paste this code before the closing </body> tag on your website."
    });
  };

  return (
    <div className="space-y-6">
      {/* Website Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Create Chatbot from Website</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website-url">Website URL</Label>
            <div className="flex space-x-2">
              <Input
                id="website-url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="Enter your website URL (e.g., example.com)"
                className="flex-1"
                disabled={analyzeMutation.isPending}
              />
              <Button 
                onClick={handleAnalyze}
                disabled={!websiteUrl.trim() || analyzeMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Website Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Company</Label>
                <p className="text-sm text-gray-900">{analysis.company}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Industry</Label>
                <p className="text-sm text-gray-900">{analysis.industry}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Target Audience</Label>
                <p className="text-sm text-gray-900">{analysis.targetAudience}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Services</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.services.map((service: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Company Ethos</Label>
                <p className="text-sm text-gray-900">{analysis.ethos}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated Chatbot Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="chatbot-name">Chatbot Name</Label>
                <Input
                  id="chatbot-name"
                  value={chatbotName}
                  onChange={(e) => setChatbotName(e.target.value)}
                  placeholder="Enter chatbot name"
                />
              </div>
              
              {config && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">5W Questions Preview</Label>
                    <div className="space-y-2 mt-2">
                      {Object.entries(config.topics).map(([key, topic]: [string, any]) => (
                        <div key={key} className="p-2 bg-gray-50 rounded text-xs">
                          <span className="font-medium text-gray-700 uppercase">{key}:</span>{" "}
                          <span className="text-gray-600">{topic.question}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">AI Ethos Filter</Label>
                    <Textarea
                      value={config.ai?.ethosFilter || ""}
                      onChange={(e) => setConfig({
                        ...config,
                        ai: { ...config.ai, ethosFilter: e.target.value }
                      })}
                      className="text-xs min-h-20 resize-none"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleCreateChatbot}
                  disabled={!chatbotName || createChatbotMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {createChatbotMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Chatbot
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Embed Code */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Embed Code Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                <pre>{generateEmbedCode()}</pre>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Copy this code and paste it before the closing &lt;/body&gt; tag on your website
                </p>
                <Button variant="outline" onClick={copyEmbedCode}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}