import { useState, useEffect, useRef } from "react";
import { useReports } from "@/contexts/ReportContext";
import { useNavigate } from "react-router-dom";
import { usePowerPayClient, useReports as usePowerPayReports, useSaveReport, useReportTemplates } from "@/hooks/usePowerPay";
import type { UUID, ReportTemplate } from "@/lib/powerpay-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Search, 
  Plus,
  FileText, 
  Calendar, 
  MoreVertical,
  Edit,
  Eye,
  DollarSign,
  Users,
  TrendingUp,
  Lightbulb,
  Send,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { SaveReportDialog } from "@/components/SaveReportDialog";
import { useToast } from "@/hooks/use-toast";

interface Report {
  conversationId: string;
  defaultTitle: string;
  reportName: string;
  createdAt: string;
  mapped: boolean;
}


const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startNewChat } = useReports();
  const powerPayClient = usePowerPayClient({ 
    baseUrl: 'https://ppcustomreport-crg4b5g5gccfgmhn.canadacentral-01.azurewebsites.net',
    token: 'eyJhbGciOiJSUzUxMiJ9.eyJyb2xlIjp7InBhZ2UiOm51bGwsImVtcGxveWVlIjpudWxsLCJmaWVsZCI6bnVsbH0sInNyYyI6IlBPV0VSUEFZSFJTRUxGU0VSVklDRSIsImNyZWF0ZWQiOjE3NjI0MTYwNzA2MTUsImlkIjo1MTA4NSwicGF5cm9sbElkIjoyODE0MjgsImRiVXNlcklkIjo1MTA4NSwiZXhwIjoxNzYyNDE2NjcwLCJpYXQiOjE3NjI0MTYwNzAsImlzTWlncmF0ZWQiOnRydWV9.F-uhGMjzYE_UNGgw34OUZN2jWBEqtSF4-WBG5FeQML29ayuRbyf5JP_t-iPXZXO_4yJvwwYSbfCZEJKAZuUH0YcmghC7XxhTndS14MI1PxHWPDqC6wpNbPKI0_VLGJ1Fu1hNhm5boJFTENu8_2tszEL7hCmg-FkONE3g9sfvQGC8ENSc3GV-MfhIuD8whNPIwuoHsgSSavA2vtoPIOmHbRbF-OFcSNrkCuNp1nNoMl0RVPImRO-8wn8egHarNdb-6Hf-202HnX3NbCjQQXsVfg461dgpHWH6aND8xVyhjvS6bXgOcm0icibYgLWQobFvDKANa2D3mMcjwa11g5Bepw'
  });
  const { data: powerPayReports, isLoading: loading } = usePowerPayReports(powerPayClient);
  const { data: templatesData, isLoading: loadingTemplates } = useReportTemplates(powerPayClient);
  const saveReportMutation = useSaveReport(powerPayClient);
  const templates = templatesData?.report_templates || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Transform PowerPay reports to Dashboard report format and sort by creation date (newest first)
  const reports: Report[] = (powerPayReports || [])
    .map(r => ({
      conversationId: r.report_id || '',
      defaultTitle: r.description || 'Untitled Report',
      reportName: r.name || '',
      createdAt: (r as any).created_at || new Date().toISOString(),
      mapped: !!r.name
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);
  

  const handleChatRedirect = () => {
    if (!chatInput.trim()) return;
    
    // Clear template flag and any existing loaded data
    localStorage.removeItem('isFromTemplate');
    localStorage.removeItem('loadedChatHistory');
    localStorage.removeItem('loadedConversationId');
    
    // Store the pending prompt for the chat page to pick up
    localStorage.setItem('pendingPrompt', chatInput);
    setChatInput(""); // Clear input
    
    // Immediately navigate to chat
    navigate('/chat');
  };

  const handleEditReport = async (conversationId: string) => {
    try {
      console.log('[DEBUG] handleEditReport - Loading conversation:', conversationId);
      const response = await powerPayClient.getConversationMessages(conversationId as UUID);
      
      console.log('[DEBUG] handleEditReport - API response:', response);
      console.log('[DEBUG] handleEditReport - Messages:', response.messages);
      
      const allMessages = response.messages || [];

      // Transform messages to the expected format - preserve ALL fields
      const transformedMessages = allMessages.map((msg, index) => {
        console.log(`[DEBUG] handleEditReport - Transforming message ${index}:`, msg);
        console.log(`[DEBUG] handleEditReport - Message insights:`, {
          summary: msg.summary,
          comprehensive_information: msg.comprehensive_information,
          key_insights: msg.key_insights,
          suggested_prompts: msg.suggested_prompts
        });
        
        return {
          id: msg.message_id || `msg-${index}`,
          message_id: msg.message_id,
          prompt: msg.prompt || '',                    // Keep prompt separate
          content: msg.prompt || msg.response || '',   // Keep content for display
          response: msg.response || null,              // Keep response/table data
          tableData: msg.response || null,             // Keep tableData alias
          summary: msg.summary,                        // Add summary
          comprehensiveInfo: msg.comprehensive_information, // Map to camelCase
          keyInsights: msg.key_insights,               // Map to camelCase
          suggestedPrompts: msg.suggested_prompts,     // Map to camelCase
          role: msg.role || (msg.prompt ? 'user' : 'assistant'), // Proper role
          timestamp: new Date().toISOString()
        };
      });
      
      console.log('[DEBUG] handleEditReport - Transformed messages:', transformedMessages);

      // Always store data and navigate, even if empty
      localStorage.setItem('loadedChatHistory', JSON.stringify(transformedMessages));
      localStorage.setItem('loadedConversationId', conversationId);
      
      navigate("/chat");
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateReportName = async (conversationId: string, newName: string) => {
    try {
      await saveReportMutation.mutateAsync({
        report_id: conversationId as UUID,
        name: newName,
        description: "Updated report name"
      });
    } catch (error) {
      console.error('Failed to update report name:', error);
    }
  };

  const handleRunTemplate = (template: ReportTemplate) => {
    // Store template info for chat page to process
    localStorage.setItem('pendingTemplate', JSON.stringify({
      id: template.report_template_id,
      name: template.report_template_name,
      description: template.report_template_description
    }));
    
    // Set flag for save button visibility
    localStorage.setItem('isFromTemplate', 'true');
    
    // Clear any existing data
    localStorage.removeItem('loadedChatHistory');
    localStorage.removeItem('loadedConversationId');
    localStorage.removeItem('pendingPrompt');
    
    // Navigate immediately
    navigate('/chat');
  };

  const checkScrollPosition = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 320; // Card width + gap
      const newScrollLeft = direction === 'left' 
        ? carouselRef.current.scrollLeft - scrollAmount
        : carouselRef.current.scrollLeft + scrollAmount;
      
      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      return () => {
        carousel.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, [templates]);

  const filteredReports = reports.filter(report =>
    (report.reportName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    report.defaultTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  const featureCards = [
    {
      icon: DollarSign,
      title: "Payroll Insights",
      description: "Get total costs, averages, and breakdowns by department",
      example: "Show me total payroll costs for Q3 2024"
    },
    {
      icon: Users,
      title: "Workforce Reports", 
      description: "Analyze individual employee data and metrics",
      example: "List all employees with overtime hours last month"
    },
    {
      icon: TrendingUp,
      title: "Trend Analysis",
      description: "Compare periods and identify changes over time", 
      example: "Compare payroll costs between Q2 and Q3 2024"
    }
  ];

  const promptingTips = [
    "Be specific with time ranges: \"Q3 2024\", \"last month\", \"year-to-date\"",
    "Filter by departments: \"Engineering team\", \"Sales department\"", 
    "Include pay codes: \"overtime\", \"bonuses\", \"healthcare deductions\"",
    "Ask for comparisons: \"compare this quarter to last quarter\""
  ];

  return (
    <div className="h-screen overflow-y-auto bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="max-w-3xl mx-auto mb-8">
            <h1 className="text-3xl font-medium text-gray-900 mb-4">
              Transform payroll data into insights with AI
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Ask simple questions, get detailed reports. Analyze your payroll history, earnings & deductions, employee profiles, and more.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 mb-8">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <span>Payroll Insights</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span>Workforce Reports</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <span>Trend Analysis</span>
              </div>
            </div>
          </div>
        </div>
          
        {/* Chat Input */}
        <div className="max-w-2xl mx-auto">
          <Card className="p-1 shadow-lg border-blue-200">
            <div className="flex items-center gap-3 p-3">
              <div className="flex-1">
                <Input
                  placeholder="Ask for a custom payroll report"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatRedirect()}
                  className="border-0 bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 px-0"
                />
              </div>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90" 
                onClick={handleChatRedirect}
                disabled={!chatInput.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-2 pb-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="commonly-used" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="commonly-used" className="gap-2">
                <Lightbulb className="w-4 h-4" />
                Commonly Used
              </TabsTrigger>
              <TabsTrigger value="recent" className="gap-2">
                <Clock className="w-4 h-4" />
                Recent Reports
              </TabsTrigger>
            </TabsList>

            {/* Commonly Used Reports Tab */}
            <TabsContent value="commonly-used">
              {loadingTemplates ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="min-w-[280px] max-w-[320px] p-5 flex-shrink-0">
                      <div className="flex items-start gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-5/6" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : templates.length > 0 ? (
                <div className="relative">
                  {/* Left Arrow */}
                  {showLeftArrow && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg bg-background hover:bg-accent"
                      onClick={() => scrollCarousel('left')}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  )}
                  
                  {/* Right Arrow */}
                  {showRightArrow && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg bg-background hover:bg-accent"
                      onClick={() => scrollCarousel('right')}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  )}
                  
                  <div 
                    ref={carouselRef}
                    className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
                  >
                    {templates.map((template) => (
                      <Card 
                        key={template.report_template_id}
                        className="min-w-[280px] max-w-[320px] p-5 hover:shadow-lg transition-all cursor-pointer hover:border-primary hover:border-2 flex-shrink-0"
                        onClick={() => handleRunTemplate(template)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2">
                              {template.report_template_name}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {template.report_template_description || "Click to generate this report"}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">No templates available</h3>
                  <p className="text-muted-foreground">
                    Report templates will appear here when available
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* Recent Reports Tab */}
            <TabsContent value="recent">
              {/* Search */}
              <div className="relative mb-6 w-full md:max-w-[calc(50%-0.75rem)]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Reports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="p-6 h-64">
                      <div className="flex flex-col h-full justify-between animate-pulse">
                        <div>
                          <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
                          <div className="h-3 bg-muted rounded mb-3 w-1/2"></div>
                          <div className="space-y-2">
                            <div className="h-3 bg-muted rounded w-full"></div>
                            <div className="h-3 bg-muted rounded w-5/6"></div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-10 bg-muted rounded flex-1"></div>
                          <div className="h-10 bg-muted rounded flex-1"></div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  paginatedReports.map((report) => (
                    <Card key={report.conversationId} className="p-6 hover:shadow-lg transition-smooth hover:border-blue-500 hover:border-2 cursor-pointer h-64">
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground text-lg mb-2">
                            {report.reportName || "Untitled Report - Click to edit"}
                          </h3>
                          <div className="text-xs text-muted-foreground mb-3">
                            Created on {new Date(report.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit' 
                            })}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {report.defaultTitle}
                          </p>
                        </div>

                        <div className="flex gap-2 justify-center">
                          <Button 
                            variant="outline" 
                            size="default" 
                            className="flex-1"
                            onClick={() => {
                              setEditingReport({
                                id: report.conversationId,
                                name: report.reportName || '',
                                description: report.defaultTitle || ''
                              });
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            size="default" 
                            className="bg-primary hover:bg-primary/90 flex-1"
                            onClick={() => handleEditReport(report.conversationId)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Run report
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="flex justify-center mt-8 py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          aria-disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          aria-disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredReports.length === 0 && (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">No reports found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'Try adjusting your search criteria' : 'Create your first report to get started'}
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Report
                  </Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>


      {/* Edit Report Dialog */}
      {editingReport && (
        <SaveReportDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          reportId={editingReport.id as UUID}
          mode="edit"
          initialName={editingReport.name}
          initialDescription={editingReport.description}
          onSaveSuccess={() => {
            // Reports will auto-refetch due to query invalidation in useSaveReport
            setEditingReport(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
