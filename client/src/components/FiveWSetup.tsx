import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MessageCircle, HelpCircle, MapPin, Calendar, Users, Save, RotateCcw } from 'lucide-react';
import type { Chatbot } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FiveWSetupProps {
  chatbot: Chatbot;
}

const topicIcons = {
  WHY: HelpCircle,
  WHAT: MessageCircle,
  WHERE: MapPin,
  WHEN: Calendar,
  WHO: Users,
};

const defaultQuestions = {
  WHY: 'What brings you here today? How can we help you?',
  WHAT: 'What specific services or solutions are you looking for?',
  WHERE: 'What area do you need service in? Where are you located?',
  WHEN: 'When do you need this service? What\'s your timeline?',
  WHO: 'How would you like us to contact you? What\'s the best way to reach you?'
};

export default function FiveWSetup({ chatbot }: FiveWSetupProps) {
  const [questions, setQuestions] = useState(() => ({
    WHY: chatbot.config.conversation?.customQuestions?.WHY || defaultQuestions.WHY,
    WHAT: chatbot.config.conversation?.customQuestions?.WHAT || defaultQuestions.WHAT,
    WHERE: chatbot.config.conversation?.customQuestions?.WHERE || defaultQuestions.WHERE,
    WHEN: chatbot.config.conversation?.customQuestions?.WHEN || defaultQuestions.WHEN,
    WHO: chatbot.config.conversation?.customQuestions?.WHO || defaultQuestions.WHO,
  }));

  const [flow, setFlow] = useState(chatbot.config.conversation?.flow || '5W');
  const [maxFollowUps, setMaxFollowUps] = useState(chatbot.config.conversation?.maxFollowUps || 3);
  const [isIntelligentFlow, setIsIntelligentFlow] = useState(true);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateChatbotMutation = useMutation({
    mutationFn: (data: Partial<Chatbot>) => 
      apiRequest(`/api/chatbots/${chatbot.id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chatbots'] });
      toast({
        title: 'Success',
        description: '5W flow configuration updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update configuration',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    const updatedConfig = {
      ...chatbot.config,
      conversation: {
        customQuestions: questions,
        flow,
        maxFollowUps,
      }
    };

    updateChatbotMutation.mutate({
      config: updatedConfig
    });
  };

  const handleReset = () => {
    setQuestions(defaultQuestions);
    setFlow('5W');
    setMaxFollowUps(3);
    setIsIntelligentFlow(true);
  };

  const handleQuestionChange = (topic: keyof typeof questions, value: string) => {
    setQuestions(prev => ({
      ...prev,
      [topic]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">5W Framework Configuration</h3>
        <p className="text-gray-600">
          Customize the questions and flow for your 5W conversation framework (Why, What, Where, When, Who).
        </p>
      </div>

      {/* Flow Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation Flow Settings</CardTitle>
          <CardDescription>
            Configure how your chatbot guides users through the 5W framework
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flow-type">Flow Type</Label>
              <Select value={flow} onValueChange={(value: '5W' | 'linear' | 'custom') => setFlow(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flow type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5W">Intelligent 5W Flow</SelectItem>
                  <SelectItem value="linear">Linear Sequential</SelectItem>
                  <SelectItem value="custom">Custom Flow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-followups">Max Follow-ups per Topic</Label>
              <Select value={maxFollowUps.toString()} onValueChange={(v) => setMaxFollowUps(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Follow-up</SelectItem>
                  <SelectItem value="2">2 Follow-ups</SelectItem>
                  <SelectItem value="3">3 Follow-ups</SelectItem>
                  <SelectItem value="5">5 Follow-ups</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intelligent-flow">AI-Driven Topic Switching</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="intelligent-flow"
                  checked={isIntelligentFlow}
                  onCheckedChange={setIsIntelligentFlow}
                />
                <span className="text-sm text-gray-600">
                  Let AI determine when to switch topics
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom 5W Questions</CardTitle>
          <CardDescription>
            Customize the questions for each topic in the 5W framework
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(questions).map(([topic, question]) => {
            const Icon = topicIcons[topic as keyof typeof topicIcons];
            return (
              <div key={topic} className="space-y-2">
                <Label htmlFor={`question-${topic}`} className="flex items-center gap-2">
                  <Icon size={16} className="text-blue-600" />
                  <span className="font-medium">{topic}</span>
                  <span className="text-sm text-gray-500">
                    ({topic === 'WHY' ? 'Motivation' : 
                      topic === 'WHAT' ? 'Services' :
                      topic === 'WHERE' ? 'Location' :
                      topic === 'WHEN' ? 'Timeline' : 'Contact'})
                  </span>
                </Label>
                <Textarea
                  id={`question-${topic}`}
                  value={question}
                  onChange={(e) => handleQuestionChange(topic as keyof typeof questions, e.target.value)}
                  placeholder={defaultQuestions[topic as keyof typeof defaultQuestions]}
                  className="min-h-[80px] resize-none"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

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
          {updateChatbotMutation.isPending ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}