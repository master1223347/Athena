import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly&access_type=offline&prompt=consent";

const GoogleCalendarSettings: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrate Google Calendar</CardTitle>
        <CardDescription>Sign in with Google to sync your calendar</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          asChild
          className="mt-4"
        >
          <a
            href={GOOGLE_OAUTH_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sign in with Google
          </a>
        </Button>
        <ul className="list-disc pl-5 mt-4 text-muted-foreground text-sm">
          <li>See your Canvas and Google events in one place</li>
          <li>Automatic sync (coming soon)</li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarSettings;
