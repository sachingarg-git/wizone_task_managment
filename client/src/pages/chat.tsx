import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Plus, Users, Send, Hash, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
  participants?: Array<{
    id: number;
    userId: string;
    role: string;
    user: User;
  }>;
}

interface ChatMessage {
  id: number;
  roomId: number;
  senderId: string;
  content: string;
  messageType: string;
  createdAt: string;
  sender: User;
}

export default function Chat() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch chat rooms
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/chat/rooms"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch messages for selected room
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/chat/rooms", selectedRoom?.id, "messages"],
    enabled: !!selectedRoom,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (roomData: { name: string; description?: string; isPrivate: boolean }) => {
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomData),
      });
      if (!response.ok) throw new Error("Failed to create room");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      setIsCreateRoomOpen(false);
      toast({ title: "Room created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create room", variant: "destructive" });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string }) => {
      const response = await fetch(`/api/chat/rooms/${selectedRoom?.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/chat/rooms", selectedRoom?.id, "messages"] 
      });
      setMessageText("");
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await fetch(`/api/chat/rooms/${roomId}/join`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to join room");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      toast({ title: "Joined room successfully" });
    },
    onError: () => {
      toast({ title: "Failed to join room", variant: "destructive" });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedRoom) return;
    sendMessageMutation.mutate({ content: messageText });
  };

  const handleCreateRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const isPrivate = formData.get("isPrivate") === "on";

    if (!name.trim()) return;

    createRoomMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      isPrivate,
    });
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "?";
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <div className="p-6 min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Engineer Chat</h1>
          <p className="text-slate-400">Internal communication for engineering teams</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Rooms Sidebar */}
          <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat Rooms
                </CardTitle>
                <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create New Room</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateRoom} className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-white">Room Name</Label>
                        <Input
                          id="name"
                          name="name"
                          required
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Enter room name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description" className="text-white">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="isPrivate" name="isPrivate" />
                        <Label htmlFor="isPrivate" className="text-white">Private Room</Label>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-cyan-600 hover:bg-cyan-700"
                        disabled={createRoomMutation.isPending}
                      >
                        {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {roomsLoading ? (
                  <div className="p-4 text-slate-400">Loading rooms...</div>
                ) : rooms.length === 0 ? (
                  <div className="p-4 text-slate-400">No rooms available</div>
                ) : (
                  <div className="space-y-1 p-2">
                    {rooms.map((room: ChatRoom) => (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedRoom?.id === room.id
                            ? "bg-cyan-600/20 border border-cyan-600/30"
                            : "hover:bg-slate-700/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {room.isPrivate ? (
                            <Lock className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Hash className="h-4 w-4 text-slate-400" />
                          )}
                          <span className="font-medium text-white truncate">{room.name}</span>
                        </div>
                        {room.description && (
                          <p className="text-xs text-slate-400 truncate">{room.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <Users className="h-3 w-3 text-slate-400" />
                          <span className="text-xs text-slate-400">
                            {room.participants?.length || 0} members
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 bg-slate-800/50 border-slate-700 flex flex-col">
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        {selectedRoom.isPrivate ? (
                          <Lock className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <Hash className="h-5 w-5 text-slate-400" />
                        )}
                        {selectedRoom.name}
                      </CardTitle>
                      {selectedRoom.description && (
                        <p className="text-sm text-slate-400 mt-1">{selectedRoom.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-slate-300 border-slate-600">
                      <Users className="h-3 w-3 mr-1" />
                      {selectedRoom.participants?.length || 0}
                    </Badge>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-[400px] p-4">
                    {messagesLoading ? (
                      <div className="text-slate-400">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-slate-400 text-center mt-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message: ChatMessage) => (
                          <div key={message.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-cyan-600 text-white text-xs">
                                {getInitials(message.sender?.firstName, message.sender?.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white">
                                  {message.sender?.firstName || "Unknown"} {message.sender?.lastName || "User"}
                                </span>
                                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                  {message.sender.role}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                  {formatTime(message.createdAt)}
                                </span>
                              </div>
                              <p className="text-slate-200 text-sm leading-relaxed">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-700">
                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={`Message #${selectedRoom.name}`}
                      className="flex-1 bg-slate-700 border-slate-600 text-white"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a chat room</h3>
                  <p>Choose a room from the sidebar to start chatting</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}