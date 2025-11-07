// Page-specific hook for Custom AI Report Chat
import { useState, useEffect, useRef, useCallback } from 'react';
import { useReportGenerator } from '@/hooks/useReportGenerator';
import type { ChatMessage, Report } from '@/models/powerPayReport';

export interface UseCustomAIReportChatResult {
  messages: ChatMessage[];
  inputValue: string;
  setInputValue: (value: string) => void;
  isGenerating: boolean;
  currentReport: Report | null;
  conversationId: string | null;
  messageId: string | null;
  handleSendMessage: () => Promise<void>;
  handleSuggestedPromptClick: (prompt: string) => void;
}

export function useCustomAIReportChat(): UseCustomAIReportChatResult {
  const { generating, startNewReport, continueConversation } = useReportGenerator();
  
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1',
    content: "Hello! I'm your AI HR report assistant. Tell me what kind of payroll or HR report you'd like to create - such as payroll summaries, benefits analysis, time tracking, or workforce demographics.",
    sender: 'assistant',
    timestamp: new Date()
  }]);
  const [inputValue, setInputValue] = useState('');
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messageId, setMessageId] = useState<string | null>(null);
  const chatHistoryInitialized = useRef(false);

  // Load chat history from localStorage
  useEffect(() => {
    if (chatHistoryInitialized.current) return;
    
    const loadedHistory = localStorage.getItem('loadedChatHistory');
    const loadedConvId = localStorage.getItem('loadedConversationId');
    
    if (loadedHistory && loadedConvId) {
      try {
        const parsedHistory = JSON.parse(loadedHistory);
        
        if (parsedHistory.length > 0) {
          const latestMessage = parsedHistory[0];
          const latestMessageId = latestMessage.message_id || latestMessage.id;
          
          setMessageId(latestMessageId);
          setConversationId(loadedConvId);
          
          // Find message with data for currentReport
          console.log('[DEBUG] useCustomAIReportChat - parsedHistory:', parsedHistory);

          // First try to find messages with response/tableData arrays
          let messagesWithData = parsedHistory.filter((msg: any) => 
            (msg.response && Array.isArray(msg.response)) || (msg.tableData && Array.isArray(msg.tableData))
          );

          console.log('[DEBUG] useCustomAIReportChat - messagesWithData:', messagesWithData);

          // If no messages with data, try to find assistant messages with insights
          if (messagesWithData.length === 0) {
            messagesWithData = parsedHistory.filter((msg: any) => 
              msg.role === 'assistant' && (msg.summary || msg.comprehensiveInfo || msg.comprehensive_information)
            );
            console.log('[DEBUG] useCustomAIReportChat - messagesWithInsights:', messagesWithData);
          }

          const messageWithData = messagesWithData.length > 0 
            ? messagesWithData[messagesWithData.length - 1] 
            : null;

          console.log('[DEBUG] useCustomAIReportChat - messageWithData:', messageWithData);

          if (messageWithData) {
            const tableData = messageWithData.response || messageWithData.tableData;
            console.log('[DEBUG] useCustomAIReportChat - Creating currentReport with:', {
              summary: messageWithData.summary,
              comprehensiveInfo: messageWithData.comprehensiveInfo || messageWithData.comprehensive_information,
              keyInsights: messageWithData.keyInsights || messageWithData.key_insights,
              suggestedPrompts: messageWithData.suggestedPrompts || messageWithData.suggested_prompts,
              hasTableData: !!tableData
            });
            
            setCurrentReport({
              id: loadedConvId,
              title: 'Query Results',
              description: 'Report generated from chat history',
              content: '',
              status: 'published',
              type: 'data-report',
              createdAt: new Date(),
              updatedAt: new Date(),
              summary: messageWithData.summary,
              comprehensiveInfo: messageWithData.comprehensiveInfo || messageWithData.comprehensive_information,
              keyInsights: messageWithData.keyInsights || messageWithData.key_insights,
              suggestedPrompts: messageWithData.suggestedPrompts || messageWithData.suggested_prompts,
              apiData: tableData ? {
                title: 'Query Results',
                type: 'Query Results',
                data: tableData
              } : undefined
            });
          } else {
            console.log('[DEBUG] useCustomAIReportChat - No message with data or insights found!');
          }
          
          // Transform messages for display
          const transformedMessages: ChatMessage[] = parsedHistory.map((msg: any, index: number) => {
            const isUserMessage = msg.role === 'user';
            return {
              id: msg.id || `loaded-${index}`,
              content: msg.summary || msg.prompt || msg.content || 'Response generated',
              sender: isUserMessage ? 'user' : 'assistant',
              timestamp: new Date(msg.timestamp || Date.now()),
              tableData: msg.response || msg.tableData || null,
              summary: msg.summary,
              comprehensiveInfo: msg.comprehensiveInfo || msg.comprehensive_information,
              keyInsights: msg.keyInsights || msg.key_insights,
              suggestedPrompts: msg.suggestedPrompts || msg.suggested_prompts
            };
          });
          
          setMessages([messages[0], ...transformedMessages]);
          localStorage.removeItem('loadedChatHistory');
          localStorage.removeItem('loadedConversationId');
          chatHistoryInitialized.current = true;
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || generating) return;

    const userPrompt = inputValue;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: userPrompt,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    const thinkingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: "I'm analyzing your requirements and generating a comprehensive report...",
      sender: 'assistant',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      if (conversationId && messageId) {
        // Continue existing conversation
        const result = await continueConversation(conversationId, userPrompt);
        
        if (result.messages.length > 0) {
          const latestMsg = result.messages.find(m => m.role === 'assistant');
          if (latestMsg) {
            const assistantResponse: ChatMessage = {
              id: latestMsg.message_id || thinkingMessage.id,
              content: latestMsg.summary || latestMsg.content || 'Here are your results:',
              sender: 'assistant',
              timestamp: new Date(),
              tableData: latestMsg.tableData,
              summary: latestMsg.summary,
              comprehensiveInfo: latestMsg.comprehensiveInfo,
              keyInsights: latestMsg.keyInsights,
              suggestedPrompts: latestMsg.suggestedPrompts
            };
            
            setMessages(prev => prev.map(msg => 
              msg.id === thinkingMessage.id ? assistantResponse : msg
            ));
            
            if (result.report) {
              setCurrentReport(result.report);
            }
          }
        }
      } else {
        // Start new conversation
        const result = await startNewReport(userPrompt);
        setConversationId(result.reportId);
        setMessageId(result.messageId);
        setCurrentReport(result.report);
        
        const aiResponse: ChatMessage = {
          id: thinkingMessage.id,
          content: `Perfect! I've generated a comprehensive report titled "${result.report.title}".`,
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => prev.map(msg => 
          msg.id === thinkingMessage.id ? aiResponse : msg
        ));
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: thinkingMessage.id,
        content: "I apologize, but there was an error generating your report. Please try again.",
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessage.id ? errorMessage : msg
      ));
    }
  }, [inputValue, generating, conversationId, messageId, continueConversation, startNewReport]);

  const handleSuggestedPromptClick = useCallback((prompt: string) => {
    setInputValue(prompt);
  }, []);

  return {
    messages,
    inputValue,
    setInputValue,
    isGenerating: generating,
    currentReport,
    conversationId,
    messageId,
    handleSendMessage,
    handleSuggestedPromptClick
  };
}
