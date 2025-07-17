'use client';

import { useState } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';

export function AuthorInfoForm() {
  const { authorInfo, setAuthorInfo, setCurrentStep } = useStoryStore();
  const [formData, setFormData] = useState(authorInfo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.title.trim()) {
      alert('Please fill in both your name and story title.');
      return;
    }
    
    setAuthorInfo(formData);
    setCurrentStep(1);
  };

  const handleInputChange = (field: 'name' | 'title', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <CardDescription>
          Enter your information to begin creating your Instagram story posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="authorName">Your Name</Label>
            <Input
              id="authorName"
              type="text"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="storyTitle">Story Title</Label>
            <Input
              id="storyTitle"
              type="text"
              placeholder="Enter your story title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={!formData.name.trim() || !formData.title.trim()}
          >
            Continue to Story Editor
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
