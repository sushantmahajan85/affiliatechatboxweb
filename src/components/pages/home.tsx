"use client";
import { CreatePost } from "@/components/create-post";
import { FeaturedPosts } from "@/components/featured-posts";
import { PostFeed } from "@/components/post-feed";
import { PostTabs } from "@/components/post-tabs";
import { useState } from "react";

export function HomePage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-6">
      <section>
        <FeaturedPosts />
      </section>

      <section>
        <CreatePost />
      </section>

      <section>
        <PostTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <PostFeed activeTab={activeTab} />
      </section>
    </div>
  );
}


