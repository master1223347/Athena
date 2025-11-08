import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const PlansSettings: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plans</CardTitle>
        <CardDescription>Pricing and upcoming features</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Incoming: Pay for unlimited AI tools with the best models.</p>
        <ul className="list-disc pl-5">
          <li>OpenAI o3, o4</li>
          <li>Claude 3.7</li>
          <li>Gemini</li>
          {/* Add more models as needed */}
        </ul>
      </CardContent>
    </Card>
  );
};

export default PlansSettings;
