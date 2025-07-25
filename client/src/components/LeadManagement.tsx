import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Eye, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead } from "@shared/schema";

interface LeadManagementProps {
  chatbotId: string;
}

export default function LeadManagement({ chatbotId }: LeadManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/chatbots", chatbotId, "leads"],
    enabled: !!chatbotId,
  });

  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = leads.filter(lead => 
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.contextSummary?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "completion":
          const aProgress = getProgressCount(a);
          const bProgress = getProgressCount(b);
          return bProgress - aProgress;
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        default:
          return 0;
      }
    });

    return sorted;
  }, [leads, searchQuery, sortBy]);

  const getProgressCount = (lead: Lead) => {
    return Object.values(lead.fiveWProgress).filter(p => p.completed).length;
  };

  const getProgressBadges = (lead: Lead) => {
    const topics = ["why", "what", "when", "where", "who"] as const;
    return topics.map((topic, index) => {
      const progress = lead.fiveWProgress[topic];
      return (
        <div
          key={topic}
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
            progress.completed
              ? "bg-green-500 text-white"
              : index === getProgressCount(lead)
              ? "bg-yellow-500 text-white"
              : "bg-gray-300 text-gray-600"
          )}
        >
          {progress.completed ? (
            <Check className="w-3 h-3" />
          ) : index === getProgressCount(lead) ? (
            <Clock className="w-3 h-3" />
          ) : (
            index + 1
          )}
        </div>
      );
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return new Date(date).toLocaleDateString();
  };

  const handleExport = () => {
    // TODO: Implement lead export functionality
    console.log("Exporting leads...");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Lead Management
          </CardTitle>
          <div className="flex items-center space-x-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="completion">Sort by Completion</SelectItem>
                <SelectItem value="name">Sort by Name</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredAndSortedLeads.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600">
              {searchQuery ? "Try adjusting your search terms" : "Leads will appear here when users engage with your chatbot"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    5W Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Context Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">
                          {lead.name || "Anonymous"}
                        </p>
                        {lead.email && (
                          <p className="text-sm text-gray-500">{lead.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        {getProgressBadges(lead)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 max-w-xs truncate">
                        {lead.contextSummary || "No summary available"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 text-primary-600" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
