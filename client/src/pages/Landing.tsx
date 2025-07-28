import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageCircle, Users, Zap, BarChart3, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Build Smart AI Chatbots with
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> wwwwwai</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create intelligent chatbots that understand your business, engage customers with the 5W framework, and convert visitors into qualified leads.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
                <a href="/api/login">Get Started Free</a>
              </Button>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything you need to create intelligent chatbots
          </h2>
          <p className="text-lg text-gray-600">
            Powered by advanced AI and designed for maximum conversions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Bot className="w-10 h-10 text-blue-600 mb-2" />
              <CardTitle>5W Framework</CardTitle>
              <CardDescription>
                Structured conversations that capture Why, What, When, Where, and Who to qualify leads effectively.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-10 h-10 text-purple-600 mb-2" />
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>
                Automatically analyze your website to create personalized chatbot configurations and responses.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MessageCircle className="w-10 h-10 text-green-600 mb-2" />
              <CardTitle>Real-time Chat</CardTitle>
              <CardDescription>
                Engage visitors with intelligent conversations that adapt based on their responses and interests.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-10 h-10 text-orange-600 mb-2" />
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>
                Track, sort, and manage qualified leads with detailed 5W progress and conversation history.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-10 h-10 text-red-600 mb-2" />
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Monitor chatbot performance, conversion rates, and lead quality with comprehensive analytics.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-10 h-10 text-indigo-600 mb-2" />
              <CardTitle>Easy Integration</CardTitle>
              <CardDescription>
                Zero-code embedding for any website with customizable themes, positions, and behaviors.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your website visitors into qualified leads?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses using wwwwwai to automate customer engagement and increase conversions.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
            <a href="/api/login">Start Building Your Chatbot</a>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 wwwwwai. Built with AI for the future of customer engagement.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}