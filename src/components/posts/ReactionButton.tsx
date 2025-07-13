"use client";

import kyInstance from "@/lib/ky";
import { ReactionInfo, ReactionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useToast } from "../ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import styles from "./ReactionButton.module.css";

interface ReactionButtonProps {
  postId: string;
  initialState: ReactionInfo;
}

const REACTION_EMOJIS = {
  LIKE: "👍",
  LOVE: "❤️",
  LAUGH: "😂",
  WOW: "😮",
  SAD: "😢",
  ANGRY: "😡",
} as const;

const REACTION_COLORS = {
  LIKE: "text-blue-500",
  LOVE: "text-red-500",
  LAUGH: "text-yellow-500",
  WOW: "text-orange-500",
  SAD: "text-blue-400",
  ANGRY: "text-red-600",
} as const;

export default function ReactionButton({ postId, initialState }: ReactionButtonProps) {
  const { toast } = useToast();
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();
  const queryKey: QueryKey = ["reaction-info", postId];

  const { data } = useQuery({
    queryKey,
    queryFn: () =>
      kyInstance.get(`/api/posts/${postId}/reactions`).json<ReactionInfo>(),
    initialData: initialState,
  });

  const { mutate } = useMutation({
    mutationFn: (reactionType: ReactionType | null) =>
      reactionType
        ? kyInstance.post(`/api/posts/${postId}/reactions`, {
            json: { type: reactionType },
          })
        : kyInstance.delete(`/api/posts/${postId}/reactions`),
    onMutate: async (reactionType) => {
      await queryClient.cancelQueries({ queryKey });

      const previousState = queryClient.getQueryData<ReactionInfo>(queryKey);

      queryClient.setQueryData<ReactionInfo>(queryKey, () => {
        if (!previousState) return previousState;

        const newReactionCounts = { ...previousState.reactionCounts };
        let newTotalReactions = previousState.reactions;

        // Remove old reaction if exists
        if (previousState.userReaction) {
          newReactionCounts[previousState.userReaction]--;
          newTotalReactions--;
        }

        // Add new reaction if provided
        if (reactionType) {
          newReactionCounts[reactionType]++;
          newTotalReactions++;
        }

        return {
          reactions: newTotalReactions,
          userReaction: reactionType,
          reactionCounts: newReactionCounts,
        };
      });

      return { previousState };
    },
    onError(error, variables, context) {
      queryClient.setQueryData(queryKey, context?.previousState);
      console.error(error);
      toast({
        variant: "destructive",
        description: "Something went wrong. Please try again.",
      });
    },
    onSuccess() {
      setShowPicker(false);
    },
  });

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      setShowPicker(true);
    }, 500); // Show picker after 500ms of holding
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleReactionClick = (reactionType: ReactionType) => {
    if (data.userReaction === reactionType) {
      // Remove reaction if same type is clicked
      mutate(null);
    } else {
      // Add or change reaction
      mutate(reactionType);
    }
  };

  const getCurrentReactionDisplay = () => {
    if (data.userReaction) {
      return {
        emoji: REACTION_EMOJIS[data.userReaction],
        color: REACTION_COLORS[data.userReaction],
      };
    }
    return {
      emoji: REACTION_EMOJIS.LIKE,
      color: "text-gray-500",
    };
  };

  const getTopReactions = () => {
    return Object.entries(data.reactionCounts)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type as ReactionType);
  };

  const topReactions = getTopReactions();
  const hasMultipleReactions = topReactions.length > 1;

  const currentReaction = getCurrentReactionDisplay();

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => handleReactionClick(data.userReaction || "LIKE")}
        onMouseEnter={() => setShowPicker(true)}
        onMouseLeave={() => {
          handleMouseLeave();
          if (!hoveredReaction) setShowPicker(false);
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className={cn("flex items-center gap-2 group", styles.reactionButton)}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-lg transition-transform group-hover:scale-110",
                    data.userReaction ? currentReaction.color : "hover:text-blue-500"
                  )}
                >
                  {hasMultipleReactions ? (
                    <div className="flex -space-x-1">
                      {topReactions.map((type, index) => (
                        <span
                          key={type}
                          className={cn("text-sm", index > 0 && "relative")}
                          style={{ zIndex: topReactions.length - index }}
                        >
                          {REACTION_EMOJIS[type]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    currentReaction.emoji
                  )}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {data.reactions} <span className="hidden sm:inline">reactions</span>
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {Object.entries(data.reactionCounts)
                  .filter(([_, count]) => count > 0)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span>{REACTION_EMOJIS[type as ReactionType]}</span>
                      <span className="text-sm">{count}</span>
                    </div>
                  ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </button>

      {/* Emoji Picker */}
      {showPicker && (
        <div
          ref={pickerRef}
          className={cn(
            "absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 px-3 py-2 flex gap-1 z-50",
            styles.reactionPicker
          )}
          onMouseEnter={() => setShowPicker(true)}
          onMouseLeave={() => setShowPicker(false)}
        >
          {(Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(
            ([type, emoji]) => (
              <button
                key={type}
                onClick={() => handleReactionClick(type)}
                onMouseEnter={() => setHoveredReaction(type)}
                onMouseLeave={() => setHoveredReaction(null)}
                className={cn(
                  "text-2xl p-1 rounded-full",
                  styles.reactionEmoji,
                  data.userReaction === type && "bg-blue-100 dark:bg-blue-900"
                )}
                title={type.toLowerCase()}
              >
                {emoji}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
