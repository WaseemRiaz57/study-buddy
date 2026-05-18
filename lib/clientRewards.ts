"use client";

import { showRewardToast } from "@/components/gamification/RewardToast";
import { useGamificationStore } from "@/store/useGamificationStore";

export type ClientRewardAction = "quiz_completed" | "forum_posted" | "note_generated";

const clientRewardMap: Record<ClientRewardAction, { xp: number; coins: number; title: string }> = {
  quiz_completed: { xp: 25, coins: 5, title: "Quiz Completed!" },
  forum_posted: { xp: 10, coins: 2, title: "Forum Post Published!" },
  note_generated: { xp: 10, coins: 5, title: "Generation Successful!" },
};

export async function syncGamificationReward(action: ClientRewardAction) {
  const reward = clientRewardMap[action];

  useGamificationStore.getState().addReward(reward.xp, reward.coins);
  await useGamificationStore.getState().refresh();
  showRewardToast(reward);
  window.dispatchEvent(new Event("gamification-stats-updated"));
}
