"use client";

import { useQuery } from "@tanstack/react-query";
import { RecommendationData } from "@/lib/types";
import kyInstance from "@/lib/ky";
import UserAvatar from "./UserAvatar";
import FollowButton from "./FollowButton";
import UserLinkWithTooltip from "./UserLinkWithTooltip";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { useState } from "react";

interface PeopleYouMayKnowResponse {
  recommendations: RecommendationData[];
}

export default function PeopleYouMayKnow() {
  const [dismissedUsers, setDismissedUsers] = useState<Set<string>>(new Set());

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () =>
      kyInstance
        .get("/api/recommendations?limit=5")
        .json<PeopleYouMayKnowResponse>(),
    staleTime: 1000 * 60 * 10, // 15 minutes
  });

  const visibleRecommendations = data?.recommendations.filter(
    (rec) => !dismissedUsers.has(rec.user.id)
  ) || [];

  const dismissUser = (userId: string) => {
    setDismissedUsers(prev => new Set([...prev, userId]));
  };

  if (isLoading) {
    return (
      <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-xl font-bold">People you may know</div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse mt-1" />
                </div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
      </div>
    );
  }

  if (error || !visibleRecommendations.length) {
    return null;
  }

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">People you may know</div>
      <div className="space-y-3">
        {visibleRecommendations.slice(0, 5).map((recommendation) => (
          <RecommendationItem
            key={recommendation.user.id}
            recommendation={recommendation}
            onDismiss={() => dismissUser(recommendation.user.id)}
          />
        ))}
        {visibleRecommendations.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => refetch()}
          >
            See more suggestions
          </Button>
        )}
      </div>
    </div>
  );
}

interface RecommendationItemProps {
  recommendation: RecommendationData;
  onDismiss: () => void;
}

function RecommendationItem({ recommendation, onDismiss }: RecommendationItemProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <UserLinkWithTooltip username={recommendation.user.username}>
        <UserAvatar 
          avatarUrl={recommendation.user.avatarUrl} 
          size={40}
        />
      </UserLinkWithTooltip>
      
      <div className="flex-1 min-w-0">
        <UserLinkWithTooltip username={recommendation.user.username}>
          <div className="font-semibold truncate hover:underline">
            {recommendation.user.displayName}
          </div>
        </UserLinkWithTooltip>
        <div className="text-sm text-muted-foreground truncate">
          @{recommendation.user.username}
        </div>
        <div className="text-xs text-muted-foreground">
          {recommendation.reason}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <FollowButton
          userId={recommendation.user.id}
          initialState={{
            followers: recommendation.user._count.followers,
            isFollowedByUser: false,
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}