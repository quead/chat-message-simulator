import { useRef, useState } from "react"
import { Camera, ImageOff, MoreVertical, Trash2, UserPlus, UserRound } from "lucide-react"
import type { Participant, ParticipantStatus } from "@/types/conversation"
import { useConversationStore } from "@/store/conversationStore"
import { undoAction } from "@/store/fileActions"
import { toast } from "@/store/toastStore"
import { useFileDrop } from "@/hooks/useFileDrop"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { ParticipantAvatar } from "@/components/ui/participant-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/utils/cn"
import { getSelfParticipantId, readImageFile } from "@/utils/helpers"

const AVATAR_MAX_SIZE = 256
const palette = ["#6366f1", "#22c55e", "#0b84ff", "#f97316", "#ec4899", "#14b8a6", "#eab308", "#8b5cf6"]

const AvatarUpload = ({
  participant,
  onChange,
}: {
  participant: Participant
  onChange: (avatarUrl: string) => void
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const upload = async (file: File) => {
    try {
      onChange(await readImageFile(file, AVATAR_MAX_SIZE))
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not read the image.", "error")
    }
  }
  const { isOver, dropProps } = useFileDrop((files) => {
    const image = files.find((file) => file.type.startsWith("image/"))
    if (image) void upload(image)
  })

  return (
    <div className="relative shrink-0" {...dropProps}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group/avatar relative block rounded-full transition focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:outline-none",
          isOver && "ring-2 ring-indigo-500 ring-offset-2",
        )}
        aria-label={`Change avatar for ${participant.name || "this person"}`}
        title="Click or drop an image"
      >
        <ParticipantAvatar participant={participant} className="h-14 w-14 text-base" />
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/50 text-white opacity-0 transition group-hover/avatar:opacity-100",
            isOver && "opacity-100",
          )}
        >
          <Camera className="h-4 w-4" />
        </span>
      </button>
      {participant.isVerified ? (
        <span className="pointer-events-none absolute -right-0.5 -bottom-0.5 rounded-full bg-white p-0.5 shadow">
          <VerifiedBadge className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) void upload(file)
        }}
      />
    </div>
  )
}

export const ParticipantManager = () => {
  const participants = useConversationStore((state) => state.conversation.participants)
  const groupName = useConversationStore((state) => state.conversation.groupName)
  const activeParticipantId = useConversationStore((state) => state.activeParticipantId)
  const addParticipant = useConversationStore((state) => state.addParticipant)
  const updateParticipant = useConversationStore((state) => state.updateParticipant)
  const removeParticipant = useConversationStore((state) => state.removeParticipant)
  const setActiveParticipant = useConversationStore((state) => state.setActiveParticipant)
  const setGroupName = useConversationStore((state) => state.setGroupName)
  const [newName, setNewName] = useState("")
  const selfId = getSelfParticipantId(participants, activeParticipantId)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-base font-semibold text-slate-900">People</h2>
        <p className="text-xs text-slate-500">
          Messages from the person marked <span className="font-semibold">You</span> appear on the
          sending side. Click or drop an image on an avatar to change it.
        </p>
      </div>

      {participants.length > 2 ? (
        <div className="space-y-1.5">
          <Label htmlFor="group-name" className="text-xs text-slate-500">
            Group name
          </Label>
          <Input
            id="group-name"
            value={groupName ?? ""}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Group Chat"
          />
        </div>
      ) : null}

      <div className="space-y-2.5">
        {participants.map((participant) => {
          const isSelf = participant.id === selfId
          return (
            <div
              key={participant.id}
              className={cn(
                "rounded-xl border bg-white p-3 shadow-sm transition",
                isSelf ? "border-indigo-200 ring-1 ring-indigo-100" : "border-slate-200",
              )}
            >
              <div className="flex items-start gap-3">
                <AvatarUpload
                  participant={participant}
                  onChange={(avatarUrl) => updateParticipant(participant.id, { avatarUrl })}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={participant.name}
                      onChange={(event) =>
                        updateParticipant(participant.id, { name: event.target.value })
                      }
                      placeholder="Name"
                      aria-label="Name"
                      className="h-9 font-medium"
                    />
                    <label
                      className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 shadow-sm"
                      style={{ backgroundColor: participant.color }}
                      title="Color (used for initials and group names)"
                    >
                      <input
                        type="color"
                        value={participant.color}
                        onChange={(event) =>
                          updateParticipant(participant.id, { color: event.target.value })
                        }
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label="Color"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Select
                      value={participant.status}
                      onValueChange={(value) =>
                        updateParticipant(participant.id, { status: value as ParticipantStatus })
                      }
                    >
                      <SelectTrigger className="h-8 w-[128px] text-xs" aria-label="Status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="typing">Typing…</SelectItem>
                        <SelectItem value="empty">No status</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <Switch
                        className="h-5 w-9"
                        thumbClassName="h-4 w-4 data-[state=checked]:translate-x-4"
                        checked={Boolean(participant.isVerified)}
                        onCheckedChange={(value) =>
                          updateParticipant(participant.id, { isVerified: value })
                        }
                      />
                      Verified
                    </label>
                    {isSelf ? (
                      <span className="ml-auto rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        You
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="ml-auto text-slate-500"
                        onClick={() => setActiveParticipant(participant.id)}
                      >
                        <UserRound className="h-3.5 w-3.5" />
                        Set as you
                      </Button>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-1" aria-label="Person actions">
                      <MoreVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      disabled={!participant.avatarUrl}
                      onSelect={() => updateParticipant(participant.id, { avatarUrl: undefined })}
                    >
                      <ImageOff />
                      Remove avatar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      destructive
                      onSelect={() => {
                        removeParticipant(participant.id)
                        toast(
                          `Removed ${participant.name || "person"} and their messages`,
                          "info",
                          undoAction,
                        )
                      }}
                    >
                      <Trash2 />
                      Remove person
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>

      <form
        className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 p-1.5 pl-3 transition focus-within:border-indigo-400"
        onSubmit={(event) => {
          event.preventDefault()
          const name = newName.trim()
          if (!name) return
          const usedColors = new Set(participants.map((participant) => participant.color))
          addParticipant({
            name,
            status: "online",
            color: palette.find((color) => !usedColors.has(color)) ?? palette[participants.length % palette.length],
          })
          setNewName("")
        }}
      >
        <UserPlus className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Add a person…"
          aria-label="New person name"
          className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        <Button type="submit" size="xs" className="h-8 px-3" disabled={!newName.trim()}>
          Add
        </Button>
      </form>
      {participants.length === 2 ? (
        <p className="text-center text-[11px] text-slate-400">Add a third person to turn this into a group chat.</p>
      ) : null}
    </div>
  )
}
