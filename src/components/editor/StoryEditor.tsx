'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Paragraph from '@tiptap/extension-paragraph';
import { useStoryStore } from '@/store/useStoryStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Bold as BoldIcon, Italic as ItalicIcon } from 'lucide-react';

export function StoryEditor() {
  const { content, setContent, setCurrentStep, authorInfo } = useStoryStore();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Paragraph,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  const handleBack = () => {
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (!content || content.trim().replace(/<[^>]*>/g, '').length < 10) {
      alert('Please write at least a few sentences for your story.');
      return;
    }
    setCurrentStep(2);
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Write Your Story</CardTitle>
        <CardDescription>
          Write your story for "{authorInfo.title}". Use the formatting tools to make it beautiful.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon className="w-4 h-4" />
          </Button>
          
          <div className="h-4 w-px bg-gray-300 mx-2" />
          
          <span className="text-sm text-gray-600">
            {content ? content.replace(/<[^>]*>/g, '').length : 0} characters
          </span>
        </div>

        {/* Editor */}
        <div className="border rounded-md min-h-[400px] bg-white">
          <EditorContent editor={editor} />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button
            type="button"
            onClick={handleNext}
            disabled={!content || content.trim().replace(/<[^>]*>/g, '').length < 10}
          >
            Continue to Sections
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
