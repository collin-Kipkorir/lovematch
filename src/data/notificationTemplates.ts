interface NotificationTemplate {
  title: string;
  body: string;
  icon: string;
  action: string;
}

export const notificationTemplates: NotificationTemplate[] = [
  {
    title: "New Matches Nearby! 💕",
    body: "Someone special might be just around the corner. Check out new profiles in your area!",
    icon: "/icons/icon-192x192.png",
    action: "/matches"
  },
  {
    title: "You're Popular! 🌟",
    body: "Someone liked your profile in the last hour. See who it might be!",
    icon: "/icons/icon-192x192.png",
    action: "/profile"
  },
  {
    title: "Don't Miss Out! 💬",
    body: "Someone is interested in chatting with you. Open the app to connect!",
    icon: "/icons/icon-192x192.png",
    action: "/chats"
  },
  {
    title: "Your Perfect Match? ❤️",
    body: "We found someone who matches your interests! Check them out now.",
    icon: "/icons/icon-192x192.png",
    action: "/matches"
  },
  {
    title: "Love is in the Air! 💫",
    body: "Your profile is getting attention! Log in to see who's interested.",
    icon: "/icons/icon-192x192.png",
    action: "/profile"
  },
  {
    title: "Weekend Special! 🎉",
    body: "More singles are active now! It's the perfect time to find your match.",
    icon: "/icons/icon-192x192.png",
    action: "/"
  },
  {
    title: "Making Connections 🤝",
    body: "Your profile matches with several new people in your area!",
    icon: "/icons/icon-192x192.png",
    action: "/matches"
  },
  {
    title: "Don't Keep Them Waiting! 💌",
    body: "You have pending chat requests. Someone special might be trying to reach you!",
    icon: "/icons/icon-192x192.png",
    action: "/chats"
  }
];