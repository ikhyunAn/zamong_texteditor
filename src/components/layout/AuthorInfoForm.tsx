'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoryStore } from '@/store/useStoryStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';

export function AuthorInfoForm() {
  const { t } = useTranslation('common');
  const { authorInfo, setAuthorInfo, setCurrentStep } = useStoryStore();
  const [formData, setFormData] = useState(authorInfo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.title.trim()) {
      alert(t('authorForm.validationError'));
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
        <CardTitle>{t('authorForm.title')}</CardTitle>
        <CardDescription>
          {t('authorForm.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="authorName">{t('authorForm.nameLabel')}</Label>
            <Input
              id="authorName"
              type="text"
              placeholder={t('authorForm.namePlaceholder')}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="storyTitle">{t('authorForm.storyTitleLabel')}</Label>
            <Input
              id="storyTitle"
              type="text"
              placeholder={t('authorForm.storyTitlePlaceholder')}
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
            {t('authorForm.continueButton')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
