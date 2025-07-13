import UserAvatar from "@/components/UserAvatar";
import { NotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NotificationType } from "@prisma/client";
import { Heart, MessageCircle, User2, Laugh, Sparkle, Frown, Angry, ThumbsUp } from "lucide-react";
import Link from "next/link";

interface NotificationProps {
  notification: NotificationData;
}

export default function Notification({ notification }: NotificationProps) {
  const notificationTypeMap: Record<
    NotificationType,
    { message: string; icon: JSX.Element; href: string }
  > = {
    FOLLOW: {
      message: `${notification.issuer.displayName} followed you`,
      icon: <User2 className="size-7" stroke="#58afed" />,
      href: `/users/${notification.issuer.username}`,
    },
    COMMENT: {
      message: `${notification.issuer.displayName} commented on your post`,
      icon: <MessageCircle className="size-7" stroke="#58afed" />,
      href: `/posts/${notification.postId}`,
    },
    LIKE: {
      message: `${notification.issuer.displayName} liked your post`,
      icon: <ThumbsUp className="size-7" stroke="#58afed" />,
      href: `/posts/${notification.postId}`,
    },
    LOVE: {
      message: `${notification.issuer.displayName} loved your post`,
      icon: <Heart className="size-7" stroke="pink" />,
      href: `/posts/${notification.postId}`,
    },
    LAUGH: {
      message: `${notification.issuer.displayName} found your post funny`,
      icon: <Laugh className="size-7" stroke="yellow" />,
      href: `/posts/${notification.postId}`,
    },
    WOW: {
      message: `${notification.issuer.displayName} was amazed by your post`,
      icon: <Sparkle className="size-7" stroke="yellow" />,
      href: `/posts/${notification.postId}`,
    },
    SAD: {
      message: `${notification.issuer.displayName} found your post sad`,
      icon: <Frown className="size-7" stroke="#a19c9c" />,
      href: `/posts/${notification.postId}`,
    },
    ANGRY: {
      message: `${notification.issuer.displayName} reacted angrily to your post`,
      icon: <Angry className="size-7" stroke="#f02929" />,
      href: `/posts/${notification.postId}`,
    },
  };

  const { message, icon, href } = notificationTypeMap[notification.type];

  return (
    <Link href={href} className="block">
      <article
        className={cn(
          "flex gap-3 rounded-2xl bg-card p-5 shadow-sm transition-colors hover:bg-card/70",
          !notification.read && "bg-primary/10",
        )}
      >
        <div className="my-1">{icon}</div>
        <div className="space-y-3">
          <UserAvatar avatarUrl={notification.issuer.avatarUrl} size={36} />
          <div>
            <span className="font-bold">{notification.issuer.displayName}</span>{" "}
            <span>{message}</span>
          </div>
          {notification.post && (
            <div className="line-clamp-3 whitespace-pre-line text-muted-foreground">
              {notification.post.content}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
