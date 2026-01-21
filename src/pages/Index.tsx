import { ChatInterface } from "@/components/ChatInterface";
import { ReportPreview } from "@/components/ReportPreview";

const Index = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat Interface */}
      <div className="min-w-[320px] w-96 max-w-[400px] border-r bg-card/30 backdrop-blur">
        <ChatInterface />
      </div>
      
      {/* Report Preview */}
      <div className="flex-1 bg-background overflow-hidden">
        <ReportPreview />
      </div>
    </div>
  );
};

export default Index;
