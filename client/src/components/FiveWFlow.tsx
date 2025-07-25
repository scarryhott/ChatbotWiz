import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Circle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chatbot } from "@shared/schema";

interface FiveWFlowProps {
  chatbot: Chatbot;
}

const TOPICS = [
  { key: "why", label: "WHY", description: "Purpose & Goals", color: "bg-red-500" },
  { key: "what", label: "WHAT", description: "Products & Services", color: "bg-orange-500" },
  { key: "when", label: "WHEN", description: "Timeline & Urgency", color: "bg-yellow-500" },
  { key: "where", label: "WHERE", description: "Location & Scope", color: "bg-green-500" },
  { key: "who", label: "WHO", description: "Decision Makers", color: "bg-blue-500" },
] as const;

export default function FiveWFlow({ chatbot }: FiveWFlowProps) {
  const [completionRate] = useState(73); // TODO: Calculate from actual data

  const getTopicIcon = (topic: typeof TOPICS[0], isCompleted: boolean, isActive: boolean) => {
    if (isCompleted) {
      return <Check className="w-6 h-6" />;
    }
    if (isActive) {
      return <Clock className="w-6 h-6 animate-pulse" />;
    }
    return <Circle className="w-6 h-6" />;
  };

  const handleGenerateEthos = async () => {
    // TODO: Implement AI-powered ethos generation
    console.log("Generating ethos from website...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">5W Topic Flow Configuration</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Conversation completion:</span>
          <span className="font-semibold text-green-600">{completionRate}%</span>
        </div>
      </div>

      {/* 5W Progress Display */}
      <div className="grid grid-cols-5 gap-4">
        {TOPICS.map((topic, index) => {
          const isCompleted = index < 2; // Mock: first 2 are completed
          const isActive = index === 2; // Mock: third is active
          const topicConfig = chatbot.config.topics[topic.key as keyof typeof chatbot.config.topics];
          
          return (
            <Card key={topic.key} className={cn(
              "text-white text-center p-4",
              isCompleted ? `${topic.color} tab-completed` : isActive ? topic.color : "bg-gray-300 text-gray-600"
            )}>
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center justify-center">
                  {getTopicIcon(topic, isCompleted, isActive)}
                </div>
                <h4 className="font-semibold">{topic.label}</h4>
                <p className="text-xs opacity-90">{topic.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Topic Configuration */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Topic Questions</h4>
          <div className="space-y-4">
            {TOPICS.slice(0, 2).map((topic) => {
              const topicConfig = chatbot.config.topics[topic.key as keyof typeof chatbot.config.topics];
              return (
                <div key={topic.key} className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {topic.label} Question
                  </Label>
                  <Input
                    defaultValue={topicConfig.question}
                    placeholder={`Enter ${topic.label.toLowerCase()} question...`}
                    className="w-full"
                    onChange={(e) => {
                      // TODO: Implement question update
                      console.log(`Updating ${topic.key} question:`, e.target.value);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Ethos & Context</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Company Ethos Filter
              </Label>
              <Textarea
                defaultValue={chatbot.config.company.ethos}
                placeholder="Our company believes in sustainable solutions that empower small businesses..."
                className="min-h-24 resize-none"
                onChange={(e) => {
                  // TODO: Implement ethos update
                  console.log("Updating ethos:", e.target.value);
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">AI-suggested based on website</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleGenerateEthos}
                className="text-primary-600 hover:text-primary-700 font-medium p-0 h-auto"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Generate
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
