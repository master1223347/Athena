import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User, Palette, Link, DollarSign, Calendar, Database, HelpCircle, Lightbulb, MessageSquare, AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackFeedbackSubmission } from '@/utils/eventTracker';
import ProfileSettings from '@/components/settings/ProfileSettings';
import CanvasConnect from '@/components/canvas/CanvasConnect';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import PlansSettings from '@/components/settings/PlansSettings';
import GoogleCalendarSettings from '@/components/settings/GoogleCalendarSettings';
import PipelineControl from '@/components/settings/PipelineControl';

const SettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'profile');

  // Handle the feedback form click
  const handleFeedbackClick = () => {
    trackFeedbackSubmission("issue", {
      source: "settings_help_tab"
    });
    window.open("https://forms.gle/6QjGfGKcVgfARgGT7", "_blank");
  };

  const mainIssue = [{
    title: 'Missing Data',
    description: 'Your data syncs automatically with Canvas every minute, however if you are missing data, you should manually sync by clicking the "Sync Canvas" button on the dashboard or in your profile settings.',
    icon: <Lightbulb className="h-5 w-5 text-journey-primary" />
  }];

  const faqs = [{
    question: 'How do I connect my Canvas account?',
    answer: 'Go to Settings, click on the Canvas Integration tab, and enter your Canvas domain and API token.'
  }, {
    question: 'How often does data sync with Canvas?',
    answer: 'Data syncs automatically every minute when you have the app open. You can also manually sync by clicking the "Sync Canvas" button on the dashboard.'
  }, {
    question: 'Why do I need to generate a Canvas API token?',
    answer: 'The API token allows Gambit to securely access your Canvas data without storing your Canvas password.'
  }, {
    question: 'Can I track assignments that are not in Canvas?',
    answer: 'Yes! You can manually add assignments to any course through the Courses page.'
  }, {
    question: 'Is my data private?',
    answer: 'Yes, your Canvas data is stored securely and is only accessible to you when logged into your account.'
  }];
  
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/settings?tab=${value}`);
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and application preferences
          </p>
        </div>
        
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/4">
              <Card>
                <CardContent className="p-0">
                  <TabsList className="flex flex-col items-stretch h-auto p-0 bg-transparent">
                    <TabsTrigger 
                      value="profile" 
                      className="justify-start px-4 py-3 data-[state=active]:bg-muted rounded-none border-b"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger 
                      value="canvas" 
                      className="justify-start px-4 py-3 data-[state=active]:bg-muted rounded-none border-b"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Canvas Integration
                    </TabsTrigger>
{/* 
                    <TabsTrigger 
                      value="pipeline" 
                      className="justify-start px-4 py-3 data-[state=active]:bg-muted rounded-none border-b"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Data Pipeline
                    </TabsTrigger> */}

                    {/* <TabsTrigger 
                      value="google-calendar" 
                      className="justify-start px-4 py-3 data-[state=active]:bg-muted rounded-none border-b"
                    >
                      <Calendar className="h-3 w-3" />
                      Google Calendar Integration
                      
                    </TabsTrigger> */}

                    <TabsTrigger 
                      value="appearance" 
                      className="justify-start px-4 py-3 data-[state=active]:bg-muted rounded-none border-b"
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Appearance
                    </TabsTrigger>
                    <TabsTrigger 
                      value="help" 
                      className="justify-start px-4 py-3 data-[state=active]:bg-muted rounded-none border-b"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Help
                    </TabsTrigger>
                    {/* <TabsTrigger 
                      value="plans" 
                      className="justify-start px-4 py-3 data-[state=active]:bg-muted rounded-none border-b"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Plans
                      
                    </TabsTrigger> */}
                    
                  </TabsList>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:w-3/4">
              <TabsContent value="profile" className="m-0">
                <ProfileSettings />
              </TabsContent>
              
              <TabsContent value="canvas" className="m-0">
                <CanvasConnect />
              </TabsContent>
              
              <TabsContent value="pipeline" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Canvas Data Pipeline
                    </CardTitle>
                    <CardDescription>
                      Process your Canvas course data to enhance the AI assistant with course-specific knowledge
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PipelineControl />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="appearance" className="m-0">
                <AppearanceSettings />
              </TabsContent>

              <TabsContent value="help" className="m-0">
                <div className="space-y-6">
                  {/* Main Issue */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-journey-primary" />
                        Important!
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mainIssue.map((issue, index) => (
                          <div key={index} className="p-4 rounded-lg border border-muted">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {issue.icon}
                              </div>
                              <div>
                                <h3 className="font-medium">{issue.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Q&A Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-journey-primary" />
                        Frequently Asked Questions
                      </CardTitle>
                      <CardDescription>
                        Common questions about using Gambit
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {faqs.map((faq, index) => (
                          <div key={index} className="p-4 rounded-lg border border-muted">
                            <h3 className="font-medium">{faq.question}</h3>
                            <p className="text-sm text-muted-foreground mt-2">{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Issues/Suggestions Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-journey-primary" />
                        Issues/Suggestions
                      </CardTitle>
                      <CardDescription>Contact us with any issues or suggestions you have</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="default" 
                        className="w-1/5 flex items-center gap-2" 
                        onClick={handleFeedbackClick}
                      >
                        <Send className="w-4 h-4" />
                        <span>Contact Us</span>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="google-calendar" className="m-0">
                <GoogleCalendarSettings />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
