import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ConfigurationTabs from "@/components/ConfigurationTabs";
import AdvancedChatbot from "@/components/AdvancedChatbot";
import { EnhancedChatbot } from "@/components/EnhancedChatbot";
import { ToggleableChatbot } from "@/components/ToggleableChatbot";
import LeadManagement from "@/components/LeadManagement";
import EnhancedLeadCollection from "@/components/EnhancedLeadCollection";
import WebsiteAnalyzer from "@/components/WebsiteAnalyzer";
import InstallationTab from "@/components/InstallationTab";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Code, Globe, Settings, BarChart3, Download } from "lucide-react";
import { adaptChatbotConfig } from "@/utils/configAdapter";
import type { Chatbot } from "@shared/schema";

export default function Dashboard() {
  const [selectedChatbotId, setSelectedChatbotId] = useState<string>("demo-chatbot-1");
  const [activeTab, setActiveTab] = useState("create");

  const { data: chatbots, isLoading: loadingChatbots } = useQuery<Chatbot[]>({
    queryKey: ["/api/chatbots"],
  });

  const { data: selectedChatbot, isLoading: loadingChatbot } = useQuery<Chatbot>({
    queryKey: ["/api/chatbots", selectedChatbotId],
    enabled: !!selectedChatbotId,
  });

  const handleSaveChanges = () => {
    // TODO: Implement save functionality
    console.log("Saving changes...");
  };

  const handleGetEmbedCode = () => {
    // TODO: Implement embed code generation
    console.log("Getting embed code...");
  };

  const handleChatbotCreated = (chatbot: Chatbot) => {
    setSelectedChatbotId(chatbot.id);
    setActiveTab("configure");
  };

  if (loadingChatbots || loadingChatbot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main Dashboard Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">wwwwwai Dashboard</h2>
                <p className="text-gray-600">Create and manage your AI-powered 5W chatbots</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button onClick={handleSaveChanges} className="bg-primary-600 hover:bg-primary-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleGetEmbedCode}>
                  <Code className="w-4 h-4 mr-2" />
                  Get Embed Code
                </Button>
              </div>
            </div>
          </header>

          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="create" className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Create</span>
                </TabsTrigger>
                <TabsTrigger value="configure" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Configure</span>
                </TabsTrigger>
                <TabsTrigger value="leads" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Leads</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center space-x-2">
                  <Code className="w-4 h-4" />
                  <span>Preview</span>
                </TabsTrigger>
                <TabsTrigger value="install" className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Install</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-6">
                <WebsiteAnalyzer onChatbotCreated={handleChatbotCreated} />
              </TabsContent>

              <TabsContent value="configure" className="space-y-6">
                {selectedChatbot ? (
                  <ConfigurationTabs chatbot={selectedChatbot} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Select or create a chatbot to configure</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="leads" className="space-y-6">
                <EnhancedLeadCollection chatbotId={selectedChatbotId} />
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Live Chatbot Preview</h3>
                  <p className="text-gray-600 mb-4">
                    This is how your chatbot will appear on your website. You can interact with it to test the 5W flow.
                  </p>
                  {selectedChatbot && (
                    <div className="relative bg-white rounded-lg border min-h-96 overflow-hidden">
                      {/* Embedded website iframe */}
                      <iframe
                        src={selectedChatbot.config?.company?.website || "https://www.replit.com"}
                        className="w-full h-96 border-0"
                        title="Live Website Preview"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        onError={(e) => {
                          console.log("Website failed to load, using fallback");
                          // Fallback to Replit if the website fails to load
                          const iframe = e.target as HTMLIFrameElement;
                          if (iframe && iframe.src !== "https://www.replit.com") {
                            iframe.src = "https://www.replit.com";
                          }
                        }}
                      />
                      
                      {/* Overlay chatbot widget on the website */}
                      <div className="absolute bottom-4 right-4 z-10">
                        <ToggleableChatbot 
                          config={adaptChatbotConfig(selectedChatbot)}
                          onLeadUpdate={(leadData) => {
                            console.log("Preview lead captured:", leadData);
                          }}
                          onConversationUpdate={(messages) => {
                            console.log("Preview conversation updated:", messages);
                          }}
                          position="bottom-right"
                          autoOpen={false}
                          previewMode="desktop"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="install" className="space-y-6">
                {selectedChatbot ? (
                  <InstallationTab chatbot={selectedChatbot} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Select or create a chatbot to view installation instructions</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Toggleable Chatbot Widget */}
        {selectedChatbot && (
          <ToggleableChatbot 
            config={adaptChatbotConfig(selectedChatbot)}
            onLeadUpdate={(leadData) => {
              console.log("New lead captured:", leadData);
              setActiveTab("leads");
            }}
            onConversationUpdate={(messages) => {
              console.log("Conversation updated:", messages);
            }}
            position="bottom-right"
            autoOpen={false}
          />
        )}
      </div>
    </div>
  );
}
