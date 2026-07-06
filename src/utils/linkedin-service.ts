import { getApiBaseUrl } from "@/lib/api-base-url";

export const sharePostOnLinkedIn = async (
  postContent: string,
  accessToken: string,
  linkedinID: string,
  postId?: string,
  postDescription?: string
) => {
  if (!linkedinID || !accessToken) {
    return {
      success: false,
      data: "LinkedIn credentials missing. Please sign in with LinkedIn again.",
    };
  }

  const url = `${getApiBaseUrl()}/api/posts/share-on-linkedin`;

  const body: Record<string, string> = {
    postContent,
    accessToken,
    linkedinID,
  };
  if (postId) {
    body.postId = postId;
  }
  if (postDescription?.trim()) {
    body.postDescription = postDescription.trim();
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: "Post shared successfully on LinkedIn!",
      };
    }
    return {
      success: false,
      data: result.message || "Failed to share post on LinkedIn via proxy.",
    };
  } catch (error: unknown) {
    console.error("Error while sharing post to LinkedIn proxy:", error);
    const message = error instanceof Error ? error.message : "Error while connecting to the server. Try again later.";
    return {
      success: false,
      data: message,
    };
  }
};
