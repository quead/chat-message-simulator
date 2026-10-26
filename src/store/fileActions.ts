import type { Message } from "../types/message"
import {
  generateId,
  getNextTimestamp,
  getSelfParticipantId,
  isJsonFile,
  readImageFile,
} from "../utils/helpers"
import { readJsonFile } from "../utils/storage"
import { useConversationStore } from "./conversationStore"
import { toast } from "./toastStore"

export const MESSAGE_IMAGE_MAX_SIZE = 1280

export const undoAction = {
  label: "Undo",
  onClick: () => useConversationStore.getState().undo(),
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

export const importConversationFile = async (file: File) => {
  try {
    const conversation = await readJsonFile(file)
    useConversationStore.getState().loadConversation(conversation)
    toast(`Imported ${conversation.messages.length} messages`, "success", undoAction)
  } catch (error) {
    console.error("Failed to import JSON", error)
    toast(errorMessage(error, "Could not import this file."), "error")
  }
}

// Images dropped onto the app become image messages sent by "you".
export const addImageMessages = async (files: File[]) => {
  const results = await Promise.allSettled(
    files.map((file) => readImageFile(file, MESSAGE_IMAGE_MAX_SIZE)),
  )
  const imageUrls = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []))
  const failed = results.find((result) => result.status === "rejected")
  if (failed) {
    toast(errorMessage(failed.reason, "Some images could not be read."), "error")
  }
  if (!imageUrls.length) return

  const state = useConversationStore.getState()
  const { participants, messages } = state.conversation
  const senderId = getSelfParticipantId(participants, state.activeParticipantId)
  if (!senderId) {
    toast("Add a participant before adding images.", "error")
    return
  }
  const additions: Message[] = []
  imageUrls.forEach((imageUrl) => {
    additions.push({
      id: generateId(),
      senderId,
      content: "",
      imageUrl,
      timestamp: getNextTimestamp([...messages, ...additions]),
      type: "image",
      status: "read",
    })
  })
  state.setMessages([...messages, ...additions])
  state.setUi({ activePanel: "messages" })
  toast(
    additions.length > 1 ? `Added ${additions.length} image messages` : "Added an image message",
    "success",
    undoAction,
  )
}

export const handleDroppedFiles = (files: File[]) => {
  const jsonFile = files.find(isJsonFile)
  if (jsonFile) return importConversationFile(jsonFile)
  const images = files.filter((file) => file.type.startsWith("image/"))
  if (images.length) return addImageMessages(images)
  toast("Drop images or a conversation .json export.", "info")
}
