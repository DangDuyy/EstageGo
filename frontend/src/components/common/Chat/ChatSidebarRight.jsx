import { useRef, useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Bell, Pin, Users as UsersIcon, EyeOff, Trash, X, PanelRightClose } from "lucide-react"
import ConversationMediaPanel from "@/components/common/Chat/ConversationMediaPanel"
import { useSelector } from "react-redux"
import { selectCurrentUser, selectUsersStatus } from "@/redux/user/userSlice"
import { formatTimeAgo } from "@/utils/formatters"

export default function ChatSidebarRight({
  conversation,
  isOpen = false,
  onClose,
  onOpenProfile
}) {
  const panelRef = useRef(null)
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  const usersStatus = useSelector(selectUsersStatus)
  const participants = useMemo(() => conversation?.participants || [], [conversation])
  const [showAllImages, setShowAllImages] = useState(false)
  const [showAllAudio, setShowAllAudio] = useState(false)
  const [showAllFiles, setShowAllFiles] = useState(false)
  const [fullImage, setFullImage] = useState(null)
  const [mediaList, setMediaList] = useState([])
  const [mediaIndex, setMediaIndex] = useState(0)

  // Get other participant's name for 1-on-1 conversations
  const displayName = useMemo(() => {
    if (conversation?.type === 'group') {
      return conversation?.name || 'Group conversation'
    }
    // For 1-on-1, show the other person's name
    const otherParticipant = participants.find(p => p._id !== currentUser?._id)
    return otherParticipant?.fullName || conversation?.displayName || 'Conversation'
  }, [conversation, participants, currentUser])

  const displayAvatar = useMemo(() => {
    if (conversation?.type === 'group') {
      return conversation?.conversationAvatarUrl
    }
    // For 1-on-1, show the other person's avatar
    const otherParticipant = participants.find(p => p._id !== currentUser?._id)
    return otherParticipant?.avatar || conversation?.conversationAvatarUrl
  }, [conversation, participants, currentUser])

  const buttonStyle = "h-full w-full grid place-items-center rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  const contentStyle = "flex flex-col items-center leading-none"
  const textStyle = "text-xs font-medium"

  const getPresence = (participant) => {
    const store = participant?._id ? usersStatus[participant._id] : null
    const isOnline = store?.isOnline ?? participant?.status?.isOnline ?? participant?.isOnline ?? false
    const lastActiveAt = store?.lastActiveAt ?? participant?.status?.lastActiveAt ?? participant?.lastActiveAt ?? null
    let text = 'Offline'
    if (isOnline) text = 'Online'
    else if (lastActiveAt) text = `Online ${formatTimeAgo(lastActiveAt)} ago`
    const tone = isOnline ? 'online' : lastActiveAt ? 'away' : 'offline'
    return { isOnline, text, tone }
  }

  const handleOpenProfile = (p) => {
    if (!p?._id) return
    navigate(`/agents/${p._id}`)
    onOpenProfile?.(p)
  }

  // Click outside handling
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const targetElement = e.target
        // Don't close if clicking dialog, popover or similar
        if (!targetElement.closest("[role='dialog']") && 
            !targetElement.closest("[data-radix-popper-content-wrapper]")) {
          onClose?.()
        }
      }
    }
    
    window.addEventListener("mousedown", handleClickOutside)
    return () => window.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  return (
    <Card
      ref={panelRef}
      className={`absolute top-0 right-0 h-full w-80 shadow-none border-l rounded-none transition-all duration-300 ${
        isOpen ? 'translate-x-0 opacity-100 visible' : 'translate-x-full opacity-0 invisible'
      } flex flex-col overflow-hidden`}
      style={{
        transitionProperty: 'all',
        transitionDuration: '300ms',
        position: 'absolute',
        right: 0,
        top: 0,
        height: '100%',
        width: '320px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b h-18 shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          aria-label="Close sidebar"
        >
          <PanelRightClose size={20} />
        </button>
        <h2 className="text-base font-semibold truncate flex-1 text-center">Conversation information</h2>
        <div className="w-9"></div>
      </div>

      {/* Avatar and quick actions */}
      <div className="p-6 text-center border-b space-y-4">
        <button
          type="button"
          className="group w-fit mx-auto block"
          title="View conversation details"
        >
          <div className="relative w-20 h-20 rounded-full mx-auto ring-0 group-hover:ring-2 group-hover:ring-primary/40 transition">
            {displayAvatar ? (
              <Avatar className="w-20 h-20">
                <AvatarImage src={displayAvatar} />
                <AvatarFallback>{displayName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full grid place-items-center">
                <span className="text-2xl font-bold text-white">{displayName?.[0] || 'U'}</span>
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition grid place-items-center">
              <span className="text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition">View</span>
            </div>
          </div>
        </button>

        <div>
          <h3 className="text-xl font-semibold truncate">{displayName}</h3>
        </div>

        {/* Top 3 quick action buttons */}
        <div className="grid grid-cols-3 gap-4 place-items-center">
          <div className="h-16 w-20 grid place-items-center">
            <button className={buttonStyle}>
              <div className={contentStyle}>
                <Bell size={20} className="mb-1" />
                <span className={textStyle}>Mute</span>
              </div>
            </button>
          </div>
          <div className="h-16 w-20 grid place-items-center">
            <button className={buttonStyle}>
              <div className={contentStyle}>
                <Pin size={20} className="mb-1" />
                <span className={textStyle}>Pin</span>
              </div>
            </button>
          </div>
          <div className="h-16 w-20 grid place-items-center">
            <button className={buttonStyle}>
              <div className={contentStyle}>
                <UsersIcon size={20} className="mb-1" />
                <span className={textStyle}>Add</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Accordions */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <Accordion
          type="multiple"
          defaultValue={["media", "audio", "file", "members", "security"]}
          className="w-full"
        >
          {/* Photos/Videos */}
          <AccordionItem value="media">
            <AccordionTrigger className="text-base p-4 hover:bg-muted/50">Photos/Videos</AccordionTrigger>
            <AccordionContent className="overflow-hidden">
              <div className="px-4">
                {conversation?._id && (
                  <ConversationMediaPanel
                    conversationId={conversation._id}
                    kind="visual"
                    defaultTab="image"
                    pageSize={showAllImages ? 50 : 8}
                    gridCols={3}
                    showTabs={false}
                    showLoadMore={true}
                    onItemsChange={setMediaList}
                    onImageClick={(imageUrl) => {
                      setFullImage(imageUrl)
                      const idx = (mediaList || []).findIndex((m) => m.url === imageUrl)
                      setMediaIndex(idx >= 0 ? idx : 0)
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setShowAllImages((v) => !v)}
                  className="block w-full h-10 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium mt-3 mb-4 transition-colors"
                >
                  {showAllImages ? 'Show less' : 'View all'}
                </button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Audio */}
          <AccordionItem value="audio">
            <AccordionTrigger className="text-base p-4 hover:bg-muted/50">Audio</AccordionTrigger>
            <AccordionContent className="overflow-hidden">
              <div className="px-4">
                {conversation?._id && (
                  <ConversationMediaPanel
                    conversationId={conversation._id}
                    kind="binary"
                    onlyTab="audio"
                    defaultTab="audio"
                    pageSize={4}
                    showTabs={false}
                    showLoadMore={showAllAudio}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setShowAllAudio((v) => !v)}
                  className="block w-full h-10 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium mt-3 mb-4 transition-colors"
                >
                  {showAllAudio ? 'Show less' : 'View all'}
                </button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Files */}
          <AccordionItem value="file">
            <AccordionTrigger className="text-base p-4 hover:bg-muted/50">Files</AccordionTrigger>
            <AccordionContent className="overflow-hidden">
              <div className="px-4">
                {conversation?._id && (
                  <ConversationMediaPanel
                    conversationId={conversation._id}
                    kind="binary"
                    onlyTab="file"
                    defaultTab="file"
                    pageSize={3}
                    showTabs={false}
                    showLoadMore={showAllFiles}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setShowAllFiles((v) => !v)}
                  className="block w-full h-10 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium mt-3 mb-4 transition-colors"
                >
                  {showAllFiles ? 'Show less' : 'View all'}
                </button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Members */}
          <AccordionItem value="members">
            <AccordionTrigger className="text-base p-4 hover:bg-muted/50">Members</AccordionTrigger>
            <AccordionContent className="overflow-hidden">
              <div className="px-4 pb-4 space-y-2">
                {participants.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4">No participants</div>
                ) : (
                  participants.map((p) => {
                    const name = p?.fullName || p?.userName || 'User'
                    const initial = (name?.[0] || 'U').toUpperCase()
                    const presence = getPresence(p)
                    return (
                      <div
                        key={p?._id}
                        className="group flex items-start gap-3 p-2 rounded-lg hover:bg-muted/60 cursor-pointer transition"
                        onClick={() => handleOpenProfile(p)}
                      >
                        <div className="relative w-8 h-8 shrink-0">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={p?.avatar} />
                            <AvatarFallback>{initial}</AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${
                              presence.tone === 'online'
                                ? 'bg-emerald-500'
                                : presence.tone === 'away'
                                  ? 'bg-amber-500'
                                  : 'bg-gray-400'
                            }`}
                            aria-hidden
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{name}</div>
                          <div
                            className={`text-xs ${
                              presence.tone === 'online'
                                ? 'text-green-600'
                                : presence.tone === 'away'
                                  ? 'text-amber-600'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {presence.text}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Security */}
          <AccordionItem value="security">
            <AccordionTrigger className="text-base p-4 hover:bg-muted/50">Security settings</AccordionTrigger>
            <AccordionContent className="overflow-hidden">
              <div className="px-4 pb-4 space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <EyeOff size={18} />
                    <span className="text-sm font-medium">Hide conversation</span>
                  </div>
                  <Switch />
                </div>

                <button
                  type="button"
                  className="w-full flex items-center gap-2 text-destructive p-2 rounded hover:bg-destructive/10 transition"
                  onClick={() => {
                    if (window.confirm('Delete this conversation? This action cannot be undone.')) {
                      // Call delete API here
                    }
                  }}
                >
                  <Trash size={18} />
                  <span className="text-sm font-medium">Delete conversation</span>
                </button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>

      {/* Full Image Viewer */}
      <Dialog open={!!fullImage} onOpenChange={() => setFullImage(null)}>
        <DialogContent unconstrained className="w-[90vw] max-w-[1920px] p-0 overflow-hidden bg-black text-white border-0">
          <div className="flex h-[92vh]">
            <div className="flex-[3] bg-black grid place-items-center relative">
              <button
                onClick={() => setFullImage(null)}
                className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
              >
                <X size={20} />
              </button>
              {fullImage && (
                <img
                  src={fullImage}
                  alt="Full view"
                  className="max-h-[88vh] max-w-full object-contain"
                />
              )}
            </div>
            <div className="w-72 border-l border-white/10 bg-black/90">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-3">
                  {(mediaList || []).map((m, idx) => (
                    <button
                      key={`${m.url}-${idx}`}
                      onClick={() => {
                        setFullImage(m.url)
                        setMediaIndex(idx)
                      }}
                      className={`block w-full border rounded-md overflow-hidden ${
                        idx === mediaIndex ? 'border-primary' : 'border-transparent hover:border-white/40'
                      }`}
                    >
                      <img
                        src={m.url}
                        alt={m.filename || 'thumb'}
                        className="w-full h-28 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
