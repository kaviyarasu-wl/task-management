import { useState, useRef, useEffect } from 'react';
import { Send, X, Paperclip } from 'lucide-react';
import { UserAvatar } from '@/shared/components/UserAvatar';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { FileUploadZone } from '@/features/uploads';
import type { Comment } from '../types/comment.types';

interface CommentFormProps {
  taskId: string;
  editingComment?: Comment | null;
  onSubmit: (content: string) => void;
  onCancelEdit?: () => void;
  isSubmitting?: boolean;
}

export function CommentForm({
  taskId,
  editingComment,
  onSubmit,
  onCancelEdit,
  isSubmitting = false,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const user = useAuthStore((state) => state.user);

  const isEditing = Boolean(editingComment);

  // Set content when editing
  useEffect(() => {
    if (editingComment) {
      setContent(editingComment.content);
      textareaRef.current?.focus();
    }
  }, [editingComment]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || isSubmitting) return;

    onSubmit(trimmedContent);
    if (!isEditing) {
      setContent('');
    }
  };

  const handleCancel = () => {
    setContent('');
    onCancelEdit?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Cancel edit on Escape
    if (e.key === 'Escape' && isEditing) {
      handleCancel();
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      {!isEditing && (
        <UserAvatar
          firstName={user.firstName}
          lastName={user.lastName}
          size="md"
          className="flex-shrink-0"
        />
      )}

      <div className="flex-1 space-y-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isEditing ? 'Edit your comment...' : 'Write a comment... (use @ to mention)'}
          className="w-full min-h-[80px] max-h-[200px] resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
          disabled={isSubmitting}
          rows={2}
        />

        {isAttaching && (
          <FileUploadZone
            entityType="comment"
            entityId={taskId}
            compact
            onUploadComplete={() => setIsAttaching(false)}
          />
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {content.length}/5000
            </span>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsAttaching(!isAttaching)}
                className="rounded p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Comment'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
