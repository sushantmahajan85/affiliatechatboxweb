import { getApiBaseUrl } from "@/lib/api-base-url";

export const sharePostOnLinkedIn = async (
  postContent: string,
  accessToken: string,
  linkedinID: string
) => {
  if (!linkedinID || !accessToken) {
    return {
      success: false,
      data: "LinkedIn credentials missing. Please sign in with LinkedIn again.",
    };
  }

  const url = `${getApiBaseUrl()}/api/posts/share-on-linkedin`;

  const body = {
    postContent: `\n\n${postContent}\n\nI am using #affiliatechatbox`,
    accessToken,
    linkedinID
  };

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
    } else {
      return {
        success: false,
        data: result.message || "Failed to share post on LinkedIn via proxy.",
      };
    }
  } catch (error: any) {
    console.error("Error while sharing post to LinkedIn proxy:", error);
    return {
      success: false,
      data: error.message || "Error while connecting to the server. Try again later.",
    };
  }
};
