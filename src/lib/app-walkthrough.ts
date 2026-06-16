import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  Headset,
  Home,
  MessageSquare,
  PenLine,
  Rocket,
  Settings,
  Sparkles,
  User,
  Users,
} from "lucide-react";

export type WalkthroughStep = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tip?: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  glowColor: string;
  /** Brand hero uses light text on teal gradient (final step). */
  heroVariant?: "default" | "brand";
};

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to Affiliate Chat Box",
    description:
      "Your all-in-one platform for affiliate networking — share insights, connect with members, and grow your partnerships.",
    tip: "This quick tour shows you the essentials. You can skip anytime.",
    gradient: "from-[#0A7EA4] via-[#1A8FB5] to-[#5B9FD4]",
    iconBg: "bg-white/95",
    iconColor: "text-[#0A7EA4]",
    glowColor: "bg-white/25",
    heroVariant: "brand",
  },
  {
    id: "home",
    icon: Home,
    title: "Community Home Feed",
    description:
      "Browse posts from the affiliate community. Switch tabs to see all posts, your posts, or trending discussions.",
    tip: "Use the sidebar Home link to return here anytime.",
    gradient: "from-[#D4EFF7] via-[#E0F2F7] to-[#FFFFFF]",
    iconBg: "bg-[#EEF2FF]",
    iconColor: "text-[#0A7EA4]",
    glowColor: "bg-[#0A7EA4]/15",
  },
  {
    id: "create-post",
    icon: PenLine,
    title: "Create & Share Posts",
    description:
      "Share updates, deals, and insights with the community. Featured posts highlight top content at the top of your feed.",
    tip: "Look for the create post box on Home when you're signed in.",
    gradient: "from-[#E0F2F7] via-[#F5F0FA] to-[#FFFFFF]",
    iconBg: "bg-white",
    iconColor: "text-[#086d8c]",
    glowColor: "bg-[#7B61FF]/12",
  },
  {
    id: "profile",
    icon: User,
    title: "Your Profile",
    description:
      "Build your professional presence — add your photo, bio, and contact details. Verify your phone to unlock full chat features.",
    tip: "Open Profile from the sidebar to edit your information.",
    gradient: "from-[#E0D9F0] via-[#F5F0FA] to-[#FFFFFF]",
    iconBg: "bg-[#EEF2FF]",
    iconColor: "text-[#7B61FF]",
    glowColor: "bg-[#7B61FF]/15",
  },
  {
    id: "chats",
    icon: MessageSquare,
    title: "Chats & Messaging",
    description:
      "Send direct messages to members you've connected with. Use the full Chats page or the floating chat bar at the bottom.",
    tip: "Mini chat windows let you message while browsing other pages.",
    gradient: "from-[#BEE3EF] via-[#E0F2F7] to-[#FFFFFF]",
    iconBg: "bg-white",
    iconColor: "text-[#0A7EA4]",
    glowColor: "bg-[#0A7EA4]/18",
  },
  {
    id: "directory",
    icon: Users,
    title: "Member Directory",
    description:
      "Search and discover affiliate professionals. View profiles, send connection requests, and start conversations.",
    tip: "Filter members to find the right partners for your niche.",
    gradient: "from-[#C8E6DF] via-[#E0F2F7] to-[#FFFFFF]",
    iconBg: "bg-[#EEF2FF]",
    iconColor: "text-[#086d8c]",
    glowColor: "bg-[#0A7EA4]/12",
  },
  {
    id: "partners",
    icon: Building2,
    title: "Partners Network",
    description:
      "Explore partner listings and programs. Open partner details to learn more and connect with organizations.",
    tip: "On smaller screens, use the partners panel button in the header.",
    gradient: "from-[#C5E3F0] via-[#E0F2F7] to-[#FFFFFF]",
    iconBg: "bg-white",
    iconColor: "text-[#0A7EA4]",
    glowColor: "bg-[#0A7EA4]/15",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications & Alerts",
    description:
      "Stay on top of chat requests, mentions, and system updates. The bell icon in the header shows your latest activity.",
    tip: "Mark all as read from the notifications dropdown.",
    gradient: "from-[#DDD0F5] via-[#F5F0FA] to-[#FFFFFF]",
    iconBg: "bg-[#EEF2FF]",
    iconColor: "text-[#7B61FF]",
    glowColor: "bg-[#7B61FF]/18",
  },
  {
    id: "admin",
    icon: Headset,
    title: "Contact Admin",
    description:
      "Need help? Reach official support directly through the Contact Admin page for platform assistance.",
    tip: "Find it in the sidebar under Contact Admin.",
    gradient: "from-[#D4EFF7] via-[#EEF2FF] to-[#FFFFFF]",
    iconBg: "bg-white",
    iconColor: "text-[#0A7EA4]",
    glowColor: "bg-[#0A7EA4]/12",
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings & Preferences",
    description:
      "Manage email, push, and desktop notification preferences from your account menu in the top-right corner.",
    tip: "Click your profile avatar to access Settings and sign out.",
    gradient: "from-[#E2E8F0] via-[#F0F2F5] to-[#FFFFFF]",
    iconBg: "bg-white",
    iconColor: "text-[#1A1A2E]",
    glowColor: "bg-[#1A1A2E]/8",
  },
  {
    id: "complete",
    icon: Rocket,
    title: "You're All Set!",
    description:
      "You're ready to explore Affiliate Chat Box. Connect with members, share posts, and grow your affiliate network.",
    tip: "You can revisit features anytime from the sidebar.",
    gradient: "from-[#1A1A2E] via-[#0A7EA4] to-[#086d8c]",
    iconBg: "bg-white/95",
    iconColor: "text-[#0A7EA4]",
    glowColor: "bg-white/20",
    heroVariant: "brand",
  },
];
