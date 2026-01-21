import { ChatInterface } from "@/components/ChatInterface";
import { ReportPreview } from "@/components/ReportPreview";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Back Button Bar */}
      <div className="h-12 border-b bg-card/50 backdrop-blur flex items-center px-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Interface */}
        <div className="min-w-[320px] w-96 max-w-[400px] border-r bg-card/30 backdrop-blur">
          <ChatInterface />
        </div>
        
        {/* Report Preview */}
        <div className="flex-1 bg-background overflow-hidden">
          <ReportPreview />
        </div>
      </div>
    </div>
  );
};

export default Index;
