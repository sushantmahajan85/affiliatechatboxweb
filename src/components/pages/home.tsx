"use client";
import { CreatePost } from "@/components/create-post";
import { FeaturedPosts } from "@/components/featured-posts";
import { PostFeed } from "@/components/post-feed";
import { PostTabs } from "@/components/post-tabs";
import { useAppSelector } from "@/store/hooks";
import { useState } from "react";

export function HomePage() {
  const [activeTab, setActiveTab] = useState("all");
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      {isAuthenticated && (
        <section>
          <FeaturedPosts />
        </section>
      )}

      {isAuthenticated && (
        <section>
          <CreatePost />
        </section>
      )}

      <section>
        <PostTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <PostFeed activeTab={activeTab} />
      </section>
    </div>
  );
}


