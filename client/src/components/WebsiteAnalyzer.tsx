import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Sparkles, Check, Copy, Plus, Wand2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Removed unused apiRequest import
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
  
  // Manual creation state
  const [manualName, setManualName] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualEthos, setManualEthos] = useState("");
  const [manualKnowledgeBase, setManualKnowledgeBase] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch('/api/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      return await response.json();
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
      const response = await fetch('/api/chatbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    },
    onSuccess: (chatbot) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots"] });
      onChatbotCreated?.(chatbot);
      toast({
        title: "Chatbot created successfully!",
        description: "Your AI chatbot is ready to deploy."
      });
      
      // Reset forms
      setWebsiteUrl("");
      setAnalysis(null);
      setConfig(null);
      setChatbotName("");
      setManualName("");
      setManualCompany("");
      setManualEthos("");
      setManualKnowledgeBase("");
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

  const handleCreateManualChatbot = () => {
    if (!manualName.trim() || !manualCompany.trim() || !manualEthos.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields to create your chatbot.",
        variant: "destructive"
      });
      return;
    }

    // Create default config for manual chatbot
    const manualConfig = {
      company: {
        name: manualCompany,
        ethos: manualEthos,
        website: "",
        knowledgeBase: manualKnowledgeBase || "General business information and customer support."
      },
      topics: {
        why: {
          question: "What brings you here today? What are you hoping to achieve?",
          completed: false
        },
        what: {
          question: "What specific products or services are you interested in?",
          completed: false
        },
        when: {
          question: "What's your timeline for making a decision?",
          completed: false
        },
        where: {
          question: "Where are you located or where would you need service?",
          completed: false
        },
        who: {
          question: "Who would be involved in making this decision?",
          completed: false
        }
      },
      ui: {
        size: "medium",
        position: "bottom-right",
        transparentBackground: false,
        scrollMode: false,
        entryAnimation: "slide-up",
        typingIndicator: "dots",
        autoStartTrigger: "page-load",
        theme: {
          primaryColor: "#3b82f6",
          secondaryColor: "#1e40af",
          backgroundColor: "#ffffff",
          textColor: "#111827",
          borderRadius: 8
        }
      },
      ai: {
        initialModel: "gemini-2.5-flash",
        followUpModel: "gemini-2.5-flash",
        ethosFilter: manualEthos
      },
      popupTrigger: {
        enabled: true,
        message: `Hello! I'm here to help you learn more about ${manualCompany}. What brings you here today?`,
        delay: 5
      }
    };

    const chatbotData = {
      userId: "demo-user-1",
      name: manualName,
      domain: "",
      config: manualConfig,
      isActive: true
    };

    createChatbotMutation.mutate(chatbotData);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai" className="flex items-center space-x-2">
            <Wand2 className="w-4 h-4" />
            <span>AI Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Manual Setup</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create Chatbot Manually</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-name">Chatbot Name *</Label>
                  <Input
                    id="manual-name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Enter chatbot name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-company">Company Name *</Label>
                  <Input
                    id="manual-company"
                    value={manualCompany}
                    onChange={(e) => setManualCompany(e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-ethos">Company Ethos/Values *</Label>
                <Textarea
                  id="manual-ethos"
                  value={manualEthos}
                  onChange={(e) => setManualEthos(e.target.value)}
                  placeholder="Describe your company's values, mission, and what makes you unique..."
                  className="min-h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-knowledge">Knowledge Base (Optional)</Label>
                <Textarea
                  id="manual-knowledge"
                  value={manualKnowledgeBase}
                  onChange={(e) => setManualKnowledgeBase(e.target.value)}
                  placeholder="Provide information about your products, services, pricing, locations, etc..."
                  className="min-h-32 resize-none"
                />
              </div>

              <Button
                onClick={handleCreateManualChatbot}
                disabled={!manualName.trim() || !manualCompany.trim() || !manualEthos.trim() || createChatbotMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {createChatbotMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Manual Chatbot
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}