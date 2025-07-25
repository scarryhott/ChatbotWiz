import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Settings,
  Bot
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Chatbots", href: "/chatbots", icon: MessageSquare },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">wwwwwai</h1>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50"
              )}>
                <Icon className="w-5 h-5" />
                <span className={cn("font-medium", isActive && "font-semibold")}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">JS</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">John Smith</p>
            <p className="text-xs text-gray-500">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
