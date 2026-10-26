import type { Participant } from "@/types/conversation"
import { cn } from "@/utils/cn"
import { getInitials } from "@/utils/helpers"

interface ParticipantAvatarProps {
  participant: Pick<Participant, "name" | "avatarUrl" | "color">
  className?: string
}

export const ParticipantAvatar = ({ participant, className }: ParticipantAvatarProps) =>
  participant.avatarUrl ? (
    <img
      src={participant.avatarUrl}
      alt=""
      className={cn("h-8 w-8 shrink-0 rounded-full object-cover", className)}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white",
        className,
      )}
      style={{ backgroundColor: participant.color }}
    >
      {getInitials(participant.name)}
    </span>
  )
