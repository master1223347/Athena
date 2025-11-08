import React from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Video, MessageSquare, Calendar, Award, AlertCircle, Send } from 'lucide-react';
import { trackFeedbackSubmission } from '@/utils/eventTracker';

const HelpPage: React.FC = () => {
  // Handle the feedback form click
  const handleFeedbackClick = () => {
    trackFeedbackSubmission("issue", {
      source: "help_page_button"
    });
    window.open("https://forms.gle/6QjGfGKcVgfARgGT7", "_blank");
  };
  const mainIssue = [{
    title: 'Missing Data',
    description: 'Your data syncs automatically with Canvas every minute, however if you are missing data, you should manually sync by clicking the "Sync Canvas" button on the dashboard or in your profile settings.',
    icon: <Lightbulb className="h-5 w-5 text-journey-primary" />
  }];
  const tips = [{
    title: 'Sync Regularly',
    description: 'Your data syncs automatically with Canvas every minute, but you can manually sync anytime.',
    icon: <Lightbulb className="h-5 w-5 text-journey-warning" />
  }, {
    title: 'Use the Calendar',
    description: 'Plan your week by viewing all upcoming assignments on the calendar page.',
    icon: <Lightbulb className="h-5 w-5 text-journey-warning" />
  }, {
    title: 'Check Your Progress',
    description: 'Visit the Progress page to see detailed analytics about your academic performance.',
    icon: <Lightbulb className="h-5 w-5 text-journey-warning" />
  }];
  const tutorials = [{
    title: 'Getting Started',
    description: 'Learn how to connect your Canvas account and navigate the app.',
    icon: <Video className="h-5 w-5 text-journey-info" />
  }, {
    title: 'Advanced Features',
    description: 'Discover advanced features like progress tracking and grade visualization.',
    icon: <Video className="h-5 w-5 text-journey-info" />
  }, {
    title: 'Canvas Integration',
    description: 'Learn how to get the most out of the Canvas integration features.',
    icon: <Video className="h-5 w-5 text-journey-info" />
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
  return <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Help & Resources</h1>
          <p className="text-muted-foreground mt-1">
            Learn how to get the most out of Gambit
          </p>
        </div>
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
              {mainIssue.map((issue, index) => <div key={index} className="p-4 rounded-lg border border-muted">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {issue.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{issue.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                    </div>
                  </div>
                </div>)}
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
              {faqs.map((faq, index) => <div key={index} className="p-4 rounded-lg border border-muted">
                  <h3 className="font-medium">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{faq.answer}</p>
                </div>)}
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
    </MainLayout>;
};
export default HelpPage;