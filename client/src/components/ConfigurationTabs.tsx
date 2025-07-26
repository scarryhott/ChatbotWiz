import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FiveWSetup from "./FiveWSetup";
import EnhancedUICustomization from "./EnhancedUICustomization";
import type { Chatbot } from "@shared/schema";

interface ConfigurationTabsProps {
  chatbot?: Chatbot;
}

export default function ConfigurationTabs({ chatbot }: ConfigurationTabsProps) {
  if (!chatbot) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <Tabs defaultValue="5w-flow" className="w-full">
        <div className="border-b border-gray-200">
          <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="5w-flow" 
              className="border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 py-4 px-6 rounded-none"
            >
              5W Flow Setup
            </TabsTrigger>
            <TabsTrigger 
              value="ui-customization"
              className="border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 py-4 px-6 rounded-none"
            >
              UI Customization
            </TabsTrigger>
            <TabsTrigger 
              value="ai-settings"
              className="border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 py-4 px-6 rounded-none"
            >
              AI Settings
            </TabsTrigger>
            <TabsTrigger 
              value="installation"
              className="border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 py-4 px-6 rounded-none"
            >
              Installation
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="5w-flow" className="p-6">
          <FiveWSetup chatbot={chatbot} />
        </TabsContent>

        <TabsContent value="ui-customization" className="p-6">
          <EnhancedUICustomization chatbot={chatbot} />
        </TabsContent>

        <TabsContent value="ai-settings" className="p-6">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">AI Configuration</h3>
            <p className="text-gray-600">Configure AI model settings and behavior</p>
            {/* TODO: Implement AI settings */}
          </div>
        </TabsContent>

        <TabsContent value="installation" className="p-6">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">DNS Proxy Installation</h3>
            <p className="text-gray-600">Zero-code installation via DNS configuration</p>
            {/* TODO: Implement installation instructions */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
