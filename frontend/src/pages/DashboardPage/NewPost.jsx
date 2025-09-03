import { ContentLayout } from '@/components/common/SidebarMenu/content-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function NewPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function handleSubmit(e){
    e.preventDefault();
    // TODO: integrate create post API
    console.log({ title, content });
  }

  return (
    <ContentLayout title="New Post">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div>
          <label className="block mb-2 font-medium">Title</label>
          <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Post title" />
        </div>
        <div>
          <label className="block mb-2 font-medium">Content</label>
          <textarea
            className="w-full min-h-[220px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={content}
            onChange={e=>setContent(e.target.value)}
            placeholder="Write something..."
          />
        </div>
        <div className="flex gap-3">
          <Button type="submit" className="cursor-pointer">Publish</Button>
          <Button type="button" variant="outline" className="cursor-pointer">Save Draft</Button>
        </div>
      </form>
    </ContentLayout>
  );
}
