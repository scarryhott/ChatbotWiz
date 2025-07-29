import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Download, User, Phone, Mail, MapPin, Calendar, MessageCircle, Check, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  chatbotId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  service: string;
  message: string;
  specificRequests: string;
  conversationFlow: any[];
  topicResponses: Record<string, string[]>;
  timestamp: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  score: number;
  completedTopics: string[];
}

interface EnhancedLeadCollectionProps {
  chatbotId: string;
}

export default function EnhancedLeadCollection({ chatbotId }: EnhancedLeadCollectionProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, [chatbotId]);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chatbots/${chatbotId}/leads`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedLeads = leads
    .filter(lead => {
      const matchesSearch = 
        (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.phone || '').includes(searchTerm) ||
        (lead.location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.service?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'completedTopics':
          comparison = a.completedTopics.length - b.completedTopics.length;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const updateLeadStatus = async (leadId: string, status: Lead['status']) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        setLeads(prev => prev.map(lead => 
          lead.id === leadId ? { ...lead, status } : lead
        ));
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const { toast } = useToast();

  const deleteLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setLeads(prev => prev.filter(lead => lead.id !== leadId));
        toast({
          title: "Lead deleted",
          description: "The lead has been successfully deleted.",
        });
      } else {
        throw new Error('Failed to delete lead');
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Error",
        description: "Failed to delete the lead. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLead = (leadId: string, leadName: string) => {
    if (window.confirm(`Are you sure you want to delete the lead for "${leadName || 'Anonymous'}"? This action cannot be undone.`)) {
      deleteLead(leadId);
    }
  };

  const exportLeads = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Location', 'Service', 'Status', 'Score', 'Completed Topics', 'Timestamp'],
      ...filteredAndSortedLeads.map(lead => [
        lead.name,
        lead.email,
        lead.phone,
        lead.location,
        lead.service,
        lead.status,
        lead.score.toString(),
        lead.completedTopics.join('; '),
        lead.timestamp
      ])
    ];
    
    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTopicProgress = (lead: Lead) => {
    const totalTopics = 5; // WHY, WHO, WHAT, WHERE, WHEN
    const completedCount = lead.completedTopics.length;
    return Math.round((completedCount / totalTopics) * 100);
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading leads...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Lead Management</h3>
          <p className="text-gray-600">Track and manage leads captured through your 5W chatbot</p>
        </div>
        <Button onClick={exportLeads} className="flex items-center gap-2">
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search leads by name, email, phone, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white"
              >
                <option value="timestamp">Date</option>
                <option value="name">Name</option>
                <option value="score">Score</option>
                <option value="completedTopics">Progress</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAndSortedLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{lead.name || 'Anonymous'}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status}
                    </Badge>
                    <Badge variant="outline">
                      {getTopicProgress(lead)}% Complete
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  Score: {lead.score}/100
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                {lead.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-gray-400" />
                    <span>{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-gray-400" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                {lead.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{lead.location}</span>
                  </div>
                )}
              </div>

              {/* 5W Progress */}
              <div>
                <div className="text-sm font-medium mb-2">5W Topics Completed:</div>
                <div className="flex gap-1">
                  {['WHY', 'WHO', 'WHAT', 'WHERE', 'WHEN'].map((topic) => (
                    <div
                      key={topic}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        lead.completedTopics.includes(topic)
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      )}
                    >
                      {lead.completedTopics.includes(topic) ? (
                        <Check size={12} />
                      ) : (
                        topic[0]
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Interest */}
              {lead.service && (
                <div>
                  <div className="text-sm font-medium">Service Interest:</div>
                  <div className="text-sm text-gray-600">{lead.service}</div>
                </div>
              )}

              {/* Specific Requests */}
              {lead.specificRequests && (
                <div>
                  <div className="text-sm font-medium">Specific Requests:</div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded text-xs">
                    {lead.specificRequests.substring(0, 100)}...
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateLeadStatus(lead.id, 'contacted')}
                  disabled={lead.status === 'contacted'}
                >
                  Mark Contacted
                </Button>
                <Button
                  size="sm"
                  onClick={() => updateLeadStatus(lead.id, 'qualified')}
                  disabled={lead.status === 'qualified' || lead.status === 'converted'}
                >
                  Qualify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteLead(lead.id, lead.name)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-400 pt-2 border-t">
                {new Date(lead.timestamp).toLocaleDateString()} at {new Date(lead.timestamp).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedLeads.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Leads will appear here as users interact with your chatbot'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}